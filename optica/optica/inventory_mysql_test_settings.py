from copy import deepcopy
from django.core.exceptions import ImproperlyConfigured
from .settings import *

# Never create/drop a test database on a production or remote server.
name = os.environ.get('INVENTORY_TEST_DB', '')
if PRODUCCION or DATABASES['default']['HOST'] not in ('localhost', '127.0.0.1'):
    raise ImproperlyConfigured('Las pruebas de inventario requieren MySQL local y PRODUCCION=False.')
if not name.startswith('test_optica_inventory_') or not name.replace('_', '').isalnum() or len(name) > 64:
    raise ImproperlyConfigured('Define INVENTORY_TEST_DB=test_optica_inventory_<identificador_unico>.')
DATABASES = deepcopy(DATABASES)
DATABASES['default']['NAME'] = 'inventory_audit_unused'
DATABASES['default']['TEST'] = {'NAME': name, 'CHARSET': 'utf8mb4'}
DATABASES['default']['CONN_MAX_AGE'] = 0
MIGRATION_MODULES = {app: None for app in ['contabilidad', 'usuarios', 'inventario', 'auth', 'contenttypes', 'admin', 'sessions', 'token_blacklist']}
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']
TEST_RUNNER = 'optica.inventory_test_runner.InventoryMySQLRunner'
