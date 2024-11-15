from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static


from django.views.generic import TemplateView

urlpatterns = [
    # path('', TemplateView.as_view(template_name='index.html'), name="home"),
    # path('', views.MainP.as_view(), name="main"),
    path('infoCliente/<int:cedula>', views.infoCliente, name="infoCliente"),

    # path('abonar/<int:factura>', views.Abono.as_view(), name="abonar"),
    
] 