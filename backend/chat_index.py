"""
chat_index.py — Stage B (indexing) + Stage D (sync) for the search chatbot.

WHAT THIS FILE DOES:
Reads rows from your real content tables (FacilityContent, Notice, etc.) and
turns each one into searchable "chunks" stored in chat_index_chunk, with the
real table/pdf/image payload stored in chat_index_asset.

WHAT THIS FILE DOES NOT DO:
- It does not call any LLM. Pure search only, per your zero-cost decision.
- It does not read PDF file contents — PDFs are indexed by filename/description
  only, and returned whole, per your instruction.

HOW TO USE:
- index_all(db) -> run once manually to build the index from everything that
  currently exists in the database (Stage B, the initial build). Reads
  everything up front using the given session, then closes it; the rest of
  the work uses fresh short-lived connections internally.
- index_<table>_row(row) -> call this from inside the matching admin
  create/update endpoint in main.py (Stage D, incremental sync).
- delete_chunks_for(source_table, source_id) -> call this from inside the
  matching admin delete endpoint in main.py.
"""

import os
import json
import time
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
import voyageai

import models

# ── Voyage client ──
# Reads VOYAGE_API_KEY from the environment automatically.
voyage_client = voyageai.Client()
EMBED_MODEL = "voyage-4-lite"

# Voyage allows only 3 requests/minute on accounts with no payment method on file.
# 60 seconds / 3 requests = 20 seconds minimum between requests, +2s buffer to be safe.
SECONDS_BETWEEN_REQUESTS = 22


# ============================================================
# CORE HELPERS — used by every per-table indexer below
# ============================================================

def embed_text(text_to_embed: str, max_attempts: int = 5):
    """Turn a piece of text into a vector. input_type='document' tells Voyage
    this is content being indexed (not a user's question) — Voyage tunes the
    embedding slightly differently for each, which improves match quality.

    Retries on failure (network blips, temporary API issues) instead of
    crashing the whole run — a long unattended run is bound to hit at least
    one transient hiccup over many minutes."""
    last_error = None
    for attempt in range(1, max_attempts + 1):
        time.sleep(SECONDS_BETWEEN_REQUESTS)  # respect the 3 RPM limit (no payment method on file)
        try:
            result = voyage_client.embed(
                texts=[text_to_embed],
                model=EMBED_MODEL,
                input_type="document",
            )
            return result.embeddings[0]
        except Exception as e:
            last_error = e
            wait = 10 * attempt  # back off a bit longer each retry: 10s, 20s, 30s...
            print(f"    (embed attempt {attempt}/{max_attempts} failed: {e}. Retrying in {wait}s...)")
            time.sleep(wait)
    raise last_error


def delete_chunks_for(source_table: str, source_id: int):
    """Remove all existing chunks (and their assets, via cascade) for a given
    source row. Always call this before re-inserting on update, and on delete.

    Always opens its own short-lived connection, since Supabase's pooler can
    silently drop connections that sit idle for a while (which happens often
    in this script, due to the deliberate delay between Voyage API calls)."""
    from database import SessionLocal
    fresh_db = SessionLocal()
    try:
        fresh_db.execute(
            text("DELETE FROM chat_index_chunk WHERE source_table = :st AND source_id = :sid"),
            {"st": source_table, "sid": source_id},
        )
        fresh_db.commit()
    finally:
        fresh_db.close()


def save_chunk(
    source_table: str,
    source_id: int,
    content_type: str,
    chunk_text_value: str,
    section_url: str,
    section_title: str = None,
    asset: dict = None,
):
    """Embeds chunk_text_value and saves one row to chat_index_chunk.
    If `asset` is given, also saves one row to chat_index_asset linked to it.

    asset dict shape:
      {"asset_type": "table", "table_data": {...}}                  for tables
      {"asset_type": "pdf",   "file_url": "...", "file_name": "..."} for pdfs
      {"asset_type": "image", "file_url": "...", "file_name": "..."} for images
    """
    if not chunk_text_value or not chunk_text_value.strip():
        return  # nothing to index

    embedding = embed_text(chunk_text_value)  # the slow part — happens before we open a DB connection

    from database import SessionLocal
    fresh_db = SessionLocal()
    try:
        result = fresh_db.execute(
            text("""
                INSERT INTO chat_index_chunk
                    (source_table, source_id, content_type, chunk_text, section_url, section_title, embedding)
                VALUES
                    (:source_table, :source_id, :content_type, :chunk_text, :section_url, :section_title, :embedding)
                RETURNING id
            """),
            {
                "source_table": source_table,
                "source_id": source_id,
                "content_type": content_type,
                "chunk_text": chunk_text_value,
                "section_url": section_url,
                "section_title": section_title,
                "embedding": str(embedding),  # pgvector accepts this as text input
            },
        )
        chunk_id = result.scalar()

        if asset:
            fresh_db.execute(
                text("""
                    INSERT INTO chat_index_asset (chunk_id, asset_type, table_data, file_url, file_name)
                    VALUES (:chunk_id, :asset_type, :table_data, :file_url, :file_name)
                """),
                {
                    "chunk_id": chunk_id,
                    "asset_type": asset["asset_type"],
                    "table_data": json.dumps(asset["table_data"]) if asset.get("table_data") else None,
                    "file_url": asset.get("file_url"),
                    "file_name": asset.get("file_name"),
                },
            )

        fresh_db.commit()
    finally:
        fresh_db.close()


