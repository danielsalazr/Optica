from uuid import uuid4

from django.contrib import admin
from django.core.exceptions import ValidationError as ModelValidationError
from django.db.models.deletion import ProtectedError
from django.test import TestCase, RequestFactory
from rest_framework.test import APIClient

from contabilidad.models import Ventas, Remision, RemisionItem
from .models import Bodega, ConfiguracionArticulo, Existencia, Movimiento, Reserva
from .services import liberar_venta, reservar_venta, despachar, revertir_remision
from . import tests as fixtures


class WarehouseTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        fixtures.InventoryTests.setUpTestData.__func__(cls)
        cls.other = Bodega.objects.create(nombre='Sucursal Norte')
        cls.other_stock = Existencia.objects.create(articulo=cls.article, bodega=cls.other, cantidad=6)

    sale_payload = fixtures.InventoryTests.sale_payload

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def assign_other(self):
        self.sale.bodega = self.other
        self.sale.save(update_fields=['bodega'])

    def counts(self):
        self.stock.refresh_from_db()
        self.other_stock.refresh_from_db()
        return (self.stock.cantidad, self.stock.reservado, self.other_stock.cantidad, self.other_stock.reservado)

    def shipment(self, quantity=1):
        doc = Remision.objects.create(venta=self.sale)
        RemisionItem.objects.create(remision=doc, item_venta=self.item, cantidad=quantity)
        despachar(doc, self.admin)
        return doc

    def test_stock_listing_is_separated_by_warehouse(self):
        default = self.client.get('/inventario/').data
        other = self.client.get(f'/inventario/?bodega_id={self.other.pk}').data
        self.assertEqual(next(item for item in default['articulos'] if item['id'] == self.article.pk)['existencia'], 10)
        self.assertEqual(next(item for item in other['articulos'] if item['id'] == self.article.pk)['existencia'], 6)
        self.assertEqual(other['bodega_id'], self.other.pk)
        self.assertEqual(self.client.get('/inventario/?bodega_id=9999').status_code, 404)
        self.assertEqual(self.client.get('/inventario/?bodega_id=abc').status_code, 400)

    def test_reservation_dispatch_and_release_use_sale_warehouse(self):
        self.assign_other()
        reservar_venta(self.sale)
        self.assertEqual(self.counts(), (10, 0, 6, 2))
        self.shipment()
        self.assertEqual(self.counts(), (10, 0, 5, 1))
        liberar_venta(self.sale)
        self.assertEqual(self.counts(), (10, 0, 5, 0))
        self.assertEqual(Movimiento.objects.get(tipo='salida').existencia.bodega_id, self.other.pk)

    def test_does_not_borrow_stock_from_another_warehouse(self):
        self.assign_other()
        payload = self.sale_payload(1, 7)
        payload['bodega'] = self.other.pk
        response = self.client.put('/venta/', payload, format='multipart')
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(self.counts(), (10, 0, 6, 0))

    def test_switch_warehouse_before_dispatch_moves_reservation(self):
        reservar_venta(self.sale)
        payload = self.sale_payload(1)
        payload['bodega'] = self.other.pk
        response = self.client.put('/venta/', payload, format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(self.counts(), (10, 0, 6, 2))
        self.assertEqual(Reserva.objects.get(item=self.item).existencia.bodega_id, self.other.pk)

    def test_failed_switch_restores_old_reservation(self):
        reservar_venta(self.sale)
        self.other_stock.cantidad = 1
        self.other_stock.save()
        payload = self.sale_payload(1)
        payload['bodega'] = self.other.pk
        self.assertEqual(self.client.put('/venta/', payload, format='multipart').status_code, 400)
        self.assertEqual(self.counts(), (10, 2, 1, 0))
        self.sale.refresh_from_db()
        self.assertIsNone(self.sale.bodega_id)

    def test_switch_after_dispatch_is_rejected(self):
        reservar_venta(self.sale)
        self.shipment()
        payload = self.sale_payload(1)
        payload['bodega'] = self.other.pk
        response = self.client.put('/venta/', payload, format='multipart')
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(self.counts(), (9, 1, 6, 0))

    def test_returns_and_reversal_restore_original_warehouse(self):
        self.assign_other()
        reservar_venta(self.sale)
        doc = self.shipment()
        output = Movimiento.objects.get(tipo='salida')
        response = self.client.post('/inventario/movimientos/', {'articulo_id': self.article.pk,
            'tipo': 'devolucion', 'cantidad': 1, 'motivo': 'Devolucion', 'origen_id': output.pk, 'clave': str(uuid4())}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.counts(), (10, 0, 6, 1))
        doc.anulado = True
        doc.save()
        revertir_remision(doc, self.admin)
        self.assertEqual(self.counts(), (10, 0, 6, 2))

    def test_return_to_wrong_warehouse_is_rejected(self):
        self.assign_other()
        reservar_venta(self.sale)
        self.shipment()
        output = Movimiento.objects.get(tipo='salida')
        response = self.client.post('/inventario/movimientos/', {'articulo_id': self.article.pk,
            'tipo': 'devolucion', 'bodega_id': 1, 'cantidad': 1, 'motivo': 'Devolucion', 'origen_id': output.pk, 'clave': str(uuid4())}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.counts(), (10, 0, 5, 1))

    def test_entry_and_movement_filter_respect_warehouse(self):
        data = {'articulo_id': self.article.pk, 'bodega_id': self.other.pk, 'tipo': 'entrada',
                'cantidad': 2, 'motivo': 'Recepcion Norte', 'clave': str(uuid4())}
        self.assertEqual(self.client.post('/inventario/movimientos/', data, format='json').status_code, 201)
        self.assertEqual(self.counts(), (10, 0, 8, 0))
        self.assertEqual(self.client.get('/inventario/movimientos/?bodega_id=1').data['count'], 0)
        rows = self.client.get(f'/inventario/movimientos/?bodega_id={self.other.pk}').data
        self.assertEqual(rows['count'], 1)
        self.assertEqual(rows['results'][0]['bodega'], self.other.nombre)

    def test_disabling_item_checks_stock_in_all_warehouses(self):
        self.stock.cantidad = 0
        self.stock.save()
        response = self.client.put(f'/inventario/articulos/{self.article.pk}/', {'controla': False, 'codigo': None, 'minimo': 0}, format='json')
        self.assertEqual(response.status_code, 400)
        self.config.refresh_from_db()
        self.assertTrue(self.config.controla)

    def test_inactive_warehouse_rejects_sales_and_receipts(self):
        self.other.activa = False
        self.other.save()
        payload = self.sale_payload(2)
        payload['bodega'] = self.other.pk
        self.assertEqual(self.client.post('/venta/', payload, format='multipart').status_code, 400)
        data = {'articulo_id': self.article.pk, 'bodega_id': self.other.pk, 'tipo': 'entrada',
                'cantidad': 2, 'motivo': 'Recepcion', 'clave': str(uuid4())}
        self.assertEqual(self.client.post('/inventario/movimientos/', data, format='json').status_code, 400)
        self.assertEqual(self.counts(), (10, 0, 6, 0))

    def test_cannot_deactivate_reserved_or_principal_warehouse(self):
        self.assign_other()
        reservar_venta(self.sale)
        self.other.activa = False
        with self.assertRaises(ModelValidationError):
            self.other.full_clean()
        central = Bodega.objects.get(pk=1)
        central.activa = False
        with self.assertRaises(ModelValidationError):
            central.full_clean()

    def test_admin_crud_and_protected_deletion(self):
        self.client.force_login(self.admin)
        response = self.client.post('/admin/inventario/bodega/add/', {'nombre': 'Nueva bodega', 'activa': 'on', '_save': 'Guardar'})
        self.assertEqual(response.status_code, 302)
        new = Bodega.objects.get(nombre='Nueva bodega')
        response = self.client.post(f'/admin/inventario/bodega/{new.pk}/change/', {'nombre': 'Bodega renombrada', 'activa': 'on', '_save': 'Guardar'})
        self.assertEqual(response.status_code, 302)
        new.refresh_from_db()
        self.assertEqual(new.nombre, 'Bodega renombrada')
        self.assertEqual(self.client.post(f'/admin/inventario/bodega/{new.pk}/delete/', {'post': 'yes'}).status_code, 302)
        self.assertFalse(Bodega.objects.filter(pk=new.pk).exists())
        self.assertEqual(self.client.post('/admin/inventario/bodega/1/delete/', {'post': 'yes'}).status_code, 403)
        with self.assertRaises(ProtectedError):
            self.other.delete()
        request = RequestFactory().get('/admin/')
        request.user = self.admin
        self.assertTrue(admin.site._registry[Bodega].has_add_permission(request))
        self.assertFalse(admin.site._registry[Bodega].get_actions(request))

    def test_admin_deactivation_with_reservations_shows_validation_not_500(self):
        self.assign_other()
        reservar_venta(self.sale)
        self.client.force_login(self.admin)
        response = self.client.post(f'/admin/inventario/bodega/{self.other.pk}/change/', {'nombre': self.other.nombre, '_save': 'Guardar'})
        self.assertEqual(response.status_code, 200)
        self.other.refresh_from_db()
        self.assertTrue(self.other.activa)

    def test_inactive_warehouse_still_accepts_return_to_original_source(self):
        self.assign_other()
        reservar_venta(self.sale)
        self.shipment(2)
        output = Movimiento.objects.get(tipo='salida')
        self.other.activa = False
        self.other.full_clean()
        self.other.save()
        response = self.client.post('/inventario/movimientos/', {'articulo_id': self.article.pk,
            'tipo': 'devolucion', 'cantidad': 1, 'motivo': 'Retorno fisico', 'origen_id': output.pk, 'clave': str(uuid4())}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.counts(), (10, 0, 5, 0))
