"""Runtime helpers for the production chatbot path.

These helpers are intentionally dependency-light. Redis can replace the in-memory
cache/limiter later without changing the /chat contract.
"""

from collections import defaultdict, deque
import json
import os
from functools import lru_cache
import html
import re
import threading
import time
from contextlib import contextmanager


CHAT_CACHE_VERSION = "text-only-page-scoped-v2"
CACHE_TTL_SECONDS = 300
MAX_CACHE_ITEMS = 2048
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_REQUESTS = int(os.getenv("CHAT_RATE_LIMIT_REQUESTS", "30"))

_cache = {}
_rate_windows = defaultdict(deque)
_lock = threading.Lock()
_provider_slots = threading.BoundedSemaphore(int(os.getenv("CHAT_PROVIDER_CONCURRENCY", "8")))
try:
    import redis
    _redis = redis.from_url(os.getenv("REDIS_URL"), decode_responses=True) if os.getenv("REDIS_URL") else None
except Exception:
    _redis = None


def detect_language(text: str) -> str:
    value = text or ""
    if re.search(r"[\u0900-\u097F]", value):
        return "hi"
    roman_hindi = re.search(
        r"\b(kya|kaise|ka|ki|ke|hai|hain|mujhe|chahiye|kahan|kab|kyun|kr|karna|mein|me|aur|ya|se)\b",
        value.lower(),
    )
    return "hinglish" if roman_hindi else "en"


def language_instruction(language: str) -> str:
    return {
        "hi": "उत्तर हिंदी में दें, प्राकृतिक और सरल भाषा में।",
        "hinglish": "Reply in the same natural Hinglish style as the student, using Roman Hindi where appropriate.",
        "en": "Reply in clear, natural English.",
    }.get(language, "Reply naturally in the student's language.")


def clean_answer(value: str) -> str:
    """Remove backend/markdown artifacts while preserving readable line breaks."""
    text = html.unescape(str(value or ""))
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"```(?:markdown|text|html|plain)?", "", text, flags=re.I)
    text = text.replace("```", "")
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"(?m)^\s*(?:answer|response|retrieved information)\s*:\s*", "", text, flags=re.I)
    text = re.sub(r"(?m)^\s*#{1,6}\s*", "", text)
    text = re.sub(r"(?m)^\s*[<>]+\s*", "", text)
    text = re.sub(r"(?m)^\s*\+{3,}\s*$", "", text)
    text = re.sub(r"(?m)^\s*\|?\s*[-:| ]{3,}\s*\|?\s*$", "", text)
    text = re.sub(r"/uploads/[^\s)]+", "the linked document", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def normalize_page_url(value: str) -> str | None:
    if not value:
        return None
    path = "/" + str(value).strip().split("?", 1)[0].split("#", 1)[0].strip("/")
    return "/" if path == "//" else path


def page_title_from_url(page_url: str | None) -> str:
    if not page_url or page_url == "/":
        return "MMV home page"
    last = page_url.rstrip("/").split("/")[-1].replace("-", " ").replace("_", " ")
    return " ".join(word.capitalize() for word in last.split()) or "this page"


@contextmanager
def provider_slot(timeout: float = 12.0):
    acquired = _provider_slots.acquire(timeout=timeout)
    if not acquired:
        raise RuntimeError("The assistant is handling many requests. Please try again shortly.")
    try:
        yield
    finally:
        _provider_slots.release()


def allow_request(client_key: str, limit: int = RATE_LIMIT_REQUESTS) -> bool:
    if _redis:
        key = f"mmv:chat:rate:{client_key}"
        try:
            count = _redis.incr(key)
            if count == 1:
                _redis.expire(key, RATE_LIMIT_WINDOW_SECONDS)
            return count <= limit
        except Exception:
            pass
    now = time.monotonic()
    with _lock:
        window = _rate_windows[client_key]
        while window and now - window[0] > RATE_LIMIT_WINDOW_SECONDS:
            window.popleft()
        if len(window) >= limit:
            return False
        window.append(now)
        return True


def cache_get(key: str):
    if _redis:
        try:
            cached = _redis.get(f"mmv:chat:cache:{key}")
            return json.loads(cached) if cached else None
        except Exception:
            pass
    now = time.monotonic()
    with _lock:
        item = _cache.get(key)
        if not item:
            return None
        expires_at, value = item
        if expires_at <= now:
            _cache.pop(key, None)
            return None
        return value


def cache_set(key: str, value):
    if _redis:
        try:
            _redis.setex(f"mmv:chat:cache:{key}", CACHE_TTL_SECONDS, json.dumps(value, ensure_ascii=False))
            return
        except Exception:
            pass
    with _lock:
        if len(_cache) >= MAX_CACHE_ITEMS:
            oldest = next(iter(_cache), None)
            if oldest:
                _cache.pop(oldest, None)
        _cache[key] = (time.monotonic() + CACHE_TTL_SECONDS, value)


def cache_key(question: str, section: str | None, page_url: str | None, language: str) -> str:
    return "|".join((CHAT_CACHE_VERSION, language, section or "", page_url or "", re.sub(r"\s+", " ", question.lower()).strip()))
