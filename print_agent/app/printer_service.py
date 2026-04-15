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

from .config_service import DEFAULT_PRINTER_PROFILE, get_company_config, get_printer_profile
from .schemas import PrinterInfo, PrinterStatus


PrinterProfile = dict[str, int]


def _normalize_profile(profile: PrinterProfile | None = None) -> PrinterProfile:
    merged = DEFAULT_PRINTER_PROFILE.copy()
    if profile:
        for key, default_value in DEFAULT_PRINTER_PROFILE.items():
            value = profile.get(key, default_value)
            try:
                merged[key] = int(value)
            except (TypeError, ValueError):
                merged[key] = default_value
    return merged


def resolve_printer_profile(
    printer_name: str | None = None,
    profile: PrinterProfile | None = None,
) -> PrinterProfile:
    if profile:
        return _normalize_profile(profile)
    if printer_name:
        return _normalize_profile(get_printer_profile(printer_name))
    return _normalize_profile()


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


def build_constancia_text(data: dict, profile: PrinterProfile | None = None) -> str:
    widths = resolve_printer_profile(profile=profile)
    receipt_width = widths["receipt_width"]
    cliente = data.get("cliente", "Cliente no especificado")
    documento = data.get("documento", "")
    fecha = data.get("fecha", "")
    detalle = data.get(
        "detalle",
        "Se deja constancia del servicio prestado o del documento entregado.",
    )

    return "\n".join(
        [
            "CONSTANCIA".center(receipt_width),
            "",
            f"Cliente: {cliente}",
            f"Documento: {documento}",
            f"Fecha: {fecha}",
            "",
            "Detalle:",
            _wrap_text(str(detalle), receipt_width),
            "",
            "Firma cliente: ________________________",
            "",
        ]
    )


def build_remision_text(data: dict, profile: PrinterProfile | None = None) -> str:
    widths = resolve_printer_profile(profile=profile)
    receipt_width = widths["receipt_width"]
    numero = data.get("numero", "SIN-NUMERO")
    fecha = data.get("fecha", "")
    cliente = data.get("cliente", "")
    items = data.get("items", [])
    abonos = data.get("abonos", [])
    valor_venta = data.get("valor_venta")
    abonado = data.get("abonado", data.get("abono"))
    saldo = data.get("saldo")

    lines = [
        *_build_company_header("REMISION", widths),
        f"No: {numero}",
        f"Fecha documento: {fecha}",
        f"Fecha impresion: {_current_print_timestamp()}",
        f"Cliente: {cliente}",
        "-" * receipt_width,
        _format_item_header(widths),
        "-" * receipt_width,
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
                    profile=widths,
                )
            )
    else:
        lines.append("Sin items".center(receipt_width))

    monetary_lines = _build_remision_totals(valor_venta, abonado, saldo, widths)
    if monetary_lines:
        lines.append("-" * receipt_width)
        lines.extend(monetary_lines)

    abono_lines = _build_abonos_lines(abonos, widths)
    if abono_lines:
        lines.append("-" * receipt_width)
        lines.extend(abono_lines)

    observaciones = str(data.get("observaciones", "")).strip()
    lines.extend(
        [
            "-" * receipt_width,
            observaciones,
            "",
            "Recibe: ______________________________",
            "",
        ]
    )
    return "\n".join(lines)


