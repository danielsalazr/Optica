from django.db import migrations, models
from django.db.models import Q, Value
from django.db.models.functions import Coalesce, Trim


def normalizar_anulacion(apps, schema_editor):
    Venta = apps.get_model('contabilidad', 'Ventas')
    rows = Venta.objects.using(schema_editor.connection.alias).filter(anulado__isnull=True)
    cancelled = rows.annotate(reason=Trim(Coalesce('detalleAnulacion', Value(''), output_field=models.TextField()))).filter(
        Q(estado_id=4) | Q(usuarioAnulacion__isnull=False) | ~Q(reason='')
    )
    cancelled.update(anulado=True)
    rows.update(anulado=False)


def impedir_nulos(apps, schema_editor):
    Venta = apps.get_model('contabilidad', 'Ventas')
    field = Venta._meta.get_field('anulado')
    previous = field.clone()
    previous.set_attributes_from_name(field.name)
    previous.model = Venta
    previous.null = True
    schema_editor.alter_field(Venta, previous, field)


class Migration(migrations.Migration):
    dependencies = [('contabilidad', '0039_normalizar_estados_pedido')]
    operations = [
        migrations.RunPython(normalizar_anulacion, atomic=True),
        migrations.RunPython(impedir_nulos, atomic=False),
    ]
