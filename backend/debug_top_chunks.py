"""
debug_widget_query.py — bypasses the HTTP endpoint and calls the same
functions directly, printing the raw similarity score and matched row
so we can see WHY it's returning no_info instead of guessing blind.

Usage:
    python debug_widget_query.py
"""
from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal
from main import classify_question, expand_query, search_best_chunk

QUERY = "library timings"
PAGE_ID = "facilities/library/central"

db = SessionLocal()
try:
    intent = classify_question(QUERY)
    print(f"classify_question -> {intent!r}")

    queries = expand_query(QUERY)
    print(f"expand_query -> {queries!r}")

    row, similarity = search_best_chunk(queries, db, section_filter=PAGE_ID)
    print(f"\nbest similarity: {similarity}")
    if row:
        print(f"section_url:   {row.section_url!r}")
        print(f"section_title: {row.section_title!r}")
        print(f"content_type:  {row.content_type!r}")
        print(f"chunk_text:    {row.chunk_text[:200]!r}")
    else:
        print("No row matched at all (section_filter excluded everything).")

    # Also try with NO section filter, to isolate: is it a threshold problem
    # or a section_filter matching problem?
    row2, sim2 = search_best_chunk(queries, db, section_filter=None)
    print(f"\n--- same query, NO section filter ---")
    print(f"best similarity: {sim2}")
    if row2:
        print(f"section_url: {row2.section_url!r}")
        print(f"chunk_text:  {row2.chunk_text[:200]!r}")
finally:
    db.close()