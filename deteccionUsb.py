
# # Primer codifo Funcional
# import win32print
# import win32api

# printers = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL)
# for printer in printers:
#     print(printer[2])

# printer_name = "EPSON TM-T20II Receipt"
# raw_data = b"\x1b@Hola Mundo!\n"
# advance_command = b"\x1b\x64\x03"
# cut_command = b"\x1b\x69"

# # Abre la impresora
# handle = win32print.OpenPrinter(printer_name)


# # Crea un trabajo de impresión
# job = win32print.StartDocPrinter(handle, 1, ("Test", None, "RAW"))
# win32print.StartPagePrinter(handle)

# # Desde aqui se controla los datos enviados al papel
# # Envía datos
# win32print.WritePrinter(handle, raw_data)
# win32print.WritePrinter(handle, advance_command)
# win32print.WritePrinter(handle, cut_command)

# # Finalizar tarea
# win32print.EndPagePrinter(handle)
# win32print.EndDocPrinter(handle)
# win32print.ClosePrinter(handle)


# Segundo codigo

# import win32print
# import win32api

# # Nombre de la impresora (debe coincidir con el nombre en el Administrador de Dispositivos)
# printer_name = "EPSON TM-T20II Receipt"

# # Datos de la factura
# factura_header = b"\x1b@Factura No. 12345\n"
# cliente = b"Cliente: Juan Perez\n"
# fecha = b"Fecha: 2025-01-25\n"
# productos_header = b"\nProducto           Cantidad   Precio   Total\n"
# producto1 = b"Producto A         2          10.00    20.00\n"
# producto2 = b"Producto B         1          15.00    15.00\n"
# total = b"\nTotal:                         35.00\n"

# # Comando ESC/POS para avanzar 3 líneas de papel
# advance_command = b"\x1b\x64\x03"

# # Comando ESC/POS para cortar el papel
# cut_command = b"\x1b\x69"

# # Comando de alineación (centrado)
# center_align = b"\x1b\x61\x01"  # Alineación centrada
# left_align = b"\x1b\x61\x00"  # Alineación a la izquierda

# # Comando para activar negrita (puedes ajustar según necesidad)
# bold_on = b"\x1b\x45\x01"  # Negrita activada
# bold_off = b"\x1b\x45\x00"  # Negrita desactivada

# # Abre la impresora
# handle = win32print.OpenPrinter(printer_name)

# # Crea un trabajo de impresión
# job = win32print.StartDocPrinter(handle, 1, ("Factura", None, "RAW"))
# win32print.StartPagePrinter(handle)

# # Envía los datos de la factura a la impresora
# win32print.WritePrinter(handle, center_align)  # Centrado
# win32print.WritePrinter(handle, factura_header)  # Encabezado de la factura
# win32print.WritePrinter(handle, left_align)  # Alineación izquierda
# win32print.WritePrinter(handle, cliente)  # Información del cliente
# win32print.WritePrinter(handle, fecha)  # Fecha de la factura
# win32print.WritePrinter(handle, productos_header)  # Cabecera de los productos
# win32print.WritePrinter(handle, producto1)  # Detalles del producto 1
# win32print.WritePrinter(handle, producto2)  # Detalles del producto 2
# win32print.WritePrinter(handle, total)  # Total de la factura

# # Avanza 3 líneas antes de cortar
# win32print.WritePrinter(handle, advance_command)

# # Envía el comando de corte
# win32print.WritePrinter(handle, cut_command)

# win32print.EndPagePrinter(handle)
# win32print.EndDocPrinter(handle)
# win32print.ClosePrinter(handle)


# Codigo 3

import win32print
import win32api

# Nombre de la impresora (debe coincidir con el nombre en el Administrador de Dispositivos)
printer_name = "EPSON TM-T20II Receipt"

# Crear un string multilínea para la factura usando comillas triples
factura = """
Factura No. 12345
Cliente: Juan Perez
Fecha: 2025-01-25

Producto         Cantidad  Precio  Total
----------------------------------------
Producto A       2         10.00   20.00
Producto B       1         15.00   15.00

Total:                         35.00
"""

# Comando ESC/POS para avanzar 3 líneas de papel
advance_command = b"\x1b\x64\x03"

# Comando ESC/POS para cortar el papel
cut_command = b"\x1b\x69"

# Comando de alineación (centrado)
center_align = b"\x1b\x61\x01"  # Alineación centrada
left_align = b"\x1b\x61\x00"  # Alineación a la izquierda

# Abre la impresora
handle = win32print.OpenPrinter(printer_name)

# Crea un trabajo de impresión
job = win32print.StartDocPrinter(handle, 1, ("Factura", None, "RAW"))
win32print.StartPagePrinter(handle)

# Imprime el texto de la factura (usando el string multilínea)
win32print.WritePrinter(handle, center_align)  # Centrado
win32print.WritePrinter(handle, factura.encode())  # Imprimir el string de la factura

# Avanza 3 líneas antes de cortar
win32print.WritePrinter(handle, advance_command)

# Comando de corte
win32print.WritePrinter(handle, cut_command)

win32print.EndPagePrinter(handle)
win32print.EndDocPrinter(handle)
win32print.ClosePrinter(handle)