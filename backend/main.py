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
from sqlalchemy import text, func, inspect, or_, and_
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


# Home page always shows at least HOME_MIN_ITEMS notices/news (backfilling
# with the most recent non-active items if there aren't enough currently
# "live" ones), but never more than HOME_MAX_ITEMS.
HOME_MIN_ITEMS = 15
HOME_MAX_ITEMS = 25


def select_home_items(db: Session, model, base_filter, active_only_filter, order_cols):
    active_items = (
        db.query(model)
        .filter(base_filter, active_only_filter)
        .order_by(*order_cols)
        .limit(HOME_MAX_ITEMS)
        .all()
    )
    if len(active_items) >= HOME_MIN_ITEMS:
        return active_items

    existing_ids = [item.id for item in active_items]
    remaining = HOME_MAX_ITEMS - len(active_items)

    backfill_query = db.query(model).filter(base_filter)
    if existing_ids:
        backfill_query = backfill_query.filter(~model.id.in_(existing_ids))

    backfill_items = (
        backfill_query
        .order_by(*order_cols)
        .limit(remaining)
        .all()
    )

    combined = active_items + backfill_items
    combined.sort(key=lambda item: item.display_date or item.created_at, reverse=True)
    return combined[:HOME_MAX_ITEMS]


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
        "photos": [
            {"id": p.id, "photo_name": p.photo_name, "photo_url": p.photo_url}
            for p in n.photos
        ],
        "pdfs": [
            {"id": p.id, "pdf_name": p.pdf_name, "pdf_url": p.pdf_url}
            for p in n.pdfs
        ],
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

def ensure_notice_attachments_table():
    models.Base.metadata.create_all(bind=engine, tables=[
        models.NoticePhoto.__table__,
        models.NoticePdf.__table__,
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
ensure_notice_attachments_table()
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

@app.get("/metrics")
def metrics():
    return {
        "service": "mmv-webportal",
        "cache": "redis" if os.getenv("REDIS_URL") else "in-memory",
        "image_indexing": "disabled",
    }

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

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: str
 
 
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

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
@app.put("/admin/change-password")
def change_password(
    payload: ChangePasswordRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)
 
    if not auth.verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
 
    if payload.new_password == payload.current_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password",
        )
 
    user.hashed_password = auth.get_password_hash(payload.new_password)
    db.commit()
 
    return {"detail": "Password updated successfully"}

RESET_TOKEN_EXPIRE_MINUTES = 30
 
 
def _hash_reset_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
 
 
@app.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    generic_response = {
        "detail": "If that email is registered, a reset link has been sent."
    }
 
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        return generic_response  # don't reveal whether the email exists
 
    raw_token = secrets.token_urlsafe(32)
    token_row = models.PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_reset_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    )
    db.add(token_row)
    db.commit()
 
    try:
        email_utils.send_password_reset_email(user.email, raw_token)
    except Exception:
        # Don't leak SMTP/delivery errors to the caller - same reasoning as
        # not confirming whether the email exists. Log it server-side
        # (swap this for your actual logger) so you can debug delivery
        # issues without exposing them to whoever is hitting the endpoint.
        print(f"[forgot-password] failed to send reset email to user {user.id}")
 
    return generic_response
 
 
