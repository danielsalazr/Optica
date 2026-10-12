export type SessionUser = {
  id: number; username: string; name: string; is_superuser: boolean; is_staff: boolean;
  groups: string[]; permissions: string[];
};

export const ACCESS_COOKIE = 'optica_access';
export const REFRESH_COOKIE = 'optica_refresh';

export function can(user: SessionUser | null, permission: string) {
  return !!user && (user.is_superuser || (
    user.permissions.includes(`usuarios.${permission}`) &&
    user.permissions.includes(`usuarios.view_${permission.split('_').slice(1).join('_')}`)
  ));
}

export function pagePermissions(path: string): string[] {
  if (path === '/' || path === '/sin-acceso') return [];
  if (path === '/ventas/crearVenta') return ['view_ventas', 'add_ventas'];
  if (/^\/ventas\/\d+\/?$/.test(path)) return ['view_ventas', 'change_ventas'];
  const module = path.split('/')[1];
  if (['ventas', 'remisiones', 'jornadas', 'abonos', 'saldos', 'reportes', 'impresoras', 'inventario'].includes(module)) {
    return module === 'abonos' && path.startsWith('/abonos/masivo')
      ? ['view_abonos', 'add_abonos'] : [`view_${module}`];
  }
  return ['view_resumen'];
}

export function safeReturnPath(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') &&
    !value.startsWith('/login') && !value.startsWith('/api/') ? value : '/';
}
