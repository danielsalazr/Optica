from django.db import models
from django.utils import timezone
from usuarios.models import Clientes
from django.db.models.deletion import DO_NOTHING
from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import os

from rich.console import Console
console = Console()

MONTHS_ES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
]

WEEKDAYS_ES = [
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
    "domingo",
]

class MediosDePago(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default='')
    imagen = models.CharField(max_length=255, blank=True, null=True)
    #nequi
    #bamcolombia
    #daviplata
    #caja

    class Meta:
        verbose_name = "Medios de Pago"
        verbose_name_plural = "Medios de Pago"
        managed = True

    def __str__(self):
        return self.nombre

class EstadoVenta(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default='')

    class Meta:
        verbose_name = "Estado Venta"
        verbose_name_plural = "Estado Venta"
        managed = True

    def __str__(self):
        return self.nombre

class Proveedores(models.Model):
    id = models.IntegerField(primary_key=True, default=0, unique=True)
    nombre = models.CharField(max_length=50, default='')
    telefono = models.CharField(max_length=50, default='', null=True)
    email = models.EmailField(max_length=254)


class Gastos(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default='')
    valor = models.IntegerField(default=0)
    fecha = models.DateTimeField(verbose_name="Fecha de registro", default=timezone.now)


class PagosProveedores(models.Model):
    #id es Facura de provedor
    id = models.AutoField(primary_key=True)
    proveedor = models.ForeignKey(Proveedores, on_delete=DO_NOTHING , verbose_name="Proveedor", blank=True, null=True)
    nombre = models.CharField(max_length=50, default='')
    Estado = models.CharField(max_length=50, default='')

# class EstadoFactura(models.Model):
#     id = models.AutoField(primary_key=True)
#     nombre = models.CharField(max_length=50, default='')
#     pass
#     #pagado
#     #pendiente


# Dee haber una pabtalla que me cruce los dos



class Articulos(models.Model):

    OPCIONES = [
        ('1', 'Articulo'),
        ('2', 'Servicio'),
        # ('opc3', 'Opción 3'),
    ]

    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, default='')
    descripcion = models.TextField(max_length=255, default='', null=True, blank=True)
    precio = models.IntegerField(default=0)
    tipo_articulo = models.CharField(max_length=10, choices=OPCIONES, null=True, blank=True)
    # tipo_articulo = models.ForeignKey(TipoArticulos, on_delete=DO_NOTHING ,related_name='tipoArticulos')
    # foto = models.ImageField(upload_to='articulos/', null=True, blank=True)
    

    class Meta:
        verbose_name = "Articulo"
        verbose_name_plural = "Articulos"
        managed = True

    def __str__(self):
        return self.nombre

class TipoVenta(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default='')
    # tipo_venta = models.ForeignKey(TipoArticulos, on_delete=DO_NOTHING ,related_name='tipoArticulos')
    # foto = models.ImageField(upload_to='articulos/', null=True, blank=True)


    class Meta:
        verbose_name = "Tipo de venta"
        verbose_name_plural = "Tipos de venta"
        managed = True

    def __str__(self):
        return self.nombre


