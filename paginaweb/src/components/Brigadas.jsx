import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import lentes from "@brigadas/lentes.jpg";
import atencion from "@brigadas/brigada.jpg";
import Seo from "./Seo";

function Brigadas() {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionRef = React.useRef(null);

  React.useEffect(() => {
    if (location.state?.scrollTo === "brigadas-empresariales" && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const brigadaSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Brigadas empresariales de salud visual",
    provider: {
      "@type": "Optician",
      name: "Bienestar Optica",
      areaServed: "Bogota, Cali y municipios aledanos",
      telephone: "+57 302 480 0367",
    },
    url: "https://www.bienestaroptica.com/brigadas_empresariales",
    description:
      "Brigadas empresariales de optometria con unidad movil, examenes visuales y catalogo de monturas para colaboradores.",
  };

  return (
    <section ref={sectionRef} id="brigadas-empresariales" className="Brigadas">
      <Seo
        title="Brigadas empresariales de salud visual"
        description="Llevamos optometria, monturas y lentes ocupacionales a tu empresa. Agenda brigadas empresariales con logistica completa y asesores certificados."
        canonical="https://www.bienestaroptica.com/brigadas_empresariales"
        jsonLd={brigadaSchema}
      />
      <div className="Brigadas__container">
        <p className="Brigadas__eyebrow">Programa empresarial</p>
        <h1>Brigadas empresariales</h1>
        <p className="Brigadas__lead">
          Acompanamos a las organizaciones en la gestion del riesgo visual con brigadas
          que transforman cualquier espacio en un consultorio optico movil. Nuestro
          equipo coordina la logistica completa para que tus colaboradores reciban una
          evaluacion profesional sin detener la operacion diaria.
        </p>

        <div className="Brigadas__grid">
          <article className="Brigadas__card">
            <h3>Servicios disponibles</h3>
            <p>
              Disenamos una agenda a medida para cubrir todos los requisitos del
              programa de prevencion visual (Resolucion 111 de 2017).
            </p>
            <ul className="Brigadas__list Brigadas__list--check">
              <li>Examen optometrico sin costo mediante convenio empresarial.</li>
              <li>Traslado del optometra, instrumental clinico y unidad portatil.</li>
              <li>Amplio catalogo de monturas en materiales livianos y resistentes.</li>
              <li>Dotacion de gafas de seguridad industrial certificadas.</li>
              <li>Convenios por descuento de nomina y medios de pago flexibles.</li>
              <li>Asesoria experta en adaptacion de lentes monofocales y ocupacionales.</li>
            </ul>
          </article>

          <article className="Brigadas__card">
            <h3>Beneficios para colaboradores</h3>
            <p>
              Complementamos la jornada con educacion, seguimiento y beneficios que
              impactan a cada familia.
            </p>
            <ol className="Brigadas__list Brigadas__list--ordered" type="A">
              <li>Charlas de promocion y prevencion adaptadas al entorno laboral.</li>
              <li>Pausas activas visuales y guias para el cuidado de los lentes.</li>
              <li>Descuentos extendidos al nucleo familiar y plan de referidos.</li>
              <li>Acompanamiento en posventa y entrega de reportes ejecutivos.</li>
            </ol>
          </article>
        </div>

        <div className="Brigadas__images">
          <figure>
            <img
              src={lentes}
              alt="Seleccion de monturas y lentes ocupacionales"
              className="rounded-3"
            />
            <figcaption>
              Llevamos colecciones actualizadas de monturas y protecciones segun el
              perfil ocupacional.
            </figcaption>
          </figure>
          <figure>
            <img
              src={atencion}
              alt="Profesional de optometria atendiendo colaboradores durante una brigada"
              className="rounded-3"
            />
            <figcaption>
              Instalamos estaciones clinicas completas para diagnosticos precisos en el
              lugar de trabajo.
            </figcaption>
          </figure>
        </div>

        <div className="Brigadas__cta">
          <h3>Agenda tu brigada</h3>
          <p>
            Cumple con la normatividad y protege la vision de tu equipo con una visita
            disenada a la medida de tu operacion. Respondemos con rapidez y enviamos una
            propuesta detallada en menos de 24 horas habiles.
          </p>
          <div className="Brigadas__ctaButtons">
            <a href="tel:+573024800367" className="Brigadas__button Brigadas__button--primary">
              Linea movil 302 480 0367
            </a>
            <a
              href="https://wa.me/573024800367?text=Hola,%20me%20gustaria%20agendar%20una%20brigada%20empresarial."
              target="_blank"
              rel="noreferrer"
              className="Brigadas__button Brigadas__button--whatsapp"
            >
              Escribenos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Brigadas;

