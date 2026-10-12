from django.db import migrations, models


def conservar_importes(apps, schema_editor):
    Item = apps.get_model('contabilidad', 'RemisionItem')
    alias = schema_editor.connection.alias
    fields = ['precio_articulo_original', 'cantidad_venta_original',
              'total_articulo_original', 'descuento_original', 'tipo_descuento_original']
    batch = []
    # Existing documents can only preserve the values available at migration time.
    for row in Item.objects.using(alias).select_related('item_venta').iterator(chunk_size=500):
        item = row.item_venta
        row.precio_articulo_original = item.precio_articulo or 0
        row.cantidad_venta_original = item.cantidad or 0
        row.total_articulo_original = item.totalArticulo or 0
        row.descuento_original = item.descuento or 0
        row.tipo_descuento_original = item.tipo_descuento or 'precio'
        batch.append(row)
        if len(batch) == 500:
            Item.objects.using(alias).bulk_update(batch, fields)
            batch = []
    if batch:
        Item.objects.using(alias).bulk_update(batch, fields)


class Migration(migrations.Migration):
    dependencies = [('contabilidad', '0037_ventas_empresa')]
    operations = [
        migrations.AddField(model_name='remisionitem', name='precio_articulo_original', field=models.IntegerField(editable=False, null=True)),
        migrations.AddField(model_name='remisionitem', name='cantidad_venta_original', field=models.IntegerField(editable=False, null=True)),
        migrations.AddField(model_name='remisionitem', name='total_articulo_original', field=models.IntegerField(editable=False, null=True)),
        migrations.AddField(model_name='remisionitem', name='descuento_original', field=models.IntegerField(editable=False, null=True)),
        migrations.AddField(model_name='remisionitem', name='tipo_descuento_original', field=models.CharField(editable=False, max_length=20, null=True)),
        migrations.RunPython(conservar_importes, migrations.RunPython.noop),
    ]
