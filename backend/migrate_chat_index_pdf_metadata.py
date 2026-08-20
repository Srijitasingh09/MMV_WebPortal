"""Add page metadata required by PDF text chunks.

Run once against the same PostgreSQL database used by the chatbot:
    python backend/migrate_chat_index_pdf_metadata.py
"""

from sqlalchemy import inspect, text
from database import engine


def main():
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("chat_index_asset")}
    if "page_number" not in columns:
        with engine.begin() as connection:
            connection.execute(text(
                "ALTER TABLE chat_index_asset ADD COLUMN page_number INTEGER"
            ))
        print("Added chat_index_asset.page_number")
    else:
        print("chat_index_asset.page_number already exists")


if __name__ == "__main__":
    main()
