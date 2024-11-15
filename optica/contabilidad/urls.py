from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static


from django.views.generic import TemplateView

urlpatterns = [
    # path('', TemplateView.as_view(template_name='index.html'), name="home"),
    path('', views.MainP.as_view(), name="main"),
    path('ventas/', views.VentasP.as_view(), name="ventas"),
    path('abonos/<factura>', views.AbonosP.as_view(), name="abonos"),
    path('abonos/', views.AbonosP.as_view(), name="abonos"),
    path('abonar/<int:factura>', views.abonar, name="abonar"),
    path('admin/', views.AbonosP.as_view(), name="admin"),
    path('reportes/', views.ReportesP.as_view(), name="reportes"),

    
    path('venta/', views.Venta.as_view(), name="venta"),
    path('abono/', views.Abono.as_view(), name="abono"),
    # path('abonar/<int:factura>', views.Abono.as_view(), name="abonar"),
    
] 