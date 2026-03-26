from __future__ import annotations

import json
import subprocess
import tempfile
import textwrap
from datetime import datetime
from pathlib import Path

try:
    import win32print  # type: ignore
except ImportError:
    win32print = None

from .config_service import get_company_config
from .schemas import PrinterInfo, PrinterStatus


RECEIPT_WIDTH = 42
ITEM_DESC_WIDTH = 18
ITEM_QTY_WIDTH = 4
ITEM_PRICE_WIDTH = 10
ITEM_TOTAL_WIDTH = 10
ABONO_MEDIO_WIDTH = 16
ABONO_FECHA_WIDTH = 10
ABONO_VALOR_WIDTH = 16


def list_printers() -> list[PrinterInfo]:
    if win32print is not None:
        return _list_printers_win32()
    return _list_printers_powershell()


def list_printer_statuses() -> list[PrinterStatus]:
    if win32print is not None:
        return _list_printer_statuses_win32()
    return _list_printer_statuses_powershell()


def get_printer_status(printer_name: str) -> PrinterStatus:
    normalized = printer_name.strip().lower()
    for printer in list_printer_statuses():
        if printer.name.lower() == normalized:
            return printer

    return PrinterStatus(
        name=printer_name,
        installed=False,
        online=False,
        port=None,
        driver=None,
        is_default=False,
        status="not_found",
    )


def _list_printers_win32() -> list[PrinterInfo]:
    flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    default_name = win32print.GetDefaultPrinter()
    printers: list[PrinterInfo] = []

    for _, _, name, _ in win32print.EnumPrinters(flags):
        handle = win32print.OpenPrinter(name)
        try:
            info = win32print.GetPrinter(handle, 2)
        finally:
            win32print.ClosePrinter(handle)

        printers.append(
            PrinterInfo(
                name=name,
                port=info.get("pPortName", ""),
                driver=info.get("pDriverName", ""),
                is_default=name == default_name,
            )
        )

    return sorted(printers, key=lambda item: (not item.is_default, item.name.lower()))


def _list_printer_statuses_win32() -> list[PrinterStatus]:
    flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    default_name = win32print.GetDefaultPrinter()
    printers: list[PrinterStatus] = []

    for _, _, name, _ in win32print.EnumPrinters(flags):
        handle = win32print.OpenPrinter(name)
        try:
            info = win32print.GetPrinter(handle, 2)
        finally:
            win32print.ClosePrinter(handle)

        attributes = info.get("Attributes", 0)
        status_flags = info.get("Status", 0)
        port_name = info.get("pPortName") or None
        is_offline = bool(attributes & getattr(win32print, "PRINTER_ATTRIBUTE_WORK_OFFLINE", 0))
        has_error_status = bool(
            status_flags
            & (
                getattr(win32print, "PRINTER_STATUS_OFFLINE", 0)
                | getattr(win32print, "PRINTER_STATUS_ERROR", 0)
                | getattr(win32print, "PRINTER_STATUS_PAPER_OUT", 0)
                | getattr(win32print, "PRINTER_STATUS_NOT_AVAILABLE", 0)
            )
        )
        online = bool(port_name) and not is_offline and not has_error_status

        printers.append(
            PrinterStatus(
                name=name,
                installed=True,
                online=online,
                port=port_name if online else None,
                driver=info.get("pDriverName") or None,
                is_default=name == default_name,
                status="online" if online else "offline",
            )
        )

    return sorted(printers, key=lambda item: (not item.is_default, item.name.lower()))


def _list_printers_powershell() -> list[PrinterInfo]:
    result = subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-Command",
            (
                "Get-Printer | "
                "Select-Object Name,PortName,DriverName,Default | "
                "ConvertTo-Json -Compress"
            ),
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    raw = result.stdout.strip()
    if not raw:
        return []

    payload = json.loads(raw)
    if isinstance(payload, dict):
        payload = [payload]

    printers = [
        PrinterInfo(
            name=item.get("Name", ""),
            port=item.get("PortName", ""),
            driver=item.get("DriverName", ""),
            is_default=bool(item.get("Default", False)),
        )
        for item in payload
        if item.get("Name")
    ]
    return sorted(printers, key=lambda item: (not item.is_default, item.name.lower()))


