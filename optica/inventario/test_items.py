from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from contabilidad.models import Articulos, ItemsVenta, Ventas, FotosArticulos
from .models import ConfiguracionArticulo, Existencia, Movimiento
from .services import principal


class ItemCatalogTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = get_user_model().objects.create_superuser('catalog-admin', password='test-only')

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.media = TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        self.settings_override = override_settings(MEDIA_ROOT=self.media.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)

    def payload(self, **changes):
        data = {'nombre': 'Montura de prueba', 'descripcion': 'Descripcion', 'precio': 100000, 'tipo_articulo': '1'}
        data.update(changes)
        return data

    def image(self):
        output = BytesIO()
        Image.new('RGB', (8, 8)).save(output, format='PNG')
        return SimpleUploadedFile('foto.png', output.getvalue(), content_type='image/png')

    def test_create_read_update_delete(self):
        response = self.client.post('/inventario/items/', self.payload(), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        endpoint = f'/inventario/items/{response.data["id"]}/'
        self.assertEqual(self.client.get(endpoint).data['nombre'], 'Montura de prueba')
        self.assertEqual(self.client.get('/inventario/items/').data[0]['id'], response.data['id'])
        response = self.client.put(endpoint, self.payload(nombre='Servicio', tipo_articulo='2'), format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['tipo_articulo'], '2')
        self.assertEqual(self.client.delete(endpoint).status_code, 204)
        self.assertFalse(Articulos.objects.exists())

    def test_invalid_price_name_and_type_do_not_create(self):
        for changes in [{'precio': -1}, {'precio': 2147483648}, {'precio': 1.5}, {'nombre': '  '}, {'tipo_articulo': '3'}]:
            response = self.client.post('/inventario/items/', self.payload(**changes), format='json')
            self.assertEqual(response.status_code, 400, response.data)
        self.assertFalse(Articulos.objects.exists())

    def test_multiple_photos_and_preserving_existing_files(self):
        response = self.client.post('/inventario/items/', self.payload(imagenes=[self.image(), self.image()]), format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(len(response.data['fotos']), 2)
        endpoint = f'/inventario/items/{response.data["id"]}/'
        response = self.client.put(endpoint, self.payload(nombre='Otro nombre'), format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(response.data['fotos']), 2)
        photo_id = response.data['fotos'][0]['id']
        response = self.client.put(endpoint, self.payload(quitar_fotos=[photo_id], imagenes=[self.image()]), format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(response.data['fotos']), 2)
        self.assertNotIn(photo_id, [photo['id'] for photo in response.data['fotos']])

    def test_invalid_image_rolls_back_catalog_creation(self):
        response = self.client.post('/inventario/items/', self.payload(imagenes=[SimpleUploadedFile('bad.png', b'not an image')]), format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Articulos.objects.exists())

    def test_cannot_remove_another_items_photo(self):
        first = Articulos.objects.create(nombre='Primero', tipo_articulo='1')
        second = Articulos.objects.create(nombre='Segundo', tipo_articulo='1')
        photo = FotosArticulos.objects.create(articulo=second, foto=self.image())
        response = self.client.put(f'/inventario/items/{first.pk}/', self.payload(quitar_fotos=[photo.pk]), format='json')
        self.assertEqual(response.status_code, 400)
        self.assertTrue(FotosArticulos.objects.filter(pk=photo.pk).exists())

    def test_controlled_type_cannot_change_but_name_and_price_can(self):
        item = Articulos.objects.create(nombre='Montura', tipo_articulo='1')
        ConfiguracionArticulo.objects.create(articulo=item, controla=True)
        endpoint = f'/inventario/items/{item.pk}/'
        self.assertEqual(self.client.put(endpoint, self.payload(tipo_articulo='2'), format='json').status_code, 400)
        response = self.client.put(endpoint, self.payload(nombre='Nuevo nombre'), format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['precio'], 100000)

    def test_deletion_of_item_with_sale_is_blocked(self):
        item = Articulos.objects.create(nombre='Montura')
        sale = Ventas.objects.create(pk=1, estado=None, tipo_venta=None)
        ItemsVenta.objects.create(venta=sale, articulo=item)
        self.assertEqual(self.client.delete(f'/inventario/items/{item.pk}/').status_code, 409)
        self.assertTrue(Articulos.objects.filter(pk=item.pk).exists())
        self.assertTrue(ItemsVenta.objects.exists())

    def test_stock_or_history_blocks_deletion_even_with_zero_balance(self):
        item = Articulos.objects.create(nombre='Montura')
        stock = Existencia.objects.create(articulo=item, bodega=principal(), cantidad=5)
        endpoint = f'/inventario/items/{item.pk}/'
        self.assertEqual(self.client.delete(endpoint).status_code, 409)
        stock.cantidad = 0
        stock.save()
        Movimiento.objects.create(existencia=stock, tipo='ajuste', cantidad=-5, saldo_resultante=0, motivo='Conteo', usuario=self.admin, clave='catalog-test')
        self.assertEqual(self.client.delete(endpoint).status_code, 409)
        self.assertTrue(Movimiento.objects.exists())

    def test_unused_zero_stock_configuration_can_be_deleted(self):
        item = Articulos.objects.create(nombre='Sin uso')
        ConfiguracionArticulo.objects.create(articulo=item)
        Existencia.objects.create(articulo=item, bodega=principal())
        self.assertEqual(self.client.delete(f'/inventario/items/{item.pk}/').status_code, 204)
        self.assertFalse(Existencia.objects.exists())
        self.assertFalse(ConfiguracionArticulo.objects.exists())

    def test_read_only_inventory_permissions_do_not_grant_crud(self):
        user = get_user_model().objects.create_user('catalog-reader')
        user.user_permissions.add(Permission.objects.get(content_type__app_label='usuarios', codename='view_inventario'))
        self.client.force_authenticate(user)
        item = Articulos.objects.create(nombre='Solo lectura')
        self.assertEqual(self.client.get('/inventario/items/').status_code, 200)
        self.assertEqual(self.client.post('/inventario/items/', self.payload(), format='json').status_code, 403)
        self.assertEqual(self.client.put(f'/inventario/items/{item.pk}/', self.payload(), format='json').status_code, 403)
        self.assertEqual(self.client.delete(f'/inventario/items/{item.pk}/').status_code, 403)

    def test_delete_requires_explicit_delete_permission_and_view(self):
        user = get_user_model().objects.create_user('catalog-delete')
        user.user_permissions.add(Permission.objects.get(content_type__app_label='usuarios', codename='delete_inventario'))
        self.client.force_authenticate(user)
        item = Articulos.objects.create(nombre='Sin uso')
        self.assertEqual(self.client.delete(f'/inventario/items/{item.pk}/').status_code, 403)
        user.user_permissions.add(Permission.objects.get(content_type__app_label='usuarios', codename='view_inventario'))
        user = get_user_model().objects.get(pk=user.pk)
        self.client.force_authenticate(user)
        self.assertEqual(self.client.delete(f'/inventario/items/{item.pk}/').status_code, 204)

    def test_movement_filters_and_server_pagination(self):
        item = Articulos.objects.create(nombre='Montura')
        stock = Existencia.objects.create(articulo=item, bodega=principal())
        for index in range(23):
            Movimiento.objects.create(existencia=stock, tipo='entrada', cantidad=1, saldo_resultante=index + 1,
                motivo='Compra proveedor', usuario=self.admin, clave=f'list-test-{index}')
        response = self.client.get('/inventario/movimientos/?rows=10&page=2&tipo=entrada&buscar=proveedor')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 23)
        self.assertEqual(len(response.data['results']), 10)
        self.assertGreater(response.data['results'][0]['id'], response.data['results'][-1]['id'])
        self.assertEqual(self.client.get('/inventario/movimientos/?tipo=ajuste').data['count'], 0)
        self.assertEqual(self.client.get('/inventario/movimientos/?articulo_id=99999').data['count'], 0)
        self.assertEqual(self.client.get('/inventario/movimientos/?tipo=invalido').status_code, 400)

    def test_item_creation_saves_configuration_and_exposes_it_in_stock(self):
        response = self.client.post('/inventario/items/', self.payload(controla=True, codigo='SKU-001', minimo=4), format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['inventario'], {'controla': True, 'codigo': 'SKU-001', 'minimo': 4})
        config = ConfiguracionArticulo.objects.get(articulo_id=response.data['id'])
        self.assertIsNotNone(config.activado_en)
        stock = self.client.get('/inventario/').data['articulos'][0]
        self.assertEqual((stock['controla'], stock['codigo'], stock['minimo']), (True, 'SKU-001', 4))

    def test_duplicate_sku_rolls_back_entire_item_update_and_creation(self):
        existing = Articulos.objects.create(nombre='Existente')
        ConfiguracionArticulo.objects.create(articulo=existing, codigo='UNICO')
        response = self.client.post('/inventario/items/', self.payload(controla=True, codigo='UNICO'), format='json')
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(Articulos.objects.count(), 1)
        second = Articulos.objects.create(nombre='Segundo')
        response = self.client.put(f'/inventario/items/{second.pk}/', self.payload(nombre='Cambio rechazado', controla=True, codigo='UNICO'), format='json')
        self.assertEqual(response.status_code, 400)
        second.refresh_from_db()
        self.assertEqual(second.nombre, 'Segundo')
        self.assertFalse(ConfiguracionArticulo.objects.filter(articulo=second).exists())

    def test_stock_prevents_disabling_via_item_and_keeps_metadata_unchanged(self):
        item = Articulos.objects.create(nombre='Montura', tipo_articulo='1')
        ConfiguracionArticulo.objects.create(articulo=item, controla=True)
        Existencia.objects.create(articulo=item, bodega=principal(), cantidad=2)
        response = self.client.put(f'/inventario/items/{item.pk}/', self.payload(nombre='No guardar', controla=False), format='multipart')
        self.assertEqual(response.status_code, 400, response.data)
        item.refresh_from_db()
        self.assertEqual(item.nombre, 'Montura')
        self.assertTrue(item.inventario_config.controla)

    def test_service_cannot_control_inventory_and_creation_rolls_back(self):
        response = self.client.post('/inventario/items/', self.payload(tipo_articulo='2', controla=True), format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Articulos.objects.exists())

    def test_preserves_configuration_when_multipart_omits_control_fields(self):
        item = Articulos.objects.create(nombre='Montura', tipo_articulo='1')
        config = ConfiguracionArticulo.objects.create(articulo=item, controla=True, codigo='SKU-PRESERVE', minimo=5)
        Existencia.objects.create(articulo=item, bodega=principal(), cantidad=2)
        response = self.client.put(f'/inventario/items/{item.pk}/', self.payload(), format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        config.refresh_from_db()
        self.assertEqual((config.controla, config.codigo, config.minimo), (True, 'SKU-PRESERVE', 5))

    def test_same_sku_can_be_saved_again_without_duplicate_error(self):
        item = Articulos.objects.create(nombre='Montura', tipo_articulo='1')
        ConfiguracionArticulo.objects.create(articulo=item, controla=True, codigo='MISMO')
        response = self.client.put(f'/inventario/items/{item.pk}/', self.payload(controla=True, codigo='MISMO', minimo=3), format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['inventario']['minimo'], 3)
