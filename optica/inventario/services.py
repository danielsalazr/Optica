from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from contabilidad.models import ItemsVenta, Remision, RemisionItem, Ventas
from .models import Bodega, ConfiguracionArticulo, Existencia, Movimiento, Reserva


class InventoryAtomicMixin:
    def dispatch(self, request, *args, **kwargs):
        if request.method not in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return super().dispatch(request, *args, **kwargs)
        with transaction.atomic():
            response = super().dispatch(request, *args, **kwargs)
            if response.status_code >= 400:
                transaction.set_rollback(True)
            return response


def fecha_actual():
    now = timezone.now()
    return timezone.localtime(now).date() if timezone.is_aware(now) else now.date()


def principal():
    return Bodega.objects.get_or_create(pk=1, defaults={'nombre': 'Bodega principal'})[0]


def stock_bloqueado(articulo_id, bodega_id=None):
    stock, _ = Existencia.objects.get_or_create(articulo_id=articulo_id, bodega_id=bodega_id or principal().pk)
    return Existencia.objects.select_for_update().get(pk=stock.pk)


def bodega_venta(venta):
    return venta.bodega_id or principal().pk


def validar_bodega_activa(bodega_id):
    # Lock after article configurations, before stock, matching every inventory writer.
    bodega = Bodega.objects.select_for_update().get(pk=bodega_id)
    if not bodega.activa:
        raise ValidationError('La bodega seleccionada esta inactiva.')
    return bodega


def bloquear_bodegas(bodega_ids):
    list(Bodega.objects.select_for_update().filter(pk__in=bodega_ids).order_by('pk'))


def controlado(item):
    config = ConfiguracionArticulo.objects.select_for_update().filter(articulo_id=item.articulo_id, controla=True).first()
    # Only sales registered after activation participate; historical deliveries are never replayed.
    return bool(config and config.activado_en and item.venta.fechaCreacion >= config.activado_en)


def bloquear_articulos(articulo_ids):
    # Acquire every configuration lock before touching stock, in a consistent order.
    list(ConfiguracionArticulo.objects.select_for_update().filter(
        articulo_id__in=list(articulo_ids)).order_by('articulo_id'))


@transaction.atomic
def liberar_venta(venta):
    venta = Ventas.objects.select_for_update().get(pk=venta.pk)
    reservas = list(Reserva.objects.filter(item__venta=venta).select_related('existencia').order_by('existencia__articulo_id', 'id'))
    bloquear_articulos([reserva.existencia.articulo_id for reserva in reservas])
    for reserva in reservas:
        ConfiguracionArticulo.objects.select_for_update().get(articulo_id=reserva.existencia.articulo_id)
        stock = stock_bloqueado(reserva.existencia.articulo_id, reserva.existencia.bodega_id)
        stock.reservado -= reserva.cantidad
        stock.save(update_fields=['reservado'])
        reserva.delete()


@transaction.atomic
def reservar_venta(venta):
    venta = Ventas.objects.select_for_update().get(pk=venta.pk)
    if venta.anulado:
        liberar_venta(venta)
        return
    items = list(ItemsVenta.objects.filter(venta=venta).select_related('venta', 'articulo').order_by('articulo_id', 'pk'))
    bloquear_articulos([item.articulo_id for item in items])
    bodega_id = bodega_venta(venta)
    validar_bodega_activa(bodega_id)
    for item in items:
        if not controlado(item):
            continue
        entregado = RemisionItem.objects.filter(item_venta=item, remision__anulado=False).aggregate(total=Sum('cantidad'))['total'] or 0
        pendiente = item.cantidad - entregado
        if pendiente < 0:
            raise ValidationError(f'No puede reducir {item.articulo.nombre} por debajo de las unidades entregadas.')
        stock = stock_bloqueado(item.articulo_id, bodega_id)
        reserva, _ = Reserva.objects.get_or_create(item=item, defaults={'existencia': stock})
        if reserva.existencia_id != stock.pk:
            raise ValidationError('Libera las reservas anteriores antes de cambiar la bodega de la venta.')
        delta = pendiente - reserva.cantidad
        if delta > stock.cantidad - stock.reservado:
            raise ValidationError(f'Stock insuficiente de {item.articulo.nombre}: disponibles {stock.cantidad - stock.reservado}.')
        stock.reservado += delta
        stock.save(update_fields=['reservado'])
        reserva.cantidad = pendiente
        reserva.save(update_fields=['cantidad'])


