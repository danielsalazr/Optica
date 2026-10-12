import json
from datetime import date, timedelta
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase, RequestFactory
from django.contrib import admin
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from contabilidad.models import Articulos, EstadoVenta, ItemsVenta, Remision, RemisionItem, Ventas, TipoVenta, Vendedor, Saldos
from usuarios.models import Clientes
from .models import ConfiguracionArticulo, Existencia, Movimiento, Reserva
from .services import despachar, liberar_venta, principal, reservar_venta, revertir_remision


class InventoryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = get_user_model().objects.create_superuser('inventory-audit', password='test-only')
        TipoVenta.objects.create(pk=1, nombre='Personal')
        cls.seller = Vendedor.objects.create(nombre='Vendedor prueba')
        Clientes.objects.create(cedula=100, nombre='Cliente')
        for pk, nombre in [(1, 'Pendiente'), (2, 'Parcial'), (3, 'Pagado'), (4, 'Anulado')]:
            EstadoVenta.objects.create(pk=pk, nombre=nombre)
        cls.article = Articulos.objects.create(nombre='Montura', precio=100000, tipo_articulo='1')
        cls.service = Articulos.objects.create(nombre='Consulta', tipo_articulo='2')
        cls.config = ConfiguracionArticulo.objects.create(articulo=cls.article, controla=True,
                                                         activado_en=timezone.now() - timedelta(days=1))
        cls.stock = Existencia.objects.create(articulo=cls.article, bodega=principal(), cantidad=10)
        cls.sale = Ventas.objects.create(pk=1, cliente_id=100, empresaCliente='Empresa', precio=200000,
                                        estado_id=1, tipo_venta=None)
        cls.item = ItemsVenta.objects.create(venta=cls.sale, articulo=cls.article, cantidad=2,
                                            precio_articulo=100000, totalArticulo=200000)
        Saldos.objects.create(venta=cls.sale, cliente_id=100, saldo=200000)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def stock_values(self):
        self.stock.refresh_from_db()
        return self.stock.cantidad, self.stock.reservado

    def movement(self, **changes):
        data = {'articulo_id': self.article.pk, 'tipo': 'entrada', 'cantidad': 3,
                'motivo': 'Conteo comprobado', 'fecha': '2026-10-11', 'clave': str(uuid4())}
        data.update(changes)
        return self.client.post('/inventario/movimientos/', data, format='json')

    def shipment(self, quantity=1):
        remision = Remision.objects.create(venta=self.sale, fecha=date(2026, 10, 11))
        RemisionItem.objects.create(remision=remision, item_venta=self.item, cantidad=quantity)
        despachar(remision, self.admin)
        return remision

    def test_reserves_without_reducing_physical(self):
        reservar_venta(self.sale)
        reservar_venta(self.sale)
        self.assertEqual(self.stock_values(), (10, 2))
        self.assertEqual(Reserva.objects.get().cantidad, 2)

    def test_insufficient_stock_rolls_back_reservation(self):
        ItemsVenta.objects.filter(pk=self.item.pk).update(cantidad=11)
        with self.assertRaises(ValidationError):
            reservar_venta(self.sale)
        self.assertEqual(self.stock_values(), (10, 0))
        self.assertFalse(Reserva.objects.exists())

    def test_partial_delivery_and_idempotence(self):
        reservar_venta(self.sale)
        first = self.shipment()
        despachar(first, self.admin)
        self.assertEqual(self.stock_values(), (9, 1))
        self.shipment()
        self.assertEqual(self.stock_values(), (8, 0))
        self.assertEqual(Movimiento.objects.filter(tipo='salida').count(), 2)

    def test_cancel_sale_does_not_return_delivered_goods(self):
        reservar_venta(self.sale)
        self.shipment()
        self.sale.anulado = True
        self.sale.save(update_fields=['anulado'])
        liberar_venta(self.sale)
        self.assertEqual(self.stock_values(), (9, 0))
        self.assertEqual(Movimiento.objects.count(), 1)

    def test_administrative_cancellation_restores_and_reserves(self):
        reservar_venta(self.sale)
        shipment = self.shipment()
        shipment.anulado = True
        shipment.save(update_fields=['anulado'])
        revertir_remision(shipment, self.admin)
        revertir_remision(shipment, self.admin)
        self.assertEqual(self.stock_values(), (10, 2))
        self.assertEqual(Movimiento.objects.filter(tipo='reversion').count(), 1)

    def test_return_is_bounded_by_delivery(self):
        reservar_venta(self.sale)
        self.shipment()
        origin = Movimiento.objects.get(tipo='salida')
        self.assertEqual(self.movement(tipo='devolucion', origen_id=origin.pk, cantidad=2).status_code, 400)
        self.assertEqual(self.movement(tipo='devolucion', origen_id=origin.pk, cantidad=1).status_code, 201)
        self.assertEqual(self.movement(tipo='devolucion', origen_id=origin.pk, cantidad=1).status_code, 400)
        self.assertEqual(self.stock_values(), (10, 1))

    def test_return_then_cancellation_never_double_credits(self):
        reservar_venta(self.sale)
        shipment = self.shipment()
        origin = Movimiento.objects.get(tipo='salida')
        self.movement(tipo='devolucion', origen_id=origin.pk, cantidad=1)
        shipment.anulado = True
        shipment.save(update_fields=['anulado'])
        revertir_remision(shipment, self.admin)
        self.assertEqual(self.stock_values(), (10, 2))

    def test_historical_sales_do_not_change_inventory(self):
        Ventas.objects.filter(pk=self.sale.pk).update(fechaCreacion=self.config.activado_en - timedelta(days=1))
        self.sale.refresh_from_db()
        reservar_venta(self.sale)
        self.shipment()
        self.assertEqual(self.stock_values(), (10, 0))
        self.assertFalse(Movimiento.objects.exists())

    def test_opt_out_is_unchanged(self):
        ConfiguracionArticulo.objects.filter(pk=self.config.pk).update(controla=False)
        reservar_venta(self.sale)
        self.shipment()
        self.assertEqual(self.stock_values(), (10, 0))

    def test_adjustment_is_absolute_and_cannot_consume_reserved(self):
        reservar_venta(self.sale)
        self.assertEqual(self.movement(tipo='ajuste', cantidad=1).status_code, 400)
        self.assertEqual(self.stock_values(), (10, 2))
        self.assertEqual(self.movement(tipo='ajuste', cantidad=7).status_code, 201)
        self.assertEqual(self.stock_values(), (7, 2))
        self.assertEqual(Movimiento.objects.get().cantidad, -3)

    def test_retries_do_not_duplicate_receipts(self):
        key = str(uuid4())
        self.assertEqual(self.movement(clave=key).status_code, 201)
        self.assertEqual(self.movement(clave=key).status_code, 200)
        self.assertEqual(self.movement(clave=key, cantidad=4).status_code, 400)
        self.assertEqual(self.stock_values(), (13, 0))
        self.assertEqual(Movimiento.objects.count(), 1)

    def test_service_cannot_enable_inventory(self):
        result = self.client.put(f'/inventario/articulos/{self.service.pk}/',
                                 {'controla': True, 'minimo': 0, 'codigo': None}, format='json')
        self.assertEqual(result.status_code, 400)
        self.assertFalse(ConfiguracionArticulo.objects.filter(articulo=self.service).exists())

    def test_cannot_disable_existing_stock(self):
        result = self.client.put(f'/inventario/articulos/{self.article.pk}/',
                                 {'controla': False, 'minimo': 0, 'codigo': None}, format='json')
        self.assertEqual(result.status_code, 400)
        self.config.refresh_from_db()
        self.assertTrue(self.config.controla)

    def test_missing_config_control_is_validation_error(self):
        result = self.client.put(f'/inventario/articulos/{self.article.pk}/', {}, format='json')
        self.assertEqual(result.status_code, 400)

    def test_new_sale_item_is_bound_to_created_sale(self):
        payload = self.sale_payload(2)
        rows = json.loads(payload['venta'])
        rows[0]['venta'] = 1
        payload['venta'] = json.dumps(rows)
        result = self.client.post('/venta/', payload, format='multipart')
        self.assertEqual(result.status_code, 200, result.data)
        self.assertEqual(ItemsVenta.objects.filter(venta_id=1).count(), 1)
        self.assertEqual(Reserva.objects.get().item.venta_id, 2)

    def test_reader_permissions(self):
        user = get_user_model().objects.create_user('stock-reader', password='test-only')
        user.user_permissions.add(Permission.objects.get(codename='view_inventario'))
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get('/inventario/').status_code, 200)
        self.assertEqual(self.movement().status_code, 403)

    def test_no_access_without_inventory_permission(self):
        user = get_user_model().objects.create_user('no-stock', password='test-only')
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get('/inventario/').status_code, 403)

    def test_history_date_and_immutable_endpoint(self):
        self.movement()
        response = self.client.get('/inventario/movimientos/?rows=10')
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['fecha'], date(2026, 10, 11))
        self.assertEqual(self.client.delete('/inventario/movimientos/').status_code, 405)

    def test_edit_release_and_rereserve(self):
        reservar_venta(self.sale)
        liberar_venta(self.sale)
        ItemsVenta.objects.filter(pk=self.item.pk).update(cantidad=3)
        reservar_venta(self.sale)
        self.assertEqual(self.stock_values(), (10, 3))

    def test_reducing_below_delivered_is_rejected(self):
        reservar_venta(self.sale)
        self.shipment(2)
        ItemsVenta.objects.filter(pk=self.item.pk).update(cantidad=1)
        with self.assertRaises(ValidationError):
            reservar_venta(self.sale)
        self.assertEqual(self.stock_values(), (8, 0))

    def test_api_remission_updates_inventory(self):
        reservar_venta(self.sale)
        response = self.client.post('/remisiones/', {'venta': self.sale.pk, 'fecha': '2026-10-11',
                                    'items': [{'itemVenta': self.item.pk, 'cantidad': 1}]}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.stock_values(), (9, 1))

    def test_api_remission_failure_rolls_back_document(self):
        response = self.client.post('/remisiones/', {'venta': self.sale.pk, 'fecha': '2026-10-11',
                                    'items': [{'itemVenta': self.item.pk, 'cantidad': 1}]}, format='json')
        self.assertEqual(response.status_code, 400, response.data)
        self.assertFalse(Remision.objects.exists())
        self.assertEqual(self.stock_values(), (10, 0))

    def test_mass_remission_updates_reserved_stock(self):
        reservar_venta(self.sale)
        response = self.client.post('/remisiones/masivo/', {'venta_ids': [self.sale.pk], 'fecha': '2026-10-11'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['procesadas'], 1)
        self.assertEqual(response.data['errores'], [])
        self.assertEqual(self.stock_values(), (8, 0))

    def test_mass_remission_failed_sale_leaves_no_shipment(self):
        response = self.client.post('/remisiones/masivo/', {'venta_ids': [self.sale.pk], 'fecha': '2026-10-11'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['procesadas'], 0)
        self.assertEqual(len(response.data['errores']), 1)
        self.assertFalse(Remision.objects.exists())
        self.assertEqual(self.stock_values(), (10, 0))

    def test_cancel_remission_api_reverses_only_once(self):
        reservar_venta(self.sale)
        shipment = self.shipment()
        result = self.client.delete(f'/remisiones/{shipment.pk}/', {'detalleAnulacion': 'Entrega no ocurrio'}, format='json')
        self.assertEqual(result.status_code, 200, result.data)
        self.assertEqual(self.stock_values(), (10, 2))
        self.assertEqual(self.client.delete(f'/remisiones/{shipment.pk}/', {}, format='json').status_code, 400)
        self.assertEqual(self.stock_values(), (10, 2))

    def sale_payload(self, pk, quantity=2):
        from contabilidad.payments import sale_snapshot
        return {'id': pk, 'cliente_id': 100, 'empresaCliente': 'Particular', 'vendedor': self.seller.pk, 'precio': quantity * 100000,
                'fecha': '2026-10-11', 'cuotas': 1, 'condicion_pago': 'mensual',
                'venta': json.dumps([{'venta': pk, 'articulo': self.article.pk, 'cantidad': quantity,
                                     'precio_articulo': 100000, 'totalArticulo': quantity * 100000}]),
                'abonos': '[]', 'saldo': json.dumps({'venta': pk, 'cliente': 100, 'saldo': quantity * 100000}),
                'venta_snapshot': sale_snapshot(Ventas.objects.get(pk=pk)) if Ventas.objects.filter(pk=pk).exists() else ''}

    def test_creating_sale_reserves_stock(self):
        result = self.client.post('/venta/', self.sale_payload(2), format='multipart')
        self.assertEqual(result.status_code, 200, result.data)
        self.assertEqual(self.stock_values(), (10, 2))
        self.assertTrue(Reserva.objects.filter(item__venta_id=2).exists())

    def test_insufficient_new_sale_rolls_back_all_documents(self):
        result = self.client.post('/venta/', self.sale_payload(2, 11), format='multipart')
        self.assertEqual(result.status_code, 400, result.data)
        self.assertFalse(Ventas.objects.filter(pk=2).exists())
        self.assertIn('Stock insuficiente', str(result.data))
        self.assertFalse(Reserva.objects.exists())

    def test_edit_sale_adjusts_reservation(self):
        reservar_venta(self.sale)
        result = self.client.put('/venta/', self.sale_payload(1, 3), format='multipart')
        self.assertEqual(result.status_code, 200, result.data)
        self.assertEqual(self.stock_values(), (10, 3))

    def test_edit_failure_preserves_original_sale_and_reservation(self):
        reservar_venta(self.sale)
        result = self.client.put('/venta/', self.sale_payload(1, 11), format='multipart')
        self.assertEqual(result.status_code, 400, result.data)
        self.assertIn('Stock insuficiente', str(result.data))
        self.item.refresh_from_db()
        self.assertEqual(self.item.cantidad, 2)
        self.assertEqual(self.stock_values(), (10, 2))

    def test_cancel_sale_api_releases_without_restock(self):
        reservar_venta(self.sale)
        self.shipment()
        result = self.client.delete('/venta/', {'id': self.sale.pk, 'detalleAnulacion': 'Cancelada'}, format='json')
        self.assertEqual(result.status_code, 200, result.data)
        self.assertEqual(self.stock_values(), (9, 0))
        self.assertTrue(Remision.objects.get().anulado)

    def test_controlled_admin_edits_are_guarded(self):
        request = RequestFactory().get('/admin/')
        request.user = self.admin
        model_admin = admin.site._registry[ItemsVenta]
        self.assertFalse(model_admin.has_change_permission(request, self.item))
        self.assertFalse(model_admin.has_delete_permission(request, self.item))
        self.assertFalse(model_admin.has_add_permission(request))
        self.assertFalse(model_admin.has_module_permission(request))
