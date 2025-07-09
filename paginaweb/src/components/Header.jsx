import React, { useState } from "react";
import encabezado from "@logos/dosificando.png";
import logoOptica from "@logos/bienestar_optica.png";
import { useAuth } from "./Auth";
import { Link } from "react-router-dom";

import "boxicons";
// import encabezado from '../assets/images/logos/dosificando.png';
// import "@styles/side_bar_menu.css"

const Header = (props) => {
  const auth = useAuth();
  console.log(auth);

  return (
    <>
      <a
        className={`${
          !props.buttonState ? "buttonShift" : ""
        } btn border-0 menuBtn `}
        id="menu-btn"
        onClick={props.changeState}>
        <i className="bx bx-menu"></i>
      </a>
      <div
        className=" border-bottom w-100"
        style={{ "background-color": "#114baf" }}>
        <header
          className=" container-xl d-flex flex-wrap d-flex flex-wrap justify-content-center  py-2"
          id="header">
          {/* <nav className=" navbar top-navbar z-1"> */}

          <a
            href="/"
            class="d-flex align-items-center mb-1 mb-xl-0 me-xl-auto link-body-emphasis text-decoration-none">
            {/* <svg class="bi me-2" width="40" height="32"><use xlink:href="#bootstrap"></use></svg>
          <span class="fs-4">Double header</span> */}
            <img className="header-logo me-3" src={logoOptica} alt="" />
            <span className="fs-4 text-light  ">Bienestar Optica</span>
          </a>

          <ul class="nav col-12 col-lg-auto  justify-content-center ">
            <li className=" flex align-items-center">
              <a
                href="mailto:Bieneropticaempresarial@gmail.com?subject=Separar cita examen visual&body=Me gustaria separar una cita para examen visual con ustedes&cc=daniel.salazar@hotmail.com&bcc=giovanna-0126@hotmail.com"
                target="_blank"
                class="nav-link px-2 text-white flex gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.7-8 5.334L4 8.7V6.297l8 5.333 8-5.333V8.7z"></path>
                </svg>
                Bienestaropticaempresarial@gmail.com
              </a>
            </li>
            <li className=" flex align-items-center">
              <a
                href="tel:+573187561414"
                target="_blank"
                class="nav-link px-2 text-white flex gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="m20.487 17.14-4.065-3.696a1.001 1.001 0 0 0-1.391.043l-2.393 2.461c-.576-.11-1.734-.471-2.926-1.66-1.192-1.193-1.553-2.354-1.66-2.926l2.459-2.394a1 1 0 0 0 .043-1.391L6.859 3.513a1 1 0 0 0-1.391-.087l-2.17 1.861a1 1 0 0 0-.29.649c-.015.25-.301 6.172 4.291 10.766C11.305 20.707 16.323 21 17.705 21c.202 0 .326-.006.359-.008a.992.992 0 0 0 .648-.291l1.86-2.171a.997.997 0 0 0-.085-1.39z"></path>
                </svg>
                +57 318 756 1414
              </a>
            </li>
            <li className=" flex align-items-center">
              <a
                href="https://wa.me/573187561414?text=Me%20Gustaria%20separar%20una%20cita%20con%20ustedes"
                target="_blank"
                class="nav-link px-2 text-white flex gap-1">
                {/* <box-icon className="" type='logo' name='whatsapp' style={{ color: 'green' }}></box-icon>  */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="24"
                  height="24"
                  viewBox="0 0 48 48">
                  <path
                    fill="#fff"
                    d="M4.9,43.3l2.7-9.8C5.9,30.6,5,27.3,5,24C5,13.5,13.5,5,24,5c5.1,0,9.8,2,13.4,5.6	C41,14.2,43,18.9,43,24c0,10.5-8.5,19-19,19c0,0,0,0,0,0h0c-3.2,0-6.3-0.8-9.1-2.3L4.9,43.3z"></path>
                  <path
                    fill="#fff"
                    d="M4.9,43.8c-0.1,0-0.3-0.1-0.4-0.1c-0.1-0.1-0.2-0.3-0.1-0.5L7,33.5c-1.6-2.9-2.5-6.2-2.5-9.6	C4.5,13.2,13.3,4.5,24,4.5c5.2,0,10.1,2,13.8,5.7c3.7,3.7,5.7,8.6,5.7,13.8c0,10.7-8.7,19.5-19.5,19.5c-3.2,0-6.3-0.8-9.1-2.3	L5,43.8C5,43.8,4.9,43.8,4.9,43.8z"></path>
                  <path
                    fill="#cfd8dc"
                    d="M24,5c5.1,0,9.8,2,13.4,5.6C41,14.2,43,18.9,43,24c0,10.5-8.5,19-19,19h0c-3.2,0-6.3-0.8-9.1-2.3	L4.9,43.3l2.7-9.8C5.9,30.6,5,27.3,5,24C5,13.5,13.5,5,24,5 M24,43L24,43L24,43 M24,43L24,43L24,43 M24,4L24,4C13,4,4,13,4,24	c0,3.4,0.8,6.7,2.5,9.6L3.9,43c-0.1,0.3,0,0.7,0.3,1c0.2,0.2,0.4,0.3,0.7,0.3c0.1,0,0.2,0,0.3,0l9.7-2.5c2.8,1.5,6,2.2,9.2,2.2	c11,0,20-9,20-20c0-5.3-2.1-10.4-5.8-14.1C34.4,6.1,29.4,4,24,4L24,4z"></path>
                  <path
                    fill="#40c351"
                    d="M35.2,12.8c-3-3-6.9-4.6-11.2-4.6C15.3,8.2,8.2,15.3,8.2,24c0,3,0.8,5.9,2.4,8.4L11,33l-1.6,5.8	l6-1.6l0.6,0.3c2.4,1.4,5.2,2.2,8,2.2h0c8.7,0,15.8-7.1,15.8-15.8C39.8,19.8,38.2,15.8,35.2,12.8z"></path>
                  <path
                    fill="#fff"
                    fill-rule="evenodd"
                    d="M19.3,16c-0.4-0.8-0.7-0.8-1.1-0.8c-0.3,0-0.6,0-0.9,0	s-0.8,0.1-1.3,0.6c-0.4,0.5-1.7,1.6-1.7,4s1.7,4.6,1.9,4.9s3.3,5.3,8.1,7.2c4,1.6,4.8,1.3,5.7,1.2c0.9-0.1,2.8-1.1,3.2-2.3	c0.4-1.1,0.4-2.1,0.3-2.3c-0.1-0.2-0.4-0.3-0.9-0.6s-2.8-1.4-3.2-1.5c-0.4-0.2-0.8-0.2-1.1,0.2c-0.3,0.5-1.2,1.5-1.5,1.9	c-0.3,0.3-0.6,0.4-1,0.1c-0.5-0.2-2-0.7-3.8-2.4c-1.4-1.3-2.4-2.8-2.6-3.3c-0.3-0.5,0-0.7,0.2-1c0.2-0.2,0.5-0.6,0.7-0.8	c0.2-0.3,0.3-0.5,0.5-0.8c0.2-0.3,0.1-0.6,0-0.8C20.6,19.3,19.7,17,19.3,16z"
                    clip-rule="evenodd"></path>
                </svg>
                +57 318 756 1414
              </a>
            </li>

            {/* <li><a href="#" class="nav-link px-2 text-white">Pricing</a></li>
          <li><a href="#" class="nav-link px-2 text-white">FAQs</a></li>
          <li><a href="#" class="nav-link px-2 text-white">About</a></li> */}
          </ul>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}>
            {/* { auth.user !== null && <span style={{marginRight: "20px"}}>{auth.user}</span>} */}
            <span
              style={{
                marginRight: "20px",
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}>
              {auth.user}
            </span>

            {!auth.user && (
              <Link
                to="/login"
                className=""
                style={{
                  marginRight: "20px",
                  fontSize: "1.2rem",
                  color: "white",
                }}>
                Login
              </Link>
            )}
          </div>
          {/* </nav> */}
        </header>
      </div>
    </>
  );
};

export default Header;
