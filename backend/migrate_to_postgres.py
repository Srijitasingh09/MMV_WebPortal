"""
One-time migration script: copies all data from the old SQLite database
(college_portal.db) into the new Supabase Postgres database.

HOW TO USE:
1. Place this file inside your backend/ folder (same folder as database.py
   and models.py), so the imports below work.
2. Make sure college_portal.db (the OLD sqlite file with your real data)
   is also in that same folder.
3. Make sure your .env DATABASE_URL already points to Supabase Postgres
   (this is what your app currently uses).
4. Run:  python migrate_to_postgres.py
5. Read the printed summary at the end. It tells you how many rows were
   copied per table, and lists any rows that failed.

This script is SAFE TO RE-RUN: it checks for existing primary keys in
Postgres before inserting, so running it twice will not create duplicates
(it will just skip rows that are already there).
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import your actual models so we reuse the real table definitions
from models import (
    User,
    Notice,
    News,
    CollegeInfoItem,
    AdministrationSection,
    AcademicNEP,
    AcademicSyllabus,
    AcademicElective,
    AcademicSectionIncharge,
    AcademicSwayamCourse,
    FacilityContent,
    FacilityContentPhoto,
    FacilityContentPdf,
    ContactInfo,
    EmergencyContact,
)

# ── 1. Set up two separate connections ──

SQLITE_PATH = "sqlite:///./college_portal.db"
POSTGRES_URL = os.getenv("DATABASE_URL")

if not POSTGRES_URL or "postgres" not in POSTGRES_URL:
    raise SystemExit(
        "DATABASE_URL is not set to a Postgres URL. "
        "Check your .env file before running this script."
    )

sqlite_engine = create_engine(SQLITE_PATH, connect_args={"check_same_thread": False})
postgres_engine = create_engine(POSTGRES_URL)

SqliteSession = sessionmaker(bind=sqlite_engine)
PostgresSession = sessionmaker(bind=postgres_engine)

sqlite_db = SqliteSession()
postgres_db = PostgresSession()

# ── 2. Order matters: parents before children ──
# FacilityContent must be migrated before FacilityContentPhoto/Pdf,
# since those two reference content_id as a foreign key.

MODELS_IN_ORDER = [
    User,
    Notice,
    News,
    CollegeInfoItem,
    AdministrationSection,
    AcademicNEP,
    AcademicSyllabus,
    AcademicElective,
    AcademicSectionIncharge,
    AcademicSwayamCourse,
    FacilityContent,
    FacilityContentPhoto,
    FacilityContentPdf,
    ContactInfo,
    EmergencyContact,
]


def copy_table(model):
    """Copies all rows for one model from SQLite into Postgres.
    Skips rows whose primary key already exists in Postgres (safe to re-run)."""
    table_name = model.__tablename__
    rows = sqlite_db.query(model).all()

    if not rows:
        print(f"  {table_name}: 0 rows in SQLite, nothing to copy.")
        return 0, 0

    # Find which primary keys already exist in Postgres, so we don't duplicate
    existing_ids = {
        row.id for row in postgres_db.query(model.id).all()
    }

    copied = 0
    skipped = 0
    failed = []

    for row in rows:
        if row.id in existing_ids:
            skipped += 1
            continue

        # Build a fresh instance of the model from the old row's columns
        data = {
            col.name: getattr(row, col.name)
            for col in model.__table__.columns
        }
        new_row = model(**data)

        try:
            postgres_db.add(new_row)
            postgres_db.commit()
            copied += 1
        except Exception as e:
            postgres_db.rollback()
            failed.append((row.id, str(e)))

    print(f"  {table_name}: copied {copied}, skipped {skipped} (already existed)")
    if failed:
        print(f"    FAILED rows in {table_name}:")
        for row_id, err in failed:
            print(f"      id={row_id} -> {err}")

    return copied, skipped


def main():
    print("Starting migration: SQLite -> Postgres (Supabase)\n")

    total_copied = 0
    total_skipped = 0

    for model in MODELS_IN_ORDER:
        copied, skipped = copy_table(model)
        total_copied += copied
        total_skipped += skipped

    print("\nDone.")
    print(f"Total rows copied: {total_copied}")
    print(f"Total rows skipped (already in Postgres): {total_skipped}")
    print(
        "\nNext step: open Supabase -> Table Editor and spot-check a couple "
        "of tables to confirm the row counts and data look right."
    )

    sqlite_db.close()
    postgres_db.close()


if __name__ == "__main__":
    main()