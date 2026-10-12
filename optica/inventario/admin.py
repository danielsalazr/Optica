from django.contrib import admin
from django.db import transaction
from usuarios.admin_policy import OperationalReadOnlyAdmin
from .models import Bodega, ConfiguracionArticulo, Existencia, Movimiento, Reserva


@admin.register(Bodega)
class BodegaAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'activa']
    list_filter = ['activa']
    search_fields = ['nombre']
    actions = None

    def has_delete_permission(self, request, obj=None):
        return super().has_delete_permission(request, obj) and (obj is None or obj.pk != 1)

    @transaction.atomic
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        if request.method == 'POST' and object_id:
            Bodega.objects.select_for_update().filter(pk=object_id).first()
        return super().changeform_view(request, object_id, form_url, extra_context)


class ConsultaInventario(OperationalReadOnlyAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


for model in (ConfiguracionArticulo, Existencia, Movimiento, Reserva):
    admin.site.register(model, ConsultaInventario)