class Ventas(models.Model):

    OPCIONES = [
        ('1', 'personal'),
        ('2', 'convenio'),
        # ('opc3', 'Opción 3'),
    ]
    #id es el numero de factura de la venta, hay que asegurarse que empiece a partir de un nuemero de factura
    id = models.IntegerField(primary_key=True, verbose_name="orden de pedido")
    #cliente_id = models.ForeignKey(Clientes, on_delete=DO_NOTHING , verbose_name="Id de cliente", blank=True, null=True)
    cliente_id = models.BigIntegerField(default=0, verbose_name="Id de cliente", blank=True, null=True)
    empresaCliente = models.CharField(max_length=60,)
    detalle = models.TextField(max_length=50, default='', blank=True, null=True)
    observacion = models.TextField(max_length=50, default='', blank=True, null=True)
    precio = models.IntegerField(default=0, verbose_name="Precio")
    totalAbono = models.IntegerField(default=0, verbose_name="Abono inicial")
    # Descuento = models.IntegerField(default=0)
    # total_venta = models.IntegerField(default=0)
    #estado = models.CharField(max_length=50, default='')
    estado = models.ForeignKey(EstadoVenta, default=1,  on_delete=DO_NOTHING , verbose_name="Estado venta", blank=True, null=True)
    fecha = models.DateField(verbose_name="Fecha de Venta", default=timezone.now)
    fechaCreacion = models.DateTimeField(verbose_name="Fecha de Venta", default=timezone.now)
    foto = models.ImageField(upload_to='fotos_ventas/', blank=True, null=True)
    tipo_venta = models.ForeignKey(TipoVenta, default=1, on_delete=DO_NOTHING, null=True, blank=True)
    anulado = models.BooleanField(default=False, verbose_name="Anulado")
    detalleAnulacion = models.TextField(max_length=500, blank=True, null=True)
    usuarioAnulacion = models.IntegerField(default=None, blank=True, null=True)
    cuotas = models.IntegerField(default=1, verbose_name="Cuotas")
    ordenTrabajoLaboratorio = models.IntegerField(default=0, verbose_name="Orden de trabajo laboratorio", blank=True, null=True)
    

    class Meta:
        verbose_name = "Ventas"
        verbose_name_plural = "Ventas"
        managed = True


    def __str__(self):
        return str(self.id)


    def resumen(self):
        return self.id[:50] + '...' 

    
    
    def __int__(self):
        return str(self.id)

    def nombre(self):
        nombre = Clientes.objects.get(cedula=self.cliente_id)
        nombre = f"{nombre.nombre}"
        return nombre

    @property
    def precio_venta(self):
        return '${:,.0f}'.format(self.precio)
    
    @property
    def abono_inicial(self):
        return '${:,.0f}'.format(self.totalAbono)
    

class anulaciones(models.Model):
    id = models.AutoField(primary_key=True)
    venta = models.ForeignKey(Ventas, on_delete=DO_NOTHING , verbose_name="Venta")
    anuladoPor = models.CharField(max_length=100)

class AcuerdoDePago(models.Model):

    OPCIONES = [
        ('1', 'personal'),
        ('2', 'convenio'),
        # ('opc3', 'Opción 3'),
    ]

    ESTADOS = [
        ('1', 'vigente'),
        ('2', 'completado'),
        ('3', 'incumplido'),
    ]

    id = models.AutoField(primary_key=True) # INT PRIMARY KEY,
    venta = models.ForeignKey(Ventas, on_delete=DO_NOTHING ,related_name='idVentaAcuerdo')
    fecha_acuerdo = models.DateField(default=timezone.now)   # DATE NOT NULL,
    tipo_periodicidad = models.CharField(max_length=50, default='', choices=ESTADOS)
    precio = models.IntegerField(default=1) # ENUM('quincenal', 'mensual', 'personalizado') NOT NULL,
    numero_cuotas = models.IntegerField(default=1,) #INT NOT NULL,
    dia_pago = models.DateField(default=None, null=True, blank=True) #INT, -- Para mensual: día del mes (1-28), quincenal: null
    interes_mora = models.FloatField(default=0.0,) #DECIMAL(5,2) DEFAULT 0,
    estado = models.CharField(max_length=50, default='', choices=ESTADOS) # ENUM('vigente', 'completado', 'incumplido') DEFAULT 'vigente',
    

class Cuota(models.Model):

    # 'pendiente', 'pagada', 'vencida', 'cancelada') DEFAULT 'pendiente'
    ESTADOS = [
        ('1', 'vigente'),
        ('2', 'completado'),
        ('3', 'incumplido'),
    ]

    id = models.AutoField(primary_key=True) # INT PRIMARY KEY,
    acuerdo = models.ForeignKey(AcuerdoDePago, on_delete=DO_NOTHING ,related_name='idAcuerdo') #INT NOT NULL,
    numero_cuota = models.IntegerField(default=1) # INT NOT NULL,
    fecha_vencimiento = models.DateField()# DATE NOT NULL,
    monto = models.IntegerField(default=0,)  #DECIMAL(12,2) NOT NULL,
    estado = models.CharField(default='', max_length=20, choices=ESTADOS,)  #ENUM('pendiente', 'pagada', 'vencida', 'cancelada') DEFAULT 'pendiente',
    fecha_pago = models.DateField(),
    monto_pagado = models.IntegerField(default=1) # DECIMAL(12,2) DEFAULT 0,
    # FOREIGN KEY (id_acuerdo) REFERENCES AcuerdoPago(id_acuerdo)