def _list_printer_statuses_powershell() -> list[PrinterStatus]:
    result = subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-Command",
            (
                "Get-Printer | "
                "Select-Object Name,PortName,DriverName,Default,PrinterStatus | "
                "ConvertTo-Json -Compress"
            ),
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    raw = result.stdout.strip()
    if not raw:
        return []

    payload = json.loads(raw)
    if isinstance(payload, dict):
        payload = [payload]

    printers: list[PrinterStatus] = []
    for item in payload:
        if not item.get("Name"):
            continue

        printer_status = str(item.get("PrinterStatus", "")).strip().lower()
        port_name = item.get("PortName") or None
        online = bool(port_name) and printer_status in {"normal", "idle", "unknown", ""}

        printers.append(
            PrinterStatus(
                name=item.get("Name", ""),
                installed=True,
                online=online,
                port=port_name if online else None,
                driver=item.get("DriverName") or None,
                is_default=bool(item.get("Default", False)),
                status="online" if online else (printer_status or "offline"),
            )
        )

    return sorted(printers, key=lambda item: (not item.is_default, item.name.lower()))


def build_constancia_text(data: dict) -> str:
    cliente = data.get("cliente", "Cliente no especificado")
    documento = data.get("documento", "")
    fecha = data.get("fecha", "")
    detalle = data.get(
        "detalle",
        "Se deja constancia del servicio prestado o del documento entregado.",
    )

    return "\n".join(
        [
            "CONSTANCIA".center(RECEIPT_WIDTH),
            "",
            f"Cliente: {cliente}",
            f"Documento: {documento}",
            f"Fecha: {fecha}",
            "",
            "Detalle:",
            _wrap_text(str(detalle), RECEIPT_WIDTH),
            "",
            "Firma cliente: ________________________",
            "",
        ]
    )


def build_remision_text(data: dict) -> str:
    numero = data.get("numero", "SIN-NUMERO")
    fecha = data.get("fecha", "")
    cliente = data.get("cliente", "")
    items = data.get("items", [])
    abonos = data.get("abonos", [])
    valor_venta = data.get("valor_venta")
    abonado = data.get("abonado", data.get("abono"))
    saldo = data.get("saldo")

    lines = [
        *_build_company_header("REMISION"),
        f"No: {numero}",
        f"Fecha documento: {fecha}",
        f"Fecha impresion: {_current_print_timestamp()}",
        f"Cliente: {cliente}",
        "-" * RECEIPT_WIDTH,
        _format_item_header(),
        "-" * RECEIPT_WIDTH,
    ]

    if items:
        for item in items:
            descripcion = str(item.get("descripcion", "ITEM"))
            cantidad = item.get("cantidad", 1)
            valor_unitario = item.get("valor_unitario")
            valor_total = item.get("valor_total")
            if valor_total is None and valor_unitario is not None:
                try:
                    valor_total = float(cantidad) * float(valor_unitario)
                except (TypeError, ValueError):
                    valor_total = None
            lines.extend(
                _build_item_table_lines(
                    descripcion=descripcion,
                    cantidad=cantidad,
                    valor_unitario=valor_unitario,
                    valor_total=valor_total,
                )
            )
    else:
        lines.append("Sin items".center(RECEIPT_WIDTH))

    monetary_lines = _build_remision_totals(valor_venta, abonado, saldo)
    if monetary_lines:
        lines.append("-" * RECEIPT_WIDTH)
        lines.extend(monetary_lines)

    abono_lines = _build_abonos_lines(abonos)
    if abono_lines:
        lines.append("-" * RECEIPT_WIDTH)
        lines.extend(abono_lines)

    observaciones = str(data.get("observaciones", "")).strip()
    lines.extend(
        [
            "-" * RECEIPT_WIDTH,
            observaciones,
            "",
            "Recibe: ______________________________",
            "",
        ]
    )
    return "\n".join(lines)


