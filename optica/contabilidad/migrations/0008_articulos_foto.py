# Generated by Django 4.2 on 2025-01-10 00:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contabilidad', '0007_articulos_estadopedidoventa_itemspedidoventa_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='articulos',
            name='foto',
            field=models.ImageField(blank=True, null=True, upload_to='articulos/'),
        ),
    ]
