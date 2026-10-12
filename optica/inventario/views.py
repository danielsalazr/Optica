import hashlib
import json

from django.db import IntegrityError, transaction
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from contabilidad.models import Articulos
from .models import Bodega, ConfiguracionArticulo, Existencia, Movimiento
from .services import InventoryAtomicMixin, principal, registrar, stock_bloqueado, validar_bodega_activa


class ConfigSerializer(serializers.ModelSerializer):
    controla = serializers.BooleanField(required=True)

    class Meta:
        model = ConfiguracionArticulo
        fields = ['controla', 'codigo', 'minimo']


class MovimientoInput(serializers.Serializer):
    articulo_id = serializers.IntegerField(min_value=1)
    bodega_id = serializers.IntegerField(min_value=1, required=False)
    tipo = serializers.ChoiceField(choices=['entrada', 'ajuste', 'devolucion'])
    cantidad = serializers.IntegerField(min_value=0, max_value=2147483647)
    motivo = serializers.CharField(max_length=250)
    fecha = serializers.DateField(required=False, allow_null=True)
    clave = serializers.UUIDField()
    origen_id = serializers.IntegerField(min_value=1, required=False)


class InventarioView(APIView):
    def get(self, request):
        bodega_id = serializers.IntegerField(min_value=1).run_validation(request.query_params.get('bodega_id') or principal().pk)
        bodega = get_object_or_404(Bodega, pk=bodega_id)
        stock = {x.articulo_id: x for x in Existencia.objects.filter(bodega=bodega)}
        configs = {x.articulo_id: x for x in ConfiguracionArticulo.objects.all()}
        result = []
        for articulo in Articulos.objects.order_by('nombre'):
            config, existente = configs.get(articulo.pk), stock.get(articulo.pk)
            fisico = existente.cantidad if existente else 0
            reservado = existente.reservado if existente else 0
            result.append({'id': articulo.pk, 'nombre': articulo.nombre, 'servicio': articulo.tipo_articulo == '2',
                'controla': bool(config and config.controla), 'codigo': config.codigo if config else '',
                'minimo': config.minimo if config else 0, 'existencia': fisico, 'reservado': reservado,
                'disponible': fisico - reservado, 'bajo': bool(config and config.controla and fisico - reservado <= config.minimo)})
        return Response({'bodega': bodega.nombre, 'bodega_id': bodega.pk, 'articulos': result})


class BodegasView(APIView):
    def get(self, request):
        principal()
        return Response(list(Bodega.objects.order_by('nombre').values('id', 'nombre', 'activa')))


def guardar_configuracion(articulo, data):
    config, _ = ConfiguracionArticulo.objects.get_or_create(articulo=articulo)
    config = ConfiguracionArticulo.objects.select_for_update().get(pk=config.pk)
    articulo = Articulos.objects.select_for_update().get(pk=articulo.pk)
    serializer = ConfigSerializer(config, data=data)
    serializer.is_valid(raise_exception=True)
    controla = serializer.validated_data['controla']
    if controla and articulo.tipo_articulo == '2':
        raise serializers.ValidationError('Los servicios no llevan inventario.')
    stock = stock_bloqueado(articulo.pk)
    if not controla and Existencia.objects.filter(articulo=articulo).filter(Q(cantidad__gt=0) | Q(reservado__gt=0)).exists():
        raise serializers.ValidationError('No puede desactivar un articulo con existencias o reservas.')
    activado = timezone.now() if controla and not config.controla else config.activado_en
    try:
        with transaction.atomic():
            serializer.save(activado_en=activado)
    except IntegrityError:
        codigo = serializer.validated_data.get('codigo')
        if codigo and ConfiguracionArticulo.objects.filter(codigo=codigo).exclude(pk=config.pk).exists():
            raise serializers.ValidationError({'codigo': 'El codigo ya pertenece a otro articulo.'})
        raise
    return serializer.data


class ConfiguracionView(InventoryAtomicMixin, APIView):
    def put(self, request, articulo_id):
        articulo = get_object_or_404(Articulos, pk=articulo_id)
        return Response(guardar_configuracion(articulo, request.data))


