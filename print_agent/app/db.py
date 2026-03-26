from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .paths import DB_PATH, ensure_runtime_dirs


LOCAL_DB_PATH = Path(__file__).resolve().parents[1] / "runtime" / "data" / "agent.db"
_RESOLVED_DB_PATH: Path | None = None


def _can_write_sqlite(path: Path) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    try:
        connection.execute("CREATE TABLE IF NOT EXISTS __write_test (id INTEGER)")
        connection.execute("DROP TABLE IF EXISTS __write_test")
        connection.commit()
        return True
    except sqlite3.OperationalError:
        return False
    finally:
        connection.close()


def _resolve_db_path() -> Path:
    global _RESOLVED_DB_PATH
    if _RESOLVED_DB_PATH is not None:
        return _RESOLVED_DB_PATH

    primary = Path(DB_PATH)
    fallback = LOCAL_DB_PATH

    if _can_write_sqlite(primary):
        _RESOLVED_DB_PATH = primary
    else:
        fallback.parent.mkdir(parents=True, exist_ok=True)
        _RESOLVED_DB_PATH = fallback

    return _RESOLVED_DB_PATH


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
    connection = sqlite3.connect(_resolve_db_path())
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()
