from django.urls import path
from .views import BodegasView, ConfiguracionView, InventarioView, MovimientosView
from .items_views import ItemsView, ItemView

urlpatterns = [
    path('', InventarioView.as_view(), name='inventario-list'),
    path('bodegas/', BodegasView.as_view(), name='inventario-bodegas'),
    path('items/', ItemsView.as_view(), name='inventario-items'),
    path('items/<int:articulo_id>/', ItemView.as_view(), name='inventario-item-detail'),
    path('articulos/<int:articulo_id>/', ConfiguracionView.as_view(), name='inventario-config'),
    path('movimientos/', MovimientosView.as_view(), name='inventario-movimientos'),
]
