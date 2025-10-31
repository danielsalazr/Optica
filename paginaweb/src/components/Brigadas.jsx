import React from "react";
import lentes from "@brigadas/lentes.jpg";
import atencion from "@brigadas/brigada.jpg";
import Seo from "./Seo";

function Brigadas() {
  const brigadaSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Brigadas empresariales de salud visual",
    provider: {
      "@type": "Optician",
      name: "Bienestar Óptica",
      areaServed: "Bogotá, Cali y municipios aledaños",
      telephone: "+57 302 480 0367",
    },
    url: "https://www.bienestaroptica.com/brigadas_empresariales",
    description:
      "Brigadas empresariales de optometría con unidad móvil, exámenes visuales y catálogo de monturas para colaboradores.",
  };

  return (
    <section className="Brigadas">
      <Seo
        title="Brigadas empresariales de salud visual"
        description="Llevamos optometría, monturas y lentes ocupacionales a tu empresa. Agenda brigadas empresariales con logística completa y asesores certificados."
        canonical="https://www.bienestaroptica.com/brigadas_empresariales"
        jsonLd={brigadaSchema}
      />
      <div className="Brigadas__container">
        <p className="Brigadas__eyebrow">Programa empresarial</p>
        <h1>Brigadas empresariales</h1>
        <p className="Brigadas__lead">
          Acompañamos a las organizaciones en la gestión del riesgo visual con brigadas
          que transforman cualquier espacio en un consultorio óptico móvil. Nuestro
          equipo coordina la logística completa para que tus colaboradores reciban una
          evaluación profesional sin detener la operación diaria.
        </p>

        <div className="Brigadas__grid">
          <article className="Brigadas__card">
            <h3>Servicios disponibles</h3>
            <p>
              Diseñamos una agenda a medida para cubrir todos los requisitos del
              programa de prevención visual (Resolución 111 de 2017).
            </p>
            <ul className="Brigadas__list Brigadas__list--check">
              <li>Examen optométrico sin costo mediante convenio empresarial.</li>
              <li>Traslado del optómetra, instrumental clínico y unidad portátil.</li>
              <li>Amplio catálogo de monturas en materiales livianos y resistentes.</li>
              <li>Dotación de gafas de seguridad industrial certificadas.</li>
              <li>Convenios por descuento de nómina y medios de pago flexibles.</li>
              <li>Asesoría experta en adaptación de lentes monofocales y ocupacionales.</li>
            </ul>
          </article>

          <article className="Brigadas__card">
            <h3>Beneficios para colaboradores</h3>
            <p>
              Complementamos la jornada con educación, seguimiento y beneficios que
              impactan a cada familia.
            </p>
            <ol className="Brigadas__list Brigadas__list--ordered" type="A">
              <li>Charlas de promoción y prevención adaptadas al entorno laboral.</li>
              <li>Pausas activas visuales y guías para el cuidado de los lentes.</li>
              <li>Descuentos extendidos al núcleo familiar y plan de referidos.</li>
              <li>Acompañamiento en posventa y entrega de reportes ejecutivos.</li>
            </ol>
          </article>
        </div>

        <div className="Brigadas__images">
          <figure>
            <img
              src={lentes}
              alt="Selección de monturas y lentes ocupacionales"
              className="rounded-3"
            />
            <figcaption>
              Llevamos colecciones actualizadas de monturas y protecciones según el
              perfil ocupacional.
            </figcaption>
          </figure>
          <figure>
            <img
              src={atencion}
              alt="Profesional de optometría atendiendo colaboradores durante una brigada"
              className="rounded-3"
            />
            <figcaption>
              Instalamos estaciones clínicas completas para diagnósticos precisos en el
              lugar de trabajo.
            </figcaption>
          </figure>
        </div>

        <div className="Brigadas__cta">
          <h3>Agenda tu brigada</h3>
          <p>
            Cumple con la normatividad y protege la visión de tu equipo con una visita
            diseñada a la medida de tu operación. Respondemos con rapidez y enviamos una
            propuesta detallada en menos de 24 horas hábiles.
          </p>
          <div className="Brigadas__ctaButtons">
            <a href="tel:+573024800367" className="Brigadas__button Brigadas__button--primary">
              Línea móvil 302 480 0367
            </a>
            <a
              href="https://wa.me/573024800367?text=Hola,%20me%20gustaría%20agendar%20una%20brigada%20empresarial."
              target="_blank"
              rel="noreferrer"
              className="Brigadas__button Brigadas__button--whatsapp"
            >
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Brigadas;
