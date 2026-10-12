import json
from datetime import date
from uuid import uuid4
from unittest import skipUnless

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from django.db import connection
from rest_framework.test import APIClient

from usuarios.models import Clientes, Empresa
from .models import Abonos, AbonoMasivo, Articulos, EstadoVenta, MediosDePago, Saldos, TipoVenta, Vendedor, Ventas, Remision
from .payments import payment_snapshot


class BalanceIntegrityTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = get_user_model().objects.create_superuser('balance-admin', password='test-only')
        cls.cliente = Clientes.objects.create(cedula=100, nombre='Cliente')
        cls.empresa = Empresa.objects.create(nombre='Empresa A')
        cls.medio = MediosDePago.objects.create(nombre='Efectivo')
        cls.seller = Vendedor.objects.create(nombre='Vendedor')
        TipoVenta.objects.create(pk=1, nombre='Personal')
        for pk, name in [(1, 'Sin pago'), (2, 'Con abono'), (3, 'Pagado'), (4, 'Anulado')]:
            EstadoVenta.objects.create(pk=pk, nombre=name)
        cls.article = Articulos.objects.create(nombre='Montura', precio=100000)
        for pk in (1, 2):
            sale = Ventas.objects.create(pk=pk, cliente_id=100, empresaCliente='Empresa A',
                precio=100000, cuotas=2, vendedor=cls.seller, estado_id=1, fecha=date(2026, 4, 6))
            Saldos.objects.create(venta=sale, cliente=cls.cliente, saldo=100000)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def payment(self, amount=40000, **extra):
        return self.client.post('/abono/', {'venta': 1, 'precio': amount,
            'medioDePago': self.medio.pk, **extra}, format='json')

    def sale_payload(self, pk=1, abonos=None):
        from .payments import payment_snapshot, sale_snapshot
        return {'id': pk, 'cliente_id': 100, 'empresaCliente': self.empresa.pk, 'vendedor': self.seller.pk,
            'precio': 100000, 'totalAbono': 999999, 'fecha': '2026-04-06', 'cuotas': 2,
            'condicion_pago': 'mensual', 'venta': json.dumps([{'articulo': self.article.pk, 'cantidad': 1,
                'precio_articulo': 100000, 'totalArticulo': 100000}]),
            'abonos': json.dumps(abonos or []), 'saldo': json.dumps({'saldo': 7}), 'abonos_reemplazar': 'true',
            'abonos_snapshots': json.dumps({str(row.pk): payment_snapshot(row) for row in Abonos.objects.filter(venta_id=pk)}),
            'venta_snapshot': sale_snapshot(Ventas.objects.get(pk=pk)) if Ventas.objects.filter(pk=pk).exists() else ''}

    def row(self, pk=1):
        response = self.client.get('/saldos/')
        self.assertEqual(response.status_code, 200, response.data)
        return next(row for row in response.data['rows'] if row['venta_id'] == pk)

    def test_sale_total_and_line_total_must_match_calculation(self):
        for total in (1, 99999, 0, -1):
            payload = self.sale_payload(3)
            payload['precio'] = total
            self.assertEqual(self.client.post('/venta/', payload, format='multipart').status_code, 400)
            self.assertFalse(Ventas.objects.filter(pk=3).exists())
        payload = self.sale_payload(3)
        items = json.loads(payload['venta'])
        items[0]['totalArticulo'] = 1
        payload['venta'] = json.dumps(items)
        self.assertEqual(self.client.post('/venta/', payload, format='multipart').status_code, 400)

    def test_invalid_items_and_discounts_do_not_create_sales(self):
        for extra in ({'cantidad': -1}, {'cantidad': 0}, {'precio_articulo': -1},
                      {'descuento': 100001}, {'tipo_descuento': 'otro'},
                      {'tipo_descuento': 'porcentaje', 'descuento': 101}):
            payload = self.sale_payload(3)
            items = json.loads(payload['venta'])
            items[0].update(extra)
            payload['venta'] = json.dumps(items)
            self.assertEqual(self.client.post('/venta/', payload, format='multipart').status_code, 400)
        payload = self.sale_payload(3)
        payload['venta'] = '[]'
        self.assertEqual(self.client.post('/venta/', payload, format='multipart').status_code, 400)

    def test_percentage_discounts_round_whole_pesos_consistently(self):
        payload = self.sale_payload(3)
        payload['precio'] = 91
        payload['venta'] = json.dumps([{'articulo': self.article.pk, 'cantidad': 1,
            'precio_articulo': 101, 'tipo_descuento': 'porcentaje', 'descuento': 10, 'totalArticulo': 91}])
        response = self.client.post('/venta/', payload, format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(self.row(3)['saldo'], 91)

    def test_edit_rejects_total_inconsistent_with_items(self):
        payload = self.sale_payload()
        payload['precio'] = 1
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)
        self.assertEqual(Ventas.objects.get(pk=1).precio, 100000)

    def paid_cash_sale(self, remitted=False):
        Ventas.objects.filter(pk=1).update(condicion_pago='contado', cuotas=1)
        self.assertEqual(self.payment(100000).status_code, 201)
        if remitted:
            Remision.objects.create(venta_id=1, cliente_id=100, fecha=date(2026, 4, 6))
        return Abonos.objects.get()

    def test_remitted_cash_sale_cannot_be_unlocked_by_payment_condition(self):
        self.paid_cash_sale(remitted=True)
        response = self.client.put('/venta/', self.sale_payload(), format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Ventas.objects.get(pk=1).condicion_pago, 'contado')

    def test_cash_sale_cannot_lose_its_full_payment(self):
        abono = self.paid_cash_sale()
        self.assertEqual(self.client.put('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono), 'precio': 90000}, format='json').status_code, 400)
        self.assertEqual(self.client.delete('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono)}, format='json').status_code, 400)
        self.assertEqual(Abonos.objects.get().precio, 100000)

    def test_remitted_cash_payment_allows_metadata_but_not_financial_changes(self):
        abono = self.paid_cash_sale(remitted=True)
        self.assertEqual(self.client.put('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono), 'fecha_abono': '2026-04-03',
            'descripcion': 'Fecha corregida'}, format='json').status_code, 200)
        other_method = MediosDePago.objects.create(nombre='Transferencia')
        abono.refresh_from_db()
        self.assertEqual(self.client.put('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono), 'medioDePago': other_method.pk}, format='json').status_code, 400)
        self.assertEqual(self.client.delete('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono)}, format='json').status_code, 400)

    def test_stale_sale_form_cannot_overwrite_updated_payment(self):
        self.payment()
        abono = Abonos.objects.get()
        payload = self.sale_payload(abonos=[{'id': abono.pk, 'precio': 40000, 'medioDePago': self.medio.pk}])
        self.assertEqual(self.client.put('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono), 'precio': 50000}, format='json').status_code, 200)
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)
        self.assertEqual(Abonos.objects.get().precio, 50000)

    def test_stale_deletion_and_missing_snapshot_are_rejected(self):
        self.payment()
        abono = Abonos.objects.get()
        payload = self.sale_payload()
        payload['abonos_eliminados'] = json.dumps([abono.pk])
        self.client.put('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono), 'descripcion': 'Actualizado'}, format='json')
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)
        payload = self.sale_payload(abonos=[{'id': abono.pk, 'precio': 50000, 'medioDePago': self.medio.pk}])
        payload.pop('abonos_snapshots')
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)
        self.assertEqual(Abonos.objects.get().precio, 40000)

    def test_remission_quota_uses_original_total_and_actual_payments(self):
        from .serializers import RemisionSerializer
        self.payment(40000)
        remision = Remision.objects.create(venta_id=1, cliente_id=100, fecha=date(2026, 4, 6))
        Ventas.objects.filter(pk=1).update(totalAbono=999999)
        data = RemisionSerializer(Remision.objects.get(pk=remision.pk)).data
        self.assertEqual(data['valorCuota'], 50000)
        self.assertEqual(data['cuotasPagadas'], 0.8)
        self.payment(60000)
        data = RemisionSerializer(Remision.objects.get(pk=remision.pk)).data
        self.assertEqual(data['valorCuota'], 50000)
        self.assertEqual(data['cuotasPagadas'], 2)

    def test_removed_due_date_does_not_reappear_in_cartera(self):
        from .payments import sync_payments
        sale = Ventas.objects.get(pk=1)
        sale.fecha_vencimiento = date(2026, 5, 6)
        sale.save()
        sync_payments(sale)
        payload = self.sale_payload()
        payload['fecha_vencimiento'] = ''
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 200)
        self.assertIsNone(Ventas.objects.get(pk=1).fecha_vencimiento)
        self.assertIsNone(Saldos.objects.get(venta_id=1).fecha_Vencimiento)
        self.assertIsNone(self.row()['fecha_vencimiento'])

    def test_stale_paid_total_cannot_bypass_minimum_advance(self):
        from .utils_estado_pedido import get_estado_pedido_by_slug
        Ventas.objects.filter(pk=1).update(totalAbono=80000, estado_pedido=get_estado_pedido_by_slug('creado'))
        response = self.client.post('/venta/1/estado-pedido/', {'estado': 'para_fabricacion'}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Ventas.objects.get(pk=1).estado_pedido, get_estado_pedido_by_slug('creado'))

    def test_payment_preserves_legacy_due_date_until_explicitly_cleared(self):
        Saldos.objects.filter(venta_id=1).update(fecha_Vencimiento=date(2026, 5, 6))
        self.assertEqual(self.payment().status_code, 201)
        self.assertEqual(self.row()['fecha_vencimiento'], date(2026, 5, 6))

    def test_edit_rejects_nonexistent_customer_without_payments(self):
        payload = self.sale_payload()
        payload['cliente_id'] = 999
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)
        self.assertEqual(Ventas.objects.get(pk=1).cliente_id, 100)
        self.assertEqual(Saldos.objects.get(venta_id=1).cliente_id, 100)

    def test_uncontrolled_items_cannot_be_reduced_below_delivered_quantity(self):
        from .models import ItemsVenta, RemisionItem
        Ventas.objects.filter(pk=1).update(precio=200000)
        item = ItemsVenta.objects.create(venta_id=1, articulo=self.article, cantidad=2,
                                        precio_articulo=100000, totalArticulo=200000)
        remision = Remision.objects.create(venta_id=1, cliente_id=100, fecha=date(2026, 4, 6))
        RemisionItem.objects.create(remision=remision, item_venta=item, cantidad=2)
        response = self.client.put('/venta/', self.sale_payload(), format='multipart')
        self.assertEqual(response.status_code, 400)
        item.refresh_from_db()
        self.assertEqual(item.cantidad, 2)
        self.assertEqual(Ventas.objects.get(pk=1).precio, 200000)
        remision.anulado = True
        remision.save()
        self.assertEqual(self.client.put('/venta/', self.sale_payload(), format='multipart').status_code, 200)

    def test_old_sale_snapshot_rejects_overwriting_new_sale_data(self):
        old = self.sale_payload()
        updated = self.sale_payload()
        updated['precio'] = 200000
        items = json.loads(updated['venta'])
        items[0].update(cantidad=2, totalArticulo=200000)
        updated['venta'] = json.dumps(items)
        self.assertEqual(self.client.put('/venta/', updated, format='multipart').status_code, 200)
        self.assertEqual(self.client.put('/venta/', old, format='multipart').status_code, 400)
        self.assertEqual(Ventas.objects.get(pk=1).precio, 200000)

    def test_missing_sale_snapshot_requires_reloading(self):
        payload = self.sale_payload()
        payload.pop('venta_snapshot')
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)

    def test_payment_added_while_sale_form_is_open_is_preserved(self):
        payload = self.sale_payload()
        self.payment(40000)
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 200)
        self.assertEqual(Ventas.objects.get(pk=1).totalAbono, 40000)

    def test_jornada_uses_actual_payment_total(self):
        from .models import Jornada
        jornada = Jornada.objects.create(empresa=self.empresa, fecha=date(2026, 4, 6))
        Ventas.objects.filter(pk=1).update(jornada=jornada)
        self.payment(40000)
        Ventas.objects.filter(pk=1).update(totalAbono=80000)
        response = self.client.get(f'/jornadas/{jornada.pk}/')
        row = next(row for row in response.data['ventas'] if row['id'] == 1)
        self.assertEqual(row['total_abono'], 40000)
        self.assertEqual(row['saldo'], 60000)

    def test_operational_admin_is_hidden_and_cannot_write_even_for_superuser(self):
        from django.contrib import admin
        from django.test import RequestFactory
        from .models import ItemsVenta, RemisionItem, PedidoVenta, HistoricoSaldos, HistoricoEstadoPedidoVenta, Jornada
        request = RequestFactory().get('/admin/')
        request.user = self.admin
        self.client.force_login(self.admin)
        for model in (Ventas, Abonos, ItemsVenta, Remision, RemisionItem, PedidoVenta,
                      Saldos, HistoricoSaldos, HistoricoEstadoPedidoVenta, Jornada):
            model_admin = admin.site._registry[model]
            self.assertFalse(model_admin.has_module_permission(request))
            self.assertFalse(model_admin.has_add_permission(request))
            self.assertFalse(model_admin.has_change_permission(request))
            self.assertFalse(model_admin.has_delete_permission(request))
            url = f'/admin/contabilidad/{model._meta.model_name}/add/'
            self.assertEqual(self.client.post(url, {}).status_code, 403)
        self.assertTrue(admin.site._registry[Vendedor].has_add_permission(request))
        self.assertTrue(admin.site._registry[Articulos].has_change_permission(request, self.article))
        self.assertEqual(self.client.post('/admin/contabilidad/ventas/1/change/', {'precio': 1}).status_code, 403)
        self.assertEqual(self.client.post('/admin/contabilidad/ventas/1/delete/', {'post': 'yes'}).status_code, 403)

    def test_individual_invalid_amounts_are_rejected_without_mutation(self):
        for amount in (-10000, 0, 150000, 1.25):
            self.assertEqual(self.payment(amount).status_code, 400)
        self.assertFalse(Abonos.objects.exists())
        self.assertEqual(Saldos.objects.get(venta_id=1).saldo, 100000)

    def test_payment_creates_missing_balance_and_uses_real_payment_date(self):
        Saldos.objects.filter(venta_id=1).delete()
        response = self.payment(fecha='2026-04-05')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Abonos.objects.get().fecha_abono, date(2026, 4, 5))
        self.assertEqual(Saldos.objects.get(venta_id=1).saldo, 60000)
        self.assertEqual(self.row()['saldo'], 60000)

    def test_factura_alias_accepts_payment(self):
        response = self.client.post('/abono/', {'factura': 1, 'precio': 10000, 'medioDePago': self.medio.pk}, format='json')
        self.assertEqual(response.status_code, 201, response.data)

    def test_cancelled_sale_and_wrong_client_cannot_receive_payment(self):
        self.assertEqual(self.payment(cliente_id=999).status_code, 400)
        Ventas.objects.filter(pk=1).update(anulado=True)
        self.assertEqual(self.payment().status_code, 400)

    def test_updating_payment_preserves_id_and_registration_date(self):
        self.payment()
        abono = Abonos.objects.get()
        original = abono.fecha
        response = self.client.put('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono), 'precio': 50000,
            'fecha': '2026-04-04', 'fecha_abono': '2026-04-04'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        abono.refresh_from_db()
        self.assertEqual(abono.fecha, original)
        self.assertEqual(abono.fecha_abono, date(2026, 4, 4))
        self.assertEqual(self.row()['saldo'], 50000)

    def test_transfer_and_overpayment_update_rejected(self):
        self.payment()
        abono = Abonos.objects.get()
        for extra in ({'venta': 2}, {'precio': 100001}):
            response = self.client.put('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono), **extra}, format='json')
            self.assertEqual(response.status_code, 400)
        self.assertEqual(self.row()['saldo'], 60000)

    def test_delete_recalculates_balance_and_payment_status(self):
        self.payment()
        abono = Abonos.objects.get()
        response = self.client.delete('/abono/', {'id': abono.pk, 'snapshot': payment_snapshot(abono)}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.row()['saldo'], 100000)
        self.assertEqual(Ventas.objects.get(pk=1).estado_id, 1)

    def test_report_ignores_stale_or_duplicate_balances_and_missing_balance(self):
        Abonos.objects.create(venta_id=1, cliente_id=100, precio=40000, medioDePago=self.medio)
        Saldos.objects.create(venta_id=1, cliente=self.cliente, saldo=5)
        Saldos.objects.filter(venta_id=2).delete()
        response = self.client.get('/saldos/')
        self.assertEqual(len(response.data['rows']), 2)
        self.assertEqual(self.row()['saldo'], 60000)
        self.assertEqual(self.row()['totalAbono'], 40000)
        self.assertEqual(self.row(2)['saldo'], 100000)

    def test_paid_and_cancelled_sales_are_excluded(self):
        Abonos.objects.create(venta_id=1, cliente_id=100, precio=100000, medioDePago=self.medio)
        Ventas.objects.filter(pk=2).update(anulado=True)
        self.assertEqual(self.client.get('/saldos/').data['rows'], [])

    def test_due_date_uses_sale_then_legacy_and_null_is_supported(self):
        self.assertIsNone(self.row()['fecha_vencimiento'])
        Saldos.objects.filter(venta_id=1).update(fecha_Vencimiento=date(2026, 5, 6))
        self.assertEqual(self.row()['fecha_vencimiento'], date(2026, 5, 6))
        Ventas.objects.filter(pk=1).update(fecha_vencimiento=date(2026, 6, 6))
        self.assertEqual(self.row()['fecha_vencimiento'], date(2026, 6, 6))

    def test_saldos_only_permission_does_not_expose_reports(self):
        user = get_user_model().objects.create_user('balance-reader')
        user.user_permissions.add(Permission.objects.get(content_type__app_label='usuarios', codename='view_saldos'))
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get('/saldos/').status_code, 200)
        detail = self.client.get('/saldos/1/')
        self.assertEqual(detail.status_code, 200)
        self.assertNotIn('movimientos_ingresos', detail.data)
        self.assertEqual(self.client.get('/reportes/data/').status_code, 403)
        self.assertEqual(self.client.post('/abono/', {}, format='json').status_code, 403)

    def test_sale_create_ignores_client_totals_and_rejects_combined_overpayment(self):
        rows = [{'precio': 40000, 'medioDePago': self.medio.pk, 'fecha_abono': '2026-04-05'}]
        response = self.client.post('/venta/', self.sale_payload(3, rows), format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Ventas.objects.get(pk=3).totalAbono, 40000)
        self.assertEqual(Saldos.objects.get(venta_id=3).saldo, 60000)
        rows *= 3
        response = self.client.post('/venta/', self.sale_payload(4, rows), format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Ventas.objects.filter(pk=4).exists())

    def test_sale_edit_updates_abono_in_place_and_ignores_supplied_saldo(self):
        self.payment()
        abono = Abonos.objects.get()
        original = abono.fecha
        rows = [{'id': abono.pk, 'precio': 50000, 'medioDePago': self.medio.pk,
                 'fecha_abono': '2026-04-03'}]
        response = self.client.put('/venta/', self.sale_payload(abonos=rows), format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        abono.refresh_from_db()
        self.assertEqual(abono.precio, 50000)
        self.assertEqual(abono.fecha, original)
        self.assertEqual(Abonos.objects.count(), 1)
        self.assertEqual(self.row()['saldo'], 50000)

    def test_sale_edit_invalid_payments_rolls_back_everything(self):
        self.payment()
        abono = Abonos.objects.get()
        rows = [{'id': abono.pk, 'precio': 50000, 'medioDePago': self.medio.pk},
                {'precio': -100, 'medioDePago': self.medio.pk}]
        response = self.client.put('/venta/', self.sale_payload(abonos=rows), format='multipart')
        self.assertEqual(response.status_code, 400)
        abono.refresh_from_db()
        self.assertEqual(abono.precio, 40000)

    def test_mass_payment_identity_survives_sale_edit_and_cannot_be_removed(self):
        lote = AbonoMasivo.objects.create(tipo='empresa', empresa=self.empresa, clave_operacion=uuid4())
        abono = Abonos.objects.create(venta_id=1, cliente_id=100, precio=40000, medioDePago=self.medio, abono_masivo=lote)
        rows = [{'id': abono.pk, 'precio': 40000, 'medioDePago': self.medio.pk}]
        response = self.client.put('/venta/', self.sale_payload(abonos=rows), format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        abono.refresh_from_db()
        self.assertEqual(abono.abono_masivo_id, lote.pk)
        payload = self.sale_payload()
        payload['abonos_eliminados'] = json.dumps([abono.pk])
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)
        self.assertEqual(self.client.delete('/abono/', {'id': abono.pk}, format='json').status_code, 400)

    def test_legacy_edit_cannot_recreate_payments_without_identifiers(self):
        self.payment()
        payload = self.sale_payload(abonos=[{'precio': 40000, 'medioDePago': self.medio.pk}])
        payload.pop('abonos_reemplazar')
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)
        self.assertEqual(Abonos.objects.count(), 1)

    def test_explicit_deletions_preserve_payments_added_after_opening_the_form(self):
        self.payment(20000)
        first = Abonos.objects.get()
        self.payment(10000)
        newer = Abonos.objects.exclude(pk=first.pk).get()
        payload = self.sale_payload()
        payload['abonos_eliminados'] = json.dumps([first.pk])
        response = self.client.put('/venta/', payload, format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(Abonos.objects.filter(pk=first.pk).exists())
        self.assertTrue(Abonos.objects.filter(pk=newer.pk).exists())
        self.assertEqual(self.row()['saldo'], 90000)

    def test_invalid_json_is_validation_error_not_server_error(self):
        payload = self.sale_payload()
        payload['abonos'] = 'invalid'
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)
        payload['abonos'] = '[null]'
        payload['id'] = 3
        self.assertEqual(self.client.post('/venta/', payload, format='multipart').status_code, 400)

    def test_admin_disallows_payment_operations_even_for_superuser(self):
        self.client.force_login(self.admin)
        payload = {'venta': 1, 'cliente_id': 100, 'precio': 150000,
                   'medioDePago': self.medio.pk, 'fecha_abono': '2026-04-05', 'descripcion': ''}
        response = self.client.post('/admin/contabilidad/abonos/add/', payload)
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Abonos.objects.exists())
        payload['precio'] = 40000
        response = self.client.post('/admin/contabilidad/abonos/add/', payload)
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Abonos.objects.exists())
        self.assertEqual(Saldos.objects.get(venta_id=1).saldo, 100000)

    def test_saldos_only_reader_cannot_view_another_module(self):
        user = get_user_model().objects.create_user('sale-reader')
        user.user_permissions.add(Permission.objects.get(content_type__app_label='usuarios', codename='view_ventas'))
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get('/saldos/').status_code, 403)

    def test_seller_can_preserve_existing_payment_without_edit_permission(self):
        self.payment()
        abono = Abonos.objects.get()
        user = get_user_model().objects.create_user('seller-preserve')
        user.user_permissions.add(*Permission.objects.filter(content_type__app_label='usuarios', codename__in=['view_ventas', 'change_ventas']))
        self.client.force_authenticate(user)
        rows = [{'id': abono.pk, 'precio': 40000, 'medioDePago': self.medio.pk, 'descripcion': ''}]
        response = self.client.put('/venta/', self.sale_payload(abonos=rows), format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        rows[0]['precio'] = 50000
        self.assertEqual(self.client.put('/venta/', self.sale_payload(abonos=rows), format='multipart').status_code, 400)

    def test_remission_totals_use_actual_payments(self):
        from .serializers import RemisionSerializer
        Abonos.objects.create(venta_id=1, cliente_id=100, precio=40000, medioDePago=self.medio)
        remision = Remision.objects.create(venta_id=1, cliente_id=100, fecha=date(2026, 4, 6))
        data = RemisionSerializer(remision).data
        self.assertEqual(data['totalAbonado'], 40000)
        self.assertEqual(data['saldoVenta'], 60000)

    @skipUnless(connection.vendor == 'mysql', 'Sale list SQL uses MySQL syntax.')
    def test_sale_detail_provides_snapshot_for_the_returned_payment(self):
        from .models import ItemsVenta
        from .payments import payment_snapshot, sale_snapshot
        ItemsVenta.objects.create(venta_id=1, articulo=self.article, cantidad=1,
                                 precio_articulo=100000, totalArticulo=100000)
        self.payment()
        response = self.client.get('/venta/1')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['abonos'][0]['snapshot'], payment_snapshot(Abonos.objects.get()))
        self.assertEqual(response.data['snapshot'], sale_snapshot(Ventas.objects.get(pk=1)))

    @skipUnless(connection.vendor == 'mysql', 'Sale list SQL uses MySQL syntax.')
    def test_sale_list_ignores_duplicate_balances_and_stale_payment_totals(self):
        Abonos.objects.create(venta_id=1, cliente_id=100, precio=40000, medioDePago=self.medio)
        Saldos.objects.create(venta_id=1, cliente=self.cliente, saldo=5)
        response = self.client.get('/venta/')
        self.assertEqual(response.status_code, 200)
        rows = [row for row in response.data if row['id'] == 1]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['totalAbono'], 40000)
        self.assertEqual(rows[0]['saldo'], 60000)
