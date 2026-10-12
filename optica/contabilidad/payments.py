import json
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum
from django.utils.crypto import salted_hmac, constant_time_compare
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from usuarios.models import Clientes
from usuarios.permissions import allowed
from .models import Abonos, Saldos, HistoricoSaldos, Articulos, ItemsVenta


def payment_snapshot(payment):
    values = [payment.pk, payment.venta_id, payment.cliente_id, payment.precio,
              payment.medioDePago_id, payment.descripcion or '',
              str(payment.fecha_abono or ''), payment.abono_masivo_id]
    return salted_hmac('sale-payment-snapshot', json.dumps(values)).hexdigest()


def sale_snapshot(venta):
    fields = ('precio', 'cliente_id', 'empresaCliente', 'empresa_id', 'vendedor_id', 'fecha',
              'condicion_pago', 'fecha_inicio', 'fecha_vencimiento', 'cuotas',
              'detalle', 'observacion', 'foto', 'foto_formula', 'jornada_id', 'bodega_id', 'anulado')
    values = [venta.pk, {key: str(getattr(venta, key)) for key in fields},
              list(ItemsVenta.objects.filter(venta=venta).order_by('pk').values_list(
                  'pk', 'articulo_id', 'cantidad', 'precio_articulo', 'descuento', 'tipo_descuento', 'totalArticulo'))]
    return salted_hmac('sale-edit-snapshot', json.dumps(values)).hexdigest()


def check_sale_snapshot(venta, original):
    if not isinstance(original, str) or not constant_time_compare(original, sale_snapshot(venta)):
        raise ValidationError({'venta': 'La venta cambio o el formulario es antiguo. Recarga la pagina antes de guardar.'})


def check_payment_snapshot(payment, original):
    if not isinstance(original, str) or not constant_time_compare(original, payment_snapshot(payment)):
        raise ValidationError({'detail': 'El abono cambio o el formulario es antiguo. Recarga la pagina antes de guardar o eliminar.'})


def validate_payment_change(venta, instance, attrs=None, *, delete=False):
    if venta.anulado:
        raise ValidationError('No se pueden alterar los abonos de una venta anulada.')
    if (venta.condicion_pago or '').strip().lower() != 'contado':
        return
    attrs = attrs or {}
    financial_change = delete or not instance or any(
        key in attrs and attrs[key] != getattr(instance, key)
        for key in ('precio', 'medioDePago')
    )
    if financial_change and venta.remisiones.exists():
        raise ValidationError('No se pueden alterar los pagos de una venta de contado remisionada.')
    remaining_total = payment_total(venta, instance.pk if instance else None)
    proposed_total = remaining_total + (0 if delete else attrs.get('precio', instance.precio if instance else 0))
    if proposed_total != venta.precio:
        raise ValidationError('Una venta de contado debe permanecer pagada por el total de la compra.')


def validate_sale_items(raw, declared_total, venta=None):
    """Recalculate whole-peso line totals, matching the form's rounding."""
    if not raw:
        if venta is None:
            raise ValidationError({'venta': 'Debe incluir al menos un articulo.'})
        raw = list(ItemsVenta.objects.filter(venta=venta).values(
            'articulo', 'cantidad', 'precio_articulo', 'descuento', 'tipo_descuento', 'totalArticulo'))
    normalized = []
    seen = set()
    for item in raw:
        row = dict(item)
        article_id = serializers.IntegerField(min_value=1).run_validation(row.get('articulo'))
        if article_id in seen or not Articulos.objects.filter(pk=article_id).exists():
            raise ValidationError({'venta': 'El articulo no existe o esta repetido.'})
        seen.add(article_id)
        quantity = serializers.IntegerField(min_value=1).run_validation(row.get('cantidad'))
        price = serializers.IntegerField(min_value=0, max_value=2147483647).run_validation(row.get('precio_articulo'))
        discount = serializers.IntegerField(min_value=0).run_validation(row.get('descuento') or 0)
        kind = row.get('tipo_descuento') or 'precio'
        gross = price * quantity
        if kind not in ('precio', 'porcentaje') or (kind == 'porcentaje' and discount > 100) or (kind == 'precio' and discount > gross):
            raise ValidationError({'venta': 'El descuento del articulo no es valido.'})
        net = Decimal(gross) - (Decimal(gross) * discount / 100 if kind == 'porcentaje' else discount)
        total = int(net.quantize(Decimal('1'), rounding=ROUND_HALF_UP))
        supplied = serializers.IntegerField(min_value=0, max_value=2147483647).run_validation(row.get('totalArticulo', total))
        if supplied != total:
            raise ValidationError({'venta': 'El total del articulo no coincide con su cantidad, precio y descuento.'})
        row.update(articulo=article_id, cantidad=quantity, precio_articulo=price,
                   descuento=discount, tipo_descuento=kind, totalArticulo=total)
        normalized.append(row)
    total = sum(row['totalArticulo'] for row in normalized)
    if serializers.IntegerField(min_value=1, max_value=2147483647).run_validation(declared_total) != total:
        raise ValidationError({'precio': 'El total de la venta no coincide con la suma de sus articulos.'})
    return normalized


