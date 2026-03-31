// @ts-nocheck
﻿'use client';
import NavDropdown from 'react-bootstrap/NavDropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from "next/link";
import { buildAdminUrl } from '@/utils/js/env';

function Header() {
  return (
    <header className="p-3 text-bg-dark">
      <div className="container">
        <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
          <a href="/" className="d-flex align-items-center mb-2 mb-lg-0 text-white text-decoration-none">
            <svg className="bi me-2" width={40} height={32} role="img" aria-label="Bootstrap"><use xlinkHref="#bootstrap" /></svg>
          </a>

          <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
            <li><Link href="/" className="nav-link px-2 text-white">Home</Link></li>
            <li>
              <NavDropdown title="Ventas" id="ventas-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                <NavDropdown.Item as={Link} href="/ventas">Ventas</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/ventas/crearVenta">Crear venta</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/remisiones">Remisiones</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/jornadas">Jornadas</NavDropdown.Item>
              </NavDropdown>
            </li>
            <li>
              <NavDropdown title="Pedidos" id="pedidos-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                <NavDropdown.Item as={Link} href="/pedidos">Pedidos</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/ventas/crearVenta">Crear venta</NavDropdown.Item>
              </NavDropdown>
            </li>
            <li>
              <NavDropdown title="Abonos" id="abonos-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                <NavDropdown.Item as={Link} href="/abonos">Abonos</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/abonos/masivo">Abono masivo</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/ventas/crearVenta">Crear venta</NavDropdown.Item>
              </NavDropdown>
            </li>
            <li>
              <NavDropdown title="Saldos" id="saldos-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                <NavDropdown.Item as={Link} href="/saldos">Saldos</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/ventas/crearVenta">Crear venta</NavDropdown.Item>
              </NavDropdown>
            </li>
            <li>
              <NavDropdown title="Reportes" id="reportes-nav-dropdown" menuVariant="dark" data-bs-theme="dark" className="success" style={{ color: "white" }}>
                <NavDropdown.Item as={Link} href="/reportes">Centro de reportes</NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/impresoras">Impresoras</NavDropdown.Item>
              </NavDropdown>
            </li>
          </ul>

          <form className="col-12 col-lg-auto mb-3 mb-lg-0 me-lg-3" role="search">
            <input type="search" className="form-control form-control-dark text-bg-dark" placeholder="Search..." aria-label="Search" />
          </form>
          <div className="text-end">
            <a href={buildAdminUrl("admin/")} className="btn btn-outline-light me-2">Admin</a>
            <button type="button" className="btn btn-outline-light me-2">Login</button>
            <button type="button" className="btn btn-warning">Sign-up</button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header


