import json
import random
from datetime import date, datetime, timezone as datetime_timezone
from unittest.mock import patch
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from contabilidad.models import Articulos, ItemsVenta, Remision, RemisionItem, Ventas
from usuarios.models import PerfilAcceso
from .models import ConfiguracionArticulo, Existencia, Movimiento, Reserva
from .services import fecha_actual, reservar_venta
from . import tests as fixtures


class InventoryStressTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        fixtures.InventoryTests.setUpTestData.__func__(cls)

    movement = fixtures.InventoryTests.movement
    shipment = fixtures.InventoryTests.shipment
    stock_values = fixtures.InventoryTests.stock_values
    sale_payload = fixtures.InventoryTests.sale_payload

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        for target in ['contabilidad.views.console.log', 'contabilidad.serializers.console.log']:
            mock = patch(target)
            mock.start()
            self.addCleanup(mock.stop)

    def assert_consistent(self, initial=10, require_all_sales=False):
        self.stock.refresh_from_db()
        net = Movimiento.objects.filter(existencia=self.stock).aggregate(n=Sum('cantidad'))['n'] or 0
        reserved = Reserva.objects.filter(existencia=self.stock).aggregate(n=Sum('cantidad'))['n'] or 0
        self.assertEqual(self.stock.cantidad, initial + net)
        self.assertEqual(self.stock.reservado, reserved)
        self.assertGreaterEqual(self.stock.cantidad, reserved)
        self.assertGreaterEqual(reserved, 0)
        running = initial
        for movement in Movimiento.objects.filter(existencia=self.stock).order_by('id'):
            running += movement.cantidad
            self.assertEqual(movement.saldo_resultante, running)
        for reservation in Reserva.objects.filter(existencia=self.stock).select_related('item__venta'):
            delivered = RemisionItem.objects.filter(item_venta=reservation.item, remision__anulado=False).aggregate(n=Sum('cantidad'))['n'] or 0
            self.assertFalse(reservation.item.venta.anulado)
            self.assertEqual(reservation.cantidad, reservation.item.cantidad - delivered)
        if require_all_sales:
            items = ItemsVenta.objects.filter(articulo=self.article, venta__anulado=False,
                                             venta__fechaCreacion__gte=self.config.activado_en)
            ordered = items.aggregate(n=Sum('cantidad'))['n'] or 0
            delivered = RemisionItem.objects.filter(item_venta__in=items, remision__anulado=False).aggregate(n=Sum('cantidad'))['n'] or 0
            self.assertEqual(reserved, ordered - delivered)

    def test_multiline_reservation_failure_rolls_back_first_line(self):
        payload = self.sale_payload(2)
        rows = json.loads(payload['venta'])
        rows.append({**rows[0], 'cantidad': 11})
        payload['venta'] = json.dumps(rows)
        response = self.client.post('/venta/', payload, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Ventas.objects.filter(pk=2).exists())
        self.assertFalse(Reserva.objects.exists())
        self.assert_consistent()

    def test_failed_receipt_restores_stock_and_ledger(self):
        self.client.raise_request_exception = False
        with patch('inventario.services.Movimiento.objects.create', side_effect=RuntimeError('Injected ledger failure')):
            self.assertEqual(self.movement().status_code, 500)
        self.assertFalse(Movimiento.objects.exists())
        self.assert_consistent()

    def test_failed_delivery_restores_document_stock_and_reservation(self):
        reservar_venta(self.sale)
        self.client.raise_request_exception = False
        with patch('inventario.services.Movimiento.objects.create', side_effect=RuntimeError('Injected ledger failure')):
            response = self.client.post('/remisiones/', {'venta': 1, 'fecha': '2026-10-11',
                'items': [{'itemVenta': self.item.pk, 'cantidad': 1}]}, format='json')
        self.assertEqual(response.status_code, 500)
        self.assertFalse(Remision.objects.exists())
        self.assertEqual(self.stock_values(), (10, 2))
        self.assert_consistent()

    def test_failed_reversal_preserves_active_shipment(self):
        reservar_venta(self.sale)
        shipment = self.shipment()
        self.client.raise_request_exception = False
        with patch('inventario.services.Movimiento.objects.create', side_effect=RuntimeError('Injected ledger failure')):
            response = self.client.delete(f'/remisiones/{shipment.pk}/', {}, format='json')
        self.assertEqual(response.status_code, 500)
        shipment.refresh_from_db()
        self.assertFalse(shipment.anulado)
        self.assertEqual(self.stock_values(), (9, 1))
        self.assert_consistent()

    def test_partial_return_cancel_and_redelivery(self):
        reservar_venta(self.sale)
        shipment = self.shipment(2)
        origin = Movimiento.objects.get(tipo='salida')
        self.assertEqual(self.movement(tipo='devolucion', origen_id=origin.pk, cantidad=1).status_code, 201)
        self.assertEqual(self.client.delete(f'/remisiones/{shipment.pk}/', {}, format='json').status_code, 200)
        self.assertEqual(self.stock_values(), (10, 2))
        self.shipment(2)
        self.assertEqual(self.stock_values(), (8, 0))
        self.assert_consistent()

    def test_cancelled_sale_can_physically_return_goods_without_reserving(self):
        reservar_venta(self.sale)
        self.shipment(2)
        origin = Movimiento.objects.get(tipo='salida')
        self.client.delete('/venta/', {'id': 1, 'detalleAnulacion': 'Cancelada'}, format='json')
        self.assertEqual(self.movement(tipo='devolucion', origen_id=origin.pk, cantidad=2).status_code, 201)
        self.assertEqual(self.stock_values(), (10, 0))
        self.assert_consistent()

    def test_reversal_cannot_duplicate_a_return_already_resold(self):
        Existencia.objects.filter(pk=self.stock.pk).update(cantidad=2)
        reservar_venta(self.sale)
        shipment = self.shipment(2)
        origin = Movimiento.objects.get(tipo='salida')
        self.movement(tipo='devolucion', origen_id=origin.pk, cantidad=1)
        self.assertEqual(self.client.post('/venta/', self.sale_payload(2, 1), format='multipart').status_code, 200)
        response = self.client.delete(f'/remisiones/{shipment.pk}/', {}, format='json')
        self.assertEqual(response.status_code, 400)
        shipment.refresh_from_db()
        self.assertFalse(shipment.anulado)
        self.assertEqual(self.stock_values(), (1, 1))
        self.assert_consistent(initial=2)

    def test_return_from_another_article_is_rejected(self):
        reservar_venta(self.sale)
        self.shipment()
        origin = Movimiento.objects.get(tipo='salida')
        other = Articulos.objects.create(nombre='Otro articulo', tipo_articulo='1')
        ConfiguracionArticulo.objects.create(articulo=other, controla=True)
        response = self.movement(articulo_id=other.pk, tipo='devolucion', origen_id=origin.pk, cantidad=1)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.stock_values(), (9, 1))

    def test_zero_negative_fractional_and_oversized_inputs(self):
        for value in [0, -1, 1.5, True, None, 'abc', 2147483648]:
            with self.subTest(value=value):
                self.assertEqual(self.movement(cantidad=value).status_code, 400)
                self.assert_consistent()

    def test_blank_motive_invalid_date_and_invalid_uuid(self):
        for data in [{'motivo': ''}, {'motivo': '   '}, {'fecha': '2026-02-30'}, {'clave': 'not-a-uuid'}, {'tipo': 'salida'}]:
            with self.subTest(data=data):
                self.assertEqual(self.movement(**data).status_code, 400)
                self.assert_consistent()

    def test_adjustment_to_zero_and_equal_count(self):
        self.assertEqual(self.movement(tipo='ajuste', cantidad=0).status_code, 201)
        self.assertEqual(self.movement(tipo='ajuste', cantidad=0).status_code, 400)
        self.assertEqual(self.stock_values(), (0, 0))
        self.assert_consistent()

    def test_stock_integer_overflow_is_validation_error(self):
        Existencia.objects.filter(pk=self.stock.pk).update(cantidad=2147483647)
        response = self.movement(cantidad=1)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.stock_values(), (2147483647, 0))
        self.assertFalse(Movimiento.objects.exists())

    def test_activation_timestamp_is_not_changed_by_configuration_edits(self):
        original = self.config.activado_en
        response = self.client.put(f'/inventario/articulos/{self.article.pk}/',
            {'controla': True, 'codigo': 'SKU-TEST', 'minimo': 4}, format='json')
        self.assertEqual(response.status_code, 200)
        self.config.refresh_from_db()
        self.assertEqual(self.config.activado_en, original)

    def test_permission_requires_view_and_denial_takes_precedence(self):
        user = get_user_model().objects.create_user('restricted-inventory')
        add = Permission.objects.get(codename='add_inventario')
        view = Permission.objects.get(codename='view_inventario')
        user.user_permissions.add(add)
        self.client.force_authenticate(user)
        self.assertEqual(self.movement().status_code, 403)
        user.user_permissions.add(view)
        user = get_user_model().objects.get(pk=user.pk)
        self.client.force_authenticate(user)
        self.assertEqual(self.movement().status_code, 201)
        profile = PerfilAcceso.objects.create(usuario=user)
        profile.permisos_denegados.add(add)
        user = get_user_model().objects.get(pk=user.pk)
        self.client.force_authenticate(user)
        self.assertEqual(self.movement().status_code, 403)

    def test_ledger_pagination_has_no_missing_or_duplicate_rows(self):
        for _ in range(65):
            self.assertEqual(self.movement(cantidad=1).status_code, 201)
        ids = []
        for page in range(1, 5):
            data = self.client.get(f'/inventario/movimientos/?page={page}&articulo_id={self.article.pk}').data
            self.assertEqual(data['count'], 65)
            ids.extend(row['id'] for row in data['results'])
        self.assertEqual(len(ids), 65)
        self.assertEqual(len(set(ids)), 65)
        self.assertEqual(ids, sorted(ids, reverse=True))
        self.assertEqual(self.client.get('/inventario/movimientos/?page=5').status_code, 404)
        self.assert_consistent()

    def test_stock_constraint_rejects_reserved_above_physical(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Existencia.objects.filter(pk=self.stock.pk).update(reservado=11)
        self.assertEqual(self.stock_values(), (10, 0))

    def test_mass_partial_failure_does_not_undo_successful_sale(self):
        self.assertEqual(self.client.post('/venta/', self.sale_payload(2), format='multipart').status_code, 200)
        response = self.client.post('/remisiones/masivo/', {'venta_ids': [1, 2], 'fecha': '2026-10-11'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['procesadas'], 1)
        self.assertEqual(len(response.data['errores']), 1)
        self.assertEqual(list(Remision.objects.values_list('venta_id', flat=True)), [2])
        self.assertEqual(self.stock_values(), (8, 0))
        self.assert_consistent()

    def test_edit_after_partial_delivery_and_rejection_below_delivered(self):
        reservar_venta(self.sale)
        self.shipment()
        self.assertEqual(self.client.put('/venta/', self.sale_payload(1, 3), format='multipart').status_code, 200)
        self.assertEqual(self.stock_values(), (9, 2))
        self.assertEqual(self.client.put('/venta/', self.sale_payload(1, 0), format='multipart').status_code, 400)
        self.assertEqual(self.stock_values(), (9, 2))
        self.assert_consistent()

    @override_settings(USE_TZ=True, TIME_ZONE='America/Bogota')
    def test_current_date_uses_local_day_with_timezone_enabled(self):
        with patch('inventario.services.timezone.now', return_value=datetime(2026, 10, 12, 2, tzinfo=datetime_timezone.utc)):
            self.assertEqual(fecha_actual(), date(2026, 10, 11))

    @override_settings(USE_TZ=False)
    def test_current_date_with_naive_datetimes(self):
        with patch('inventario.services.timezone.now', return_value=datetime(2026, 10, 11, 23)):
            self.assertEqual(fecha_actual(), date(2026, 10, 11))

    def test_seeded_operation_sequences_preserve_invariants(self):
        reservar_venta(self.sale)
        for seed in [17, 83, 2026]:
            rng = random.Random(seed)
            for step in range(100):
                with self.subTest(seed=seed, step=step):
                    operation = rng.choice(['entry', 'sale', 'shipment', 'return', 'cancel', 'reverse', 'edit', 'adjust'])
                    if operation == 'entry':
                        response = self.movement(cantidad=rng.randint(1, 5))
                        self.assertEqual(response.status_code, 201)
                    elif operation == 'sale':
                        pk = 1000 + seed * 100 + step
                        response = self.client.post('/venta/', self.sale_payload(pk, rng.randint(1, 5)), format='multipart')
                        self.assertIn(response.status_code, [200, 400])
                    elif operation == 'shipment':
                        reservation = Reserva.objects.filter(cantidad__gt=0).order_by('pk').first()
                        if reservation:
                            response = self.client.post('/remisiones/', {'venta': reservation.item.venta_id,
                                'fecha': '2026-10-11', 'items': [{'itemVenta': reservation.item_id, 'cantidad': 1}]}, format='json')
                            self.assertEqual(response.status_code, 201)
                    elif operation == 'return':
                        origins = list(Movimiento.objects.filter(tipo='salida'))
                        origin = rng.choice(origins) if origins else None
                        if origin:
                            self.assertIn(self.movement(tipo='devolucion', origen_id=origin.pk, cantidad=1).status_code, [201, 400])
                    elif operation == 'reverse':
                        documents = list(Remision.objects.filter(anulado=False))
                        if documents:
                            document = rng.choice(documents)
                            self.assertIn(self.client.delete(f'/remisiones/{document.pk}/', {}, format='json').status_code, [200, 400])
                    elif operation == 'adjust':
                        self.stock.refresh_from_db()
                        self.assertIn(self.movement(tipo='ajuste', cantidad=rng.randint(0, self.stock.cantidad + 5)).status_code, [201, 400])
                    elif operation == 'edit':
                        sales = list(Ventas.objects.filter(anulado=False))
                        if sales:
                            sale = rng.choice(sales)
                            self.assertIn(self.client.put('/venta/', self.sale_payload(sale.pk, rng.randint(1, 7)), format='multipart').status_code, [200, 400])
                    else:
                        sale = Ventas.objects.filter(anulado=False).exclude(pk=1).order_by('pk').first()
                        if sale:
                            self.assertEqual(self.client.delete('/venta/', {'id': sale.pk, 'detalleAnulacion': 'Prueba secuencial'}, format='json').status_code, 200)
                    self.assert_consistent(require_all_sales=True)