# ============================================================
# PER-TABLE INDEXERS
# Each one: (1) deletes old chunks for this row, (2) builds new ones.
# ============================================================

def _readable_name_from_filename(filename: str) -> str:
    """Turn a raw filename into a human-readable description for embedding.
    e.g. '__table_pdf__Physics Syllabus NEP.pdf' -> 'Physics Syllabus NEP'
         'SSH-OPD (Schedule).pdf' -> 'SSH OPD Schedule'
    """
    import re
    # Strip leading __table_pdf__ or similar prefixes
    name = re.sub(r'^__[a-z_]+__', '', filename)
    # Strip file extension
    name = re.sub(r'\.[a-zA-Z0-9]+$', '', name)
    # Replace underscores/hyphens with spaces
    name = name.replace('_', ' ').replace('-', ' ')
    # Remove extra spaces
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def sync_facility_content_by_id(content_id: int):
    """Stage D entry point: call this from a FastAPI background task after an
    admin creates/updates a facility_content row (or its pdfs/photos).

    Self-contained — opens its own fresh connection, fetches the row (with
    pdfs/photos eager-loaded), indexes it, and closes. Safe to call from a
    background task, where the original request's `db` session is already
    closed by the time this runs."""
    from database import SessionLocal
    fresh_db = SessionLocal()
    try:
        row = (
            fresh_db.query(models.FacilityContent)
            .options(joinedload(models.FacilityContent.pdfs), joinedload(models.FacilityContent.photos))
            .filter(models.FacilityContent.id == content_id)
            .first()
        )
        if row:
            index_facility_content_row(row)
        else:
            print(f"  sync_facility_content_by_id: id={content_id} no longer exists, nothing to index.")
    finally:
        fresh_db.close()


