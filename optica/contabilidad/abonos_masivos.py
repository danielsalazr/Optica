import hashlib
import json

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from usuarios.models import Clientes, Empresa
from .models import AbonoMasivo, Abonos, Jornada, Saldos, Ventas
from .payments import sync_payments
from .serializers import AbonoSerializer
from .utils_estado_pedido import maybe_mark_para_fabricacion


def fecha_pago_actual():
    now = timezone.now()
    return timezone.localtime(now).date() if timezone.is_aware(now) else now.date()


class ObjetivoSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=['empresa', 'jornada', 'cliente'])
    empresa_id = serializers.IntegerField(min_value=1, required=False)
    jornada_id = serializers.IntegerField(min_value=1, required=False)
    cliente_id = serializers.IntegerField(min_value=1, required=False)

    def validate(self, attrs):
        campo = f"{attrs['tipo']}_id"
        if campo not in attrs:
            raise serializers.ValidationError({campo: 'Debe seleccionar un objetivo.'})
        return attrs


class ItemSerializer(serializers.Serializer):
    venta_id = serializers.IntegerField(min_value=1)
    monto = serializers.IntegerField(min_value=1, max_value=2147483647)
    saldo_esperado = serializers.IntegerField(min_value=1)


class AplicarSerializer(ObjetivoSerializer):
    clave_operacion = serializers.UUIDField()
    medioDePago = serializers.IntegerField(min_value=1)
    descripcion = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)
    fecha = serializers.DateField(required=False, allow_null=True)
    monto_total = serializers.IntegerField(min_value=1)
    items = ItemSerializer(many=True, allow_empty=False)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        ids = [item['venta_id'] for item in attrs['items']]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError('Una venta no puede repetirse en el mismo lote.')
        if sum(item['monto'] for item in attrs['items']) != attrs['monto_total']:
            raise serializers.ValidationError('El total distribuido no coincide con el monto del pago.')
        return attrs


def resolver_objetivo(data):
    tipo = data['tipo']
    model = {'empresa': Empresa, 'jornada': Jornada, 'cliente': Clientes}[tipo]
    objetivo = model.objects.filter(pk=data[f'{tipo}_id']).first()
    if objetivo is None:
        raise serializers.ValidationError('El objetivo seleccionado no existe.')
    filtro = {
        'empresa': {'empresa_id': objetivo.pk},
        'jornada': {'jornada_id': objetivo.pk},
        'cliente': {'cliente_id': objetivo.pk},
    }[tipo]
    return objetivo, filtro


def aplicar_abono_masivo(data, usuario):
    # The unique operation key also serializes concurrent retries across workers.
    fingerprint = hashlib.sha256(json.dumps(
        {'usuario': usuario.pk, 'pago': data}, sort_keys=True, default=str,
    ).encode()).hexdigest()
    objetivo, filtro = resolver_objetivo(data)
    with transaction.atomic():
        lote, nuevo = AbonoMasivo.objects.get_or_create(
            clave_operacion=data['clave_operacion'],
            defaults={'tipo': data['tipo'], 'nombre_objetivo': str(objetivo)[:120],
                      data['tipo']: objetivo, 'solicitud_hash': fingerprint},
        )
        if not nuevo:
            if lote.solicitud_hash != fingerprint:
                raise serializers.ValidationError('La operacion ya fue registrada con otros datos. Actualice la previsualizacion.')
            return {'accion': 'ok', 'abono_masivo_id': lote.pk, 'reintento': True,
                    'creados': [item['venta_id'] for item in data['items']], 'total': data['monto_total']}

        ids = [item['venta_id'] for item in data['items']]
        ventas = {v.pk: v for v in Ventas.objects.select_for_update().filter(
            pk__in=ids, anulado=False, **filtro,
        ).order_by('pk')}
        if len(ventas) != len(ids):
            raise serializers.ValidationError('Una venta no existe, esta anulada o no pertenece al objetivo seleccionado.')

        preparados = []
        for item in data['items']:
            venta = ventas[item['venta_id']]
            abonado = Abonos.objects.filter(venta=venta).aggregate(total=Sum('precio'))['total'] or 0
            saldo = (venta.precio or 0) - abonado
            if saldo != item['saldo_esperado']:
                raise serializers.ValidationError(f'El saldo de la venta #{venta.pk} cambio. Actualice la previsualizacion.')
            if item['monto'] > saldo:
                raise serializers.ValidationError(f'El abono supera el saldo de la venta #{venta.pk}.')
            cliente = Clientes.objects.filter(pk=venta.cliente_id).first()
            if cliente is None:
                raise serializers.ValidationError(f'La venta #{venta.pk} no tiene un cliente valido.')
            serializer = AbonoSerializer(context={'mass_payment': True}, data={
                'venta': venta.pk, 'cliente_id': cliente.pk, 'precio': item['monto'],
                'medioDePago': data['medioDePago'], 'descripcion': data.get('descripcion'),
                'abono_masivo': lote.pk, 'fecha_abono': data.get('fecha') or fecha_pago_actual(),
            })
            serializer.is_valid(raise_exception=True)
            preparados.append((serializer, venta, cliente, abonado + item['monto']))

        for serializer, venta, cliente, total in preparados:
            serializer.save()
            saldo = (venta.precio or 0) - total
            sync_payments(venta)
            maybe_mark_para_fabricacion(venta, usuario=usuario, origen='automatico')

        return {'accion': 'ok', 'abono_masivo_id': lote.pk, 'reintento': False,
                'creados': ids, 'total': data['monto_total']}
