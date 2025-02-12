from django.shortcuts import render
import os
from datetime import datetime

from django.shortcuts import render, redirect
from django.http import HttpResponse, response, JsonResponse
from django.views.generic import ListView
from django.shortcuts import get_object_or_404
import django_excel as excel
from django.forms.models import model_to_dict
from django.db.models import Prefetch

from django.db.models import Max

#Django Rest Framework 
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
# from .serializers import InventorySerializer

from django.db import connection

from .serializers import (
    VentaSerializer,
    AbonoSerializer,
    ItemsVentaSerializer,
    SaldoSerializer,
 )

from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from .models import Ventas, Abonos, MediosDePago, Articulos, FotosArticulos
from usuarios.models import Clientes, Empresa


from django.db.models import Q

import json
from rich.console import Console
console = Console()

# Create your views here.
class MainP(APIView):
    #permission_classes = (IsAuthenticated, )
    def get(self, request):
        
        return render(request, 'contabilidad/index.html')

@api_view(['GET'])
def articulos(request,):
    articulos = Articulos.objects.all().values()
    context = {
        'articulos': articulos,
    }
    
    return Response(context, status=status.HTTP_200_OK)


@api_view(['GET'])
def articuloInfo(request, id=0):
    articulo = Articulos.objects.get(id=id) #.values()
    # articulos =articulo.articuloFoto.all().first()
    # articuloss = articulo.articuloFoto.filter(articulo=articulo).first()
    # articulosss = Articulos.objects.prefetch_related('articuloFoto')
    # articulosyfoto = Articulos.objects.prefetch_related(
    #     Prefetch('articuloFoto', queryset=FotosArticulos.objects.all())
    # ).first()
    # resultado = [model_to_dict(i) for i in articulosss]

    fotosTodas = FotosArticulos.objects.filter(articulo=articulo).select_related('articulo')
    # resultados = [model_to_dict(i) for i in fotosTodas]



    # console.log(articulos.__dict__)
    # console.log(articuloss.__dict__)
    # console.log(articulosss)
    # console.log(articulosyfoto)
    # console.log(articulosyfoto.__dict__)
    # console.log(resultado)
    # console.log(resultados)
    # console.log(fotosTodas.values().first())
    # # console.log(resultados)


    articulo = dict(articulo.__dict__)
    #articulo = dict(articulo.__dict__)
    articulo.pop('_state')
    articulo["fotos"]= fotosTodas.values()
    console.log(articulo)

    
    return Response(articulo, status=status.HTTP_200_OK)


class VentasP(APIView):
    #permission_classes = (IsAuthenticated, )
    def get(self, request):

        limit = 20
        mediosPago = MediosDePago.objects.all().values()
        ventas = Ventas.objects.filter().values().order_by('-factura')[:limit]
        query = f"""
            SELECT 
                factura, 
                # CONCAT(T1.nombre, ' ', T1.apellido), 
                T1.nombre, 
                T0.precio as preciov, 
                sum(T2.precio) as abono, 
                T0.precio - sum(T2.precio) as saldo, 
                T3.nombre, 
                T0.cliente_id 
            FROM contabilidad_ventas T0
            left join usuarios_clientes T1 on T0.cliente_id = T1.cedula
            left join contabilidad_abonos T2 on T0.factura = T2.factura_id
            inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id
            group by 
                #T0.cliente_id,
                T0.factura
            order by factura desc;
        """
        with connection.cursor() as cursor:
            cursor.execute(query)
            ventas = cursor.fetchall()
            console.log(ventas)

        maxFactura = (Ventas.objects.aggregate(Max('factura'))['factura__max']) +1 if (Ventas.objects.aggregate(Max('factura'))['factura__max']) != None else 1
        console.log(maxFactura)

            
            

        listVentas = []

        for i, venta in enumerate(ventas):
            listVentas.append({
                'numero': i+1,
                'factura': venta[0],
                'nombre': venta[1],
                'precio': venta[2],
                'abono': venta[3],
                'saldo': venta[4],
                'estado': venta[5],
            })

        console.log(listVentas)

        clientes = Clientes.objects.all().values()
        articulos = Articulos.objects.all().values()
        empresa = Empresa.objects.all().values()
        context = {
            'mediosPago': mediosPago,
            'ventas': listVentas,
            'factura': maxFactura,
            'clientes': clientes,
            'articulos': articulos,
            'empresas': empresa,
        }

        console.log(context)

        return Response(context, status=status.HTTP_200_OK)
        
        #return render(request, 'contabilidad/ventas.html', context)


