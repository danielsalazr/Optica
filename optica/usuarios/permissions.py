from rest_framework.permissions import BasePermission, SAFE_METHODS


def effective_permissions(user):
    if not user or not user.is_authenticated or not user.is_active:
        return set()
    permissions = set(user.get_all_permissions())
    if not user.is_superuser:
        denied = user.perfil_acceso.permisos_denegados.values_list('content_type__app_label', 'codename') if hasattr(user, 'perfil_acceso') else []
        permissions.difference_update(f'{app}.{code}' for app, code in denied)
    return permissions


def allowed(user, *permissions):
    if not user or not user.is_authenticated or not user.is_active:
        return False
    if user.is_superuser:
        return True
    granted = effective_permissions(user)
    return any(
        f'usuarios.{code}' in granted and
        f'usuarios.view_{code.split("_", 1)[1]}' in granted
        for code in permissions
    )


class ApplicationPermission(BasePermission):
    message = 'No tienes permiso para realizar esta accion.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or not user.is_active:
            return False
        if user.is_superuser:
            return True
        name = (request.resolver_match.url_name if request.resolver_match else '') or ''
        read = request.method in SAFE_METHODS
        action = 'view' if read else {'POST': 'add', 'PUT': 'change', 'PATCH': 'change', 'DELETE': 'delete'}.get(request.method)
        if name in ('main', 'informacionGeneral'):
            return allowed(user, 'view_resumen')
        if name in ('reportes', 'reportes-data'):
            return allowed(user, 'view_reportes') if read else False
        if name in ('saldos', 'saldos-detail'):
            return allowed(user, 'view_saldos') if read else False
        if name in ('ventas', 'articulos', 'articuloInfo', 'Empresas', 'infoCliente') and read:
            if name == 'ventas' and request.query_params.get('solo_catalogos') != '1':
                return allowed(user, 'view_ventas')
            # Catalogs support other modules without granting access to their management screens.
            return allowed(user, 'view_ventas', 'view_remisiones', 'view_jornadas', 'view_abonos')
        if name == 'Cliente' and request.method == 'POST':
            return allowed(user, 'add_ventas', 'change_ventas')
        if name == 'Empresas' and request.method == 'POST':
            return allowed(user, 'add_jornadas', 'change_jornadas', 'add_ventas', 'change_ventas')
        if name in ('venta', 'ventanum'):
            return allowed(user, f'{action}_ventas')
        if name in ('venta-estado-pedido', 'venta-estado-pedido-masivo'):
            return allowed(user, 'change_ventas')
        if name in ('abono', 'abonar'):
            if read and request.resolver_match.kwargs.get('factura'):
                return allowed(user, 'view_ventas', 'view_abonos')
            if request.method == 'POST':
                return allowed(user, 'change_ventas', 'add_abonos')
            return allowed(user, f'{action}_abonos')
        if name.startswith('abonos-masivo'):
            return allowed(user, 'add_abonos' if name == 'abonos-masivo-aplicar' else 'view_abonos')
        if name.startswith('inventario'):
            if name == 'inventario-bodegas' and read:
                return allowed(user, 'view_inventario', 'view_ventas')
            if name == 'inventario-movimientos' and request.method == 'POST':
                return allowed(user, 'change_inventario' if request.data.get('tipo') == 'ajuste' else 'add_inventario')
            return allowed(user, f'{action}_inventario')
        if name.startswith('remisiones'):
            return allowed(user, f'{action}_remisiones')
        if name.startswith('jornadas'):
            return allowed(user, f'{action}_jornadas')
        # New API endpoints must explicitly opt into an authorization rule.
        return False
