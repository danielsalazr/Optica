# Generated by Django 3.2.7 on 2023-04-30 16:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contabilidad', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='abonos',
            old_name='factura_id',
            new_name='factura',
        ),
        migrations.AlterField(
            model_name='abonos',
            name='cliente_id',
            field=models.BigIntegerField(blank=True, default=0, null=True, verbose_name='Id de cliente'),
        ),
        migrations.AlterField(
            model_name='ventas',
            name='factura',
            field=models.BigIntegerField(primary_key=True, serialize=False),
        ),
    ]
