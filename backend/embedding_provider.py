"""Configurable multilingual embedding providers.

Set EMBEDDING_PROVIDER=voyage for the current deployment or local for offline
multilingual development. Switching providers requires a full index rebuild and
matching vector dimensions in the database.
"""

import os

PROVIDER = os.getenv("EMBEDDING_PROVIDER", "voyage").lower()
VOYAGE_MODEL = os.getenv("VOYAGE_EMBED_MODEL", "voyage-4-lite")
LOCAL_MODEL = os.getenv("LOCAL_EMBEDDING_MODEL", "intfloat/multilingual-e5-small")

_voyage = None
_local = None


def _get_voyage():
    global _voyage
    if _voyage is None:
        import voyageai
        _voyage = voyageai.Client()
    return _voyage


def _get_local():
    global _local
    if _local is None:
        from sentence_transformers import SentenceTransformer
        _local = SentenceTransformer(LOCAL_MODEL)
    return _local


def embed(texts: list[str], input_type: str = "document"):
    if not texts:
        return []
    if PROVIDER == "local":
        prefix = "passage: " if input_type == "document" else "query: "
        return _get_local().encode(
            [prefix + text for text in texts],
            normalize_embeddings=True,
            convert_to_numpy=True,
        ).tolist()
    result = _get_voyage().embed(texts=texts, model=VOYAGE_MODEL, input_type=input_type)
    return result.embeddings


def provider_status():
    return {
        "provider": PROVIDER,
        "model": LOCAL_MODEL if PROVIDER == "local" else VOYAGE_MODEL,
    }
