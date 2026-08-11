"""
check_remaining_issues.py (v2)

Fixed from the first version, which only tested the RAW question's
similarity — not what /chat actually does. The real endpoint searches all
3 expand_query() variants together and picks the single best match across
them, so testing only the raw question misses cases where a REPHRASED
variant is what actually wins (and might be wrong).

This version calls the real search_best_chunk() directly — the exact same
function your live /chat endpoint uses — so whatever it returns here is
EXACTLY what the chatbot would answer with. No guessing, no reimplementing.

Also fixed: proper throttling between questions to respect Voyage's 3
requests/minute free-tier limit (the first version had none and crashed
after 3 rapid calls). search_best_chunk batches all 3 query variants into
ONE Voyage call internally, so this uses exactly 1 call per question.

Run from the backend/ folder — takes about 3 minutes for 7 questions:
    python check_remaining_issues.py
"""

import time
from database import SessionLocal
from main import expand_query, search_best_chunk

TEST_QUESTIONS = [
    ("electives (broken)",           "what electives are there"),
    ("electives (worked)",           "electives"),
    ("academic calendar (broken)",   "academic calendar"),
    ("academic calendar (worked)",   "academic calendar of 2026"),
    ("canteen in mmv",               "canteen in mmv"),
    ("controller of exam MMV",       "controller of examination of MMV"),
    ("admin warden jyoti kunj",      "who is admin warden of jyoti kunj"),
]


def main():
    db = SessionLocal()

    for i, (label, question) in enumerate(TEST_QUESTIONS):
        if i > 0:
            time.sleep(22)  # respect Voyage's 3 RPM free-tier limit

        print("\n" + "=" * 90)
        print(f"{label}: \"{question}\"")
        print("=" * 90)

        variants = expand_query(question)
        print("\nQuery expansion produced:")
        for v in variants:
            print(f'  -> "{v}"')

        # This is the EXACT function your live /chat endpoint calls.
        row, similarity = search_best_chunk(variants, db)

        print(f"\nACTUAL production winner (similarity={similarity:.4f}):")
        if row:
            preview = (row.chunk_text or "")[:200].replace("\n", " ")
            print(f"  {row.section_url}  [{row.content_type}]")
            print(f"  \"{preview}...\"")
            below_threshold = similarity < 0.35
            print(f"  {'⚠️  BELOW 0.35 threshold — would show as not-found' if below_threshold else '✅ above threshold, this is what gets answered'}")
        else:
            print("  No match found at all.")

    db.close()


if __name__ == "__main__":
    main()