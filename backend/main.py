import sys
import os
import secrets
import hashlib
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text, func, inspect, or_
from typing import Optional, List
import datetime as dt
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from pydantic import BaseModel, Field
import os
import shutil
import uuid
from dotenv import load_dotenv
load_dotenv()

# Allowed file types and size limit
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_PDF_TYPES = {"application/pdf"}
MAX_UPLOAD_MB = 50
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

LOCAL_TZ = ZoneInfo("Asia/Kolkata")

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
import email_utils

models.Base.metadata.create_all(bind=engine)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


def parse_local_datetime_to_utc(dt_str: Optional[str]) -> Optional[datetime]:
    """
    Parses 'YYYY-MM-DDTHH:MM' from <input type="datetime-local"> 
    as Indian Standard Time (IST) and converts it to naive UTC for consistent DB storage.
    """
    if not dt_str or not dt_str.strip():
        return None
    try:
        cleaned = dt_str.strip().replace("Z", "")
        # Parse what the admin selected in browser
        naive_dt = datetime.fromisoformat(cleaned)
        # Treat as IST
        localized_dt = naive_dt.replace(tzinfo=LOCAL_TZ)
        # Convert to UTC and strip tzinfo so database timestamps compare accurately with now_utc
        return localized_dt.astimezone(timezone.utc).replace(tzinfo=None)
    except Exception:
        return None


def split_news_title_and_body(raw_text: str):
    normalized = (raw_text or "").replace("\r\n", "\n").strip("\n")
    if not normalized.strip():
        return "", ""
    lines = normalized.split("\n", 1)
    title = lines[0].strip()
    body = lines[1].strip() if len(lines) > 1 else ""
    return title, body


def resolve_entry_dates(
    display_date_str: Optional[str] = None,
    start_date_str: Optional[str] = None,
    end_date_str: Optional[str] = None
):
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Start Date (real release date / scheduled start)
    start_date = parse_local_datetime_to_utc(start_date_str) or now_utc

    # 2. Display Date (fake/back-dated date shown to public; defaults to start_date)
    display_date = parse_local_datetime_to_utc(display_date_str) or start_date

    # 3. End Date (home page expiration; defaults to 7 days from start_date)
    end_date = parse_local_datetime_to_utc(end_date_str) or (start_date + timedelta(days=7))

    return display_date, start_date, end_date


def compute_item_status(start_date, end_date, now=None):
    if not now:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
    if start_date and start_date > now:
        return "scheduled"
    if end_date and end_date < now:
        return "archived"
    return "active"


def serialize_notice(n: "models.Notice"):
    status = compute_item_status(n.start_date, n.end_date)
    return {
        "id": n.id,
        "title": n.title,
        "content": n.content,
        "category": n.category,
        "attachment_url": n.attachment_url,
        "attachment_name": n.attachment_name,
        "display_date": n.display_date or n.created_at,
        "start_date": n.start_date or n.created_at,
        "end_date": n.end_date,
        "status": status,
        "created_at": n.created_at,
    }


def serialize_news(n: "models.News"):
    status = compute_item_status(n.start_date, n.end_date)
    return {
        "id": n.id,
        "title": n.title,
        "content": n.content,
        "display_date": n.display_date or n.created_at,
        "start_date": n.start_date or n.created_at,
        "end_date": n.end_date,
        "status": status,
        "created_at": n.created_at,
        "photos": [
            {"id": p.id, "photo_name": p.photo_name, "photo_url": p.photo_url}
            for p in n.photos
        ],
        "pdfs": [
            {"id": p.id, "pdf_name": p.pdf_name, "pdf_url": p.pdf_url}
            for p in n.pdfs
        ],
    }