def payment_total(venta, exclude=None):
    qs = Abonos.objects.filter(venta=venta)
    if exclude is not None:
        qs = qs.exclude(pk=exclude)
    return qs.aggregate(total=Sum('precio'))['total'] or 0


def sync_payments(venta, *, clear_due=False):
    """Caller must hold the sale row lock inside an atomic transaction."""
    total = payment_total(venta)
    balance = (venta.precio or 0) - total
    cliente = Clientes.objects.filter(pk=venta.cliente_id).first()
    balances = Saldos.objects.filter(venta=venta)
    previous = balances.values_list('saldo', flat=True).first()
    defaults = {'saldo': balance}
    if clear_due or venta.fecha_vencimiento is not None:
        defaults['fecha_Vencimiento'] = venta.fecha_vencimiento
    if cliente:
        defaults['cliente'] = cliente
    if balances.exists():
        balances.update(**defaults)
    elif cliente:
        Saldos.objects.create(venta=venta, **defaults)
    if cliente and previous != balance:
        HistoricoSaldos.objects.create(venta=venta, cliente=cliente, saldo=balance)
    venta.totalAbono = total
    venta.estado_id = 4 if venta.anulado else 3 if balance <= 0 else 2 if total > 0 else 1
    venta.save(update_fields=['totalAbono', 'estado'])
    return total, balance


def prepare_sale_payments(raw, venta, cliente_id, total, usuario, replace=False, removed_ids=None, snapshots=None):
    from .serializers import AbonoSerializer

    if not isinstance(raw, list):
        raise ValidationError({'abonos': 'Debe enviar una lista de abonos.'})
    existing = {row.pk: row for row in Abonos.objects.filter(venta=venta)} if venta else {}
    snapshots = snapshots or {}
    if not isinstance(snapshots, dict):
        raise ValidationError({'abonos': 'Referencia de abonos invalida.'})

    def check_snapshot(payment, required=False):
        original = snapshots.get(str(payment.pk))
        if (required and not original) or (original and (not isinstance(original, str) or not constant_time_compare(original, payment_snapshot(payment)))):
            raise ValidationError({'abonos': 'Los abonos cambiaron desde que abriste la venta. Recarga la pagina antes de guardar.'})
    try:
        if not isinstance(removed_ids or [], list):
            raise ValueError
        deleted = {int(pk) for pk in (removed_ids or [])}
    except (ValueError, TypeError):
        raise ValidationError({'abonos': 'Lista de abonos eliminados invalida.'})
    if not deleted.issubset(existing):
        raise ValidationError({'abonos': 'Un abono eliminado no pertenece a esta venta.'})
    serializers = []
    seen = set()
    amount = 0
    for entry in raw:
        if not isinstance(entry, dict):
            raise ValidationError({'abonos': 'Hay un abono con formato incorrecto.'})
        data = dict(entry)
        # An empty placeholder in the sale form is not a payment.
        if not data.get('id') and data.get('precio') in (None, '', 0, '0'):
            continue
        pk = data.pop('id', None)
        instance = None
        if pk:
            try:
                pk = int(pk)
            except (ValueError, TypeError):
                raise ValidationError({'abonos': 'Identificador de abono invalido.'})
            if pk in seen or pk not in existing or pk in deleted:
                raise ValidationError({'abonos': 'El abono no pertenece a esta venta o esta repetido.'})
            seen.add(pk)
            instance = existing[pk]
        elif existing and not replace:
            raise ValidationError({'abonos': 'Recarga editar venta para conservar los identificadores de los abonos.'})
        data['cliente_id'] = cliente_id
        if venta:
            data['venta'] = venta.pk
        serializer = AbonoSerializer(instance, data=data, context={'sale_batch': True}, partial=bool(instance))
        serializer.is_valid(raise_exception=True)
        if instance:
            changed = any(
                (getattr(instance, key) or '') != (value or '') if key == 'descripcion'
                else getattr(instance, key) != value
                for key, value in serializer.validated_data.items()
            )
            check_snapshot(instance, required=changed)
            if changed and not allowed(usuario, 'change_abonos'):
                raise ValidationError({'abonos': 'No tienes permiso para modificar abonos registrados.'})
        amount += serializer.validated_data.get('precio', instance.precio if instance else 0)
        serializers.append(serializer)
    # Only explicit deletions: a payment added after opening the form must survive.
    removed = [existing[pk] for pk in deleted]
    for payment in removed:
        check_snapshot(payment, required=True)
    if removed and (not allowed(usuario, 'delete_abonos') or any(row.abono_masivo_id for row in removed)):
        raise ValidationError({'abonos': 'No puedes eliminar estos abonos desde editar venta.'})
    amount += sum(row.precio for pk, row in existing.items() if pk not in seen and pk not in deleted)
    if amount > total:
        raise ValidationError({'abonos': 'Los abonos superan el total de la venta.'})
    return serializers, removed, amount
