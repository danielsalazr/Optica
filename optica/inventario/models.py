from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Bodega(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    activa = models.BooleanField(default=True)

    def clean(self):
        super().clean()
        self.nombre = self.nombre.strip()
        if not self.nombre:
            raise ValidationError({'nombre': 'Indica el nombre de la bodega.'})
        if not self.activa and self.pk == 1:
            raise ValidationError({'activa': 'La bodega principal debe permanecer activa para las ventas anteriores.'})
        if not self.activa and self.pk and Existencia.objects.filter(bodega=self, reservado__gt=0).exists():
            raise ValidationError({'activa': 'No se puede desactivar una bodega con unidades reservadas.'})

    def __str__(self):
        return self.nombre


class ConfiguracionArticulo(models.Model):
    articulo = models.OneToOneField('contabilidad.Articulos', on_delete=models.PROTECT, related_name='inventario_config')
    controla = models.BooleanField(default=False)
    codigo = models.CharField(max_length=60, unique=True, blank=True, null=True)
    minimo = models.PositiveIntegerField(default=0)
    activado_en = models.DateTimeField(null=True, blank=True)


class Existencia(models.Model):
    articulo = models.ForeignKey('contabilidad.Articulos', on_delete=models.PROTECT)
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=0)
    reservado = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['articulo', 'bodega'], name='inventario_existencia_unica'),
            models.CheckConstraint(check=models.Q(cantidad__gte=models.F('reservado')), name='inventario_reserva_cubierta'),
        ]


class Reserva(models.Model):
    item = models.OneToOneField('contabilidad.ItemsVenta', on_delete=models.PROTECT, related_name='reserva_inventario')
    existencia = models.ForeignKey(Existencia, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=0)


class Movimiento(models.Model):
    TIPOS = [('entrada', 'Entrada'), ('ajuste', 'Ajuste'), ('salida', 'Salida por remision'),
             ('devolucion', 'Devolucion'), ('reversion', 'Reversion de remision')]
    existencia = models.ForeignKey(Existencia, on_delete=models.PROTECT)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    cantidad = models.IntegerField()
    saldo_resultante = models.PositiveIntegerField()
    motivo = models.CharField(max_length=250)
    fecha = models.DateField(default=timezone.now)
    registrado_en = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    venta = models.ForeignKey('contabilidad.Ventas', on_delete=models.PROTECT, null=True, blank=True)
    remision_item = models.ForeignKey('contabilidad.RemisionItem', on_delete=models.PROTECT, null=True, blank=True)
    origen = models.ForeignKey('self', on_delete=models.PROTECT, null=True, blank=True, related_name='devoluciones')
    clave = models.CharField(max_length=100, unique=True)
    solicitud_hash = models.CharField(max_length=64, blank=True, default='')

    class Meta:
        ordering = ['-id']