class ItemsVenta(models.Model):
    venta = models.ForeignKey(Ventas, on_delete=DO_NOTHING ,related_name='idVenta')
    articulo = models.ForeignKey(Articulos, on_delete=DO_NOTHING ,related_name='articuloVenta')
    cantidad = models.IntegerField(default=0)
    precio_articulo = models.IntegerField(default=0)
    descuento = models.IntegerField(default=0)
    totalArticulo = models.IntegerField(default=0)
    # tipo_descuento


class Abonos(models.Model):
    id = models.AutoField(primary_key=True)
    venta = models.ForeignKey(Ventas, on_delete=DO_NOTHING , verbose_name="pedido de venta", blank=True, null=True)
    #cliente_id = models.ForeignKey(Clientes, on_delete=DO_NOTHING , verbose_name="Id de cliente", blank=True, null=True)
    cliente_id = models.BigIntegerField(verbose_name="cedula de cliente", blank=True, null=True, default=0)
    precio = models.IntegerField(default=0, verbose_name="valor")
    medioDePago = models.ForeignKey(MediosDePago, on_delete=DO_NOTHING, verbose_name="Medio de Pago")
    fecha = models.DateTimeField(verbose_name="Fecha de registro", default=timezone.now)
    descripcion = models.TextField(max_length=200, default=None, blank=True, null=True)
    # abono debe mostrar el saldo, osea el valor a pagar

    class Meta:
        verbose_name = "Abono"
        verbose_name_plural = "Abonos"
        managed = True

    def n_pedidoVenta(self):
        return self.venta.id
    
    def nombre(self):
        nombre = Clientes.objects.get(cedula=self.cliente_id)
        nombre = f"{nombre.nombre}"
        return nombre

    @property
    def precio_moneda(self):
        return '${:,.0f}'.format(self.precio)
    


# class TipoArticulos(models.Model):
#     id = models.AutoField(primary_key=True)
#     nombre = models.CharField(max_length=100, default='')
#     # Aqui van aser entregables y no entreganbles    

class Saldos(models.Model):
    id = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(Clientes, on_delete=models.DO_NOTHING, related_name="saldosCliente",)
    venta = models.ForeignKey(Ventas, on_delete=models.DO_NOTHING, related_name="saldoVenta")
    saldo = models.IntegerField(default=0)
    fecha_Vencimiento = models.DateField(verbose_name="fecha vencimiento", blank=True, null=True,)


    class Meta:
        managed = True
        verbose_name = "Saldo"
        verbose_name_plural = "Saldos"


class HistoricoSaldos(models.Model):
    id = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(Clientes, on_delete=models.DO_NOTHING, related_name="historicoSaldoCliente",)
    venta = models.ForeignKey(Ventas, on_delete=models.DO_NOTHING, related_name="historicoSaldoVenta")
    saldo = models.IntegerField(default=0)
    fecha = models.DateTimeField(verbose_name="Fecha de registro", default=timezone.now)


    class Meta:
        managed = True
        verbose_name = "Saldos - historico"
        verbose_name_plural = "Saldos - historico"


class Devoluciones(models.Model):
    id = models.AutoField(primary_key=True)
    venta = models.ForeignKey(Ventas, on_delete=DO_NOTHING , verbose_name="pedido de venta", blank=True, null=True)
    #cliente_id = models.ForeignKey(Clientes, on_delete=DO_NOTHING , verbose_name="Id de cliente", blank=True, null=True)
    cliente_id = models.BigIntegerField(verbose_name="cedula de cliente", blank=True, null=True, default=0)
    precio = models.IntegerField(default=0, verbose_name="valor")
    medioDePago = models.ForeignKey(MediosDePago, on_delete=DO_NOTHING, verbose_name="Medio de devolucion")
    fecha = models.DateTimeField(verbose_name="Fecha de registro", default=timezone.now)
    # abono debe mostrar el saldo, osea el valor a pagar

    class Meta:
        verbose_name = "Devolucion"
        verbose_name_plural = "Devoluciones"
        managed = True 

    def __str__(self):
        return f"{self.id}"

    
