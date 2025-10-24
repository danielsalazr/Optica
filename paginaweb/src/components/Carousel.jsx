import React from "react";
import foto1 from "@logos/bienestar_optica.jpg";
import foto2 from "@logos/banner.jpg";
import foto3 from "@logos/gafas-lentes.png";

const STATIC_SLIDES = [
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
  // },
];

const APPOINTMENTS_ENDPOINT = "/api/citas/proximas/";

const Carousel = () => {
  const [appointmentSlides, setAppointmentSlides] = React.useState([]);
  const [hasTriedFetching, setHasTriedFetching] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadAppointments = async () => {
      try {
        const response = await fetch(`http://localhost:8000${APPOINTMENTS_ENDPOINT}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No fue posible cargar las próximas citas");
        }
        const data = await response.json();
        const mapped = data.map((item) => ({
          id: `cita-${item.id}`,
          image: item.image_url,
          title: item.title || "Próxima jornada",
          description: `${item.display_date} · ${item.time_range}`,
          alt: item.title || "Próxima cita programada",
          badge: "Próximas citas",
        }));
        if (isMounted) {
          setAppointmentSlides(mapped);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn(error.message);
        }
      } finally {
        if (isMounted) {
          setHasTriedFetching(true);
        }
      }
    };

    loadAppointments();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const slides = React.useMemo(() => {
    if (!appointmentSlides.length) {
      return STATIC_SLIDES;
    }
    return [...appointmentSlides, ...STATIC_SLIDES];
  }, [appointmentSlides]);

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
              aria-current={index === 0 ? "true" : "false"}
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
                src={slide.image || foto1}
                className="carousel-img d-block w-100"
                alt={slide.alt || slide.title}
                loading="lazy"
              />
              <div className="carousel-gradient" aria-hidden="true" />
              <div className="carousel-caption d-flex flex-column align-items-start gap-2">
                <span className="badge rounded-pill text-bg-light text-uppercase fw-semibold tracking-wide">
                  {slide.badge || "Óptica integral"}
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
      {hasTriedFetching && !appointmentSlides.length && (
        <div className="visually-hidden" aria-live="polite">
          No se encontraron citas próximas.
        </div>
      )}
    </section>
  );
};

export default Carousel;
