import math

from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Ventas,
    Abonos,
    ItemsVenta,
    Articulos,
    Saldos,
    HistoricoSaldos,
    EstadoVenta,
    PedidoVenta,
    ItemsPEdidoVenta,
    EstadoPedidoVenta,
    Remision,
    RemisionItem,
    Jornada,
)
from .utils_estado_pedido import (
    get_estado_pedido_by_slug,
    identify_estado_pedido_slug,
    maybe_mark_para_fabricacion,
)
from usuarios.models import Clientes, Empresa

from rich.console import Console

console = Console()


class JornadaSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    responsable_nombre = serializers.SerializerMethodField(read_only=True)
    ventas_count = serializers.IntegerField(read_only=True)
    total_vendido = serializers.IntegerField(read_only=True)
    total_abonos = serializers.IntegerField(read_only=True)

    class Meta:
        model = Jornada
        fields = [
            'id',
            'empresa',
            'empresa_nombre',
            'sucursal',
            'fecha',
            'estado',
            'responsable',
            'responsable_nombre',
            'observaciones',
            'creado_en',
            'ventas_count',
            'total_vendido',
            'total_abonos',
        ]
        read_only_fields = ('creado_en', 'ventas_count', 'total_vendido', 'total_abonos')

    def get_responsable_nombre(self, obj):
        if obj.responsable:
            full_name = obj.responsable.get_full_name()
            return full_name or obj.responsable.get_username()
        return None


class VentaSerializer(serializers.ModelSerializer):
    # empresaCliente = serializers.CharField(source='empresaCliente.nombre', read_only=True)
    # empresaCliente = serializers.CharField(source='empresaCliente.nombre', )
    # empresa_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Empresa.objects.all(),
    #     source='empresaCliente',  # Esto no se usa directamente, pero es para referencia
    #     write_only=True  # Solo se usa para escritura, no para lectura
    # )

    class Meta:
        model = Ventas
        fields = [ 
                'id',
                'precio',
                'cliente_id',
                'empresaCliente',
                "totalAbono",
                'fecha',
                'detalle',
                'observacion',
                'estado',
                'foto',
                'jornada',
        ]
        # read_only_fields = ('campo1', 'campo2')

        extra_kwargs = {
            'detalle': {'required': False},
            'observacion': {'required': False},
            'estado' : {'required': False},
            'foto' : {'required': False},
            'jornada': {'required': False, 'allow_null': True},
            'empresaCliente': {'required': False, 'allow_blank': True},
        }

        # def to_representation(self, instance):
        #     representation = super().to_representation(instance)
        #     # Obtener el nombre de la empresa relacionada
        #     if instance.empresaCliente:
        #         representation['empresaCliente'] = instance.empresaCliente.nombre
        #     return representation


    def _extract_empresa(self, raw_value):
        if isinstance(raw_value, Empresa):
            return raw_value
        if raw_value in (None, '', 0):
            return None
        try:
            return Empresa.objects.get(id=raw_value)
        except (Empresa.DoesNotExist, ValueError, TypeError):
            nombre = str(raw_value).strip()
            if not nombre:
                return None
            return Empresa.objects.filter(nombre__iexact=nombre).first()

    def _assign_empresa_nombre(self, validated_data):
        empresa = getattr(self, '_empresa_obj', None)
        raw_value = validated_data.get('empresaCliente')
        if raw_value not in (None, ''):
            empresa = self._extract_empresa(raw_value)
        if empresa:
            validated_data['empresaCliente'] = empresa.nombre
            self._empresa_obj = empresa
        return empresa

    def validate(self, attrs):
        attrs = super().validate(attrs)
        empresa = getattr(self, '_empresa_obj', None)
        raw_empresa = attrs.get('empresaCliente')
        if raw_empresa not in (None, ''):
            empresa = self._extract_empresa(raw_empresa)
        elif not empresa and self.instance:
            empresa = self._extract_empresa(self.instance.empresaCliente)

        if empresa:
            self._empresa_obj = empresa

        jornada = attrs.get('jornada')
        if jornada:
            if jornada.estado == 'closed':
                raise serializers.ValidationError({'jornada': 'La jornada seleccionada ya se encuentra cerrada.'})
            if not empresa:
                raise serializers.ValidationError({'empresaCliente': 'Seleccione una empresa válida antes de asociar una jornada.'})
            if jornada.empresa_id != empresa.id:
                raise serializers.ValidationError({'jornada': 'La jornada pertenece a otra empresa.'})

        return attrs

    def create(self, validated_data):
        # Obtenemos el ID de la empresa enviado en la solicitud
        empresa = self._assign_empresa_nombre(validated_data)
        abono = int(validated_data.get('totalAbono', 0) or 0)
        total = int(validated_data.get("precio", 0) or 0)
        console.log(f"El empresa ID es {empresa.id if empresa else None}")
        if not validated_data.get('empresaCliente'):
            validated_data['empresaCliente'] = 'Particular'

        if total > 0:
            if abono <= 0:
                validated_data['estado'] = EstadoVenta.objects.get(id=1)
            elif abono < total:
                validated_data['estado'] = EstadoVenta.objects.get(id=2)
            else:
                validated_data['estado'] = EstadoVenta.objects.get(id=3)

        estado_slug = 'creado'
        if total > 0 and abono >= math.ceil(total / 2):
            estado_slug = 'para_fabricacion'

        validated_data['estado_pedido'] = get_estado_pedido_by_slug(estado_slug)
        validated_data['estado_pedido_actualizado'] = timezone.now()

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Obtenemos el ID de la empresa enviado en la solicitud
        console.log("se ejecuta el update")
        empresa = self._assign_empresa_nombre(validated_data)
        abono = int(validated_data.get('totalAbono', instance.totalAbono or 0) or 0)
        total = int(validated_data.get("precio", instance.precio or 0) or 0)
        console.log(empresa.nombre if empresa else None)
        console.log(validated_data)
        validated_data['totalAbono'] = abono
        if not validated_data.get('empresaCliente'):
            validated_data['empresaCliente'] = instance.empresaCliente or 'Particular'

        nuevo_estado = None
        if total > 0:
            if abono <= 0:
                nuevo_estado = EstadoVenta.objects.get(id=1)
            elif abono < total:
                nuevo_estado = EstadoVenta.objects.get(id=2)
            else:
                nuevo_estado = EstadoVenta.objects.get(id=3)

        if nuevo_estado and nuevo_estado.id != instance.estado_id:
            validated_data['estado'] = nuevo_estado

        instance = super().update(instance, validated_data)
        maybe_mark_para_fabricacion(instance)
        return instance