def build_document_text(document_type: str, data: dict) -> str:
    builders = {
        "constancia": build_constancia_text,
        "remision": build_remision_text,
    }
    builder = builders.get(document_type, build_constancia_text)
    return builder(data)


def print_text(printer_name: str, content: str, copies: int = 1) -> None:
    if win32print is not None:
        _print_raw(printer_name, content, copies=copies)
        return

    _print_via_notepad(printer_name, content, copies=copies)


def _print_raw(printer_name: str, content: str, copies: int = 1) -> None:
    esc_init = b"\x1b@"
    esc_feed = b"\x1b\x64\x04"
    esc_cut = b"\x1dV\x00"
    encoded = content.replace("\r\n", "\n").replace("\r", "\n").encode(
        "cp850", errors="replace"
    )

    for _ in range(copies):
        handle = win32print.OpenPrinter(printer_name)
        try:
            win32print.StartDocPrinter(handle, 1, ("Optica Print Agent", None, "RAW"))
            try:
                win32print.StartPagePrinter(handle)
                try:
                    win32print.WritePrinter(handle, esc_init)
                    win32print.WritePrinter(handle, encoded)
                    win32print.WritePrinter(handle, esc_feed)
                    win32print.WritePrinter(handle, esc_cut)
                finally:
                    win32print.EndPagePrinter(handle)
            finally:
                win32print.EndDocPrinter(handle)
        finally:
            win32print.ClosePrinter(handle)


def _print_via_notepad(printer_name: str, content: str, copies: int = 1) -> None:
    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="cp850",
        errors="replace",
        suffix=".txt",
        delete=False,
    ) as temp_file:
        temp_file.write(content)
        temp_path = Path(temp_file.name)

    try:
        for _ in range(copies):
            subprocess.run(
                ["notepad.exe", "/pt", str(temp_path), printer_name],
                check=True,
            )
    finally:
        temp_path.unlink(missing_ok=True)


def _build_company_header(title: str) -> list[str]:
    company = get_company_config()
    lines: list[str] = []

    name = str(company.get("name") or "").strip()
    document = str(company.get("document") or "").strip()
    phone = str(company.get("phone") or "").strip()
    address = str(company.get("address") or "").strip()
    footer = str(company.get("footer") or "").strip()

    if name:
        lines.append(name[:RECEIPT_WIDTH].center(RECEIPT_WIDTH))
    if document:
        lines.extend(_wrap_lines(f"Doc: {document}"))
    if phone:
        lines.extend(_wrap_lines(f"Tel: {phone}"))
    if address:
        lines.extend(_wrap_lines(f"Dir: {address}"))
    if footer:
        lines.extend(_wrap_lines(footer))

    lines.append(title.center(RECEIPT_WIDTH))
    lines.append("")
    return lines


def _wrap_text(text: str, width: int) -> str:
    lines: list[str] = []
    for raw_line in text.splitlines() or [""]:
        wrapped = textwrap.wrap(raw_line, width=width) or [""]
        lines.extend(wrapped)
    return "\n".join(lines)


def _current_print_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def _wrap_lines(text: str, width: int = RECEIPT_WIDTH) -> list[str]:
    lines: list[str] = []
    for raw_line in text.splitlines() or [""]:
        wrapped = textwrap.wrap(raw_line, width=width) or [""]
        lines.extend(wrapped)
    return lines


def _build_remision_totals(
    valor_venta: object,
    abonado: object,
    saldo: object,
) -> list[str]:
    totals: list[str] = []

    if valor_venta is not None:
        totals.append(_format_label_value("Valor venta", _format_currency(valor_venta)))

    if abonado is not None:
        totals.append(_format_label_value("Abonos", _format_currency(abonado)))

    if saldo is not None:
        totals.append(_format_label_value("Saldo", _format_currency(saldo)))

    return totals


