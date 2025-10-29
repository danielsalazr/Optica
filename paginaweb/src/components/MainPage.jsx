import React from "react";
import Carousel from "./Carousel";
import PortafolioProductos from "./PortafolioProductos";
import lente1 from "@lentes/gafas-sol.jpg";
import Info from "./Info";
import Servicios from "./Servicios";
import Monturas from "../container/Monturas";
import AcercaDeNosotros from "../container/AcercaDeNosotros";
import VisionValueSection from "./VisionValueSection";
// import Footer from './Footer';

// import '@styles/global.scss'

function MainPage() {
  return (
    <div>
      <Info />
      <VisionValueSection />
      {/* <Carousel /> */}
      <Servicios />

      <Monturas />
      <AcercaDeNosotros />

      {/* <Footer /> */}

      {/* <PortafolioProductos /> */}
    </div>
  );
}

export default MainPage;
