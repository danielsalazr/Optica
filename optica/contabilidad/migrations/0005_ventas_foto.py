# Generated by Django 4.2 on 2025-01-09 17:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contabilidad', '0004_alter_abonos_options_alter_estadoventa_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='ventas',
            name='foto',
            field=models.ImageField(blank=True, null=True, upload_to='fotos_ventas/'),
        ),
    ]