class AbonosP(APIView):
    #permission_classes = (IsAuthenticated, )
    def get(self, request, factura=0):


        numeroFactura = request.GET.get('factura');
        
        if numeroFactura:
            return redirect(f"/abonos/{numeroFactura}")

        limit = 20
        mediosPago = MediosDePago.objects.all().values()
        ventas = Ventas.objects.filter().values().order_by('-factura')[:limit]
        query = f"""
            SELECT 
                factura,
                CONCAT(T1.nombre, ' ', T1.apellido)e,
                T0.precio as preciov, sum(T2.precio) as abono,
                T0.precio - sum(T2.precio) as saldo,
                T3.nombre,
                T0.cliente_id,
                T0.detalle
            FROM contabilidad_ventas T0
                left join usuarios_clientes T1 on T0.cliente_id = T1.id
                left join contabilidad_abonos T2 on T0.factura = T2.factura_id
                inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id
            {('where factura = '+factura) if factura != 0 else ''}
            group by 
                #T0.cliente_id,
                T0.factura
            order by factura desc;
        """
        with connection.cursor() as cursor:
            cursor.execute(query)
            ventas = cursor.fetchall()
            console.log(ventas)

        maxFactura = (Ventas.objects.aggregate(Max('factura'))['factura__max']) +1 if (Ventas.objects.aggregate(Max('factura'))['factura__max'])!= None else 1
        console.log(maxFactura)

            
            

        listVentas = []

        for i, venta in enumerate(ventas):
            listVentas.append({
                'numero': i+1,
                'factura': venta[0],
                'nombre': venta[1],
                'precio': venta[2],
                'abono': venta[3],
                'saldo': venta[4],
                'estado': venta[5],
                'detalle': venta[7],
            })

        console.log(listVentas)

        
        context = {
            'mediosPago': mediosPago,
            'ventas': listVentas,
            'factura': maxFactura,
            
        }

        return Response(context, status=status.HTTP_200_OK)

        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return render(request, 'contabilidad/abonos.html', context)       

# Create your views here.

class ReportesP(APIView):
    #permission_classes = (IsAuthenticated, )
    def get(self, request):
        
        return render(request, 'contabilidad/reportes.html')   


@api_view(['GET'])
def abonar(request, factura = 0):

    numeroFactura = request.GET.get('factura');
    mediosPago = MediosDePago.objects.all().values()

    query = f"""
        SELECT 
            factura,
            CONCAT(T1.nombre, ' ', T1.apellido),
            T0.precio as preciov, sum(T2.precio) as abono,
            T0.precio - sum(T2.precio) as saldo, 
            T3.nombre,
            T0.cliente_id,
            T0.detalle
        FROM contabilidad_ventas T0
        left join usuarios_clientes T1 on T0.cliente_id = T1.id
        left join contabilidad_abonos T2 on T0.factura = T2.factura_id
        inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id
        where factura = {factura}
        
        order by factura desc;
    """
    with connection.cursor() as cursor:
        cursor.execute(query)
        facturaSearched = cursor.fetchall()
        console.log(facturaSearched)

    listVentas = []

    for i, venta in enumerate(facturaSearched):
        listVentas.append({
            'numero': i+1,
            'factura': venta[0],
            'nombre': venta[1],
            'precio': venta[2],
            'abono': venta[3],
            'saldo': venta[4],
            'estado': venta[5],
            'cliente_id': venta[6],
            'detalle': venta[7],
        })

    context = {
        'mediosPago': mediosPago,
        'ventas': listVentas,
    }

    console.log(context)
    
    # código para el método GET
    return render(request, 'contabilidad/abonar.html', context) 


