import React from "react";
import misionImg from "@icons/brigadas.jpg";
import visionImg from "@icons/examen.jpg";

function MisionVision() {
  return (
    <section className="misionVision">
      <div className="misionVision__container d-flex flex-column flex-lg-row justify-content-center gap-4">
        <article className="misionVision__card shadow-sm">
          <div className="misionVision__label">Misión</div>
          <h3>Aliados en el bienestar visual empresarial</h3>
          <img
            className="misionVision__photo"
            src={misionImg}
            alt="Equipo realizando brigada de salud visual"
          />
          <p>
            En Bienestar Óptica acompañamos a empresas, fondos de empleados y
            cooperativas con soluciones ópticas integrales. Llevamos brigadas de
            salud visual, hacemos seguimiento personalizado y acercamos
            beneficios preferenciales que protegen la calidad de vida de cada
            colaborador y su familia, con un equipo humano cálido y altamente
            calificado.
          </p>
          <ul>
            <li>Programas preventivos y brigadas periódicas in company.</li>
            <li>Planes preferenciales para colaboradores y su núcleo familiar.</li>
          </ul>
        </article>

        <article className="misionVision__card shadow-sm">
          <div className="misionVision__label">Visión 2025</div>
          <h3>La red de salud visual empresarial más confiable</h3>
          <img
            className="misionVision__photo"
            src={visionImg}
            alt="Paciente en un examen de visión de alta tecnología"
          />
          <p>
            Para 2025 consolidaremos una red con cobertura nacional que sea
            referente en el suroccidente colombiano por la innovación en
            prevención, la experiencia memorable que ofrecemos y el impacto
            positivo en los indicadores de salud visual de nuestros aliados.
          </p>
          <ul>
            <li>Expansión a nuevas ciudades con equipos móviles y aliados locales.</li>
            <li>Experiencias omnicanal que facilitan el cuidado visual continuo.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

export default MisionVision;
