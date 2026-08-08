"""
check_index_coverage.py

Since terminal output from the last reindex is gone, this checks the
database directly to see which facility_content pages actually made it
into the search index (chat_index_chunk) and which ones got silently
skipped (usually from Voyage API rate-limit/quota failures during
run_initial_index.py).

Run from the backend/ folder:
    python check_index_coverage.py
"""

from sqlalchemy import text
from database import SessionLocal
import models


def main():
    db = SessionLocal()

    rows = db.query(models.FacilityContent).order_by(
        models.FacilityContent.section, models.FacilityContent.category
    ).all()

    missing = []
    covered = []

    for row in rows:
        has_content = bool((row.description or "").strip()) or bool((row.details or "").strip())
        if not has_content:
            continue  # nothing to index anyway, not a failure

        result = db.execute(
            text("SELECT COUNT(*) FROM chat_index_chunk WHERE source_table = 'facility_content' AND source_id = :sid"),
            {"sid": row.id},
        ).scalar()

        if result == 0:
            missing.append(row)
        else:
            covered.append((row, result))

    print(f"Checked {len(rows)} facility_content rows ({len(covered) + len(missing)} have content).\n")

    print("=" * 70)
    print(f"MISSING FROM SEARCH INDEX — likely skipped during reindex ({len(missing)} found)")
    print("=" * 70)
    if not missing:
        print("None — every page with content has at least one chunk. ✅")
    for row in missing:
        print(f"  id={row.id:<5} {row.section}/{row.category}")

    print()
    print("=" * 70)
    print(f"SUCCESSFULLY INDEXED ({len(covered)} pages)")
    print("=" * 70)
    for row, count in covered:
        print(f"  id={row.id:<5} {row.section}/{row.category:<30} — {count} chunk(s)")

    # Also check total chunk count as a sanity number
    total_chunks = db.execute(text("SELECT COUNT(*) FROM chat_index_chunk")).scalar()
    print(f"\nTotal chunks in chat_index_chunk table: {total_chunks}")

    db.close()


if __name__ == "__main__":
    main()