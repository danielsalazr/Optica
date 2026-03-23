from __future__ import annotations

import json
from typing import Any

from .db import get_connection
from .paths import GENERATED_DIR, ensure_runtime_dirs
from .printer_service import build_document_text, print_text


def create_job(
    document_type: str,
    format_name: str,
    printer_name: str,
    copies: int,
    payload: dict[str, Any],
) -> dict[str, Any]:
    ensure_runtime_dirs()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO print_jobs(
                document_type, format, printer_name, copies, status, payload_json
            )
            VALUES (?, ?, ?, ?, 'pending', ?)
            """,
            (
                document_type,
                format_name,
                printer_name,
                copies,
                json.dumps(payload, ensure_ascii=False),
            ),
        )
        job_id = cursor.lastrowid

    try:
        update_job_status(job_id, "processing")
        content = build_document_text(document_type, payload)
        generated_file = GENERATED_DIR / f"job_{job_id}_{document_type}.txt"
        generated_file.write_text(content, encoding="utf-8")
        print_text(printer_name, content, copies=copies)
        update_job_status(job_id, "done", generated_file=str(generated_file))
    except Exception as exc:
        update_job_status(job_id, "error", error_message=str(exc))

    return get_job(job_id)


def update_job_status(
    job_id: int,
    status: str,
    error_message: str | None = None,
    generated_file: str | None = None,
) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE print_jobs
            SET status = ?,
                error_message = ?,
                generated_file = COALESCE(?, generated_file),
                processed_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (status, error_message, generated_file, job_id),
        )


def get_job(job_id: int) -> dict[str, Any]:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM print_jobs WHERE id = ?",
            (job_id,),
        ).fetchone()

    if row is None:
        raise KeyError(f"Job {job_id} no existe.")

    return dict(row)


def list_jobs(limit: int = 50) -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT * FROM print_jobs
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]
