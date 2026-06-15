import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy import or_
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from typing import Optional
from datetime import datetime, timedelta
import os
import json
import shutil
import uuid
from collections import defaultdict
from typing import List


import models, database, auth
from database import engine, get_db
from ml_model.recommender import RecommendationSystem

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
        column_rows = conn.execute(text("PRAGMA table_info(notices)")).fetchall()
        columns = {row[1] for row in column_rows}
        if "attachment_url" not in columns:
            conn.execute(text("ALTER TABLE notices ADD COLUMN attachment_url VARCHAR"))
        if "attachment_name" not in columns:
            conn.execute(text("ALTER TABLE notices ADD COLUMN attachment_name VARCHAR"))
        conn.commit()


def ensure_timetable_columns():
    with engine.connect() as conn:
        column_rows = conn.execute(text("PRAGMA table_info(timetable)")).fetchall()
        columns = {row[1] for row in column_rows}
        if "degree" not in columns:
            conn.execute(text("ALTER TABLE timetable ADD COLUMN degree VARCHAR"))
        if "branch" not in columns:
            conn.execute(text("ALTER TABLE timetable ADD COLUMN branch VARCHAR"))
        if "timetable_pdf_url" not in columns:
            conn.execute(text("ALTER TABLE timetable ADD COLUMN timetable_pdf_url VARCHAR"))
        if "timetable_pdf_name" not in columns:
            conn.execute(text("ALTER TABLE timetable ADD COLUMN timetable_pdf_name VARCHAR"))
        conn.commit()


def ensure_college_info_columns():
    with engine.connect() as conn:
        column_rows = conn.execute(text("PRAGMA table_info(college_info_items)")).fetchall()
        columns = {row[1] for row in column_rows}
        if "display_order" not in columns:
            conn.execute(text("ALTER TABLE college_info_items ADD COLUMN display_order INTEGER DEFAULT 0"))
        conn.execute(text("UPDATE college_info_items SET display_order = id WHERE display_order IS NULL OR display_order = 0"))
        conn.commit()


def ensure_facility_columns():
    with engine.connect() as conn:
        column_rows = conn.execute(text("PRAGMA table_info(facilities)")).fetchall()
        columns = {row[1] for row in column_rows}
        if "email" not in columns:
            conn.execute(text("ALTER TABLE facilities ADD COLUMN email VARCHAR"))
        conn.commit()


