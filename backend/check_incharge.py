"""Re-index only selected facility_content rows.

Usage from backend/:
    python reindex_facility_ids.py --ids 24
    python reindex_facility_ids.py --ids 24,8,32
    python reindex_facility_ids.py --ids 24 --dry-run

This intentionally does not call index_all() and does not touch notices,
contacts, academic legacy tables, or unrelated facility_content rows.
"""

from __future__ import annotations

import argparse

from database import SessionLocal
import models
from chat_index import index_facility_content_row


def parse_ids(value: str) -> list[int]:
    values = []
    for raw in value.split(","):
        raw = raw.strip()
        if not raw:
            continue
        try:
            number = int(raw)
        except ValueError as exc:
            raise argparse.ArgumentTypeError(f"Invalid facility_content ID: {raw}") from exc
        if number <= 0:
            raise argparse.ArgumentTypeError(f"ID must be positive: {number}")
        values.append(number)
    if not values:
        raise argparse.ArgumentTypeError("Provide at least one facility_content ID")
    return list(dict.fromkeys(values))


def main() -> int:
    parser = argparse.ArgumentParser(description="Re-index selected facility_content IDs only.")
    parser.add_argument(
        "--ids",
        required=True,
        type=parse_ids,
        help="Comma-separated facility_content IDs, for example 24 or 24,8,32",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show matching rows without calling the embedding provider or writing index rows",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        rows = (
            db.query(models.FacilityContent)
            .filter(models.FacilityContent.id.in_(args.ids))
            .order_by(models.FacilityContent.id)
            .all()
        )

        found = {row.id for row in rows}
        missing = [row_id for row_id in args.ids if row_id not in found]
        if missing:
            print(f"Not found in facility_content: {missing}")

        if not rows:
            print("No matching facility_content rows found.")
            return 1

        print(f"Selected rows only: {len(rows)}")
        for row in rows:
            print(f"  id={row.id} ({row.section}/{row.category})")

        if args.dry_run:
            print("Dry run complete; no embeddings or database writes were performed.")
            return 0

        for position, row in enumerate(rows, start=1):
            print(f"\n[{position}/{len(rows)}] Re-indexing facility_content id={row.id}...")
            try:
                index_facility_content_row(row)
                print(f"  Completed id={row.id}")
            except Exception as exc:
                print(f"  FAILED id={row.id}: {exc}")

        print("\nTargeted reindex complete. No other facility_content IDs were processed.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
