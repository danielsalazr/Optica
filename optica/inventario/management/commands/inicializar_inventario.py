from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand
from inventario.services import principal


class Command(BaseCommand):
    help = 'Crea la bodega principal y otorga permisos de inventario al grupo Administrador.'

    def handle(self, *args, **options):
        principal()
        grupo = Group.objects.filter(name='Administrador').first()
        if grupo:
            grupo.permissions.add(*Permission.objects.filter(content_type__app_label='usuarios', codename__in=['view_inventario', 'add_inventario', 'change_inventario', 'delete_inventario']))
            grupo.permissions.add(*Permission.objects.filter(content_type__app_label='inventario', codename__in=['view_bodega', 'add_bodega', 'change_bodega', 'delete_bodega']))
        self.stdout.write(self.style.SUCCESS('Inventario inicializado. No se modificaron existencias ni pedidos anteriores.'))
