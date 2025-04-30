
import django_excel as excel
from django.shortcuts import render, redirect
from django.http import HttpResponse, response, JsonResponse
from django.views.generic import ListView
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.forms.models import model_to_dict
from django.db import connection
from django.db.models import Prefetch, Sum, Q, Max, OuterRef, Subquery
from django.db.models.functions import Coalesce

from django.contrib.auth.decorators import login_required


#Django Rest Framework 
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

# from .serializers import InventorySerializer



from .serializers import (
    VentaSerializer,
    AbonoSerializer,
    ItemsVentaSerializer,
    SaldoSerializer,
    HistoricoSaldosSerializer,
    PedidoVentaSerializer,
    ItemsPEdidoVentaSerializer,
 )

from .models import (
    Ventas,
    Abonos,
    MediosDePago,
    Articulos,
    FotosArticulos,
    PedidoVenta,
    ItemsPEdidoVenta,
    Saldos,
    )
from usuarios.models import Clientes, Empresa

from utils.diccionarios import (
    agrupar_datos,
)

from collections import defaultdict
import json
import os
from datetime import datetime
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
                #CONCAT(T1.nombre, ' ', T1.apellido),
                T1.nombre,
                T0.precio as preciov, sum(T2.precio) as abono,
                T0.precio - sum(T2.precio) as saldo,
                T3.nombre,
                T0.cliente_id,
                T0.detalle
            FROM contabilidad_ventas T0
                left join usuarios_clientes T1 on T0.cliente_id = T1.cedula
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

        # return Response(context, status=status.HTTP_200_OK)

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
            #CONCAT(T1.nombre, ' ', T1.apellido),
            T1.nombre,
            T0.precio as preciov, sum(T2.precio) as abono,
            T0.precio - sum(T2.precio) as saldo, 
            T3.nombre,
            T0.cliente_id,
            T0.detalle
        FROM contabilidad_ventas T0
        left join usuarios_clientes T1 on T0.cliente_id = T1.cedula
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
    def get(self, request, id=0,):
        if id != 0:

            query = f"""
                select T0.*, T1.*, T2.id as "empresaId" from contabilidad_ventas T0
                inner join contabilidad_itemsventa T1 on T1.venta_id = T0.factura 
                inner join usuarios_empresa T2 on T2.nombre = T0.empresaCliente 
                where factura = {id}
            """

            with connection.cursor() as cursor:
                cursor.execute(query)
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                # results = cursor.fetchall()

            console.log(results)
            
            # Datos de venta
            clasificacion = [
                ('ventas', ['id', 'cantidad', 'precio_articulo', 'descuento', 'totalArticulo', 'articulo_id', 'venta_id']),
                # ('abonos', ['totalArticulo', 'articulo_id', 'venta_id']),
                # Puedes añadir más clasificaciones según necesites
            ]

            # lista = agrupar_ventas(results, campos_primer_nivel, campos_venta)
            lista = agrupar_datos(results, clasificacion)
            

            query = f"""
                select * from contabilidad_abonos 
                where factura_id = {id};
            """

            with connection.cursor() as cursor:
                cursor.execute(query)
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                # results = cursor.fetchall()

            lista.update({'abonos': results})
            

            return Response(lista, status=status.HTTP_200_OK)

        cliente_nombre_subquery = Clientes.objects.filter(
            cedula=OuterRef('cliente_id')
        ).values('nombre')[:1]

        ventas = Ventas.objects.all().annotate(
            cliente=Subquery(cliente_nombre_subquery)
        ).values(
            'factura',
            'cliente_id',
            'cliente',
            'empresaCliente',
            'detalle',
            'observacion',
            'precio',
            'totalAbono',
            'estado_id',
            'fecha',
            # 'cliente_nombre',  # Incluir el nombre del cliente
        ).order_by('factura')

        query = """
            SELECT 
                T0.factura,
                T0.cliente_id as cedula,
                T1.nombre as cliente,
                #CONCAT(T1.nombre, ' ', T1.apellido),
                
                T0.precio,
                T0.totalAbono,
                #sum(T2.precio) as abono,
                T4.saldo,
                #T0.precio - sum(T2.precio) as saldo, 
                T3.nombre as estado,
                
                T0.detalle
            FROM contabilidad_ventas T0
            left join usuarios_clientes T1 on T0.cliente_id = T1.cedula
            #left join contabilidad_abonos T2 on T0.factura = T2.factura_id
            inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id
            LEFT join contabilidad_saldos T4 on T4.factura_id  = T0.factura
            #where factura = {factura}
            
            #order by factura desc;
        """
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        
        console.log(ventas)
    
        return Response(results, status=status.HTTP_200_OK)
        

        # return render(request, 'contabilidad/ventas.html')

    def post(self, request):
        console.log(request.data)

        venta = json.loads(request.data['venta'])
        abono = json.loads(request.data['abonos'])
        saldo = json.loads(request.data['saldo'])
        medioDePago = json.loads(request.data['abonos'])[0]['medioDePago']
        precio = json.loads(request.data['abonos'])[0]['precio']

        console.log(json.loads(request.data['venta'])) 
        console.log(json.loads(request.data['abonos']))
        console.log(json.loads(request.data['saldo']))

        # factura = request.data['factura']
        cliente_id = request.data['cliente_id']

        data_copy = request.data.copy()

        # verificarCliente = Clientes.objects.filter(cedula=cliente_id).values()
        

        serializer = VentaSerializer(data=data_copy)
        #serializer = VentaSerializer(data=listdata, many=True)

        if not serializer.is_valid():
            console.log(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        console.log(request.data)
        # data_copy['saldo'] = saldo['saldo']
        serializerVenta = ItemsVentaSerializer(data=venta, many=True)
        if medioDePago != "":
            serializerAbono = AbonoSerializer(data=abono, many=True)
        serializerPedido = PedidoVentaSerializer(data=data_copy, many=False)

        if not serializerPedido.is_valid():
            console.log(serializerPedido.errors)
            return Response(serializerPedido.errors, status=status.HTTP_400_BAD_REQUEST)
        
        pedido = serializerPedido.save()

        for item in venta:
            item['pedido'] = pedido.id
        

        serializerItemsPedidoVenta = ItemsPEdidoVentaSerializer(data=venta, many=True)
        
        serializerSaldo = SaldoSerializer(data=saldo, many=False)
        serializerHistoricoSaldo = HistoricoSaldosSerializer(data=saldo, many=False)

        if not serializerVenta.is_valid():
            console.log(serializerVenta.errors)
            return Response(serializerVenta.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if medioDePago != "" and precio > 0:
            if not serializerAbono.is_valid():
                console.log(serializerAbono.errors)
                return Response(serializerAbono.errors, status=status.HTTP_400_BAD_REQUEST)
            
        
        if not serializerItemsPedidoVenta.is_valid():
            console.log(serializerItemsPedidoVenta.errors)
            return Response(serializerItemsPedidoVenta.errors, status=status.HTTP_400_BAD_REQUEST)

        if not serializerSaldo.is_valid():
            console.log(serializerSaldo.errors)
            return Response(serializerSaldo.errors, status=status.HTTP_400_BAD_REQUEST)
        # if medioDePago != "":
        if not serializerHistoricoSaldo.is_valid():
            console.log(serializerHistoricoSaldo.errors)
            return Response(serializerHistoricoSaldo.errors, status=status.HTTP_400_BAD_REQUEST)
        
        
        
        console.log("Venta valida")
        # console.log(serializerPedido.data)
        

        serializerVenta.save()
        if medioDePago != "":
            serializerAbono.save()
        
        serializerItemsPedidoVenta.save()
        
        # if medioDePago != "":
        serializerSaldo.save()
        serializerHistoricoSaldo.save()
        

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

    
    def delete(self, request):
        console.log(request.data)
        # console.log(id)
        id = request.data['id']
        venta = Ventas.objects.get(factura=id)
        # abono = Abonos.objects.filter(factura=venta.factura).first()
        # saldo = Saldos.objects.get(factura=venta)

        venta.estado_id = 4
        venta.detalleAnulacion = request.data['detalleAnulacion']
        venta.save()
        # abono.delete()
        # venta.delete()
        # saldo.delete()

        return Response({'accion': 'ok'}, status=status.HTTP_200_OK)



class Abono(APIView):
    def get(self, request, factura=None):

        mediosPago = MediosDePago.objects.all().values()
            
            # facturaSearched = Ventas.objects.get(factura=factura)
        if factura:
            console.log(factura)
            # facturaSearched = Ventas.objects.filter(factura=factura)

            query = f"""
                SELECT                                                                                                                                    
                    T0.cliente_id as cedula,                                                                                                              
                    T1.nombre as cliente,                                                                                                                 
                    T0.factura_id as factura,                                                                                                             
                    DATE_FORMAT(T0.fecha, '%d/%m/%Y') as fecha,                                                                                                                                
                    T0.id,                                                                                                                                   
                    T0.medioDePago_id,   
                    T2.nombre as "medioDePago",
                    T2.imagen as "imagenMedioPago",
                    T0.precio                                                                                                                                                                                                                                                                
                FROM contabilidad_abonos T0                                                                                                               
                    left join usuarios_clientes T1 on T0.cliente_id = T1.cedula                                                                               
                    left join contabilidad_mediosdepago T2 on T2.id  =  T0.medioDePago_id                                                                       
                #inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id  
                where factura_id = {factura}
                /*group by 
                    #T0.cliente_id,
                    T0.factura_id
                */
                order by factura_id desc;
            """

            console.log(query)
            with connection.cursor() as cursor:
                cursor.execute(query)
                # facturaSearched = cursor.fetchall()
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                # console.log(facturaSearched)

            return Response(results, status=status.HTTP_200_OK)
        
        abonos = Abonos.objects.all().values()

        query = f"""
            SELECT 
                T0.cliente_id as cedula,
                T1.nombre as cliente,
                T0.factura_id,
                T0.fecha,
                T0.id,
                # T0.medioDePago_id,
                T2.nombre,
                T0.precio
            FROM contabilidad_abonos T0
                left join usuarios_clientes T1 on T0.cliente_id = T1.cedula
                left join contabilidad_mediosdepago T2 on T0.medioDePago_id = T2.id
                #inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id
            ;
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            

        return Response(results, status=status.HTTP_200_OK)
        # return JsonResponse({'accion': 'valid'}, status=200)

    def post(self, request):
        console.log(request.data)
        metodoPago = request.data.get('medioDePago')
        factura =  request.data.get('factura')
        
        venta = Ventas.objects.get(factura=factura)
        saldo = Saldos.objects.get(factura=venta)
        console.log(venta)
        # metodoPago = MediosDePago.objects.get(id=metodoPago)
    

        serializer = AbonoSerializer(data=request.data)
        #serializer = VentaSerializer(data=listdata, many=True)

        if serializer.is_valid():
            console.log("vamos bien")
            # console.log(serializer.data)
            #console.log(serializer.data)
            serializer.save()

            total_Abono = Abonos.objects.filter(
                factura=venta
            ).aggregate(total=Sum('precio'))#['total']
            
            venta.totalAbono = total_Abono.get('total')
            saldo.saldo = venta.precio - total_Abono.get('total')
            # venta.save()
            saldo.save()

            if saldo.saldo  == 0:
                # cambiar el estado de la venta a pagada
                venta.estado_id = 3
            venta.save()

            # return JsonResponse({'accion': 'ok'}{'accion': 'ok'}, status=201)
            return Response({'accion': 'ok'}, status=status.HTTP_201_CREATED)
        

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # return JsonResponse({'accion': 'valid'}, status=200)

    # def delete(self, request, id=0):
    #     # console.log(request.data)
    #     # console.log(id)
    #     abono = Abonos.objects.get(id=id)
    #     factura = Ventas.objects.get(factura=abono.factura_id)
    #     saldo = Saldos.objects.get(factura=factura)

    #     abono.delete()

    #     total_Abono = Abonos.objects.filter(
    #         factura=factura
    #     ).aggregate(total=Sum('precio'))

class Pedidos(APIView):
    def get(self, request):
        pass

        # query = 
        # Se debe hacer que al hacer la mitad del pago se ponga la fecha de inicio de fabricacion y la fecha de entrega