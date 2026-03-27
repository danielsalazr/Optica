import React from "react";
import { useState, useEffect, useCallback } from "react";
import Header from "./Header";
import { NavLink } from "react-router-dom";
import Carousel from "./Carousel";
import Footer from "./Footer";

const MOBILE_MEDIA_QUERY = "(max-width: 991px)";

function SideBar({ children }) {
  const computeIsMobile = () =>
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  const [isMobile, setIsMobile] = useState(() => computeIsMobile());
  const [hideMenu, setHideMenu] = useState(() => computeIsMobile());

  const changeState = useCallback(() => {
    setHideMenu((prev) => !prev);
  }, []);

  const handleNavigate = useCallback(() => {
    if (isMobile) {
      setHideMenu(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleChange = (event) => {
      setIsMobile(event.matches);
      if (event.matches) {
        setHideMenu(true);
      } else {
        setHideMenu(false);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      document.body.style.removeProperty("overflow");
      return () => {
        document.body.style.removeProperty("overflow");
      };
    }

    if (hideMenu) {
      document.body.style.removeProperty("overflow");
    } else {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [hideMenu, isMobile]);

  const menuData = [];
  menuData.push({
    title: "Quienes Somos",
    icon: "bx bxs-dashboard",
    pathRoute: "/",
  });
  menuData.push({
    title: "Mision Vision",
    icon: "bx bxs-dashboard",
    pathRoute: "/mision_vision",
    scrollTo: "mision-vision",
  });

  // menuData.push({
  //   title: "Nuestros Servicios",
  //   icon: "bx bx-user-check",
  //   pathRoute: "/a",
  // });

  menuData.push({
    title: "Brigadas Empresariales",
    icon: "bx bxs-dashboard",
    pathRoute: "/brigadas_empresariales",
    scrollTo: "brigadas-empresariales",
  });

  // menuData.push({
  //   title: "productos",
  //   icon: "bx bx-history",
  //   pathRoute: "/ventas",
  // });

  // menuData.push({
  //   title: "Proyectos",
  //   icon: "bx bx-desktop",
  //   pathRoute: "/c",
  // });

  // menuData.push({
  //   title: "Tutoriales",
  //   icon: "bx bx-food-menu",
  //   pathRoute: "/tutoriales",
  // });

  // menuData.push({
  //   title: "usuarios",
  //   icon: "bx bx-user-check",
  //   pathRoute: "/Tutoriales",
  // });

  menuData.push({
    title: "Agendar Cita",
    icon: "bx bx-edit-alt",
    pathRoute: "/agendar_cita",
    scrollTo: "agendar-cita",
  });

  // menuData.push({
  //   title: "Cerrar Sesión",
  //   icon: "bx bx-user-x",
  //   pathRoute: "/g",
  // });

  return (
    <div>
      {/* // Menu lateral*/}

      {/* {menuChangePosition && ( */}
      <div
        className={`${
          !hideMenu ? "active-nav" : ""
        } side-navbar d-flex justify-content-between flex-wrap flex-column`}
        id="sidebar">
        <ul className="nav flex-column text-white w-100">
          <a href="#" className="nav-link h3 text-white my-2">
            Menu
          </a>
          {menuData.map((mData) => (
            <MenuLink key={mData.pathRoute} toPath={mData} onNavigate={handleNavigate} />
          ))}
        </ul>
        <NavLink
          to="/"
          className="nav-link rounded text-white z-index-2 px-2 py-2"
          onClick={handleNavigate}>
          <i className="bx bx-user-x"></i>
          <span className="mx-2">Cerrar Sesion</span>
        </NavLink>
      </div>
      {/* )} */}

      {isMobile && (
        <div
          className={`menu-backdrop ${!hideMenu ? "is-visible" : ""}`}
          onClick={() => setHideMenu(true)}
          aria-hidden="true"
        />
      )}

      {/* contenedor para introducir el contenido */}
      <div className={`${!hideMenu ? "active-cont" : ""}  my-container`}>
        <Header changeState={changeState} buttonState={hideMenu} />
        <Carousel />

        <div className="panel-body overflow-auto pageBody">
          <div className="contenido">{children}</div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

function MenuLink({ toPath, onNavigate }) {
  const linkState = toPath.scrollTo ? { scrollTo: toPath.scrollTo } : undefined;
  return (
    <li className="nav-link">
      {/* <a href={toPath.pathRoute} className="rounded">
                <i className={toPath.icon}></i>
                <span className="mx-2">{toPath.title}</span>
            </a> */}
      <NavLink
        className="rounded"
        style={({ isActive }) => ({
          // color: isActive ? 'Yellow' : 'white',
          fontWeight: isActive ? "bold" : "",
          fontSize: isActive ? "1.2rem" : "",
        })}
        to={toPath.pathRoute}
        state={linkState}
        onClick={onNavigate}>
        <i className={toPath.icon}></i>
        <span className="mx-2">{toPath.title}</span>
      </NavLink>
    </li>
  );
}

export { SideBar };
