from PIL import Image, ImageDraw, ImageFont

# Abrir la imagen
imagen = Image.open("citas.jpeg")

# Preparar para dibujar
dibujo = ImageDraw.Draw(imagen)

# Especificar fuente (puedes descargar una .ttf o usar la predeterminada)
try:
    fuente = ImageFont.truetype("arial.ttf", 40)
except:
    fuente = ImageFont.load_default()

# Texto a añadir
texto = "Texto de ejemplo"

# Posición del texto (x, y)
posicion = (50, 900)

# Color del texto (R, G, B)
color_texto = (255, 255, 255)  # Blanco

# Añadir texto
dibujo.text(posicion, texto, fill=color_texto, font=fuente)

# Guardar la imagen resultante
imagen.save("imagen_con_texto.jpg")

# Mostrar la imagen (opcional)
imagen.show()