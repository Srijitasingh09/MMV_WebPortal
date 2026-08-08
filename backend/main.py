import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import Optional, List
from datetime import datetime
import os
import json
import shutil
import uuid
from dotenv import load_dotenv
load_dotenv()

# Allowed file types and size limit
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_PDF_TYPES = {"application/pdf"}
MAX_UPLOAD_MB = 50
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

async def validate_upload(file: UploadFile, allowed_types: set):
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' is not allowed."
        )
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File is too large. Maximum size is {MAX_UPLOAD_MB}MB."
        )
    await file.seek(0)
    return contents

import models, database, auth
from database import engine, get_db
from chat_index import (
    sync_facility_content_by_id,
    sync_notice_by_id,
    delete_chunks_for,
    voyage_client,
    EMBED_MODEL,
)

# Create tables
models.Base.metadata.create_all(bind=engine)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
INFO_DIR = os.path.join(PROJECT_ROOT, "info")
MMV_KNOWLEDGE_FILE = os.path.join(INFO_DIR, "mmv_knowledge.json")


def ensure_mmv_knowledge_file():
    os.makedirs(INFO_DIR, exist_ok=True)
    if not os.path.exists(MMV_KNOWLEDGE_FILE):
        with open(MMV_KNOWLEDGE_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)


def _normalize_tags(value):
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [t.strip() for t in value.split(",") if t.strip()]
    return []


def load_mmv_chat_knowledge():
    ensure_mmv_knowledge_file()
    try:
        with open(MMV_KNOWLEDGE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(data, list):
        return []
    cleaned = []
    for item in data:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        description = str(item.get("description") or "").strip()
        if not title or not description:
            continue
        cleaned.append({
            "id": str(item.get("id") or f"mmv-knowledge-{uuid.uuid4().hex[:8]}"),
            "type": str(item.get("type") or "Notice"),
            "title": title,
            "description": description,
            "contact": str(item.get("contact") or ""),
            "tags": _normalize_tags(item.get("tags")),
        })
    return cleaned


def save_mmv_chat_knowledge(entries):
    ensure_mmv_knowledge_file()
    with open(MMV_KNOWLEDGE_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def ensure_notice_attachment_columns():
    with engine.connect() as conn:
        column_rows = conn.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'notices'"
        )).fetchall()
        columns = {row[0] for row in column_rows}
        if "attachment_url" not in columns:
            conn.execute(text("ALTER TABLE notices ADD COLUMN attachment_url VARCHAR"))
        if "attachment_name" not in columns:
            conn.execute(text("ALTER TABLE notices ADD COLUMN attachment_name VARCHAR"))
        conn.commit()


def ensure_college_info_columns():
    with engine.connect() as conn:
        column_rows = conn.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'college_info_items'"
        )).fetchall()
        columns = {row[0] for row in column_rows}
        if "display_order" not in columns:
            conn.execute(text("ALTER TABLE college_info_items ADD COLUMN display_order INTEGER DEFAULT 0"))
        conn.execute(text("UPDATE college_info_items SET display_order = id WHERE display_order IS NULL OR display_order = 0"))
        conn.commit()


def ensure_facility_content_table():
    models.Base.metadata.create_all(bind=engine, tables=[
        models.FacilityContent.__table__,
        models.FacilityContentPhoto.__table__,
        models.FacilityContentPdf.__table__,
    ], checkfirst=True)

def ensure_emergency_contacts_table():
    models.Base.metadata.create_all(bind=engine, tables=[
        models.EmergencyContact.__table__,
    ], checkfirst=True)
 

ensure_emergency_contacts_table() 
ensure_notice_attachment_columns()
ensure_college_info_columns()
ensure_mmv_knowledge_file()
ensure_facility_content_table()

app = FastAPI(title="MMV WebPortal")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") 

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def ensure_admin(user: models.User):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")


# ===================== AUTH =====================

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": user.is_admin,
        "full_name": user.full_name,
    }

# ====================contacts=======================

@app.get("/contact-info")
def get_contact_info(db: Session = Depends(get_db)):
    """
    Public route — returns the single contact info row.
    If none exists yet, returns an empty-ish object so the
    frontend can render its 'not added yet' state gracefully.
    """
    info = db.query(models.ContactInfo).first()
    if not info:
        return {
            "id": 0,
            "address": None,
            "phone": None,
            "email": None,
            "office_hours": None,
            "map_embed_url": None,
        }
    return info
 
 