@app.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = _hash_reset_token(payload.token)
    token_row = (
        db.query(models.PasswordResetToken)
        .filter(models.PasswordResetToken.token_hash == token_hash)
        .first()
    )
 
    if (
        not token_row
        or token_row.used
        or token_row.expires_at < datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
 
    user = db.query(models.User).filter(models.User.id == token_row.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
 
    user.hashed_password = auth.get_password_hash(payload.new_password)
    token_row.used = True
    db.commit()
 
    return {"detail": "Password has been reset. You can now log in with your new password."}
 
 
 
# ====================contacts=======================

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
        active_only_filter = or_(models.Notice.end_date >= now_utc, models.Notice.end_date.is_(None))
        items = select_home_items(
            db, models.Notice, visibility_filter, active_only_filter,
            (models.Notice.display_date.desc(), models.Notice.created_at.desc())
        )
        return [serialize_notice(n) for n in items]

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
    content: Optional[str] = Form(""),
    category: str = Form("General"),
    display_date: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    attachment: Optional[UploadFile] = File(None),
    attachments: Optional[List[UploadFile]] = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)

    resolved_display, resolved_start, resolved_end = resolve_entry_dates(
        display_date, start_date, end_date
    )

    # Legacy single-file field — kept so any older admin form still works.
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
        content=(content or "").strip(),
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

    # New multi-file field — any number of PDFs/images, split by type.
    for file in (attachments or []):
        if not file or not file.filename:
            continue
        if file.content_type in ALLOWED_IMAGE_TYPES:
            await validate_upload(file, ALLOWED_IMAGE_TYPES)
            unique_name = f"notice_photo_{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(UPLOADS_DIR, unique_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            db.add(models.NoticePhoto(
                notice_id=new_notice.id,
                photo_name=file.filename,
                photo_url=f"/uploads/{unique_name}",
            ))
        elif file.content_type in ALLOWED_PDF_TYPES:
            await validate_upload(file, ALLOWED_PDF_TYPES)
            unique_name = f"notice_pdf_{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(UPLOADS_DIR, unique_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            db.add(models.NoticePdf(
                notice_id=new_notice.id,
                pdf_name=file.filename,
                pdf_url=f"/uploads/{unique_name}",
            ))

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
    for photo in notice.photos:
        stored_path = os.path.join(UPLOADS_DIR, os.path.basename(photo.photo_url))
        if os.path.exists(stored_path):
            os.remove(stored_path)
    for pdf in notice.pdfs:
        stored_path = os.path.join(UPLOADS_DIR, os.path.basename(pdf.pdf_url))
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

    if "title" in payload:
        notice.title = payload["title"]
    if "content" in payload:
        notice.content = payload["content"]
    if "category" in payload:
        notice.category = payload["category"]

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

    # Legacy single-attachment removal (notices saved before multi-attachment
    # support). New-style attachments are added/removed via the dedicated
    # /admin/notice/{id}/attachments and /admin/notice/photo|pdf/{id} routes.
    if payload.get("remove_attachment") and notice.attachment_url:
        stored_path = os.path.join(UPLOADS_DIR, os.path.basename(notice.attachment_url))
        if os.path.exists(stored_path):
            os.remove(stored_path)
        notice.attachment_url = None
        notice.attachment_name = None

    db.commit()
    db.refresh(notice)
    return serialize_notice(notice)


