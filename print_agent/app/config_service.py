from __future__ import annotations

import json

from .db import get_connection


DEFAULT_PRINTER_PROFILE = {
    "receipt_width": 42,
    "item_desc_width": 18,
    "item_qty_width": 4,
    "item_price_width": 10,
    "item_total_width": 10,
    "abono_medio_width": 16,
    "abono_fecha_width": 10,
    "abono_valor_width": 16,
}

DEFAULT_CONFIG = {
    "server.host": "127.0.0.1",
    "server.port": "7719",
    "server.scheme": "https",
    "server.api_token": "",
    "printer.constancia": "",
    "printer.remision": "",
    "printer.factura": "",
    "printer.recibo": "",
    "printer.abono": "",
    "printer.pedido": "",
    "printer.profiles": json.dumps({
        "EPSON TM-T20II": DEFAULT_PRINTER_PROFILE,
        "EPSON TM-T20II Receipt": DEFAULT_PRINTER_PROFILE,
    }),
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


def get_printer_profiles() -> dict[str, dict[str, int]]:
    raw = get_value("printer.profiles", DEFAULT_CONFIG["printer.profiles"])
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        payload = {}

    if not isinstance(payload, dict):
        payload = {}

    normalized: dict[str, dict[str, int]] = {}
    for printer_name, profile in payload.items():
        if not isinstance(printer_name, str) or not isinstance(profile, dict):
            continue
        merged = DEFAULT_PRINTER_PROFILE.copy()
        for key, default_value in DEFAULT_PRINTER_PROFILE.items():
            value = profile.get(key, default_value)
            try:
                merged[key] = int(value)
            except (TypeError, ValueError):
                merged[key] = default_value
        normalized[printer_name] = merged

    if "EPSON TM-T20II" not in normalized:
        normalized["EPSON TM-T20II"] = DEFAULT_PRINTER_PROFILE.copy()
    if "EPSON TM-T20II Receipt" not in normalized:
        normalized["EPSON TM-T20II Receipt"] = DEFAULT_PRINTER_PROFILE.copy()

    return normalized


def get_printer_profile(printer_name: str) -> dict[str, int]:
    profiles = get_printer_profiles()
    profile = profiles.get(printer_name)
    if profile:
        return profile.copy()

    normalized_name = printer_name.strip().lower()
    for candidate_name, candidate_profile in profiles.items():
        if candidate_name.strip().lower() == normalized_name:
            return candidate_profile.copy()

    return DEFAULT_PRINTER_PROFILE.copy()


def set_printer_profile(printer_name: str, profile: dict[str, int]) -> None:
    profiles = get_printer_profiles()
    merged = DEFAULT_PRINTER_PROFILE.copy()
    for key, default_value in DEFAULT_PRINTER_PROFILE.items():
        value = profile.get(key, default_value)
        try:
            merged[key] = int(value)
        except (TypeError, ValueError):
            merged[key] = default_value

    profiles[printer_name] = merged
    set_value("printer.profiles", json.dumps(profiles, ensure_ascii=False))


def build_runtime_config() -> dict[str, object]:
    return {
        "host": get_value("server.host", DEFAULT_CONFIG["server.host"]),
        "port": int(get_value("server.port", DEFAULT_CONFIG["server.port"])),
        "scheme": get_value("server.scheme", DEFAULT_CONFIG["server.scheme"]),
        "api_token": get_value("server.api_token"),
        "printers": get_printer_mapping(),
        "company": get_company_config(),
        "printer_profiles": get_printer_profiles(),
    }


def export_config_json() -> str:
    return json.dumps(build_runtime_config(), ensure_ascii=False, indent=2)
