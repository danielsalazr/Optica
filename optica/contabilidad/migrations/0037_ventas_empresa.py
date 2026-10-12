from django.db import migrations, models
import django.db.models.deletion
from django.db.models import Count


def asociar_empresas(apps, schema_editor):
    Empresa = apps.get_model('usuarios', 'Empresa')
    Ventas = apps.get_model('contabilidad', 'Ventas')
    alias = schema_editor.connection.alias
    names = Empresa.objects.using(alias).values('nombre').annotate(total=Count('pk')).filter(total=1)
    for row in names:
        company = Empresa.objects.using(alias).get(nombre=row['nombre'])
        Ventas.objects.using(alias).filter(empresa__isnull=True, empresaCliente=row['nombre']).update(empresa_id=company.pk)


class Migration(migrations.Migration):
    dependencies = [('contabilidad', '0036_bodegas'), ('usuarios', '0007_inventario_eliminar_items')]
    operations = [
        migrations.AddField(model_name='ventas', name='empresa', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='ventas_asociadas', to='usuarios.empresa')),
        migrations.RunPython(asociar_empresas, migrations.RunPython.noop),
    ]