class Venta(APIView):
    #permission_classes = (IsAuthenticated, )
    def get(self, request):
        
        return render(request, 'contabilidad/ventas.html')

    def post(self, request):

        console.log(request.data)

        venta = json.loads(request.data['venta'])
        console.log(json.loads(request.data['venta']))

        abono = json.loads(request.data['abonos'])

        console.log(json.loads(request.data['abonos']))

        saldo = json.loads(request.data['saldo'])

        console.log(json.loads(request.data['saldo']))

        # metodoPago = request.data['metodoPago']
        # precio = request.data['precio']
        # abono = request.data['abono']
        factura = request.data['factura']
        cliente_id = request.data['cliente_id']

        data_copy = request.data.copy()

        verificarCliente = Clientes.objects.filter(cedula=cliente_id).values()
        # metodoPago = MediosDePago.objects.get(id=metodoPago)

        # if precio != abono and  int(precio) > 0:
        #     data_copy['estado'] = 2
        
        # if precio == abono:
        #     data_copy['estado'] = 3  # Pagado

        # console.log(request.data)
        


        serializer = VentaSerializer(data=data_copy)
        #serializer = VentaSerializer(data=listdata, many=True)

        if not serializer.is_valid():
            console.log(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        serializerVenta = ItemsVentaSerializer(data=venta, many=True)
        serializerAbono = AbonoSerializer(data=abono, many=True)
        serializerSaldo = SaldoSerializer(data=saldo, many=False)

        if not serializerVenta.is_valid():
            console.log(serializerVenta.errors)
            return Response(serializerVenta.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if not serializerAbono.is_valid():
            console.log(serializerAbono.errors)
            return Response(serializerAbono.errors, status=status.HTTP_400_BAD_REQUEST)
        

        if not serializerSaldo.is_valid():
            console.log(serializerSaldo.errors)
            return Response(serializerSaldo.errors, status=status.HTTP_400_BAD_REQUEST)
        
        console.log("Venta valida")
        

        serializerVenta.save()
        serializerAbono.save()
        serializerSaldo.save()

        return Response({'Venta creada': 'ok'}, status=status.HTTP_200_OK)
            

            

            # if not verificarCliente:
            #     Clientes.objects.create(
            #         id=cliente_id,
            #         nombre = request.data['nombreCliente'],
            #         # apellido = request.data['apellidoCliente'],
            #         )
                
            
            # if metodoPago and abono != 0:
            #     abonar = Abonos.objects.create(
            #         factura_id=factura,
            #         cliente_id=cliente_id,
            #         precio=abono,
            #         medioDePago=metodoPago,  
            #     )


            

            #return JsonResponse({'accion': 'ok'}, status=200)
        return Response({'Venta creada': 'ok'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # return JsonResponse({'accion': 'valid'}, status=200)



class Abono(APIView):
    def get(self, request):

        mediosPago = MediosDePago.objects.all().values()
            
            # facturaSearched = Ventas.objects.get(factura=factura)
        if factura:
            console.log(factura)
            # facturaSearched = Ventas.objects.filter(factura=factura)

            query = f"""
                SELECT 
                    factura,
                    CONCAT(T1.nombre, ' ', T1.apellido),
                    T0.precio as preciov, sum(T2.precio) as abono,
                    T0.precio - sum(T2.precio) as saldo,
                    T3.nombre,
                    T0.detalle 
                FROM contabilidad_ventas T0
                    left join usuarios_clientes T1 on T0.cliente_id = T1.id
                    left join contabilidad_abonos T2 on T0.factura = T2.factura_id
                    inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id
                where factura = {factura}
                group by 
                    #T0.cliente_id,
                    T0.factura
                order by factura desc;
            """
            with connection.cursor() as cursor:
                cursor.execute(query)
                facturaSearched = cursor.fetchall()
                console.log(facturaSearched)

            listVentas = []

            for i, venta in enumerate(facturaSearched):
                listVentas.append({
                    'numero': i+1,
                    'factura': venta[0],
                    'nombre': venta[1],
                    'precio': venta[2],
                    'abono': venta[3],
                    'saldo': venta[4],
                    'estado': venta[5],
                    'detalle': venta[6],
                })

            context = {
                'mediosPago': mediosPago,
                'ventas': listVentas,
            }

            console.log(facturaSearched)
            
            return render(request, 'contabilidad/abonos.html', context)
        
        return JsonResponse({'accion': 'valid'}, status=200)

    def post(self, request):

        metodoPago = request.data['medioDePago']
        metodoPago = MediosDePago.objects.get(id=metodoPago)
        
        console.log(request.data)

        serializer = AbonoSerializer(data=request.data)
        #serializer = VentaSerializer(data=listdata, many=True)

        if serializer.is_valid():
            console.log("vamos bien")
            #console.log(serializer.data)
            serializer.save()

            return JsonResponse({'accion': 'ok'}, status=200)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # return JsonResponse({'accion': 'valid'}, status=200)