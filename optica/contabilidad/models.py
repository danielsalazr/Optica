from django.db import models
from django.utils import timezone
from usuarios.models import Clientes
from django.db.models.deletion import DO_NOTHING



class MediosDePago(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default='')
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

class Ventas(models.Model):
    #id es el numero de factura de la venta, hay que asegurarse que empiece a partir de un nuemero de factura
    factura = models.IntegerField(primary_key=True)
    #cliente_id = models.ForeignKey(Clientes, on_delete=DO_NOTHING , verbose_name="Id de cliente", blank=True, null=True)
    cliente_id = models.BigIntegerField(default=0, verbose_name="Id de cliente", blank=True, null=True)
    detalle = models.TextField(max_length=50, default='', blank=True, null=True)
    observacion = models.TextField(max_length=50, default='', blank=True, null=True)
    precio = models.IntegerField(default=0)
    #estado = models.CharField(max_length=50, default='')
    estado = models.ForeignKey(EstadoVenta, default=1,  on_delete=DO_NOTHING , verbose_name="Id de cliente", blank=True, null=True)
    fecha = models.DateField(verbose_name="Fecha de Venta", default=timezone.now)
    fechaCreacion = models.DateTimeField(verbose_name="Fecha de Venta", default=timezone.now)

    class Meta:
        verbose_name = "Ventas"
        verbose_name_plural = "Ventas"
        managed = True

    def resumen(self):
        return self.factura[:50] + '...' 


    def __int__(self):
        return self.factura

    def nombre(self):
        nombre = Clientes.objects.get(id=self.cliente_id)
        nombre = f"{nombre.nombre} {nombre.apellido}"
        return nombre

    @property
    def precio_moneda(self):
        return '${:,.0f}'.format(self.precio)


class Abonos(models.Model):
    id = models.AutoField(primary_key=True)
    factura = models.ForeignKey(Ventas, on_delete=DO_NOTHING , verbose_name="Id de cliente", blank=True, null=True)
    #cliente_id = models.ForeignKey(Clientes, on_delete=DO_NOTHING , verbose_name="Id de cliente", blank=True, null=True)
    cliente_id = models.BigIntegerField(verbose_name="Id de cliente", blank=True, null=True, default=0)
    precio = models.IntegerField(default=0)
    medioDePago = models.ForeignKey(MediosDePago, on_delete=DO_NOTHING, verbose_name="Medio de Pago")
    fecha = models.DateTimeField(verbose_name="Fecha de registro", default=timezone.now)
    # abono debe mostrar el saldo, osea el valor a pagar

    class Meta:
        verbose_name = "Abonos"
        verbose_name_plural = "Abonos"
        managed = True

    def n_Factura(self):
        return self.factura.factura
    
    def nombre(self):
        nombre = Clientes.objects.get(id=self.cliente_id)
        nombre = f"{nombre.nombre} {nombre.apellido}"
        return nombre

    @property
    def precio_moneda(self):
        return '${:,.0f}'.format(self.precio)