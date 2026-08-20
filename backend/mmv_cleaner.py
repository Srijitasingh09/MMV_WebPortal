"""
mmv_cleaner.py — strips markdown/HTML/DB-field leakage from LLM answers
before they reach the frontend. No dependencies.
"""
import re

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_MD_HEADING_RE = re.compile(r"^#{1,6}\s*", re.MULTILINE)
_MD_BOLD_ITALIC_RE = re.compile(r"(\*\*\*|\*\*|\*|__|_)")
_MD_BULLET_RE = re.compile(r"^\s*[-*+]\s+", re.MULTILINE)
_CODE_FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
_INLINE_CODE_RE = re.compile(r"`([^`]*)`")
_DB_FIELD_RE = re.compile(r"\b([a-z_]+_(?:id|name|type|kunj|no))\s*[:=]\s*", re.IGNORECASE)
_MULTI_BLANKLINE_RE = re.compile(r"\n{3,}")


def clean_for_widget(text: str) -> str:
    """Aggressive clean -- page widget panel has no markdown renderer."""
    if not text:
        return text
    t = _CODE_FENCE_RE.sub("", text)
    t = _HTML_TAG_RE.sub("", t)
    t = _MD_HEADING_RE.sub("", t)
    t = _MD_BULLET_RE.sub("• ", t)
    t = _MD_BOLD_ITALIC_RE.sub("", t)
    t = _INLINE_CODE_RE.sub(r"\1", t)
    t = _DB_FIELD_RE.sub("", t)
    t = _MULTI_BLANKLINE_RE.sub("\n\n", t)
    return t.strip()


def clean_for_main_chat(text: str) -> str:
    """Lighter clean -- MMVerse.jsx already renders markdown, only strip true artifacts."""
    if not text:
        return text
    t = _HTML_TAG_RE.sub("", text)
    t = _DB_FIELD_RE.sub("", t)
    t = _MULTI_BLANKLINE_RE.sub("\n\n", t)
    return t.strip()