def index_facility_content_row(row: "models.FacilityContent"):
    """FacilityContent is the richest table: text + table JSON + many photos + many pdfs.
    Powers facilities/* and any other GenericContentPage-routed section."""

    pdf_list = [(pdf.pdf_url, pdf.pdf_name) for pdf in row.pdfs]
    photo_list = [(photo.photo_url, photo.photo_name) for photo in row.photos]

    delete_chunks_for("facility_content", row.id)

    base = row.section if row.section else "facilities"
    url = f"/{base}/{row.category}" if row.category else f"/{base}"
    title = row.name or row.category or base

    # 1. Text chunk — skip for profile pages since the profile block below
    # creates a richer combined chunk (description + name/designation/phone/email).
    # For non-profile pages, index the description as normal.
    _has_profile = False
    if row.details:
        try:
            _td = json.loads(row.details)
            _has_profile = bool(_td.get("profile"))
        except Exception:
            pass

    if row.description and not _has_profile:
        save_chunk(
            "facility_content", row.id, "text",
            chunk_text_value=f"{title}. {row.description}",
            section_url=url, section_title=title,
        )

    # 2. Table/Profile chunk
    if row.details:
        try:
            table_data = json.loads(row.details)

            # Check if this is a profile (has a 'profile' key)
            profile = table_data.get("profile")
            if profile and isinstance(profile, dict):
                # Merge profile data INTO the description chunk so the LLM
                # always has name/designation/phone in context when answering.
                profile_parts = []
                for key, label in [
                    ("name", "Name"), ("designation", "Designation"),
                    ("university", "University"), ("phone", "Phone"),
                    ("officeContact", "Office Contact"), ("email", "Email"),
                    ("address", "Address"),
                ]:
                    if profile.get(key):
                        profile_parts.append(f"{label}: {profile[key]}")

                desc = row.description or ""
                combined = f"{title}. {desc} " + ". ".join(profile_parts)
                save_chunk(
                    "facility_content", row.id, "text",
                    chunk_text_value=combined.strip(),
                    section_url=url, section_title=title,
                )

            # Regular table (not profile) — include row data so specific
            # queries like "who is physics section incharge" match names.
            columns = table_data.get("columns", [])
            heading = table_data.get("tableHeading", "")
            rows_data = table_data.get("rows", [])

            if columns and not profile:
                row_texts = []
                for r in rows_data[:10]:
                    if isinstance(r, dict):
                        vals = [f"{k}: {v}" for k, v in r.items() if v]
                        row_texts.append(", ".join(vals))
                    elif isinstance(r, list):
                        row_texts.append(", ".join(str(v) for v in r if v))

                description_for_embedding = f"{title} — {heading or 'table'}. Columns: {', '.join(columns)}."
                if row_texts:
                    description_for_embedding += " Data: " + "; ".join(row_texts)

                save_chunk(
                    "facility_content", row.id, "table",
                    chunk_text_value=description_for_embedding,
                    section_url=url, section_title=title,
                    asset={"asset_type": "table", "table_data": table_data},
                )
        except (json.JSONDecodeError, AttributeError):
            pass

    # 3. PDF chunks
    for pdf_url, pdf_name in pdf_list:
        readable = _readable_name_from_filename(pdf_name)
        save_chunk(
            "facility_content", row.id, "pdf",
            chunk_text_value=f"{readable}. Available as a PDF document in the {title} section.",
            section_url=url, section_title=title,
            asset={"asset_type": "pdf", "file_url": pdf_url, "file_name": pdf_name},
        )

    # 4. Image chunks
    for photo_url, photo_name in photo_list:
        readable = _readable_name_from_filename(photo_name)
        save_chunk(
            "facility_content", row.id, "image",
            chunk_text_value=f"Photo of {title}. {readable}.",
            section_url=url, section_title=title,
            asset={"asset_type": "image", "file_url": photo_url, "file_name": photo_name},
        )

    # Legacy single pdf/photo columns
    if row.pdf_url:
        readable = _readable_name_from_filename(row.pdf_name or 'attachment')
        save_chunk(
            "facility_content", row.id, "pdf",
            chunk_text_value=f"{readable}. Available as a PDF document in the {title} section.",
            section_url=url, section_title=title,
            asset={"asset_type": "pdf", "file_url": row.pdf_url, "file_name": row.pdf_name},
        )
    if row.photo_url:
        readable = _readable_name_from_filename(row.photo_name or 'photo')
        save_chunk(
            "facility_content", row.id, "image",
            chunk_text_value=f"Photo of {title}. {readable}.",
            section_url=url, section_title=title,
            asset={"asset_type": "image", "file_url": row.photo_url, "file_name": row.photo_name},
        )


def sync_notice_by_id(notice_id: int):
    """Stage D entry point: call this from a FastAPI background task after an
    admin creates/updates a notice. Self-contained, like sync_facility_content_by_id."""
    from database import SessionLocal
    fresh_db = SessionLocal()
    try:
        row = fresh_db.query(models.Notice).filter(models.Notice.id == notice_id).first()
        if row:
            index_notice_row(row)
        else:
            print(f"  sync_notice_by_id: id={notice_id} no longer exists, nothing to index.")
    finally:
        fresh_db.close()


def index_notice_row(row: "models.Notice"):
    delete_chunks_for("notices", row.id)
    url = "/Notices"
    title = row.title or "Notice"

    chunk_text_value = f"{row.title}. {row.content or ''}".strip()
    save_chunk(
        "notices", row.id, "text",
        chunk_text_value=chunk_text_value,
        section_url=url, section_title=title,
    )

    if row.attachment_url:
        readable = _readable_name_from_filename(row.attachment_name or 'document')
        save_chunk(
            "notices", row.id, "pdf",
            chunk_text_value=f"Attachment for notice '{title}': {readable}. Download PDF.",
            section_url=url, section_title=title,
            asset={"asset_type": "pdf", "file_url": row.attachment_url, "file_name": row.attachment_name},
        )


def index_college_info_item_row(row: "models.CollegeInfoItem"):
    delete_chunks_for("college_info_items", row.id)
    url = "/About"
    title = row.title

    save_chunk(
        "college_info_items", row.id, "text",
        chunk_text_value=f"{row.title}. {row.description}",
        section_url=url, section_title=title,
    )

    if row.image_url:
        readable = _readable_name_from_filename(row.image_name or 'photo')
        save_chunk(
            "college_info_items", row.id, "image",
            chunk_text_value=f"Photo related to {title}. {readable}.",
            section_url=url, section_title=title,
            asset={"asset_type": "image", "file_url": row.image_url, "file_name": row.image_name},
        )


