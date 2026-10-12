from django.contrib import admin
from django.contrib import admin
from usuarios.admin_policy import OperationalReadOnlyAdmin
from django import forms
from django.db import transaction
from django.core.exceptions import ValidationError as FormValidationError
from rest_framework.exceptions import ValidationError as ApiValidationError
from .serializers import AbonoSerializer
from .payments import sync_payments, validate_payment_change
from .models import (
    MediosDePago,
    EstadoVenta,
    Ventas,
    Abonos,
    Articulos,
    FotosArticulos,
    FotosVentas,
    ItemsVenta,
    Saldos,
    HistoricoSaldos,
    EstadoPedidoVenta,
    HistoricoEstadoPedidoVenta,
    PedidoVenta,
    ItemsPEdidoVenta,
    TipoVenta,
    Remision,
    RemisionItem,
    Jornada,
    Vendedor,
    CitaAgenda,
    CitaAgendaRegistro,
)
from django.forms import NumberInput
from django.utils.html import mark_safe

from rich.console import Console
console = Console()


from django.contrib.admin import AdminSite
from django.contrib.admin.apps import AdminConfig

class CustomAdminSite(AdminSite):
    site_header = "Administración Personalizada"
    site_title = "Administración Personalizada"
    index_title = "Bienvenido a la Administración Personalizada"

custom_admin_site = CustomAdminSite(name='custom_admin')


# class MiAdminConfig(AdminConfig):
#     index_title = 'Panel de Administración'
#     # index_template = 'admin/custom_index.html'

# # admin.site.index_template = 'admin/custom_index.html'
# admin.site.site_header = 'Panel de Administración'
# admin.site.site_title = 'Panel de Administración'
# custom_admin_site.register(Abonos)


# from PIL import Image
# Register your models here.

# Register your models here.
""" class DocumentsAdmin(admin.ModelAdmin):
    form = Ingreso_Activo """

# PARAMETRIZACIONES
# admin.site.register(MediosDePago)
# admin.site.register(Abonos)

class AbonoAdminForm(forms.ModelForm):
    class Meta:
        model = Abonos
        fields = '__all__'

    def clean(self):
        cleaned = super().clean()
        if self.errors:
            return cleaned
        data = {key: value.pk if hasattr(value, 'pk') else value for key, value in cleaned.items()}
        if self.instance.pk:
            data['venta'] = self.instance.venta_id
        try:
            serializer = AbonoSerializer(self.instance if self.instance.pk else None, data=data, partial=bool(self.instance.pk))
            serializer.is_valid(raise_exception=True)
        except ApiValidationError as error:
            raise FormValidationError(str(error.detail))
        return cleaned


@admin.register(Abonos)
class AbonosAdmin(OperationalReadOnlyAdmin):
    form = AbonoAdminForm
    actions = None

    def get_readonly_fields(self, request, obj=None):
        return super().get_readonly_fields(request, obj)

    @transaction.atomic
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        if request.method == 'POST':
            sale_id = request.POST.get('venta')
            if object_id:
                sale_id = Abonos.objects.filter(pk=object_id).values_list('venta_id', flat=True).first()
            if sale_id:
                Ventas.objects.select_for_update().filter(pk=sale_id).first()
        return super().changeform_view(request, object_id, form_url, extra_context)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        sync_payments(obj.venta)

    def has_delete_permission(self, request, obj=None):
        contado = obj and obj.venta and (obj.venta.condicion_pago or '').strip().lower() == 'contado'
        return super().has_delete_permission(request, obj) and not (obj and obj.abono_masivo_id) and not contado

    @transaction.atomic
    def delete_model(self, request, obj):
        sale = Ventas.objects.select_for_update().get(pk=obj.venta_id)
        validate_payment_change(sale, obj, delete=True)
        super().delete_model(request, obj)
        sync_payments(sale)
    list_display = (
        'id',
        'n_pedidoVenta',
        'cliente_id',
        'nombre',
        # 'precio',
        'precio_moneda',
        'medioDePago',
        'fecha',
    )

    list_display_links = ('id', 'n_pedidoVenta',)
    search_fields = ('id', 'n_pedidoVenta',)

# CustomAdminSite.register(Abonos, AbonosAdmin)


# @admin.register(Saldos, site=custom_admin_site)
@admin.register(Saldos,)
class SaldosAdmin(OperationalReadOnlyAdmin):
    actions = None
    readonly_fields = ('venta', 'cliente', 'saldo', 'fecha_Vencimiento')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
    list_display = (
        'id',
        'venta',
        'cliente',
        'saldo',
    )
    list_display_links = ('id', 'venta', 'cliente',)
    search_fields = ('venta', 'cliente',)


@admin.register(HistoricoSaldos)
class HistoricoSaldosAdmin(OperationalReadOnlyAdmin):
    list_display = (
        'id',
        'venta',
        'cliente',
        'saldo',
        'fecha',
    )
    list_display_links = ('id', 'venta', 'cliente',)
    search_fields = ('venta', 'cliente',)


