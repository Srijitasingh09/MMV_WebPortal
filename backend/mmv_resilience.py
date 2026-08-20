"""
mmv_resilience.py — sync retry + circuit breaker for Groq/Voyage calls.

Your existing chat_index.py and main.py already hand-roll retry logic in
two different places (embed_text's 10s/20s/30s backoff, search_best_chunk's
0/2/4s backoff). This module generalizes that pattern so the NEW endpoints
(page widget) get the same protection without copy-pasting it a third time.
It does not touch your existing retry code -- that keeps working as-is.
"""
import random
import time
from dataclasses import dataclass


class FallbackNeeded(Exception):
    """Raised when a call could not succeed after retries -- caller should
    return a graceful message instead of a 500."""


@dataclass
class CircuitBreaker:
    failure_threshold: int = 5
    reset_after_seconds: float = 30.0
    _failures: int = 0
    _open_until: float = 0.0

    def is_open(self) -> bool:
        return time.monotonic() < self._open_until

    def record_success(self):
        self._failures = 0
        self._open_until = 0.0

    def record_failure(self):
        self._failures += 1
        if self._failures >= self.failure_threshold:
            self._open_until = time.monotonic() + self.reset_after_seconds


llm_breaker = CircuitBreaker()
vector_db_breaker = CircuitBreaker()
embedding_breaker = CircuitBreaker()


def call_with_resilience(fn, *args, breaker: CircuitBreaker, max_retries=2, base_backoff=0.5, **kwargs):
    """
    fn: a plain sync callable (e.g. voyage_client.embed, groq chat.completions.create).
    FastAPI's `def` (non-async) endpoints already run in a threadpool, so a
    blocking call here doesn't block the event loop -- no asyncio needed.
    """
    if breaker.is_open():
        raise FallbackNeeded("circuit_open")

    last_exc = None
    for attempt in range(max_retries + 1):
        try:
            result = fn(*args, **kwargs)
            breaker.record_success()
            return result
        except Exception as exc:
            last_exc = exc
            breaker.record_failure()
            if attempt < max_retries:
                time.sleep((2 ** attempt) * base_backoff + random.uniform(0, 0.3))
            continue

    raise FallbackNeeded(str(last_exc)) from last_exc


FALLBACK_MESSAGE = (
    "Sorry, I'm having trouble reaching the answer service right now. "
    "Please try again in a moment."
)
