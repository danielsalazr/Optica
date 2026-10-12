from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management import call_command
from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient
from .models import PerfilAcceso
from .permissions import allowed


class AuthenticationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('configurar_roles', verbosity=0)
        cls.seller = get_user_model().objects.create_user('seller', password='test-password-only')
        cls.seller.groups.add(Group.objects.get(name='Vendedor'))
        cls.admin = get_user_model().objects.create_superuser('admin', password='test-password-only')

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def login(self, username='seller'):
        response = self.client.post('/usuarios/auth/login/', {'username': username, 'password': 'test-password-only'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
        return response.data

    def test_private_api_requires_login(self):
        for path in ('/venta/', '/ventas/', '/abono/', '/remisiones/', '/jornadas/', '/usuarios/Empresas/', '/informacionGeneral/'):
            self.assertEqual(self.client.get(path).status_code, 401, path)

    def test_invalid_credentials(self):
        response = self.client.post('/usuarios/auth/login/', {'username': 'seller', 'password': 'wrong'}, format='json')
        self.assertEqual(response.status_code, 401)

    def test_session_lifetime_is_three_days_with_short_access_tokens(self):
        from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

        tokens = self.login()
        refresh = RefreshToken(tokens['refresh'])
        access = AccessToken(tokens['access'])
        self.assertEqual(refresh['exp'] - refresh['iat'], 3 * 24 * 3600)
        self.assertEqual(access['exp'] - access['iat'], 5 * 60)

    def test_seller_permissions_and_catalogs(self):
        self.login()
        response = self.client.get('/usuarios/auth/me/')
        self.assertIn('usuarios.view_ventas', response.data['permissions'])
        self.assertNotIn('usuarios.view_abonos', response.data['permissions'])
        self.assertEqual(self.client.get('/ventas/?solo_catalogos=1').status_code, 200)
        for path in ('/abono/', '/abonos/masivo/', '/jornadas/', '/reportes/data/', '/informacionGeneral/'):
            self.assertEqual(self.client.get(path).status_code, 403, path)
        self.assertEqual(self.client.delete('/venta/', {}, format='json').status_code, 403)
        self.assertEqual(self.client.delete('/remisiones/1/', {}, format='json').status_code, 403)

    def test_individual_denial_overrides_group_and_direct_grant(self):
        permission = Permission.objects.get(content_type__app_label='usuarios', codename='view_ventas')
        self.seller.user_permissions.add(permission)
        PerfilAcceso.objects.create(usuario=self.seller).permisos_denegados.add(permission)
        self.login()
        self.assertEqual(self.client.get('/venta/').status_code, 403)
        self.assertEqual(self.client.post('/venta/', {}, format='json').status_code, 403)
        self.assertNotIn('usuarios.view_ventas', self.client.get('/usuarios/auth/me/').data['permissions'])

    def test_superuser_and_administrator_group(self):
        self.login('admin')
        self.assertTrue(self.client.get('/usuarios/auth/me/').data['is_superuser'])
        self.assertTrue(allowed(self.admin, 'delete_ventas'))
        user = get_user_model().objects.create_user('manager')
        user.groups.add(Group.objects.get(name='Administrador'))
        self.assertTrue(allowed(user, 'delete_remisiones'))
        self.assertTrue(allowed(user, 'view_reportes'))

    def test_permission_change_applies_to_existing_access_token(self):
        self.login()
        permission = Permission.objects.get(content_type__app_label='usuarios', codename='view_ventas')
        PerfilAcceso.objects.create(usuario=self.seller).permisos_denegados.add(permission)
        self.assertEqual(self.client.get('/venta/').status_code, 403)

    def test_refresh_and_logout(self):
        tokens = self.login()
        self.client.credentials()
        response = self.client.post('/usuarios/auth/refresh/', {'refresh': tokens['refresh']}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.post('/usuarios/auth/logout/', {'refresh': tokens['refresh']}, format='json').status_code, 204)
        self.assertEqual(self.client.post('/usuarios/auth/refresh/', {'refresh': tokens['refresh']}, format='json').status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        self.assertEqual(self.client.get('/usuarios/auth/me/').status_code, 401)

    def test_password_change_revokes_access_and_refresh(self):
        tokens = self.login()
        self.seller.set_password('a-new-test-password')
        self.seller.save()
        self.assertEqual(self.client.get('/usuarios/auth/me/').status_code, 401)
        self.client.credentials()
        self.assertEqual(self.client.post('/usuarios/auth/refresh/', {'refresh': tokens['refresh']}, format='json').status_code, 401)

    def test_inactive_user_cannot_refresh(self):
        tokens = self.login()
        self.seller.is_active = False
        self.seller.save()
        self.client.credentials()
        self.assertEqual(self.client.post('/usuarios/auth/refresh/', {'refresh': tokens['refresh']}, format='json').status_code, 401)

    def test_public_tracking_and_appointments_stay_public(self):
        self.assertEqual(self.client.get('/api/tracking/venta/').status_code, 400)
        self.assertEqual(self.client.get('/api/citas/proximas/').status_code, 200)

    def test_role_command_does_not_reset_custom_permissions(self):
        group = Group.objects.get(name='Vendedor')
        group.permissions.clear()
        call_command('configurar_roles', verbosity=0)
        self.assertEqual(group.permissions.count(), 0)

    def test_login_rate_limit(self):
        for _ in range(10):
            response = self.client.post('/usuarios/auth/login/', {'username': 'seller', 'password': 'wrong'}, format='json')
            self.assertEqual(response.status_code, 401)
        response = self.client.post('/usuarios/auth/login/', {'username': 'seller', 'password': 'wrong'}, format='json')
        self.assertEqual(response.status_code, 429)

    def test_refresh_rejects_malformed_token(self):
        self.assertEqual(self.client.post('/usuarios/auth/refresh/', {'refresh': {}}, format='json').status_code, 401)