class HistoricoDevoluciones(models.Model):
    id = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(Clientes, on_delete=models.DO_NOTHING, related_name="historicoDevolucionCliente",)
    venta = models.ForeignKey(Ventas, on_delete=models.DO_NOTHING, related_name="historicoDevolucionVenta")
    saldo = models.IntegerField(default=0)
    fecha = models.DateTimeField(verbose_name="Fecha de registro", default=timezone.now)


    class Meta:
        managed = True
        verbose_name = "Saldos - historico"
        verbose_name_plural = "Saldos - historico"


class FotosArticulos(models.Model):
    id = models.AutoField(primary_key=True)
    articulo = models.ForeignKey(Articulos, on_delete=models.DO_NOTHING, related_name="articuloFoto",)
    foto = models.ImageField(upload_to='fotos_articulos/')


    class Meta:
        managed = True
        verbose_name = "Fotos de Articulos"
        verbose_name_plural = "Fotos de Articulos"
    
    def __str__(self):
        return f"{self.articulo}"

    def save(self, *args, **kwargs):
        # Llama al método original `save` para guardar temporalmente la imagen
        super().save(*args, **kwargs)

        # Abre la imagen con Pillow
        if self.foto:
            img_path = self.foto.path  # Ruta de la imagen en el sistema de archivos
            img = Image.open(img_path)

            console.log(img.height)
            console.log(img.width)

            # Verifica si la imagen necesita ser redimensionada
            if img.height > 800 or img.width > 800:  # Ejemplo: limitar dimensiones máximas
                # Calcula las proporciones manteniendo el aspecto
                # max_size = (2000, 1500)
                max_size = (img.height / 1.4, img.width / 1.4)
                img.thumbnail(max_size)

                console.log(img.height)
                console.log(img.width)

                # Sobrescribe la imagen existente con la versión redimensionada
                img.save(img_path, optimize=True, quality=20)



class EstadoPedidoVenta(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default='')


    class Meta:
        managed = True
        verbose_name = "Estado pedido de venta"
        verbose_name_plural = "Estado pedidos de venta"

    def __str__(self):
        return f"{self.nombre}"

class PedidoVenta(models.Model):
    id = models.AutoField(primary_key=True)
    estado = models.ForeignKey(EstadoPedidoVenta, on_delete=DO_NOTHING ,related_name='estadosPEdidoVenta')
    fecha = models.DateTimeField(auto_now_add=timezone.now)
    venta = models.ForeignKey(Ventas, on_delete=DO_NOTHING ,related_name='pedidoVenta')
    fecha_aprobacion = models.DateTimeField(default=None, blank=True, null=True,)
    fecha_entrega = models.DateField(default=None, blank=True, null=True,)

    class Meta:
        managed = True
        verbose_name = "Pedido venta"
        verbose_name_plural = "Pedidos ventas"

    def __str__(self):
        return f"{self.id}"

class ItemsPEdidoVenta(models.Model):
    id = models.AutoField(primary_key=True)
    pedido = models.ForeignKey(PedidoVenta, on_delete=DO_NOTHING ,related_name='idPEdido')
    articulo = models.ForeignKey(Articulos, on_delete=DO_NOTHING ,related_name='articuloPedido')
    cantidad = models.IntegerField(default=0)

    class Meta:
        managed = True
        verbose_name = "Items pedido Venta"
        verbose_name_plural = "Items pedidos Venta"

    def __str__(self):
        return f"{self.articulo}"
    

RESAMPLE_STRATEGY = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS


