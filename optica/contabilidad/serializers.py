from rest_framework import serializers
from .models import Ventas, Abonos, ItemsVenta, Articulos, Saldos, HistoricoSaldos

from usuarios.models import Clientes, Empresa

from rich.console import Console
console = Console()


class VentaSerializer(serializers.ModelSerializer):
    # empresaCliente = serializers.CharField(source='empresaCliente.nombre', read_only=True)
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
        console.log(f"El empresa ID es {empresa_id}")
        if empresa_id:
            # Buscamos la empresa en la base de datos
            empresa = Empresa.objects.get(id=empresa_id)
            console.log(empresa)
            # Asignamos el nombre de la empresa al campo `empresaCliente`
            validated_data['empresaCliente'] = empresa.nombre
        # Creamos la instancia de Ventas
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Obtenemos el ID de la empresa enviado en la solicitud
        empresa_id = validated_data.pop('empresa_id', None)
        if empresa_id:
            # Buscamos la empresa en la base de datos
            empresa = Empresa.objects.get(id=empresa_id.id)
            # Asignamos el nombre de la empresa al campo `empresaCliente`
            validated_data['empresaCliente'] = empresa.nombre
        # Actualizamos la instancia de Ventas
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
        fields = ['factura','cliente_id','precio','medioDePago',]



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
        model = HistoricoSaldos
        fields = [
            'venta',
            'estado',
            'fecha',
        ]
        # extra_kwargs = {
        #     'detalle': {'required': False},
        #     'observacion': {'required': False},
        #     'estado' : {'required': False},
        # } 


class ItemsPEdidoVentaSerializer(serializers.ModelSerializer):

    class Meta:
        model = HistoricoSaldos
        fields = [
            'pedido',
            'itemPedido',
            'cantidad',
        ]