from database import SessionLocal, engine
from . import models, auth

def seed():
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(models.User).filter(models.User.email == "admin@bhu.ac.in").first():
        print("Database already seeded.")
        return

    # 1. Create Admin
    admin = models.User(
        full_name="Portal Admin",
        email="admin@bhu.ac.in",
        hashed_password=auth.get_password_hash("admin123"),
        is_admin=True,
        department="Computer Science",
        course="B.Tech"
    )
    db.add(admin)

    # 2. Create Sample Student
    student = models.User(
        full_name="Paridhi Singh",
        email="paridhi@student.bhu.ac.in",
        hashed_password=auth.get_password_hash("student123"),
        department="Computer Science",
        faculty="Institute of Science",
        program="Undergraduate",
        degree="B.Tech",
        enrollment_number="BHU2023CS01",
        course="Computer Science",
        current_year=1,
        interests=["Coding", "Artificial Intelligence", "Robotics", "Hackathons"],
        selected_problems=["Finding Classrooms", "Hostel Allotment"]
    )
    db.add(student)

    # 3. Sample Notices
    notices = [
        models.Notice(title="End Semester Examination Schedule", content="The end semester exams will begin from May 15th, 2026.", category="Exam"),
        models.Notice(title="Hackathon 2026 Registration", content="Register for the annual university hackathon by April 30th.", category="Event"),
        models.Notice(title="Holiday Notice: Rama Navami", content="The university will remain closed on April 17th.", category="Holiday")
    ]
    db.add_all(notices)

    # 4. Sample Facilities
    facilities = [
        models.Facility(name="Central Library", description="Main university library with 500k+ books.", category="Library", contact_details="0542-2368174", operating_hours="8 AM - 11 PM", location="Main Campus"),
        models.Facility(name="Sayaji Rao Gaekwad Library", description="Science faculty library.", category="Library", contact_details="0542-2307019", operating_hours="9 AM - 8 PM", location="Opp. Physics Dept"),
        models.Facility(name="Sir Sunderlal Hospital", description="University health centre and multi-speciality hospital.", category="Healthcare", contact_details="0542-2367504", operating_hours="24/7", location="Near BHU Gate"),
        models.Facility(name="Vishvanath Temple (VT)", description="Spiritual heart of BHU.", category="Amenity", operating_hours="4 AM - 9 PM", location="Centre of Campus")
    ]
    db.add_all(facilities)

    # 5. Sample Timetable
    timetable = [
        models.Timetable(day="Monday", degree="B.Tech", branch="Computer Science", subject="Data Structures", time_start="09:00", time_end="10:00", teacher_name="Dr. R.K. Gupta", room_number="CS-101", department="Computer Science", course="Computer Science", year=1),
        models.Timetable(day="Monday", degree="B.Tech", branch="Computer Science", subject="Discrete Mathematics", time_start="10:00", time_end="11:00", teacher_name="Prof. Sharma", room_number="CS-101", department="Computer Science", course="Computer Science", year=1),
        models.Timetable(day="Tuesday", degree="B.Tech", branch="Computer Science", subject="Python Programming", time_start="11:00", time_end="12:00", teacher_name="Dr. Priya", room_number="Lab-1", department="Computer Science", course="Computer Science", year=1)
    ]
    db.add_all(timetable)

    # 6. Clubs & Events
    clubs = [
        models.ClubEvent(name="BHU Coding Club", description="Community for competitive programming and software dev.", type="Club", tags=["coding", "algorithms", "software"]),
        models.ClubEvent(name="Robotics Society", description="Design and build robots.", type="Club", tags=["robotics", "electronics", "ai"]),
        models.ClubEvent(name="Cultural Commitee", description="Organizers of Kashiyatra festival.", type="Club", tags=["dance", "music", "art"])
    ]
    db.add_all(clubs)

    # 7. Problem Assistance
    problems = [
        models.ProblemAssistance(title="Finding Classrooms", content="Use the campus map available at the main gate or check dept notice boards.", category="Navigtion"),
        models.ProblemAssistance(title="Hostel Allotment", content="Visit the Dean of Students office at the Central Office.", category="Hostel")
    ]
    db.add_all(problems)

    db.commit()
    print("Database seeded successfully.")
    db.close()

if __name__ == "__main__":
    seed()