@app.put("/admin/contact-info")
def update_contact_info(
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Admin-only route — creates the row if it doesn't exist yet,
    otherwise updates the existing one (upsert pattern, since
    there should only ever be ONE contact info row).
    """
    ensure_admin(user)
 
    info = db.query(models.ContactInfo).first()
    if not info:
        info = models.ContactInfo()
        db.add(info)
 
    for field in ["address", "phone", "email", "office_hours", "map_embed_url"]:
        if field in payload:
            setattr(info, field, payload[field])
 
    db.commit()
    db.refresh(info)
    return info
 
# ===================== NOTICES =====================

@app.get("/notices")
def get_notices(db: Session = Depends(get_db)):
    return db.query(models.Notice).order_by(models.Notice.created_at.desc()).all()


@app.post("/admin/notice")
async def add_notice(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form("General"),
    attachment: UploadFile = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)

    attachment_url = None
    attachment_name = None
    if attachment and attachment.filename:
        await validate_upload(attachment, ALLOWED_PDF_TYPES)
        safe_name = attachment.filename.replace(" ", "_")
        unique_name = f"{uuid.uuid4().hex}_{safe_name}"
        file_path = os.path.join(UPLOADS_DIR, unique_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(attachment.file, buffer)
        attachment_url = f"/uploads/{unique_name}"
        attachment_name = attachment.filename

    new_notice = models.Notice(
        title=title,
        content=content,
        category=category,
        attachment_url=attachment_url,
        attachment_name=attachment_name,
    )
    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)
    background_tasks.add_task(sync_notice_by_id, new_notice.id)
    return new_notice

@app.delete("/admin/notice/{notice_id}")
def delete_notice(
    notice_id: int,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ensure_admin(user)
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    if notice.attachment_url:
        stored_name = os.path.basename(notice.attachment_url)
        stored_path = os.path.join(UPLOADS_DIR, stored_name)
        if os.path.exists(stored_path):
            os.remove(stored_path)
    db.delete(notice)
    db.commit()
    background_tasks.add_task(delete_chunks_for, "notices", notice_id)
    return {"message": "Notice deleted"}

# ================emergency contact=======================

@app.get("/emergency-contacts")
def get_emergency_contacts(db: Session = Depends(get_db)):
    """
    Public route — returns all emergency contact entries ordered by display_order.
    Frontend groups them by group_name to build the three cards.
    """
    contacts = (
        db.query(models.EmergencyContact)
        .order_by(models.EmergencyContact.display_order)
        .all()
    )
    return contacts
 
 
@app.post("/admin/emergency-contacts")
def add_emergency_contact(
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin-only — add a new emergency contact entry."""
    ensure_admin(user)
 
    # Auto-set display_order to max+1 so new entries go to the bottom
    max_order = db.query(func.max(models.EmergencyContact.display_order)).scalar() or 0
 
    entry = models.EmergencyContact(
        label=payload.get("label", "").strip(),
        value=payload.get("value", "").strip(),
        type=payload.get("type", "phone"),           # "phone" | "email" | "address"
        group_name=payload.get("group_name", "").strip(),
        display_order=max_order + 1,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
 
 
@app.put("/admin/emergency-contacts/{entry_id}")
def update_emergency_contact(
    entry_id: int,
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin-only — update an existing emergency contact entry."""
    ensure_admin(user)
 
    entry = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == entry_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
 
    for field in ["label", "value", "type", "group_name", "display_order"]:
        if field in payload:
            setattr(entry, field, payload[field])
 
    db.commit()
    db.refresh(entry)
    return entry
 
 
@app.delete("/admin/emergency-contacts/{entry_id}")
def delete_emergency_contact(
    entry_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin-only — delete an emergency contact entry."""
    ensure_admin(user)
 
    entry = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == entry_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
 
    db.delete(entry)
    db.commit()
    return {"message": "Deleted"}

# ===================== COLLEGE INFO =====================

@app.get("/college-info")
def get_college_info(db: Session = Depends(get_db)):
    return db.query(models.CollegeInfoItem).order_by(
        models.CollegeInfoItem.display_order, models.CollegeInfoItem.created_at.desc()
    ).all()


@app.post("/admin/college-info")
async def add_college_info(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form("General"),
    image: UploadFile = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)

    image_url = None
    image_name = None
    if image and image.filename:
        await validate_upload(image, ALLOWED_IMAGE_TYPES)
        safe_name = image.filename.replace(" ", "_")
        unique_name = f"{uuid.uuid4().hex}_{safe_name}"
        file_path = os.path.join(UPLOADS_DIR, unique_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/uploads/{unique_name}"
        image_name = image.filename

    max_order = db.query(func.max(models.CollegeInfoItem.display_order)).scalar() or 0

    entry = models.CollegeInfoItem(
        title=title,
        description=description,
        category=category,
        image_url=image_url,
        image_name=image_name,
        display_order=max_order + 1,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@app.put("/admin/college-info/{entry_id}")
def update_college_info(entry_id: int, update_data: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.CollegeInfoItem).filter(models.CollegeInfoItem.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="College info entry not found")

    for key, value in update_data.items():
        if key in ["title", "description", "category"] and value is not None:
            setattr(entry, key, value)

    db.commit()
    db.refresh(entry)
    return entry


@app.delete("/admin/college-info/{entry_id}")
def delete_college_info(entry_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.CollegeInfoItem).filter(models.CollegeInfoItem.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="College info entry not found")

    if entry.image_url:
        stored_name = os.path.basename(entry.image_url)
        stored_path = os.path.join(UPLOADS_DIR, stored_name)
        if os.path.exists(stored_path):
            os.remove(stored_path)

    db.delete(entry)
    db.commit()
    return {"message": "College info entry removed"}


@app.put("/admin/college-info/reorder-items")
def reorder_college_info(payload: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    ordered_ids = payload.get("ordered_ids") or []
    if not ordered_ids:
        raise HTTPException(status_code=400, detail="ordered_ids is required")

    entries = db.query(models.CollegeInfoItem).filter(models.CollegeInfoItem.id.in_(ordered_ids)).all()
    existing_ids = {entry.id for entry in entries}

    for idx, entry_id in enumerate(ordered_ids, start=1):
        if entry_id not in existing_ids:
            continue
        db.query(models.CollegeInfoItem).filter(models.CollegeInfoItem.id == entry_id).update({"display_order": idx})

    db.commit()
    return {"message": "College info reordered"}


# ===================== MMV KNOWLEDGE =====================

@app.get("/admin/mmv-knowledge")
def get_mmv_knowledge_for_admin(user: models.User = Depends(get_current_user)):
    ensure_admin(user)
    return load_mmv_chat_knowledge()


@app.post("/admin/mmv-knowledge")
def add_mmv_knowledge_entry(payload: dict, user: models.User = Depends(get_current_user)):
    ensure_admin(user)
    title = str(payload.get("title") or "").strip()
    description = str(payload.get("description") or "").strip()
    if not title or not description:
        raise HTTPException(status_code=400, detail="title and description are required")

    entries = load_mmv_chat_knowledge()
    entry = {
        "id": str(payload.get("id") or f"mmv-knowledge-{uuid.uuid4().hex[:8]}"),
        "type": str(payload.get("type") or "Notice").strip() or "Notice",
        "title": title,
        "description": description,
        "contact": str(payload.get("contact") or "").strip(),
        "tags": _normalize_tags(payload.get("tags")),
    }
    entries.append(entry)
    save_mmv_chat_knowledge(entries)
    return entry


@app.put("/admin/mmv-knowledge/{entry_id}")
def update_mmv_knowledge_entry(entry_id: str, payload: dict, user: models.User = Depends(get_current_user)):
    ensure_admin(user)
    entries = load_mmv_chat_knowledge()

    updated = None
    for item in entries:
        if item.get("id") != entry_id:
            continue
        if "type" in payload:
            item["type"] = str(payload.get("type") or "Notice").strip() or "Notice"
        if "title" in payload:
            item["title"] = str(payload.get("title") or "").strip()
        if "description" in payload:
            item["description"] = str(payload.get("description") or "").strip()
        if "contact" in payload:
            item["contact"] = str(payload.get("contact") or "").strip()
        if "tags" in payload:
            item["tags"] = _normalize_tags(payload.get("tags"))
        if not item.get("title") or not item.get("description"):
            raise HTTPException(status_code=400, detail="title and description are required")
        updated = item
        break

    if not updated:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")

    save_mmv_chat_knowledge(entries)
    return updated


@app.delete("/admin/mmv-knowledge/{entry_id}")
def delete_mmv_knowledge_entry(entry_id: str, user: models.User = Depends(get_current_user)):
    ensure_admin(user)
    entries = load_mmv_chat_knowledge()
    filtered = [item for item in entries if item.get("id") != entry_id]
    if len(filtered) == len(entries):
        raise HTTPException(status_code=404, detail="Knowledge entry not found")
    save_mmv_chat_knowledge(filtered)
    return {"message": "Knowledge entry removed"}


# ===================== ADMINISTRATION (via GenericContentPage-like flow) =====================

@app.get("/administration")
def get_administration_sections(db: Session = Depends(get_db)):
    return db.query(models.AdministrationSection).all()


@app.put("/admin/administration")
def update_administration_section(payload: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    section_name = payload.get("section_name")
    sub_section = payload.get("sub_section")
    description = payload.get("description")

    if not section_name:
        raise HTTPException(status_code=400, detail="section_name is required")

    section = db.query(models.AdministrationSection).filter(
        models.AdministrationSection.section_name == section_name,
        models.AdministrationSection.sub_section == sub_section
    ).first()

    if not section:
        section = models.AdministrationSection(
            section_name=section_name, sub_section=sub_section, description=description
        )
        db.add(section)
    else:
        if description is not None:
            section.description = description

    db.commit()
    db.refresh(section)
    return section


@app.post("/admin/administration/upload-photo")
async def upload_administration_photo(
    section_name: str = Form(...),
    sub_section: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ensure_admin(user)

    section = db.query(models.AdministrationSection).filter(
        models.AdministrationSection.section_name == section_name,
        models.AdministrationSection.sub_section == sub_section
    ).first()

    if not section:
        section = models.AdministrationSection(section_name=section_name, sub_section=sub_section, description="")
        db.add(section)
        db.commit()
        db.refresh(section)

    try:
        if section.image_url:
            old_filename = os.path.basename(section.image_url)
            old_filepath = os.path.join(UPLOADS_DIR, old_filename)
            if os.path.exists(old_filepath):
                os.remove(old_filepath)

        file_url, file_name = None, None
        for file in files:
            await validate_upload(file, ALLOWED_IMAGE_TYPES)
            filename = f"admin_{uuid.uuid4().hex}_{file.filename}"
            filepath = os.path.join(UPLOADS_DIR, filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_url = f"/uploads/{filename}"
            file_name = file.filename

        section.image_url = file_url
        section.image_name = file_name
        db.commit()
        db.refresh(section)

        return {"message": "Photo uploaded successfully", "image_url": file_url, "image_name": file_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================== ACADEMICS =====================

@app.get("/academics/nep")
def get_nep(db: Session = Depends(get_db)):
    nep = db.query(models.AcademicNEP).first()
    if not nep:
        return {"description": "", "pdf_url": None, "pdf_name": None}
    return nep


@app.post("/academics/nep")
def update_nep(payload: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    nep = db.query(models.AcademicNEP).first()
    if not nep:
        nep = models.AcademicNEP(description=payload.get("description", ""))
        db.add(nep)
    else:
        nep.description = payload.get("description", "")
    db.commit()
    db.refresh(nep)
    return nep


@app.post("/academics/nep/upload")
async def upload_nep_pdf(file: UploadFile = File(...), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    nep = db.query(models.AcademicNEP).first()
    if not nep:
        nep = models.AcademicNEP(description="")
        db.add(nep)
        db.commit()
        db.refresh(nep)

    if nep.pdf_url:
        old_filename = os.path.basename(nep.pdf_url)
        old_filepath = os.path.join(UPLOADS_DIR, old_filename)
        if os.path.exists(old_filepath):
            os.remove(old_filepath)

    await validate_upload(file, ALLOWED_IMAGE_TYPES)
    filename = f"nep_{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    nep.pdf_url = f"/uploads/{filename}"
    nep.pdf_name = file.filename
    db.commit()
    db.refresh(nep)
    return {"message": "PDF uploaded successfully", "pdf_url": nep.pdf_url, "pdf_name": nep.pdf_name}


@app.delete("/academics/nep/upload")
def delete_nep_pdf(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    nep = db.query(models.AcademicNEP).first()
    if nep and nep.pdf_url:
        old_filename = os.path.basename(nep.pdf_url)
        old_filepath = os.path.join(UPLOADS_DIR, old_filename)
        if os.path.exists(old_filepath):
            os.remove(old_filepath)
        nep.pdf_url = None
        nep.pdf_name = None
        db.commit()
    return {"message": "PDF deleted successfully"}


@app.get("/academics/syllabus/{category}")
def get_syllabus(category: str, db: Session = Depends(get_db)):
    return db.query(models.AcademicSyllabus).filter(models.AcademicSyllabus.category == category).all()


@app.post("/academics/syllabus/{category}/upload")
async def upload_syllabus_pdf(category: str, file: UploadFile = File(...), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    await validate_upload(file, ALLOWED_PDF_TYPES)
    filename = f"syllabus_{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    syl = models.AcademicSyllabus(category=category, pdf_url=f"/uploads/{filename}", pdf_name=file.filename)
    db.add(syl)
    db.commit()
    db.refresh(syl)
    return {"message": "PDF uploaded successfully"}


@app.delete("/academics/syllabus/{item_id}")
def delete_syllabus_pdf(item_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    syl = db.query(models.AcademicSyllabus).filter(models.AcademicSyllabus.id == item_id).first()
    if syl:
        if syl.pdf_url:
            old_filename = os.path.basename(syl.pdf_url)
            old_filepath = os.path.join(UPLOADS_DIR, old_filename)
            if os.path.exists(old_filepath):
                os.remove(old_filepath)
        db.delete(syl)
        db.commit()
    return {"message": "Deleted successfully"}


@app.get("/academics/electives/{category}")
def get_electives(category: str, db: Session = Depends(get_db)):
    return db.query(models.AcademicElective).filter(models.AcademicElective.category == category).all()


@app.post("/academics/electives/{category}/upload")
async def upload_elective_pdf(category: str, file: UploadFile = File(...), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    await validate_upload(file, ALLOWED_PDF_TYPES)
    filename = f"elective_{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    elec = models.AcademicElective(category=category, pdf_url=f"/uploads/{filename}", pdf_name=file.filename)
    db.add(elec)
    db.commit()
    db.refresh(elec)
    return {"message": "PDF uploaded successfully"}


@app.delete("/academics/electives/{item_id}")
def delete_elective_pdf(item_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    elec = db.query(models.AcademicElective).filter(models.AcademicElective.id == item_id).first()
    if elec:
        if elec.pdf_url:
            old_filename = os.path.basename(elec.pdf_url)
            old_filepath = os.path.join(UPLOADS_DIR, old_filename)
            if os.path.exists(old_filepath):
                os.remove(old_filepath)
        db.delete(elec)
        db.commit()
    return {"message": "Deleted successfully"}


@app.get("/academics/section-incharge/{category}")
def get_section_incharge(category: str, db: Session = Depends(get_db)):
    inc = db.query(models.AcademicSectionIncharge).filter(models.AcademicSectionIncharge.category == category).first()
    if not inc:
        return {"category": category, "description": "", "details": ""}
    return inc


@app.post("/academics/section-incharge/{category}")
def update_section_incharge(category: str, payload: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    inc = db.query(models.AcademicSectionIncharge).filter(models.AcademicSectionIncharge.category == category).first()
    if not inc:
        inc = models.AcademicSectionIncharge(
            category=category, description=payload.get("description", ""), details=payload.get("details", "")
        )
        db.add(inc)
    else:
        inc.description = payload.get("description", "")
        inc.details = payload.get("details", "")
    db.commit()
    db.refresh(inc)
    return inc


@app.get("/academics/swayam")
def get_swayam(db: Session = Depends(get_db)):
    swayam = db.query(models.AcademicSwayamCourse).first()
    if not swayam:
        return {"description": ""}
    return swayam


@app.post("/academics/swayam")
def update_swayam(payload: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    swayam = db.query(models.AcademicSwayamCourse).first()
    if not swayam:
        swayam = models.AcademicSwayamCourse(description=payload.get("description", ""))
        db.add(swayam)
    else:
        swayam.description = payload.get("description", "")
    db.commit()
    db.refresh(swayam)
    return swayam


# ===================== FACILITY CONTENT (powers GenericContentPage.jsx) =====================

@app.get("/facility-content")
def get_facility_content(
    section: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """This is the endpoint GenericContentPage.jsx calls on every page load.
    It returns the description, table details, and ALL photos/pdfs for that
    section + category (the 'key' built from URL params in FacilitiesRouted)."""
    query = db.query(models.FacilityContent)
    if section:
        query = query.filter(models.FacilityContent.section == section)
    if category:
        query = query.filter(models.FacilityContent.category == category)
    if sub_category:
        query = query.filter(models.FacilityContent.sub_category == sub_category)
    rows = query.order_by(models.FacilityContent.id).all()
    return [
        {
            "id": r.id,
            "section": r.section,
            "category": r.category or "",
            "sub_category": r.sub_category or "",
            "name": r.name or "",
            "description": r.description or "",
            "details": r.details or "",
            "pdf_name": r.pdf_name,
            "photo_name": r.photo_name,
            "photo_url": r.photo_url,
            "pdf_url": r.pdf_url,
            "photos": [
                {"id": p.id, "photo_name": p.photo_name, "photo_url": p.photo_url}
                for p in r.photos
            ],
            "pdfs": [
                {"id": p.id, "pdf_name": p.pdf_name, "pdf_url": p.pdf_url}
                for p in r.pdfs
            ],
            "created_at": r.created_at,
        }
        for r in rows
    ]


@app.put("/admin/facility-content")
def upsert_facility_content(
    payload: dict,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by handleSave (description) and saveTable (table data) in
    GenericContentPage.jsx. Creates the row on first write, updates after."""
    ensure_admin(user)
    section = payload.get("section", "").strip()
    category = payload.get("category", "").strip()
    sub_category = payload.get("sub_category", "").strip()

    if not section:
        raise HTTPException(status_code=400, detail="section is required")

    row = db.query(models.FacilityContent).filter(
        models.FacilityContent.section == section,
        models.FacilityContent.category == category,
        models.FacilityContent.sub_category == sub_category
    ).first()

    if not row:
        row = models.FacilityContent(section=section, category=category, sub_category=sub_category)
        db.add(row)

    if "name" in payload:
        row.name = payload["name"]
    if "description" in payload:
        row.description = payload["description"]
    if "details" in payload:
        row.details = payload["details"]

    db.commit()
    db.refresh(row)

    # Stage D: re-index this row's search chunks in the background, so the
    # admin's save feels instant — embedding takes ~20+ seconds per chunk.
    # Pass just the ID (not the row object) — by the time this background task
    # runs, the request's db session will already be closed.
    background_tasks.add_task(sync_facility_content_by_id, row.id)

    return {
        "id": row.id,
        "section": row.section,
        "category": row.category,
        "sub_category": row.sub_category,
        "name": row.name,
        "description": row.description,
        "details": row.details,
        "pdf_name": row.pdf_name,
        "pdf_url": row.pdf_url,
        "photo_name": row.photo_name,
        "photo_url": row.photo_url,
    }


@app.delete("/admin/facility-content/{content_id}")
def delete_facility_content(
    content_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a FacilityContent row entirely — its pdfs/photos (cascade via
    ORM relationship) and its chat index chunks. Use this for orphaned/duplicate
    entries that aren't routed to by any frontend page (e.g. a leftover
    'academics/section-incharge' row when the real pages live at
    'section-incharge/science', '/socialscience', '/arts') — those stray rows
    still get indexed for chat search and can out-compete the correct ones."""
    ensure_admin(user)
    row = db.query(models.FacilityContent).filter(models.FacilityContent.id == content_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")

    delete_chunks_for("facility_content", row.id)  # remove chat index chunks first
    db.delete(row)  # cascades to pdfs/photos via relationship
    db.commit()
    return {"message": "Deleted successfully"}


@app.post("/admin/facility-content/upload-pdf")
async def upload_facility_content_pdf(
    background_tasks: BackgroundTasks,
    section: str = Form(...),
    category: str = Form(""),
    sub_category: str = Form(""),
    files: List[UploadFile] = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by handlePdfUpload in GenericContentPage.jsx. Each uploaded
    PDF becomes its own row in facility_content_pdfs linked to this content row."""
    ensure_admin(user)

    row = db.query(models.FacilityContent).filter(
        models.FacilityContent.section == section,
        models.FacilityContent.category == category,
        models.FacilityContent.sub_category == sub_category
    ).first()

    if not row:
        row = models.FacilityContent(section=section, category=category, sub_category=sub_category)
        db.add(row)
        db.commit()
        db.refresh(row)

    uploaded = []
    for file in files:
        await validate_upload(file, ALLOWED_PDF_TYPES)
        filename = f"fac_{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        pdf = models.FacilityContentPdf(
            content_id=row.id, pdf_name=file.filename, pdf_url=f"/uploads/{filename}"
        )
        db.add(pdf)
        uploaded.append({"pdf_name": file.filename, "pdf_url": f"/uploads/{filename}"})

    db.commit()
    background_tasks.add_task(sync_facility_content_by_id, row.id)
    return {"message": f"{len(uploaded)} PDF(s) uploaded", "pdfs": uploaded}


@app.delete("/admin/facility-content/pdf/{pdf_id}")
def delete_facility_content_pdf(
    pdf_id: int,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by handleDeletePdf in GenericContentPage.jsx."""
    ensure_admin(user)
    pdf = db.query(models.FacilityContentPdf).filter(models.FacilityContentPdf.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    content_id = pdf.content_id  # capture before delete, needed for re-sync below

    filepath = os.path.join(UPLOADS_DIR, os.path.basename(pdf.pdf_url))
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(pdf)
    db.commit()
    background_tasks.add_task(sync_facility_content_by_id, content_id)
    return {"message": "PDF deleted"}


@app.post("/admin/facility-content/upload-photo")
async def upload_facility_content_photo(
    background_tasks: BackgroundTasks,
    section: str = Form(...),
    category: str = Form(""),
    sub_category: str = Form(""),
    files: List[UploadFile] = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by handleImageUpload in GenericContentPage.jsx. Each uploaded
    photo becomes its own row in facility_content_photos — this is what
    powers both the multi-photo gallery and the SlideshowBlock."""
    ensure_admin(user)

    row = db.query(models.FacilityContent).filter(
        models.FacilityContent.section == section,
        models.FacilityContent.category == category,
        models.FacilityContent.sub_category == sub_category
    ).first()

    if not row:
        row = models.FacilityContent(section=section, category=category, sub_category=sub_category)
        db.add(row)
        db.commit()
        db.refresh(row)

    uploaded = []
    for file in files:
        await validate_upload(file, ALLOWED_IMAGE_TYPES)
        filename = f"fac_photo_{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        photo = models.FacilityContentPhoto(
            content_id=row.id, photo_name=file.filename, photo_url=f"/uploads/{filename}"
        )
        db.add(photo)
        uploaded.append({"photo_name": file.filename, "photo_url": f"/uploads/{filename}"})

    db.commit()
    background_tasks.add_task(sync_facility_content_by_id, row.id)
    return {"message": f"{len(uploaded)} photo(s) uploaded", "photos": uploaded}


@app.delete("/admin/facility-content/photo/{photo_id}")
def delete_facility_content_photo(
    photo_id: int,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by handleDeletePhoto in GenericContentPage.jsx."""
    ensure_admin(user)
    photo = db.query(models.FacilityContentPhoto).filter(models.FacilityContentPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    content_id = photo.content_id  # capture before delete, needed for re-sync below

    filepath = os.path.join(UPLOADS_DIR, os.path.basename(photo.photo_url))
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(photo)
    db.commit()
    background_tasks.add_task(sync_facility_content_by_id, content_id)
    return {"message": "Photo deleted"}

# ============================================================
# STAGE E + F — Chat search endpoint (public, no auth required)
# ============================================================

import groq as groq_lib

_groq_client = groq_lib.Groq()


def classify_question(question: str) -> str:
    """Classify whether the question is MMV-related or off-topic.
    Returns 'mmv' or 'offtopic'. When in doubt returns 'mmv'."""
    try:
        response = _groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{
                "role": "user",
                "content": (
                    "You are a classifier for MMVerse, AI assistant of Mahila Maha Vidyalaya (MMV), BHU.\n"
                    "Classify the question as 'mmv' or 'offtopic'. Reply with ONE word only.\n\n"
                    "'mmv' = questions about MMV/BHU: admissions, fees, courses, faculty, hostels, "
                    "library, canteen, sports, medical, administration, exams, notices, campus life.\n"
                    "'offtopic' = clearly unrelated: general knowledge, coding, other universities, "
                    "entertainment, translation, politics, science facts.\n"
                    "When in doubt: 'mmv'.\n\n"
                    f"Question: {question}"
                )
            }],
            max_tokens=5,
            temperature=0.0,
        )
        result = response.choices[0].message.content.strip().lower()
        return "offtopic" if "offtopic" in result else "mmv"
    except Exception:
        return "mmv"


def expand_query(question: str) -> list:
    """Generate 2 alternative phrasings with MMV-specific vocabulary mapping.
    Handles: 'timings'→'hours', 'charges'→'fees', 'ma'am'→proper title, etc."""
    try:
        response = _groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{
                "role": "user",
                "content": (
                    "You are helping search a college portal for Mahila Maha Vidyalaya (MMV), BHU. "
                    "Rephrase this student question in 2 different ways using formal academic terminology. "
                    "Common mappings: 'timings'→'hours/schedule', 'charges/fees'→'fee structure', "
                    "'principal ma'am'→'principal', 'incharge'→'coordinator/in-charge', "
                    "'hostel warden'→'chief warden', 'gym'→'gymnasium', 'OPD'→'outpatient department'. "
                    "Output only the 2 rephrased questions, one per line, no numbering.\n\n"
                    f"Question: {question}"
                )
            }],
            max_tokens=80,
            temperature=0.2,  # lower = more consistent rephrasing
        )
        lines = response.choices[0].message.content.strip().split("\n")
        alternatives = [l.strip() for l in lines if l.strip() and l.strip() != question][:2]
        return [question] + alternatives
    except Exception:
        return [question]


def search_best_chunk(queries: list, db, section_filter: str = None):
    """Embed all query variants, return the single best-matching chunk.
    section_filter: optional section name to restrict search (e.g. 'facilities').
    Returns (row, similarity) or (None, 0.0)."""
    best_row = None
    best_similarity = 0.0

    try:
        result = voyage_client.embed(
            texts=queries,
            model=EMBED_MODEL,
            input_type="query",
        )
        embeddings = result.embeddings
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Embedding service unavailable: {e}")

    # Build optional section filter clause
    section_clause = ""
    if section_filter:
        # Match source_table containing section name, or section_url starting with /section
        section_clause = f"AND (c.section_url LIKE '/{section_filter}%' OR c.source_table LIKE '%{section_filter}%')"

    for emb in embeddings:
        emb_str = str(emb)
        row = db.execute(
            text(f"""
                SELECT
                    c.id,
                    c.chunk_text,
                    c.section_title,
                    c.section_url,
                    c.content_type,
                    1 - (c.embedding <=> '{emb_str}'::vector) AS similarity,
                    a.asset_type,
                    a.table_data,
                    a.file_url,
                    a.file_name
                FROM chat_index_chunk c
                LEFT JOIN chat_index_asset a ON a.chunk_id = c.id
                {section_clause}
                ORDER BY
                    (c.embedding <=> '{emb_str}'::vector)
                    + CASE WHEN c.content_type IN ('pdf', 'image') THEN 0.15 ELSE 0 END
                LIMIT 1
            """)
        ).fetchone()

        if row and float(row.similarity) > best_similarity:
            best_similarity = float(row.similarity)
            best_row = row

    return best_row, best_similarity


def generate_answer(question: str, chunk_text: str, section_title: str, content_type: str = "text") -> str:
    """Generate a precise, grounded answer from the best matching chunk.
    content_type hint helps the LLM handle table data vs prose differently."""

    # Give the LLM a hint about what kind of data it's working with
    if content_type == "table":
        data_hint = "The information below is tabular data. Find the specific row(s) relevant to the question and extract the exact values."
    elif content_type == "pdf":
        data_hint = "The information below refers to a document/PDF. Describe what the document contains and how to access it."
    elif content_type == "image":
        data_hint = "The information below refers to an image or photo."
    else:
        data_hint = "The information below is descriptive text from the college portal."

    prompt = f"""You are MMVerse, the official AI assistant for Mahila Maha Vidyalaya (MMV), Banaras Hindu University (BHU).

STUDENT QUESTION: {question}

RETRIEVED INFORMATION FROM MMV PORTAL (section: {section_title}):
{data_hint}
---
{chunk_text}
---

INSTRUCTIONS:
- Answer ONLY using the information above. Never add facts from outside.
- Be direct and specific: give exact times, exact names, exact numbers as they appear above.
- For table data: find the specific row matching the question and quote the relevant values.
- If the information does not contain a direct answer, say exactly: "I don't have specific information about that. Please visit the {section_title} section or contact the relevant department directly."
- Never guess, invent, or approximate facts not present in the text above.
- Keep answers concise — 1-3 sentences for simple facts, bullet points (using •) for lists.
- Do NOT start with "Based on the information", "According to", or "The text says".
- Do NOT include markdown links — plain text only."""

    response = _groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=250,
        temperature=0.0,
    )
    return response.choices[0].message.content.strip()


# 0.35 is safer than 0.30 — at 0.30 some irrelevant chunks pass through
# and produce confidently wrong answers. Better to say "I don't know"
# than return a wrong answer.
SIMILARITY_THRESHOLD = 0.35


@app.post("/chat")
def chat(payload: dict, db: Session = Depends(get_db)):
    """Public endpoint — no auth required.

    Request body:  { "question": "What are the hostel facilities?" }

    Response — matched:
    {
        "matched": true,
        "answer": "...",
        "chunk_text": "...",
        "section_title": "...",
        "section_url": "/...",
        "asset": { ... } | null
    }

    Response — no match (Stage F fallback):
    {
        "matched": false,
        "message": "I couldn't find a specific answer...",
        "section_title": "...",
        "section_url": "/..."
    }
    """
    question = (payload.get("question") or "").strip()
    section_filter = (payload.get("section") or "").strip() or None
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    # 1. Classify — off-topic check first.
    intent = classify_question(question)
    if intent == "offtopic":
        return {
            "matched": False,
            "fallback_type": "offtopic",
            "message": (
                "I'm MMVerse, an assistant specifically for Mahila Maha Vidyalaya (MMV), BHU. "
                "I can only answer questions about MMV — academics, facilities, administration, "
                "hostel, library, and campus life. For other topics, please use a general search engine."
            ),
            "section_title": None,
            "section_url": None,
        }

    # 2. Expand question into multiple phrasings.
    queries = expand_query(question)

    # 3. Search for best matching chunk with optional section filter.
    row, similarity = search_best_chunk(queries, db, section_filter=section_filter)

    if not row:
        return {
            "matched": False,
            "fallback_type": "no_content",
            "message": "The knowledge base is empty. Please contact the administrator.",
            "section_title": None,
            "section_url": None,
        }

    # 4. Stage F fallback — score too low.
    if similarity < SIMILARITY_THRESHOLD:
        return {
            "matched": False,
            "fallback_type": "no_content",
            "message": (
                "This looks like an MMV-related question, but I don't have specific information "
                "about it yet. The content may not have been added to the portal. "
                "Please contact the relevant department directly, or check the closest section below."
            ),
            "section_title": row.section_title,
            "section_url": row.section_url,
        }

    # 5. Generate NLP answer from best matching chunk.
    try:
        answer = generate_answer(question, row.chunk_text, row.section_title, row.content_type or "text")
    except Exception:
        answer = row.chunk_text

    # 6. Build asset payload.
    # file_url stored as relative path e.g. /uploads/file.pdf
    # Return as-is — frontend uses API_BASE + file_url to build full URL.
    # For section_url (internal page links), return as-is for React Router.
    asset = None
    if row.asset_type:
        asset = {"asset_type": row.asset_type}
        if row.asset_type == "table" and row.table_data:
            asset["table_data"] = (
                json.loads(row.table_data)
                if isinstance(row.table_data, str)
                else row.table_data
            )
        else:
            # Ensure file_url starts with / so frontend can prefix API_BASE
            file_url = row.file_url or ""
            if file_url and not file_url.startswith("/"):
                file_url = "/" + file_url
            asset["file_url"] = file_url
            asset["file_name"] = row.file_name

    return {
        "matched": True,
        "answer": answer,
        "chunk_text": row.chunk_text,
        "section_title": row.section_title,
        "section_url": row.section_url,
        "asset": asset,
    }