def ensure_notice_columns():
    inspector = inspect(engine)
    existing_columns = {col["name"] for col in inspector.get_columns("notices")}

    with engine.begin() as conn:
        if "attachment_url" not in existing_columns:
            conn.execute(text("ALTER TABLE notices ADD COLUMN attachment_url VARCHAR"))
        if "attachment_name" not in existing_columns:
            conn.execute(text("ALTER TABLE notices ADD COLUMN attachment_name VARCHAR"))
        if "display_date" not in existing_columns:
            conn.execute(text("ALTER TABLE notices ADD COLUMN display_date TIMESTAMP"))
            conn.execute(text("UPDATE notices SET display_date = created_at WHERE display_date IS NULL"))
        if "start_date" not in existing_columns:
            conn.execute(text("ALTER TABLE notices ADD COLUMN start_date TIMESTAMP"))
            conn.execute(text("UPDATE notices SET start_date = created_at WHERE start_date IS NULL"))
        if "end_date" not in existing_columns:
            conn.execute(text("ALTER TABLE notices ADD COLUMN end_date TIMESTAMP"))
            conn.execute(text("UPDATE notices SET end_date = created_at + INTERVAL '7 days' WHERE end_date IS NULL"))


def ensure_news_columns():
    inspector = inspect(engine)
    existing_columns = {col["name"] for col in inspector.get_columns("news")}

    with engine.begin() as conn:
        if "display_date" not in existing_columns:
            conn.execute(text("ALTER TABLE news ADD COLUMN display_date TIMESTAMP"))
            conn.execute(text("UPDATE news SET display_date = created_at WHERE display_date IS NULL"))
        if "start_date" not in existing_columns:
            conn.execute(text("ALTER TABLE news ADD COLUMN start_date TIMESTAMP"))
            conn.execute(text("UPDATE news SET start_date = created_at WHERE start_date IS NULL"))
        if "end_date" not in existing_columns:
            conn.execute(text("ALTER TABLE news ADD COLUMN end_date TIMESTAMP"))
            conn.execute(text("UPDATE news SET end_date = created_at + INTERVAL '7 days' WHERE end_date IS NULL"))


def ensure_password_reset_tokens_table():
    models.Base.metadata.create_all(bind=engine, tables=[
        models.PasswordResetToken.__table__,
    ], checkfirst=True)

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

def ensure_news_table():
    models.Base.metadata.create_all(bind=engine, tables=[
        models.News.__table__,
        models.NewsPhoto.__table__,
        models.NewsPdf.__table__,
    ], checkfirst=True)

def ensure_profile_cards_table():
    models.Base.metadata.create_all(bind=engine, tables=[
        models.ProfileCard.__table__,
    ], checkfirst=True)

def ensure_feedback_table():
    models.Base.metadata.create_all(bind=engine, tables=[
        models.Feedback.__table__,
    ], checkfirst=True)


ensure_emergency_contacts_table() 
ensure_notice_columns()
ensure_news_columns()
ensure_facility_content_table()
ensure_news_table()
ensure_profile_cards_table()
ensure_feedback_table()
ensure_password_reset_tokens_table()

app = FastAPI(title="MMV WebPortal")

@app.get("/health")
def health():
    return {"status": "ok", "service": "mmv-webportal"}

@app.get("/ready")
def readiness(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Service is not ready: {exc}")

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
oauth2_optional_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)


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


async def get_optional_current_user(token: Optional[str] = Depends(oauth2_optional_scheme), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        return db.query(models.User).filter(models.User.email == email).first()
    except Exception:
        return None


def ensure_admin(user: models.User):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")


# ===================== AUTH =====================

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if auth.pwd_context.needs_update(user.hashed_password):
        user.hashed_password = auth.get_password_hash(form_data.password)
        db.commit()

    access_token = auth.create_access_token(data={"sub": user.email, "is_admin": user.is_admin})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": user.is_admin,
        "full_name": user.full_name,
    }


@app.get("/user/me")
def get_current_user_info(user: models.User = Depends(get_current_user)):
    return {
        "email": user.email,
        "full_name": user.full_name,
        "is_admin": user.is_admin,
    }


# ===================== NOTICES =====================

