// @ts-nocheck
﻿'use client';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/header.css';
import Link from "next/link";
import { buildAdminUrl } from '@/utils/js/env';
import { useAuth } from '@/components/auth/AuthProvider';

function Header() {
  const { user, can } = useAuth();
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isSaleEditor = /^\/ventas\/\d+\/?$/.test(pathname);
  const moduleTitle = pathname === '/ventas/crearVenta' ? 'Crear venta'
    : isSaleEditor ? 'Editar venta'
    : pathname.startsWith('/ventas') ? 'Ventas'
    : pathname.startsWith('/remisiones') ? 'Remisiones'
    : pathname.startsWith('/jornadas') ? 'Jornadas'
    : pathname.startsWith('/abonos/masivo') ? 'Abonos masivos'
    : pathname.startsWith('/abonos') ? 'Abonos'
    : pathname.startsWith('/saldos') ? 'Saldos'
    : pathname.startsWith('/pedidos') ? 'Pedidos'
    : pathname.startsWith('/reportes') ? 'Reportes'
    : pathname.startsWith('/inventario/items') ? 'Items de inventario'
    : pathname.startsWith('/inventario/existencias') ? 'Existencias'
    : pathname.startsWith('/inventario/movimientos') ? 'Movimientos de inventario'
    : pathname.startsWith('/inventario') ? 'Inventario'
    : pathname.startsWith('/impresoras') ? 'Impresoras' : 'Bienestar Optica';
  const backHref = pathname.startsWith('/ventas/') ? '/ventas'
    : pathname.startsWith('/abonos/') ? '/abonos' : '/';
  const pageContext = (
    <div className="app-header-page-context">
      {pathname !== '/' && (
        <Link href={backHref} className="app-header-back" aria-label={backHref === '/' ? 'Volver al inicio' : `Volver a ${backHref.slice(1)}`} title="Volver">
          <i className="pi pi-arrow-left" aria-hidden="true" />
        </Link>
      )}
      <h1 className="app-header-page-title">{moduleTitle}</h1>
    </div>
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [mobileOpen]);

  async function logout() {
    setLogoutBusy(true);
    setLogoutError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('No fue posible cerrar sesion. Intenta nuevamente.');
      window.location.assign('/login');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'No fue posible cerrar sesion.');
      setLogoutBusy(false);
    }
  }

  if (pathname === '/login') return null;

  return (
    <header ref={headerRef} className="app-header p-3 text-bg-dark">
      <div className="container-fluid">
        <div className="app-header-mobile-bar">
          {pageContext}
          <button ref={toggleRef} type="button" className="app-header-menu-toggle" aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'} aria-expanded={mobileOpen} aria-controls="app-header-menu" onClick={() => setMobileOpen(open => !open)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        <div id="app-header-menu" className={`app-header-content ${mobileOpen ? 'is-open' : ''} d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start`}>
          <a href="/" className="app-header-desktop-brand d-flex align-items-center mb-2 mb-lg-0 text-white text-decoration-none">
            <svg className="bi me-2" width={40} height={32} aria-hidden="true"><use xlinkHref="#bootstrap" /></svg>
          </a>
          <div className="app-header-desktop-context">{pageContext}</div>

          <ul aria-label="Navegacion principal" className="app-header-navigation nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
            <li><Link href="/" className="nav-link px-2 text-white" onClick={() => setMobileOpen(false)}>Home</Link></li>
            {(can('view_ventas') || can('view_remisiones') || can('view_jornadas')) && <li>
              <NavDropdown onSelect={() => setMobileOpen(false)} title="Ventas" id="ventas-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                {can('view_ventas') && <NavDropdown.Item as={Link} href="/ventas">Ventas</NavDropdown.Item>}
                {can('view_ventas') && can('add_ventas') && <NavDropdown.Item as={Link} href="/ventas/crearVenta">Crear venta</NavDropdown.Item>}
                {can('view_remisiones') && <NavDropdown.Item as={Link} href="/remisiones">Remisiones</NavDropdown.Item>}
                {can('view_jornadas') && <NavDropdown.Item as={Link} href="/jornadas">Jornadas</NavDropdown.Item>}
              </NavDropdown>
            </li>}
            {user?.is_staff && <li>
              <NavDropdown onSelect={() => setMobileOpen(false)} title="Pedidos" id="pedidos-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                <NavDropdown.Item as={Link} href="/pedidos">Pedidos</NavDropdown.Item>
              </NavDropdown>
            </li>}
            {can('view_abonos') && <li>
              <NavDropdown onSelect={() => setMobileOpen(false)} title="Abonos" id="abonos-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                <NavDropdown.Item as={Link} href="/abonos">Abonos</NavDropdown.Item>
                {can('add_abonos') && <NavDropdown.Item as={Link} href="/abonos/masivo">Abono masivo</NavDropdown.Item>}
              </NavDropdown>
            </li>}
            {can('view_saldos') && <li>
              <NavDropdown onSelect={() => setMobileOpen(false)} title="Saldos" id="saldos-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                <NavDropdown.Item as={Link} href="/saldos">Saldos</NavDropdown.Item>
              </NavDropdown>
            </li>}
            {(can('view_reportes') || can('view_impresoras')) && <li>
              <NavDropdown onSelect={() => setMobileOpen(false)} title="Reportes" id="reportes-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                {can('view_reportes') && <NavDropdown.Item as={Link} href="/reportes">Centro de reportes</NavDropdown.Item>}
                {can('view_impresoras') && <NavDropdown.Item as={Link} href="/impresoras">Impresoras</NavDropdown.Item>}
              </NavDropdown>
            </li>}
            {can('view_inventario') && <li>
              <NavDropdown onSelect={() => setMobileOpen(false)} title="Inventario" id="inventario-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                <NavDropdown.Item as={Link} href="/inventario/items" active={pathname.startsWith('/inventario/items')}>Ítems</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/inventario/existencias" active={pathname.startsWith('/inventario/existencias')}>Existencias</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/inventario/movimientos" active={pathname.startsWith('/inventario/movimientos')}>Movimientos</NavDropdown.Item>
              </NavDropdown>
            </li>}
          </ul>

          <div className="app-header-account text-end">
            <span className="me-2 small">{user?.name}</span>
            {user?.is_staff && <a href={buildAdminUrl("admin/")} className="btn btn-outline-light me-2">Admin</a>}
            <button type="button" className="btn btn-outline-light" disabled={logoutBusy} onClick={logout}>{logoutBusy ? 'Saliendo...' : 'Cerrar sesion'}</button>
            {logoutError && <p role="alert" className="text-warning small mb-0">{logoutError}</p>}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header


