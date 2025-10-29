import React from "react";

const VALUE_POINTS = [
  {
    title: "Optometría integral",
    description:
      "Evaluaciones completas con diagnóstico preciso, asesoría personalizada y seguimiento posventa.",
  },
  {
    title: "Monturas curadas",
    description:
      "Colección seleccionada en TR90, acetato y acero; ajustamos cada pieza para asegurar comodidad y estilo.",
  },
  {
    title: "Programas empresariales",
    description:
      "Brigadas visuales, dotación industrial certificada y acompañamiento para cumplir la normatividad.",
  },
  {
    title: "Medios de pago flexibles",
    description:
      "Convenios, venta a crédito y múltiples alternativas para que cuidar tu visión sea accesible.",
  },
];

const VisionValueSection = () => {
  return (
    <section className="py-5 bg-body-tertiary">
      <div className="container">
        <div className="row g-5 align-items-start">
          <div className="col-lg-5">
            <span className="text-uppercase text-primary fw-semibold small d-inline-block mb-2">
              Bienestar Óptica
            </span>
            <h2 className="h1 fw-bold">
              Soluciones integrales para cuidar tu visión
            </h2>
            <p className="lead">
              Acompañamos cada etapa del proceso visual: desde la evaluación
              profesional hasta la entrega de lentes y el seguimiento continuo.
              Diseñamos experiencias de servicio pensadas para personas,
              familias y empresas.
            </p>

            <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-3 mt-4 text-center text-sm-start">
              <a className="btn btn-primary btn-lg px-4 py-3 d-flex align-items-center justify-content-center" href="#/agendar_cita">
                Agenda tu examen visual
              </a>
              <a
                className="btn btn-outline-primary btn-lg px-4 py-3 d-flex flex-column align-items-center justify-content-center gap-1"
                href="tel:+573024800367">
                <span className="text-uppercase small fw-semibold">Línea empresarial</span>
                <span className="fs-5 fw-bold">302 480 0367</span>
              </a>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="row g-3">
              {VALUE_POINTS.map((point) => (
                <div key={point.title} className="col-12 col-md-6">
                  <div className="card h-100 shadow-sm border-0">
                    <div className="card-body">
                      <h3 className="h5 fw-semibold">{point.title}</h3>
                      <p className="mb-0">{point.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionValueSection;
