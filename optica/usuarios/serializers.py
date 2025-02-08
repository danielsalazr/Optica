from rest_framework import serializers
from .models import Clientes, Empresa


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clientes
        fields = [ 'cedula', 'nombre', 'telefono', 'email', 'fechaRegistro', ]

        extra_kwargs = {
            # 'nombre': {'required': False},
            'telefono': {'required': False},
            'email' : {'required': False},
            'fechaRegistro' : {'required': False},
        }

        


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['nombre','nit','email','personas_contacto',]

    
        
        extra_kwargs = {
            'nit': {'required': False},
            'email': {'required': False},
            'personas_contacto' : {'required': False},
        } 
