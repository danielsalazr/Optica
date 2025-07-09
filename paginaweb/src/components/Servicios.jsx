import React from "react";

// Imagenes
import examen from "@brigadas/examen.jpeg";
import brigada from "@brigadas/brigada.jpg";
import lentes from "@brigadas/lentes.jpg";
import gotas_para_ojos from "@brigadas/gotas_para_ojos.jpg";
import lentes_industriales from "@brigadas/lentes_industriales.png";
import lentes_de_contacto from "@brigadas/lentes_de_contacto.png";

// Componentes
import ServicesCard from "./ServicesCard";

function Servicios() {
  const datosCards = [
    {
      title: "Jornadas Empresariales",
      text: "Conoce nuestras jornadas empresariales.",
      image: brigada,
    },
    {
      title: "Examen Visual",
      text: "Separa ya tu cita y programate para realizar tu examen.",
      image: examen,
    },
    {
      title: "Lentes y Monturas",
      text: "Variedad en lentes y monturas de acetato, acero y Tr 90.",
      image: lentes,
    },
    {
      title: "Gotas para los ojos y otros productos",
      text: "visitanos y conoce nuestra variedad de productos para el cuidado de tu vision.",
      image: gotas_para_ojos,
    },
    {
      title: "Lentes de contacto",
      text: "Para quienes prefieren disfrutar de la comodidad.",
      image: lentes_de_contacto,
    },
    {
      title: "Lentes Industriales con aumento",
      text: "Para que puedas sentirte en confianza cuando realizces labores de riesgo.",
      image: lentes_industriales,
    },
  ];
  return (
    <>
      <section className="container text-center">
        <h2 className="h2">Nuestros Servicios</h2>
      </section>

      <div className="album py-5 ">
        <div className="container">
          <div className="row row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-lg-3 g-3">
            {datosCards.map((card, index) => (
              <ServicesCard
                index={index}
                title={card.title}
                text={card.text}
                image={card.image}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Servicios;
