import React, { useMemo, useState } from "react";
import { Timeline } from "primereact/timeline";
import { BACKEND_BASE_URL } from "../config/api";

const ESTADO_LABELS = {
  completed: "Completado",
  current: "Actual",
  pending: "Pendiente",
};

const money = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CO", { year: "numeric", month: "2-digit", day: "2-digit" });
};

function TrackingVenta() {
  const [cedula, setCedula] = useState("");
  const [venta, setVenta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canSearch = useMemo(() => cedula.trim() && venta.trim(), [cedula, venta]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSearch) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const base = (BACKEND_BASE_URL || "").replace(/\/+$/, "");
      const response = await fetch(`${base}/api/tracking/venta/?cedula=${encodeURIComponent(cedula.trim())}&venta=${encodeURIComponent(venta.trim())}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "No fue posible consultar el tracking.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible consultar el tracking.");
    } finally {
      setLoading(false);
    }
  };

  const marker = (item) => (
    <span
      className={`tracking-marker tracking-marker-${item.stage}`}
      style={{ backgroundColor: item.color, borderColor: item.color }}
    />
  );

  const opposite = (item) => (
    <div className="tracking-opposite">
      <span className={`tracking-stage tracking-stage-${item.stage}`}>{ESTADO_LABELS[item.stage]}</span>
      <small>{formatDate(item.date)}</small>
    </div>
  );

  const content = (item) => (
    <div className={`tracking-card tracking-card-${item.stage}`}>
      <div className="tracking-card-title">{item.label}</div>
      <div className="tracking-card-copy">
        {item.stage === "current"
          ? "Este es el estado actual de tu pedido."
          : item.stage === "completed"
            ? "Esta etapa ya fue completada."
            : "Esta etapa aun no se ha alcanzado."}
      </div>
    </div>
  );

  return (
    <section className="tracking-page container-xl py-5">
      <div className="tracking-hero">
        <div>
          <span className="tracking-eyebrow">Seguimiento de pedido</span>
          <h1>Consulta el estado de tu venta</h1>
          <p>Ingresa tu cedula y el numero de venta para conocer el avance de tu pedido.</p>
        </div>
      </div>

      <div className="tracking-search-card">
        <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
          <div className="col-md-5">
            <label className="form-label">Cedula</label>
            <input
              type="text"
              className="form-control"
              value={cedula}
              onChange={(event) => setCedula(event.target.value)}
              placeholder="Ej. 123456789"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Numero de venta</label>
            <input
              type="text"
              className="form-control"
              value={venta}
              onChange={(event) => setVenta(event.target.value)}
              placeholder="Ej. 172"
            />
          </div>
          <div className="col-md-3 d-grid">
            <button type="submit" className="btn btn-primary tracking-submit" disabled={!canSearch || loading}>
              {loading ? "Consultando..." : "Consultar tracking"}
            </button>
          </div>
        </form>
        {error ? <div className="alert alert-danger mt-3 mb-0">{error}</div> : null}
      </div>

      {result ? (
        <div className="tracking-result-grid">
          <div className="tracking-summary-card">
            <div className="tracking-summary-top">
              <div>
                <span className="tracking-eyebrow">Venta #{result.venta_id}</span>
                <h2>{result.cliente || "Cliente"}</h2>
                <p>{result.empresa || "Sin empresa"}</p>
              </div>
              <span className="tracking-current-badge" style={{ backgroundColor: result.timeline?.find((item) => item.stage === "current")?.color || "#6c757d" }}>
                {result.estado_pedido}
              </span>
            </div>

            <div className="tracking-summary-grid">
              <div>
                <span>Total venta</span>
                <strong>{money(result.precio)}</strong>
              </div>
              <div>
                <span>Abonos</span>
                <strong>{money(result.total_abonos)}</strong>
              </div>
              <div>
                <span>Saldo</span>
                <strong>{money(result.saldo)}</strong>
              </div>
              <div>
                <span>Cuotas</span>
                <strong>{result.cuotas || 0}</strong>
              </div>
              <div>
                <span>Estado pago</span>
                <strong>{result.estado_pago || "Sin dato"}</strong>
              </div>
              <div>
                <span>Fecha venta</span>
                <strong>{formatDate(result.fecha)}</strong>
              </div>
            </div>

            {result.motivo_sin_anticipo ? (
              <div className="tracking-note">Motivo sin anticipo: {result.motivo_sin_anticipo}</div>
            ) : null}
            {result.observacion ? <div className="tracking-note">Observacion: {result.observacion}</div> : null}
          </div>

          <div className="tracking-timeline-card">
            <h3>Linea de tiempo del pedido</h3>
            <Timeline
              value={result.timeline || []}
              align="alternate"
              className="tracking-timeline"
              marker={marker}
              opposite={opposite}
              content={content}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default TrackingVenta;