class CitaAgenda(models.Model):
    title = models.CharField(max_length=160, default="Jornada de bienestar")
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    nota = models.CharField(max_length=255, blank=True, default="")
    background_image = models.ImageField(upload_to="citas/backgrounds/", blank=True, null=True)
    hero_image = models.ImageField(
        upload_to="citas/generated/",
        blank=True,
        null=True,
        editable=False,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["fecha", "hora_inicio"]
        verbose_name = "Cita programada"
        verbose_name_plural = "Citas programadas"

    def __str__(self):
        return f"{self.title} · {self.display_date}"

    @property
    def time_range(self):
        return f"{self.hora_inicio.strftime('%H:%M')} - {self.hora_fin.strftime('%H:%M')}"

    @property
    def display_date(self):
        weekday = WEEKDAYS_ES[self.fecha.weekday()].capitalize()
        month = MONTHS_ES[self.fecha.month - 1]
        return f"{weekday} {self.fecha.day:02d} de {month.capitalize()}"

    def save(self, *args, **kwargs):
        update_fields = kwargs.get("update_fields")
        bypass_overlay = update_fields and set(update_fields) == {"hero_image"}
        if bypass_overlay:
            return super().save(*args, **kwargs)

        should_refresh = self.pk is None
        if self.pk:
            previous = type(self).objects.filter(pk=self.pk).first()
            if previous:
                should_refresh = any(
                    [
                        previous.fecha != self.fecha,
                        previous.hora_inicio != self.hora_inicio,
                        previous.hora_fin != self.hora_fin,
                        previous.nota != self.nota,
                        previous.background_image != self.background_image,
                        previous.is_active != self.is_active,
                    ]
                )

        result = super().save(*args, **kwargs)
        if should_refresh:
            self._generate_overlay_image()
        return result

    def ensure_overlay_image(self):
        if not self.hero_image or not self.hero_image.storage.exists(self.hero_image.name):
            self._generate_overlay_image()
        return self.hero_image

    def _generate_overlay_image(self):
        width, height = 1280, 640
        base = self._compose_background(width, height)

        overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        panel_height = int(height * 0.45)
        draw.rectangle(
            [(0, height - panel_height), (width, height)],
            fill=(8, 12, 24, 225),
        )

        headline_font = self._resolve_font(60, bold=True)
        date_font = self._resolve_font(40)
        time_font = self._resolve_font(36)
        note_font = self._resolve_font(28)

        padding_x = 80
        top_text = height - panel_height + 40
        draw.text(
            (padding_x, top_text),
            self.title.upper(),
            font=headline_font,
            fill=(255, 255, 255, 230),
        )
        draw.text(
            (padding_x, top_text + 90),
            self.display_date,
            font=date_font,
            fill=(120, 220, 255, 255),
        )
        draw.text(
            (padding_x, top_text + 150),
            self.time_range,
            font=time_font,
            fill=(255, 255, 255, 230),
        )

        if self.nota:
            draw.text(
                (padding_x, top_text + 205),
                self.nota,
                font=note_font,
                fill=(226, 232, 240, 255),
            )

        composite = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")
        buffer = BytesIO()
        composite.save(buffer, format="JPEG", quality=90)

        file_name = f"citas/generated/cita_{self.pk}.jpg"
        if self.hero_image and self.hero_image.name and self.hero_image.storage.exists(self.hero_image.name):
            self.hero_image.storage.delete(self.hero_image.name)
        self.hero_image.save(file_name, ContentFile(buffer.getvalue()), save=False)
        super().save(update_fields=["hero_image"])

    def _compose_background(self, width, height):
        base = Image.new("RGB", (width, height), "#0f172a")
        if self.background_image and self.background_image.name:
            try:
                with Image.open(self.background_image.path) as bg:
                    bg = bg.convert("RGB").resize((width, height), RESAMPLE_STRATEGY)
                    base.paste(bg)
                    return base
            except (FileNotFoundError, OSError):
                pass

        gradient = Image.new("RGB", (width, height), "#0f172a")
        grad_draw = ImageDraw.Draw(gradient)
        for y in range(height):
            intensity = int(15 + (60 * (y / height)))
            grad_draw.line(
                [(0, y), (width, y)],
                fill=(intensity, int(23 + (40 * (y / height))), 80),
            )
        return gradient

    def _resolve_font(self, size, bold=False):
        preferred = [
            os.path.join(settings.BASE_DIR, "static", "fonts", "Manrope-Bold.ttf") if bold else os.path.join(settings.BASE_DIR, "static", "fonts", "Manrope-Regular.ttf"),
            os.path.join(settings.BASE_DIR, "static", "fonts", "Montserrat-Bold.ttf") if bold else os.path.join(settings.BASE_DIR, "static", "fonts", "Montserrat-Regular.ttf"),
            os.path.join(settings.BASE_DIR, "static", "fonts", "Poppins-SemiBold.ttf") if bold else os.path.join(settings.BASE_DIR, "static", "fonts", "Poppins-Regular.ttf"),
            "arialbd.ttf" if bold else "arial.ttf",
        ]
        for path in preferred:
            try:
                return ImageFont.truetype(path, size)
            except (IOError, OSError):
                continue
        return ImageFont.load_default()
