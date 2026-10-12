from django.db import migrations, transaction


def normalizar_estados(apps, schema_editor):
    Estado = apps.get_model('contabilidad', 'EstadoPedidoVenta')
    Venta = apps.get_model('contabilidad', 'Ventas')
    Pedido = apps.get_model('contabilidad', 'PedidoVenta')
    Historico = apps.get_model('contabilidad', 'HistoricoEstadoPedidoVenta')
    alias = schema_editor.connection.alias
    canonical = {
        7: 'Pedido tomado',
        8: 'Para enviar a Fabricar',
        9: 'Enviado a Fabricar',
        10: 'Listo Para Entrega',
        11: 'Entregado',
    }
    replacements = {1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 8}
    with transaction.atomic(using=alias):
        current = set(Estado.objects.using(alias).select_for_update().values_list('pk', flat=True))
        unknown = current - set(canonical) - set(replacements)
        if unknown:
            raise RuntimeError(f'Estados no reconocidos {sorted(unknown)}. Revisar antes de normalizar el catalogo.')
        for pk, nombre in canonical.items():
            Estado.objects.using(alias).update_or_create(pk=pk, defaults={'nombre': nombre})
        for old, new in replacements.items():
            Venta.objects.using(alias).filter(estado_pedido_id=old).update(estado_pedido_id=new)
            Pedido.objects.using(alias).filter(estado_id=old).update(estado_id=new)
            Historico.objects.using(alias).filter(estado_anterior_id=old).update(estado_anterior_id=new)
            Historico.objects.using(alias).filter(estado_nuevo_id=old).update(estado_nuevo_id=new)
        # Reassign both history references before deleting, avoiding SET_NULL.
        Estado.objects.using(alias).filter(pk__in=replacements).delete()


class Migration(migrations.Migration):
    dependencies = [('contabilidad', '0038_remision_item_importes_originales')]
    # Consolidation loses the distinction between duplicates and cannot be reversed safely.
    operations = [migrations.RunPython(normalizar_estados, atomic=True)]
