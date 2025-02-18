from django.db import models
from django.utils import timezone
from usuarios.models import Clientes
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

class EstadoFactura(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default='')
    pass
    #pagado
    #pendiente


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


class Ventas(models.Model):

    OPCIONES = [
        ('1', 'personal'),
        ('2', 'convenio'),
        # ('opc3', 'Opción 3'),
    ]
    #id es el numero de factura de la venta, hay que asegurarse que empiece a partir de un nuemero de factura
    factura = models.IntegerField(primary_key=True)
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
    tipo_venta = models.CharField(max_length=10, choices=OPCIONES, null=True, blank=True)



    class Meta:
        verbose_name = "Ventas"
        verbose_name_plural = "Ventas"
        managed = True


    def __str__(self):
        return str(self.factura)


    def resumen(self):
        return self.factura[:50] + '...' 

    
    
    def __int__(self):
        return str(self.factura)

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
    factura = models.ForeignKey(Ventas, on_delete=DO_NOTHING , verbose_name="Factura", blank=True, null=True)
    #cliente_id = models.ForeignKey(Clientes, on_delete=DO_NOTHING , verbose_name="Id de cliente", blank=True, null=True)
    cliente_id = models.BigIntegerField(verbose_name="cedula de cliente", blank=True, null=True, default=0)
    precio = models.IntegerField(default=0, verbose_name="valor")
    medioDePago = models.ForeignKey(MediosDePago, on_delete=DO_NOTHING, verbose_name="Medio de Pago")
    fecha = models.DateTimeField(verbose_name="Fecha de registro", default=timezone.now)
    # abono debe mostrar el saldo, osea el valor a pagar

    class Meta:
        verbose_name = "Abono"
        verbose_name_plural = "Abonos"
        managed = True

    def n_Factura(self):
        return self.factura.factura
    
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
    factura = models.ForeignKey(Ventas, on_delete=models.DO_NOTHING, related_name="saldoVenta")
    saldo = models.IntegerField(default=0)
    fecha_Vencimiento = models.DateField(verbose_name="fecha vencimiento", blank=True, null=True,)


    class Meta:
        managed = True
        verbose_name = "Saldo"
        verbose_name_plural = "Saldos"


class HistoricoSaldos(models.Model):
    id = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(Clientes, on_delete=models.DO_NOTHING, related_name="historicoSaldoCliente",)
    factura = models.ForeignKey(Ventas, on_delete=models.DO_NOTHING, related_name="historicoSaldoVenta")
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
    cliente = models.ForeignKey(Clientes, on_delete=DO_NOTHING, related_name='clientePedido')
    nombre = models.CharField(max_length=50, default='')
    # Entregado
    # cancelado
    # en fabricacion
    # en tienda

class PedidoVenta(models.Model):
    id = models.AutoField(primary_key=True)
    estado = models.ForeignKey(EstadoPedidoVenta, on_delete=DO_NOTHING ,related_name='estadosPEdidoVenta')
    fecha = models.DateTimeField(auto_now_add=timezone.now)
    venta = models.ForeignKey(Ventas, on_delete=DO_NOTHING ,related_name='pedidoVenta')
    

class ItemsPEdidoVenta(models.Model):
    pedido = models.ForeignKey(PedidoVenta, on_delete=DO_NOTHING ,related_name='idPEdido')
    itemPedido = models.ForeignKey(Articulos, on_delete=DO_NOTHING ,related_name='articuloPedido')
    cantidad = models.IntegerField(default=0)