def index_administration_section_row(row: "models.AdministrationSection"):
    delete_chunks_for("administration_sections", row.id)
    url = f"/administration/{row.section_name}"
    if row.sub_section:
        url += f"/{row.sub_section}"
    title = f"{row.section_name} — {row.sub_section}" if row.sub_section else row.section_name

    if row.description:
        save_chunk(
            "administration_sections", row.id, "text",
            chunk_text_value=row.description,
            section_url=url, section_title=title,
        )

    if row.image_url:
        readable = _readable_name_from_filename(row.image_name or 'photo')
        save_chunk(
            "administration_sections", row.id, "image",
            chunk_text_value=f"Photo related to {title} in administration. {readable}.",
            section_url=url, section_title=title,
            asset={"asset_type": "image", "file_url": row.image_url, "file_name": row.image_name},
        )


def index_academic_nep_row(row: "models.AcademicNEP"):
    delete_chunks_for("academic_nep", row.id)
    url = "/academics/nep"
    title = "NEP"

    if row.description:
        save_chunk(
            "academic_nep", row.id, "text",
            chunk_text_value=row.description,
            section_url=url, section_title=title,
        )
    if row.pdf_url:
        readable = _readable_name_from_filename(row.pdf_name or 'NEP document')
        save_chunk(
            "academic_nep", row.id, "pdf",
            chunk_text_value=f"National Education Policy (NEP) document at MMV BHU: {readable}. Download PDF.",
            section_url=url, section_title=title,
            asset={"asset_type": "pdf", "file_url": row.pdf_url, "file_name": row.pdf_name},
        )


def index_academic_syllabus_row(row: "models.AcademicSyllabus"):
    delete_chunks_for("academic_syllabus", row.id)
    url = f"/academics/syllabus/{row.category}"
    title = f"Syllabus — {row.category}"

    readable = _readable_name_from_filename(row.pdf_name or 'syllabus')
    save_chunk(
        "academic_syllabus", row.id, "pdf",
        chunk_text_value=f"{readable}. Academic syllabus for {row.category} students at MMV BHU. Download PDF.",
        section_url=url, section_title=title,
        asset={"asset_type": "pdf", "file_url": row.pdf_url, "file_name": row.pdf_name},
    )


def index_academic_elective_row(row: "models.AcademicElective"):
    delete_chunks_for("academic_electives", row.id)
    url = f"/academics/electives/{row.category}"
    title = f"Elective — {row.category}"

    readable = _readable_name_from_filename(row.pdf_name or 'elective')
    save_chunk(
        "academic_electives", row.id, "pdf",
        chunk_text_value=f"{readable}. Elective course document for {row.category} at MMV BHU. Download PDF.",
        section_url=url, section_title=title,
        asset={"asset_type": "pdf", "file_url": row.pdf_url, "file_name": row.pdf_name},
    )


def index_academic_section_incharge_row(row: "models.AcademicSectionIncharge"):
    delete_chunks_for("academic_section_incharge", row.id)
    url = f"/academics/section-incharge/{row.category}"
    title = f"Section Incharge — {row.category}"

    # Confirmed: details is plain free-form text here, not JSON. Safe to concatenate.
    chunk_text_value = " ".join(filter(None, [row.description, row.details])).strip()
    if chunk_text_value:
        save_chunk(
            "academic_section_incharge", row.id, "text",
            chunk_text_value=chunk_text_value,
            section_url=url, section_title=title,
        )


def index_academic_swayam_course_row(row: "models.AcademicSwayamCourse"):
    delete_chunks_for("academic_swayam_courses", row.id)
    url = "/academics/swayam"
    title = "SWAYAM Courses"

    if row.description:
        save_chunk(
            "academic_swayam_courses", row.id, "text",
            chunk_text_value=row.description,
            section_url=url, section_title=title,
        )


def index_contact_info_row(row: "models.ContactInfo"):
    delete_chunks_for("contact_info", row.id)
    url = "/Contact"
    title = "Contact"

    parts = [row.address, row.phone, row.email, row.office_hours]
    chunk_text_value = "Contact information: " + " ".join(filter(None, parts))
    save_chunk(
        "contact_info", row.id, "text",
        chunk_text_value=chunk_text_value,
        section_url=url, section_title=title,
    )