class MovimientosView(InventoryAtomicMixin, APIView):
    def get(self, request):
        qs = Movimiento.objects.select_related('existencia__articulo', 'existencia__bodega', 'usuario', 'remision_item')
        if request.query_params.get('bodega_id'):
            bodega_id = serializers.IntegerField(min_value=1).run_validation(request.query_params['bodega_id'])
            qs = qs.filter(existencia__bodega_id=bodega_id)
        if request.query_params.get('articulo_id'):
            campo = serializers.IntegerField(min_value=1)
            qs = qs.filter(existencia__articulo_id=campo.run_validation(request.query_params['articulo_id']))
        if request.query_params.get('tipo'):
            tipo = serializers.ChoiceField(choices=Movimiento.TIPOS).run_validation(request.query_params['tipo'])
            qs = qs.filter(tipo=tipo)
        if request.query_params.get('buscar'):
            term = request.query_params['buscar'].strip()
            qs = qs.filter(Q(existencia__articulo__nombre__icontains=term) | Q(motivo__icontains=term))
        pagination = PageNumberPagination()
        pagination.page_size = 20
        pagination.page_size_query_param = 'rows'
        pagination.max_page_size = 100
        page = pagination.paginate_queryset(qs, request)
        return pagination.get_paginated_response([{'id': m.pk, 'articulo_id': m.existencia.articulo_id,
            'articulo': m.existencia.articulo.nombre, 'bodega_id': m.existencia.bodega_id, 'bodega': m.existencia.bodega.nombre, 'tipo': m.tipo, 'cantidad': m.cantidad,
            'saldo_resultante': m.saldo_resultante, 'motivo': m.motivo, 'fecha': m.fecha,
            'registrado_en': m.registrado_en, 'usuario': m.usuario.get_username(), 'venta_id': m.venta_id,
            'remision_id': m.remision_item.remision_id if m.remision_item_id else None} for m in page])

    def post(self, request):
        serializer = MovimientoInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data['tipo'] == 'devolucion':
            origen = get_object_or_404(Movimiento, pk=data.get('origen_id'), tipo='salida', existencia__articulo_id=data['articulo_id'])
            if data.get('bodega_id') and data['bodega_id'] != origen.existencia.bodega_id:
                raise serializers.ValidationError('La devolucion debe ingresar a la bodega de la salida original.')
            data['bodega_id'] = origen.existencia.bodega_id
        else:
            data['bodega_id'] = data.get('bodega_id') or principal().pk
        config = get_object_or_404(ConfiguracionArticulo.objects.select_for_update(), articulo_id=data['articulo_id'], controla=True)
        bodega = get_object_or_404(Bodega, pk=data['bodega_id'])
        if data['tipo'] != 'devolucion':
            validar_bodega_activa(bodega.pk)
        stock = stock_bloqueado(config.articulo_id, bodega.pk)
        key = str(data['clave'])
        fingerprint = hashlib.sha256(json.dumps({'usuario': request.user.pk, 'datos': data}, sort_keys=True, default=str).encode()).hexdigest()
        previo = Movimiento.objects.filter(clave=key).first()
        if previo:
            if previo.solicitud_hash != fingerprint:
                raise serializers.ValidationError('La operacion ya fue registrada con datos distintos.')
            return Response({'id': previo.pk, 'reintento': True})
        cantidad = data['cantidad']
        references = {}
        if data['tipo'] == 'ajuste':
            cantidad -= stock.cantidad
        if cantidad == 0:
            raise serializers.ValidationError('La cantidad no genera un movimiento.')
        if data['tipo'] == 'devolucion':
            origen = get_object_or_404(Movimiento.objects.select_for_update(), pk=data.get('origen_id'), existencia=stock, tipo='salida')
            devuelto = origen.devoluciones.aggregate(total=Sum('cantidad'))['total'] or 0
            if cantidad > -origen.cantidad - devuelto:
                raise serializers.ValidationError('La devolucion supera las unidades pendientes de retornar.')
            references = {'origen': origen, 'venta': origen.venta, 'remision_item': origen.remision_item}
        try:
            with transaction.atomic():
                movimiento = registrar(stock, data['tipo'], cantidad, request.user, data['motivo'], key, data.get('fecha'), **references)
        except IntegrityError:
            if Movimiento.objects.filter(clave=key).exists():
                raise serializers.ValidationError('La clave de operacion ya fue utilizada con datos distintos.')
            raise
        movimiento.solicitud_hash = fingerprint
        movimiento.save(update_fields=['solicitud_hash'])
        return Response({'id': movimiento.pk, 'reintento': False}, status=201)
