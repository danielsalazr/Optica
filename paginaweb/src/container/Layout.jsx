import React from "react";
import { useAuth } from "../components/Auth";
import { SideBar } from "../components/sideBar";
import { useLocation } from "react-router-dom";

const Layout = (props) => {
  const auth = useAuth();
  console.log(auth);

  const location = useLocation();
  const currentPath = location.pathname;
  console.log(currentPath);

  // auth.user = 'DanieleDeRossi@hotmail.com'
  return (
    <>{currentPath !== "/login" && <SideBar children={props.children} />}</>
  );
};

export default Layout;
