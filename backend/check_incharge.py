"""
reindex_row.py — re-index ONE facility_content row by id.

Usage:
    python reindex_row.py 22

This calls the exact same function your admin panel triggers on save
(sync_facility_content_by_id), so it's safe to run any time -- it deletes
and rebuilds just that row's chunks, nothing else.

Will take a little while: each chunk needs its own Voyage embedding call,
and your free-tier rate limit means chat_index.py deliberately waits
between calls. A PDF with real content now produces several chunks (one
per ~300-word page section) instead of the old single filename chunk, so
expect this to take longer than it used to for PDF-heavy rows.
"""
import sys
from dotenv import load_dotenv
load_dotenv()  # must happen before chat_index.py is imported

from chat_index import sync_facility_content_by_id

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python reindex_row.py <facility_content_id>")
        sys.exit(1)
    row_id = int(sys.argv[1])
    print(f"Re-indexing facility_content id={row_id} ...")
    sync_facility_content_by_id(row_id)
    print("Done.")