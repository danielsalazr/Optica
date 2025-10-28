"use client";

import React, { useCallback, useMemo, useState } from "react";
import { IP_URL } from "@/utils/js/api";

type JornadaEstado = "planned" | "in_progress" | "closed";

type Jornada = {
  id: number;
  empresa: number;
  empresa_nombre: string;
  sucursal?: string;
  fecha: string;
  estado: JornadaEstado;
  responsable?: number | null;
  responsable_nombre?: string | null;
  observaciones?: string | null;
  ventas_count?: number;
  total_vendido?: number;
  total_abonos?: number;
};

type Empresa = {
  id: number;
  nombre: string;
};

type Props = {
  initialJornadas?: Jornada[];
  empresas?: Empresa[];
};

type AlertState = {
  tipo: "error" | "success";
  mensaje: string;
} | null;

const ESTADO_LABELS: Record<JornadaEstado, string> = {
  planned: "Planificada",
  in_progress: "En progreso",
  closed: "Cerrada",
};

const ESTADO_BADGES: Record<JornadaEstado, string> = {
  planned: "secondary",
  in_progress: "info",
  closed: "success",
};

const ESTADO_ACCIONES: Record<JornadaEstado, { value: JornadaEstado; label: string } | null> = {
  planned: { value: "in_progress", label: "Iniciar jornada" },
  in_progress: { value: "closed", label: "Cerrar jornada" },
  closed: null,
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatCurrency = (valor?: number | null) => currencyFormatter.format(valor ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const sortJornadas = (records: Jornada[] = []) =>
  [...records].sort((a, b) => {
    const fechaA = new Date(a.fecha).getTime();
    const fechaB = new Date(b.fecha).getTime();
    if (fechaA === fechaB) {
      return (b.id ?? 0) - (a.id ?? 0);
    }
    return fechaB - fechaA;
  });

const JornadasModule: React.FC<Props> = ({ initialJornadas = [], empresas = [] }) => {
  const [jornadas, setJornadas] = useState<Jornada[]>(() => sortJornadas(initialJornadas));
  const [filtroEstado, setFiltroEstado] = useState<"all" | JornadaEstado>("all");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState<AlertState>(null);
  const [creando, setCreando] = useState(false);
  const [actualizando, setActualizando] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    empresa: "",
    sucursal: "",
    fecha: new Date().toISOString().split("T")[0],
    observaciones: "",
  });

  const empresasOrdenadas = useMemo(() => {
    return [...(empresas ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [empresas]);

  const resumen = useMemo(() => {
    return jornadas.reduce(
      (acc, jornada) => {
        acc.total += 1;
        acc.estados[jornada.estado] += 1;
        acc.ventas += jornada.ventas_count ?? 0;
        acc.vendido += jornada.total_vendido ?? 0;
        acc.abonos += jornada.total_abonos ?? 0;
        return acc;
      },
      {
        total: 0,
        estados: {
          planned: 0,
          in_progress: 0,
          closed: 0,
        },
        ventas: 0,
        vendido: 0,
        abonos: 0,
      }
    );
  }, [jornadas]);

  const filtros = useMemo(
    () => [
      { value: "all" as const, label: "Todas", count: resumen.total },
      { value: "planned" as const, label: "Planificadas", count: resumen.estados.planned },
      { value: "in_progress" as const, label: "En progreso", count: resumen.estados.in_progress },
      { value: "closed" as const, label: "Cerradas", count: resumen.estados.closed },
    ],
    [resumen]
  );

  const jornadasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return jornadas.filter((jornada) => {
      const coincideEstado = filtroEstado === "all" || jornada.estado === filtroEstado;
      if (!coincideEstado) {
        return false;
      }
      if (!termino) {
        return true;
      }
      const campos = [
        jornada.empresa_nombre,
        jornada.sucursal,
        jornada.responsable_nombre,
        jornada.observaciones,
      ]
        .filter(Boolean)
        .map((campo) => campo!.toLowerCase());

      return campos.some((campo) => campo.includes(termino));
    });
  }, [busqueda, filtroEstado, jornadas]);

  const upsertJornada = useCallback((registro: Jornada) => {
    setJornadas((prev) => sortJornadas([registro, ...prev.filter((item) => item.id !== registro.id)]));
  }, []);

  const handleFormChange = (campo: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormData({
      empresa: "",
      sucursal: "",
      fecha: new Date().toISOString().split("T")[0],
      observaciones: "",
    });
  };

  const mostrarMensaje = (tipo: "error" | "success", texto: string) => {
    setMensaje({ tipo, mensaje: texto });
    setTimeout(() => {
      setMensaje((valorActual) => (valorActual?.mensaje === texto ? null : valorActual));
    }, 5000);
  };

  const handleCrearJornada = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.empresa) {
      mostrarMensaje("error", "Selecciona la empresa para la jornada.");
      return;
    }
    if (!formData.fecha) {
      mostrarMensaje("error", "Selecciona la fecha de la jornada.");
      return;
    }

    setCreando(true);
    setMensaje(null);
    try {
      const payload = {
        empresa: Number(formData.empresa),
        sucursal: formData.sucursal.trim(),
        fecha: formData.fecha,
        observaciones: formData.observaciones.trim(),
      };

      const response = await fetch(`${IP_URL()}jornadas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        const detail = data?.detail ?? "No fue posible crear la jornada.";
        throw new Error(detail);
      }

      upsertJornada(data as Jornada);
      resetForm();
      mostrarMensaje("success", "La jornada se creó correctamente.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "No fue posible crear la jornada.";
      mostrarMensaje("error", detail);
    } finally {
      setCreando(false);
    }
  };

  const handleActualizarEstado = async (jornada: Jornada, siguiente: JornadaEstado) => {
    setActualizando(jornada.id);
    setMensaje(null);
    try {
      const response = await fetch(`${IP_URL()}jornadas/${jornada.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ estado: siguiente }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        const detail = data?.detail ?? "No fue posible actualizar el estado de la jornada.";
        throw new Error(detail);
      }

      upsertJornada(data as Jornada);
      mostrarMensaje("success", "La jornada se actualizó correctamente.");
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "No fue posible actualizar el estado de la jornada.";
      mostrarMensaje("error", detail);
    } finally {
      setActualizando(null);
    }
  };

  return (
    <section className="jornadas-module">
      <div className="ventas-toolbar mb-4">
        <div>
          <h1 className="ventas-page-title mb-1">Jornadas comerciales</h1>
          <p className="text-muted mb-0">
            Crea y monitorea las jornadas de venta por empresa y sucursal para validar los pedidos generados.
          </p>
        </div>
        <span className="badge text-bg-primary px-3 py-2">
          {resumen.total} registro{resumen.total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="jornadas-stats mb-4">
        <div className="ventas-card">
          <div className="text-muted small text-uppercase">Ventas en jornadas</div>
          <div className="display-6 fw-semibold">{resumen.ventas}</div>
        </div>
        <div className="ventas-card">
          <div className="text-muted small text-uppercase">Total vendido</div>
          <div className="display-6 fw-semibold">{formatCurrency(resumen.vendido)}</div>
        </div>
        <div className="ventas-card">
          <div className="text-muted small text-uppercase">Total abonos</div>
          <div className="display-6 fw-semibold">{formatCurrency(resumen.abonos)}</div>
        </div>
        <div className="ventas-card">
          <div className="text-muted small text-uppercase">Activas</div>
          <div className="display-6 fw-semibold">
            {resumen.estados.planned + resumen.estados.in_progress}
          </div>
        </div>
      </div>

      <div className="jornadas-grid">
        <div className="ventas-card jornadas-form">
          <h4 className="mb-3">Nueva jornada</h4>
          <form className="row g-3" onSubmit={handleCrearJornada}>
            <div className="col-12">
              <label className="form-label" htmlFor="empresa">
                Empresa
              </label>
              <select
                id="empresa"
                className="form-select"
                value={formData.empresa}
                onChange={handleFormChange("empresa")}
                required
              >
                <option value="">Selecciona una empresa</option>
                {empresasOrdenadas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="sucursal">
                Sucursal o punto
              </label>
              <input
                type="text"
                id="sucursal"
                className="form-control"
                placeholder="Ej. Sede Norte, Planta 2"
                value={formData.sucursal}
                onChange={handleFormChange("sucursal")}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="fecha">
                Fecha
              </label>
              <input
                type="date"
                id="fecha"
                className="form-control"
                value={formData.fecha}
                onChange={handleFormChange("fecha")}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="observaciones">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                className="form-control"
                rows={3}
                placeholder="Detalle objetivo, responsable o notas de la jornada"
                value={formData.observaciones}
                onChange={handleFormChange("observaciones")}
              />
              <small className="text-muted">
                Se evita crear jornadas duplicadas para una misma empresa, sucursal y fecha.
              </small>
            </div>
            <div className="col-12 d-grid">
              <button type="submit" className="btn btn-primary" disabled={creando}>
                {creando ? "Creando..." : "Crear jornada"}
              </button>
            </div>
          </form>
        </div>

        <div className="ventas-card jornadas-panel">
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <div className="flex-grow-1 jornadas-filtros">
              {filtros.map((filtro) => (
                <button
                  key={filtro.value}
                  type="button"
                  className={`btn btn-sm ${
                    filtroEstado === filtro.value ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => setFiltroEstado(filtro.value)}
                >
                  {filtro.label}
                  <span className="badge text-bg-light ms-2">{filtro.count}</span>
                </button>
              ))}
            </div>
            <div className="jornadas-busqueda">
              <div className="input-group input-group-sm">
                <span className="input-group-text">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.656a5 5 0 1 1 0-10 5 5 0 0 1 0 10" />
                  </svg>
                </span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Buscar empresa, responsable o nota"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                />
              </div>
            </div>
          </div>

          {mensaje && (
            <div
              className={`alert alert-${mensaje.tipo === "error" ? "danger" : "success"} py-2`}
              role="alert"
            >
              {mensaje.mensaje}
            </div>
          )}

          <div className="table-modern table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Fecha</th>
                  <th className="text-center">Ventas</th>
                  <th className="text-center">Total vendido</th>
                  <th className="text-center">Abonos</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {jornadasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No hay jornadas para los filtros seleccionados.
                    </td>
                  </tr>
                )}
                {jornadasFiltradas.map((jornada) => {
                  const accion = ESTADO_ACCIONES[jornada.estado];
                  return (
                    <tr key={jornada.id}>
                      <td>
                        <div className="fw-semibold">{jornada.empresa_nombre}</div>
                        <div className="text-muted small">
                          {jornada.sucursal ? `Sucursal: ${jornada.sucursal}` : "Sin sucursal"}
                        </div>
                        {jornada.observaciones && (
                          <div className="text-muted small fst-italic mt-1">
                            {jornada.observaciones}
                          </div>
                        )}
                      </td>
                      <td>{formatDate(jornada.fecha)}</td>
                      <td className="text-center fw-semibold">{jornada.ventas_count ?? 0}</td>
                      <td className="text-center">{formatCurrency(jornada.total_vendido)}</td>
                      <td className="text-center">{formatCurrency(jornada.total_abonos)}</td>
                      <td>{jornada.responsable_nombre || "—"}</td>
                      <td>
                        <span className={`badge text-bg-${ESTADO_BADGES[jornada.estado]} px-3 py-2`}>
                          {ESTADO_LABELS[jornada.estado]}
                        </span>
                      </td>
                      <td className="text-end">
                        {accion ? (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            disabled={actualizando === jornada.id}
                            onClick={() => handleActualizarEstado(jornada, accion.value)}
                          >
                            {actualizando === jornada.id ? "Actualizando..." : accion.label}
                          </button>
                        ) : (
                          <span className="text-muted small">Jornada cerrada</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JornadasModule;
