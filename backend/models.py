from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime


# ── ADMIN AUTH ──
# Minimal user table — only used for admin login, no student data stored.
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ── NOTICES ──
class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    category = Column(String)  # Exam, Holiday, Admission, Event, General
    attachment_url = Column(String)
    attachment_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# --news --
class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    photos = relationship(
        "NewsPhoto",
        back_populates="news",
        cascade="all, delete-orphan"
    )
    pdfs = relationship(
        "NewsPdf",
        back_populates="news",
        cascade="all, delete-orphan"
    )


class NewsPhoto(Base):
    __tablename__ = "news_photos"

    id = Column(Integer, primary_key=True)
    news_id = Column(Integer, ForeignKey("news.id"))
    photo_name = Column(String)
    photo_url = Column(String)

    news = relationship("News", back_populates="photos")


class NewsPdf(Base):
    __tablename__ = "news_pdfs"

    id = Column(Integer, primary_key=True)
    news_id = Column(Integer, ForeignKey("news.id"))
    pdf_name = Column(String)
    pdf_url = Column(String)

    news = relationship("News", back_populates="pdfs")

# ── COLLEGE INFO CARDS ──
class CollegeInfoItem(Base):
    __tablename__ = "college_info_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, default="General")
    image_url = Column(String)
    image_name = Column(String)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ── MMV KNOWLEDGE (used by AdminDashboard's MMV Knowledge tab) ──
# Note: stored as JSON file (mmv_knowledge.json), not a DB table.
# Kept here as a reference comment only — no model needed.


# ── ADMINISTRATION PAGES (used by AdministrationRouted via GenericContentPage) ──
class AdministrationSection(Base):
    __tablename__ = "administration_sections"

    id = Column(Integer, primary_key=True, index=True)
    section_name = Column(String, nullable=False, index=True)
    sub_section = Column(String, index=True)
    description = Column(Text)
    image_url = Column(String)
    image_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ── ACADEMICS PAGES (used by AcademicsRouted via AdminAcademics component) ──
class AcademicNEP(Base):
    __tablename__ = "academic_nep"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text)
    pdf_url = Column(String)
    pdf_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AcademicSyllabus(Base):
    __tablename__ = "academic_syllabus"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    pdf_url = Column(String, nullable=False)
    pdf_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AcademicElective(Base):
    __tablename__ = "academic_electives"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    pdf_url = Column(String, nullable=False)
    pdf_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AcademicSectionIncharge(Base):
    __tablename__ = "academic_section_incharge"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    description = Column(Text)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AcademicSwayamCourse(Base):
    __tablename__ = "academic_swayam_courses"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ── FACILITIES / GENERIC CONTENT SYSTEM ──
# This is THE core table that GenericContentPage.jsx reads from and writes to.
# Every page rendered via <GenericContentPage section=... subsection=.../>
# (facilities/*, and any other section you route through it) stores its
# data here: description text, table JSON, and links to its photos/PDFs.
class FacilityContent(Base):
    __tablename__ = "facility_content"

    id = Column(Integer, primary_key=True, index=True)
    section = Column(String, nullable=False, index=True)       # e.g. "facilities"
    category = Column(String, default="", index=True)          # e.g. "hostels/chiefwarden" (the `key` from FacilitiesRouted)
    sub_category = Column(String, default="", index=True)       # currently always "" in your setup
    name = Column(String, default="")
    description = Column(Text, default="")                     # the markdown-style description text
    details = Column(Text, default="")                         # JSON string: {"columns": [...], "rows": [...]}

    # Legacy single photo/pdf columns — kept for backward compatibility,
    # but new uploads go through the photos/pdfs relationships below.
    pdf_name = Column(String, nullable=True)
    pdf_url = Column(String, nullable=True)
    photo_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)

    photos = relationship(
        "FacilityContentPhoto",
        back_populates="content",
        cascade="all, delete-orphan"
    )
    pdfs = relationship(
        "FacilityContentPdf",
        back_populates="content",
        cascade="all, delete-orphan"
    )

    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class FacilityContentPhoto(Base):
    """One row per uploaded photo. Many photos can belong to one FacilityContent row
    (this is what powers multi-photo galleries and slideshows in GenericContentPage)."""
    __tablename__ = "facility_content_photos"

    id = Column(Integer, primary_key=True)
    content_id = Column(Integer, ForeignKey("facility_content.id"))
    photo_name = Column(String)
    photo_url = Column(String)

    content = relationship("FacilityContent", back_populates="photos")


class FacilityContentPdf(Base):
    """One row per uploaded PDF. Many PDFs can belong to one FacilityContent row."""
    __tablename__ = "facility_content_pdfs"

    id = Column(Integer, primary_key=True)
    content_id = Column(Integer, ForeignKey("facility_content.id"))
    pdf_name = Column(String)
    pdf_url = Column(String)

    content = relationship("FacilityContent", back_populates="pdfs")

class ContactInfo(Base):
    __tablename__ = "contact_info"
 
    id = Column(Integer, primary_key=True, index=True)
    address = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    office_hours = Column(String, nullable=True)
    map_embed_url = Column(Text, nullable=True)
 
class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
 
    id            = Column(Integer, primary_key=True, index=True)
    label         = Column(String, nullable=False)   # e.g. "Helpline", "Fire Emergency"
    value         = Column(String, nullable=False)   # e.g. "0542-000-0000" or "security@mmv.bhu.ac.in"
    type          = Column(String, nullable=False)   # "phone" | "email" | "address"
    group_name    = Column(String, nullable=False)   # e.g. "Helpline Numbers", "Security Control Room"
    display_order = Column(Integer, default=0)
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)
 