from django.urls import path
from . import views
from .auth_views import LoginView, RefreshView, SessionView, LogoutView
from django.conf import settings
from django.conf.urls.static import static


from django.views.generic import TemplateView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('auth/me/', SessionView.as_view(), name='auth-me'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    # path('', TemplateView.as_view(template_name='index.html'), name="home"),
    # path('', views.MainP.as_view(), name="main"),
    path('infoCliente/<int:cedula>', views.infoCliente, name="infoCliente"),

    # path('abonar/<int:factura>', views.Abono.as_view(), name="abonar"),

    path('Empresas/', views.Empresas.as_view(), name="Empresas"),
    path('Cliente/', views.Cliente.as_view(), name="Cliente"),
    
]
