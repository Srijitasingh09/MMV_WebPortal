"""
check_query_expansion.py

Prints exactly what expand_query() generates for a few known-problem
questions. This bypasses nothing — it calls the REAL function from main.py,
so whatever bug is in there will show up here directly.

Run from the backend/ folder:
    python check_query_expansion.py
"""

from main import expand_query

TEST_QUESTIONS = [
    "who is chief proctor",
    "who is student advisor",
    "who is dean of students",
    "who is VC",
]

for q in TEST_QUESTIONS:
    variants = expand_query(q)
    print(f'\nOriginal: "{q}"')
    for v in variants:
        print(f'  -> "{v}"')