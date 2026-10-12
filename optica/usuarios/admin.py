from django.contrib import admin
from .models import (Clientes, Empresa)
from .models import PerfilAcceso, APPLICATION_PERMISSIONS


@admin.register(PerfilAcceso)
class PerfilAccesoAdmin(admin.ModelAdmin):
    list_display = ('usuario',)
    search_fields = ('usuario__username',)
    autocomplete_fields = ('usuario',)
    filter_horizontal = ('permisos_denegados',)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == 'permisos_denegados':
            from django.contrib.auth.models import Permission
            kwargs['queryset'] = Permission.objects.filter(content_type__app_label='usuarios', codename__in=[code for code, _ in APPLICATION_PERMISSIONS])
        return super().formfield_for_manytomany(db_field, request, **kwargs)
from django.forms import NumberInput
# Register your models here.

# Register your models here.
""" class DocumentsAdmin(admin.ModelAdmin):
    form = Ingreso_Activo """

# PARAMETRIZACIONES
# admin.site.register(Clientes)
# admin.site.register(WarehouseCustomer)
# admin.site.register(Company)

class CustomClientesAdmin(admin.ModelAdmin):
    list_display = (
        'cedula',
        'nombre',
        # 'apellido',
        'telefono',
        'email',
        'fechaRegistro',
    )

    def formfield_for_dbfield(self, db_field, **kwargs):
        if db_field.name == 'id':
            kwargs['widget'] = NumberInput(attrs={'style': 'width: 200px;'})
        return super().formfield_for_dbfield(db_field, **kwargs)

admin.site.register(Clientes, CustomClientesAdmin)

    
class CustomEmpresaAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'nombre',
        'email',
        'nit',
        'personas_contacto',
    )

    def formfield_for_dbfield(self, db_field, **kwargs):
        if db_field.name == 'id':
            kwargs['widget'] = NumberInput(attrs={'style': 'width: 200px;'})
        return super().formfield_for_dbfield(db_field, **kwargs)

admin.site.register(Empresa, CustomEmpresaAdmin)

# Register your models here.
