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
    # EstadoVenta,
    # MediosDePago,
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
        fields = [ 'factura',
                  'precio',
                  'cliente_id',
                  'empresaCliente',
                  "totalAbono",
                  'fecha',
                  'detalle',
                  'observacion',
                  'estado',
                  'foto']
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
        abono = validated_data['totalAbono']
        total = validated_data["precio"]
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
        
        return super().update(instance, validated_data)

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