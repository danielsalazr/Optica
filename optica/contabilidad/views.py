
import django_excel as excel
from django.shortcuts import render, redirect
from django.http import HttpResponse, response, JsonResponse
from django.views.generic import ListView
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.forms.models import model_to_dict
from django.db import connection, IntegrityError, transaction
from django.db.models import Prefetch, Sum, Q, Max, OuterRef, Subquery, Count, F
from django.db.models.functions import Coalesce
from django.utils.dateparse import parse_datetime

from django.contrib.auth.decorators import login_required


#Django Rest Framework 
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

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
    CitaAgendaSerializer,
    CitaAgendaRegistroSerializer,
)

import math

from .models import (
    Ventas,
    ItemsVenta,
    Abonos,
    AbonoMasivo,
    MediosDePago,
    Articulos,
    FotosArticulos,
    FotosVentas,
    PedidoVenta,
    ItemsPEdidoVenta,
    Saldos,
    Remision,
    RemisionItem,
    EstadoPedidoVenta,
    HistoricoEstadoPedidoVenta,
    Jornada,
    Vendedor,
    CitaAgenda,
    CitaAgendaRegistro,
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
from datetime import datetime, date
from django.utils import timezone
from django.conf import settings
from rich.console import Console

from .utils_estado_pedido import (
    ESTADOS_PEDIDO_DEFINICIONES,
    ESTADO_PEDIDO_ORDER,
    identify_estado_pedido_slug,
    mark_entregado_si_corresponde,
    mark_estado_pedido,
    maybe_mark_para_fabricacion,
    get_estado_pedido_by_slug,
    sync_estado_entrega_por_remision,
)

console = Console()

# Create your views here.
class MainP(APIView):
    #permission_classes = (IsAuthenticated, )
    def get(self, request):
        
        return render(request, 'contabilidad/index.html')


class PublicVentaTrackingView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    ESTADO_COLORS = {
        'creado': '#6c757d',
        'para_fabricacion': '#0dcaf0',
        'en_fabricacion': '#ffca00',
        'listo_entrega': '#4e25ff',
        'entregado': '#198754',
    }

    def get(self, request):
        cedula = (request.query_params.get('cedula') or '').strip()
        venta_id = (request.query_params.get('venta') or '').strip()

        if not cedula or not venta_id:
            return Response(
                {'detail': 'Debes indicar cedula y numero de venta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            venta_id_int = int(venta_id)
            cedula_int = int(cedula)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Cedula o numero de venta no tienen un formato valido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        venta = (
            Ventas.objects.select_related('estado', 'estado_pedido')
            .prefetch_related('historicoEstadosPedido__estado_nuevo')
            .filter(id=venta_id_int, cliente_id=cedula_int, anulado=False)
            .first()
        )

        if not venta:
            return Response(
                {'detail': 'No encontramos una venta activa con esos datos.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        cliente = Clientes.objects.filter(cedula=venta.cliente_id).values('nombre').first()
        total_abonos = (
            Abonos.objects.filter(venta_id=venta.id)
            .aggregate(total=Coalesce(Sum('precio'), 0))
            .get('total')
            or venta.totalAbono
            or 0
        )
        saldo_registrado = (
            Saldos.objects.filter(venta_id=venta.id)
            .order_by('-id')
            .values_list('saldo', flat=True)
            .first()
        )
        saldo = saldo_registrado if saldo_registrado is not None else max((venta.precio or 0) - total_abonos, 0)

        estado_slug = identify_estado_pedido_slug(getattr(venta.estado_pedido, 'nombre', None))
        actual_index = ESTADO_PEDIDO_ORDER.get(estado_slug, 0)

        historico_fechas = {'creado': venta.fecha or venta.fechaCreacion}
        historicos = sorted(
            venta.historicoEstadosPedido.all(),
            key=lambda item: (item.fecha or timezone.make_aware(datetime.min), item.id or 0),
        )
        for item in historicos:
            slug_historico = identify_estado_pedido_slug(getattr(item.estado_nuevo, 'nombre', None))
            if slug_historico and item.fecha:
                historico_fechas[slug_historico] = item.fecha

        if estado_slug and estado_slug not in historico_fechas:
            historico_fechas[estado_slug] = venta.estado_pedido_actualizado or venta.fecha

        timeline = []
        for index, (_, slug, nombre) in enumerate(ESTADOS_PEDIDO_DEFINICIONES):
            fecha_hito = historico_fechas.get(slug)

            if slug == estado_slug:
                stage = 'current'
            elif index < actual_index and fecha_hito:
                stage = 'completed'
            else:
                stage = 'pending'

            timeline.append({
                'id': index + 1,
                'slug': slug,
                'label': nombre,
                'stage': stage,
                'color': self.ESTADO_COLORS.get(slug, '#6c757d'),
                'date': fecha_hito.isoformat() if fecha_hito else None,
            })

        articulos = list(
            ItemsVenta.objects.filter(venta_id=venta.id)
            .select_related('articulo')
            .values(
                'id',
                'cantidad',
                'precio_articulo',
                'articulo_id',
                'articulo__nombre',
            )
        )

        return Response({
            'venta_id': venta.id,
            'cedula': str(venta.cliente_id),
            'cliente': cliente.get('nombre') if cliente else '',
            'empresa': venta.empresaCliente or '',
            'fecha': venta.fecha.isoformat() if venta.fecha else None,
            'precio': venta.precio or 0,
            'total_abonos': total_abonos,
            'saldo': saldo,
            'cuotas': venta.cuotas or 0,
            'estado_pago': venta.estado.nombre if venta.estado else '',
            'estado_pedido': venta.estado_pedido.nombre if venta.estado_pedido else 'Pedido tomado',
            'estado_pedido_slug': estado_slug,
            'motivo_sin_anticipo': venta.motivo_sin_anticipo or '',
            'observacion': venta.observacion or '',
            'articulos': [
                {
                    'id': item['id'],
                    'articulo_id': item['articulo_id'],
                    'nombre': item['articulo__nombre'] or f"Articulo #{item['articulo_id']}",
                    'cantidad': item['cantidad'] or 0,
                    'precio_unitario': item['precio_articulo'] or 0,
                }
                for item in articulos
            ],
            'timeline': timeline,
        }, status=status.HTTP_200_OK)
    
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
                T0.cliente_id,
                T0.empresaCliente
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
                'empresaCliente': venta[7],
            })

        console.log(listVentas)

        clientes = Clientes.objects.all().values()
        articulos = Articulos.objects.all().values()
        empresa = Empresa.objects.all().values()
        vendedores = Vendedor.objects.all().values()
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
            'vendedores': vendedores,
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


class ReportesDataView(APIView):
    def get(self, request):
        movimientos_ingresos = list(
            Abonos.objects.select_related('venta', 'medioDePago')
            .order_by('-fecha', '-id')
            .values(
                'id',
                'fecha',
                'venta_id',
                'cliente_id',
                'precio',
                'descripcion',
                'abono_masivo_id',
                medio_pago=F('medioDePago__nombre'),
            )
        )

        clientes_map = {
            cliente['cedula']: (cliente.get('nombre') or '').strip()
            for cliente in Clientes.objects.values('cedula', 'nombre')
        }

        for item in movimientos_ingresos:
            item['cliente'] = clientes_map.get(item.get('cliente_id'), '')
            item['tipo_abono'] = 'Masivo' if item.get('abono_masivo_id') else 'Individual'

        informe_ventas_qs = (
            Ventas.objects.select_related('estado', 'estado_pedido', 'vendedor')
            .all()
            .order_by('-fecha', '-id')
        )

        informe_ventas = []
        for venta in informe_ventas_qs:
            informe_ventas.append(
                {
                    'id': venta.id,
                    'fecha': venta.fecha,
                    'cliente_id': venta.cliente_id,
                    'cliente': clientes_map.get(venta.cliente_id, ''),
                    'empresa': venta.empresaCliente,
                    'precio': venta.precio,
                    'totalAbono': venta.totalAbono,
                    'saldo': max((venta.precio or 0) - (venta.totalAbono or 0), 0),
                    'estado_pago': venta.estado.nombre if venta.estado else None,
                    'estado_pedido': venta.estado_pedido.nombre if venta.estado_pedido else None,
                    'vendedor': venta.vendedor.nombre if getattr(venta, 'vendedor', None) else None,
                    'anulado': venta.anulado,
                }
            )

        cartera_qs = (
            Saldos.objects.select_related('venta')
            .filter(saldo__gt=0, venta__anulado=False)
            .order_by('-venta__fecha', '-venta__id')
        )

        informe_cartera = []
        for saldo in cartera_qs:
            venta = saldo.venta
            informe_cartera.append(
                {
                    'venta_id': venta.id,
                    'fecha': venta.fecha,
                    'cliente_id': venta.cliente_id,
                    'cliente': clientes_map.get(venta.cliente_id, ''),
                    'empresa': venta.empresaCliente,
                    'precio': venta.precio,
                    'totalAbono': venta.totalAbono,
                    'saldo': saldo.saldo,
                    'fecha_vencimiento': venta.fecha_vencimiento or saldo.fecha_Vencimiento,
                    'condicion_pago': venta.condicion_pago,
                    'cuotas': venta.cuotas,
                    'estado_pago': venta.estado.nombre if venta.estado else None,
                }
            )

        return Response(
            {
                'movimientos_ingresos': movimientos_ingresos,
                'informe_ventas': informe_ventas,
                'informe_cartera': informe_cartera,
            },
            status=status.HTTP_200_OK,
        )


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
            'venta': venta[0],
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



def _build_venta_payload(request):
    payload = {}
    for key in request.data.keys():
        if key in ('foto', 'foto_formula'):
            continue
        value = request.data.get(key)
        if value is not None:
            payload[key] = value

    foto_formula = request.FILES.get('foto_formula')
    if foto_formula is not None:
        payload['foto_formula'] = foto_formula

    fotos_venta = request.FILES.getlist('foto')
    if fotos_venta:
        payload['foto'] = fotos_venta[0]

    return payload


def _sync_fotos_venta(venta, fotos_venta):
    if fotos_venta is None:
        return

    if fotos_venta:
        venta.fotosVenta.all().delete()
        for foto in fotos_venta:
            FotosVentas.objects.create(venta=venta, foto=foto)
        venta.foto = fotos_venta[0]
        venta.save(update_fields=['foto'])


class Venta(APIView):
    #permission_classes = (IsAuthenticated, )
    def get(self, request, id=0,):

        console.log(id)
        if id != 0:
  
            query = f"""
                  select 
                      T0.id as pedido, T0.*, T1.*, T2.id as "empresaId", 
                      T4.nombre as articulo_nombre,
                      #T3.foto
                      MIN(T3.foto) as foto 
                  from contabilidad_ventas T0
                  inner join contabilidad_itemsventa T1 on T1.venta_id = T0.id 
                  left join usuarios_empresa T2 on T2.nombre = T0.empresaCliente
                  left join contabilidad_fotosarticulos T3 on  T3.articulo_id = T1.articulo_id 
                  left join contabilidad_articulos T4 on T4.id = T1.articulo_id
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
                  ('ventas', ['id', 'cantidad', 'precio_articulo', 'descuento', 'tipo_descuento', 'totalArticulo', 'articulo_id', 'articulo_nombre', 'venta_id', 'foto']),
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
                historico_estado = list(
                    HistoricoEstadoPedidoVenta.objects.select_related('estado_anterior', 'estado_nuevo', 'usuario')
                    .filter(venta_id=id)
                    .order_by('-fecha', '-id')
                    .values(
                        'id',
                        'fecha',
                        'motivo',
                        'origen',
                        'estado_anterior__nombre',
                        'estado_nuevo__nombre',
                        'usuario__username',
                        'usuario__first_name',
                        'usuario__last_name',
                    )
                )

                if not any((item.get('estado_nuevo__nombre') or '').strip().lower() == 'pedido tomado' for item in historico_estado):
                    historico_estado.append({
                        'id': f'created-{id}',
                        'fecha': venta_instance.fechaCreacion or venta_instance.fecha,
                        'motivo': '',
                        'origen': 'automatico',
                        'estado_anterior__nombre': '',
                        'estado_nuevo__nombre': 'Pedido tomado',
                        'usuario__username': '',
                        'usuario__first_name': '',
                        'usuario__last_name': '',
                    })

                historico_estado.sort(
                    key=lambda item: (item.get('fecha') or timezone.make_aware(datetime.min), str(item.get('id') or '')),
                    reverse=True,
                )

                lista.update({
                    'jornada': venta_instance.jornada_id,
                    'jornadaNombre': str(venta_instance.jornada) if venta_instance.jornada else None,
                    'jornadaEstado': venta_instance.jornada.estado if venta_instance.jornada else None,
                    'fotosVenta': [foto.foto.url for foto in venta_instance.fotosVenta.all()],
                    'historicoEstadoPedido': [
                        {
                            'id': item['id'],
                            'fecha': item['fecha'].isoformat() if item.get('fecha') else None,
                            'motivo': item.get('motivo') or '',
                            'origen': item.get('origen') or 'manual',
                            'estadoAnterior': item.get('estado_anterior__nombre') or '',
                            'estadoNuevo': item.get('estado_nuevo__nombre') or '',
                            'usuario': (
                                f"{(item.get('usuario__first_name') or '').strip()} {(item.get('usuario__last_name') or '').strip()}".strip()
                                or item.get('usuario__username')
                                or ''
                            ),
                        }
                        for item in historico_estado
                    ],
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
                T0.empresaCliente,
                T0.totalAbono,
                T0.cuotas,
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

        primer_abono = abono[0] if isinstance(abono, list) and abono else {}
        medioDePago = primer_abono.get('medioDePago', '')
        precio = primer_abono.get('precio', 0)

        console.log(venta) 
        console.log(abono)
        console.log(saldo)

        fotos_venta = request.FILES.getlist('foto')

        serializer = VentaSerializer(data=_build_venta_payload(request))
        #serializer = VentaSerializer(data=listdata, many=True)

        if not serializer.is_valid():
            console.log(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        venta_obj = serializer.save()
        _sync_fotos_venta(venta_obj, fotos_venta)

        console.log(request.data)
        # data_copy['saldo'] = saldo['saldo']
        serializerVenta = ItemsVentaSerializer(data=venta, many=True)
        if medioDePago != "":
            serializerAbono = AbonoSerializer(data=abono, many=True)
        estado_creado_obj = get_estado_pedido_by_slug('creado')
        pedido_payload = {
            'estado': estado_creado_obj.id,
            'venta': venta_obj.id,
        }

        serializerPedido = PedidoVentaSerializer(data=pedido_payload, many=False)

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

        factura = request.data.get('factura') or request.data.get('id') or id
        if not factura:
            return Response({'detail': 'Debe indicar la venta que desea actualizar.'}, status=status.HTTP_400_BAD_REQUEST)

        venta_items = json.loads(request.data.get('venta', '[]'))
        abonos = json.loads(request.data.get('abonos', '[]'))
        saldo = json.loads(request.data.get('saldo', '{}'))
        console.log(venta_items)
        console.log(abonos)
        console.log(saldo)

        fotos_venta = request.FILES.getlist('foto')

        venta = Ventas.objects.get(id=factura)

        condicion_pago_objetivo = (request.data.get('condicion_pago') or venta.condicion_pago or '').strip().lower()
        if condicion_pago_objetivo == 'contado' and venta.remisiones.exists():
            return Response(
                {'detail': 'No es posible editar una venta de contado despues de haber sido remisionada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # console.log(venta.__dict__)

        # try:
        #     instancia = MiModelo.objects.get(pk=pk)
        # except MiModelo.DoesNotExist:
        #     return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = VentaSerializer(venta, data=_build_venta_payload(request))
        if not serializer.is_valid():
            console.log(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            # console.log(serializer.data)

        venta_actualizada = serializer.save()
        if fotos_venta:
            _sync_fotos_venta(venta_actualizada, fotos_venta)

        if venta_items:
            # Validar que no se eliminen items ya remisionados
            existing_items = ItemsVenta.objects.filter(venta=venta).prefetch_related("remisiones_items")
            existing_by_articulo = {item.articulo_id: item for item in existing_items}
            requested_articulos = {int(item.get("articulo")) for item in venta_items if item.get("articulo")}

            bloqueados = [
                item for item in existing_items
                if item.remisiones_items.exists() and item.articulo_id not in requested_articulos
            ]
            if bloqueados:
                return Response(
                    {"detail": "No puede eliminar items que ya tienen remisiones asociadas."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear o actualizar items solicitados
            for item_data in venta_items:
                articulo_id = int(item_data.get("articulo"))
                item_existente = existing_by_articulo.get(articulo_id)
                if item_existente:
                    item_existente.cantidad = int(item_data.get("cantidad") or 0)
                    item_existente.precio_articulo = int(item_data.get("precio_articulo") or 0)
                    item_existente.descuento = int(item_data.get("descuento") or 0)
                    item_existente.tipo_descuento = item_data.get("tipo_descuento") or 'precio'
                    item_existente.totalArticulo = int(item_data.get("totalArticulo") or 0)
                    item_existente.save()
                else:
                    item_data["venta"] = venta.id
                    items_serializer = ItemsVentaSerializer(data=item_data)
                    if items_serializer.is_valid():
                        items_serializer.save()
                    else:
                        console.log(items_serializer.errors)

            # Eliminar items que no vienen en la solicitud y no tienen remisiones
            ItemsVenta.objects.filter(
                venta=venta,
                remisiones_items__isnull=True
            ).exclude(articulo_id__in=requested_articulos).delete()
        
        if abonos:
        # Eliminamos abonos antiguos (o actualizamos según tu lógica de negocio)
            Abonos.objects.filter(venta=factura).delete()
            
            abonos_serializer = AbonoSerializer(data=abonos, many=True)
            if abonos_serializer.is_valid():
                abonos_serializer.save()
            else:
                console.log(abonos_serializer.errors)
        if saldo:
            saldo_obj, created = Saldos.objects.update_or_create(
                venta=venta,
                defaults={'saldo': saldo.get('saldo', 0)}
            )
            
            # También actualizamos el histórico
            historico_serializer = HistoricoSaldosSerializer(data=saldo)
            if historico_serializer.is_valid():
                historico_serializer.save()
            else:
                console.log(historico_serializer.errors)

        try:
            pedido = PedidoVenta.objects.get(venta=venta)
            pedido_serializer = PedidoVentaSerializer(pedido, data={'venta': venta.id}, partial=True)
            if pedido_serializer.is_valid():
                pedido_serializer.save()
        except PedidoVenta.DoesNotExist:
            pass

        total_abonos_db = Abonos.objects.filter(venta=venta).aggregate(
            total=Coalesce(Sum('precio'), 0)
        ).get('total') or 0
        venta.totalAbono = total_abonos_db
        venta.save(update_fields=['totalAbono'])
        maybe_mark_para_fabricacion(venta, usuario=request.user, origen='automatico')


        # return Response(serializer.data)
        
        return Response({'accion': 'ok'}, status=status.HTTP_200_OK)

    
    def delete(self, request):
        console.log(request.data)
        # console.log(id)
        id = request.data['id']
        venta = Ventas.objects.get(id=id)
        # abono = Abonos.objects.filter(factura=venta.factura).first()
        # saldo = Saldos.objects.get(factura=venta)

        with transaction.atomic():
            detalle_anulacion = request.data['detalleAnulacion']
            remisiones_qs = Remision.objects.filter(venta=venta, anulado=False)
            remisiones_anuladas = remisiones_qs.count()
            remisiones_qs.update(
                anulado=True,
                detalleAnulacion=detalle_anulacion,
                usuarioAnulacion=request.user.id,
                fechaAnulacion=timezone.now(),
            )

            venta.estado_id = 4
            venta.detalleAnulacion = detalle_anulacion
            venta.usuarioAnulacion = request.user.id
            venta.anulado = 1
            venta.save()
        # abono.delete()
        # venta.delete()
        # saldo.delete()

        return Response({'accion': 'ok', 'remisiones_anuladas': remisiones_anuladas}, status=status.HTTP_200_OK)



class UpcomingAppointmentsView(APIView):
    permission_classes = []

    def get(self, request):
        if getattr(settings, "USE_TZ", False):
            today = timezone.localdate()
        else:
            today = date.today()
        citas = CitaAgenda.objects.filter(
            fecha__gte=today,
            is_active=True,
        ).order_by('fecha', 'hora_inicio')
        serializer = CitaAgendaSerializer(
            citas,
            many=True,
            context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class AppointmentRegistrationView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = CitaAgendaRegistroSerializer(data=request.data)
        if serializer.is_valid():
            registro = serializer.save()
            return Response(
                {
                    "message": "Registro recibido",
                    "registro_id": registro.id,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class Abono(APIView):
    def _actualizar_totales_venta(self, venta):
        total_abono = (
            Abonos.objects.filter(venta=venta)
            .aggregate(total=Coalesce(Sum('precio'), 0))
            .get('total')
            or 0
        )

        venta.totalAbono = total_abono

        saldo = Saldos.objects.filter(venta=venta).first()
        if saldo:
            saldo.saldo = max((venta.precio or 0) - total_abono, 0)
            saldo.save(update_fields=['saldo'])
            saldo_actual = saldo.saldo
        else:
            saldo_actual = max((venta.precio or 0) - total_abono, 0)

        if venta.anulado:
            venta.estado_id = 4
        elif saldo_actual == 0:
            venta.estado_id = 3
        elif total_abono > 0:
            venta.estado_id = 2
        else:
            venta.estado_id = 1

        venta.save(update_fields=['totalAbono', 'estado'])
        return total_abono, saldo_actual

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
                    T0.venta_id as venta,                                                                                                             
                    DATE_FORMAT(T0.fecha_abono, '%d/%m/%Y') as fecha,                                                                                                                                
                    T0.fecha_abono as fecha_raw,
                    T0.fecha as fecha_registro,
                    T0.id,                                                                                                                                   
                    T0.medioDePago_id,   
                    T0.descripcion,
                    T2.nombre as "medioDePago",
                    T2.imagen as "imagenMedioPago",
                    T0.precio                                                                                                                                                                                                                                                                
                FROM contabilidad_abonos T0                                                                                                               
                    left join usuarios_clientes T1 on T0.cliente_id = T1.cedula                                                                               
                    left join contabilidad_mediosdepago T2 on T2.id  =  T0.medioDePago_id                                                                       
                #inner join contabilidad_estadoventa T3 on T0.estado_id = T3.id  
                where venta_id = {factura}
                /*group by 
                    #T0.cliente_id,
                    T0.venta_id
                */
                order by venta_id desc;
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
                T0.venta_id as factura_id,
                DATE_FORMAT(T0.fecha_abono, '%d/%m/%Y') as fecha,
                T0.fecha_abono as fecha_raw,
                T0.fecha as fecha_registro,
                T0.id,
                T0.medioDePago_id,
                T0.abono_masivo_id,
                T0.descripcion,
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
        factura_raw = request.data.get('factura') or request.data.get('venta')
        if not factura_raw:
            return Response({'detail': 'Debe indicar la venta a la que aplica el abono.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            venta = Ventas.objects.get(pk=int(factura_raw))
        except (Ventas.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'La venta indicada no existe.'}, status=status.HTTP_404_NOT_FOUND)

        saldo = get_object_or_404(Saldos, venta=venta)
        console.log(venta)
        # metodoPago = MediosDePago.objects.get(id=metodoPago)
    

        data_copy = request.data.copy()
        data_copy['factura'] = venta.id
        if data_copy.get('fecha') and not data_copy.get('fecha_abono'):
            data_copy['fecha_abono'] = data_copy.get('fecha')

        serializer = AbonoSerializer(data=data_copy)
        #serializer = VentaSerializer(data=listdata, many=True)

        if serializer.is_valid():
            console.log("vamos bien")
            # console.log(serializer.data)
            #console.log(serializer.data)
            serializer.save()

            total_Abono = Abonos.objects.filter(
                venta=venta
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
            maybe_mark_para_fabricacion(venta, usuario=request.user, origen='automatico')

            # return JsonResponse({'accion': 'ok'}{'accion': 'ok'}, status=201)
            return Response({'accion': 'ok'}, status=status.HTTP_201_CREATED)
        

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # return JsonResponse({'accion': 'valid'}, status=200)

    def put(self, request, factura=None):
        abono_id = request.data.get('id') or factura
        if not abono_id:
            return Response({'detail': 'Debe indicar el abono que desea actualizar.'}, status=status.HTTP_400_BAD_REQUEST)

        abono = get_object_or_404(Abonos, pk=abono_id)
        data = request.data.copy()

        if not data.get('venta') and abono.venta_id:
            data['venta'] = abono.venta_id
        if not data.get('cliente_id') and abono.cliente_id:
            data['cliente_id'] = abono.cliente_id
        if data.get('fecha') and not data.get('fecha_abono'):
            data['fecha_abono'] = data.get('fecha')

        serializer = AbonoSerializer(abono, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            total_abono, saldo_actual = self._actualizar_totales_venta(abono.venta)
            return Response(
                {
                    'accion': 'ok',
                    'id': abono.id,
                    'totalAbono': total_abono,
                    'saldo': saldo_actual,
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, factura=None):
        abono_id = request.data.get('id') or factura
        if not abono_id:
            return Response({'detail': 'Debe indicar el abono que desea eliminar.'}, status=status.HTTP_400_BAD_REQUEST)

        abono = get_object_or_404(Abonos, pk=abono_id)
        venta = abono.venta

        with transaction.atomic():
            abono.delete()
            total_abono, saldo_actual = self._actualizar_totales_venta(venta)

        return Response(
            {
                'accion': 'ok',
                'totalAbono': total_abono,
                'saldo': saldo_actual,
            },
            status=status.HTTP_200_OK,
        )


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
    def get(self, request, jornada_id):
        jornada = get_object_or_404(
            Jornada.objects.select_related('empresa', 'responsable'),
            pk=jornada_id,
        )

        ventas = list(
            Ventas.objects.filter(jornada_id=jornada.id)
            .select_related('estado', 'estado_pedido', 'vendedor')
            .order_by('-id')
        )
        venta_ids = [venta.id for venta in ventas]
        cliente_ids = [venta.cliente_id for venta in ventas if venta.cliente_id]

        clientes_map = {
            cliente.cedula: cliente
            for cliente in Clientes.objects.filter(cedula__in=cliente_ids)
        }
        abonos_map = {
            row['venta_id']: int(row['total'] or 0)
            for row in Abonos.objects.filter(venta_id__in=venta_ids)
            .values('venta_id')
            .annotate(total=Coalesce(Sum('precio'), 0))
        }

        items_map = defaultdict(list)
        unidades_por_venta = defaultdict(int)
        total_unidades = 0

        for item in ItemsVenta.objects.filter(venta_id__in=venta_ids).select_related('articulo').order_by('venta_id', 'id'):
            cantidad = int(item.cantidad or 0)
            item_payload = {
                'id': item.id,
                'articulo_id': item.articulo_id,
                'articulo': item.articulo.nombre if item.articulo else '',
                'cantidad': cantidad,
                'precio_unitario': int(item.precio_articulo or 0),
                'descuento': int(item.descuento or 0),
                'tipo_descuento': item.tipo_descuento or 'precio',
                'total': int(item.totalArticulo or 0),
            }
            items_map[item.venta_id].append(item_payload)
            unidades_por_venta[item.venta_id] += cantidad
            total_unidades += cantidad

        ventas_payload = []
        total_vendido = 0
        total_abonos = 0
        total_saldos = 0

        for venta in ventas:
            cliente = clientes_map.get(venta.cliente_id)
            total_abono_db = int(abonos_map.get(venta.id, 0) or 0)
            total_abono = max(total_abono_db, int(venta.totalAbono or 0))
            precio = int(venta.precio or 0)
            saldo = max(precio - total_abono, 0)
            articulos = items_map.get(venta.id, [])

            total_vendido += precio
            total_abonos += total_abono
            total_saldos += saldo

            ventas_payload.append({
                'id': venta.id,
                'cliente_id': venta.cliente_id,
                'cliente_nombre': getattr(cliente, 'nombre', None),
                'cliente_cedula': getattr(cliente, 'cedula', None),
                'cliente_telefono': getattr(cliente, 'celular', None),
                'empresa_cliente': venta.empresaCliente,
                'fecha': venta.fecha,
                'precio': precio,
                'total_abono': total_abono,
                'saldo': saldo,
                'estado_pago': venta.estado.nombre if venta.estado else None,
                'estado_pedido': venta.estado_pedido.nombre if venta.estado_pedido else None,
                'vendedor_nombre': venta.vendedor.nombre if venta.vendedor else None,
                'condicion_pago': venta.condicion_pago,
                'detalle': venta.detalle,
                'observacion': venta.observacion,
                'anulado': venta.anulado,
                'articulos_count': len(articulos),
                'unidades_count': unidades_por_venta.get(venta.id, 0),
                'articulos': articulos,
            })

        payload = {
            'id': jornada.id,
            'empresa': jornada.empresa_id,
            'empresa_nombre': jornada.empresa.nombre if jornada.empresa else None,
            'sucursal': jornada.sucursal,
            'fecha': jornada.fecha,
            'fecha_inicio': jornada.fecha_inicio,
            'fecha_vencimiento': jornada.fecha_vencimiento,
            'condicion_pago': jornada.condicion_pago,
            'cantidad_cuotas': jornada.cantidad_cuotas,
            'estado': jornada.estado,
            'responsable': jornada.responsable_id,
            'responsable_nombre': jornada.responsable.get_full_name() if jornada.responsable and jornada.responsable.get_full_name() else (jornada.responsable.username if jornada.responsable else None),
            'observaciones': jornada.observaciones,
            'resumen': {
                'ventas_count': len(ventas_payload),
                'total_vendido': total_vendido,
                'total_abonos': total_abonos,
                'total_saldos': total_saldos,
                'total_unidades': total_unidades,
            },
            'ventas': ventas_payload,
        }
        return Response(payload, status=status.HTTP_200_OK)

    def patch(self, request, jornada_id):
        jornada = get_object_or_404(Jornada, pk=jornada_id)
        if jornada.estado in ['in_progress', 'closed']:
            return Response(
                {'detail': 'No es posible editar una jornada que ya fue iniciada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
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

    def delete(self, request, jornada_id):
        jornada = get_object_or_404(Jornada, pk=jornada_id)
        if jornada.estado in ['in_progress', 'closed']:
            return Response(
                {'detail': 'No es posible eliminar una jornada que ya fue iniciada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if jornada.ventas.exists():
            return Response(
                {'detail': 'No es posible eliminar la jornada porque ya tiene ventas asociadas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            jornada.delete()
        except IntegrityError:
            return Response(
                {'detail': 'No fue posible eliminar la jornada porque tiene registros relacionados.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)



def _parse_estado_pedido_fecha(raw_value):
    if not raw_value:
        return None
    parsed = parse_datetime(str(raw_value))
    if parsed is None:
        return None

    if settings.USE_TZ:
        if timezone.is_naive(parsed):
            parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
        return parsed

    if timezone.is_aware(parsed):
        parsed = timezone.make_naive(parsed, timezone.get_current_timezone())
    return parsed

def _sync_total_abono_venta(venta):
    total_abonos_db = Abonos.objects.filter(venta=venta).aggregate(
        total=Coalesce(Sum('precio'), 0)
    ).get('total') or 0
    total_abono_actual = max(total_abonos_db, venta.totalAbono or 0)
    if total_abono_actual != (venta.totalAbono or 0):
        venta.totalAbono = total_abono_actual
        venta.save(update_fields=['totalAbono'])
    return total_abono_actual



def _apply_estado_pedido_change(venta, estado_slug, motivo_sin_anticipo='', *, usuario=None, origen='manual', fecha_estado=None):
    estado_slug = (estado_slug or '').strip()
    motivo_sin_anticipo = (motivo_sin_anticipo or '').strip()

    if estado_slug not in ESTADO_PEDIDO_ORDER:
        return False, 'Estado solicitado no es valido.'

    actual_slug = identify_estado_pedido_slug(getattr(venta.estado_pedido, 'nombre', None))
    actual_order = ESTADO_PEDIDO_ORDER.get(actual_slug, 0)
    target_order = ESTADO_PEDIDO_ORDER[estado_slug]
    parsed_fecha = _parse_estado_pedido_fecha(fecha_estado)

    if target_order < actual_order:
        return False, 'No es posible retroceder el estado del pedido.'

    if target_order == actual_order:
        if parsed_fecha is None:
            return False, 'La venta ya se encuentra en el estado seleccionado.'

        venta.estado_pedido_actualizado = parsed_fecha
        venta.save(update_fields=['estado_pedido_actualizado'])

        historico_actual = (
            HistoricoEstadoPedidoVenta.objects.filter(venta=venta, estado_nuevo=venta.estado_pedido)
            .order_by('-fecha', '-id')
            .first()
        )
        if historico_actual:
            if historico_actual.fecha != parsed_fecha:
                historico_actual.fecha = parsed_fecha
                historico_actual.save(update_fields=['fecha'])
        else:
            HistoricoEstadoPedidoVenta.objects.create(
                venta=venta,
                estado_anterior=None,
                estado_nuevo=venta.estado_pedido,
                usuario=usuario if getattr(usuario, 'is_authenticated', False) else None,
                origen=origen,
                fecha=parsed_fecha,
            )

        current_estado = venta.estado_pedido.nombre if venta.estado_pedido else None
        data = {
            'estado': current_estado,
            'estado_slug': actual_slug,
            'estado_pedido': current_estado,
            'estado_pedido_slug': actual_slug,
            'detalle': venta.estado_pedido_detalle,
            'motivo_sin_anticipo': venta.motivo_sin_anticipo,
            'actualizado': venta.estado_pedido_actualizado,
            'updated': True,
        }
        return True, data

    if estado_slug == 'entregado':
        return False, 'El estado Entregado se actualiza automaticamente luego de la remision completa.'

    minimo = 0
    precio = venta.precio or 0
    if precio > 0:
        minimo = math.ceil(precio / 2)

    total_abono_actual = _sync_total_abono_venta(venta)
    pertenece_jornada = venta.jornada_id is not None
    requiere_motivo = (
        target_order >= ESTADO_PEDIDO_ORDER['para_fabricacion'] and
        not pertenece_jornada and
        minimo > 0 and
        total_abono_actual < minimo
    )

    if requiere_motivo and not motivo_sin_anticipo:
        return False, 'Indique el motivo por el cual se envia a fabricacion sin cumplir el abono minimo.'

    updated = mark_estado_pedido(
        venta,
        estado_slug,
        motivo_sin_anticipo=motivo_sin_anticipo if requiere_motivo else None,
        clear_detalle=not requiere_motivo,
        usuario=usuario,
        origen=origen,
        fecha=parsed_fecha,
    )

    current_estado = venta.estado_pedido.nombre if venta.estado_pedido else None
    current_slug = identify_estado_pedido_slug(getattr(venta.estado_pedido, 'nombre', None))
    data = {
        'estado': current_estado,
        'estado_slug': current_slug,
        'estado_pedido': current_estado,
        'estado_pedido_slug': current_slug,
        'detalle': venta.estado_pedido_detalle,
        'motivo_sin_anticipo': venta.motivo_sin_anticipo,
        'actualizado': venta.estado_pedido_actualizado,
        'updated': updated,
    }
    return True, data


class VentaEstadoPedidoView(APIView):
    def post(self, request, venta_id):
        venta = get_object_or_404(Ventas, pk=venta_id)
        ok, result = _apply_estado_pedido_change(
            venta,
            request.data.get('estado'),
            request.data.get('motivo_sin_anticipo') or request.data.get('detalle') or '',
            usuario=request.user,
            origen='manual',
            fecha_estado=request.data.get('fecha_estado'),
        )
        if not ok:
            return Response({'detail': result}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)


class VentaEstadoPedidoMasivoView(APIView):
    def post(self, request):
        venta_ids = request.data.get('venta_ids') or []
        estado_slug = request.data.get('estado')
        motivo_sin_anticipo = request.data.get('motivo_sin_anticipo') or request.data.get('detalle') or ''

        if not isinstance(venta_ids, list) or not venta_ids:
            return Response({'detail': 'Debe seleccionar al menos una venta.'}, status=status.HTTP_400_BAD_REQUEST)

        ventas = list(Ventas.objects.filter(id__in=venta_ids).select_related('estado_pedido'))
        if len(ventas) != len(set(venta_ids)):
            return Response({'detail': 'Una o mas ventas no fueron encontradas.'}, status=status.HTTP_400_BAD_REQUEST)

        estados_actuales = {
            identify_estado_pedido_slug(getattr(venta.estado_pedido, 'nombre', None))
            for venta in ventas
        }
        if len(estados_actuales) > 1:
            return Response({'detail': 'No puedes mezclar ventas con diferentes estados de pedido en una misma accion.'}, status=status.HTTP_400_BAD_REQUEST)

        errores = []
        procesadas = 0
        resultados = []
        for venta in ventas:
            ok, result = _apply_estado_pedido_change(venta, estado_slug, motivo_sin_anticipo, usuario=request.user, origen='masivo', fecha_estado=request.data.get('fecha_estado'))
            if ok:
                procesadas += 1
                resultados.append({
                    'venta_id': venta.id,
                    **result,
                })
            else:
                errores.append({'venta_id': venta.id, 'detail': result})

        return Response(
            {
                'procesadas': procesadas,
                'errores': errores,
                'estado': estado_slug,
                'estado_pedido': resultados[0]['estado_pedido'] if resultados else None,
                'estado_pedido_slug': resultados[0]['estado_pedido_slug'] if resultados else None,
                'resultados': resultados,
            },
            status=status.HTTP_200_OK,
        )

class AbonoMasivoPreview(APIView):
    def get(self, request):
        tipo = (request.GET.get('tipo') or '').strip()
        empresa_id = request.GET.get('empresa_id')
        jornada_id = request.GET.get('jornada_id')
        cliente_id = request.GET.get('cliente_id')

        qs = Ventas.objects.filter(anulado=False)

        if tipo == 'empresa':
            if not empresa_id:
                return Response({'detail': 'Debe indicar la empresa.'}, status=status.HTTP_400_BAD_REQUEST)
            empresa = Empresa.objects.filter(id=empresa_id).first()
            if not empresa:
                return Response({'detail': 'Empresa no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            qs = qs.filter(empresaCliente=empresa.nombre)
        elif tipo == 'jornada':
            if not jornada_id:
                return Response({'detail': 'Debe indicar la jornada.'}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(jornada_id=jornada_id)
        elif tipo == 'cliente':
            if not cliente_id:
                return Response({'detail': 'Debe indicar el cliente.'}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(cliente_id=cliente_id)
        else:
            return Response({'detail': 'Tipo de previsualización no válido.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = qs.annotate(
            total_abonos=Coalesce(Sum('abonos__precio'), 0),
            saldo=F('precio') - Coalesce(Sum('abonos__precio'), 0),
        ).filter(saldo__gt=0)

        ventas = qs.values(
            'id',
            'cliente_id',
            'empresaCliente',
            'jornada_id',
            'precio',
            'total_abonos',
            'saldo',
            'cuotas',
            'fecha',
        ).order_by('fecha', 'id')

        return Response(list(ventas), status=status.HTTP_200_OK)


class AbonoMasivoApply(APIView):
    def post(self, request):
        data = request.data
        tipo = (data.get('tipo') or '').strip()
        empresa_id = data.get('empresa_id')
        jornada_id = data.get('jornada_id')
        cliente_id = data.get('cliente_id')
        medio_id = data.get('medioDePago') or data.get('medioPago')
        descripcion = data.get('descripcion')
        fecha = data.get('fecha')
        items = data.get('items', [])

        if not tipo:
            return Response({'detail': 'Debe indicar el tipo de abono masivo.'}, status=status.HTTP_400_BAD_REQUEST)
        if not medio_id:
            return Response({'detail': 'Debe indicar el medio de pago.'}, status=status.HTTP_400_BAD_REQUEST)

        if isinstance(items, str):
            try:
                items = json.loads(items)
            except json.JSONDecodeError:
                return Response({'detail': 'Items no es un JSON válido.'}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(items, list) or not items:
            return Response({'detail': 'Debe indicar al menos un item para abonar.'}, status=status.HTTP_400_BAD_REQUEST)

        empresa = None
        jornada = None
        cliente = None
        nombre_objetivo = None

        if tipo == 'empresa':
            if not empresa_id:
                return Response({'detail': 'Debe indicar la empresa.'}, status=status.HTTP_400_BAD_REQUEST)
            empresa = Empresa.objects.filter(id=empresa_id).first()
            if not empresa:
                return Response({'detail': 'Empresa no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            nombre_objetivo = empresa.nombre
        elif tipo == 'jornada':
            if not jornada_id:
                return Response({'detail': 'Debe indicar la jornada.'}, status=status.HTTP_400_BAD_REQUEST)
            jornada = Jornada.objects.filter(id=jornada_id).first()
            if not jornada:
                return Response({'detail': 'Jornada no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            nombre_objetivo = str(jornada)
        elif tipo == 'cliente':
            if not cliente_id:
                return Response({'detail': 'Debe indicar el cliente.'}, status=status.HTTP_400_BAD_REQUEST)
            cliente = Clientes.objects.filter(cedula=cliente_id).first()
            if not cliente:
                return Response({'detail': 'Cliente no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
            nombre_objetivo = f"{cliente.nombre} {cliente.apellido}".strip()
        else:
            return Response({'detail': 'Tipo de abono masivo inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            abono_masivo = AbonoMasivo.objects.create(
                tipo=tipo,
                nombre_objetivo=nombre_objetivo,
                empresa=empresa,
                jornada=jornada,
                cliente=cliente,
            )

            creados = []
            for item in items:
                venta_id = item.get('venta') or item.get('venta_id') or item.get('id')
                monto = item.get('monto') or item.get('aplicar') or 0
                try:
                    monto = float(monto)
                except (TypeError, ValueError):
                    monto = 0

                if not venta_id or monto <= 0:
                    continue

                venta = Ventas.objects.filter(id=venta_id).first()
                if not venta:
                    continue

                cliente_obj = Clientes.objects.filter(cedula=venta.cliente_id).first()
                if not cliente_obj:
                    continue

                abono_data = {
                    'venta': venta.id,
                    'cliente_id': venta.cliente_id,
                    'precio': int(monto),
                    'medioDePago': medio_id,
                    'descripcion': descripcion,
                    'abono_masivo': abono_masivo.id,
                }
                if fecha:
                    abono_data['fecha_abono'] = fecha

                serializer = AbonoSerializer(data=abono_data)
                if serializer.is_valid():
                    serializer.save()
                    creados.append(venta.id)
                else:
                    console.log(serializer.errors)

                total_abono = Abonos.objects.filter(venta=venta).aggregate(total=Sum('precio')).get('total') or 0
                venta.totalAbono = total_abono
                saldo_obj, _ = Saldos.objects.get_or_create(
                    venta=venta,
                    defaults={'cliente': cliente_obj, 'saldo': 0}
                )
                saldo_obj.saldo = max((venta.precio or 0) - total_abono, 0)

                if saldo_obj.saldo != (venta.precio or 0) and saldo_obj.saldo != 0:
                    venta.estado_id = 2
                elif saldo_obj.saldo == 0:
                    venta.estado_id = 3

                venta.save()
                saldo_obj.save()
                maybe_mark_para_fabricacion(venta, usuario=request.user, origen='automatico')

        return Response({'accion': 'ok', 'creados': creados}, status=status.HTTP_201_CREATED)


class AbonoMasivoDetail(APIView):
    def get(self, request, abono_masivo_id):
        abono_masivo = get_object_or_404(
            AbonoMasivo.objects.select_related('empresa', 'jornada', 'cliente'),
            pk=abono_masivo_id,
        )

        abonos = (
            Abonos.objects.filter(abono_masivo=abono_masivo)
            .select_related('medioDePago', 'venta')
            .order_by('-fecha', '-id')
        )

        total = sum((abono.precio or 0) for abono in abonos)

        return Response(
            {
                'id': abono_masivo.id,
                'tipo': abono_masivo.tipo,
                'nombre_objetivo': abono_masivo.nombre_objetivo,
                'empresa': getattr(abono_masivo.empresa, 'nombre', None),
                'jornada': getattr(abono_masivo.jornada, 'id', None),
                'cliente': getattr(abono_masivo.cliente, 'nombre', None),
                'creado_en': abono_masivo.creado_en,
                'total': total,
                'cantidad_abonos': abonos.count(),
                'abonos': [
                    {
                        'id': abono.id,
                        'venta_id': abono.venta_id,
                        'cliente_id': abono.cliente_id,
                        'cliente_nombre': (
                            Clientes.objects.filter(cedula=abono.cliente_id)
                            .values_list('nombre', flat=True)
                            .first()
                        ),
                        'precio': abono.precio,
                        'fecha': abono.fecha_abono,
                'fecha_registro': abono.fecha,
                        'descripcion': abono.descripcion,
                        'medioDePago': abono.medioDePago.nombre if abono.medioDePago else None,
                    }
                    for abono in abonos
                ],
            },
            status=status.HTTP_200_OK,
        )


class RemisionView(APIView):
    def _build_totals_map(self, venta_id=None):
        filtros = {}
        if venta_id is not None:
            filtros['item_venta__venta_id'] = venta_id

        filtros['remision__anulado'] = False
        remisiones_totales = RemisionItem.objects.filter(**filtros).values('item_venta_id').annotate(
            total=Coalesce(Sum('cantidad'), 0)
        )

        return {item['item_venta_id']: item['total'] for item in remisiones_totales}

    def _build_pending_items_payload(self, venta):
        totales_map = self._build_totals_map(venta.id)
        items_payload = []
        for item in ItemsVenta.objects.filter(venta=venta).select_related('articulo'):
            remisionado = int(totales_map.get(item.id, 0) or 0)
            disponible = int(item.cantidad or 0) - remisionado
            if disponible > 0:
                items_payload.append({
                    'itemVenta': item.id,
                    'cantidad': disponible,
                })
        return items_payload

    def _build_preview_for_venta(self, venta):
        totales_map = self._build_totals_map(venta.id)
        items_preview = []
        total_unidades_pendientes = 0

        for item in ItemsVenta.objects.filter(venta=venta).select_related('articulo'):
            cantidad_factura = int(item.cantidad or 0)
            remisionado = int(totales_map.get(item.id, 0) or 0)
            pendiente = max(cantidad_factura - remisionado, 0)
            if pendiente > 0:
                total_unidades_pendientes += pendiente
                items_preview.append({
                    'item_venta_id': item.id,
                    'articulo_id': item.articulo_id,
                    'articulo': item.articulo.nombre if item.articulo else f'Articulo #{item.articulo_id}',
                    'cantidad_factura': cantidad_factura,
                    'cantidad_remisionada': remisionado,
                    'cantidad_pendiente': pendiente,
                    'cantidad_incluir': pendiente,
                })

        return {
            'venta_id': venta.id,
            'cliente_id': venta.cliente_id,
            'total_articulos_pendientes': len(items_preview),
            'total_unidades_pendientes': total_unidades_pendientes,
            'puede_remisionar': total_unidades_pendientes > 0,
            'detail': None if total_unidades_pendientes > 0 else 'La venta no tiene cantidades pendientes por remisionar.',
            'items': items_preview,
        }

    def get(self, request, venta_id=None):
        include_anuladas = str(request.GET.get('include_anuladas') or '').lower() in {'1', 'true', 'yes'}
        if venta_id is not None:
            remisiones_qs = Remision.objects.filter(
                venta_id=venta_id,
            )
            if not include_anuladas:
                remisiones_qs = remisiones_qs.filter(anulado=False)
            remisiones_qs = remisiones_qs.prefetch_related(
                'items__item_venta__articulo'
            ).order_by('fecha', 'id')
        else:
            remisiones_qs = Remision.objects.all()
            if not include_anuladas:
                remisiones_qs = remisiones_qs.filter(anulado=False)
            remisiones_qs = remisiones_qs.prefetch_related(
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
            sync_estado_entrega_por_remision(remision.venta, usuario=request.user, origen='automatico')
            remision_data = RemisionSerializer(
                remision,
                context={'remision_totals': totales_map}
            ).data

            return Response(remision_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, remision_id=None):
        if remision_id is None:
            return Response({'detail': 'Debe indicar la remision a anular.'}, status=status.HTTP_400_BAD_REQUEST)

        remision = get_object_or_404(
            Remision.objects.select_related('venta').prefetch_related('items__item_venta__articulo'),
            pk=remision_id,
        )

        if remision.anulado:
            return Response({'detail': 'La remision ya fue anulada.'}, status=status.HTTP_400_BAD_REQUEST)

        detalle_anulacion = (request.data.get('detalleAnulacion') or request.data.get('detalle') or '').strip()
        if not detalle_anulacion:
            detalle_anulacion = 'Remision anulada manualmente.'

        with transaction.atomic():
            remision.anulado = True
            remision.detalleAnulacion = detalle_anulacion
            remision.usuarioAnulacion = getattr(request.user, 'id', None)
            remision.fechaAnulacion = timezone.now()
            remision.save(update_fields=['anulado', 'detalleAnulacion', 'usuarioAnulacion', 'fechaAnulacion'])

            sync_estado_entrega_por_remision(remision.venta, usuario=request.user, origen='automatico')

        remision.refresh_from_db()
        totales_map = self._build_totals_map(remision.venta_id)
        remision_data = RemisionSerializer(
            remision,
            context={'remision_totals': totales_map}
        ).data

        return Response(
            {
                'detail': 'Remision anulada correctamente.',
                'remision': remision_data,
                'venta_id': remision.venta_id,
                'estado_pedido': remision.venta.estado_pedido.nombre if remision.venta.estado_pedido else None,
                'estado_pedido_actualizado': remision.venta.estado_pedido_actualizado,
            },
            status=status.HTTP_200_OK,
        )


class RemisionMasivaPreviewView(RemisionView):
    def post(self, request):
        venta_ids = request.data.get('venta_ids') or []
        if not isinstance(venta_ids, list) or not venta_ids:
            return Response({'detail': 'Debe seleccionar al menos una venta.'}, status=status.HTTP_400_BAD_REQUEST)

        venta_ids_normalizados = []
        try:
            for venta_id in venta_ids:
                venta_ids_normalizados.append(int(venta_id))
        except (TypeError, ValueError):
            return Response({'detail': 'La lista de ventas contiene valores invalidos.'}, status=status.HTTP_400_BAD_REQUEST)

        ventas_map = {
            venta.id: venta
            for venta in Ventas.objects.filter(id__in=venta_ids_normalizados)
        }
        if len(ventas_map) != len(set(venta_ids_normalizados)):
            return Response({'detail': 'Una o mas ventas no fueron encontradas.'}, status=status.HTTP_400_BAD_REQUEST)

        resultados = [self._build_preview_for_venta(ventas_map[venta_id]) for venta_id in venta_ids_normalizados]
        return Response(
            {
                'resultados': resultados,
                'ventas_con_pendientes': sum(1 for item in resultados if item['puede_remisionar']),
                'ventas_sin_pendientes': sum(1 for item in resultados if not item['puede_remisionar']),
                'total_unidades_pendientes': sum(int(item['total_unidades_pendientes'] or 0) for item in resultados),
            },
            status=status.HTTP_200_OK,
        )


class RemisionMasivaView(RemisionView):
    def post(self, request):
        fecha = request.data.get('fecha')
        observacion = (request.data.get('observacion') or '').strip()
        remisiones = request.data.get('remisiones')

        payloads = []
        if isinstance(remisiones, list) and remisiones:
            for remision in remisiones:
                try:
                    venta_id = int(remision.get('venta_id'))
                except (TypeError, ValueError):
                    return Response({'detail': 'Una o mas ventas de la remision masiva son invalidas.'}, status=status.HTTP_400_BAD_REQUEST)

                items_payload = []
                for item in remision.get('items') or []:
                    try:
                        item_venta_id = int(item.get('itemVenta') or item.get('item_venta_id'))
                        cantidad = int(item.get('cantidad'))
                    except (TypeError, ValueError):
                        continue
                    if cantidad > 0:
                        items_payload.append({
                            'itemVenta': item_venta_id,
                            'cantidad': cantidad,
                        })

                payloads.append({
                    'venta_id': venta_id,
                    'items': items_payload,
                    'observacion': (remision.get('observacion') or observacion or None),
                })
        else:
            venta_ids = request.data.get('venta_ids') or []
            if not isinstance(venta_ids, list) or not venta_ids:
                return Response({'detail': 'Debe seleccionar al menos una venta.'}, status=status.HTTP_400_BAD_REQUEST)

            venta_ids_normalizados = []
            try:
                for venta_id in venta_ids:
                    venta_ids_normalizados.append(int(venta_id))
            except (TypeError, ValueError):
                return Response({'detail': 'La lista de ventas contiene valores invalidos.'}, status=status.HTTP_400_BAD_REQUEST)

            ventas_base = list(Ventas.objects.filter(id__in=venta_ids_normalizados).order_by('id'))
            if len(ventas_base) != len(set(venta_ids_normalizados)):
                return Response({'detail': 'Una o mas ventas no fueron encontradas.'}, status=status.HTTP_400_BAD_REQUEST)

            for venta in ventas_base:
                payloads.append({
                    'venta_id': venta.id,
                    'items': self._build_pending_items_payload(venta),
                    'observacion': observacion or None,
                })

        venta_ids_requeridos = [payload['venta_id'] for payload in payloads]
        ventas_map = {venta.id: venta for venta in Ventas.objects.filter(id__in=venta_ids_requeridos)}
        if len(ventas_map) != len(set(venta_ids_requeridos)):
            return Response({'detail': 'Una o mas ventas no fueron encontradas.'}, status=status.HTTP_400_BAD_REQUEST)

        creadas = []
        omitidas = []
        errores = []

        for payload_data in payloads:
            venta = ventas_map[payload_data['venta_id']]
            items_payload = payload_data['items']
            if not items_payload:
                omitidas.append({
                    'venta_id': venta.id,
                    'detail': 'La venta no tiene cantidades pendientes por remisionar o no se seleccionaron cantidades para incluir.',
                })
                continue

            payload = {
                'venta': venta.id,
                'fecha': fecha,
                'observacion': payload_data['observacion'],
                'items': items_payload,
            }

            try:
                with transaction.atomic():
                    serializer = RemisionSerializer(data=payload)
                    if not serializer.is_valid():
                        errores.append({
                            'venta_id': venta.id,
                            'detail': serializer.errors,
                        })
                        continue

                    remision = serializer.save()
                    sync_estado_entrega_por_remision(remision.venta, usuario=request.user, origen='automatico')
                    remision_data = RemisionSerializer(
                        remision,
                        context={'remision_totals': self._build_totals_map(remision.venta_id)}
                    ).data
                    creadas.append({
                        'venta_id': venta.id,
                        'remision': remision_data,
                    })
            except Exception as exc:
                errores.append({
                    'venta_id': venta.id,
                    'detail': str(exc),
                })

        return Response(
            {
                'procesadas': len(creadas),
                'omitidas': omitidas,
                'errores': errores,
                'resultados': creadas,
            },
            status=status.HTTP_200_OK,
        )

class Pedidos(APIView):
    def get(self, request):
        pass

        # query = 
        # Se debe hacer que al hacer la mitad del pago se ponga la fecha de inicio de fabricacion y la fecha de entrega
