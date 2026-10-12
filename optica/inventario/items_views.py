from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from contabilidad.models import Articulos, FotosArticulos
from .models import ConfiguracionArticulo, Existencia
from .services import InventoryAtomicMixin
from .views import guardar_configuracion


class OptionalBooleanField(serializers.BooleanField):
    default_empty_html = serializers.empty


class ItemSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(max_length=100)
    precio = serializers.IntegerField(min_value=0, max_value=2147483647)
    tipo_articulo = serializers.ChoiceField(choices=Articulos.OPCIONES, allow_null=True)
    fotos = serializers.SerializerMethodField()
    imagenes = serializers.ListField(child=serializers.ImageField(), write_only=True, required=False)
    quitar_fotos = serializers.ListField(child=serializers.IntegerField(min_value=1), write_only=True, required=False)
    inventario = serializers.SerializerMethodField()
    controla = OptionalBooleanField(write_only=True, required=False)
    codigo = serializers.CharField(max_length=60, allow_blank=True, allow_null=True, write_only=True, required=False)
    minimo = serializers.IntegerField(min_value=0, max_value=2147483647, write_only=True, required=False)

    class Meta:
        model = Articulos
        fields = ['id', 'nombre', 'descripcion', 'precio', 'tipo_articulo', 'fotos', 'imagenes', 'quitar_fotos', 'inventario', 'controla', 'codigo', 'minimo']
        read_only_fields = ['id']

    def get_fotos(self, obj):
        return [{'id': foto.pk, 'url': foto.foto.url} for foto in obj.articuloFoto.all()]

    def get_inventario(self, obj):
        config = getattr(obj, 'inventario_config', None)
        return {'controla': config.controla if config else False, 'codigo': config.codigo if config else '', 'minimo': config.minimo if config else 0}

    def extract_config(self, validated_data):
        return {field: validated_data.pop(field) for field in ('controla', 'codigo', 'minimo') if field in validated_data}

    def save_config(self, item, data):
        if data:
            current = self.get_inventario(item)
            current.update(data)
            current['codigo'] = (current.get('codigo') or '').strip() or None
            guardar_configuracion(item, current)
            # A previously cached reverse OneToOne must not return stale configuration.
            item._state.fields_cache.pop('inventario_config', None)

    def validate(self, attrs):
        removed = attrs.get('quitar_fotos', [])
        if removed and (not self.instance or self.instance.articuloFoto.filter(pk__in=removed).count() != len(set(removed))):
            raise serializers.ValidationError({'quitar_fotos': 'Las fotos no pertenecen a este articulo.'})
        if self.instance and attrs.get('tipo_articulo', self.instance.tipo_articulo) != self.instance.tipo_articulo:
            if ConfiguracionArticulo.objects.filter(articulo=self.instance, controla=True).exists():
                raise serializers.ValidationError({'tipo_articulo': 'Desactiva el control de inventario antes de cambiar el tipo.'})
        return attrs

    def create(self, validated_data):
        images = validated_data.pop('imagenes', [])
        validated_data.pop('quitar_fotos', None)
        config = self.extract_config(validated_data)
        item = super().create(validated_data)
        self.save_config(item, config)
        for image in images:
            FotosArticulos.objects.create(articulo=item, foto=image)
        return item

    def update(self, instance, validated_data):
        images = validated_data.pop('imagenes', [])
        removed = validated_data.pop('quitar_fotos', [])
        config = self.extract_config(validated_data)
        item = super().update(instance, validated_data)
        self.save_config(item, config)
        item.articuloFoto.filter(pk__in=removed).delete()
        for image in images:
            FotosArticulos.objects.create(articulo=item, foto=image)
        return item


class ItemsView(InventoryAtomicMixin, APIView):
    def get(self, request):
        items = Articulos.objects.select_related('inventario_config').prefetch_related('articuloFoto').order_by('-id')
        return Response(ItemSerializer(items, many=True).data)

    def post(self, request):
        serializer = ItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)


class ItemView(InventoryAtomicMixin, APIView):
    def get(self, request, articulo_id):
        return Response(ItemSerializer(get_object_or_404(Articulos, pk=articulo_id)).data)

    def locked_item(self, articulo_id):
        # Match inventory's lock order: configuration before article/stock.
        get_object_or_404(Articulos, pk=articulo_id)
        ConfiguracionArticulo.objects.get_or_create(articulo_id=articulo_id)
        list(ConfiguracionArticulo.objects.select_for_update().filter(articulo_id=articulo_id))
        return get_object_or_404(Articulos.objects.select_for_update(), pk=articulo_id)

    def put(self, request, articulo_id):
        serializer = ItemSerializer(self.locked_item(articulo_id), data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, articulo_id):
        item = self.locked_item(articulo_id)
        stocks = list(Existencia.objects.select_for_update().filter(articulo=item))
        if any(stock.cantidad or stock.reservado or stock.movimiento_set.exists() or stock.reserva_set.exists() for stock in stocks):
            return Response({'detail': 'No se puede eliminar un articulo con stock, reservas o movimientos.'}, status=409)
        ignored = {ConfiguracionArticulo, Existencia, FotosArticulos}
        for relation in Articulos._meta.related_objects:
            if relation.related_model not in ignored and relation.related_model.objects.filter(**{relation.field.name: item}).exists():
                return Response({'detail': 'No se puede eliminar un articulo utilizado en ventas o pedidos.'}, status=409)
        try:
            with transaction.atomic():
                ConfiguracionArticulo.objects.filter(articulo=item).delete()
                Existencia.objects.filter(articulo=item).delete()
                item.articuloFoto.all().delete()
                item.delete()
        except (ProtectedError, IntegrityError):
            return Response({'detail': 'El articulo tiene registros relacionados y no puede eliminarse.'}, status=409)
        return Response(status=204)