def build_calibration_test_text(
    printer_name: str,
    profile: PrinterProfile | None = None,
) -> str:
    widths = resolve_printer_profile(profile=profile)
    receipt_width = widths["receipt_width"]
    digits_line = "".join(str((index % 10)) for index in range(1, receipt_width + 1))
    tens_line = "".join(str(((index - 1) // 10) % 10) for index in range(1, receipt_width + 1))
    edge_line = f"|{'-' * max(0, receipt_width - 2)}|" if receipt_width >= 2 else "|"
    full_line = "X" * receipt_width
    alternating_line = "".join("#" if index % 2 == 0 else "." for index in range(receipt_width))
    wrapped_sample = _wrap_lines(
        "Este texto debe respetar el ancho exacto configurado sin saltos inesperados al final de cada linea.",
        profile=widths,
    )

    return "\n".join(
        [
            "CALIBRACION".center(receipt_width),
            f"Impresora: {printer_name}"[:receipt_width],
            f"Ancho configurado: {receipt_width} chars"[:receipt_width],
            edge_line,
            tens_line,
            digits_line,
            full_line,
            alternating_line,
            edge_line,
            *wrapped_sample,
            edge_line,
            "Si alguna linea se desborda, reduce el ancho."[:receipt_width],
            "Si sobra mucho espacio, aumentalo."[:receipt_width],
            edge_line,
            "",
        ]
    )


def build_document_text(
    document_type: str,
    data: dict,
    printer_name: str | None = None,
    profile: PrinterProfile | None = None,
) -> str:
    resolved_profile = resolve_printer_profile(printer_name=printer_name, profile=profile)
    builders = {
        "constancia": build_constancia_text,
        "remision": build_remision_text,
    }
    builder = builders.get(document_type, build_constancia_text)
    return builder(data, profile=resolved_profile)


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


def _build_company_header(title: str, profile: PrinterProfile) -> list[str]:
    company = get_company_config()
    receipt_width = profile["receipt_width"]
    lines: list[str] = []

    name = str(company.get("name") or "").strip()
    document = str(company.get("document") or "").strip()
    phone = str(company.get("phone") or "").strip()
    address = str(company.get("address") or "").strip()
    footer = str(company.get("footer") or "").strip()

    if name:
        lines.append(name[:receipt_width].center(receipt_width))
    if document:
        lines.extend(_wrap_lines(f"Doc: {document}", profile=profile))
    if phone:
        lines.extend(_wrap_lines(f"Tel: {phone}", profile=profile))
    if address:
        lines.extend(_wrap_lines(f"Dir: {address}", profile=profile))
    if footer:
        lines.extend(_wrap_lines(footer, profile=profile))

    lines.append(title.center(receipt_width))
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


def _wrap_lines(
    text: str,
    width: int | None = None,
    profile: PrinterProfile | None = None,
) -> list[str]:
    resolved_profile = resolve_printer_profile(profile=profile)
    effective_width = width or resolved_profile["receipt_width"]
    lines: list[str] = []
    for raw_line in text.splitlines() or [""]:
        wrapped = textwrap.wrap(raw_line, width=effective_width) or [""]
        lines.extend(wrapped)
    return lines


def _build_remision_totals(
    valor_venta: object,
    abonado: object,
    saldo: object,
    profile: PrinterProfile,
) -> list[str]:
    totals: list[str] = []

    if valor_venta is not None:
        totals.append(_format_label_value("Valor venta", _format_currency(valor_venta), profile=profile))

    if abonado is not None:
        totals.append(_format_label_value("Abonos", _format_currency(abonado), profile=profile))

    if saldo is not None:
        totals.append(_format_label_value("Saldo", _format_currency(saldo), profile=profile))

    return totals


def _build_abonos_lines(abonos: object, profile: PrinterProfile) -> list[str]:
    if not isinstance(abonos, list) or not abonos:
        return []

    receipt_width = profile["receipt_width"]
    lines = [
        "ABONOS REALIZADOS",
        _format_abono_header(profile),
        "-" * receipt_width,
    ]

    for abono in abonos:
        if not isinstance(abono, dict):
            continue
        medio_pago = str(abono.get("medio_pago") or abono.get("medioDePago") or "N/A")
        fecha = str(abono.get("fecha") or "")
        valor = abono.get("valor", abono.get("precio", 0))
        lines.extend(_build_abono_table_lines(medio_pago, fecha, valor, profile))

    return lines


def _format_item_header(profile: PrinterProfile) -> str:
    return (
        f"{'DESCRIPCION':<{profile['item_desc_width']}}"
        f"{'CANT':>{profile['item_qty_width']}}"
        f"{'PRECIO':>{profile['item_price_width']}}"
        f"{'TOTAL':>{profile['item_total_width']}}"
    )


def _build_item_table_lines(
    descripcion: str,
    cantidad: object,
    valor_unitario: object,
    valor_total: object,
    profile: PrinterProfile,
) -> list[str]:
    desc_width = profile["item_desc_width"]
    qty_width = profile["item_qty_width"]
    price_width = profile["item_price_width"]
    total_width = profile["item_total_width"]
    descripcion_lineas = textwrap.wrap(descripcion or "ITEM", width=desc_width) or ["ITEM"]
    cantidad_texto = _fit_right(str(cantidad), qty_width)
    precio_texto = _fit_right(_format_currency_short(valor_unitario, price_width), price_width)
    total_texto = _fit_right(_format_currency_short(valor_total, total_width), total_width)

    lines = [
        f"{descripcion_lineas[0]:<{desc_width}}{cantidad_texto}{precio_texto}{total_texto}"
    ]
    for extra in descripcion_lineas[1:]:
        lines.append(
            f"{extra:<{desc_width}}"
            f"{'':>{qty_width}}"
            f"{'':>{price_width}}"
            f"{'':>{total_width}}"
        )
    return lines


def _format_abono_header(profile: PrinterProfile) -> str:
    return (
        f"{'MEDIO PAGO':<{profile['abono_medio_width']}}"
        f"{'FECHA':<{profile['abono_fecha_width']}}"
        f"{'VALOR':>{profile['abono_valor_width']}}"
    )


def _build_abono_table_lines(
    medio_pago: str,
    fecha: str,
    valor: object,
    profile: PrinterProfile,
) -> list[str]:
    medio_width = profile["abono_medio_width"]
    fecha_width = profile["abono_fecha_width"]
    valor_width = profile["abono_valor_width"]
    medio_lineas = textwrap.wrap(medio_pago or "N/A", width=medio_width) or ["N/A"]
    fecha_corta = fecha[:fecha_width]
    valor_texto = _fit_right(_format_currency_short(valor, valor_width), valor_width)

    lines = [
        f"{medio_lineas[0]:<{medio_width}}{fecha_corta:<{fecha_width}}{valor_texto}"
    ]
    for extra in medio_lineas[1:]:
        lines.append(
            f"{extra:<{medio_width}}"
            f"{'':<{fecha_width}}"
            f"{'':>{valor_width}}"
        )
    return lines


def _format_label_value(
    label: str,
    value: str,
    width: int | None = None,
    profile: PrinterProfile | None = None,
) -> str:
    resolved_profile = resolve_printer_profile(profile=profile)
    effective_width = width or resolved_profile["receipt_width"]
    spaces = max(1, effective_width - len(label) - len(value))
    return f"{label}{' ' * spaces}{value}"


def _fit_right(value: str, width: int) -> str:
    return value[-width:].rjust(width)


def _format_currency_short(value: object, width: int = 10) -> str:
    text = _format_currency(value)
    return text if len(text) <= width else text[-width:]


def _format_currency(value: object) -> str:
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return str(value or "")

    if amount.is_integer():
        return f"${int(amount):,}".replace(",", ".")

    integer_part, decimal_part = f"{amount:,.2f}".split(".")
    return f"${integer_part.replace(',', '.')},{decimal_part}"
