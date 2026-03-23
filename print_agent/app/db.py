from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from typing import Iterator

from .paths import DB_PATH, ensure_runtime_dirs


def init_db() -> None:
    ensure_runtime_dirs()
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS app_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS print_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_type TEXT NOT NULL,
                format TEXT NOT NULL,
                printer_name TEXT NOT NULL,
                copies INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                generated_file TEXT,
                error_message TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                processed_at TEXT
            );
            """
        )


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    ensure_runtime_dirs()
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()