@app.get("/notices")
def get_notices(
    home_only: bool = False,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    is_admin = current_user.is_admin if current_user else False

    # Admins see scheduled notices; public visitors only see items that are already live
    visibility_filter = (
        text("1=1") if is_admin else or_(models.Notice.start_date <= now_utc, models.Notice.start_date.is_(None))
    )

    if home_only:
        active_notices = (
            db.query(models.Notice)
            .filter(
                or_(models.Notice.start_date <= now_utc, models.Notice.start_date.is_(None)),
                or_(models.Notice.end_date >= now_utc, models.Notice.end_date.is_(None))
            )
            .order_by(models.Notice.display_date.desc(), models.Notice.created_at.desc())
            .all()
        )
        if not active_notices:
            active_notices = (
                db.query(models.Notice)
                .filter(or_(models.Notice.start_date <= now_utc, models.Notice.start_date.is_(None)))
                .order_by(models.Notice.display_date.desc(), models.Notice.created_at.desc())
                .limit(5)
                .all()
            )
        return [serialize_notice(n) for n in active_notices]

    rows = (
        db.query(models.Notice)
        .filter(visibility_filter)
        .order_by(models.Notice.display_date.desc(), models.Notice.created_at.desc())
        .all()
    )
    return [serialize_notice(n) for n in rows]


@app.post("/admin/notice")
async def add_notice(
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form("General"),
    display_date: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    attachment: UploadFile = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)

    resolved_display, resolved_start, resolved_end = resolve_entry_dates(
        display_date, start_date, end_date
    )

    attachment_url = None
    attachment_name = None
    if attachment and attachment.filename:
        await validate_upload(attachment, ALLOWED_PDF_TYPES | ALLOWED_IMAGE_TYPES)
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
        display_date=resolved_display,
        start_date=resolved_start,
        end_date=resolved_end,
        attachment_url=attachment_url,
        attachment_name=attachment_name,
    )
    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)
    return serialize_notice(new_notice)


@app.delete("/admin/notice/{notice_id}")
def delete_notice(
    notice_id: int,
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
    return {"message": "Notice deleted"}


@app.put("/admin/notice/{notice_id}")
def update_notice(
    notice_id: int,
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ensure_admin(user)
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    for field in ["title", "content", "category"]:
        if field in payload:
            setattr(notice, field, payload[field])

    if "display_date" in payload:
        parsed = parse_local_datetime_to_utc(payload["display_date"])
        if parsed:
            notice.display_date = parsed
    if "start_date" in payload:
        parsed = parse_local_datetime_to_utc(payload["start_date"])
        if parsed:
            notice.start_date = parsed
    if "end_date" in payload:
        parsed = parse_local_datetime_to_utc(payload["end_date"])
        if parsed:
            notice.end_date = parsed

    db.commit()
    db.refresh(notice)
    return serialize_notice(notice)


# ===================== NEWS =====================

@app.get("/news")
def get_news(
    home_only: bool = False,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    is_admin = current_user.is_admin if current_user else False

    visibility_filter = (
        text("1=1") if is_admin else or_(models.News.start_date <= now_utc, models.News.start_date.is_(None))
    )

    if home_only:
        active_news = (
            db.query(models.News)
            .filter(
                or_(models.News.start_date <= now_utc, models.News.start_date.is_(None)),
                or_(models.News.end_date >= now_utc, models.News.end_date.is_(None))
            )
            .order_by(models.News.display_date.desc(), models.News.created_at.desc())
            .all()
        )
        if not active_news:
            active_news = (
                db.query(models.News)
                .filter(or_(models.News.start_date <= now_utc, models.News.start_date.is_(None)))
                .order_by(models.News.display_date.desc(), models.News.created_at.desc())
                .limit(5)
                .all()
            )
        return [serialize_news(r) for r in active_news]

    rows = (
        db.query(models.News)
        .filter(visibility_filter)
        .order_by(models.News.display_date.desc(), models.News.created_at.desc())
        .all()
    )
    return [serialize_news(r) for r in rows]


@app.post("/admin/news")
async def add_news(
    text: str = Form(...),
    display_date: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    attachments: List[UploadFile] = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)

    title, body = split_news_title_and_body(text)
    if not title:
        raise HTTPException(
            status_code=400,
            detail="News text cannot be empty — the first line becomes the heading."
        )

    resolved_display, resolved_start, resolved_end = resolve_entry_dates(
        display_date, start_date, end_date
    )

    new_news = models.News(
        title=title,
        content=body,
        display_date=resolved_display,
        start_date=resolved_start,
        end_date=resolved_end
    )
    db.add(new_news)
    db.commit()
    db.refresh(new_news)

    for file in (attachments or []):
        if not file or not file.filename:
            continue
        if file.content_type in ALLOWED_IMAGE_TYPES:
            await validate_upload(file, ALLOWED_IMAGE_TYPES)
            unique_name = f"news_photo_{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(UPLOADS_DIR, unique_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            db.add(models.NewsPhoto(
                news_id=new_news.id,
                photo_name=file.filename,
                photo_url=f"/uploads/{unique_name}",
            ))
        elif file.content_type in ALLOWED_PDF_TYPES:
            await validate_upload(file, ALLOWED_PDF_TYPES)
            unique_name = f"news_pdf_{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(UPLOADS_DIR, unique_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            db.add(models.NewsPdf(
                news_id=new_news.id,
                pdf_name=file.filename,
                pdf_url=f"/uploads/{unique_name}",
            ))

    db.commit()
    db.refresh(new_news)
    return serialize_news(new_news)


