from django.db.models import F, Sum, OuterRef, Subquery, IntegerField
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from usuarios.models import Clientes
from .models import Ventas, Abonos, ItemsVenta, Saldos


def cartera_rows():
    payments = Abonos.objects.filter(venta_id=OuterRef('pk')).values('venta_id').annotate(total=Sum('precio')).values('total')
    legacy_due = Saldos.objects.filter(venta_id=OuterRef('pk')).order_by('pk').values('fecha_Vencimiento')[:1]
    sales = Ventas.objects.filter(anulado=False).annotate(
        paid=Coalesce(Subquery(payments, output_field=IntegerField()), 0),
        balance=F('precio') - F('paid'),
        due=Coalesce('fecha_vencimiento', Subquery(legacy_due)),
    ).filter(balance__gt=0).select_related('jornada__empresa', 'empresa').order_by('-fecha', '-pk')
    clients = dict(Clientes.objects.values_list('cedula', 'nombre'))
    return [{
        'venta_id': sale.pk, 'fecha': sale.fecha, 'fecha_creacion': sale.fechaCreacion,
        'fecha_inicio': sale.fecha_inicio, 'cliente_id': sale.cliente_id,
        'cliente': clients.get(sale.cliente_id, ''), 'empresa': sale.empresa.nombre if sale.empresa_id else sale.empresaCliente,
        'jornada_id': sale.jornada_id,
        'jornada': f'{sale.jornada.empresa.nombre} - {sale.jornada.sucursal or ""}' if sale.jornada else None,
        'precio': sale.precio, 'totalAbono': sale.paid, 'saldo': sale.balance,
        'fecha_vencimiento': sale.due, 'condicion_pago': sale.condicion_pago,
        'cuotas': sale.cuotas, 'estado_pago': 'Con abono' if sale.paid > 0 else 'Sin pago',
    } for sale in sales]


class SaldosView(APIView):
    def get(self, request, venta_id=None):
        if venta_id is None:
            now = timezone.now()
            today = timezone.localtime(now).date() if timezone.is_aware(now) else now.date()
            return Response({'rows': cartera_rows(), 'fecha_referencia': today})
        sale = get_object_or_404(Ventas, pk=venta_id, anulado=False)
        return Response({
            'venta_id': sale.pk, 'detalle': sale.detalle,
            'articulos': list(ItemsVenta.objects.filter(venta=sale).order_by('pk').values(
                'id', 'articulo__nombre', 'cantidad', 'precio_articulo', 'totalArticulo',
            )),
            'abonos': list(Abonos.objects.filter(venta=sale).order_by('-fecha_abono', '-pk').values(
                'id', 'precio', 'fecha_abono', 'fecha', 'descripcion', 'medioDePago__nombre', 'abono_masivo_id',
            )),
        })
