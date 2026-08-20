"""
mmv_rate_limit.py — per-IP rate limiting + a global concurrency cap on LLM
calls, so 2000+ students degrade gracefully instead of crashing the process.

Starts as in-memory (zero new infra, fine for a single-process deploy).
When you move to multiple worker processes/machines, swap the two internal
dicts for Redis (INCR + EXPIRE / a semaphore key) -- the public functions
below (check_rate_limit, llm_slot) keep the same signature either way.
"""
import threading
import time
from collections import defaultdict, deque

_lock = threading.Lock()
_requests_by_key: dict[str, deque] = defaultdict(deque)

RATE_LIMIT_PER_MIN = 20
WINDOW_SECONDS = 60


class RateLimitExceeded(Exception):
    pass


def check_rate_limit(user_key: str, limit_per_min: int = RATE_LIMIT_PER_MIN):
    now = time.monotonic()
    with _lock:
        dq = _requests_by_key[user_key]
        while dq and dq[0] < now - WINDOW_SECONDS:
            dq.popleft()
        if len(dq) >= limit_per_min:
            raise RateLimitExceeded(f"{len(dq)}/{limit_per_min} requests/min")
        dq.append(now)


# Global concurrency cap on outbound LLM calls -- bounds how many Groq
# requests are in flight at once. Extra requests block briefly on the
# semaphore (FastAPI's threadpool queues them) instead of firing 2000
# simultaneous upstream calls.
MAX_CONCURRENT_LLM_CALLS = 40
_llm_semaphore = threading.Semaphore(MAX_CONCURRENT_LLM_CALLS)


def llm_slot():
    """Use as: `with llm_slot(): ...call groq...`"""
    return _llm_semaphore


# --- tiny in-memory FAQ cache (swap for Redis SETEX when you scale out) ---
_cache: dict[str, tuple[str, float]] = {}
_CACHE_TTL_SECONDS = 3600


def cached_answer(cache_key: str):
    entry = _cache.get(cache_key)
    if not entry:
        return None
    answer, expires_at = entry
    if time.monotonic() > expires_at:
        _cache.pop(cache_key, None)
        return None
    return answer


def set_cached_answer(cache_key: str, answer: str, ttl_seconds: int = _CACHE_TTL_SECONDS):
    _cache[cache_key] = (answer, time.monotonic() + ttl_seconds)
