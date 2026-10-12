import json
from datetime import date
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest.mock import patch

from django.db import transaction, connections, close_old_connections
from django.test import TestCase, TransactionTestCase, skipUnlessDBFeature
from unittest import skipUnless
from django.db import connection
from rest_framework.test import APIClient
from contabilidad import test_saldos as fixtures
from contabilidad.models import Ventas, Abonos, Jornada, ItemsVenta, RemisionItem
from usuarios.models import Empresa
from contabilidad.serializers import RemisionSerializer
from contabilidad.payments import payment_snapshot

class DeepFinancialRegressionTests(TestCase):
    setUpTestData = classmethod(fixtures.BalanceIntegrityTests.setUpTestData.__func__)
    sale_payload = fixtures.BalanceIntegrityTests.sale_payload
    payment = fixtures.BalanceIntegrityTests.payment

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        for target in ('contabilidad.views.console.log', 'contabilidad.serializers.console.log'):
            mocked = patch(target)
            mocked.start()
            self.addCleanup(mocked.stop)

    def test_retaining_closed_jornada_allows_edit(self):
        jornada = Jornada.objects.create(empresa=self.empresa, fecha=date(2026,4,6), estado='closed')
        Ventas.objects.filter(pk=1).update(jornada=jornada)
        payload = self.sale_payload()
        payload.update(jornada=jornada.pk, detalle='Una correccion sin cambiar jornada')
        response = self.client.put('/venta/',payload,format='multipart')
        self.assertEqual(response.status_code,200,str(response.data))

    def test_cancelled_sale_blocks_payment_delete(self):
        self.payment()
        abono = Abonos.objects.get()
        self.client.delete('/venta/',{'id':1,'detalleAnulacion':'Prueba'},format='json')
        response = self.client.delete('/abono/',{'id':abono.pk,'snapshot':payment_snapshot(abono)},format='json')
        self.assertEqual(response.status_code,400,str(response.data))
        self.assertTrue(Abonos.objects.filter(pk=abono.pk).exists())

    def test_stale_individual_payment_edit_is_rejected(self):
        self.payment()
        abono = Abonos.objects.get()
        updated = self.client.put('/abono/',{'id':abono.pk,'snapshot':payment_snapshot(abono),'precio':50000},format='json')
        self.assertEqual(updated.status_code,200,str(updated.data))
        response = self.client.put('/abono/',{'id':abono.pk,'snapshot':payment_snapshot(abono),'precio':40000,'descripcion':'Formulario antiguo'},format='json')
        self.assertEqual(response.status_code,400,str(response.data))
        self.assertEqual(Abonos.objects.get().precio,50000)

    def test_negative_installments_are_rejected(self):
        for cuotas in (-2, 0):
            payload = self.sale_payload(3)
            payload['cuotas'] = cuotas
            response = self.client.post('/venta/',payload,format='multipart')
            self.assertEqual(response.status_code,400,str(response.data))
            self.assertIn('cuotas', response.data)

    def test_due_before_start_is_rejected(self):
        payload = self.sale_payload(3)
        payload.update(fecha_inicio='2026-04-06',fecha_vencimiento='2026-04-05')
        response = self.client.post('/venta/',payload,format='multipart')
        self.assertEqual(response.status_code,400,str(response.data))

    def test_unknown_sale_edit_is_not_server_error(self):
        self.client.raise_request_exception = False
        response = self.client.put('/venta/',self.sale_payload(999),format='multipart')
        self.assertEqual(response.status_code,404)

    def test_failed_edit_rolls_back_all_sale_fields(self):
        item = ItemsVenta.objects.create(venta_id=1,articulo=self.article,cantidad=1,precio_articulo=100000,totalArticulo=100000)
        from contabilidad.models import Remision
        rem = Remision.objects.create(venta_id=1,cliente_id=100,fecha=date(2026,4,6))
        RemisionItem.objects.create(remision=rem,item_venta=item,cantidad=1)
        other = type(self.article).objects.create(nombre='Otro',precio=100000)
        payload = self.sale_payload()
        payload.update(detalle='No debe guardarse',venta=json.dumps([{'articulo':other.pk,'cantidad':1,'precio_articulo':100000,'totalArticulo':100000}]))
        response = self.client.put('/venta/',payload,format='multipart')
        self.assertEqual(response.status_code,400)
        self.assertNotEqual(Ventas.objects.get(pk=1).detalle,'No debe guardarse')
        self.assertTrue(ItemsVenta.objects.filter(pk=item.pk).exists())

    def test_cancelled_sale_blocks_order_state_change(self):
        self.client.delete('/venta/',{'id':1,'detalleAnulacion':'Prueba'},format='json')
        response = self.client.post('/venta/1/estado-pedido/',{'estado':'para_fabricacion','motivo_sin_anticipo':'Prueba'},format='json')
        self.assertEqual(response.status_code,400,str(response.data))

    def test_cannot_associate_another_closed_jornada(self):
        jornada = Jornada.objects.create(empresa=self.empresa, fecha=date(2026,4,6), estado='closed')
        for pk, method in ((1, self.client.put), (3, self.client.post)):
            payload = self.sale_payload(pk)
            payload['jornada'] = jornada.pk
            response = method('/venta/', payload, format='multipart')
            self.assertEqual(response.status_code,400,str(response.data))
            self.assertIn('jornada', response.data)

    def test_missing_payment_reference_cannot_edit_or_delete(self):
        self.payment()
        abono = Abonos.objects.get()
        self.assertEqual(self.client.put('/abono/',{'id':abono.pk,'precio':50000},format='json').status_code,400)
        self.assertEqual(self.client.delete('/abono/',{'id':abono.pk},format='json').status_code,400)
        self.assertEqual(Abonos.objects.get().precio,40000)

    def test_stale_reference_cannot_delete_updated_payment(self):
        self.payment()
        abono = Abonos.objects.get()
        old = payment_snapshot(abono)
        response = self.client.put('/abono/',{'id':abono.pk,'snapshot':old,'precio':50000},format='json')
        self.assertEqual(response.status_code,200,str(response.data))
        self.assertNotEqual(response.data['snapshot'],old)
        self.assertEqual(self.client.delete('/abono/',{'id':abono.pk,'snapshot':old},format='json').status_code,400)
        self.assertEqual(self.client.put('/abono/',{'id':abono.pk,'snapshot':response.data['snapshot'],'descripcion':'Nueva referencia'},format='json').status_code,200)

    @skipUnless(connection.vendor == 'mysql', 'Payment SQL uses MySQL syntax.')
    def test_payment_list_references_match_records(self):
        self.payment()
        for endpoint in ('/abono/', '/abono/1'):
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code,200,str(response.data))
            self.assertEqual(response.data[0]['snapshot'],payment_snapshot(Abonos.objects.get()))

    def test_invalid_due_date_edit_preserves_original_values(self):
        payload = self.sale_payload()
        payload.update(fecha_inicio='2026-04-06',fecha_vencimiento='2026-04-05')
        self.assertEqual(self.client.put('/venta/',payload,format='multipart').status_code,400)
        self.assertIsNone(Ventas.objects.get(pk=1).fecha_inicio)

    def test_increasing_delivered_sale_returns_to_ready(self):
        from contabilidad.utils_estado_pedido import identify_estado_pedido_slug
        item = ItemsVenta.objects.create(venta_id=1,articulo=self.article,cantidad=1,precio_articulo=100000,totalArticulo=100000)
        response = self.client.post('/remisiones/',{'venta':1,'fecha':'2026-04-06','items':[{'itemVenta':item.pk,'cantidad':1}]},format='json')
        self.assertEqual(response.status_code,201,response.data)
        payload = self.sale_payload()
        payload.update(precio=200000,venta=json.dumps([{'articulo':self.article.pk,'cantidad':2,'precio_articulo':100000,'totalArticulo':200000}]))
        response = self.client.put('/venta/',payload,format='multipart')
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(identify_estado_pedido_slug(Ventas.objects.get(pk=1).estado_pedido.nombre),'listo_entrega')

    def test_renaming_company_preserves_obligations(self):
        endpoint = '/abonos/masivo/preview/?tipo=empresa&empresa_id='+str(self.empresa.pk)
        self.assertEqual(len(self.client.get(endpoint).data),2)
        self.empresa.nombre = 'Empresa Renombrada'
        self.empresa.save(update_fields=['nombre'])
        self.assertEqual(len(self.client.get(endpoint).data),2)

    def test_omitted_jornada_cannot_bypass_company_validation(self):
        jornada = Jornada.objects.create(empresa=self.empresa,fecha=date(2026,4,6))
        Ventas.objects.filter(pk=1).update(jornada=jornada)
        other = Empresa.objects.create(nombre='Otra empresa')
        payload = self.sale_payload()
        payload['empresaCliente'] = other.pk
        self.assertEqual(self.client.put('/venta/',payload,format='multipart').status_code,400)

    def test_invalid_jornada_schedule_is_rejected(self):
        for extra in ({'cantidad_cuotas':-2}, {'fecha_vencimiento':'2026-04-01'}):
            response = self.client.post('/jornadas/',{'empresa':self.empresa.pk,'fecha':'2026-04-07','fecha_inicio':'2026-04-07','fecha_vencimiento':'2026-05-07','cantidad_cuotas':2,**extra},format='json')
            self.assertEqual(response.status_code,400,response.data)

    def test_malformed_mass_remission_is_a_validation_error(self):
        self.client.raise_request_exception = False
        for rows in ([None], 'invalid', [], [{'venta_id':1,'items':[None]}], [{'venta_id':1,'items':[{'itemVenta':1,'cantidad':1.5}]}]):
            response = self.client.post('/remisiones/masivo/',{'fecha':'2026-04-06','remisiones':rows},format='json')
            self.assertEqual(response.status_code,400)

    def test_company_backfill_does_not_guess_duplicate_names(self):
        from importlib import import_module
        from types import SimpleNamespace
        from django.apps import apps
        Ventas.objects.update(empresa=None)
        backfill = import_module('contabilidad.migrations.0037_ventas_empresa').asociar_empresas
        backfill(apps, SimpleNamespace(connection=connection))
        self.assertEqual(Ventas.objects.get(pk=1).empresa_id,self.empresa.pk)
        Ventas.objects.update(empresa=None)
        Empresa.objects.create(nombre=self.empresa.nombre)
        backfill(apps, SimpleNamespace(connection=connection))
        self.assertIsNone(Ventas.objects.get(pk=1).empresa_id)

    def test_remission_keeps_original_amount_and_discount_after_sale_edit(self):
        item = ItemsVenta.objects.create(venta_id=1, articulo=self.article, cantidad=1,
                                        precio_articulo=100000, totalArticulo=100000)
        response = self.client.post('/remisiones/', {'venta': 1, 'fecha': '2026-04-06',
            'items': [{'itemVenta': item.pk, 'cantidad': 1}]}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        remission_id = response.data['id']
        payload = self.sale_payload()
        payload.update(precio=180000, venta=json.dumps([{'articulo': self.article.pk,
            'cantidad': 2, 'precio_articulo': 100000, 'descuento': 10,
            'tipo_descuento': 'porcentaje', 'totalArticulo': 180000}]))
        response = self.client.put('/venta/', payload, format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        previous = self.client.get('/remisiones/').data[0]
        self.assertEqual(previous['totalRemision'], 100000)
        self.assertEqual(previous['items'][0]['descuento'], 0)
        self.assertEqual(previous['items'][0]['tipoDescuento'], 'precio')
        response = self.client.post('/remisiones/', {'venta': 1, 'fecha': '2026-04-07',
            'items': [{'itemVenta': item.pk, 'cantidad': 1}]}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['totalRemision'], 90000)
        self.assertEqual(response.data['items'][0]['descuento'], 10)
        old = next(row for row in self.client.get('/remisiones/').data if row['id'] == remission_id)
        self.assertEqual(old['totalRemision'], 100000)

    def test_remission_backfill_preserves_values_including_zero_discount(self):
        from importlib import import_module
        from types import SimpleNamespace
        from django.apps import apps
        from contabilidad.models import Remision
        item = ItemsVenta.objects.create(venta_id=1, articulo=self.article, cantidad=2,
                                        precio_articulo=60000, totalArticulo=100000,
                                        descuento=20000, tipo_descuento='precio')
        remission = Remision.objects.create(venta_id=1, fecha=date(2026,4,6))
        row = RemisionItem.objects.create(remision=remission, item_venta=item, cantidad=1)
        RemisionItem.objects.filter(pk=row.pk).update(total_articulo_original=None)
        backfill = import_module('contabilidad.migrations.0038_remision_item_importes_originales').conservar_importes
        backfill(apps, SimpleNamespace(connection=connection))
        row.refresh_from_db()
        self.assertEqual((row.cantidad_venta_original, row.total_articulo_original, row.descuento_original), (2,100000,20000))

    def test_jornada_transition_cannot_be_bypassed_with_other_fields(self):
        jornada = Jornada.objects.create(empresa=self.empresa, fecha=date(2026,4,6), estado='in_progress')
        path = f'/jornadas/{jornada.pk}/'
        for extra in ({}, {'observaciones': 'Prueba'}, {'sucursal': 'Nueva'}):
            response = self.client.patch(path, {'estado': 'planned', **extra}, format='json')
            self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(self.client.delete(path).status_code, 400)
        self.assertEqual(self.client.patch(path, {'estado': 'closed', 'observaciones': 'Finalizada'}, format='json').status_code, 200)
        self.assertEqual(self.client.patch(path, {'estado': 'in_progress'}, format='json').status_code, 200)
        jornada.refresh_from_db()
        self.assertEqual(jornada.observaciones, 'Finalizada')

    def test_jornada_company_cannot_change_with_sales(self):
        jornada = Jornada.objects.create(empresa=self.empresa, fecha=date(2026,4,6))
        Ventas.objects.filter(pk=1).update(jornada=jornada)
        other = Empresa.objects.create(nombre='Otra empresa')
        response = self.client.patch(f'/jornadas/{jornada.pk}/', {'empresa': other.pk}, format='json')
        self.assertEqual(response.status_code, 400, response.data)
        jornada.refresh_from_db()
        self.assertEqual(jornada.empresa_id, self.empresa.pk)
        self.assertEqual(self.client.put('/venta/', self.sale_payload(), format='multipart').status_code, 200)

    def test_empty_planned_jornada_can_change_company(self):
        jornada = Jornada.objects.create(empresa=self.empresa, fecha=date(2026,4,6))
        other = Empresa.objects.create(nombre='Otra empresa')
        response = self.client.patch(f'/jornadas/{jornada.pk}/', {'empresa': other.pk}, format='json')
        self.assertEqual(response.status_code, 200, response.data)

    def test_jornada_summary_excludes_cancelled_sales_but_keeps_history(self):
        jornada = Jornada.objects.create(empresa=self.empresa, fecha=date(2026,4,6))
        Ventas.objects.update(jornada=jornada)
        for pk in (1,2):
            ItemsVenta.objects.create(venta_id=pk, articulo=self.article, cantidad=1,
                                     precio_articulo=100000, totalArticulo=100000)
        self.assertEqual(self.payment(40000).status_code, 201)
        self.assertEqual(self.client.delete('/venta/', {'id':1,'detalleAnulacion':'Prueba'}, format='json').status_code, 200)
        detail = self.client.get(f'/jornadas/{jornada.pk}/').data
        self.assertEqual(detail['resumen']['total_vendido'], 100000)
        self.assertEqual(detail['resumen']['total_saldos'], 100000)
        self.assertEqual(detail['resumen']['total_abonos'], 0)
        self.assertEqual(detail['resumen']['total_unidades'], 1)
        self.assertEqual(len(detail['ventas']), 2)
        summary = self.client.get('/jornadas/').data[0]
        self.assertEqual((summary['total_vendido'], summary['total_abonos']), (100000,0))

    def test_invalid_state_dates_are_rejected_without_changing_history(self):
        from contabilidad.models import HistoricoEstadoPedidoVenta
        from contabilidad.utils_estado_pedido import get_estado_pedido_by_slug
        initial = get_estado_pedido_by_slug('creado')
        Ventas.objects.update(estado_pedido=initial)
        for raw in ('2026-02-30T10:00:00', 'no-es-una-fecha', 0, False, {}, []):
            for endpoint, extra in (('/venta/1/estado-pedido/', {}),
                                    ('/venta/estado-pedido/masivo/', {'venta_ids':[1,2]})):
                response = self.client.post(endpoint, {'estado':'para_fabricacion',
                    'motivo_sin_anticipo':'Prueba', 'fecha_estado':raw, **extra}, format='json')
                self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(Ventas.objects.get(pk=1).estado_pedido_id, initial.pk)
        self.assertFalse(HistoricoEstadoPedidoVenta.objects.exists())

    def test_state_date_respects_use_tz_false_and_true(self):
        from django.test import override_settings
        from django.utils import timezone
        from contabilidad.views import _parse_estado_pedido_fecha
        for use_tz in (False, True):
            with override_settings(USE_TZ=use_tz, TIME_ZONE='America/Bogota'):
                parsed = _parse_estado_pedido_fecha('2026-04-06T15:30:00Z')
                self.assertEqual(timezone.is_aware(parsed), use_tz)
                self.assertEqual(parsed.hour, 15 if use_tz else 10)
                self.assertIsNone(_parse_estado_pedido_fecha(None))

    def test_state_catalog_consolidates_all_references_without_changing_dates(self):
        from importlib import import_module
        from types import SimpleNamespace
        from django.apps import apps
        from django.utils import timezone
        from contabilidad.models import EstadoPedidoVenta, PedidoVenta, HistoricoEstadoPedidoVenta
        from contabilidad.utils_estado_pedido import ensure_estado_pedido_defaults, ESTADOS_PEDIDO_DEFINICIONES
        ensure_estado_pedido_defaults()
        for pk in range(1,7):
            EstadoPedidoVenta.objects.create(pk=pk, nombre=f'Estado antiguo {pk}')
        stamp = timezone.now()
        Ventas.objects.filter(pk=1).update(estado_pedido_id=6, estado_pedido_actualizado=stamp)
        Ventas.objects.filter(pk=2).update(estado_pedido_id=3)
        pedido = PedidoVenta.objects.create(venta_id=1, estado_id=6)
        history = HistoricoEstadoPedidoVenta.objects.create(venta_id=1, estado_anterior_id=6,
            estado_nuevo_id=4, fecha=stamp, origen='manual', motivo='Conservar este motivo')
        normalize = import_module('contabilidad.migrations.0039_normalizar_estados_pedido').normalizar_estados
        normalize(apps, SimpleNamespace(connection=connection))
        normalize(apps, SimpleNamespace(connection=connection))
        ensure_estado_pedido_defaults()
        self.assertEqual(list(EstadoPedidoVenta.objects.order_by('pk').values_list('pk',flat=True)), [7,8,9,10,11])
        self.assertEqual([row[0] for row in ESTADOS_PEDIDO_DEFINICIONES], [7,8,9,10,11])
        sale = Ventas.objects.get(pk=1)
        self.assertEqual((sale.estado_pedido_id,sale.estado_pedido_actualizado), (8,stamp))
        self.assertEqual(Ventas.objects.get(pk=2).estado_pedido_id,9)
        pedido.refresh_from_db()
        history.refresh_from_db()
        self.assertEqual(pedido.estado_id,8)
        self.assertEqual((history.estado_anterior_id,history.estado_nuevo_id,history.fecha,history.motivo),
                         (8,10,stamp,'Conservar este motivo'))

    def test_unknown_state_stops_consolidation_without_deleting_data(self):
        from importlib import import_module
        from types import SimpleNamespace
        from django.apps import apps
        from contabilidad.models import EstadoPedidoVenta
        EstadoPedidoVenta.objects.create(pk=12,nombre='Necesita revision')
        normalize = import_module('contabilidad.migrations.0039_normalizar_estados_pedido').normalizar_estados
        with self.assertRaises(RuntimeError):
            normalize(apps,SimpleNamespace(connection=connection))
        self.assertEqual(list(EstadoPedidoVenta.objects.values_list('pk',flat=True)),[12])

    def test_order_state_catalog_is_read_only_even_for_admin(self):
        from django.contrib import admin
        from django.test import RequestFactory
        from contabilidad.models import EstadoPedidoVenta
        request = RequestFactory().get('/admin/')
        request.user = self.admin
        model_admin = admin.site._registry[EstadoPedidoVenta]
        self.assertTrue(model_admin.has_view_permission(request))
        self.assertFalse(model_admin.has_add_permission(request))
        self.assertFalse(model_admin.has_change_permission(request))
        self.assertFalse(model_admin.has_delete_permission(request))

    def test_existing_client_lookup_uses_document_number(self):
        response = self.client.get('/usuarios/infoCliente/100')
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(response.data[0]['cedula'],100)
        self.assertEqual(self.client.get('/usuarios/infoCliente/999999').status_code,404)

    def test_sale_cancellation_validates_identifier_and_reason(self):
        for payload in ({}, {'id':-1}, {'id':[]}, {'id':1},
                        {'id':1,'detalleAnulacion':['Prueba']}, {'id':1,'detalleAnulacion':'   '}):
            self.assertEqual(self.client.delete('/venta/',payload,format='json').status_code,400)
        response = self.client.delete('/venta/',{'id':999999,'detalleAnulacion':'Prueba'},format='json')
        self.assertEqual(response.status_code,404)
        self.assertFalse(Ventas.objects.get(pk=1).anulado)

    def test_mass_remission_invalid_observation_returns_400(self):
        for value in (['Prueba'], {'texto':'Prueba'}):
            response = self.client.post('/remisiones/masivo/',{'venta_ids':[1],
                'fecha':'2026-04-06','observacion':value},format='json')
            self.assertEqual(response.status_code,400,response.data)
        self.assertFalse(RemisionItem.objects.exists())

    def test_sale_and_jornada_reject_excessive_installments(self):
        for count in (361,2147483647):
            payload = self.sale_payload(3)
            payload['cuotas'] = count
            self.assertEqual(self.client.post('/venta/',payload,format='multipart').status_code,400)
            response = self.client.post('/jornadas/',{'empresa':self.empresa.pk,
                'fecha':'2026-04-06','cantidad_cuotas':count},format='json')
            self.assertEqual(response.status_code,400,response.data)

@skipUnless(connection.vendor == 'mysql', 'Requires the actual legacy MySQL column')
class LegacyCancellationMigrationTests(TransactionTestCase):
    def test_null_flags_are_classified_and_column_rejects_future_nulls(self):
        from importlib import import_module
        from django.apps import apps
        from django.db import IntegrityError
        from django.db.migrations.state import ProjectState
        fixtures.BalanceIntegrityTests.setUpTestData.__func__(type(self))
        field = Ventas._meta.get_field('anulado')
        nullable = field.clone()
        nullable.set_attributes_from_name(field.name)
        nullable.model = Ventas
        nullable.null = True
        with connection.schema_editor() as editor:
            editor.alter_field(Ventas,field,nullable)
        migration = import_module('contabilidad.migrations.0040_normalizar_anulado_ventas')
        try:
            Ventas.objects.filter(pk=1).update(anulado=None,detalleAnulacion='   ')
            Ventas.objects.filter(pk=2).update(anulado=None,estado_id=4)
            Ventas.objects.create(pk=3,cliente_id=100,precio=100000,estado_id=1,
                                 anulado=None,detalleAnulacion='Anulada previamente')
            Ventas.objects.create(pk=4,cliente_id=100,precio=100000,estado_id=1,
                                 anulado=None,usuarioAnulacion=self.admin.pk)
            with connection.schema_editor() as editor:
                migration.Migration('0040_normalizar_anulado_ventas', 'contabilidad').apply(
                    ProjectState.from_apps(apps), editor
                )
            self.assertEqual(list(Ventas.objects.order_by('pk').values_list('anulado',flat=True)),[False,True,True,True])
            from contabilidad.saldos import cartera_rows
            self.assertEqual([row['venta_id'] for row in cartera_rows()],[1])
            client = APIClient()
            client.force_authenticate(self.admin)
            preview = client.get('/abonos/masivo/preview/?tipo=cliente&cliente_id=100')
            self.assertEqual([row['id'] for row in preview.data],[1])
            with self.assertRaises(IntegrityError):
                with transaction.atomic():
                    Ventas.objects.filter(pk=1).update(anulado=None)
        finally:
            Ventas.objects.filter(anulado__isnull=True).update(anulado=False)
            with connection.schema_editor() as editor:
                editor.alter_field(Ventas,nullable,field)

@skipUnlessDBFeature('has_select_for_update')
class FinancialTransactionRegressionTests(TransactionTestCase):
    def setUp(self):
        fixtures.BalanceIntegrityTests.setUpTestData.__func__(type(self))
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        Ventas.objects.filter(pk=1).update(precio=200000)
        self.item = ItemsVenta.objects.create(venta_id=1,articulo=self.article,cantidad=2,precio_articulo=100000,totalArticulo=200000)

    def test_remission_reloads_items_after_sale_lock(self):
        original = RemisionSerializer.validate
        def update_sale():
            close_old_connections()
            try:
                with transaction.atomic():
                    sale = Ventas.objects.select_for_update().get(pk=1)
                    ItemsVenta.objects.filter(pk=self.item.pk).update(cantidad=1,totalArticulo=100000)
                    sale.precio = 100000
                    sale.save(update_fields=['precio'])
            finally:
                connections.close_all()
        def validate(serializer, attrs):
            with ThreadPoolExecutor(max_workers=1) as pool:
                pool.submit(update_sale).result(timeout=15)
            return original(serializer,attrs)
        with patch.object(RemisionSerializer,'validate',validate):
            response = self.client.post('/remisiones/',{'venta':1,'fecha':'2026-04-06','items':[{'itemVenta':self.item.pk,'cantidad':2}]},format='json')
        self.assertEqual(response.status_code,400,str(response.data))
        self.assertFalse(RemisionItem.objects.exists())

    def test_history_failure_rolls_back_order_state(self):
        from contabilidad.utils_estado_pedido import get_estado_pedido_by_slug
        initial = get_estado_pedido_by_slug('creado')
        Ventas.objects.filter(pk=1).update(estado_pedido=initial)
        self.client.raise_request_exception = False
        with patch('contabilidad.utils_estado_pedido._registrar_historico_estado',side_effect=RuntimeError('Fallo simulado al registrar historico')):
            response = self.client.post('/venta/1/estado-pedido/',{'estado':'para_fabricacion','motivo_sin_anticipo':'Prueba'},format='json')
        self.assertEqual(response.status_code,500)
        self.assertEqual(Ventas.objects.get(pk=1).estado_pedido_id,initial.pk)

    def test_mass_history_failure_rolls_back_all_states(self):
        from contabilidad import utils_estado_pedido as estados
        initial = estados.get_estado_pedido_by_slug('creado')
        Ventas.objects.update(estado_pedido=initial)
        original = estados._registrar_historico_estado
        calls = []
        def record(*args, **kwargs):
            calls.append(1)
            if len(calls) == 2:
                raise RuntimeError('Fallo simulado en segundo pedido')
            return original(*args, **kwargs)
        self.client.raise_request_exception = False
        with patch.object(estados, '_registrar_historico_estado', record):
            response = self.client.post('/venta/estado-pedido/masivo/', {'venta_ids':[1,2], 'estado':'para_fabricacion', 'motivo_sin_anticipo':'Prueba'}, format='json')
        self.assertEqual(response.status_code,500)
        self.assertEqual(list(Ventas.objects.order_by('pk').values_list('estado_pedido_id',flat=True)),[initial.pk,initial.pk])

    def test_simultaneous_state_changes_create_only_one_transition(self):
        from contabilidad.models import HistoricoEstadoPedidoVenta
        from contabilidad.utils_estado_pedido import get_estado_pedido_by_slug
        initial = get_estado_pedido_by_slug('creado')
        Ventas.objects.filter(pk=1).update(estado_pedido=initial)
        barrier = Barrier(2)
        def change(_):
            close_old_connections()
            try:
                client = APIClient()
                client.force_authenticate(self.admin)
                barrier.wait(timeout=15)
                return client.post('/venta/1/estado-pedido/', {'estado':'para_fabricacion','motivo_sin_anticipo':'Prueba'},format='json').status_code
            finally:
                connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as pool:
            result = list(pool.map(change, range(2)))
        self.assertEqual(sorted(result),[200,400])
        self.assertEqual(HistoricoEstadoPedidoVenta.objects.filter(venta_id=1).count(),1)


