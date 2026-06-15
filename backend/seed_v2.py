from .database import SessionLocal, engine
import models
import auth

def seed_v2():
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    db.query(models.CourseCatalog).delete()
    db.query(models.FacultyMember).delete()
    db.query(models.Timetable).delete()

    # 2. Syllabus-driven course catalog (B.Sc., M.Sc., MCA)
    catalog_rows = [
        # B.Sc. (Hons.) Computer Science
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 1, "subject_code": "CS101", "subject_name": "Problem Solving through C Programming", "credits": 6, "professor_name": "Dr. A. K. Singh"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 2, "subject_code": "CS102", "subject_name": "Digital Logic and Circuits", "credits": 6, "professor_name": "Prof. S. R. Sharma"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 3, "subject_code": "CS103", "subject_name": "Numerical Computing", "credits": 6, "professor_name": "Dr. Priya Roy"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 4, "subject_code": "CS104", "subject_name": "Computer Organization and Architecture", "credits": 6, "professor_name": "Prof. R. Tiwari"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 5, "subject_code": "CS106", "subject_name": "Operating System Concepts", "credits": 4, "professor_name": "Dr. K. Mishra"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 5, "subject_code": "CS107", "subject_name": "Database Management Systems", "credits": 6, "professor_name": "Prof. A. Srivastava"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 5, "subject_code": "CS108", "subject_name": "Data Structures and Algorithms", "credits": 6, "professor_name": "Dr. M. Verma"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 5, "subject_code": "CS110", "subject_name": "System Analysis and Design", "credits": 4, "professor_name": "Prof. Vikas Gupta"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 6, "subject_code": "CS105", "subject_name": "Discrete Mathematics", "credits": 4, "professor_name": "Dr. P. Sinha"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 6, "subject_code": "CS109", "subject_name": "Data Communication", "credits": 4, "professor_name": "Prof. N. Jha"},
        {"degree": "B.Sc. (Hons.)", "course": "Computer Science", "semester": 6, "subject_code": "CS502", "subject_name": "UG Project", "credits": 12, "professor_name": "Project Supervisor"},

        # M.Sc. Computer Science
        {"degree": "M.Sc.", "course": "Computer Science", "semester": 1, "subject_code": "CS201", "subject_name": "Probability and Statistics for Computer Science", "credits": 4, "professor_name": "Dr. Priya Roy"},
        {"degree": "M.Sc.", "course": "Computer Science", "semester": 1, "subject_code": "CS202", "subject_name": "Theory of Computation", "credits": 3, "professor_name": "Prof. Amit Kumar"},
        {"degree": "M.Sc.", "course": "Computer Science", "semester": 1, "subject_code": "CS204", "subject_name": "Object Oriented Programming", "credits": 5, "professor_name": "Prof. Vikas Gupta"},
        {"degree": "M.Sc.", "course": "Computer Science", "semester": 1, "subject_code": "CS206", "subject_name": "Computer Networks", "credits": 4, "professor_name": "Dr. Neeraj"},
        {"degree": "M.Sc.", "course": "Computer Science", "semester": 2, "subject_code": "CS203", "subject_name": "Design and Analysis of Algorithms", "credits": 4, "professor_name": "Dr. M. Verma"},
        {"degree": "M.Sc.", "course": "Computer Science", "semester": 2, "subject_code": "CS208", "subject_name": "Artificial Intelligence", "credits": 4, "professor_name": "Dr. S. Ghosh"},
        {"degree": "M.Sc.", "course": "Computer Science", "semester": 3, "subject_code": "CS207", "subject_name": "Compiler Design", "credits": 4, "professor_name": "Prof. R. Tiwari"},
        {"degree": "M.Sc.", "course": "Computer Science", "semester": 3, "subject_code": "CS209", "subject_name": "Machine Learning", "credits": 5, "professor_name": "Dr. S. Ghosh"},

        # MCA
        {"degree": "MCA", "course": "Computer Science", "semester": 1, "subject_code": "CS108", "subject_name": "Data Structures and Algorithms", "credits": 6, "professor_name": "Dr. M. Verma"},
        {"degree": "MCA", "course": "Computer Science", "semester": 1, "subject_code": "CS204", "subject_name": "Object Oriented Programming", "credits": 5, "professor_name": "Prof. Vikas Gupta"},
        {"degree": "MCA", "course": "Computer Science", "semester": 1, "subject_code": "CS205", "subject_name": "Software Engineering", "credits": 3, "professor_name": "Prof. A. Srivastava"},
        {"degree": "MCA", "course": "Computer Science", "semester": 1, "subject_code": "CS206", "subject_name": "Computer Networks", "credits": 4, "professor_name": "Dr. Neeraj"},
        {"degree": "MCA", "course": "Computer Science", "semester": 2, "subject_code": "CS107", "subject_name": "Database Management Systems", "credits": 6, "professor_name": "Prof. A. Srivastava"},
        {"degree": "MCA", "course": "Computer Science", "semester": 2, "subject_code": "CS208", "subject_name": "Artificial Intelligence", "credits": 4, "professor_name": "Dr. S. Ghosh"},
        {"degree": "MCA", "course": "Computer Science", "semester": 3, "subject_code": "CS209", "subject_name": "Machine Learning", "credits": 5, "professor_name": "Dr. S. Ghosh"},
    ]

    for row in catalog_rows:
        db.add(models.CourseCatalog(**row))

    professor_names = sorted({row["professor_name"] for row in catalog_rows if row.get("professor_name") and row["professor_name"] != "Project Supervisor"})
    for idx, name in enumerate(professor_names, start=1):
        db.add(models.FacultyMember(
            name=name,
            department="Computer Science",
            designation="Professor",
            email=f"faculty{idx}@bhu.ac.in",
            phone="",
            office_location="CS Department"
        ))

    # 3. Timetable starter rows for each year (editable by admin later)
    timetable_rows = [
        {"day": "Monday", "degree": "B.Sc. (Hons.)", "branch": "Computer Science", "subject": "Problem Solving through C Programming", "time_start": "09:00", "time_end": "10:00", "teacher_name": "Dr. A. K. Singh", "room_number": "CS-101", "department": "Computer Science", "course": "Computer Science", "year": 1},
        {"day": "Tuesday", "degree": "B.Sc. (Hons.)", "branch": "Computer Science", "subject": "Digital Logic and Circuits", "time_start": "10:00", "time_end": "11:00", "teacher_name": "Prof. S. R. Sharma", "room_number": "CS-102", "department": "Computer Science", "course": "Computer Science", "year": 1},
        {"day": "Wednesday", "degree": "M.Sc.", "branch": "Computer Science", "subject": "Object Oriented Programming", "time_start": "11:00", "time_end": "12:00", "teacher_name": "Prof. Vikas Gupta", "room_number": "Lab-B", "department": "Computer Science", "course": "Computer Science", "year": 2},
        {"day": "Thursday", "degree": "MCA", "branch": "Computer Science", "subject": "Machine Learning", "time_start": "14:00", "time_end": "15:00", "teacher_name": "Dr. S. Ghosh", "room_number": "CS-301", "department": "Computer Science", "course": "Computer Science", "year": 3},
    ]
    for row in timetable_rows:
        db.add(models.Timetable(**row))

    # 4. Migration-safe upsert for Clubs/Events with event schedule demo fields
    items = [
        {
            "name": "BHU IoT Hub",
            "description": "Explore sensors and connectivity.",
            "type": "Club",
            "tags": ["iot", "electronics", "hardware"],
            "contact_person": "iot@bhu.ac.in",
            "event_date": "",
            "event_time": "",
            "venue": "",
            "admin_priority": 2,
        },
        {
            "name": "Blockchain Miners",
            "description": "Learn about decentralized finance and smart contracts.",
            "type": "Club",
            "tags": ["blockchain", "crypto", "finance"],
            "contact_person": "blockchain@bhu.ac.in",
            "event_date": "",
            "event_time": "",
            "venue": "",
            "admin_priority": 2,
        },
        {
            "name": "Stats & Data",
            "description": "Community for data science and statistics.",
            "type": "Club",
            "tags": ["stats", "data", "math"],
            "contact_person": "stats@bhu.ac.in",
            "event_date": "",
            "event_time": "",
            "venue": "",
            "admin_priority": 1,
        },
        {
            "name": "Design Thinking",
            "description": "HCI and user experience community.",
            "type": "Club",
            "tags": ["design", "ui", "ux", "human-centered"],
            "contact_person": "design@bhu.ac.in",
            "event_date": "",
            "event_time": "",
            "venue": "",
            "admin_priority": 1,
        },
        {
            "name": "Placement Sprint 2026",
            "description": "Resume clinic and mock interview day for final-year students.",
            "type": "Event",
            "tags": ["placement", "career", "interview"],
            "contact_person": "placementcell@bhu.ac.in",
            "event_date": "2026-05-10",
            "event_time": "10:00 AM",
            "venue": "Training and Placement Cell",
            "admin_priority": 5,
        },
        {
            "name": "Admission Help Desk Live",
            "description": "One-stop guidance for admission process and document checks.",
            "type": "Event",
            "tags": ["admission", "helpdesk", "forms"],
            "contact_person": "admissions@bhu.ac.in",
            "event_date": "2026-05-01",
            "event_time": "11:30 AM",
            "venue": "Central Office",
            "admin_priority": 5,
        },
    ]

    for item in items:
        existing = db.query(models.ClubEvent).filter(models.ClubEvent.name == item["name"]).first()
        if existing:
            for key, value in item.items():
                setattr(existing, key, value)
        else:
            db.add(models.ClubEvent(**item))

    db.commit()
    print("Database seeded with syllabus-aligned course catalog, professors, and timetable.")
    db.close()

if __name__ == "__main__":
    seed_v2()
