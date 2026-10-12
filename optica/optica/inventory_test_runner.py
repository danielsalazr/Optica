from django.core.exceptions import ImproperlyConfigured
from django.db import connections
from django.test.runner import DiscoverRunner


class InventoryMySQLRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        db = connections['default']
        name = db.settings_dict['TEST']['NAME']
        with db._nodb_cursor() as cursor:
            cursor.execute('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=%s', [name])
            if cursor.fetchone():
                raise ImproperlyConfigured('La base de pruebas ya existe. Elige otro INVENTORY_TEST_DB; no se sobrescribira.')
        return super().setup_databases(**kwargs)
