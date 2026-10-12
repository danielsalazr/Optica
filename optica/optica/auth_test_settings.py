from .settings import *

# Authentication tests run in an isolated database, never against business data.
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': os.environ.get('AUTH_TEST_DB', ':memory:')}}
MIGRATION_MODULES = {'contabilidad': None, 'usuarios': None, 'inventario': None}
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']
