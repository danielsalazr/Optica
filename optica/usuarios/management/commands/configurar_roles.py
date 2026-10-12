from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand, CommandError
from usuarios.models import APPLICATION_PERMISSIONS


class Command(BaseCommand):
    help = 'Crea roles iniciales sin sobrescribir permisos de grupos existentes.'

    def handle(self, *args, **options):
        if Permission.objects.filter(content_type__app_label='usuarios', codename__in=[code for code, _ in APPLICATION_PERMISSIONS]).count() != len(APPLICATION_PERMISSIONS):
            raise CommandError('Faltan permisos de la aplicacion. Ejecuta migrate antes de configurar_roles.')
        roles = {
            'Administrador': [code for code, _ in APPLICATION_PERMISSIONS],
            'Vendedor': ['view_ventas', 'add_ventas', 'change_ventas', 'view_remisiones', 'add_remisiones'],
        }
        for name, codes in roles.items():
            group, created = Group.objects.get_or_create(name=name)
            if created:
                group.permissions.set(Permission.objects.filter(content_type__app_label='usuarios', codename__in=codes))
            self.stdout.write(self.style.SUCCESS(f'{name}: {"creado" if created else "existente, permisos conservados"}'))
