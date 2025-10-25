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
)
from .utils_estado_pedido import (
    get_estado_pedido_by_slug,
    identify_estado_pedido_slug,
    maybe_mark_para_fabricacion,
)
from usuarios.models import Clientes, Empresa

from rich.console import Console

console = Console()


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
                'foto'
        ]
        # read_only_fields = ('campo1', 'campo2')

        extra_kwargs = {
            'detalle': {'required': False},
            'observacion': {'required': False},
            'estado' : {'required': False},
            'foto' : {'required': False},
        }

        # def to_representation(self, instance):
        #     representation = super().to_representation(instance)
        #     # Obtener el nombre de la empresa relacionada
        #     if instance.empresaCliente:
        #         representation['empresaCliente'] = instance.empresaCliente.nombre
        #     return representation


    def create(self, validated_data):
    # Obtenemos el ID de la empresa enviado en la solicitud
        empresa_id = validated_data.pop('empresaCliente', None)
        abono = int(validated_data.get('totalAbono', 0) or 0)
        total = int(validated_data.get("precio", 0) or 0)
        console.log(f"El empresa ID es {empresa_id}")
        if empresa_id:
            # Buscamos la empresa en la base de datos
            empresa = Empresa.objects.get(id=empresa_id)
            console.log(empresa)
            # Asignamos el nombre de la empresa al campo `empresaCliente`
            validated_data['empresaCliente'] = empresa.nombre
        
        if abono > 0:
            validated_data['estado'] = EstadoVenta.objects.get(id=2)
        if abono == total:
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
        empresa_id = validated_data.pop('empresaCliente', None)
        abono = validated_data['totalAbono']
        total = validated_data["precio"]
        console.log(empresa_id)
        if empresa_id is not None:
            # console.log(empresa_id['nombre'])
            # Buscamos la empresa en la base de datos
            empresa = Empresa.objects.get(id=empresa_id)
            console.log(empresa.nombre)
            # Asignamos el nombre de la empresa al campo `empresaCliente`
            validated_data['empresaCliente'] = empresa.nombre
        console.log(validated_data)
        if abono == 0:
            validated_data['estado'] = EstadoVenta.objects.get(id=1)
        if abono > 0:
            validated_data['estado'] = EstadoVenta.objects.get(id=2)
        if abono == total:
            validated_data['estado'] = EstadoVenta.objects.get(id=3)

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
    
    class Meta:
        model = Abonos
        fields = ['factura','cliente_id','precio','medioDePago', 'descripcion']
    
    extra_kwargs = {
        'descripcion': {'required': False},
    }


class SaldoSerializer(serializers.ModelSerializer):
    factura = serializers.PrimaryKeyRelatedField(queryset=Ventas.objects.all())
    cliente = serializers.PrimaryKeyRelatedField(queryset=Clientes.objects.all())

    class Meta:
        model = Saldos
        fields = [
            'cliente',
            'factura',
            
            'saldo',
        ]


class HistoricoSaldosSerializer(serializers.ModelSerializer):
    factura = serializers.PrimaryKeyRelatedField(queryset=Ventas.objects.all())
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
            'factura',
        ]
        # extra_kwargs = {
        #     'detalle': {'required': False},
        #     'observacion': {'required': False},
        #     'estado' : {'required': False},
        # } 

    def create(self, validated_data):
        # Obtenemos el ID de la empresa enviado en la solicitud
        console.log(validated_data)
        abono = int(self.initial_data.get("totalAbono"))
        total = int(self.initial_data.get("precio"))

        # console.log(self.initial_data)

        console.log(abono)
        console.log(total)

        if abono > total / 2:
            validated_data['estado'] = EstadoPedidoVenta(id=2)
        # empresa_id = validated_data.pop('empresaCliente', None)
        # abono = validated_data['totalAbono']
        # total = validated_data["precio"]
        # console.log(f"El empresa ID es {empresa_id}")
        # if empresa_id:
        #     # Buscamos la empresa en la base de datos
        #     empresa = Empresa.objects.get(id=empresa_id)
        #     console.log(empresa)
        #     # Asignamos el nombre de la empresa al campo `empresaCliente`
        #     validated_data['empresaCliente'] = empresa.nombre
        
        # if abono > 0:
        #     validated_data['estado'] = EstadoVenta.objects.get(id=2)
        # if abono == total:
        #     validated_data['estado'] = EstadoVenta.objects.get(id=3)
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
