from fpdf import FPDF

import usb.core

# Encuentra todos los dispositivos USB
devices = usb.core.find(find_all=True)

print(devices)

for device in devices:
    if device.idVendor == 0x04b8:  # Vendor ID de Epson
        print(f"Impresora encontrada: Vendor ID={device.idVendor}, Product ID={device.idProduct}")

class ThermalInvoice(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 10)
        self.cell(0, 8, 'Mi Tienda', ln=True, align='C')
        self.set_font('Arial', '', 8)
        self.cell(0, 5, 'NIT: 123456789', ln=True, align='C')
        self.cell(0, 5, 'Tel: +57 300 123 4567', ln=True, align='C')
        self.cell(0, 5, 'Dirección: Calle 123 #45-67', ln=True, align='C')
        self.ln(5)

    def footer(self):
        self.set_y(-20)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 5, 'Gracias por su compra.', ln=True, align='C')
        self.cell(0, 5, 'Por favor conserve esta factura.', ln=True, align='C')

# Configurar el tamaño de página para 80mm de ancho
pdf = ThermalInvoice('P', 'mm', (80, 180))
pdf.set_margins(5, 5, 5)
pdf.add_page()

# Información del cliente y factura
pdf.set_font('Arial', '', 8)
pdf.cell(0, 5, 'Factura No: 000123', ln=True)
pdf.cell(0, 5, 'Fecha: 2025-01-23', ln=True)
pdf.cell(0, 5, 'Cliente: Juan Pérez', ln=True)
pdf.cell(0, 5, 'NIT/CC: 987654321', ln=True)
pdf.ln(3)

# Encabezado de la tabla de productos
pdf.set_font('Arial', 'B', 8)
pdf.cell(20, 5, 'Producto', border=1)
pdf.cell(10, 5, 'Cant', border=1, align='C')
pdf.cell(15, 5, 'P. Unit', border=1, align='C')
pdf.cell(15, 5, 'Total', border=1, align='C')
pdf.ln(5)

# Productos
pdf.set_font('Arial', '', 8)
productos = [
    ('Producto A', 2, 15000),
    ('Producto B', 1, 10000),
    ('Producto C', 3, 5000),
]

for producto, cantidad, precio_unitario in productos:
    total = cantidad * precio_unitario
    pdf.cell(20, 5, producto, border=1)
    pdf.cell(10, 5, str(cantidad), border=1, align='C')
    pdf.cell(15, 5, f'{precio_unitario:,.0f}', border=1, align='C')
    pdf.cell(15, 5, f'{total:,.0f}', border=1, align='C')
    pdf.ln(5)

# Totales
subtotal = sum(cantidad * precio_unitario for _, cantidad, precio_unitario in productos)
iva = subtotal * 0.19
total = subtotal + iva

pdf.ln(3)
pdf.set_font('Arial', 'B', 8)
pdf.cell(0, 5, f'Subtotal: {subtotal:,.0f}', ln=True, align='R')
pdf.cell(0, 5, f'IVA (19%): {iva:,.0f}', ln=True, align='R')
pdf.cell(0, 5, f'Total: {total:,.0f}', ln=True, align='R')

# Guardar archivo
pdf.output('Factura_Termal.pdf')

from escpos.printer import Usb

# Configura la impresora USB (VendorID, ProductID)
# Busca estos IDs con "lsusb" en Linux
p = Usb(0x04b8, 0x0e15)  # IDs para Epson TM-T20II (pueden variar)

# Envía texto a la impresora
p.text("Hola Mundo!\n")
p.cut()