from __future__ import annotations

import argparse
import textwrap
from dataclasses import dataclass

import win32print


PRINTER_ENUM_FLAGS = (
    win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
)


@dataclass
class PrinterInfo:
    name: str
    port: str
    driver: str
    is_default: bool


def list_printers() -> list[PrinterInfo]:
    default_name = win32print.GetDefaultPrinter()
    printers: list[PrinterInfo] = []

    for flags, description, name, comment in win32print.EnumPrinters(
        PRINTER_ENUM_FLAGS
    ):
        handle = win32print.OpenPrinter(name)
        try:
            info_level_2 = win32print.GetPrinter(handle, 2)
        finally:
            win32print.ClosePrinter(handle)
        printers.append(
            PrinterInfo(
                name=name,
                port=info_level_2["pPortName"],
                driver=info_level_2["pDriverName"],
                is_default=name == default_name,
            )
        )

    printers.sort(key=lambda printer: (not printer.is_default, printer.name.lower()))
    return printers


def print_printer_list(printers: list[PrinterInfo]) -> None:
    if not printers:
        print("No se encontraron impresoras instaladas en Windows.")
        return

    print("Impresoras disponibles:\n")
    for index, printer in enumerate(printers, start=1):
        default_label = " [predeterminada]" if printer.is_default else ""
        print(
            f"{index}. {printer.name}{default_label}\n"
            f"   Puerto: {printer.port}\n"
            f"   Driver: {printer.driver}"
        )


def choose_printer(
    printers: list[PrinterInfo], printer_name: str | None, printer_index: int | None
) -> PrinterInfo:
    if not printers:
        raise RuntimeError("No hay impresoras disponibles para seleccionar.")

    if printer_name:
        normalized = printer_name.strip().lower()
        for printer in printers:
            if printer.name.lower() == normalized:
                return printer
        raise ValueError(f"No existe una impresora con el nombre '{printer_name}'.")

    if printer_index is not None:
        position = printer_index - 1
        if 0 <= position < len(printers):
            return printers[position]
        raise ValueError(f"El indice {printer_index} no corresponde a una impresora.")

    print_printer_list(printers)
    while True:
        selected = input("\nSelecciona el numero de la impresora: ").strip()
        if not selected.isdigit():
            print("Debes escribir un numero valido.")
            continue

        position = int(selected) - 1
        if 0 <= position < len(printers):
            return printers[position]

        print("El numero indicado no existe en la lista.")


def wrap_text(text: str, width: int = 42) -> str:
    wrapped_lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if not line:
            wrapped_lines.append("")
            continue

        wrapped_lines.extend(
            textwrap.wrap(
                line,
                width=width,
                replace_whitespace=False,
                drop_whitespace=False,
            )
        )

    return "\n".join(wrapped_lines)


def build_constancia(
    cliente: str,
    documento: str,
    detalle: str,
    fecha: str,
    titulo: str = "CONSTANCIA",
) -> str:
    body = [
        titulo.center(42),
        "",
        f"Cliente: {cliente}",
        f"Documento: {documento}",
        f"Fecha: {fecha}",
        "",
        "Detalle:",
        wrap_text(detalle, width=42),
        "",
        "Firma cliente: ________________________",
    ]
    return "\n".join(body).strip() + "\n"


def send_raw_text_to_printer(
    printer_name: str,
    content: str,
    job_name: str = "Constancia POS",
    encoding: str = "cp850",
    cut_paper: bool = True,
    open_drawer: bool = False,
) -> None:
    esc_init = b"\x1b@"
    esc_center = b"\x1b\x61\x01"
    esc_left = b"\x1b\x61\x00"
    esc_feed = b"\x1b\x64\x04"
    esc_cut = b"\x1dV\x00"
    esc_drawer = b"\x1bp\x00\x19\xfa"

    handle = win32print.OpenPrinter(printer_name)
    try:
        win32print.StartDocPrinter(handle, 1, (job_name, None, "RAW"))
        try:
            win32print.StartPagePrinter(handle)
            try:
                payload = content.replace("\r\n", "\n").replace("\r", "\n")
                payload = payload.strip("\n") + "\n\n"
                raw_text = payload.encode(encoding, errors="replace")

                win32print.WritePrinter(handle, esc_init)
                win32print.WritePrinter(handle, esc_center)
                win32print.WritePrinter(handle, raw_text)
                win32print.WritePrinter(handle, esc_left)
                win32print.WritePrinter(handle, esc_feed)

                if cut_paper:
                    win32print.WritePrinter(handle, esc_cut)

                if open_drawer:
                    win32print.WritePrinter(handle, esc_drawer)
            finally:
                win32print.EndPagePrinter(handle)
        finally:
            win32print.EndDocPrinter(handle)
    finally:
        win32print.ClosePrinter(handle)


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Detecta impresoras en Windows y envia una constancia a una POS."
    )
    parser.add_argument(
        "--listar",
        action="store_true",
        help="Muestra las impresoras detectadas y termina.",
    )
    parser.add_argument(
        "--impresora",
        help="Nombre exacto de la impresora a usar.",
    )
    parser.add_argument(
        "--indice",
        type=int,
        help="Indice de la impresora segun la lista mostrada en pantalla.",
    )
    parser.add_argument(
        "--cliente",
        default="Juan Perez",
        help="Nombre del cliente para la constancia.",
    )
    parser.add_argument(
        "--documento",
        default="CC 123456789",
        help="Documento del cliente.",
    )
    parser.add_argument(
        "--fecha",
        default="2026-03-19",
        help="Fecha a imprimir.",
    )
    parser.add_argument(
        "--detalle",
        default=(
            "Se entrega constancia de recepcion del trabajo o servicio "
            "realizado por la optica."
        ),
        help="Texto libre del cuerpo de la constancia.",
    )
    parser.add_argument(
        "--sin-corte",
        action="store_true",
        help="No envia el comando de corte al final.",
    )
    return parser


def main() -> None:
    parser = build_argument_parser()
    args = parser.parse_args()

    printers = list_printers()

    if args.listar:
        print_printer_list(printers)
        return

    selected_printer = choose_printer(printers, args.impresora, args.indice)
    constancia = build_constancia(
        cliente=args.cliente,
        documento=args.documento,
        detalle=args.detalle,
        fecha=args.fecha,
    )

    print(f"\nImprimiendo en: {selected_printer.name}\n")
    print(constancia)
    send_raw_text_to_printer(
        selected_printer.name,
        constancia,
        cut_paper=not args.sin_corte,
    )
    print("Documento enviado a la impresora.")


if __name__ == "__main__":
    main()
