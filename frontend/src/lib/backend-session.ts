import { buildServerBackendUrl } from '@/utils/js/env';
import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, type SessionUser } from './access';

export function backendFetch(path: string, options: RequestInit = {}) {
  return fetch(buildServerBackendUrl(path), {
    ...options, cache: 'no-store', redirect: 'manual', signal: options.signal ?? AbortSignal.timeout(10000),
  });
}

export async function sessionFor(access?: string, refresh?: string) {
  let token = access;
  let result = token ? await backendFetch('usuarios/auth/me/', { headers: { Authorization: `Bearer ${token}` } }) : null;
  if ((!result || result.status === 401) && refresh) {
    const renewed = await backendFetch('usuarios/auth/refresh/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }),
    });
    if (!renewed.ok) return { user: null, access: undefined, status: renewed.status };
    token = (await renewed.json()).access;
    result = await backendFetch('usuarios/auth/me/', { headers: { Authorization: `Bearer ${token}` } });
  }
  if (!result?.ok) return { user: null, access: undefined, status: result?.status ?? 401 };
  const user = await result.json() as SessionUser;
  return { user, access: token, status: 200 };
}

function cookieOptions() {
  return {
    httpOnly: true, sameSite: 'lax' as const, path: '/',
    secure: process.env.AUTH_COOKIE_SECURE === 'false' ? false : process.env.NODE_ENV === 'production',
  };
}

export function setSessionCookies(response: NextResponse, access: string, refresh?: string) {
  response.cookies.set(ACCESS_COOKIE, access, { ...cookieOptions(), maxAge: 300 });
  if (refresh) response.cookies.set(REFRESH_COOKIE, refresh, { ...cookieOptions(), maxAge: 3 * 24 * 3600 });
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) response.cookies.set(name, '', { ...cookieOptions(), maxAge: 0 });
}

export function requestOrigin(request: Request) {
  // Nginx must forward Host and overwrite X-Forwarded-Proto with its own scheme.
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') === 'https' ? 'https:' : new URL(request.url).protocol;
  if (host && /^[a-zA-Z0-9.\[\]:-]+$/.test(host)) return new URL(`${protocol}//${host}`).origin;
  return new URL(request.url).origin;
}

export function validOrigin(request: Request) {
  return request.headers.get('origin') === requestOrigin(request);
}
