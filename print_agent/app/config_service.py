from __future__ import annotations

import json

from .db import get_connection


DEFAULT_CONFIG = {
    # "server.host": "127.0.0.1",
    "server.host": "0.0.0.0",
    "server.port": "7719",
    "server.api_token": "",
    "printer.constancia": "",
    "printer.remision": "",
    "printer.factura": "",
    "printer.recibo": "",
    "printer.abono": "",
    "printer.pedido": "",
    "company.name": "",
    "company.document": "",
    "company.phone": "",
    "company.address": "",
    "company.footer": "",
}


def seed_defaults() -> None:
    with get_connection() as connection:
        for key, value in DEFAULT_CONFIG.items():
            connection.execute(
                """
                INSERT INTO app_config(key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO NOTHING
                """,
                (key, value),
            )


def get_value(key: str, default: str = "") -> str:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT value FROM app_config WHERE key = ?",
            (key,),
        ).fetchone()
    return row["value"] if row else default


def set_value(key: str, value: str) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO app_config(key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            (key, value),
        )


def get_printer_mapping() -> dict[str, str]:
    return {
        document_type: get_value(f"printer.{document_type}")
        for document_type in ("constancia", "remision", "factura", "recibo", "abono", "pedido")
    }


def set_printer_mapping(document_type: str, printer_name: str) -> None:
    set_value(f"printer.{document_type}", printer_name)


def get_company_config() -> dict[str, str]:
    return {
        "name": get_value("company.name"),
        "document": get_value("company.document"),
        "phone": get_value("company.phone"),
        "address": get_value("company.address"),
        "footer": get_value("company.footer"),
    }


def set_company_config(data: dict[str, str]) -> None:
    set_value("company.name", str(data.get("name", "")))
    set_value("company.document", str(data.get("document", "")))
    set_value("company.phone", str(data.get("phone", "")))
    set_value("company.address", str(data.get("address", "")))
    set_value("company.footer", str(data.get("footer", "")))


def build_runtime_config() -> dict[str, object]:
    return {
        "host": get_value("server.host", DEFAULT_CONFIG["server.host"]),
        "port": int(get_value("server.port", DEFAULT_CONFIG["server.port"])),
        "api_token": get_value("server.api_token"),
        "printers": get_printer_mapping(),
        "company": get_company_config(),
    }


def export_config_json() -> str:
    return json.dumps(build_runtime_config(), ensure_ascii=False, indent=2)
