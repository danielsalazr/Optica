from datetime import date, datetime, timezone as datetime_timezone
from unittest.mock import patch
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from usuarios.models import Clientes, Empresa
from .models import AbonoMasivo, Abonos, Articulos, ItemsVenta, EstadoVenta, Jornada, MediosDePago, Saldos, Ventas
from .abonos_masivos import fecha_pago_actual


class AbonosMasivosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = get_user_model().objects.create_superuser('mass-audit', password='test-only')
        cls.empresa = Empresa.objects.create(nombre='Empresa A')
        cls.otra_empresa = Empresa.objects.create(nombre='Empresa B')
        cls.cliente = Clientes.objects.create(cedula=100, nombre='Cliente ejemplo')
        cls.medio = MediosDePago.objects.create(nombre='Efectivo')
        cls.jornada = Jornada.objects.create(empresa=cls.empresa, fecha=date(2026, 4, 1), estado='closed')
        for pk, nombre in [(1, 'Pendiente'), (2, 'Parcial'), (3, 'Pagado')]:
            EstadoVenta.objects.create(pk=pk, nombre=nombre)
        for pk in (1, 2, 3):
            Ventas.objects.create(pk=pk, cliente_id=100, empresaCliente='Empresa A', precio=100000,
                                  cuotas=3, estado_id=1, tipo_venta=None, jornada=cls.jornada)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.payload = {'tipo': 'empresa', 'empresa_id': self.empresa.pk,
                        'medioDePago': self.medio.pk, 'fecha': '2026-04-07',
                        'clave_operacion': str(uuid4()), 'monto_total': 10000,
                        'items': [{'venta_id': 1, 'monto': 10000, 'saldo_esperado': 100000}]}

    def apply(self):
        return self.client.post('/abonos/masivo/aplicar/', self.payload, format='json')

    def assert_rejected(self):
        self.assertEqual(self.apply().status_code, 400)
        self.assertFalse(Abonos.objects.exists())
        self.assertFalse(AbonoMasivo.objects.exists())

    def test_success_and_actual_date(self):
        response = self.apply()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['total'], 10000)
        self.assertEqual(Abonos.objects.get().fecha_abono, date(2026, 4, 7))
        self.assertEqual(Saldos.objects.get().saldo, 90000)
        self.assertEqual(Ventas.objects.get(pk=1).totalAbono, 10000)

    def test_preview_without_amount_includes_details_without_multiplying_balance(self):
        articulo = Articulos.objects.create(nombre='Montura', precio=50000)
        for _ in range(2):
            ItemsVenta.objects.create(venta_id=1, articulo=articulo, cantidad=1,
                                      precio_articulo=50000, totalArticulo=50000)
        Abonos.objects.create(venta_id=1, cliente_id=100, precio=10000,
                              medioDePago=self.medio, fecha_abono=date(2026, 4, 6))
        Ventas.objects.filter(pk=1).update(fecha_inicio=None, fecha_vencimiento=None)
        response = self.client.get('/abonos/masivo/preview/', {
            'tipo': 'empresa', 'empresa_id': self.empresa.pk,
        })
        self.assertEqual(response.status_code, 200)
        row = next(row for row in response.data if row['id'] == 1)
        self.assertEqual(row['saldo'], 90000)
        self.assertEqual(row['total_abonos'], 10000)
        self.assertEqual(len(row['articulos']), 2)
        self.assertEqual(row['abonos'][0]['fecha_abono'], date(2026, 4, 6))
        self.assertIsNone(row['fecha_inicio'])
        self.assertEqual(AbonoMasivo.objects.count(), 0)

    def test_cliente_without_apellido(self):
        self.payload.update(tipo='cliente', cliente_id=100)
        self.assertEqual(self.apply().status_code, 201)
        self.assertEqual(AbonoMasivo.objects.get().nombre_objetivo, 'Cliente ejemplo')

    def test_closed_jornada_can_receive_payment(self):
        self.payload.update(tipo='jornada', jornada_id=self.jornada.pk)
        self.assertEqual(self.apply().status_code, 201)
        data = self.client.get('/abonos/masivo/catalogos/').data
        self.assertIn(self.jornada.pk, [row['id'] for row in data['jornadas']])

    def test_overpayment_rejected(self):
        self.payload['items'][0]['monto'] = 150000
        self.payload['monto_total'] = 150000
        self.assert_rejected()

    def test_wrong_target_rejected(self):
        self.payload['empresa_id'] = self.otra_empresa.pk
        self.assert_rejected()

    def test_cancelled_sale_rejected(self):
        Ventas.objects.filter(pk=1).update(anulado=True)
        self.assert_rejected()

    def test_invalid_date_rejected(self):
        self.payload['fecha'] = '2026-02-30'
        self.assert_rejected()

    def test_null_date_uses_current_date(self):
        self.payload['fecha'] = None
        self.assertEqual(self.apply().status_code, 201)
        self.assertEqual(Abonos.objects.get().fecha_abono, fecha_pago_actual())

    @override_settings(USE_TZ=True, TIME_ZONE='America/Bogota')
    def test_default_date_uses_local_day_with_timezone_enabled(self):
        with patch('contabilidad.abonos_masivos.timezone.now', return_value=datetime(
                2026, 4, 8, 1, 0, tzinfo=datetime_timezone.utc)):
            self.assertEqual(fecha_pago_actual(), date(2026, 4, 7))

    @override_settings(USE_TZ=False, TIME_ZONE='America/Bogota')
    def test_default_date_supports_timezone_disabled(self):
        with patch('contabilidad.abonos_masivos.timezone.now', return_value=datetime(2026, 4, 7, 20, 0)):
            self.assertEqual(fecha_pago_actual(), date(2026, 4, 7))

    def test_invalid_payment_method_rejected(self):
        self.payload['medioDePago'] = 999
        self.assert_rejected()

    def test_missing_sale_rolls_back_whole_batch(self):
        self.payload['items'].append({'venta_id': 999, 'monto': 10000, 'saldo_esperado': 100000})
        self.payload['monto_total'] = 20000
        self.assert_rejected()

    def test_duplicate_sale_rejected(self):
        self.payload['items'] *= 2
        self.payload['monto_total'] = 20000
        self.assert_rejected()

    def test_fractional_pesos_rejected(self):
        self.payload['items'][0]['monto'] = 33333.333
        self.assert_rejected()

    def test_exact_integer_distribution(self):
        self.payload['items'] = [{'venta_id': pk, 'monto': value, 'saldo_esperado': 100000}
                                 for pk, value in [(1, 33334), (2, 33333), (3, 33333)]]
        self.payload['monto_total'] = 100000
        self.assertEqual(self.apply().status_code, 201)
        self.assertEqual(sum(Abonos.objects.values_list('precio', flat=True)), 100000)

    def test_retry_is_idempotent(self):
        self.assertEqual(self.apply().status_code, 201)
        response = self.apply()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['reintento'])
        self.assertEqual(Abonos.objects.count(), 1)
        self.assertEqual(AbonoMasivo.objects.count(), 1)

    def test_reused_key_with_changed_payload_rejected(self):
        self.assertEqual(self.apply().status_code, 201)
        self.payload['descripcion'] = 'Otro pago'
        self.assertEqual(self.apply().status_code, 400)
        self.assertEqual(Abonos.objects.count(), 1)

    def test_stale_preview_rejected(self):
        self.assertEqual(self.apply().status_code, 201)
        self.payload['clave_operacion'] = str(uuid4())
        self.assertEqual(self.apply().status_code, 400)
        self.assertEqual(Abonos.objects.count(), 1)

    def test_changed_sale_price_rejected(self):
        Ventas.objects.filter(pk=1).update(precio=90000)
        self.assert_rejected()

    def test_malformed_item_rejected(self):
        self.payload['items'] = [None]
        self.assert_rejected()

    def test_declared_total_must_match_distribution(self):
        self.payload['monto_total'] = 20000
        self.assert_rejected()

    def test_abonos_only_user_can_load_catalogs(self):
        user = get_user_model().objects.create_user('only-payments', password='test-only')
        user.user_permissions.add(*Permission.objects.filter(
            content_type__app_label='usuarios', codename__in=['view_abonos', 'add_abonos']))
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get('/abonos/masivo/catalogos/').status_code, 200)
        self.assertEqual(self.apply().status_code, 201)
