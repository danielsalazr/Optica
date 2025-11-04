import React from "react";
import { Link } from "react-router-dom";
import foto1 from "@logos/bienestar_optica.jpg";
import foto2 from "@logos/banner.jpg";
import foto3 from "@logos/gafas-lentes.png";
import { BACKEND_BASE_URL } from "../config/api";

const STATIC_SLIDES = [
  {
    id: "bienestar",
    image: foto1,
    title: "Bienestar Optica",
    description:
      "Atencion integral, tecnologia de vanguardia y especialistas comprometidos con el cuidado de tu vision.",
    alt: "Especialista de Bienestar Optica atendiendo a un paciente",
    badge: "Optica integral",
    showGradient: true,
    showCaption: true,
  },
  {
    id: "promos",
    image: foto2,
    title: "Promociones Exclusivas",
    description:
      "Descubre lentes y monturas con descuentos especiales para que estrenes estilo y confort visual.",
    alt: "Banner publicitario de promociones y descuentos vigentes",
    badge: "Beneficios",
    showGradient: true,
    showCaption: true,
  },
  {
    id: "monturas",
    image: foto3,
    title: "Monturas Para Cada Estilo",
    description:
      "Colecciones cuidadosamente seleccionadas para que encuentres la montura perfecta para tu dia a dia.",
    alt: "Variedad de monturas opticas exhibidas sobre una mesa",
    badge: "Catalogo",
    showGradient: true,
    showCaption: true,
  },
];

const APPOINTMENTS_ENDPOINT = "/api/citas/proximas/";
const API_BASE = BACKEND_BASE_URL;

const Carousel = () => {
  const [appointmentSlides, setAppointmentSlides] = React.useState([]);
  const [hasTriedFetching, setHasTriedFetching] = React.useState(false);

  React.useEffect(() => {
    if (!API_BASE) {
      setHasTriedFetching(true);
      return () => undefined;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadAppointments = async () => {
      try {
        const response = await fetch(`${API_BASE}${APPOINTMENTS_ENDPOINT}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No fue posible cargar las proximas citas");
        }
        const data = await response.json();
        const mapped = data.map((item) => ({
          id: `cita-${item.id}`,
          image: item.image_url,
          title: item.title || "Proxima jornada",
          description:
            item.display_date && item.time_range
              ? `${item.display_date} - ${item.time_range}`
              : item.display_date || item.time_range || "",
          alt: item.title || "Proxima cita programada",
          badge: "Proximas citas",
          ctaLabel: "Agendar cita",
          ctaTo: "/agendar_cita",
          ctaState: { scrollTo: "agendar-cita" },
          showGradient: false,
          showCaption: true,
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
              {slide.showGradient && (
                <div className="carousel-gradient" aria-hidden="true" />
              )}
              {slide.showCaption !== false && (
                <div className="carousel-caption d-flex flex-column align-items-start gap-2">
                  <span className="badge rounded-pill text-bg-light text-uppercase fw-semibold tracking-wide">
                    {slide.badge || "Optica integral"}
                  </span>
                  <h5 className="carousel-title">{slide.title}</h5>
                  <p className="carousel-text mb-0">{slide.description}</p>
                  {slide.ctaLabel && (
                    <Link
                      className="carousel-cta-btn btn text-uppercase fw-semibold shadow-sm"
                      to={slide.ctaTo || "/agendar_cita"}
                      state={slide.ctaState}>
                      {slide.ctaLabel}
                    </Link>
                  )}
                </div>
              )}
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
          No se encontraron citas proximas.
        </div>
      )}
    </section>
  );
};

export default Carousel;
