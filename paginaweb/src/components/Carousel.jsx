import React from "react";
import foto1 from "@logos/bienestar_optica.jpg";
import foto2 from "@logos/banner.jpg";
import foto3 from "@logos/gafas-lentes.png";

const slides = [
  {
    id: "bienestar",
    image: foto1,
    title: "Bienestar Óptica",
    description:
      "Atención integral, tecnología de vanguardia y especialistas comprometidos con el cuidado de tu visión.",
    alt: "Especialista de Bienestar Óptica atendiendo a un paciente",
  },
  {
    id: "promos",
    image: foto2,
    title: "Promociones Exclusivas",
    description:
      "Descubre lentes y monturas con descuentos especiales para que estrenes estilo y confort visual.",
    alt: "Banner publicitario de promociones y descuentos vigentes",
  },
  {
    id: "monturas",
    image: foto3,
    title: "Monturas Para Cada Estilo",
    description:
      "Colecciones cuidadosamente seleccionadas para que encuentres la montura perfecta para tu día a día.",
    alt: "Variedad de monturas ópticas exhibidas sobre una mesa",
  },
];

const Carousel = () => {
  return (
    <section className="carousel-section">
      <div
        id="carouselExampleCaptions"
        className="carousel slide carousel-shell"
        data-bs-ride="carousel"
        data-bs-interval="6000">
        <div className="carousel-indicators">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              data-bs-target="#carouselExampleCaptions"
              data-bs-slide-to={index}
              className={index === 0 ? "active" : ""}
              aria-current={index === 0}
              aria-label={`Slide ${index + 1}`}></button>
          ))}
        </div>

        <div className="carousel-inner">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`carousel-item carousel-item-custom ${
                index === 0 ? "active" : ""
              }`}>
              <img
                src={slide.image}
                className="carousel-img d-block w-100"
                alt={slide.alt}
                loading="lazy"
              />
              <div className="carousel-gradient" aria-hidden="true" />
              <div className="carousel-caption d-flex flex-column align-items-start gap-2">
                <span className="badge rounded-pill text-bg-light text-uppercase fw-semibold tracking-wide">
                  Óptica integral
                </span>
                <h5 className="carousel-title">{slide.title}</h5>
                <p className="carousel-text mb-0">{slide.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide="prev"
          aria-label="Anterior">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide="next"
          aria-label="Siguiente">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
        </button>
      </div>
    </section>
  );
};

export default Carousel;
