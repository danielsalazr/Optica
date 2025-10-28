
import django_excel as excel
from django.shortcuts import render, redirect
from django.http import HttpResponse, response, JsonResponse
from django.views.generic import ListView
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.forms.models import model_to_dict
from django.db import connection, IntegrityError
from django.db.models import Prefetch, Sum, Q, Max, OuterRef, Subquery, Count
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
    RemisionSerializer,
    RemisionItemSerializer,
    JornadaSerializer,
 )

import math

from .models import (
    Ventas,
    ItemsVenta,
    Abonos,
    MediosDePago,
    Articulos,
    FotosArticulos,
    PedidoVenta,
    ItemsPEdidoVenta,
    Saldos,
    Remision,
    RemisionItem,
    EstadoPedidoVenta,
    Jornada,
)
from usuarios.models import Clientes, Empresa

from utils.diccionarios import (
    agrupar_datos,
)

from db.request import (
    getGeneralInfo,
)

from collections import defaultdict
import json
import os
from datetime import datetime
from rich.console import Console

from .utils_estado_pedido import (
    ESTADO_PEDIDO_ORDER,
    identify_estado_pedido_slug,
    mark_entregado_si_corresponde,
    mark_estado_pedido,
    maybe_mark_para_fabricacion,
)

console = Console()

# Create your views here.
class MainP(APIView):
    #permission_classes = (IsAuthenticated, )
    def get(self, request):
        
        return render(request, 'contabilidad/index.html')
    
