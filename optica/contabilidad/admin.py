from django.contrib import admin
from django.contrib import admin
from .models import MediosDePago, EstadoVenta, Ventas, Abonos, Articulos 
from django.forms import NumberInput
# Register your models here.

# Register your models here.
""" class DocumentsAdmin(admin.ModelAdmin):
    form = Ingreso_Activo """

# PARAMETRIZACIONES
# admin.site.register(MediosDePago)
# admin.site.register(Abonos)

@admin.register(Abonos)
class AbonosAdmin(admin.ModelAdmin):
    list_display = (
        'n_Factura',
        'cliente_id',
        'nombre',
        # 'precio',
        'precio_moneda',
        'medioDePago',
        'fecha',
    )

    search_fields = ('factura',)

@admin.register(Ventas)
class VentasAdmin(admin.ModelAdmin):
    list_display = (
        'factura',
        'cliente_id',
        'nombre',
        'precio_moneda',
        'estado',
        'foto',
    )

    search_fields = ('factura',)

@admin.register(MediosDePago)
class MediosDePagoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'nombre',
        'imagen',
    )


@admin.register(EstadoVenta)
class EstadoVentaAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'nombre',
    )


@admin.register(Articulos)
class ArticulosAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'nombre',
        'descripcion',
        'precio',
        'foto',
    )

    class Media:
        js = ('js/utilsAdmin.js',)

    
# @admin.register(MediosDePago)
# class MediosDePagoAdmin(admin.ModelAdmin):
#     list_display = (
#         'id',
#         'nombre',
#         'apellido',
#         'telefono',
#         'email',
#         'fechaRegistro',
#     )

# Register your models here.
# MediosDePago




# from .models import TuModelo

# class TuModeloAdmin(admin.ModelAdmin):
#     def formfield_for_dbfield(self, db_field, **kwargs):
#         if isinstance(db_field, models.DecimalField):
#             kwargs['widget'] = NumberInput(attrs={'style': 'width: 20em;'})
#         return super().formfield_for_dbfield(db_field, **kwargs)

# admin.site.register(TuModelo, TuModeloAdmin)