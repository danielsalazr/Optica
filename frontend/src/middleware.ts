import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, can, pagePermissions } from './lib/access';
import { clearSessionCookies, sessionFor, setSessionCookies, requestOrigin } from './lib/backend-session';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/login') return NextResponse.next();
  try {
    const oldAccess = request.cookies.get(ACCESS_COOKIE)?.value;
    const session = await sessionFor(oldAccess, request.cookies.get(REFRESH_COOKIE)?.value);
    if (!session.user) {
      if (session.status >= 500) return new NextResponse('No fue posible validar la sesion. Intenta nuevamente.', { status: 503 });
      const url = new URL('/login', requestOrigin(request));
      url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
      const response = NextResponse.redirect(url);
      clearSessionCookies(response);
      return response;
    }
    if (pagePermissions(request.nextUrl.pathname).some(permission => !can(session.user, permission))) {
      return NextResponse.redirect(new URL('/sin-acceso', requestOrigin(request)));
    }
    // Make a renewed access token available to SSR in this same request.
    if (session.access && session.access !== oldAccess) request.cookies.set(ACCESS_COOKIE, session.access);
    const response = NextResponse.next({ request: { headers: request.headers } });
    if (session.access && session.access !== oldAccess) setSessionCookies(response, session.access);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch {
    return new NextResponse('El servicio de autenticacion no esta disponible. Intenta nuevamente.', { status: 503 });
  }
}

export const config = { matcher: ['/((?!api/|_next/|favicon.ico|.*\\..*).*)'] };
