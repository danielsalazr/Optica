import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { can } from './access';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './access';
import { backendFetch, sessionFor } from './backend-session';

const serverSession = cache(async () => {
  const jar = await cookies();
  return sessionFor(jar.get(ACCESS_COOKIE)?.value, jar.get(REFRESH_COOKIE)?.value);
});

export async function currentUser() {
  return (await serverSession()).user;
}

export async function requirePermission(permission: string) {
  const session = await serverSession();
  if (!session.user) {
    if (session.status >= 500) throw new Error('El servicio de autenticacion no esta disponible.');
    redirect('/login');
  }
  if (!can(session.user, permission)) redirect('/sin-acceso');
  return session.user;
}

export async function serverApiFetch(path: string, options: RequestInit = {}) {
  const session = await serverSession();
  if (!session.user || !session.access) return new Response(JSON.stringify({ detail: 'Inicia sesion para continuar.' }), { status: session.status, headers: { 'Content-Type': 'application/json' } });
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${session.access}`);
  return backendFetch(path, { ...options, headers });
}
