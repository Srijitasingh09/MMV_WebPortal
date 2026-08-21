"""Small black-box evaluation runner for the /chat endpoint.

Usage:
    python backend/evaluate_chatbot.py --base-url http://localhost:8000

The cases are intentionally easy to extend per page/document. The script does
not call external providers directly; it exercises the deployed API contract.
"""

import argparse
import json
import sys
from urllib.request import Request, urlopen


CASES = [
    {"question": "What information is available on this page?", "page_url": "/facilities/library/cyber", "expect_page_scoped": True},
    {"question": "Is there a PDF document here?", "page_url": "/academics/syllabus/ug/science", "expect_page_scoped": True},
    {"question": "इस पेज पर क्या जानकारी है?", "page_url": "/administration/principal", "expect_language": "hi"},
    {"question": "Mujhe is page ke baare mein batao", "page_url": "/facilities/hostels/kirtikunj", "expect_language": "hinglish"},
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()
    passed = 0
    for case in CASES:
        body = json.dumps({
            "question": case["question"],
            "page_url": case.get("page_url"),
            "section": case.get("page_url", "/").strip("/").split("/")[0] or None,
        }).encode()
        request = Request(f"{args.base_url.rstrip('/')}/chat", data=body, headers={"Content-Type": "application/json"})
        try:
            with urlopen(request, timeout=30) as response:
                result = json.loads(response.read().decode())
            checks = []
            if "expect_page_scoped" in case:
                checks.append(result.get("page_scoped") is case["expect_page_scoped"])
            if "expect_language" in case:
                checks.append(result.get("language") == case["expect_language"])
            ok = all(checks) if checks else True
            print("PASS" if ok else "FAIL", case["question"], json.dumps(result, ensure_ascii=False)[:300])
            passed += int(ok)
        except Exception as exc:
            print("ERROR", case["question"], exc)
    print(f"{passed}/{len(CASES)} cases passed")
    return 0 if passed == len(CASES) else 1


if __name__ == "__main__":
    sys.exit(main())
