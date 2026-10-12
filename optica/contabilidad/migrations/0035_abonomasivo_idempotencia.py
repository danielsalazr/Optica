from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('contabilidad', '0034_remision_anulacion_fields')]

    operations = [
        migrations.AddField(
            model_name='abonomasivo', name='clave_operacion',
            field=models.UUIDField(blank=True, editable=False, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='abonomasivo', name='solicitud_hash',
            field=models.CharField(blank=True, default='', editable=False, max_length=64),
        ),
    ]
