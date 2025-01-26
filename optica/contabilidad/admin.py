from django.contrib import admin
from django.contrib import admin
from .models import MediosDePago, EstadoVenta, Ventas, Abonos, Articulos, FotosArticulos
from django.forms import NumberInput
from django.utils.html import mark_safe

from rich.console import Console
console = Console()

# from PIL import Image
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




admin.site.register(FotosArticulos)

class FotosInline(admin.StackedInline):
    model = FotosArticulos
    extra = 0
    readonly_fields = ['cover_preview']

    def cover_preview(self, obj):
        # console.log("activadp")
        # console.log(obj)
        # console.log(obj.foto)
        if obj:
            return mark_safe(f'<img src="http://localhost:8000/media/{obj.foto}" style="width: 200px; height: auto;" />')
        return "No image available"

    cover_preview.short_description = "Cover Preview"



@admin.register(Articulos)
class ArticulosAdmin(admin.ModelAdmin):
    inlines = [FotosInline]

    list_display = (
        'id',
        'nombre',
        'descripcion',
        'precio',
        # 'foto',
        'cover_preview',
    )

    class Media:
        js = ('js/utilsAdmin.js',)

    
    def cover_preview(self, obj):
        # Verifica si el artículo tiene imágenes asociadas
        console.log(obj.articuloFoto.all())
        try:
            fotos = obj.articuloFoto.all() #first()  # Obtén la primera foto relacionada
            # console.log(fotos.foto)
            if len(fotos) > 0:  # Verifica si existe una foto
                # return mark_safe(f'<img src="http://localhost:8000/media/{fotos.foto}" style="width: 100px; height: auto;" />')
                imagenes_html = ''.join([
                    f'<img src="http://localhost:8000/media/{foto.foto}" style="width: 100px; height: auto; margin-right: 5px;" />'
                    for foto in fotos
                ])
                console.log(imagenes_html)
                return mark_safe(imagenes_html)
            return "No image available"
        except:
            pass

    
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