def registrar(stock, tipo, cantidad, usuario, motivo, clave, fecha=None, **references):
    stock.cantidad += cantidad
    if stock.cantidad > 2147483647:
        raise ValidationError('La existencia excede el limite permitido de unidades.')
    if stock.cantidad < stock.reservado:
        raise ValidationError('El movimiento deja existencias por debajo de las unidades reservadas.')
    stock.save(update_fields=['cantidad', 'reservado'])
    return Movimiento.objects.create(existencia=stock, tipo=tipo, cantidad=cantidad,
        saldo_resultante=stock.cantidad, usuario=usuario, motivo=motivo, clave=clave,
        fecha=fecha or fecha_actual(), **references)


@transaction.atomic
def despachar(remision, usuario):
    venta = Ventas.objects.select_for_update().get(pk=remision.venta_id)
    remision = Remision.objects.select_for_update().get(pk=remision.pk)
    remision.venta = venta
    if remision.anulado:
        raise ValidationError('No puede despachar una remision anulada.')
    if remision.venta.anulado:
        raise ValidationError('No puede remisionar una venta anulada.')
    detalles = list(remision.items.select_related('item_venta__venta', 'item_venta__articulo').order_by('item_venta__articulo_id', 'pk'))
    bloquear_articulos([detalle.item_venta.articulo_id for detalle in detalles])
    validar_bodega_activa(bodega_venta(venta))
    for detalle in detalles:
        key = f'remision:{detalle.pk}'
        if Movimiento.objects.filter(clave=key).exists() or not controlado(detalle.item_venta):
            continue
        stock = stock_bloqueado(detalle.item_venta.articulo_id, bodega_venta(venta))
        if Movimiento.objects.filter(clave=key).exists():
            continue
        reserva = Reserva.objects.select_for_update().filter(item=detalle.item_venta).first()
        if not reserva or reserva.existencia_id != stock.pk or reserva.cantidad < detalle.cantidad:
            raise ValidationError('La remision requiere una reserva de inventario vigente. Revise la venta.')
        reserva.cantidad -= detalle.cantidad
        stock.reservado -= detalle.cantidad
        reserva.save(update_fields=['cantidad'])
        registrar(stock, 'salida', -detalle.cantidad, usuario, f'Remision #{remision.pk}', key,
                  fecha=remision.fecha, venta=remision.venta, remision_item=detalle)


@transaction.atomic
def revertir_remision(remision, usuario):
    venta = Ventas.objects.select_for_update().get(pk=remision.venta_id)
    remision = Remision.objects.select_for_update().get(pk=remision.pk)
    remision.venta = venta
    if not remision.anulado:
        raise ValidationError('Anule la remision antes de revertir su inventario.')
    bloquear_articulos(ItemsVenta.objects.filter(venta=venta).values_list('articulo_id', flat=True))
    for salida in Movimiento.objects.filter(remision_item__remision=remision, tipo='salida').order_by('existencia__articulo_id'):
        key = f'reversion:{salida.pk}'
        ConfiguracionArticulo.objects.select_for_update().get(articulo_id=salida.existencia.articulo_id)
        stock = stock_bloqueado(salida.existencia.articulo_id, salida.existencia.bodega_id)
        if Movimiento.objects.filter(clave=key).exists():
            continue
        devuelto = salida.devoluciones.aggregate(total=Sum('cantidad'))['total'] or 0
        cantidad = -salida.cantidad - devuelto
        if cantidad > 0:
            registrar(stock, 'reversion', cantidad, usuario, f'Anulacion administrativa de remision #{remision.pk}', key,
                      venta=remision.venta, remision_item=salida.remision_item, origen=salida)
    if not remision.venta.anulado:
        reservar_venta(remision.venta)
