from rest_framework import serializers
from .models import Ventas, Abonos

class VentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ventas
        fields = [ 'factura', 'precio', 'cliente_id', 'fecha', 'detalle', 'observacion', 'estado', 'foto']

        extra_kwargs = {
            'detalle': {'required': False},
            'observacion': {'required': False},
            'estado' : {'required': False},
            'foto' : {'required': False},
        }


class AbonoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Abonos
        fields = ['factura','cliente_id','precio','medioDePago',]

        
        # extra_kwargs = {
        #     'detalle': {'required': False},
        #     'observacion': {'required': False},
        #     'estado' : {'required': False},
        # } 
