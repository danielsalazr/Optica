import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import misionImg from "@icons/brigadas.jpg";
import visionImg from "@icons/examen.jpg";

function MisionVision() {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionRef = React.useRef(null);

  React.useEffect(() => {
    if (location.state?.scrollTo === "mision-vision" && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  return (
    <section ref={sectionRef} id="mision-vision" className="misionVision">
      <div className="misionVision__container d-flex flex-column flex-lg-row justify-content-center gap-4">
        <article className="misionVision__card shadow-sm">
          <div className="misionVision__label">Mision</div>
          <h3>Aliados en el bienestar visual empresarial</h3>
          <img
            className="misionVision__photo"
            src={misionImg}
            alt="Equipo realizando brigada de salud visual"
          />
          <p>
            En Bienestar Optica acompanamos a empresas, fondos de empleados y
            cooperativas con soluciones opticas integrales. Llevamos brigadas de
            salud visual, hacemos seguimiento personalizado y acercamos
            beneficios preferenciales que protegen la calidad de vida de cada
            colaborador y su familia, con un equipo humano calido y altamente
            calificado.
          </p>
          <ul>
            <li>Programas preventivos y brigadas periodicas in company.</li>
            <li>Planes preferenciales para colaboradores y su nucleo familiar.</li>
          </ul>
        </article>

        <article className="misionVision__card shadow-sm">
          <div className="misionVision__label">Vision 2025</div>
          <h3>La red de salud visual empresarial mas confiable</h3>
          <img
            className="misionVision__photo"
            src={visionImg}
            alt="Paciente en un examen de vision de alta tecnologia"
          />
          <p>
            Para 2025 consolidaremos una red con cobertura nacional que sea
            referente en el suroccidente colombiano por la innovacion en
            prevencion, la experiencia memorable que ofrecemos y el impacto
            positivo en los indicadores de salud visual de nuestros aliados.
          </p>
          <ul>
            <li>Expansion a nuevas ciudades con equipos moviles y aliados locales.</li>
            <li>Experiencias omnicanal que facilitan el cuidado visual continuo.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

export default MisionVision;
