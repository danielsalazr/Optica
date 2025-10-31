import React from "react";
import { BACKEND_BASE_URL } from "../config/api";
import Seo from "./Seo";

const API_BASE = BACKEND_BASE_URL;
const APPOINTMENTS_ENDPOINT = `${API_BASE}/api/citas/proximas/`;
const REGISTRATION_ENDPOINT = `${API_BASE}/api/citas/registrar/`;

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
});

const formatDateKey = (date) => date.toISOString().split("T")[0];

const buildCalendarGrid = (monthDate) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const offset = (firstDay.getDay() + 6) % 7; // Monday as first column
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((offset + totalDays) / 7) * 7;
  const cells = [];

  for (let i = 0; i < totalCells; i += 1) {
    const dayNumber = i - offset + 1;
    const cellDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayNumber);
    const isCurrentMonth = dayNumber >= 1 && dayNumber <= totalDays;
    cells.push({
      key: `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`,
      date: cellDate,
      isCurrentMonth,
    });
  }
  return cells;
};

function AgendarCita() {
  const appointmentSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Bienestar Óptica",
    url: "https://www.bienestaroptica.com/agendar_cita",
    potentialAction: {
      "@type": "ReserveAction",
      target: "https://www.bienestaroptica.com/agendar_cita",
      result: {
        "@type": "MedicalAppointment",
        name: "Consulta de optometría en Bienestar Óptica",
      },
    },
    areaServed: "Cali, Colombia",
  };
  const [appointments, setAppointments] = React.useState([]);
  const [calendarMonth, setCalendarMonth] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = React.useState("");
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [formValues, setFormValues] = React.useState({
    identificacion: "",
    nombreCompleto: "",
    celular: "",
  });
  const [status, setStatus] = React.useState({ type: null, message: "" });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!API_BASE) {
      setStatus({
        type: "error",
        message: "No se ha configurado la URL del backend. Revisa la variable BACKEND_BASE_URL.",
      });
      return () => undefined;
    }

    let isMounted = true;
    const controller = new AbortController();

    const loadAppointments = async () => {
      try {
        const response = await fetch(APPOINTMENTS_ENDPOINT, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No fue posible cargar las próximas citas.");
        }
        const data = await response.json();
        if (isMounted) {
          setAppointments(data);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setStatus({
            type: "error",
            message: "Ocurrió un error al consultar las citas disponibles.",
          });
        }
      }
    };

    loadAppointments();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const appointmentsByDate = React.useMemo(() => {
    const map = {};
    appointments.forEach((item) => {
      if (!map[item.fecha]) {
        map[item.fecha] = [];
      }
      map[item.fecha].push(item);
    });
    return map;
  }, [appointments]);

  React.useEffect(() => {
    if (!selectedDate && appointments.length) {
      const firstDate = appointments[0].fecha;
      setSelectedDate(firstDate);
      setSelectedSlot(appointments[0]);
      const parsed = new Date(firstDate);
      setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [appointments, selectedDate]);

  const calendarCells = React.useMemo(
    () => buildCalendarGrid(calendarMonth),
    [calendarMonth],
  );

  const availableSlots = React.useMemo(() => {
    if (!selectedDate) return [];
    return (appointmentsByDate[selectedDate] || []).map((slot) => ({
      id: slot.id,
      title: slot.title,
      note: slot.nota,
      timeRange: slot.time_range,
    }));
  }, [appointmentsByDate, selectedDate]);

  const handleDayClick = (cell) => {
    const key = formatDateKey(cell.date);
    if (!appointmentsByDate[key] || !appointmentsByDate[key].length) {
      return;
    }
    setSelectedDate(key);
    setSelectedSlot(appointmentsByDate[key][0]);
  };

  const handleMonthChange = (direction) => {
    setCalendarMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1),
    );
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSlotChange = (slotId) => {
    if (!selectedDate) return;
    const slot = (appointmentsByDate[selectedDate] || []).find(
      (item) => item.id === slotId,
    );
    setSelectedSlot(slot || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!API_BASE) {
      setStatus({
        type: "error",
        message: "No se ha configurado la URL del backend. Revisa la variable BACKEND_BASE_URL.",
      });
      return;
    }
    if (!selectedSlot) {
      setStatus({
        type: "error",
        message: "Selecciona una fecha y horario disponible para continuar.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: null, message: "" });

    const payload = {
      cita: selectedSlot.id,
      identificacion: formValues.identificacion,
      nombre_completo: formValues.nombreCompleto,
      celular: formValues.celular,
      hora_confirmada: selectedSlot.time_range,
    };

    try {
      const response = await fetch(REGISTRATION_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No fue posible registrar tu cita. Intenta nuevamente.");
      }

      setStatus({
        type: "success",
        message: "Recibimos tu solicitud. Te contactaremos para confirmar la agenda.",
      });
      setFormValues({
        identificacion: "",
        nombreCompleto: "",
        celular: "",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="AgendarCita">
      <Seo
        title="Agenda tu cita de optometría en Cali"
        description="Reserva en línea tu cita con nuestros especialistas en Bienestar Óptica. Selecciona fecha, horario y recibe confirmación inmediata."
        canonical="https://www.bienestaroptica.com/agendar_cita"
        jsonLd={appointmentSchema}
      />
      <div className="AgendarCita__header">
        <p className="AgendarCita__eyebrow">Agendamiento rápido</p>
        <h1>Agenda una cita empresarial o individual</h1>
        <p>
          Selecciona la fecha disponible en verde, elige el horario que mejor te funcione
          y déjanos tus datos de contacto. Nuestro equipo confirmará el registro sin
          requisitos adicionales.
        </p>
      </div>

      <div className="AgendarCita__layout">
        <div className="AgendarCita__calendarCard">
          <header className="AgendarCita__calendarHeader">
            <button
              type="button"
              className="AgendarCita__navButton"
              onClick={() => handleMonthChange(-1)}
              aria-label="Mes anterior">
              {"<"}
            </button>
            <span>{MONTH_FORMATTER.format(calendarMonth)}</span>
            <button
              type="button"
              className="AgendarCita__navButton"
              onClick={() => handleMonthChange(1)}
              aria-label="Mes siguiente">
              {">"}
            </button>
          </header>
          <div className="AgendarCita__calendarLegend">
            <span className="AgendarCita__badge AgendarCita__badge--available" /> Fechas con
            citas activas
          </div>
          <div className="AgendarCita__calendarGrid">
            {WEEKDAYS.map((day) => (
              <div key={day} className="AgendarCita__weekday">
                {day}
              </div>
            ))}
            {calendarCells.map((cell) => {
              const dateKey = formatDateKey(cell.date);
              const hasEvent = !!appointmentsByDate[dateKey]?.length;
              const isSelected = dateKey === selectedDate;
              const isDisabled = !hasEvent || !cell.isCurrentMonth;

              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`AgendarCita__day ${cell.isCurrentMonth ? "" : "is-outMonth"} ${
                    hasEvent ? "has-event" : ""
                  } ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleDayClick(cell)}
                  disabled={isDisabled}>
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="AgendarCita__formCard">
          <div className="AgendarCita__slots">
            <h2>Horarios disponibles</h2>
            {!availableSlots.length && (
              <p className="AgendarCita__emptyState">
                Selecciona una fecha disponible en el calendario para ver los horarios.
              </p>
            )}
            <div className="AgendarCita__slotList">
              {availableSlots.map((slot) => (
                <label key={slot.id} className="AgendarCita__slotOption">
                  <input
                    type="radio"
                    name="slot"
                    value={slot.id}
                    checked={selectedSlot?.id === slot.id}
                    onChange={() => handleSlotChange(slot.id)}
                  />
                  <div>
                    <span className="AgendarCita__slotTime">{slot.timeRange}</span>
                    <p>{slot.title}</p>
                    {slot.note && <small>{slot.note}</small>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <form className="AgendarCita__form" onSubmit={handleSubmit}>
            <h2>Datos del solicitante</h2>
            <div className="AgendarCita__inputs">
              <label>
                Identificación
                <input
                  type="text"
                  name="identificacion"
                  value={formValues.identificacion}
                  onChange={handleInputChange}
                  placeholder="Número de documento o registro"
                  required
                />
              </label>
              <label>
                Nombre completo
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formValues.nombreCompleto}
                  onChange={handleInputChange}
                  placeholder="Cómo debemos llamarte"
                  required
                />
              </label>
              <label>
                Número de celular
                <input
                  type="tel"
                  name="celular"
                  value={formValues.celular}
                  onChange={handleInputChange}
                  placeholder="Ej. 300 000 0000"
                  required
                />
              </label>
            </div>

            {status.message && (
              <div
                className={`AgendarCita__status ${
                  status.type === "error" ? "is-error" : "is-success"
                }`}>
                {status.message}
              </div>
            )}

            <button type="submit" className="AgendarCita__submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Reservar cita"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default AgendarCita;
