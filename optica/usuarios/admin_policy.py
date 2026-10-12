from django.contrib import admin
from django.core.exceptions import PermissionDenied


class OperationalReadOnlyAdmin(admin.ModelAdmin):
    """Operations belong to the application API, including for superusers."""
    actions = None

    def has_module_permission(self, request):
        return False

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_readonly_fields(self, request, obj=None):
        return tuple(field.name for field in self.model._meta.fields) + tuple(
            field.name for field in self.model._meta.many_to_many)

    def save_model(self, request, obj, form, change):
        raise PermissionDenied('Gestiona las operaciones desde la aplicacion.')

    def delete_model(self, request, obj):
        raise PermissionDenied('Gestiona las operaciones desde la aplicacion.')

    def delete_queryset(self, request, queryset):
        raise PermissionDenied('Gestiona las operaciones desde la aplicacion.')