def ensure_club_event_columns():
    with engine.connect() as conn:
        column_rows = conn.execute(text("PRAGMA table_info(clubs_events)")).fetchall()
        columns = {row[1] for row in column_rows}
        if "event_date" not in columns:
            conn.execute(text("ALTER TABLE clubs_events ADD COLUMN event_date VARCHAR"))
        if "event_time" not in columns:
            conn.execute(text("ALTER TABLE clubs_events ADD COLUMN event_time VARCHAR"))
        if "venue" not in columns:
            conn.execute(text("ALTER TABLE clubs_events ADD COLUMN venue VARCHAR"))
        if "admin_priority" not in columns:
            conn.execute(text("ALTER TABLE clubs_events ADD COLUMN admin_priority INTEGER DEFAULT 0"))
        if "created_at" not in columns:
            conn.execute(text("ALTER TABLE clubs_events ADD COLUMN created_at DATETIME"))
            conn.execute(text("UPDATE clubs_events SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
        conn.commit()


def ensure_recommendation_columns():
    with engine.connect() as conn:
        user_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()}
        if "goals" not in user_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN goals JSON"))

        facility_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(facilities)")).fetchall()}
        if "admin_priority" not in facility_cols:
            conn.execute(text("ALTER TABLE facilities ADD COLUMN admin_priority INTEGER DEFAULT 0"))
        if "created_at" not in facility_cols:
            conn.execute(text("ALTER TABLE facilities ADD COLUMN created_at DATETIME"))
            conn.execute(text("UPDATE facilities SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))

        notice_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(notices)")).fetchall()}
        if "deadline_at" not in notice_cols:
            conn.execute(text("ALTER TABLE notices ADD COLUMN deadline_at DATETIME"))
        if "admin_priority" not in notice_cols:
            conn.execute(text("ALTER TABLE notices ADD COLUMN admin_priority INTEGER DEFAULT 0"))

        assist_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(problem_assistance)")).fetchall()}
        if "admin_priority" not in assist_cols:
            conn.execute(text("ALTER TABLE problem_assistance ADD COLUMN admin_priority INTEGER DEFAULT 0"))
        if "created_at" not in assist_cols:
            conn.execute(text("ALTER TABLE problem_assistance ADD COLUMN created_at DATETIME"))
            conn.execute(text("UPDATE problem_assistance SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))

        conn.commit()


def ensure_facility_content_table():
    models.Base.metadata.create_all(bind=engine, tables=[
        models.FacilityContent.__table__,
        models.FacilityContentPhoto.__table__,
        models.FacilityContentPdf.__table__,
    ], checkfirst=True)

ensure_notice_attachment_columns()
ensure_timetable_columns()
ensure_college_info_columns()
ensure_facility_columns()
ensure_club_event_columns()
ensure_recommendation_columns()
ensure_mmv_knowledge_file()
ensure_facility_content_table()

app = FastAPI(title="AI-Powered College Information Portal")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Initialize Recommender
recommender = RecommendationSystem()


def parse_resource_numeric_id(resource_id: str) -> int:
    try:
        return int(str(resource_id).split("_")[-1])
    except (ValueError, TypeError):
        return 0

def serialize_user(user: models.User):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "department": user.department,
        "faculty": user.faculty,
        "program": user.program,
        "degree": user.degree,
        "enrollment_number": user.enrollment_number,
        "exam_roll_number": user.exam_roll_number,
        "admission_year": user.admission_year,
        "academic_year": user.academic_year,
        "current_year": user.current_year,
        "course": user.course,
        "interests": user.interests or [],
        "goals": user.goals or [],
        "selected_problems": user.selected_problems or [],
        "is_admin": user.is_admin,
        "created_at": user.created_at,
    }

# Helper: Get current user
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

# AUTH ROUTES
@app.post("/signup")
def signup(user_data: dict, db: Session = Depends(get_db)):
    required_fields = [
        "full_name",
        "email",
        "password",
        "department",
        "faculty",
        "program",
        "degree",
        "enrollment_number",
        "course",
        "admission_year",
        "current_year",
    ]
    missing = [f for f in required_fields if not user_data.get(f)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

    db_user = db.query(models.User).filter(models.User.email == user_data['email']).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_enrollment = db.query(models.User).filter(
        models.User.enrollment_number == user_data.get('enrollment_number')
    ).first()
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Enrollment number already registered")

    exam_roll = (user_data.get('exam_roll_number') or '').strip()
    if exam_roll:
        existing_exam_roll = db.query(models.User).filter(
            models.User.exam_roll_number == exam_roll
        ).first()
        if existing_exam_roll:
            raise HTTPException(status_code=400, detail="Exam roll number already registered")
    
    hashed_pwd = auth.get_password_hash(user_data['password'])
    try:
        admission_year = int(user_data.get('admission_year'))
        current_year = int(user_data.get('current_year', 1))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Admission year and current year must be valid numbers")

    new_user = models.User(
        full_name=str(user_data['full_name']).strip(),
        email=str(user_data['email']).strip().lower(),
        hashed_password=hashed_pwd,
        phone_number=user_data.get('phone_number'),
        department=user_data.get('department'),
        faculty=user_data.get('faculty'),
        program=user_data.get('program'),
        degree=user_data.get('degree'),
        enrollment_number=str(user_data.get('enrollment_number') or '').strip(),
        exam_roll_number=exam_roll or None,
        course=user_data.get('course'),
        admission_year=admission_year,
        academic_year=user_data.get('academic_year'),
        current_year=current_year,
        interests=user_data.get('interests', []),
        goals=user_data.get('goals', []),
        selected_problems=user_data.get('selected_problems', []),
        is_admin=False,
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Registration failed due to duplicate or invalid unique details")

    return {"message": "User created successfully"}

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
        "course": user.course,
        "degree": user.degree,
        "current_year": user.current_year,
    }

# STUDENT DASHBOARD & PROFILE
@app.get("/user/me")
def get_me(user: models.User = Depends(get_current_user)):
    return serialize_user(user)

@app.put("/user/me")
def update_me(update_data: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    for key, value in update_data.items():
        if key in ["is_admin", "hashed_password", "id", "created_at"]:
            continue
        if hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return {"message": "Profile updated", "user": serialize_user(user)}

@app.get("/course-options")
def get_course_options(db: Session = Depends(get_db)):
    BUILT_IN_DEGREES = [
        "B.A.", "B.A. (Hons.)", "B.Sc.", "B.Sc. (Hons.)", "B.Com.", "B.Com. (Hons.)",
        "B.Tech", "B.Ed.", "B.F.A.", "BBA", "BCA",
        "M.A.", "M.Sc.", "M.Com.", "M.Tech", "M.Ed.", "M.F.A.", "MBA", "MCA",
        "Ph.D.", "D.Litt.", "Diploma", "Certificate",
    ]
    rows = db.query(models.CourseCatalog).all()
    if not rows:
        return {
            "degrees": BUILT_IN_DEGREES,
            "courses": ["Computer Science"],
            "departments": ["Computer Science"],
            "faculties": ["Institute of Science"],
            "programs": ["Undergraduate", "Postgraduate", "Doctoral"],
        }

    catalog_degrees = {r.degree for r in rows if r.degree}
    degrees = sorted(set(BUILT_IN_DEGREES) | catalog_degrees)
    courses = sorted({r.course for r in rows if r.course})
    return {
        "degrees": degrees,
        "courses": courses,
        "departments": ["Computer Science"],
        "faculties": ["Institute of Science"],
        "programs": ["Undergraduate", "Postgraduate", "Doctoral"],
    }

@app.get("/course-catalog")
def get_course_catalog(degree: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.CourseCatalog)
    if degree:
        query = query.filter(models.CourseCatalog.degree == degree)
    return query.order_by(models.CourseCatalog.degree, models.CourseCatalog.semester, models.CourseCatalog.subject_code).all()

@app.get("/professors")
def get_professors(db: Session = Depends(get_db)):
    return db.query(models.FacultyMember).order_by(models.FacultyMember.name).all()

# MODULES: TIMETABLE, NOTICES, FACILITIES
@app.get("/timetable")
def get_timetable(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Filter by user's year, degree, and branch/course values.
    query = db.query(models.Timetable).filter(models.Timetable.year == user.current_year)

    if user.degree:
        query = query.filter(or_(models.Timetable.degree == user.degree, models.Timetable.degree.is_(None)))

    course_targets = [v for v in [user.course, user.department] if v]
    if course_targets:
        query = query.filter(
            or_(
                models.Timetable.branch.in_(course_targets),
                models.Timetable.course.in_(course_targets),
            )
        )

    return query.order_by(models.Timetable.day, models.Timetable.time_start).all()


@app.get("/timetable/pdf")
def get_timetable_pdf(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.TimetablePdf).filter(
        models.TimetablePdf.year == user.current_year,
    )

    if user.degree:
        query = query.filter(models.TimetablePdf.degree == user.degree)

    course_targets = [v for v in [user.course, user.department] if v]
    if course_targets:
        query = query.filter(models.TimetablePdf.branch.in_(course_targets))

    row = query.order_by(models.TimetablePdf.id.desc()).first()
    if not row:
        return {"pdf_url": None, "pdf_name": None}

    return {
        "pdf_url": row.pdf_url,
        "pdf_name": row.pdf_name,
        "degree": row.degree,
        "branch": row.branch,
        "year": row.year,
    }

@app.get("/timetable/all")
def get_all_timetable(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    return db.query(models.Timetable).order_by(
        models.Timetable.degree,
        models.Timetable.branch,
        models.Timetable.year,
        models.Timetable.day,
        models.Timetable.time_start,
    ).all()

@app.get("/notices")
def get_notices(db: Session = Depends(get_db)):
    return db.query(models.Notice).order_by(models.Notice.created_at.desc()).all()

@app.get("/facilities")
def get_facilities(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Facility)
    if category:
        query = query.filter(models.Facility.category == category)
    return query.all()


@app.get("/hostels")
def get_hostel_documents(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ = user
    return db.query(models.HostelDocument).order_by(models.HostelDocument.hostel_name).all()


@app.get("/clubs")
def get_clubs(type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.ClubEvent)
    if type:
        query = query.filter(models.ClubEvent.type == type)
    return query.order_by(models.ClubEvent.type, models.ClubEvent.name).all()


@app.get("/college-info")
def get_college_info(db: Session = Depends(get_db)):
    return db.query(models.CollegeInfoItem).order_by(models.CollegeInfoItem.display_order, models.CollegeInfoItem.created_at.desc()).all()

@app.get("/problem-assistance")
def get_assistance(db: Session = Depends(get_db)):
    return db.query(models.ProblemAssistance).all()

# RECOMMENDATIONS
@app.get("/recommendations")
def get_recommendations(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    clubs = db.query(models.ClubEvent).order_by(models.ClubEvent.name).all()
    facilities = db.query(models.Facility).order_by(models.Facility.name).all()
    assistance = db.query(models.ProblemAssistance).order_by(models.ProblemAssistance.title).all()
    notices = db.query(models.Notice).order_by(models.Notice.created_at.desc()).limit(40).all()

    resources = []
    resource_map = {}

    def push_resource(entry):
        resources.append(entry)
        resource_map[entry["id"]] = entry

    for c in clubs:
        push_resource({
            "id": f"club_{c.id}",
            "name": c.name,
            "description": c.description,
            "type": c.type or "Club",
            "tags": c.tags or [],
            "admin_priority": c.admin_priority or 0,
            "created_at": c.created_at,
            "deadline_at": None,
        })
    for f in facilities:
        push_resource({
            "id": f"fac_{f.id}",
            "name": f.name,
            "description": f.description,
            "type": "Facility",
            "tags": [f.category] if f.category else [],
            "admin_priority": f.admin_priority or 0,
            "created_at": f.created_at,
            "deadline_at": None,
        })
    for a in assistance:
        push_resource({
            "id": f"ast_{a.id}",
            "name": a.title,
            "description": a.content,
            "type": "Assistance",
            "tags": [a.category] if a.category else [],
            "admin_priority": a.admin_priority or 0,
            "created_at": a.created_at,
            "deadline_at": None,
        })
    for n in notices:
        push_resource({
            "id": f"not_{n.id}",
            "name": n.title,
            "description": n.content,
            "type": "Notice",
            "tags": [n.category] if n.category else [],
            "admin_priority": n.admin_priority or 0,
            "created_at": n.created_at,
            "deadline_at": n.deadline_at,
        })

    if not resources:
        return []

    interests = user.interests or []
    goals = user.goals or []
    problems = user.selected_problems or []

    recommender.prepare_data(resources)
    base_recommendations = recommender.recommend(interests + goals, problems, top_n=40)
    if not base_recommendations:
        base_recommendations = [{
            "id": r["id"], "name": r["name"], "description": r["description"], "type": r["type"], "score": 0.2
        } for r in resources[:20]]

    resource_ids = [rec["id"] for rec in base_recommendations]
    feedback_rows = db.query(models.RecommendationFeedback).filter(
        models.RecommendationFeedback.resource_id.in_(resource_ids)
    ).all()
    behavior_rows = db.query(models.RecommendationBehavior).filter(
        models.RecommendationBehavior.resource_id.in_(resource_ids)
    ).all()

    branch_behavior_rows = db.query(
        models.RecommendationBehavior.resource_id,
        func.sum(models.RecommendationBehavior.event_value).label("total")
    ).join(models.User, models.User.id == models.RecommendationBehavior.user_id).filter(
        models.RecommendationBehavior.resource_id.in_(resource_ids),
        models.User.course == user.course,
    ).group_by(models.RecommendationBehavior.resource_id).all()
    branch_click_map = {row.resource_id: int(row.total or 0) for row in branch_behavior_rows}

    feedback_counts = defaultdict(lambda: {"like": 0, "save": 0, "not_relevant": 0})
    user_feedback_map = {}
    for row in feedback_rows:
        if row.action in feedback_counts[row.resource_id]:
            feedback_counts[row.resource_id][row.action] += 1
        if row.user_id == user.id:
            user_feedback_map[row.resource_id] = row.action

    click_counts = defaultdict(int)
    user_click_counts = defaultdict(int)
    for row in behavior_rows:
        click_counts[row.resource_id] += int(row.event_value or 0)
        if row.user_id == user.id:
            user_click_counts[row.resource_id] += int(row.event_value or 0)

    now = datetime.utcnow()
    month = now.month
    target_semester = max(1, int((user.current_year or 1) * 2 if month <= 6 else (user.current_year or 1) * 2 - 1))

    is_cold_start = not interests and not goals and not problems and not any(user_click_counts.values())
    cold_pack_keywords = []
    if is_cold_start:
        if (user.course or "").lower().startswith("computer"):
            cold_pack_keywords = ["coding", "programming", "library", "classroom", "mentor", "placement"]
        elif (user.degree or "").lower().startswith("mca"):
            cold_pack_keywords = ["project", "internship", "database", "placement", "lab"]
        else:
            cold_pack_keywords = ["library", "hostel", "exam", "admission", "career"]

    feedback_row_count = db.query(models.RecommendationFeedback).filter(models.RecommendationFeedback.user_id == user.id).count()
    feedback_signal_weight = 0.10 + min(0.10, feedback_row_count * 0.01)

    ranked = []
    for rec in base_recommendations:
        rid = rec["id"]
        source = resource_map.get(rid)
        if not source:
            continue

        content_score = float(rec.get("score") or 0.0)

        counts = feedback_counts[rid]
        raw_pop = (
            counts["like"]
            + 0.8 * counts["save"]
            - 0.8 * counts["not_relevant"]
            + 0.25 * click_counts[rid]
        )
        popularity_score = max(0.0, min(1.0, raw_pop / 8.0))

        created_at = source.get("created_at")
        age_days = 30
        if created_at:
            try:
                age_days = max(0, (now - created_at).days)
            except TypeError:
                age_days = 30
        recency_score = max(0.0, 1.0 - min(age_days, 30) / 30.0)

        admin_priority_score = max(0.0, min(1.0, float(source.get("admin_priority") or 0) / 5.0))

        searchable = f"{source.get('name') or ''} {source.get('description') or ''} {' '.join(source.get('tags') or [])}".lower()
        context_score = 0.0
        if user.course and user.course.lower() in searchable:
            context_score += 0.35
        if str(target_semester) in searchable or f"semester {target_semester}" in searchable:
            context_score += 0.25
        if problems and any(p.lower() in searchable for p in problems):
            context_score += 0.25
        if goals and any(g.lower() in searchable for g in goals):
            context_score += 0.20
        if source.get("type") == "Notice" and any(k in searchable for k in ["exam", "admission", "placement"]):
            context_score += 0.15
        if source.get("type") == "Event":
            event_time = searchable
            if (6 <= now.hour < 12 and ("am" in event_time or "morning" in event_time)) or (17 <= now.hour < 22 and ("pm" in event_time or "evening" in event_time)):
                context_score += 0.15
        context_score = min(1.0, context_score)

        deadline_boost = 0.0
        if source.get("type") == "Notice" and any(k in searchable for k in ["exam", "admission", "placement"]):
            deadline_at = source.get("deadline_at")
            if deadline_at:
                try:
                    days_left = (deadline_at - now).days
                    if 0 <= days_left <= 14:
                        deadline_boost = max(0.0, 1.0 - (days_left / 14.0))
                except TypeError:
                    deadline_boost = 0.2
            else:
                deadline_boost = 0.2

        user_action = user_feedback_map.get(rid)
        feedback_preference = 0.0
        if user_action == "like":
            feedback_preference = 1.0
        elif user_action == "save":
            feedback_preference = 0.7
        elif user_action == "not_relevant":
            feedback_preference = -1.0

        implicit_score = max(0.0, min(1.0, (user_click_counts[rid] / 4.0) + (branch_click_map.get(rid, 0) / 20.0)))

        cold_start_boost = 0.0
        if is_cold_start and cold_pack_keywords:
            if any(k in searchable for k in cold_pack_keywords):
                cold_start_boost = 0.4

        hybrid_score = (
            0.32 * content_score
            + 0.14 * popularity_score
            + 0.12 * recency_score
            + 0.10 * admin_priority_score
            + 0.14 * context_score
            + feedback_signal_weight * feedback_preference
            + 0.10 * implicit_score
            + 0.12 * deadline_boost
            + 0.08 * cold_start_boost
        )

        reason_chips = []
        if any(i.lower() in searchable for i in interests):
            reason_chips.append("Based on interest")
        if any(p.lower() in searchable for p in problems):
            reason_chips.append("Based on challenge")
        if branch_click_map.get(rid, 0) > 1:
            reason_chips.append("Popular in your branch")
        if source.get("type") == "Notice" and deadline_boost > 0:
            reason_chips.append("Urgent deadline")
        if user_click_counts[rid] > 0:
            reason_chips.append("Because you viewed similar")
        if not reason_chips:
            reason_chips.append("Recommended for your profile")

        ranked.append({
            "id": rid,
            "name": source.get("name"),
            "description": source.get("description"),
            "type": source.get("type"),
            "score": float(hybrid_score),
            "content_score": float(content_score),
            "popularity_score": float(popularity_score),
            "recency_score": float(recency_score),
            "user_feedback": user_action,
            "reason_chips": reason_chips[:3],
            "explanation": ", ".join(reason_chips[:3]),
        })

    ranked.sort(key=lambda x: x["score"], reverse=True)

    # Diversity control: keep a mix of Club/Event, Facility, Assistance, Notice.
    grouped = defaultdict(list)
    for rec in ranked:
        grouped[(rec.get("type") or "Unknown")].append(rec)

    mixed = []
    type_order = ["Club", "Event", "Facility", "Assistance", "Notice"]
    while len(mixed) < 8:
        added = False
        for t in type_order:
            bucket = grouped.get(t, [])
            if bucket:
                mixed.append(bucket.pop(0))
                added = True
                if len(mixed) >= 8:
                    break
        if not added:
            break

    return mixed


@app.post("/recommendations/feedback")
def submit_recommendation_feedback(
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    action = payload.get("action")
    resource_id = payload.get("resource_id")

    allowed_actions = {"like", "save", "not_relevant"}
    if action not in allowed_actions:
        raise HTTPException(status_code=400, detail="Invalid action")
    if not resource_id:
        raise HTTPException(status_code=400, detail="resource_id is required")

    existing = db.query(models.RecommendationFeedback).filter(
        models.RecommendationFeedback.user_id == user.id,
        models.RecommendationFeedback.resource_id == resource_id,
    ).first()

    if existing:
        # Toggle behavior: same click removes feedback, different click updates it.
        if existing.action == action:
            db.delete(existing)
            db.commit()
            return {"message": "Feedback removed", "action": None}
        existing.action = action
        db.commit()
        return {"message": "Feedback updated", "action": action}

    entry = models.RecommendationFeedback(
        user_id=user.id,
        resource_id=resource_id,
        action=action,
    )
    db.add(entry)
    db.commit()
    return {"message": "Feedback saved", "action": action}


@app.post("/recommendations/chat")
def recommendation_chatbot(
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message = (payload.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    message_lower = message.lower()
    stop_words = {
        "i", "me", "my", "to", "and", "or", "the", "a", "an", "is", "are", "on", "in", "for",
        "want", "need", "with", "of", "it", "some", "any", "please", "have", "about", "related",
    }
    keywords = [w for w in message_lower.replace("?", " ").replace(",", " ").split() if len(w) > 2 and w not in stop_words]
    mmv_knowledge = load_mmv_chat_knowledge()

    clubs = db.query(models.ClubEvent).all()
    facilities = db.query(models.Facility).all()
    assistance = db.query(models.ProblemAssistance).all()

    results = []

    def add_result(item_type: str, title: str, description: str, contact: str = "", score: float = 0.0):
        results.append({
            "type": item_type,
            "title": title,
            "description": description,
            "contact": contact,
            "score": score,
        })

    def add_mmv_knowledge(min_overlap: int = 1, boost: float = 0.72):
        for entry in mmv_knowledge:
            searchable = f"{entry.get('title', '')} {entry.get('description', '')} {' '.join(entry.get('tags', []))}".lower()
            overlap = sum(1 for k in keywords if k in searchable)
            if overlap >= min_overlap:
                add_result(
                    entry.get("type", "Notice"),
                    entry.get("title", "MMV Information"),
                    entry.get("description", "MMV hostel information"),
                    entry.get("contact", ""),
                    boost + min(overlap, 3) * 0.08,
                )

    # Rule-based intent routing for practical campus issues.
    if any(k in message_lower for k in ["library", "book", "reading"]):
        for fac in facilities:
            searchable = f"{fac.name or ''} {fac.description or ''} {fac.category or ''}".lower()
            if "library" in searchable:
                add_result(
                    "Facility",
                    fac.name,
                    fac.description or "Library support available.",
                    fac.contact_details or "Contact details not available",
                    1.0,
                )

    if any(k in message_lower for k in ["dance", "music", "sing", "perform", "stage", "event", "club"]):
        for club in clubs:
            tags = " ".join(club.tags or []) if isinstance(club.tags, list) else str(club.tags or "")
            searchable = f"{club.name or ''} {club.description or ''} {club.type or ''} {tags}".lower()
            overlap = sum(1 for k in keywords if k in searchable)
            if overlap > 0 or any(k in searchable for k in ["dance", "music", "perform", "event", "club"]):
                event_meta = ""
                if (club.type or "").lower() == "event":
                    event_meta = f" Venue: {club.venue or 'TBA'}, Date: {club.event_date or 'TBA'}, Time: {club.event_time or 'TBA'}."
                add_result(
                    club.type or "Club",
                    club.name,
                    (club.description or "Student club/event") + event_meta,
                    club.contact_person or "Contact at student affairs desk",
                    0.75 + min(overlap, 3) * 0.08,
                )

    if any(k in message_lower for k in ["restaurant", "canteen", "food", "eat"]):
        for fac in facilities:
            searchable = f"{fac.name or ''} {fac.description or ''} {fac.category or ''}".lower()
            if any(word in searchable for word in ["canteen", "restaurant", "food", "amenity"]):
                add_result(
                    "Facility",
                    fac.name,
                    fac.description or "Food facility",
                    (fac.contact_details or "") + (f" | {fac.email}" if fac.email else "") or "Contact details not available",
                    0.85,
                )

    # Add MMV info-folder details for operational or contact-oriented queries.
    if any(k in message_lower for k in ["mmv", "hostel", "contact", "helpline", "emergency", "ambulance", "wifi", "electric", "warden", "sports", "duty", "committee"]):
        add_mmv_knowledge(min_overlap=1, boost=0.78)

    for item in assistance:
        searchable = f"{item.title or ''} {item.content or ''} {item.category or ''}".lower()
        overlap = sum(1 for k in keywords if k in searchable)
        if overlap > 0:
            add_result(
                "Assistance",
                item.title,
                item.content or "Support resource",
                "Student Helpdesk",
                0.7 + min(overlap, 3) * 0.07,
            )

    # Fallback to content recommender for generic queries.
    if not results:
        corpus = []
        for c in clubs:
            corpus.append({"id": f"club_{c.id}", "name": c.name, "description": c.description, "type": c.type, "tags": c.tags})
        for f in facilities:
            corpus.append({"id": f"fac_{f.id}", "name": f.name, "description": f.description, "type": "Facility", "tags": [f.category]})
        for a in assistance:
            corpus.append({"id": f"ast_{a.id}", "name": a.title, "description": a.content, "type": "Assistance", "tags": [a.category]})
        for entry in mmv_knowledge:
            corpus.append({
                "id": entry["id"],
                "name": entry["title"],
                "description": entry["description"],
                "type": entry["type"],
                "tags": entry.get("tags", []),
            })

        recommender.prepare_data(corpus)
        fallback = recommender.recommend([message], [message], top_n=3)
        for rec in fallback:
            chat_contact = ""
            for entry in mmv_knowledge:
                if entry.get("id") == rec.get("id"):
                    chat_contact = entry.get("contact", "")
                    break
            add_result(rec.get("type"), rec.get("name"), rec.get("description"), chat_contact, float(rec.get("score") or 0.0))

    # Keep top unique items by title.
    seen_titles = set()
    unique_results = []
    for item in sorted(results, key=lambda x: x["score"], reverse=True):
        key = (item["type"], item["title"])
        if key in seen_titles:
            continue
        seen_titles.add(key)
        unique_results.append(item)
        if len(unique_results) >= 5:
            break

    answer = "I found a few recommendations based on your request."
    if not unique_results:
        answer = "I could not find exact matches, please try a more specific query like library, dance club, event, or restaurant."

    chat_log = models.RecommendationChatHistory(
        user_id=user.id,
        user_message=message,
        bot_answer=answer,
        results=unique_results,
    )
    db.add(chat_log)
    db.commit()

    return {
        "answer": answer,
        "results": unique_results,
    }


@app.get("/recommendations/chat/history")
def get_recommendation_chat_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(models.RecommendationChatHistory).filter(
        models.RecommendationChatHistory.user_id == user.id
    ).order_by(models.RecommendationChatHistory.created_at.asc()).limit(30).all()

    history = []
    for row in rows:
        history.append({
            "id": row.id,
            "user_message": row.user_message,
            "bot_answer": row.bot_answer,
            "results": row.results or [],
            "created_at": row.created_at,
        })
    return history


@app.delete("/recommendations/chat/history")
def clear_recommendation_chat_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.RecommendationChatHistory).filter(
        models.RecommendationChatHistory.user_id == user.id
    ).delete()
    db.commit()
    return {"message": "Chat history cleared"}


@app.post("/recommendations/track-click")
def track_recommendation_click(payload: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resource_id = (payload.get("resource_id") or "").strip()
    event_type = (payload.get("event_type") or "click").strip().lower()
    if not resource_id:
        raise HTTPException(status_code=400, detail="resource_id is required")

    if event_type not in {"click", "view"}:
        event_type = "click"

    row = models.RecommendationBehavior(
        user_id=user.id,
        resource_id=resource_id,
        event_type=event_type,
        event_value=1,
    )
    db.add(row)
    db.commit()
    return {"message": "Tracked", "resource_id": resource_id, "event_type": event_type}


@app.get("/recommendations/dashboard")
def get_recommendation_dashboard(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=7)
    weekly_feedback = db.query(models.RecommendationFeedback).filter(
        models.RecommendationFeedback.user_id == user.id,
        models.RecommendationFeedback.created_at >= since,
    ).all()
    weekly_clicks = db.query(models.RecommendationBehavior).filter(
        models.RecommendationBehavior.user_id == user.id,
        models.RecommendationBehavior.created_at >= since,
    ).all()

    feedback_counts = defaultdict(int)
    for row in weekly_feedback:
        feedback_counts[row.action] += 1

    top_clicked = defaultdict(int)
    for row in weekly_clicks:
        top_clicked[row.resource_id] += int(row.event_value or 0)

    top_clicked_items = sorted(top_clicked.items(), key=lambda x: x[1], reverse=True)[:3]

    def resolve_resource_title(resource_id: str) -> str:
        try:
            prefix, rid = resource_id.split("_", 1)
            rid_int = int(rid)
        except (ValueError, TypeError):
            return resource_id

        if prefix == "club":
            row = db.query(models.ClubEvent).filter(models.ClubEvent.id == rid_int).first()
            return row.name if row else resource_id
        if prefix == "fac":
            row = db.query(models.Facility).filter(models.Facility.id == rid_int).first()
            return row.name if row else resource_id
        if prefix == "ast":
            row = db.query(models.ProblemAssistance).filter(models.ProblemAssistance.id == rid_int).first()
            return row.title if row else resource_id
        if prefix == "not":
            row = db.query(models.Notice).filter(models.Notice.id == rid_int).first()
            return row.title if row else resource_id
        return resource_id

    insights = []
    for rid, _ in top_clicked_items:
        insights.append(f"Because you interacted with {resolve_resource_title(rid)}")

    weekly_suggestions = []
    for rid, _ in top_clicked_items:
        weekly_suggestions.append(resolve_resource_title(rid))

    progress_score = min(100, (feedback_counts["like"] * 10) + (feedback_counts["save"] * 8) + (len(weekly_clicks) * 2))
    nudges = []
    if feedback_counts["like"] < 2:
        nudges.append("Like more relevant cards to tune your feed faster.")
    if feedback_counts["save"] < 2:
        nudges.append("Use Save for later to build your weekly shortlist.")
    if len(weekly_clicks) < 5:
        nudges.append("Explore at least 5 cards this week for stronger personalization.")

    return {
        "weekly": {
            "likes": feedback_counts["like"],
            "saved": feedback_counts["save"],
            "not_relevant": feedback_counts["not_relevant"],
            "clicks": len(weekly_clicks),
        },
        "insights": insights,
        "weekly_suggestions": weekly_suggestions,
        "progress_score": progress_score,
        "nudges": nudges,
    }

# ADMIN PANEL ROUTES
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


@app.post("/admin/notice")
def add_notice(
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
    return new_notice

@app.post("/admin/facility")
def add_facility(facility: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    new_fac = models.Facility(**facility)
    db.add(new_fac)
    db.commit()
    db.refresh(new_fac)
    return new_fac


@app.put("/admin/facility/{facility_id}")
def update_facility(facility_id: int, update_data: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.Facility).filter(models.Facility.id == facility_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Facility not found")

    for key, value in update_data.items():
        if hasattr(entry, key):
            setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


@app.delete("/admin/facility/{facility_id}")
def delete_facility(facility_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.Facility).filter(models.Facility.id == facility_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Facility not found")

    db.delete(entry)
    db.commit()
    return {"message": "Facility removed"}

@app.post("/admin/club-event")
def add_club_event(item: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    new_item = models.ClubEvent(**item)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@app.put("/admin/club-event/{item_id}")
def update_club_event(item_id: int, update_data: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.ClubEvent).filter(models.ClubEvent.id == item_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Club/Event not found")

    for key, value in update_data.items():
        if hasattr(entry, key):
            setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


@app.delete("/admin/club-event/{item_id}")
def delete_club_event(item_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.ClubEvent).filter(models.ClubEvent.id == item_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Club/Event not found")

    db.delete(entry)
    db.commit()
    return {"message": "Club/Event removed"}

@app.post("/admin/course-catalog")
def add_course_catalog(course: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = models.CourseCatalog(**course)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@app.put("/admin/course-catalog/{course_id}")
def update_course_catalog(course_id: int, update_data: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.CourseCatalog).filter(models.CourseCatalog.id == course_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Course entry not found")

    for key, value in update_data.items():
        if hasattr(entry, key):
            setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


@app.delete("/admin/course-catalog/{course_id}")
def delete_course_catalog(course_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.CourseCatalog).filter(models.CourseCatalog.id == course_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Course entry not found")

    db.delete(entry)
    db.commit()
    return {"message": "Course entry removed"}

@app.post("/admin/professor")
def add_professor(professor: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = models.FacultyMember(**professor)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@app.put("/admin/professor/{professor_id}")
def update_professor(professor_id: int, update_data: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.FacultyMember).filter(models.FacultyMember.id == professor_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Professor not found")

    for key, value in update_data.items():
        if hasattr(entry, key):
            setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry

@app.post("/admin/timetable")
def add_timetable(entry_data: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = models.Timetable(**entry_data)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@app.post("/admin/timetable/pdf")
def upload_timetable_pdf(
    degree: str = Form(...),
    branch: str = Form(...),
    year: int = Form(...),
    pdf: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)

    if not pdf.filename or not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    safe_name = pdf.filename.replace(" ", "_")
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(UPLOADS_DIR, unique_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(pdf.file, buffer)

    pdf_url = f"/uploads/{unique_name}"
    existing = db.query(models.TimetablePdf).filter(
        models.TimetablePdf.degree == degree,
        models.TimetablePdf.branch == branch,
        models.TimetablePdf.year == int(year),
    ).first()

    if existing:
        if existing.pdf_url:
            old_name = os.path.basename(existing.pdf_url)
            old_path = os.path.join(UPLOADS_DIR, old_name)
            if os.path.exists(old_path):
                os.remove(old_path)
        existing.pdf_url = pdf_url
        existing.pdf_name = pdf.filename
    else:
        db.add(models.TimetablePdf(
            degree=degree,
            branch=branch,
            year=int(year),
            pdf_url=pdf_url,
            pdf_name=pdf.filename,
        ))

    db.commit()

    return {
        "message": "Timetable PDF uploaded successfully",
        "pdf_url": pdf_url,
        "pdf_name": pdf.filename,
        "degree": degree,
        "branch": branch,
        "year": int(year),
    }


@app.get("/admin/timetable/pdf/all")
def get_all_timetable_pdfs(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    return db.query(models.TimetablePdf).order_by(
        models.TimetablePdf.degree,
        models.TimetablePdf.branch,
        models.TimetablePdf.year,
        models.TimetablePdf.created_at.desc(),
    ).all()


@app.get("/admin/hostels")
def get_all_hostel_documents(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    return db.query(models.HostelDocument).order_by(models.HostelDocument.hostel_name).all()


@app.post("/admin/hostels/upload")
def upload_hostel_pdf(
    hostel_name: str = Form(...),
    pdf: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)

    if not hostel_name.strip():
        raise HTTPException(status_code=400, detail="hostel_name is required")

    if not pdf.filename or not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    safe_name = pdf.filename.replace(" ", "_")
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(UPLOADS_DIR, unique_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(pdf.file, buffer)

    pdf_url = f"/uploads/{unique_name}"
    normalized_hostel = hostel_name.strip()
    existing = db.query(models.HostelDocument).filter(
        models.HostelDocument.hostel_name == normalized_hostel
    ).first()

    if existing:
        old_name = os.path.basename(existing.pdf_url or "")
        old_path = os.path.join(UPLOADS_DIR, old_name)
        if old_name and os.path.exists(old_path):
            os.remove(old_path)
        existing.pdf_url = pdf_url
        existing.pdf_name = pdf.filename
        db.commit()
        db.refresh(existing)
        return existing

    row = models.HostelDocument(
        hostel_name=normalized_hostel,
        pdf_url=pdf_url,
        pdf_name=pdf.filename,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@app.get("/calendar")
def get_calendar(db: Session = Depends(get_db)):
    return db.query(models.CalendarDocument).order_by(models.CalendarDocument.created_at.desc()).all()


@app.post("/admin/calendar/upload")
def upload_calendar_pdf(
    type: str = Form(...),  # 'academic' or 'holiday'
    pdf: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(user)
    if type not in ["academic", "holiday"]:
        raise HTTPException(status_code=400, detail="Invalid type")

    if not pdf.filename or not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    safe_name = pdf.filename.replace(" ", "_")
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(UPLOADS_DIR, unique_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(pdf.file, buffer)

    pdf_url = f"/uploads/{unique_name}"

    new_doc = models.CalendarDocument(
        type=type,
        pdf_url=pdf_url,
        pdf_name=pdf.filename
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


@app.delete("/admin/calendar/{doc_id}")
def delete_calendar_doc(doc_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.CalendarDocument).filter(models.CalendarDocument.id == doc_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Document not found")

    if entry.pdf_url:
        old_name = os.path.basename(entry.pdf_url)
        old_path = os.path.join(UPLOADS_DIR, old_name)
        if os.path.exists(old_path):
            os.remove(old_path)

    db.delete(entry)
    db.commit()
    return {"message": "Document removed"}


@app.put("/admin/timetable/{entry_id}")
def update_timetable(entry_id: int, update_data: dict, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    entry = db.query(models.Timetable).filter(models.Timetable.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    for key, value in update_data.items():
        if hasattr(entry, key):
            setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


@app.post("/admin/college-info")
def add_college_info(
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

# ADMINISTRATION ROUTES
@app.get("/administration")
def get_administration_sections(db: Session = Depends(get_db)):
    return db.query(models.AdministrationSection).all()

@app.put("/admin/administration")
def update_administration_section(
    payload: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
            section_name=section_name,
            sub_section=sub_section,
            description=description
        )
        db.add(section)
    else:
        if description is not None:
            section.description = description

    db.commit()
    db.refresh(section)
    return section

@app.post("/admin/administration/upload-photo")
def upload_administration_photo(
    section_name: str = Form(...),
    sub_section: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ensure_admin(user)
    
    # Check if section exists
    section = db.query(models.AdministrationSection).filter(
        models.AdministrationSection.section_name == section_name,
        models.AdministrationSection.sub_section == sub_section
    ).first()

    if not section:
        # Create it if it doesn't exist
        section = models.AdministrationSection(
            section_name=section_name,
            sub_section=sub_section,
            description=""
        )
        db.add(section)
        db.commit()
        db.refresh(section)

    try:
        # Remove old image if exists
        if section.image_url:
            old_filename = os.path.basename(section.image_url)
            old_filepath = os.path.join(UPLOADS_DIR, old_filename)
            if os.path.exists(old_filepath):
                os.remove(old_filepath)

        for file in files:
               filename = f"admin_{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_url = f"/uploads/{filename}"
        
        section.image_url = file_url
        section.image_name = file.filename
        db.commit()
        db.refresh(section)
        
        return {
            "message": "Photo uploaded successfully",
            "image_url": file_url,
            "image_name": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ACADEMICS ROUTES

# 1. NEP
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
def upload_nep_pdf(file: UploadFile = File(...), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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

# 2. Syllabus
@app.get("/academics/syllabus/{category}")
def get_syllabus(category: str, db: Session = Depends(get_db)):
    return db.query(models.AcademicSyllabus).filter(models.AcademicSyllabus.category == category).all()

@app.post("/academics/syllabus/{category}/upload")
def upload_syllabus_pdf(category: str, file: UploadFile = File(...), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    filename = f"syllabus_{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    syl = models.AcademicSyllabus(
        category=category,
        pdf_url=f"/uploads/{filename}",
        pdf_name=file.filename
    )
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

# 3. Electives
@app.get("/academics/electives/{category}")
def get_electives(category: str, db: Session = Depends(get_db)):
    return db.query(models.AcademicElective).filter(models.AcademicElective.category == category).all()

@app.post("/academics/electives/{category}/upload")
def upload_elective_pdf(category: str, file: UploadFile = File(...), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    filename = f"elective_{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    elec = models.AcademicElective(
        category=category,
        pdf_url=f"/uploads/{filename}",
        pdf_name=file.filename
    )
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

# 4. Section In-charge
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
            category=category,
            description=payload.get("description", ""),
            details=payload.get("details", "")
        )
        db.add(inc)
    else:
        inc.description = payload.get("description", "")
        inc.details = payload.get("details", "")
    db.commit()
    db.refresh(inc)
    return inc

# 5. Swayam Courses
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

# ===================== FACILITY CONTENT ROUTES =====================

@app.get("/facility-content")
def get_facility_content(
    section: Optional[str] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    db: Session = Depends(get_db)
):
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
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin upsert for description/details of a facility content entry."""
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
        row = models.FacilityContent(
            section=section,
            category=category,
            sub_category=sub_category,
        )
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


@app.post("/admin/facility-content/upload-pdf")
def upload_facility_content_pdf(
    section: str = Form(...),
    category: str = Form(""),
    sub_category: str = Form(""),
    files: List[UploadFile] = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
        filename = f"fac_{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        pdf = models.FacilityContentPdf(
            content_id=row.id,
            pdf_name=file.filename,
            pdf_url=f"/uploads/{filename}"
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
    ensure_admin(user)
    pdf = db.query(models.FacilityContentPdf).filter(
        models.FacilityContentPdf.id == pdf_id
    ).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    filepath = os.path.join(UPLOADS_DIR, os.path.basename(pdf.pdf_url))
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(pdf)
    db.commit()
    return {"message": "PDF deleted"}

@app.post("/admin/facility-content/upload-photo")
def upload_facility_content_photo(
    section: str = Form(...),
    category: str = Form(""),
    sub_category: str = Form(""),
    files: List[UploadFile] = File(...),   # was: file: UploadFile = File(...)
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
        filename = f"fac_photo_{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        photo = models.FacilityContentPhoto(
            content_id=row.id,
            photo_name=file.filename,
            photo_url=f"/uploads/{filename}"
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
    ensure_admin(user)
    photo = db.query(models.FacilityContentPhoto).filter(
        models.FacilityContentPhoto.id == photo_id
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    filepath = os.path.join(UPLOADS_DIR, os.path.basename(photo.photo_url))
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(photo)
    db.commit()
    return {"message": "Photo deleted"}