def _build_abonos_lines(abonos: object) -> list[str]:
    if not isinstance(abonos, list) or not abonos:
        return []

    lines = [
        "ABONOS REALIZADOS",
        _format_abono_header(),
        "-" * RECEIPT_WIDTH,
    ]

    for abono in abonos:
        if not isinstance(abono, dict):
            continue
        medio_pago = str(abono.get("medio_pago") or abono.get("medioDePago") or "N/A")
        fecha = str(abono.get("fecha") or "")
        valor = abono.get("valor", abono.get("precio", 0))
        lines.extend(_build_abono_table_lines(medio_pago, fecha, valor))

    return lines


def _format_item_header() -> str:
    return (
        f"{'DESCRIPCION':<{ITEM_DESC_WIDTH}}"
        f"{'CANT':>{ITEM_QTY_WIDTH}}"
        f"{'PRECIO':>{ITEM_PRICE_WIDTH}}"
        f"{'TOTAL':>{ITEM_TOTAL_WIDTH}}"
    )


def _build_item_table_lines(
    descripcion: str,
    cantidad: object,
    valor_unitario: object,
    valor_total: object,
) -> list[str]:
    descripcion_lineas = textwrap.wrap(descripcion or "ITEM", width=ITEM_DESC_WIDTH) or ["ITEM"]
    cantidad_texto = _fit_right(str(cantidad), ITEM_QTY_WIDTH)
    precio_texto = _fit_right(_format_currency_short(valor_unitario), ITEM_PRICE_WIDTH)
    total_texto = _fit_right(_format_currency_short(valor_total), ITEM_TOTAL_WIDTH)

    lines = [
        f"{descripcion_lineas[0]:<{ITEM_DESC_WIDTH}}{cantidad_texto}{precio_texto}{total_texto}"
    ]
    for extra in descripcion_lineas[1:]:
        lines.append(
            f"{extra:<{ITEM_DESC_WIDTH}}"
            f"{'':>{ITEM_QTY_WIDTH}}"
            f"{'':>{ITEM_PRICE_WIDTH}}"
            f"{'':>{ITEM_TOTAL_WIDTH}}"
        )
    return lines


def _format_abono_header() -> str:
    return (
        f"{'MEDIO PAGO':<{ABONO_MEDIO_WIDTH}}"
        f"{'FECHA':<{ABONO_FECHA_WIDTH}}"
        f"{'VALOR':>{ABONO_VALOR_WIDTH}}"
    )


def _build_abono_table_lines(medio_pago: str, fecha: str, valor: object) -> list[str]:
    medio_lineas = textwrap.wrap(medio_pago or "N/A", width=ABONO_MEDIO_WIDTH) or ["N/A"]
    fecha_corta = fecha[:ABONO_FECHA_WIDTH]
    valor_texto = _fit_right(_format_currency(valor), ABONO_VALOR_WIDTH)

    lines = [
        f"{medio_lineas[0]:<{ABONO_MEDIO_WIDTH}}{fecha_corta:<{ABONO_FECHA_WIDTH}}{valor_texto}"
    ]
    for extra in medio_lineas[1:]:
        lines.append(
            f"{extra:<{ABONO_MEDIO_WIDTH}}"
            f"{'':<{ABONO_FECHA_WIDTH}}"
            f"{'':>{ABONO_VALOR_WIDTH}}"
        )
    return lines


def _format_label_value(label: str, value: str, width: int = RECEIPT_WIDTH) -> str:
    spaces = max(1, width - len(label) - len(value))
    return f"{label}{' ' * spaces}{value}"


def _fit_right(value: str, width: int) -> str:
    return value[-width:].rjust(width)


def _format_currency_short(value: object) -> str:
    text = _format_currency(value)
    return text if len(text) <= 10 else text[-10:]


def _format_currency(value: object) -> str:
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return str(value or "")

    if amount.is_integer():
        return f"${int(amount):,}".replace(",", ".")

    integer_part, decimal_part = f"{amount:,.2f}".split(".")
    return f"${integer_part.replace(',', '.')},{decimal_part}"
