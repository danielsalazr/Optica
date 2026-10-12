from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from time import sleep
from unittest.mock import patch
from uuid import uuid4

from django.db import close_old_connections, connections, connection
from django.db.models import Sum
from django.test import TransactionTestCase, skipUnlessDBFeature
from rest_framework.test import APIClient

from contabilidad.models import Articulos, ItemsVenta, Remision, RemisionItem, Ventas, Saldos
from contabilidad.utils_estado_pedido import get_estado_pedido_by_slug
from .models import Bodega, ConfiguracionArticulo, Existencia, Movimiento, Reserva
from .services import principal, registrar, reservar_venta, stock_bloqueado
from . import tests as fixtures
from .views import ConfigSerializer


@skipUnlessDBFeature('has_select_for_update')
class InventoryConcurrencyTests(TransactionTestCase):
    reset_sequences = True
    sale_payload = fixtures.InventoryTests.sale_payload
    stock_values = fixtures.InventoryTests.stock_values
    shipment = fixtures.InventoryTests.shipment

    def setUp(self):
        fixtures.InventoryTests.setUpTestData.__func__(type(self))
        for slug in ['creado', 'para_fabricacion', 'entregado', 'listo_entrega']:
            get_estado_pedido_by_slug(slug)
        for target in ['contabilidad.views.console.log', 'contabilidad.serializers.console.log']:
            mock = patch(target)
            mock.start()
            self.addCleanup(mock.stop)
        with connection.cursor() as cursor:
            cursor.execute("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='inventario_existencia'")
            self.assertEqual(cursor.fetchone()[0], 'InnoDB')

    def race(self, actions):
        barrier = Barrier(len(actions))

        def run(action):
            close_old_connections()
            try:
                client = APIClient()
                client.force_authenticate(self.admin)
                barrier.wait(timeout=15)
                return action(client)
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=len(actions)) as pool:
            return list(pool.map(run, actions))

    def assert_consistent(self):
        self.stock.refresh_from_db()
        reserved = Reserva.objects.aggregate(n=Sum('cantidad'))['n'] or 0
        net = Movimiento.objects.aggregate(n=Sum('cantidad'))['n'] or 0
        self.assertEqual(self.stock.reservado, reserved)
        self.assertEqual(self.stock.cantidad, 10 + net)
        self.assertGreaterEqual(self.stock.cantidad, reserved)

    def test_eight_sales_compete_for_ten_units(self):
        actions = [lambda client, pk=pk: client.post('/venta/', self.sale_payload(pk), format='multipart').status_code for pk in range(2, 10)]
        result = self.race(actions)
        self.assertEqual(result.count(200), 5, result)
        self.assertEqual(result.count(400), 3, result)
        self.assertEqual(self.stock_values(), (10, 10))
        self.assert_consistent()

    def test_eight_shipments_cannot_deliver_more_than_two_units(self):
        reservar_venta(self.sale)
        action = lambda client: client.post('/remisiones/', {'venta': 1, 'fecha': '2026-10-11',
            'items': [{'itemVenta': self.item.pk, 'cantidad': 1}]}, format='json').status_code
        result = self.race([action] * 8)
        self.assertEqual(result.count(201), 2, result)
        self.assertEqual(result.count(400), 6, result)
        self.assertEqual(RemisionItem.objects.aggregate(n=Sum('cantidad'))['n'], 2)
        self.assertEqual(self.stock_values(), (8, 0))
        self.assert_consistent()

    def test_eight_receipt_retries_register_one_movement(self):
        data = {'articulo_id': self.article.pk, 'tipo': 'entrada', 'cantidad': 3,
                'motivo': 'Concurrent retry', 'clave': str(uuid4())}
        result = self.race([lambda client: client.post('/inventario/movimientos/', data, format='json').status_code] * 8)
        self.assertEqual(result.count(201), 1, result)
        self.assertEqual(result.count(200), 7, result)
        self.assertEqual(Movimiento.objects.count(), 1)
        self.assertEqual(self.stock_values(), (13, 0))
        self.assert_consistent()

    def test_eight_returns_cannot_exceed_two_delivered_units(self):
        reservar_venta(self.sale)
        self.shipment(2)
        origin = Movimiento.objects.get(tipo='salida')
        def action(client):
            return client.post('/inventario/movimientos/', {'articulo_id': self.article.pk, 'tipo': 'devolucion',
                'cantidad': 1, 'motivo': 'Concurrent return', 'clave': str(uuid4()), 'origen_id': origin.pk}, format='json').status_code
        result = self.race([action] * 8)
        self.assertEqual(result.count(201), 2, result)
        self.assertEqual(result.count(400), 6, result)
        self.assertEqual(self.stock_values(), (10, 0))
        self.assert_consistent()

    def test_eight_cancellations_reverse_shipment_once(self):
        reservar_venta(self.sale)
        shipment = self.shipment()
        result = self.race([lambda client: client.delete(f'/remisiones/{shipment.pk}/', {}, format='json').status_code] * 8)
        self.assertEqual(result.count(200), 1, result)
        self.assertEqual(result.count(400), 7, result)
        self.assertEqual(Movimiento.objects.filter(tipo='reversion').count(), 1)
        self.assertEqual(self.stock_values(), (10, 2))
        self.assert_consistent()

    def test_two_sales_can_swap_articles_without_deadlock(self):
        other = Articulos.objects.create(nombre='Otra montura', tipo_articulo='1')
        ConfiguracionArticulo.objects.create(articulo=other, controla=True, activado_en=self.config.activado_en)
        other_stock = Existencia.objects.create(articulo=other, bodega=principal(), cantidad=10)
        sale = Ventas.objects.create(pk=2, cliente_id=100, empresaCliente='Particular', precio=200000, tipo_venta=None)
        Saldos.objects.create(venta=sale, cliente_id=100, saldo=200000)
        ItemsVenta.objects.create(venta=sale, articulo=other, cantidad=2, precio_articulo=100000, totalArticulo=200000)
        reservar_venta(self.sale)
        reservar_venta(sale)
        first, second = self.sale_payload(1), self.sale_payload(2)
        import json
        rows = json.loads(first['venta'])
        rows[0]['articulo'] = other.pk
        first['venta'] = json.dumps(rows)

        def slow_lock(article_id, bodega_id=None):
            stock = stock_bloqueado(article_id, bodega_id)
            sleep(.05)
            return stock

        with patch('inventario.services.stock_bloqueado', side_effect=slow_lock):
            result = self.race([lambda client: client.put('/venta/', first, format='multipart').status_code,
                                lambda client: client.put('/venta/', second, format='multipart').status_code])
        self.assertEqual(result, [200, 200])
        self.assertEqual(self.stock_values(), (10, 2))
        other_stock.refresh_from_db()
        self.assertEqual((other_stock.cantidad, other_stock.reservado), (10, 2))

    def test_same_uuid_on_two_articles_is_a_validation_error_not_500(self):
        other = Articulos.objects.create(nombre='Otra montura', tipo_articulo='1')
        ConfiguracionArticulo.objects.create(articulo=other, controla=True, activado_en=self.config.activado_en)
        other_warehouse = Bodega.objects.create(nombre='Bodega UUID concurrente')
        Existencia.objects.create(articulo=other, bodega=other_warehouse)
        gate = Barrier(2)
        key = str(uuid4())

        def simultaneous_insert(*args, **kwargs):
            gate.wait(timeout=10)
            return registrar(*args, **kwargs)

        with patch('inventario.views.registrar', side_effect=simultaneous_insert):
            result = self.race([lambda client, pk=pk, warehouse=warehouse: client.post('/inventario/movimientos/',
                {'articulo_id': pk, 'bodega_id': warehouse, 'tipo': 'entrada', 'cantidad': 1, 'motivo': 'Clave en conflicto', 'clave': key},
                format='json').status_code for pk, warehouse in [(self.article.pk, 1), (other.pk, other_warehouse.pk)]])
        self.assertEqual(sorted(result), [201, 400])
        self.assertEqual(Movimiento.objects.count(), 1)

    def test_simultaneous_duplicate_sku_returns_validation_error(self):
        other = Articulos.objects.create(nombre='Otra montura', tipo_articulo='1')
        ConfiguracionArticulo.objects.create(articulo=other, controla=True, activado_en=self.config.activado_en)
        gate = Barrier(2)
        original = ConfigSerializer.save

        def simultaneous_save(serializer, **kwargs):
            gate.wait(timeout=10)
            return original(serializer, **kwargs)

        with patch('inventario.views.ConfigSerializer.save', new=simultaneous_save):
            result = self.race([lambda client, pk=pk: client.put(f'/inventario/articulos/{pk}/',
                {'controla': True, 'codigo': 'SKU-CONCURRENTE', 'minimo': 0}, format='json').status_code
                for pk in [self.article.pk, other.pk]])
        self.assertEqual(sorted(result), [200, 400])
        self.assertEqual(ConfiguracionArticulo.objects.filter(codigo='SKU-CONCURRENTE').count(), 1)

    def test_sale_cancellation_racing_with_delivery_is_consistent(self):
        reservar_venta(self.sale)
        result = self.race([
            lambda client: client.delete('/venta/', {'id': 1, 'detalleAnulacion': 'Concurrent cancel'}, format='json').status_code,
            lambda client: client.post('/remisiones/', {'venta': 1, 'fecha': '2026-10-11',
                'items': [{'itemVenta': self.item.pk, 'cantidad': 1}]}, format='json').status_code,
        ])
        self.assertEqual(result[0], 200)
        self.assertIn(result[1], [201, 400])
        self.assertFalse(Reserva.objects.exists())
        self.assertFalse(Remision.objects.filter(anulado=False).exists())
        self.assert_consistent()

    def test_edit_reducing_quantity_racing_with_delivery(self):
        reservar_venta(self.sale)
        result = self.race([
            lambda client: client.put('/venta/', self.sale_payload(1, 1), format='multipart').status_code,
            lambda client: client.post('/remisiones/', {'venta': 1, 'fecha': '2026-10-11',
                'items': [{'itemVenta': self.item.pk, 'cantidad': 2}]}, format='json').status_code,
        ])
        self.assertIn(result, [[200, 400], [400, 201]])
        self.item.refresh_from_db()
        delivered = RemisionItem.objects.aggregate(n=Sum('cantidad'))['n'] or 0
        self.assertLessEqual(delivered, self.item.cantidad)
        self.assert_consistent()

    def test_adjustment_racing_with_reservation_does_not_consume_reserved_stock(self):
        result = self.race([
            lambda client: client.post('/venta/', self.sale_payload(2, 8), format='multipart').status_code,
            lambda client: client.post('/inventario/movimientos/', {'articulo_id': self.article.pk, 'tipo': 'ajuste',
                'cantidad': 5, 'motivo': 'Concurrent count', 'clave': str(uuid4())}, format='json').status_code,
        ])
        self.assertIn(result, [[200, 400], [400, 201]])
        self.assert_consistent()

    def test_mass_batches_in_reverse_sale_order_do_not_deadlock(self):
        sale = Ventas.objects.create(pk=2, cliente_id=100, empresaCliente='Particular', precio=200000, tipo_venta=None)
        item = ItemsVenta.objects.create(venta=sale, articulo=self.article, cantidad=2, precio_articulo=100000, totalArticulo=200000)
        reservar_venta(self.sale)
        reservar_venta(sale)
        rows = [{'venta_id': sale_id, 'items': [{'itemVenta': item_id, 'cantidad': 1}]}
                for sale_id, item_id in [(1, self.item.pk), (2, item.pk)]]
        result = self.race([lambda client, ordered=ordered: client.post('/remisiones/masivo/',
            {'fecha': '2026-10-11', 'remisiones': ordered}, format='json').data for ordered in [rows, rows[::-1]]])
        self.assertEqual([response['procesadas'] for response in result], [2, 2])
        self.assertEqual(self.stock_values(), (6, 0))
        self.assert_consistent()

    def test_sales_in_two_warehouses_do_not_share_available_stock(self):
        other = Bodega.objects.create(nombre='Concurrent Norte')
        stock = Existencia.objects.create(articulo=self.article, bodega=other, cantidad=4)
        actions = []
        for index in range(8):
            payload = self.sale_payload(index + 2)
            payload['bodega'] = 1 if index < 4 else other.pk
            actions.append(lambda client, data=payload: client.post('/venta/', data, format='multipart').status_code)
        result = self.race(actions)
        self.assertEqual(result[:4].count(200), 4)
        self.assertEqual(result[4:].count(200), 2)
        self.assertEqual(result[4:].count(400), 2)
        self.stock.refresh_from_db()
        stock.refresh_from_db()
        self.assertEqual((self.stock.reservado, stock.reservado), (8, 4))
        self.assertEqual(Reserva.objects.filter(existencia=self.stock).aggregate(n=Sum('cantidad'))['n'], 8)
        self.assertEqual(Reserva.objects.filter(existencia=stock).aggregate(n=Sum('cantidad'))['n'], 4)

    def test_admin_deactivation_racing_with_sale_never_leaves_inactive_reservations(self):
        other = Bodega.objects.create(nombre='Concurrent Bodega')
        stock = Existencia.objects.create(articulo=self.article, bodega=other, cantidad=4)
        payload = self.sale_payload(2)
        payload['bodega'] = other.pk

        def deactivate(client):
            client.force_login(self.admin)
            return client.post(f'/admin/inventario/bodega/{other.pk}/change/', {'nombre': other.nombre, '_save': 'Guardar'}).status_code

        result = self.race([lambda client: client.post('/venta/', payload, format='multipart').status_code, deactivate])
        self.assertIn(result, [[200, 200], [400, 302]])
        other.refresh_from_db()
        stock.refresh_from_db()
        self.assertEqual(stock.reservado, 2 if other.activa else 0)
