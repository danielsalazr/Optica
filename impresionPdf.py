import win32print
import win32api
import os

# Requiere que este inslado acrobat reader

# Nombre de la impresora
printer_name = "EPSON TM-T20II Receipt"  # Asegúrate de colocar el nombre correcto de la impresora

printer_name = "EPSON TM-U220 Receipt"
# Ruta del archivo PDF
pdf_path = "./Factura_Termal.pdf"

# Abre la impresora
handle = win32print.OpenPrinter(printer_name)

# Crea un trabajo de impresión
job = win32print.StartDocPrinter(handle, 1, ("Impresión de Factura", None, "RAW"))
win32print.StartPagePrinter(handle)

# Usamos el comando "start" para enviar el archivo PDF a la impresora
# Esto usa el programa predeterminado de Windows para manejar la impresión de PDFs (como Adobe Reader o Edge)
command = f'cmd /c start /min Acrobat.exe /t "{pdf_path}" "{printer_name}"'
os.system(command)  # Envia el comando al sistema

# Finaliza la página e imprime
win32print.EndPagePrinter(handle)
win32print.EndDocPrinter(handle)
win32print.ClosePrinter(handle)





# import os

# # Ruta al archivo PDF
# pdf_path = "C:/Users/User/Desktop/desarrollo/Proyectos de software/optica/Factura_Termal.pdf"

# # Nombre de la impresora
# printer_name = "EPSON TM-T20II Receipt5"

# # Usamos el comando "start" para abrir el PDF en el visor predeterminado y enviar a la impresora
# command = f'cmd /c start /min msedge.exe /t "{pdf_path}" "{printer_name}"'
# os.system(command)