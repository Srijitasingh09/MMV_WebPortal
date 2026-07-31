"""
run_initial_index.py — run this ONCE to build the search index for the first time.

USAGE:
    cd backend
    python run_initial_index.py

After this runs successfully, you don't need to run it again — Stage D's
sync hooks will keep the index updated automatically as admins add/edit content.
"""

from dotenv import load_dotenv
load_dotenv()  # must happen before chat_index.py is imported, since it creates the Voyage client at import time

from database import SessionLocal
from chat_index import index_all

db = SessionLocal()
try:
    index_all(db)
finally:
    try:
        db.close()
    except Exception:
        pass  # connection may already be dead by this point — harmless, nothing left to clean up