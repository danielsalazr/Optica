from django import forms
from django.contrib import admin

from .models import ConfiguracionArticulo


def affects_inventory(obj):
    if obj is None:
        return False
    model = obj._meta.model_name
    if model == 'ventas':
        articles = obj.idVenta.values_list('articulo_id', flat=True)
    elif model == 'itemsventa':
        articles = [obj.articulo_id]
    elif model == 'remision':
        articles = obj.venta.idVenta.values_list('articulo_id', flat=True)
    elif model == 'remisionitem':
        articles = [obj.item_venta.articulo_id]
    else:
        return False
    return ConfiguracionArticulo.objects.filter(articulo_id__in=articles, controla=True).exists()


class InventoryProtectedAdmin(admin.ModelAdmin):
    # Operational changes must use the transactional API, not standalone admin edits.
    actions = None

    def has_change_permission(self, request, obj=None):
        return not affects_inventory(obj) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return not affects_inventory(obj) and super().has_delete_permission(request, obj)

    def get_form(self, request, obj=None, **kwargs):
        base = super().get_form(request, obj, **kwargs)

        class GuardedForm(base):
            def clean(self):
                cleaned = super().clean()
                article = cleaned.get('articulo')
                sale = cleaned.get('venta')
                item = cleaned.get('item_venta')
                controlled = article and ConfiguracionArticulo.objects.filter(articulo=article, controla=True).exists()
                if controlled or affects_inventory(sale) or affects_inventory(item):
                    raise forms.ValidationError('Este articulo lleva inventario. Gestiona ventas y remisiones desde la aplicacion para conservar las reservas y los movimientos.')
                return cleaned

        return GuardedForm
