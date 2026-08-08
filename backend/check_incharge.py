from dotenv import load_dotenv
load_dotenv()
from database import SessionLocal
from sqlalchemy import text
import json

db = SessionLocal()
rows = db.execute(text("""
    SELECT section, category, details
    FROM facility_content
    WHERE category LIKE '%section-incharge%'
""")).fetchall()
for r in rows:
    print(f"\n{r.section}/{r.category}")
    if r.details:
        try:
            d = json.loads(r.details)
            print(f"  has profile key: {'profile' in d}")
            print(f"  columns: {d.get('columns')}")
            print(f"  rows (first): {d.get('rows', [])[:2]}")
        except:
            print(f"  raw: {r.details[:100]}")
    else:
        print("  no details")
db.close()