from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [('usuarios', '0004_perfiles_acceso')]

    def add_inventory_permissions(apps, schema_editor):
        ContentType = apps.get_model('contenttypes', 'ContentType')
        Permission = apps.get_model('auth', 'Permission')
        content_type, _ = ContentType.objects.using(schema_editor.connection.alias).get_or_create(app_label='usuarios', model='perfilacceso')
        for code, name in [('view_inventario', 'Consultar inventario'), ('add_inventario', 'Crear inventario'), ('change_inventario', 'Modificar inventario')]:
            Permission.objects.using(schema_editor.connection.alias).get_or_create(content_type=content_type, codename=code, defaults={'name': name})

    operations = [migrations.RunPython(add_inventory_permissions, migrations.RunPython.noop)]
