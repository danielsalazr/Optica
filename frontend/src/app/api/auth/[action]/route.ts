import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/access';
import { backendFetch, clearSessionCookies, sessionFor, setSessionCookies, validOrigin } from '@/lib/backend-session';

export async function GET(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  if ((await context.params).action !== 'me') return NextResponse.json({}, { status: 404 });
  try {
    const session = await sessionFor(request.cookies.get(ACCESS_COOKIE)?.value, request.cookies.get(REFRESH_COOKIE)?.value);
    const response = NextResponse.json(session.user ?? { detail: 'La sesion ha expirado.' }, { status: session.status, headers: { 'Cache-Control': 'no-store' } });
    if (session.access) setSessionCookies(response, session.access);
    else if (session.status === 401) clearSessionCookies(response);
    return response;
  } catch { return NextResponse.json({ detail: 'No fue posible validar la sesion.' }, { status: 503 }); }
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  if (!validOrigin(request)) return NextResponse.json({ detail: 'Origen no permitido.' }, { status: 403 });
  const { action } = await context.params;
  try {
    if (action === 'logout') {
      const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
      if (refresh) {
        const upstream = await backendFetch('usuarios/auth/logout/', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }),
        });
        if (!upstream.ok) throw new Error('Logout unavailable');
      }
      const response = NextResponse.json({ ok: true });
      clearSessionCookies(response);
      return response;
    }
    if (action !== 'login') return NextResponse.json({}, { status: 404 });
    let body;
    try { body = await request.json(); } catch { return NextResponse.json({ detail: 'Datos invalidos.' }, { status: 400 }); }
    if (!body || typeof body !== 'object') return NextResponse.json({ detail: 'Datos invalidos.' }, { status: 400 });
    if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.username.length > 150 || body.password.length > 1024) return NextResponse.json({ detail: 'Introduce usuario y contrasena.' }, { status: 400 });
    const upstream = await backendFetch('usuarios/auth/login/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: body.username, password: body.password }),
    });
    if (!upstream.ok) return NextResponse.json({ detail: upstream.status === 429 ? 'Demasiados intentos. Espera un minuto.' : upstream.status >= 500 ? 'No fue posible iniciar sesion.' : 'Usuario o contrasena incorrectos.' }, { status: upstream.status });
    const tokens = await upstream.json();
    const session = await sessionFor(tokens.access);
    if (!session.user) throw new Error('Session unavailable');
    const response = NextResponse.json({ user: session.user }, { headers: { 'Cache-Control': 'no-store' } });
    setSessionCookies(response, tokens.access, tokens.refresh);
    return response;
  } catch { return NextResponse.json({ detail: 'No fue posible conectar con el servicio de autenticacion.' }, { status: 503 }); }
}
