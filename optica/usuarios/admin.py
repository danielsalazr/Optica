from django.contrib import admin
from .models import (Clientes, Empresa)
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
