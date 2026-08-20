"""
mmv_language.py — Hindi / Hinglish / English detection for the chatbot.

Sync, no dependencies beyond `indic-transliteration` (add to requirements.txt).
Import directly in main.py: `from mmv_language import detect_language, reply_style_instruction`
"""
import re
from dataclasses import dataclass

try:
    from indic_transliteration import sanscript
    from indic_transliteration.sanscript import transliterate
    _HAS_TRANSLIT = True
except ImportError:
    _HAS_TRANSLIT = False

DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")

HINGLISH_MARKERS = {
    "kya", "hai", "kaise", "kahan", "kab", "kyu", "kyun", "mujhe", "mera",
    "meri", "hostel", "kaunsa", "kitna", "batao", "chahiye", "milega",
    "warden", "kunj", "fee", "fees", "admission", "form",
}


@dataclass
class LanguageResult:
    original: str
    script: str            # "devanagari" | "roman"
    language: str           # "hindi" | "english" | "hinglish"
    retrieval_variant: str   # alternate-script version, used as a 2nd search attempt


def detect_language(query: str) -> LanguageResult:
    q = query.strip()
    if DEVANAGARI_RE.search(q):
        return LanguageResult(q, "devanagari", "hindi", q)

    tokens = re.findall(r"[a-zA-Z']+", q.lower())
    is_hinglish = any(t in HINGLISH_MARKERS for t in tokens)

    if not is_hinglish:
        return LanguageResult(q, "roman", "english", q)

    variant = q
    if _HAS_TRANSLIT:
        try:
            variant = transliterate(q, sanscript.ITRANS, sanscript.DEVANAGARI)
        except Exception:
            variant = q

    return LanguageResult(q, "roman", "hinglish", variant)


def reply_style_instruction(lang: LanguageResult) -> str:
    if lang.language == "hindi":
        return "Reply in Hindi (Devanagari script), in a natural, friendly tone."
    if lang.language == "hinglish":
        return (
            "Reply in Hinglish (Roman-script, code-mixed Hindi/English) to "
            "match the student's own style. Do not force a pure-English or "
            "pure-Hindi reply."
        )
    return "Reply in English."
