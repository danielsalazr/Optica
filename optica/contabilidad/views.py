from django.shortcuts import render
import os
from datetime import datetime

from django.shortcuts import render, redirect
from django.http import HttpResponse, response, JsonResponse
from django.views.generic import ListView
from django.shortcuts import get_object_or_404
import django_excel as excel
from django.forms.models import model_to_dict

from django.db.models import Max

#Django Rest Framework 
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
# from .serializers import InventorySerializer

from django.db import connection

from .serializers import VentaSerializer, AbonoSerializer

from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from .models import Ventas, Abonos, MediosDePago, Articulos
from usuarios.models import Clientes


from django.db.models import Q

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
    articulo = dict(articulo.__dict__)
    articulo.pop('_state')
    console.log(articulo)

    
    return Response(articulo, status=status.HTTP_200_OK)


class VentasP(APIView):
    #permission_classes = (IsAuthenticated, )
    def get(self, request):

        limit = 20
        mediosPago = MediosDePago.objects.all().values()
        ventas = Ventas.objects.filter().values().order_by('-factura')[:limit]
        query = f"""
            SELECT factura, CONCAT(T1.nombre, ' ', T1.apellido)e, T0.precio as preciov, sum(T2.precio) as abono, T0.precio - sum(T2.precio) as saldo, T3.nombre, T0.cliente_id FROM contabilidad_ventas T0
            left join usuarios_clientes T1 on T0.cliente_id = T1.id
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

        clientes = Clientes.objects.all()
        articulos = Articulos.objects.all()
        context = {
            'mediosPago': mediosPago,
            'ventas': listVentas,
            'factura': maxFactura,
            'clientes': clientes,
            'articulos': articulos,
        }
        
        return render(request, 'contabilidad/ventas.html', context)


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

        metodoPago = request.data['metodoPago']
        precio = request.data['precio']
        abono = request.data['abono']
        factura = request.data['factura']
        cliente_id = request.data['cliente_id']

        data_copy = request.data.copy()

        verificarCliente = Clientes.objects.filter(id=cliente_id).values()
        metodoPago = MediosDePago.objects.get(id=metodoPago)

        if precio != abono and  int(precio) > 0:
            data_copy['estado'] = 2
        
        if precio == abono:
            data_copy['estado'] = 3  # Pagado

        # console.log(request.data)
        


        serializer = VentaSerializer(data=data_copy)
        #serializer = VentaSerializer(data=listdata, many=True)

        if serializer.is_valid():

            serializer.save()

            if not verificarCliente:
                Clientes.objects.create(
                    id=cliente_id,
                    nombre = request.data['nombreCliente'],
                    # apellido = request.data['apellidoCliente'],
                    )
                
            
            if metodoPago and abono != 0:
                abonar = Abonos.objects.create(
                    factura_id=factura,
                    cliente_id=cliente_id,
                    precio=abono,
                    medioDePago=metodoPago,  
                )


            

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