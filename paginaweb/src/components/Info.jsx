import React from "react";
import info1 from "@info/cansancioVisual.jpg";
import claridadvision3 from "@info/claridadvision3.jpg";
import visionlargoplazo from "@info/visionlargoplazo.jpg";

const CTA = () => (
  <div className="d-flex flex-column flex-sm-row gap-3 mt-4">
    <a className="btn btn-primary px-4 py-2" href="#/agendar_cita">
      Agenda tu valoración
    </a>
    <a className="btn btn-outline-primary px-4 py-2" href="tel:+573024800367">
      Línea empresarial 302 480 0367
    </a>
  </div>
);

function Info() {
  return (
    <>
      <div
        id="carouselExampleInterval"
        className="carousel slide"
        data-bs-ride="carousel">
        <div className="carousel-inner">
          <div className="carousel-item active" data-bs-interval="10000">
            <div className="container col-xxl-8 px-4 py-5">
              <div className="row flex-col flex-md-row align-items-center py-2">
                <div className="col-md-6 h-100 d-flex align-items-stretch flex-grow-1">
                  <img
                    src={info1}
                    className="d-block mx-lg-auto img-fluid rounded-2"
                    alt="Paciente recibiendo indicaciones para aliviar el cansancio visual"
                    loading="lazy"
                  />
                </div>
                <div className="col-lg-6">
                  <h1 className="display-6 fw-bold text-body-emphasis lh-1 mb-3 mt-3 mt-lg-0">
                    Alivio para la fatiga visual
                  </h1>
                  <p className="lead">
                    Horas frente a pantallas, iluminación inadecuada y la falta de pausas generan sequedad ocular,
                    visión borrosa y dolor de cabeza. Evaluamos tus hábitos de trabajo y formulamos lentes de descanso o
                    filtros especiales para que tus ojos recuperen su bienestar.
                  </p>
                  <p className="lead mb-0">
                    Con una valoración oportuna puedes prevenir molestias crónicas y cuidar tu productividad diaria. Te
                    guiamos con ejercicios visuales, lubricantes y recomendaciones posturales personalizadas.
                  </p>
                  {/* <CTA /> */}
                </div>
              </div>
            </div>
          </div>

          <div className="carousel-item" data-bs-interval="8000">
            <div className="container col-xxl-8 px-4 py-2">
              <div className="row flex-col flex-md-row-reverse align-items-center py-2">
                <div className="col-10 col-sm-8 col-lg-6 h-100 d-flex align-items-stretch">
                  <img
                    src={claridadvision3}
                    className="d-block mx-lg-auto img-fluid rounded-2"
                    alt="Optómetra verificando la claridad visual de una paciente"
                    loading="lazy"
                  />
                </div>
                <div className="col-lg-6">
                  <h1 className="display-6 fw-bold text-body-emphasis lh-1 mb-3 mt-3 mt-lg-0">
                    Recupera tu claridad visual
                  </h1>
                  <p className="lead">
                    Diagnosticamos miopía, hipermetropía, astigmatismo y otras condiciones refractivas con tecnología de
                    alta precisión. Nuestros optómetras te presentan las alternativas ideales para tu estilo de vida:
                    lentes monofocales, ocupacionales, progresivos o de contacto.
                  </p>
                  <p className="lead mb-0">
                    También realizamos ajustes finos a tus monturas y controlamos la adaptación para que disfrutes una
                    visión nítida desde el primer día.
                  </p>
                  {/* <CTA /> */}
                </div>
              </div>
            </div>
          </div>

          <div className="carousel-item">
            <div className="container col-xxl-8 px-4 py-2">
              <div className="row flex-col flex-md-row align-items-center py-2">
                <div className="col-10 col-sm-8 col-lg-6 h-100 d-flex align-items-stretch">
                  <img
                    src={visionlargoplazo}
                    className="d-block mx-lg-auto img-fluid rounded-2"
                    alt="Profesional mostrando opciones de lentes para cuidado a largo plazo"
                    loading="lazy"
                  />
                </div>
                <div className="col-lg-6">
                  <h1 className="display-6 fw-bold text-body-emphasis lh-1 mb-3 mt-3 mt-lg-0">
                    Protege tu visión a largo plazo
                  </h1>
                  <p className="lead">
                    A medida que cambian tus necesidades visuales, actualizamos tu formulación y te orientamos en
                    tratamientos preventivos. Contamos con lentes con filtro UV, protección contra luz azul y soluciones
                    de alto índice para monturas livianas y elegantes.
                  </p>
                  <p className="lead mb-0">
                    Complementamos el examen con educación en salud visual y planes de seguimiento para cada integrante
                    de la familia.
                  </p>
                  {/* <CTA /> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carouselExampleInterval"
          data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Anterior</span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carouselExampleInterval"
          data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Siguiente</span>
        </button>
        <hr />
      </div>
    </>
  );
}

export default Info;