@admin.register(ItemsVenta)
class ItemsVentaAdmin(OperationalReadOnlyAdmin):
    list_display = (
        'venta',
        'articulo',
        'cantidad',
        'precio_articulo',
        'descuento',
        'totalArticulo',
    )
    search_fields = (
        'venta__id',
        'venta__cliente_id',
        'articulo__nombre',
        'articulo__id',
    )

@admin.register(TipoVenta)
class TipoVentaAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'nombre',
        
    )

@admin.register(Ventas)
class VentasAdmin(OperationalReadOnlyAdmin):
    list_display = (
        'id',
        'cliente_id',
        'nombre',
        'precio_venta',
        'abono_inicial',
        'empresaCliente',
        'vendedor',
        'fecha',
        'estado',
        'foto',
    )

    search_fields = ('id',)


@admin.register(Vendedor)
class VendedorAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'cedula', 'celular')
    search_fields = ('nombre', 'cedula', 'celular')

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

    def get_readonly_fields(self, request, obj=None):
        from inventario.models import ConfiguracionArticulo
        fields = super().get_readonly_fields(request, obj)
        if obj and ConfiguracionArticulo.objects.filter(articulo=obj, controla=True).exists():
            return (*fields, 'tipo_articulo')
        return fields

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



@admin.register(EstadoPedidoVenta)
class EstadoPedidoVentaAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        #'cliente',
        'nombre',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(HistoricoEstadoPedidoVenta)
class HistoricoEstadoPedidoVentaAdmin(OperationalReadOnlyAdmin):
    list_display = ('id', 'venta', 'estado_anterior', 'estado_nuevo', 'origen', 'usuario', 'fecha')
    search_fields = ('venta__id', 'venta__cliente_id', 'estado_anterior__nombre', 'estado_nuevo__nombre')
    list_filter = ('origen', 'estado_nuevo', 'fecha')


@admin.register(PedidoVenta)
class PedidoVentaAdmin(OperationalReadOnlyAdmin):
    list_display = (
        'id',
        #'cliente',
        'venta',
        'estado',
        'fecha',
    )


@admin.register(ItemsPEdidoVenta)
class ItemsPEdidoVentaAdmin(OperationalReadOnlyAdmin):
    list_display = (
        'id',
        'pedido',
        'articulo',
        'cantidad',
    )


@admin.register(FotosVentas)
class FotosVentasAdmin(OperationalReadOnlyAdmin):
    list_display = ('id', 'venta', 'foto')
    search_fields = ('venta__id',)


@admin.register(Remision)
class RemisionAdmin(OperationalReadOnlyAdmin):
    list_display = (
        'id',
        'venta',
        'cliente_id',
        'fecha',
        'observacion',
        'creado_en',
    )
    list_filter = ('fecha',)
    search_fields = ('id', 'venta__id', 'cliente_id')


@admin.register(RemisionItem)
class RemisionItemAdmin(OperationalReadOnlyAdmin):
    list_display = (
        'id',
        'remision',
        'item_venta',
        'cantidad',
        'articulo_nombre',
    )
    autocomplete_fields = ('item_venta',)

    def articulo_nombre(self, obj):
        return obj.item_venta.articulo.nombre

    articulo_nombre.short_description = "Articulo"


@admin.register(Jornada)
class JornadaAdmin(OperationalReadOnlyAdmin):
    list_display = ('id', 'empresa', 'sucursal', 'fecha', 'estado', 'responsable')
    list_filter = ('estado', 'fecha', 'empresa', 'sucursal')
    search_fields = ('empresa__nombre', 'sucursal')
@admin.register(CitaAgenda)
class CitaAgendaAdmin(admin.ModelAdmin):
    list_display = ("title", "fecha", "time_window", "is_active")
    list_filter = ("is_active", "fecha")
    search_fields = ("title", "nota")
    readonly_fields = ("hero_preview", "hero_image", "created_at", "updated_at")
    fieldsets = (
        (
            "Información de la cita",
            {
                "fields": (
                    "title",
                    "nota",
                    ("fecha", "hora_inicio", "hora_fin"),
                    "is_active",
                )
            },
        ),
        (
            "Imagen de presentación",
            {
                "fields": (
                    "background_image",
                    "hero_preview",
                    "hero_image",
                )
            },
        ),
    )

    def time_window(self, obj):
        return obj.time_range

    time_window.short_description = "Horario"

    def hero_preview(self, obj):
        if obj.hero_image:
            return mark_safe(
                f'<img src="{obj.hero_image.url}" style="max-width:320px;border-radius:18px;" />'
            )
        return "Se generará automáticamente al guardar."

    hero_preview.short_description = "Vista previa"


@admin.register(CitaAgendaRegistro)
class CitaAgendaRegistroAdmin(OperationalReadOnlyAdmin):
    list_display = (
        "nombre_completo",
        "identificacion",
        "celular",
        "cita",
        "hora_confirmada",
        "created_at",
    )
    list_filter = ("cita", "created_at")
    search_fields = ("nombre_completo", "identificacion", "celular")
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
