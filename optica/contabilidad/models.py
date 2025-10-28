from django.db import models
from django.utils import timezone
from usuarios.models import Clientes, Empresa
from django.conf import settings
from django.db.models.deletion import DO_NOTHING
from PIL import Image

from rich.console import Console
console = Console()

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


class Jornada(models.Model):

    ESTADOS = [
        ('planned', 'Planificada'),
        ('in_progress', 'En progreso'),
        ('closed', 'Cerrada'),
    ]

    empresa = models.ForeignKey(Empresa, on_delete=DO_NOTHING, related_name='jornadas')
    sucursal = models.CharField(
        max_length=120,
        blank=True,
        default='',
        help_text="Sucursal o punto de atención donde se realiza la jornada.",
    )
    fecha = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='planned')
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=DO_NOTHING,
        related_name='jornadas',
        blank=True,
        null=True,
    )
    observaciones = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        verbose_name = "Jornada"
        verbose_name_plural = "Jornadas"
        constraints = [
            models.UniqueConstraint(fields=['empresa', 'fecha', 'sucursal'], name='unique_jornada_empresa_fecha'),
        ]

    def __str__(self):
        etiqueta = f"{self.empresa}"
        if self.sucursal:
            etiqueta = f"{etiqueta} · {self.sucursal}"
        return f"{etiqueta} · {self.fecha}"


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
    estado_pedido = models.ForeignKey(
        'EstadoPedidoVenta',
        on_delete=DO_NOTHING,
        related_name='ventas_estado_pedido',
        verbose_name="Estado pedido",
        blank=True,
        null=True,
    )
    estado_pedido_detalle = models.TextField(max_length=500, blank=True, null=True)
    estado_pedido_actualizado = models.DateTimeField(blank=True, null=True)
    fecha = models.DateField(verbose_name="Fecha de Venta", default=timezone.now)
    fechaCreacion = models.DateTimeField(verbose_name="Fecha de Venta", default=timezone.now)
    foto = models.ImageField(upload_to='fotos_ventas/', blank=True, null=True)
    tipo_venta = models.ForeignKey(TipoVenta, default=1, on_delete=DO_NOTHING, null=True, blank=True)
    anulado = models.BooleanField(default=False, verbose_name="Anulado")
    detalleAnulacion = models.TextField(max_length=500, blank=True, null=True)
    usuarioAnulacion = models.IntegerField(default=None, blank=True, null=True)
    cuotas = models.IntegerField(default=1, verbose_name="Cuotas")
    ordenTrabajoLaboratorio = models.IntegerField(default=0, verbose_name="Orden de trabajo laboratorio", blank=True, null=True)
    jornada = models.ForeignKey(Jornada, on_delete=DO_NOTHING, related_name='ventas', blank=True, null=True)
    

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


class Remision(models.Model):
    id = models.AutoField(primary_key=True)
    venta = models.ForeignKey(Ventas, on_delete=models.CASCADE, related_name="remisiones")
    cliente_id = models.BigIntegerField(verbose_name="cedula de cliente", blank=True, null=True, default=0)
    fecha = models.DateField(verbose_name="Fecha de remision", default=timezone.now)
    observacion = models.TextField(max_length=255, blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        verbose_name = "Remision"
        verbose_name_plural = "Remisiones"

    def __str__(self):
        return f"Remision {self.id} - Venta {self.venta_id}"


class RemisionItem(models.Model):
    remision = models.ForeignKey(Remision, on_delete=models.CASCADE, related_name="items")
    item_venta = models.ForeignKey(ItemsVenta, on_delete=models.PROTECT, related_name="remisiones_items")
    cantidad = models.IntegerField(default=0)

    class Meta:
        managed = True
        verbose_name = "Item remision"
        verbose_name_plural = "Items remision"

    def __str__(self):
        return f"{self.item_venta.articulo} x {self.cantidad}"

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
    