@app.put("/admin/news/{news_id}")
def update_news(
    news_id: int,
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    if "text" in payload:
        title, body = split_news_title_and_body(payload["text"])
        if not title:
            raise HTTPException(
                status_code=400,
                detail="News text cannot be empty — the first line becomes the heading."
            )
        news.title = title
        news.content = body
    else:
        if "title" in payload:
            news.title = payload["title"]
        if "content" in payload:
            news.content = payload["content"]

    if "display_date" in payload:
        parsed = parse_local_datetime_to_utc(payload["display_date"])
        if parsed:
            news.display_date = parsed
    if "start_date" in payload:
        parsed = parse_local_datetime_to_utc(payload["start_date"])
        if parsed:
            news.start_date = parsed
    if "end_date" in payload:
        parsed = parse_local_datetime_to_utc(payload["end_date"])
        if parsed:
            news.end_date = parsed

    db.commit()
    db.refresh(news)
    return serialize_news(news)


@app.delete("/admin/news/{news_id}")
def delete_news(
    news_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    for photo in news.photos:
        stored_path = os.path.join(UPLOADS_DIR, os.path.basename(photo.photo_url))
        if os.path.exists(stored_path):
            os.remove(stored_path)
    for pdf in news.pdfs:
        stored_path = os.path.join(UPLOADS_DIR, os.path.basename(pdf.pdf_url))
        if os.path.exists(stored_path):
            os.remove(stored_path)

    db.delete(news)
    db.commit()
    return {"message": "News deleted"}


# ===================== EMERGENCY CONTACTS =====================

@app.get("/emergency-contacts")
def get_emergency_contacts(db: Session = Depends(get_db)):
    return (
        db.query(models.EmergencyContact)
        .order_by(models.EmergencyContact.display_order)
        .all()
    )


@app.post("/admin/emergency-contacts")
def add_emergency_contact(
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)
    max_order = db.query(func.max(models.EmergencyContact.display_order)).scalar() or 0
    entry = models.EmergencyContact(
        label=payload.get("label", "").strip(),
        value=payload.get("value", "").strip(),
        type=payload.get("type", "phone"),
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
    ensure_admin(user)
    entry = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == entry_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Emergency contact not found")

    db.delete(entry)
    db.commit()
    return {"message": "Deleted"}


# ===================== CONTACT INFO =====================

@app.get("/contact-info")
def get_contact_info(db: Session = Depends(get_db)):
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