# save as check_which_db.py
from dotenv import load_dotenv
load_dotenv()
import os
from database import SessionLocal
from sqlalchemy import text

print("DATABASE_URL:", os.getenv("DATABASE_URL", "NOT SET")[:60], "...")

db = SessionLocal()
count = db.execute(text("SELECT COUNT(*) FROM facility_content")).scalar()
print(f"facility_content rows: {count}")
db.close()