from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import uuid4
from unittest.mock import patch

from django.db import close_old_connections, connections
from django.test import TransactionTestCase, skipUnlessDBFeature
from rest_framework.test import APIClient

from . import test_saldos as fixtures
from .models import Abonos, Saldos, Ventas
from .payments import payment_total


@skipUnlessDBFeature('has_select_for_update')
class PaymentConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        fixtures.BalanceIntegrityTests.setUpTestData.__func__(type(self))
        for target in ('contabilidad.views.console.log', 'contabilidad.serializers.console.log'):
            mock = patch(target)
            mock.start()
            self.addCleanup(mock.stop)

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
        sale = Ventas.objects.get(pk=1)
        total = payment_total(sale)
        self.assertLessEqual(total, sale.precio)
        self.assertEqual(sale.totalAbono, total)
        self.assertEqual(Saldos.objects.get(venta=sale).saldo, sale.precio - total)

    def test_eight_individual_payments_cannot_overpay(self):
        result = self.race([lambda client: client.post('/abono/', {'venta': 1, 'precio': 30000,
            'medioDePago': self.medio.pk}, format='json').status_code] * 8)
        self.assertEqual(result.count(201), 3, result)
        self.assertEqual(result.count(400), 5, result)
        self.assert_consistent()

    def test_mass_and_individual_payment_share_sale_lock(self):
        payload = {'tipo': 'empresa', 'empresa_id': self.empresa.pk, 'medioDePago': self.medio.pk,
            'clave_operacion': str(uuid4()), 'monto_total': 70000,
            'items': [{'venta_id': 1, 'monto': 70000, 'saldo_esperado': 100000}]}
        result = self.race([
            lambda client: client.post('/abono/', {'venta': 1, 'precio': 70000, 'medioDePago': self.medio.pk}, format='json').status_code,
            lambda client: client.post('/abonos/masivo/aplicar/', payload, format='json').status_code,
        ])
        self.assertEqual(sorted(result), [201, 400])
        self.assertEqual(Abonos.objects.count(), 1)
        self.assert_consistent()
