"""
mmv_pdf_ingest.py — real PDF text extraction + chunking (requirements #5, #6).

Your current chat_index.py indexes PDFs by FILENAME only (see
index_facility_content_row: `_readable_name_from_filename(pdf_name)` then
one save_chunk() call per PDF). This module adds a SECOND indexing path
that reads the actual PDF text and creates multiple page-level chunks with
real content -- additive, doesn't remove the filename-level chunk (keeping
that is actually useful: it lets broad "show me the syllabus PDF" queries
still surface the file even before/without full-text indexing).

Usage from chat_index.py or a one-off script:

    from mmv_pdf_ingest import index_pdf_content
    index_pdf_content(
        source_table="facility_content", source_id=row.id,
        pdf_path="/absolute/path/to/uploads/xyz.pdf",
        pdf_url=pdf.pdf_url, section_url=url, section_title=title,
    )
"""
import re

import fitz  # PyMuPDF

# Word-count based chunking (not a real tokenizer) -- deliberately avoids
# tiktoken, which needs to download its BPE file from an external URL on
# first use and will fail on a server with restricted outbound access.
# ~1 word ≈ 1.3 tokens for English/Hindi mixed text, so 400 tokens ≈ 300 words.
CHUNK_WORDS = 300
OVERLAP_WORDS = 45
_HEADING_LEN_MAX = 80


def is_text_pdf(path: str, min_chars_per_page: int = 20) -> bool:
    """Returns False for scanned/image-only PDFs -- skip them (no OCR, per spec)."""
    doc = fitz.open(path)
    try:
        sample = doc[: min(3, len(doc))]
        avg_chars = sum(len(p.get_text()) for p in sample) / max(len(sample), 1)
        return avg_chars >= min_chars_per_page
    finally:
        doc.close()


def _guess_heading(line: str) -> bool:
    line = line.strip()
    if not line or len(line) > _HEADING_LEN_MAX:
        return False
    if line.isupper() and len(line.split()) <= 12:
        return True
    if re.match(r"^\d+(\.\d+)*\s+[A-Z]", line):
        return True
    return False


def _column_aware_text(page, gap_ratio: float = 0.08) -> str:
    """
    Reconstructs natural reading order for multi-column layouts (trifold
    brochures, newsletters). Plain page.get_text("text") reads blocks in
    PDF-internal order, which frequently interleaves unrelated columns --
    confirmed on a real brochure where "Library Working Days & Hours..."
    was getting merged mid-sentence with an unrelated QR-code caption from
    a different column, which measurably hurt embedding similarity for
    otherwise-relevant chunks.

    Auto-detects column count by clustering text-block x-start positions
    (large horizontal gaps = column boundaries), then sorts each column's
    blocks top-to-bottom and concatenates columns left-to-right. Ordinary
    single-column PDFs naturally collapse to one "column" and are
    unaffected -- this only changes behavior on genuinely multi-column pages.
    """
    width = page.rect.width
    blocks = [b for b in page.get_text("blocks") if b[6] == 0 and b[4].strip()]
    if not blocks:
        return ""

    xs = sorted(set(round(b[0]) for b in blocks))
    gap_threshold = width * gap_ratio
    boundaries = [xs[0]]
    for prev, cur in zip(xs, xs[1:]):
        if cur - prev > gap_threshold:
            boundaries.append(cur)

    def col_index(x0):
        idx = 0
        for i, b in enumerate(boundaries):
            if x0 >= b:
                idx = i
        return idx

    columns: dict[int, list] = {}
    for b in blocks:
        columns.setdefault(col_index(b[0]), []).append(b)

    out = []
    for idx in sorted(columns):
        for b in sorted(columns[idx], key=lambda b: b[1]):  # sort by y0 within column
            out.append(b[4].strip())
    return "\n".join(out)


def _extract_pages(path: str) -> list[dict]:
    doc = fitz.open(path)
    try:
        pages = []
        for i, page in enumerate(doc):
            text = _column_aware_text(page)
            headings = [ln.strip() for ln in text.splitlines() if _guess_heading(ln)]
            pages.append({"page_number": i + 1, "text": text, "heading": headings[0] if headings else None})
        return pages
    finally:
        doc.close()


def _chunk_page_text(text: str, chunk_words=CHUNK_WORDS, overlap_words=OVERLAP_WORDS) -> list[str]:
    words = text.split()
    out = []
    start = 0
    while start < len(words):
        end = min(start + chunk_words, len(words))
        piece = " ".join(words[start:end]).strip()
        if piece:
            out.append(piece)
        if end == len(words):
            break
        start = end - overlap_words
    return out


def index_pdf_content(source_table: str, source_id: int, pdf_path: str, pdf_url: str,
                       section_url: str, section_title: str):
    """
    Reads the real PDF text and creates one save_chunk() call per text chunk,
    tagged with page number in section_title so answers can say "see page 3"
    and the asset payload still links back to the actual clickable PDF (pdf_url).

    Skips cleanly (returns a status dict, doesn't raise) for scanned PDFs.
    """
    # Imported here, not at module top, to avoid a circular import
    # (chat_index.py will import this module).
    from chat_index import save_chunk

    if not is_text_pdf(pdf_path):
        return {"status": "skipped", "reason": "scanned/image-only PDF (no OCR per spec)"}

    pages = _extract_pages(pdf_path)
    inserted = 0
    for page in pages:
        if not page["text"].strip():
            continue
        for piece in _chunk_page_text(page["text"]):
            page_title = f"{section_title} (p.{page['page_number']})"
            if page["heading"]:
                page_title += f" — {page['heading']}"
            save_chunk(
                source_table, source_id, "text", piece,
                section_url=section_url, section_title=page_title,
                asset={"asset_type": "pdf", "file_url": pdf_url, "file_name": section_title},
            )
            inserted += 1
    return {"status": "ok", "chunks_inserted": inserted, "pages": len(pages)}