class ItemsVentaSerializer(serializers.ModelSerializer):
    venta = serializers.PrimaryKeyRelatedField(queryset=Ventas.objects.all())
    articulo = serializers.PrimaryKeyRelatedField(queryset=Articulos.objects.all())
    
    class Meta:
        
        model = ItemsVenta
        fields = [ 
            'venta',
            'articulo',
            'cantidad',
            'precio_articulo',
            'descuento',
            'totalArticulo',
        ]

        # extra_kwargs = {
        #     'detalle': {'required': False},
        #     'observacion': {'required': False},
        #     'estado' : {'required': False},
        #     'foto' : {'required': False},
        # }


class AbonoSerializer(serializers.ModelSerializer):
    factura = serializers.PrimaryKeyRelatedField(source='venta', queryset=Ventas.objects.all())
    
    class Meta:
        model = Abonos
        fields = ['factura','cliente_id','precio','medioDePago', 'descripcion']
    
    extra_kwargs = {
        'descripcion': {'required': False},
    }


class SaldoSerializer(serializers.ModelSerializer):
    factura = serializers.PrimaryKeyRelatedField(source='venta', queryset=Ventas.objects.all())
    cliente = serializers.PrimaryKeyRelatedField(queryset=Clientes.objects.all())

    class Meta:
        model = Saldos
        fields = [
            'cliente',
            'factura',
            
            'saldo',
        ]


class HistoricoSaldosSerializer(serializers.ModelSerializer):
    factura = serializers.PrimaryKeyRelatedField(source='venta', queryset=Ventas.objects.all())
    cliente = serializers.PrimaryKeyRelatedField(queryset=Clientes.objects.all())

    class Meta:
        model = HistoricoSaldos
        fields = [
            'cliente',
            'factura',
            'saldo',
        ]
        
class PedidoVentaSerializer(serializers.ModelSerializer):

    class Meta:
        model = PedidoVenta
        fields = [
            'estado',
            'venta',
        ]
        # extra_kwargs = {
        #     'detalle': {'required': False},
        #     'observacion': {'required': False},
        #     'estado' : {'required': False},
        # } 

    def create(self, validated_data):
        # Obtenemos el ID de la empresa enviado en la solicitud
        console.log(validated_data)
        return super().create(validated_data)