@api_view(['GET'])
def informacionGeneral(request):

    return Response(getGeneralInfo(), status=status.HTTP_200_OK)

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
        ventas = Ventas.objects.filter().values().order_by('-id')[:limit]


        query = f"""
            SELECT 
                T0.id as pedidoVenta, 
                # CONCAT(T1.nombre, ' ', T1.apellido), 
                T1.nombre, 
                T0.precio as preciov, 
                sum(T2.precio) as abono, 
                T0.precio - sum(T2.precio) as saldo, 
                T3.nombre, 
                T0.cliente_id 
            FROM contabilidad_ventas T0
            left join usuarios_clientes T1 on T0.cliente_id = T1.cedula
            left join contabilidad_abonos T2 on T0.id = T2.venta_id
            inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id
            group by 
                #T0.cliente_id,
                T0.id
            order by T0.id desc;
        """
        with connection.cursor() as cursor:
            cursor.execute(query)
            ventas = cursor.fetchall()
            console.log(ventas)

        maxFactura = (Ventas.objects.aggregate(Max('id'))['id__max']) +1 if (Ventas.objects.aggregate(Max('id'))['id__max']) != None else 1
        console.log(maxFactura)

            
            

        listVentas = []

        for i, venta in enumerate(ventas):
            listVentas.append({
                'numero': i+1,
                'id': venta[0],
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
        estados_pedido = EstadoPedidoVenta.objects.all().order_by('id').values('id', 'nombre')
        jornadas = Jornada.objects.select_related('empresa').filter(
            estado__in=['planned', 'in_progress']
        ).order_by('-fecha', '-id').values(
            'id',
            'fecha',
            'estado',
            'empresa_id',
            'empresa__nombre',
            'sucursal',
        )


        context = {
            'mediosPago': mediosPago,
            'ventas': listVentas,
            'pedido': maxFactura,
            'clientes': clientes,
            'articulos': articulos,
            'empresas': empresa,
            'estadosPedido': list(estados_pedido),
            'jornadas': list(jornadas),
        }

        console.log(context)

        return Response(context, status=status.HTTP_200_OK)
        
        #return render(request, 'contabilidad/ventas.html', context)


# class AbonosP(APIView):
    # #permission_classes = (IsAuthenticated, )
    # def get(self, request, factura=0):


    #     numeroFactura = request.GET.get('factura');
        
    #     if numeroFactura:
    #         return redirect(f"/abonos/{numeroFactura}")

    #     limit = 20
    #     mediosPago = MediosDePago.objects.all().values()
    #     ventas = Ventas.objects.filter().values().order_by('-factura')[:limit]
    #     query = f"""
    #         SELECT 
    #             factura,
    #             #CONCAT(T1.nombre, ' ', T1.apellido),
    #             T1.nombre,
    #             T0.precio as preciov, sum(T2.precio) as abono,
    #             T0.precio - sum(T2.precio) as saldo,
    #             T3.nombre,
    #             T0.cliente_id,
    #             T0.detalle
    #         FROM contabilidad_ventas T0
    #             left join usuarios_clientes T1 on T0.cliente_id = T1.cedula
    #             left join contabilidad_abonos T2 on T0.factura = T2.factura_id
    #             inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id
    #         {('where factura = '+factura) if factura != 0 else ''}
    #         group by 
    #             #T0.cliente_id,
    #             T0.factura
    #         order by factura desc;
    #     """
    #     with connection.cursor() as cursor:
    #         cursor.execute(query)
    #         ventas = cursor.fetchall()
    #         console.log(ventas)

    #     maxFactura = (Ventas.objects.aggregate(Max('factura'))['factura__max']) +1 if (Ventas.objects.aggregate(Max('factura'))['factura__max'])!= None else 1
    #     console.log(maxFactura)

            
            

    #     listVentas = []

    #     for i, venta in enumerate(ventas):
    #         listVentas.append({
    #             'numero': i+1,
    #             'factura': venta[0],
    #             'nombre': venta[1],
    #             'precio': venta[2],
    #             'abono': venta[3],
    #             'saldo': venta[4],
    #             'estado': venta[5],
    #             'detalle': venta[7],
    #         })

    #     console.log(listVentas)

        
    #     context = {
    #         'mediosPago': mediosPago,
    #         'ventas': listVentas,
    #         'factura': maxFactura,
            
    #     }

    #     # return Response(context, status=status.HTTP_200_OK)

    #     # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    #     return render(request, 'contabilidad/abonos.html', context)       

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

        console.log(id)
        if id != 0:

            query = f"""
                select 
                    T0.id as pedido, T0.*, T1.*, T2.id as "empresaId", 
                    #T3.foto
                    MIN(T3.foto) as foto 
                from contabilidad_ventas T0
                inner join contabilidad_itemsventa T1 on T1.venta_id = T0.id 
                inner join usuarios_empresa T2 on T2.nombre = T0.empresaCliente
                inner join contabilidad_fotosarticulos T3 on  T3.articulo_id = T1.articulo_id 
                where T0.id = {id}
                group by T0.id, T1.id 
                ;
            """

            with connection.cursor() as cursor:
                cursor.execute(query)
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                # results = cursor.fetchall()

            console.log(results)
            
            # Datos de venta
            clasificacion = [
                ('ventas', ['id', 'cantidad', 'precio_articulo', 'descuento', 'totalArticulo', 'articulo_id', 'venta_id', 'foto']),
                # ('abonos', ['totalArticulo', 'articulo_id', 'venta_id']),
                # Puedes añadir más clasificaciones según necesites
            ]

            # lista = agrupar_ventas(results, campos_primer_nivel, campos_venta)
            lista = agrupar_datos(results, clasificacion)
            

            query = f"""
                select T0.*, T1.nombre as "medioPago", T1.imagen as "imagenMedioPago" 
                from contabilidad_abonos T0
                inner join contabilidad_mediosdepago T1 on T1.id = T0.medioDePago_id 
                where venta_id = {id};
            """

            with connection.cursor() as cursor:
                cursor.execute(query)
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                # results = cursor.fetchall()

            lista.update({'abonos': results})

            remisiones_qs = Remision.objects.filter(
                venta_id=id
            ).prefetch_related(
                'items__item_venta__articulo'
            ).order_by('fecha', 'id')

            remisiones_totales = RemisionItem.objects.filter(
                item_venta__venta_id=id
            ).values('item_venta_id').annotate(
                total=Coalesce(Sum('cantidad'), 0)
            )

            totales_map = {item['item_venta_id']: item['total'] for item in remisiones_totales}

            remisiones_serializadas = RemisionSerializer(
                remisiones_qs,
                many=True,
                context={'remision_totals': totales_map}
            ).data

            lista.update({'remisiones': remisiones_serializadas})

            for item in lista.get('ventas', []):
                item_id = item.get('id')
                remisionado = totales_map.get(item_id, 0)
                cantidad = item.get('cantidad') or 0
                try:
                    cantidad = int(cantidad)
                except (ValueError, TypeError):
                    cantidad = 0

                item['remisionado'] = remisionado
                item['pendienteRemision'] = max(cantidad - remisionado, 0)

            venta_instance = Ventas.objects.select_related('jornada__empresa').filter(id=id).first()
            if venta_instance:
                lista.update({
                    'jornada': venta_instance.jornada_id,
                    'jornadaNombre': str(venta_instance.jornada) if venta_instance.jornada else None,
                    'jornadaEstado': venta_instance.jornada.estado if venta_instance.jornada else None,
                })

            return Response(lista, status=status.HTTP_200_OK)

        cliente_nombre_subquery = Clientes.objects.filter(
            cedula=OuterRef('cliente_id')
        ).values('nombre')[:1]

        ventas = Ventas.objects.all().annotate(
            cliente=Subquery(cliente_nombre_subquery)
        ).values(
            'id',
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
        ).order_by('id')

        query = """
            SELECT 
                T0.id as id,
                T0.cliente_id as cedula,
                T1.nombre as cliente,
                #CONCAT(T1.nombre, ' ', T1.apellido),
                
                T0.precio,
                T0.totalAbono,
                #sum(T2.precio) as abono,
                T4.saldo,
                #T0.precio - sum(T2.precio) as saldo, 
                T3.nombre as estado,
                T5.id as estado_pedido_id,
                T5.nombre as estado_pedido_nombre,
                T0.estado_pedido_detalle,
                T0.estado_pedido_actualizado,
                T6.id as jornada_id,
                T6.estado as jornada_estado,
                T6.fecha as jornada_fecha,
                T6.sucursal as jornada_sucursal,
                T7.nombre as jornada_empresa,
                
                T0.detalle
            FROM contabilidad_ventas T0
            left join usuarios_clientes T1 on T0.cliente_id = T1.cedula
            #left join contabilidad_abonos T2 on T0.id = T2.venta_id
            inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id
            LEFT join contabilidad_saldos T4 on T4.venta_id  = T0.id
            LEFT join contabilidad_estadopedidoventa T5 on T5.id = T0.estado_pedido_id
            LEFT join contabilidad_jornada T6 on T6.id = T0.jornada_id
            LEFT join usuarios_empresa T7 on T7.id = T6.empresa_id
            #where id = {venta}
            
            #order by T0.id desc;
        """
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        for item in results:
            jornada_empresa = item.get('jornada_empresa')
            jornada_fecha = item.get('jornada_fecha')
            jornada_sucursal = item.get('jornada_sucursal')
            if jornada_empresa and jornada_fecha:
                partes = [jornada_empresa]
                if jornada_sucursal:
                    partes.append(jornada_sucursal)
                partes.append(str(jornada_fecha))
                item['jornada_label'] = " · ".join(partes)
            elif item.get('jornada_id'):
                item['jornada_label'] = f"Jornada #{item['jornada_id']}"
            else:
                item['jornada_label'] = ''
        
        console.log(ventas)
    
        return Response(results, status=status.HTTP_200_OK)
        

        # return render(request, 'contabilidad/ventas.html')

    def post(self, request):
        console.log(request.data)

        venta = json.loads(request.data['venta'])
        abono = json.loads(request.data['abonos'])
        saldo = json.loads(request.data['saldo'])

        medioDePago = json.loads(request.data['abonos'])[0]['medioDePago'] if len(json.loads(request.data['abonos'])) > 0 else ""
        precio = json.loads(request.data['abonos'])[0]['precio'] if len(json.loads(request.data['abonos'])) > 0 else 0

        console.log(json.loads(request.data['venta'])) 
        console.log(json.loads(request.data['abonos']))
        console.log(json.loads(request.data['saldo']))

        data_copy = request.data.copy()

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

            #return JsonResponse({'accion': 'ok'}, status=200)
        return Response({'Venta creada': 'ok'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # return JsonResponse({'accion': 'valid'}, status=200)

    def put(self, request, id=0):
        console.log(request.data)

        factura = request.data['factura']
        # console.log(factura)

        venta_items = json.loads(request.data.get('venta', '[]'))
        abonos = json.loads(request.data.get('abonos', '[]'))
        saldo = json.loads(request.data.get('saldo', '{}'))
        medioDePago = json.loads(request.data['abonos'])[0]['medioDePago']
        precio = json.loads(request.data['abonos'])[0]['precio']

        console.log(json.loads(request.data['venta'])) 
        console.log(json.loads(request.data['abonos']))
        console.log(json.loads(request.data['saldo']))

        data_copy = request.data.copy()

        venta = Ventas.objects.get(id=factura)

        # console.log(venta.__dict__)

        # try:
        #     instancia = MiModelo.objects.get(pk=pk)
        # except MiModelo.DoesNotExist:
        #     return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = VentaSerializer(venta, data=request.data)
        if not serializer.is_valid():
            console.log(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            # console.log(serializer.data)

        venta_actualizada = serializer.save()

        if venta_items:
        # Eliminamos los items antiguos
            ItemsVenta.objects.filter(venta=venta).delete()
            
            # Creamos los nuevos items
            for item in venta_items:
                console.log(item)
                # item['venta'] = venta.id
            items_serializer = ItemsVentaSerializer(data=venta_items, many=True)
            if items_serializer.is_valid():
                items_serializer.save()
            else:
                console.log(items_serializer.errors)
        
        if abonos:
        # Eliminamos abonos antiguos (o actualizamos según tu lógica de negocio)
            Abonos.objects.filter(factura=factura).delete()
            
            abonos_serializer = AbonoSerializer(data=abonos, many=True)
            if abonos_serializer.is_valid():
                abonos_serializer.save()
            else:
                console.log(abonos_serializer.errors)

        if saldo:
            saldo_obj, created = Saldos.objects.update_or_create(
                factura=venta,
                defaults={'saldo': saldo.get('saldo', 0)}
            )
            
            # También actualizamos el histórico
            historico_serializer = HistoricoSaldosSerializer(data=saldo)
            if historico_serializer.is_valid():
                historico_serializer.save()
            else:
                console.log(historico_serializer.errors)

        try:
            pedido = PedidoVenta.objects.get(factura=venta)
            pedido_serializer = PedidoVentaSerializer(pedido, data=data_copy)
            if pedido_serializer.is_valid():
                pedido_serializer.save()
        except PedidoVenta.DoesNotExist:
            pass


        # return Response(serializer.data)
        
        return Response({'accion': 'ok'}, status=status.HTTP_200_OK)

    
    def delete(self, request):
        console.log(request.data)
        # console.log(id)
        id = request.data['id']
        venta = Ventas.objects.get(factura=id)
        # abono = Abonos.objects.filter(factura=venta.factura).first()
        # saldo = Saldos.objects.get(factura=venta)

        venta.estado_id = 4
        venta.detalleAnulacion = request.data['detalleAnulacion']
        venta.usuarioAnulacion = request.user.id
        venta.anulado = 1
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

            if saldo.saldo  != venta.precio and saldo.saldo  != 0:
                venta.estado_id = 2
                
            elif saldo.saldo  == 0:
                # cambiar el estado de la venta a pagada
                venta.estado_id = 3
            venta.save()
            maybe_mark_para_fabricacion(venta)

            # return JsonResponse({'accion': 'ok'}{'accion': 'ok'}, status=201)
            return Response({'accion': 'ok'}, status=status.HTTP_201_CREATED)
        

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # return JsonResponse({'accion': 'valid'}, status=200)


class JornadaView(APIView):
    def get(self, request):
        estado = request.GET.get('estado')
        empresa_id = request.GET.get('empresa')
        jornadas_qs = Jornada.objects.select_related('empresa', 'responsable')

        if estado:
            jornadas_qs = jornadas_qs.filter(estado=estado)
        if empresa_id:
            jornadas_qs = jornadas_qs.filter(empresa_id=empresa_id)

        jornadas_qs = jornadas_qs.annotate(
            ventas_count=Count('ventas', distinct=True),
            total_vendido=Coalesce(Sum('ventas__precio'), 0),
            total_abonos=Coalesce(Sum('ventas__totalAbono'), 0),
        ).order_by('-fecha', '-id')

        serializer = JornadaSerializer(jornadas_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()
        if not data.get('responsable') and request.user.is_authenticated:
            data['responsable'] = request.user.id

        serializer = JornadaSerializer(data=data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response(
                    {'detail': 'Ya existe una jornada abierta para esa empresa, sucursal y fecha.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JornadaDetailView(APIView):
    def patch(self, request, jornada_id):
        jornada = get_object_or_404(Jornada, pk=jornada_id)
        serializer = JornadaSerializer(jornada, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except IntegrityError:
                return Response(
                    {'detail': 'Ya existe una jornada abierta para esa empresa, sucursal y fecha.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VentaEstadoPedidoView(APIView):
    def post(self, request, venta_id):
        venta = get_object_or_404(Ventas, pk=venta_id)
        estado_slug = (request.data.get('estado') or '').strip()
        detalle = (request.data.get('detalle') or '').strip()

        if estado_slug not in ESTADO_PEDIDO_ORDER:
            return Response({'detail': 'Estado solicitado no es valido.'}, status=status.HTTP_400_BAD_REQUEST)

        if estado_slug == 'entregado':
            return Response({'detail': 'El estado Entregado se actualiza automaticamente luego de la remision completa.'}, status=status.HTTP_400_BAD_REQUEST)

        actual_slug = identify_estado_pedido_slug(getattr(venta.estado_pedido, 'nombre', None))
        if ESTADO_PEDIDO_ORDER[estado_slug] < ESTADO_PEDIDO_ORDER.get(actual_slug, 0):
            return Response({'detail': 'No es posible retroceder el estado del pedido.'}, status=status.HTTP_400_BAD_REQUEST)

        if estado_slug == 'para_fabricacion':
            minimo = math.ceil((venta.precio or 0) / 2) if (venta.precio or 0) > 0 else 0
            if minimo > 0 and (venta.totalAbono or 0) < minimo:
                return Response(
                    {'detail': f'Para enviar a fabricacion se requiere un abono minimo de {minimo}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            updated = mark_estado_pedido(venta, estado_slug, clear_detalle=True)
        elif estado_slug == 'en_fabricacion':
            if ESTADO_PEDIDO_ORDER.get(actual_slug, 0) < ESTADO_PEDIDO_ORDER['para_fabricacion']:
                return Response({'detail': 'Debe marcar el pedido Para enviar a fabricacion antes de continuar.'}, status=status.HTTP_400_BAD_REQUEST)
            if not detalle:
                return Response({'detail': 'Indique el motivo del envio a fabricacion.'}, status=status.HTTP_400_BAD_REQUEST)
            updated = mark_estado_pedido(venta, estado_slug, detalle=detalle)
        elif estado_slug == 'listo_entrega':
            if ESTADO_PEDIDO_ORDER.get(actual_slug, 0) < ESTADO_PEDIDO_ORDER['en_fabricacion']:
                return Response({'detail': 'Debe marcar el pedido En fabricacion antes de continuar.'}, status=status.HTTP_400_BAD_REQUEST)
            updated = mark_estado_pedido(venta, estado_slug, clear_detalle=True)
        else:
            updated = mark_estado_pedido(venta, estado_slug, clear_detalle=True)

        data = {
            'estado': venta.estado_pedido.nombre if venta.estado_pedido else None,
            'estado_slug': identify_estado_pedido_slug(getattr(venta.estado_pedido, 'nombre', None)),
            'detalle': venta.estado_pedido_detalle,
            'actualizado': venta.estado_pedido_actualizado,
            'updated': updated,
        }

        return Response(data, status=status.HTTP_200_OK)

class RemisionView(APIView):
    def _build_totals_map(self, venta_id=None):
        filtros = {}
        if venta_id is not None:
            filtros['item_venta__venta_id'] = venta_id

        remisiones_totales = RemisionItem.objects.filter(**filtros).values('item_venta_id').annotate(
            total=Coalesce(Sum('cantidad'), 0)
        )

        return {item['item_venta_id']: item['total'] for item in remisiones_totales}

    def get(self, request, venta_id=None):
        if venta_id is not None:
            remisiones_qs = Remision.objects.filter(
                venta_id=venta_id
            ).prefetch_related(
                'items__item_venta__articulo'
            ).order_by('fecha', 'id')
        else:
            remisiones_qs = Remision.objects.all().prefetch_related(
                'items__item_venta__articulo'
            ).order_by('fecha', 'id')

        totales_map = self._build_totals_map(venta_id)
        serializer = RemisionSerializer(
            remisiones_qs,
            many=True,
            context={'remision_totals': totales_map}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = RemisionSerializer(data=request.data)

        if serializer.is_valid():
            remision = serializer.save()
            totales_map = self._build_totals_map(remision.venta_id)
            mark_entregado_si_corresponde(remision.venta)
            remision_data = RemisionSerializer(
                remision,
                context={'remision_totals': totales_map}
            ).data

            return Response(remision_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class Pedidos(APIView):
    def get(self, request):
        pass

        # query = 
        # Se debe hacer que al hacer la mitad del pago se ponga la fecha de inicio de fabricacion y la fecha de entrega