def index_emergency_contact_row(row: "models.EmergencyContact"):
    delete_chunks_for("emergency_contacts", row.id)
    url = "/Contact"
    title = row.group_name

    chunk_text_value = f"{row.group_name} — {row.label}: {row.value}"
    save_chunk(
        "emergency_contacts", row.id, "text",
        chunk_text_value=chunk_text_value,
        section_url=url, section_title=title,
    )


# ============================================================
# FULL INITIAL BUILD (Stage B — run once manually)
# ============================================================

def index_all(db: Session):
    """Wipes and rebuilds the entire chat index from everything currently
    in the database. Run this once for the initial build. After this,
    Stage D's per-row hooks keep things up to date incrementally —
    you should not need to call this again in normal operation.

    IMPORTANT: all rows (including related pdfs/photos) are fetched up front,
    in one quick burst, before any slow Voyage embedding calls happen. The
    `db` connection passed in is only used for these initial fast reads —
    after that, this function never touches it again. This avoids Supabase's
    pooler silently dropping a connection that's been sitting open across
    many minutes of deliberately slow embedding calls."""

    print("Reading all content from the database (fast)...")
    facility_rows = (
        db.query(models.FacilityContent)
        .options(joinedload(models.FacilityContent.pdfs), joinedload(models.FacilityContent.photos))
        .all()
    )
    notice_rows = db.query(models.Notice).all()
    college_info_rows = db.query(models.CollegeInfoItem).all()
    admin_rows = db.query(models.AdministrationSection).all()
    nep_rows = db.query(models.AcademicNEP).all()
    syllabus_rows = db.query(models.AcademicSyllabus).all()
    elective_rows = db.query(models.AcademicElective).all()
    incharge_rows = db.query(models.AcademicSectionIncharge).all()
    swayam_rows = db.query(models.AcademicSwayamCourse).all()
    contact_rows = db.query(models.ContactInfo).all()
    emergency_rows = db.query(models.EmergencyContact).all()
    print("Done reading. Connection no longer needed for the rest of this run.")

    print(f"Indexing facility_content... ({len(facility_rows)} rows)")
    for i, row in enumerate(facility_rows, 1):
        print(f"  [{i}/{len(facility_rows)}] id={row.id} ({row.category or row.section})")
        try:
            index_facility_content_row(row)
        except Exception as e:
            print(f"  SKIPPING facility_content id={row.id} after repeated failures: {e}")

    print(f"Indexing notices... ({len(notice_rows)} rows)")
    for row in notice_rows:
        try:
            index_notice_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in notice_rows after repeated failures: {e}")


    print(f"Indexing college_info_items... ({len(college_info_rows)} rows)")
    for row in college_info_rows:
        try:
            index_college_info_item_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in college_info_rows after repeated failures: {e}")


    print(f"Indexing administration_sections... ({len(admin_rows)} rows)")
    for row in admin_rows:
        try:
            index_administration_section_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in admin_rows after repeated failures: {e}")


    print(f"Indexing academic_nep... ({len(nep_rows)} rows)")
    for row in nep_rows:
        try:
            index_academic_nep_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in nep_rows after repeated failures: {e}")


    print(f"Indexing academic_syllabus... ({len(syllabus_rows)} rows)")
    for row in syllabus_rows:
        try:
            index_academic_syllabus_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in syllabus_rows after repeated failures: {e}")


    print(f"Indexing academic_electives... ({len(elective_rows)} rows)")
    for row in elective_rows:
        try:
            index_academic_elective_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in elective_rows after repeated failures: {e}")


    print(f"Indexing academic_section_incharge... ({len(incharge_rows)} rows)")
    for row in incharge_rows:
        try:
            index_academic_section_incharge_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in incharge_rows after repeated failures: {e}")


    print(f"Indexing academic_swayam_courses... ({len(swayam_rows)} rows)")
    for row in swayam_rows:
        try:
            index_academic_swayam_course_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in swayam_rows after repeated failures: {e}")


    print(f"Indexing contact_info... ({len(contact_rows)} rows)")
    for row in contact_rows:
        try:
            index_contact_info_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in contact_rows after repeated failures: {e}")


    print(f"Indexing emergency_contacts... ({len(emergency_rows)} rows)")
    for row in emergency_rows:
        try:
            index_emergency_contact_row(row)
        except Exception as e:
            print(f"  SKIPPING a row in emergency_rows after repeated failures: {e}")


    print("Done.")