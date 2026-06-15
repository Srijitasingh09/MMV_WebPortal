from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Date, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone_number = Column(String)
    
    # Academic Details
    department = Column(String)
    faculty = Column(String)
    program = Column(String)
    degree = Column(String)
    enrollment_number = Column(String, unique=True)
    exam_roll_number = Column(String, unique=True)
    admission_year = Column(Integer)
    academic_year = Column(String)
    current_year = Column(Integer) # 1, 2, 3, 4
    course = Column(String)
    
    # AI Interests & Problems
    interests = Column(JSON, default=[]) # List of strings
    goals = Column(JSON, default=[])
    selected_problems = Column(JSON, default=[]) # List of strings/IDs
    
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Timetable(Base):
    __tablename__ = "timetable"
    
    id = Column(Integer, primary_key=True, index=True)
    day = Column(String) # Monday, Tuesday...
    degree = Column(String)
    branch = Column(String)
    subject = Column(String)
    time_start = Column(String)
    time_end = Column(String)
    teacher_name = Column(String)
    room_number = Column(String)
    department = Column(String)
    course = Column(String)
    year = Column(Integer)
    timetable_pdf_url = Column(String)
    timetable_pdf_name = Column(String)


class TimetablePdf(Base):
    __tablename__ = "timetable_pdfs"

    id = Column(Integer, primary_key=True, index=True)
    degree = Column(String, nullable=False)
    branch = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    pdf_url = Column(String, nullable=False)
    pdf_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class HostelDocument(Base):
    __tablename__ = "hostel_documents"

    id = Column(Integer, primary_key=True, index=True)
    hostel_name = Column(String, unique=True, nullable=False)
    pdf_url = Column(String, nullable=False)
    pdf_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CourseCatalog(Base):
    __tablename__ = "course_catalog"

    id = Column(Integer, primary_key=True, index=True)
    degree = Column(String, nullable=False)
    course = Column(String, nullable=False)
    semester = Column(Integer, nullable=False)
    subject_code = Column(String, nullable=False)
    subject_name = Column(String, nullable=False)
    credits = Column(Integer)
    professor_name = Column(String)

class Notice(Base):
    __tablename__ = "notices"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    category = Column(String) # Exam, Holiday, Assignment, etc.
    attachment_url = Column(String)
    attachment_name = Column(String)
    deadline_at = Column(DateTime)
    admin_priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Facility(Base):
    __tablename__ = "facilities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text)
    category = Column(String) # Hostel, Library, Healthcare, etc.
    contact_details = Column(String)
    email = Column(String)
    operating_hours = Column(String)
    location = Column(String)
    admin_priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
   


class FacilityContentPhoto(Base):
    __tablename__ = "facility_content_photos"

    id = Column(Integer, primary_key=True)
    content_id = Column(Integer, ForeignKey("facility_content.id"))
    photo_name = Column(String)
    photo_url = Column(String)

    content = relationship("FacilityContent", back_populates="photos")

class FacilityContentPdf(Base):
    __tablename__ = "facility_content_pdfs"

    id = Column(Integer, primary_key=True)
    content_id = Column(Integer, ForeignKey("facility_content.id"))
    pdf_name = Column(String)
    pdf_url = Column(String)

    content = relationship("FacilityContent", back_populates="pdfs")



class ClubEvent(Base):
    __tablename__ = "clubs_events"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text)
    type = Column(String) # Club or Event
    tags = Column(JSON) # ["coding", "sports", "art"]
    contact_person = Column(String)
    event_date = Column(String)
    event_time = Column(String)
    venue = Column(String)
    admin_priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FacultyMember(Base):
    __tablename__ = "faculty_members"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    department = Column(String)
    designation = Column(String)
    email = Column(String)
    phone = Column(String)
    office_location = Column(String)

class ProblemAssistance(Base):
    __tablename__ = "problem_assistance"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String) # e.g., "Finding Classrooms"
    content = Column(Text)
    category = Column(String)
    admin_priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


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


class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resource_id = Column(String, nullable=False)
    action = Column(String, nullable=False)  # like, save, not_relevant
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "resource_id", name="uq_user_resource_feedback"),
    )


class RecommendationChatHistory(Base):
    __tablename__ = "recommendation_chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_message = Column(Text, nullable=False)
    bot_answer = Column(Text, nullable=False)
    results = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RecommendationBehavior(Base):
    __tablename__ = "recommendation_behavior"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resource_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)  # click, view
    event_value = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CalendarDocument(Base):
    __tablename__ = "calendar_documents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # 'academic' or 'holiday'
    pdf_url = Column(String, nullable=False)
    pdf_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AdministrationSection(Base):
    __tablename__ = "administration_sections"

    id = Column(Integer, primary_key=True, index=True)
    section_name = Column(String, nullable=False, index=True)
    sub_section = Column(String, index=True)  # Can be null
    description = Column(Text)
    image_url = Column(String)
    image_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
    category = Column(String, nullable=False) # Science, Social Science, Arts
    pdf_url = Column(String, nullable=False)
    pdf_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AcademicElective(Base):
    __tablename__ = "academic_electives"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False) # Science, Social Science, Arts
    pdf_url = Column(String, nullable=False)
    pdf_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AcademicSectionIncharge(Base):
    __tablename__ = "academic_section_incharge"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False) # Science, Social Science, Arts
    description = Column(Text)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AcademicSwayamCourse(Base):
    __tablename__ = "academic_swayam_courses"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FacilityContent(Base):
    __tablename__ = "facility_content"
    id = Column(Integer, primary_key=True, index=True)
    section = Column(String, nullable=False, index=True)       # e.g. "hostels", "library", "sports"
    category = Column(String, default="", index=True)           # e.g. "national", "mmv", "indoor"
    sub_category = Column(String, default="", index=True)       # e.g. "jyoti_kunj", "outdoor", "vt"
    name = Column(String, default="")                           # for named entities like warden name
    description = Column(Text, default="")
    details = Column(Text, default="")
    pdf_name = Column(String, nullable=True)
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
    pdf_url = Column(String, nullable=True)
    photo_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
