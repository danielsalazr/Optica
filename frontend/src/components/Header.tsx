'use client';
// import React, {useEffect} from 'react'
import DropDown from './bootstrap/DropDown';
import NavDropdown from 'react-bootstrap/NavDropdown';
import dynamic from 'next/dynamic';
import 'bootstrap/dist/css/bootstrap.min.css';
import { IP_URL } from '@/utils/js/api';
import Link from "next/link";


// const DropDown = dynamic(() => import('./DropDown'), {
//   ssr: false, // Desactiva la renderización en el servidor
// });
// Importa el CSS de Bootstrap
// import '@/styles/globals.css';
// function BasicExample() {
//   return (
    
//   );
// }

function Header() {

  // useEffect(() => {
  //   require("bootstrap/dist/js/bootstrap.bundle.min.js");
  // }, [])

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
        <NavDropdown title="Ventas" id="collapsible-nav-dropdown"  
          menuVariant="dark" 
          data-bs-theme="dark"
          className="success"
          style={{color: "white"}}
        >
          <NavDropdown.Item href="/ventas">Ventas</NavDropdown.Item>
          <NavDropdown.Item href="ventas/crearVenta">
            Crear venta
          </NavDropdown.Item>
          <NavDropdown.Item href="/remisiones">Remisiones</NavDropdown.Item>
          <NavDropdown.Item href="/jornadas">Jornadas</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action/3.4">
            Separated link
          </NavDropdown.Item>
        </NavDropdown>
        </li>
        <li>
          <NavDropdown title="Pedidos" id="collapsible-nav-dropdown"  
              menuVariant="dark" 
              data-bs-theme="dark"
              className="success"
              style={{color: "white"}}
            >
              <NavDropdown.Item href="/pedidos">Pedidos</NavDropdown.Item>
              <NavDropdown.Item href="ventas/crearVenta">
                Crear venta
              </NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4">
                Separated link
              </NavDropdown.Item>
            </NavDropdown>
        </li>
        <li>
          <NavDropdown title="Abonos" id="collapsible-nav-dropdown"  
            menuVariant="dark" 
            data-bs-theme="dark"
            className="success"
            style={{color: "white"}}
          >
            <NavDropdown.Item href="/abonos">Abonos</NavDropdown.Item>
            <NavDropdown.Item href="ventas/crearVenta">
              Crear venta
            </NavDropdown.Item>
            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item href="#action/3.4">
              Separated link
            </NavDropdown.Item>
          </NavDropdown>
        </li>
        <li>
          <NavDropdown title="Saldos" id="collapsible-nav-dropdown"  
            menuVariant="dark" 
            data-bs-theme="dark"
            className="success"
            style={{color: "white"}}
          >
            <NavDropdown.Item href="/saldos">Saldos</NavDropdown.Item>
            <NavDropdown.Item href="ventas/crearVenta">
              Crear venta
            </NavDropdown.Item>
            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item href="#action/3.4">
              Separated link
            </NavDropdown.Item>
          </NavDropdown>
        </li>
        
        
        <li><a href="#" className="nav-link px-2 text-white">About</a></li>
        <li>
        {/* <DropDown /> */}
        <NavDropdown title="Dropdown" id="collapsible-nav-dropdown"  
        menuVariant="dark" 
        data-bs-theme="dark"
        className="success"
        style={{color: "white"}}>
          <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
          <NavDropdown.Item href="#action/3.2">
            Another action
          </NavDropdown.Item>
          <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action/3.4">
            Separated link
          </NavDropdown.Item>
        </NavDropdown>
        
         {/* <div className="dropdown btn">
          <button>Profile</button>
          <div className="dropdown-options">
            <a href="#" className='btn'>Dashboard</a>
            <a href="#" className='btn'>Setting</a>
            <a href="#" className='btn'>Logout</a>
          </div>
        </div> */}

      </li>
      </ul>
      
      <form className="col-12 col-lg-auto mb-3 mb-lg-0 me-lg-3" role="search">
        <input type="search" className="form-control form-control-dark text-bg-dark" placeholder="Search..." aria-label="Search" />
      </form>
      <div className="text-end">
      
        <a href="http://localhost:8000/admin/"className="btn btn-outline-light me-2">Admin</a>
        <button type="button" className="btn btn-outline-light me-2">Login</button>
        <button type="button" className="btn btn-warning">Sign-up</button>
      </div>
    </div>
  </div>
</header>

  )
}

export default Header
