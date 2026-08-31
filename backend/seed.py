import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal, engine
import models, auth

def seed():
    # Create tables
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Only create the admin account if it doesn't already exist
    if db.query(models.User).filter(models.User.email == "supriyamishra.mmv.2024@bhu.ac.in").first():
        print("Admin already exists.")
        db.close()
        return

    admin = models.User(
        full_name="Portal Admin",
        email="supriyamishra.mmv.2024@bhu.ac.in",
        hashed_password=auth.get_password_hash("admin123"),
        is_admin=True,
    )
    db.add(admin)

    db.commit()
    print("Admin user created successfully.")
    db.close()

if __name__ == "__main__":
    seed()