@app.post("/admin/notice/{notice_id}/attachments")
async def add_notice_attachments(
    notice_id: int,
    attachments: List[UploadFile] = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Adds one or more photo/PDF attachments to an existing notice.
    Used when editing a notice to add new attachments alongside the ones already there."""
    ensure_admin(user)
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    for file in (attachments or []):
        if not file or not file.filename:
            continue
        if file.content_type in ALLOWED_IMAGE_TYPES:
            await validate_upload(file, ALLOWED_IMAGE_TYPES)
            unique_name = f"notice_photo_{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(UPLOADS_DIR, unique_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            db.add(models.NoticePhoto(
                notice_id=notice.id,
                photo_name=file.filename,
                photo_url=f"/uploads/{unique_name}",
            ))
        elif file.content_type in ALLOWED_PDF_TYPES:
            await validate_upload(file, ALLOWED_PDF_TYPES)
            unique_name = f"notice_pdf_{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(UPLOADS_DIR, unique_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            db.add(models.NoticePdf(
                notice_id=notice.id,
                pdf_name=file.filename,
                pdf_url=f"/uploads/{unique_name}",
            ))

    db.commit()
    db.refresh(notice)
    return serialize_notice(notice)


@app.delete("/admin/notice/photo/{photo_id}")
def delete_notice_photo(
    photo_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Removes a single photo attachment from a notice while editing."""
    ensure_admin(user)
    photo = db.query(models.NoticePhoto).filter(models.NoticePhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    stored_path = os.path.join(UPLOADS_DIR, os.path.basename(photo.photo_url))
    if os.path.exists(stored_path):
        os.remove(stored_path)

    db.delete(photo)
    db.commit()
    return {"message": "Photo deleted"}


@app.delete("/admin/notice/pdf/{pdf_id}")
def delete_notice_pdf(
    pdf_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Removes a single PDF attachment from a notice while editing."""
    ensure_admin(user)
    pdf = db.query(models.NoticePdf).filter(models.NoticePdf.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    stored_path = os.path.join(UPLOADS_DIR, os.path.basename(pdf.pdf_url))
    if os.path.exists(stored_path):
        os.remove(stored_path)

    db.delete(pdf)
    db.commit()
    return {"message": "PDF deleted"}


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
        active_only_filter = or_(models.News.end_date >= now_utc, models.News.end_date.is_(None))
        items = select_home_items(
            db, models.News, visibility_filter, active_only_filter,
            (models.News.display_date.desc(), models.News.created_at.desc())
        )
        return [serialize_news(r) for r in items]

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


@app.post("/admin/news/{news_id}/attachments")
async def add_news_attachments(
    news_id: int,
    attachments: List[UploadFile] = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Adds one or more photo/PDF attachments to an existing news item.
    Used when editing a news item to add new attachments alongside the ones already there."""
    ensure_admin(user)
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

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
                news_id=news.id,
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
                news_id=news.id,
                pdf_name=file.filename,
                pdf_url=f"/uploads/{unique_name}",
            ))

    db.commit()
    db.refresh(news)
    return serialize_news(news)


@app.delete("/admin/news/photo/{photo_id}")
def delete_news_photo(
    photo_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Removes a single photo attachment from a news item while editing."""
    ensure_admin(user)
    photo = db.query(models.NewsPhoto).filter(models.NewsPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    stored_path = os.path.join(UPLOADS_DIR, os.path.basename(photo.photo_url))
    if os.path.exists(stored_path):
        os.remove(stored_path)

    db.delete(photo)
    db.commit()
    return {"message": "Photo deleted"}


@app.delete("/admin/news/pdf/{pdf_id}")
def delete_news_pdf(
    pdf_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Removes a single PDF attachment from a news item while editing."""
    ensure_admin(user)
    pdf = db.query(models.NewsPdf).filter(models.NewsPdf.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    stored_path = os.path.join(UPLOADS_DIR, os.path.basename(pdf.pdf_url))
    if os.path.exists(stored_path):
        os.remove(stored_path)

    db.delete(pdf)
    db.commit()
    return {"message": "PDF deleted"}


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
            "profile_cards": [
                {
                    "id": c.id,
                    "name": c.name,
                    "designation": c.designation or "",
                    "badge": c.badge or "",
                    "university": c.university or "",
                    "phone": c.phone or "",
                    "email": c.email or "",
                    "photo_name": c.photo_name,
                    "photo_url": c.photo_url,
                    "display_order": c.display_order,
                }
                for c in r.profile_cards
            ],
            "created_at": r.created_at,
        }
        for r in rows
    ]


@app.put("/admin/facility-content")
def upsert_facility_content(
    payload: dict,
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
    """Deletes a FacilityContent row entirely -its pdfs/photos cascade via
    ORM relationship. Use this for orphaned/duplicate entries that aren't
    routed to by any frontend page (e.g. a leftover 'academics/section-incharge'
    row when the real pages live at 'section-incharge/science', '/socialscience',
    '/arts')."""
    ensure_admin(user)
    row = db.query(models.FacilityContent).filter(models.FacilityContent.id == content_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(row)  # cascades to pdfs/photos via relationship
    db.commit()
    return {"message": "Deleted successfully"}


@app.post("/admin/facility-content/upload-pdf")
async def upload_facility_content_pdf(
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
    return {"message": f"{len(uploaded)} PDF(s) uploaded", "pdfs": uploaded}


@app.delete("/admin/facility-content/pdf/{pdf_id}")
def delete_facility_content_pdf(
    pdf_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by handleDeletePdf in GenericContentPage.jsx."""
    ensure_admin(user)
    pdf = db.query(models.FacilityContentPdf).filter(models.FacilityContentPdf.id == pdf_id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    filepath = os.path.join(UPLOADS_DIR, os.path.basename(pdf.pdf_url))
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(pdf)
    db.commit()
    return {"message": "PDF deleted"}


@app.post("/admin/facility-content/upload-photo")
async def upload_facility_content_photo(
    section: str = Form(...),
    category: str = Form(""),
    sub_category: str = Form(""),
    files: List[UploadFile] = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by handleImageUpload in GenericContentPage.jsx. Each uploaded
    photo becomes its own row in facility_content_photos -this is what
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
    return {"message": f"{len(uploaded)} photo(s) uploaded", "photos": uploaded}


@app.delete("/admin/facility-content/photo/{photo_id}")
def delete_facility_content_photo(
    photo_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by handleDeletePhoto in GenericContentPage.jsx."""
    ensure_admin(user)
    photo = db.query(models.FacilityContentPhoto).filter(models.FacilityContentPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    filepath = os.path.join(UPLOADS_DIR, os.path.basename(photo.photo_url))
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(photo)
    db.commit()
    return {"message": "Photo deleted"}




# ============================================================
# PROFILE CARDS -properly joined to FacilityContent via content_id
# (see models.ProfileCard). Each card is its own row, same relational
# pattern as facility_content_photos/facility_content_pdfs above.
# ============================================================

def _serialize_profile_card(c: "models.ProfileCard"):
    return {
        "id": c.id,
        "name": c.name,
        "designation": c.designation or "",
        "badge": c.badge or "",
        "university": c.university or "",
        "phone": c.phone or "",
        "email": c.email or "",
        "photo_name": c.photo_name,
        "photo_url": c.photo_url,
        "display_order": c.display_order,
    }


@app.post("/admin/facility-content/profile-card")
async def add_profile_card(
    section: str = Form(...),
    category: str = Form(""),
    sub_category: str = Form(""),
    name: str = Form(...),
    designation: str = Form(""),
    badge: str = Form(""),
    university: str = Form(""),
    phone: str = Form(""),
    email: str = Form(""),
    photo: Optional[UploadFile] = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by ProfileCardsBlock.jsx when adding a new card. Creates the
    parent FacilityContent row on first use, same as the photo/pdf uploaders."""
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

    card = models.ProfileCard(
        content_id=row.id, name=name, designation=designation, badge=badge,
        university=university, phone=phone, email=email,
        display_order=len(row.profile_cards),
    )

    if photo is not None:
        await validate_upload(photo, ALLOWED_IMAGE_TYPES)
        filename = f"card_{uuid.uuid4().hex}_{photo.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        card.photo_name = photo.filename
        card.photo_url = f"/uploads/{filename}"

    db.add(card)
    db.commit()
    db.refresh(card)
    return _serialize_profile_card(card)


@app.put("/admin/facility-content/profile-card/{card_id}")
async def update_profile_card(
    card_id: int,
    name: str = Form(...),
    designation: str = Form(""),
    badge: str = Form(""),
    university: str = Form(""),
    phone: str = Form(""),
    email: str = Form(""),
    photo: Optional[UploadFile] = File(None),
    remove_photo: str = Form("false"),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by ProfileCardsBlock.jsx when editing a card. remove_photo is
    sent as the string 'true'/'false' since multipart form fields are text."""
    ensure_admin(user)
    card = db.query(models.ProfileCard).filter(models.ProfileCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Profile card not found")

    card.name = name
    card.designation = designation
    card.badge = badge
    card.university = university
    card.phone = phone
    card.email = email

    def _delete_existing_photo_file():
        if card.photo_url:
            filepath = os.path.join(UPLOADS_DIR, os.path.basename(card.photo_url))
            if os.path.exists(filepath):
                os.remove(filepath)

    if photo is not None:
        await validate_upload(photo, ALLOWED_IMAGE_TYPES)
        _delete_existing_photo_file()
        filename = f"card_{uuid.uuid4().hex}_{photo.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        card.photo_name = photo.filename
        card.photo_url = f"/uploads/{filename}"
    elif remove_photo.lower() == "true":
        _delete_existing_photo_file()
        card.photo_name = None
        card.photo_url = None

    db.commit()
    db.refresh(card)
    return _serialize_profile_card(card)


@app.delete("/admin/facility-content/profile-card/{card_id}")
def delete_profile_card(
    card_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Called by handleDelete in ProfileCardsBlock.jsx."""
    ensure_admin(user)
    card = db.query(models.ProfileCard).filter(models.ProfileCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Profile card not found")

    if card.photo_url:
        filepath = os.path.join(UPLOADS_DIR, os.path.basename(card.photo_url))
        if os.path.exists(filepath):
            os.remove(filepath)

    db.delete(card)
    db.commit()
    return {"message": "Profile card deleted"}


# ============================================================
# FEEDBACK - standalone table, deliberately not joined to anything
# (see models.Feedback docstring for why). Public submit endpoint +
# admin list/delete for triage.
# ============================================================

@app.post("/feedback")
def submit_feedback(payload: dict, db: Session = Depends(get_db)):
    """Called by Feedback.jsx. Public -no auth required, anyone visiting
    the site can submit feedback."""
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()
    message = (payload.get("message") or "").strip()
    category = (payload.get("category") or "General").strip()
    page_url = payload.get("page_url")

    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    entry = models.Feedback(
        name=name, email=email, category=category, message=message, page_url=page_url
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Feedback received", "id": entry.id}


@app.get("/admin/feedback")
def list_feedback(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lets an admin browse submissions in AdminDashboard.jsx."""
    ensure_admin(user)
    rows = db.query(models.Feedback).order_by(models.Feedback.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "category": r.category,
            "message": r.message,
            "page_url": r.page_url,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@app.delete("/admin/feedback/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ensure_admin(user)
    entry = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(entry)
    db.commit()
    return {"message": "Feedback deleted"}

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