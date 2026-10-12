import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/access';
import { backendFetch, clearSessionCookies, sessionFor, setSessionCookies, validOrigin } from '@/lib/backend-session';

async function proxy(request: NextRequest) {
  if (!['GET', 'HEAD'].includes(request.method) && !validOrigin(request)) return NextResponse.json({ detail: 'Origen no permitido.' }, { status: 403 });
  const path = request.nextUrl.searchParams.get('path') || '';
  if (!/^[a-zA-Z0-9_/-]+(?:\?[^#]*)?$/.test(path) || path.startsWith('/') || path.startsWith('usuarios/auth/')) return NextResponse.json({ detail: 'Ruta no permitida.' }, { status: 400 });
  try {
    const session = await sessionFor(request.cookies.get(ACCESS_COOKIE)?.value, request.cookies.get(REFRESH_COOKIE)?.value);
    if (!session.user || !session.access) {
      const response = NextResponse.json({ detail: 'Inicia sesion para continuar.' }, { status: session.status });
      if (session.status === 401) clearSessionCookies(response);
      return response;
    }
    const headers = new Headers({ Authorization: `Bearer ${session.access}`, Accept: 'application/json' });
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
    if (body && body.byteLength > 25 * 1024 * 1024) return NextResponse.json({ detail: 'Los archivos superan el limite de 25 MB.' }, { status: 413 });
    const upstream = await backendFetch(path, { method: request.method, headers, body });
    if (upstream.status >= 500) return NextResponse.json({ detail: 'Hubo un inconveniente en el servidor. No se pudo completar la operacion.' }, { status: upstream.status });
    const response = new NextResponse(upstream.body, { status: upstream.status, headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json', 'Cache-Control': 'private, no-store',
    } });
    if (session.access !== request.cookies.get(ACCESS_COOKIE)?.value) setSessionCookies(response, session.access);
    return response;
  } catch { return NextResponse.json({ detail: 'Hubo un inconveniente al conectar con el servidor. Intenta nuevamente.' }, { status: 503 }); }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