class ItemsPEdidoVentaSerializer(serializers.ModelSerializer):
    pedido = serializers.PrimaryKeyRelatedField(queryset=PedidoVenta.objects.all())
    # itemPedido = serializers.PrimaryKeyRelatedField(queryset=Articulos.objects.all())

    class Meta:
        model = ItemsPEdidoVenta
        fields = [
            'pedido',
            'articulo',
            'cantidad',
        ]


class RemisionItemSerializer(serializers.ModelSerializer):
    itemVenta = serializers.PrimaryKeyRelatedField(source='item_venta', queryset=ItemsVenta.objects.all())
    articulo = serializers.SerializerMethodField(read_only=True)
    cantidadFactura = serializers.SerializerMethodField(read_only=True)
    cantidadDespachada = serializers.SerializerMethodField(read_only=True)
    restante = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RemisionItem
        fields = [
            'id',
            'itemVenta',
            'cantidad',
            'articulo',
            'cantidadFactura',
            'cantidadDespachada',
            'restante',
        ]
        extra_kwargs = {
            'cantidad': {'min_value': 1}
        }

    def get_articulo(self, obj):
        articulo = obj.item_venta.articulo
        return {
            'id': articulo.id,
            'nombre': articulo.nombre,
        }

    def get_cantidadFactura(self, obj):
        return obj.item_venta.cantidad

    def _get_totals_map(self):
        return self.context.get('remision_totals')

    def get_cantidadDespachada(self, obj):
        totals = self._get_totals_map()
        if totals is not None:
            return totals.get(obj.item_venta_id, 0)

        return RemisionItem.objects.filter(
            item_venta=obj.item_venta
        ).aggregate(total=Coalesce(Sum('cantidad'), 0))['total']

    def get_restante(self, obj):
        totals = self._get_totals_map()
        if totals is not None:
            despacho = totals.get(obj.item_venta_id, 0)
        else:
            despacho = self.get_cantidadDespachada(obj)

        return max(obj.item_venta.cantidad - despacho, 0)


class RemisionSerializer(serializers.ModelSerializer):
    items = RemisionItemSerializer(many=True)
    cliente = serializers.SerializerMethodField(read_only=True)
    venta = serializers.PrimaryKeyRelatedField(queryset=Ventas.objects.all())

    class Meta:
        model = Remision
        fields = [
            'id',
            'venta',
            'cliente_id',
            'cliente',
            'fecha',
            'observacion',
            'items',
            'creado_en',
        ]
        read_only_fields = ('cliente_id', 'creado_en')

    def get_cliente(self, obj):
        try:
            cliente = Clientes.objects.get(cedula=obj.cliente_id)
            return {
                'cedula': cliente.cedula,
                'nombre': cliente.nombre,
                'telefono': cliente.telefono,
            }
        except Clientes.DoesNotExist:
            return None

    def validate(self, attrs):
        venta = attrs['venta']
        items = attrs.get('items', [])

        if not items:
            raise serializers.ValidationError({'items': 'Debe incluir al menos un artículo para la remisión.'})

        acumulado_por_item = {}
        errores = {}

        for elemento in items:
            item_venta = elemento['item_venta']
            cantidad = elemento['cantidad']

            if item_venta.venta_id != venta.id:
                errores[item_venta.id] = 'El artículo seleccionado no pertenece a la venta indicada.'
                continue

            if cantidad <= 0:
                errores[item_venta.id] = 'La cantidad debe ser mayor a cero.'
                continue

            acumulado_por_item.setdefault(item_venta.id, {'cantidad': 0, 'obj': item_venta})
            acumulado_por_item[item_venta.id]['cantidad'] += cantidad

        if errores:
            raise serializers.ValidationError({'items': errores})

        for item_id, info in acumulado_por_item.items():
            item_venta = info['obj']
            cantidad_solicitada = info['cantidad']

            remisionado = RemisionItem.objects.filter(item_venta=item_venta).aggregate(
                total=Coalesce(Sum('cantidad'), 0)
            )['total']
            disponible = item_venta.cantidad - remisionado

            if cantidad_solicitada > disponible:
                raise serializers.ValidationError({
                    'items': {
                        item_id: f'Cantidad supera lo disponible para remisionar ({disponible}).'
                    }
                })

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        venta = validated_data['venta']
        validated_data['cliente_id'] = venta.cliente_id

        remision = Remision.objects.create(**validated_data)
        for item in items_data:
            RemisionItem.objects.create(remision=remision, **item)

        return remision
