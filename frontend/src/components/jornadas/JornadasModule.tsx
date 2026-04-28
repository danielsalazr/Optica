// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { callApi } from "@/utils/js/api";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Tooltip } from "primereact/tooltip";
import BootstrapModal from "@/components/bootstrap/BootstrapModal";
import EmpresaForm from "@/components/usuarios/EmpresaForm";
import "@/styles/style.css";

type JornadaEstado = "planned" | "in_progress" | "closed";

type Jornada = {
  id: number;
  empresa: number;
  empresa_nombre: string;
  sucursal: string;
  fecha: string;
  condicion_pago: "quincenal" | "mensual" | string | null;
  fecha_inicio: string | null;
  cantidad_cuotas: number | null;
  fecha_vencimiento: string | null;
  estado: JornadaEstado;
  responsable: number | null;
  responsable_nombre: string | null;
  observaciones: string | null;
  ventas_count: number;
  total_vendido: number;
  total_abonos: number;
};

type Empresa = {
  id: number;
  nombre: string;
};

type JornadaVentaItem = {
  id: number;
  articulo_id: number;
  articulo: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  tipo_descuento: string | null;
  total: number;
};

type JornadaVentaDetalle = {
  id: number;
  cliente_id: number | null;
  cliente_nombre: string | null;
  cliente_cedula: number | null;
  cliente_telefono: string | null;
  empresa_cliente: string | null;
  fecha: string | null;
  precio: number;
  total_abono: number;
  saldo: number;
  estado_pago: string | null;
  estado_pedido: string | null;
  vendedor_nombre: string | null;
  condicion_pago: string | null;
  detalle: string | null;
  observacion: string | null;
  anulado: boolean;
  articulos_count: number;
  unidades_count: number;
  articulos: JornadaVentaItem[];
};

type JornadaDetalle = {
  id: number;
  empresa: number;
  empresa_nombre: string;
  sucursal: string;
  fecha: string;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  condicion_pago: string | null;
  cantidad_cuotas: number | null;
  estado: JornadaEstado;
  responsable: number | null;
  responsable_nombre: string | null;
  observaciones: string | null;
  resumen: {
    ventas_count: number;
    total_vendido: number;
    total_abonos: number;
    total_saldos: number;
    total_unidades: number;
  };
  ventas: JornadaVentaDetalle[];
};

type Props = {
  initialJornadas: Jornada[];
  empresas: Empresa[];
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

const formatCurrency = (valor: number | null) => currencyFormatter.format(Number(valor || 0));

const todayLocalISO = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseLocalDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  const plainDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const plainDateMatch = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    return `${day}/${month}/${year}`;
  }

  const date = parseLocalDate(value);
  if (!date) return value;

  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const sortJornadas = (records: Jornada[] = []) =>
  [...records].sort((a, b) => {
    const fechaA = parseLocalDate(a.fecha)?.getTime() || 0;
    const fechaB = parseLocalDate(b.fecha)?.getTime() || 0;
    if (fechaA === fechaB) {
      return Number(b.id || 0) - Number(a.id || 0);
    }
    return fechaB - fechaA;
  });

const JornadasModule: React.FC<Props> = ({ initialJornadas = [], empresas = [] }) => {
  const [jornadas, setJornadas] = useState<Jornada[]>(() => sortJornadas(initialJornadas));
  const [listaEmpresas, setListaEmpresas] = useState<Empresa[]>(() => empresas ?? []);
  const [modalEmpresaShow, setModalEmpresaShow] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingJornadaId, setEditingJornadaId] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<"all" | JornadaEstado>("all");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState<AlertState>(null);
  const tooltipRef = useRef<any>(null);
  const [tooltipVersion, setTooltipVersion] = useState(0);
  const [creando, setCreando] = useState(false);
  const [actualizando, setActualizando] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState<Record<number, boolean>>({});
  const [jornadaDetails, setJornadaDetails] = useState<Record<number, JornadaDetalle>>({});
  const [formData, setFormData] = useState({
    empresa: "",
    sucursal: "",
    fecha: todayLocalISO(),
    fecha_inicio: todayLocalISO(),
    condicion_pago: "quincenal",
    cantidad_cuotas: "1",
    fecha_vencimiento: todayLocalISO(),
    observaciones: "",
  });

  useEffect(() => {
    setListaEmpresas(empresas ?? []);
  }, [empresas]);

  const empresasOrdenadas = useMemo(() => {
    return [...(listaEmpresas ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [listaEmpresas]);

  const refreshTooltips = useCallback((forceRemount = false) => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      if (tooltipRef.current?.unloadTargetEvents) {
        tooltipRef.current.unloadTargetEvents();
      }
      if (forceRemount) {
        setTooltipVersion((value) => value + 1);
      }
      window.setTimeout(() => {
        if (tooltipRef.current?.loadTargetEvents) {
          tooltipRef.current.loadTargetEvents();
        }
        if (tooltipRef.current?.updateTargetEvents) {
          tooltipRef.current.updateTargetEvents();
        }
      }, 0);
    }, 0);
  }, []);

  const resumen = useMemo(() => {
    return jornadas.reduce(
      (acc, jornada) => {
        acc.total += 1;
        acc.estados[jornada.estado] += 1;
        acc.ventas += Number(jornada.ventas_count || 0);
        acc.vendido += Number(jornada.total_vendido || 0);
        acc.abonos += Number(jornada.total_abonos || 0);
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
      if (!coincideEstado) return false;
      if (!termino) return true;

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

  useEffect(() => {
    refreshTooltips(true);
  }, [refreshTooltips, jornadasFiltradas, actualizando, eliminando, expandedRows, detailLoading]);

  const upsertJornada = useCallback((registro: Jornada) => {
    setJornadas((prev) => sortJornadas([registro, ...prev.filter((item) => item.id !== registro.id)]));
  }, []);

  const removeJornada = useCallback((jornadaId: number) => {
    setJornadas((prev) => prev.filter((item) => item.id !== jornadaId));
    setJornadaDetails((prev) => {
      const next = { ...prev };
      delete next[jornadaId];
      return next;
    });
    setDetailLoading((prev) => {
      const next = { ...prev };
      delete next[jornadaId];
      return next;
    });
    setExpandedRows((prev: any) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[jornadaId];
      return Object.keys(next).length ? next : null;
    });
  }, []);

  const formatCondicionPago = useCallback((value: string | null | undefined) => {
    if (!value) return "-";
    const normalized = String(value).replace(/_/g, " ").trim();
    if (!normalized) return "-";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, []);

  const formatCliente = useCallback((venta: JornadaVentaDetalle) => {
    const parts = [venta.cliente_nombre, venta.cliente_cedula ? `CC ${venta.cliente_cedula}` : null].filter(Boolean);
    return parts.length ? parts.join(" ? ") : venta.cliente_id ? `Cliente ${venta.cliente_id}` : "-";
  }, []);

  const formatDescuento = useCallback((item: JornadaVentaItem) => {
    const descuento = Number(item.descuento || 0);
    if (!descuento) return "-";
    return item.tipo_descuento === "porcentaje" ? `${descuento} %` : `$ ${descuento.toLocaleString("es-CO")}`;
  }, []);

  const ensureJornadaDetail = useCallback(async (jornadaId: number) => {
    if (jornadaDetails[jornadaId] || detailLoading[jornadaId]) {
      return jornadaDetails[jornadaId] || null;
    }

    setDetailLoading((prev) => ({ ...prev, [jornadaId]: true }));
    try {
      const { res, data } = await callApi(`jornadas/${jornadaId}/`, { method: "GET" });
      if (!res.ok || !data) {
        throw new Error(data?.detail || "No fue posible cargar el detalle de la jornada.");
      }
      setJornadaDetails((prev) => ({ ...prev, [jornadaId]: data as JornadaDetalle }));
      return data as JornadaDetalle;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "No fue posible cargar el detalle de la jornada.";
      mostrarMensaje("error", detail);
      return null;
    } finally {
      setDetailLoading((prev) => ({ ...prev, [jornadaId]: false }));
    }
  }, [detailLoading, jornadaDetails]);

  const handleFormChange =
    (campo: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [campo]: event.target.value,
      }));
    };

  const resetForm = () => {
    setFormData({
      empresa: "",
      sucursal: "",
      fecha: todayLocalISO(),
      fecha_inicio: todayLocalISO(),
      condicion_pago: "quincenal",
      cantidad_cuotas: "1",
      fecha_vencimiento: todayLocalISO(),
      observaciones: "",
    });
    setEditingJornadaId(null);
  };

  const hydrateForm = (jornada: Jornada) => {
    setFormData({
      empresa: String(jornada.empresa || ""),
      sucursal: jornada.sucursal || "",
      fecha: jornada.fecha || todayLocalISO(),
      fecha_inicio: jornada.fecha_inicio || jornada.fecha || todayLocalISO(),
      condicion_pago: jornada.condicion_pago || "quincenal",
      cantidad_cuotas: String(Number(jornada.cantidad_cuotas || 1)),
      fecha_vencimiento: jornada.fecha_vencimiento || jornada.fecha_inicio || jornada.fecha || todayLocalISO(),
      observaciones: jornada.observaciones || "",
    });
    setEditingJornadaId(jornada.id);
    setCreateModalVisible(true);
  };

  const toISODate = (value: Date | string | null | undefined) => {
    if (!value) return "";
    const date = parseLocalDate(value);
    if (!date || Number.isNaN(date.getTime())) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const addDaysSkipping31 = (startDate: Date | string, days: number) => {
    if (!startDate || !days || days <= 0) return startDate;
    const fecha = startDate instanceof Date ? new Date(startDate.getTime()) : parseLocalDate(startDate);
    if (!fecha || Number.isNaN(fecha.getTime())) return startDate;

    let count = 0;
    while (count < days) {
      fecha.setDate(fecha.getDate() + 1);
      if (fecha.getDate() !== 31) {
        count += 1;
      }
    }
    return fecha;
  };

  const addMonthlyPeriods = (startDate: Date | string, periods: number) => {
    if (!startDate || periods <= 0) return startDate;
    const base = startDate instanceof Date ? new Date(startDate.getTime()) : parseLocalDate(startDate);
    if (!base || Number.isNaN(base.getTime())) return startDate;

    const originalDay = Math.min(base.getDate(), 30);
    const result = new Date(base.getTime());

    for (let index = 0; index < periods; index += 1) {
      const nextMonth = result.getMonth() + 1;
      const nextYear = result.getFullYear() + Math.floor(nextMonth / 12);
      const normalizedMonth = nextMonth % 12;
      const daysInTargetMonth = new Date(nextYear, normalizedMonth + 1, 0).getDate();
      const targetDay = Math.min(originalDay, daysInTargetMonth, 30);
      result.setFullYear(nextYear, normalizedMonth, targetDay);
    }

    return result;
  };

  useEffect(() => {
    const cuotas = Math.max(Number(formData.cantidad_cuotas) || 0, 1);
    const periodosRestantes = Math.max(cuotas - 1, 0);
    const nuevaFecha = formData.condicion_pago === "mensual"
      ? addMonthlyPeriods(formData.fecha_inicio, periodosRestantes)
      : addDaysSkipping31(formData.fecha_inicio, periodosRestantes * 15);

    setFormData((prev) => ({
      ...prev,
      fecha_vencimiento: toISODate(nuevaFecha as Date),
    }));
  }, [formData.condicion_pago, formData.cantidad_cuotas, formData.fecha_inicio]);

  const mostrarMensaje = (tipo: "error" | "success", texto: string) => {
    setMensaje({ tipo, mensaje: texto });
    setTimeout(() => {
      setMensaje((valorActual) => (valorActual?.mensaje === texto ? null : valorActual));
    }, 5000);
  };

  const handleNuevaEmpresa = (nuevaEmpresa: Empresa & { nit?: string; email?: string; personas_contacto?: string }) => {
    setListaEmpresas((prev) => {
      const maxId = prev.reduce((max, item) => (Number(item.id) > max ? Number(item.id) : max), 0);
      const empresaConId = {
        ...nuevaEmpresa,
        id: Number(nuevaEmpresa?.id) || maxId + 1,
      };

      setFormData((current) => ({
        ...current,
        empresa: String(empresaConId.id),
      }));

      return [...prev, empresaConId];
    });
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
        fecha_inicio: formData.fecha_inicio,
        condicion_pago: formData.condicion_pago,
        cantidad_cuotas: Number(formData.cantidad_cuotas) || 0,
        fecha_vencimiento: formData.fecha_vencimiento,
        observaciones: formData.observaciones.trim(),
      };

      const isEditing = editingJornadaId !== null;
      const { res, data } = await callApi(isEditing ? `jornadas/${editingJornadaId}/` : "jornadas/", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !data) {
        const detail = data?.detail || (isEditing ? "No fue posible actualizar la jornada." : "No fue posible crear la jornada.");
        throw new Error(detail);
      }

      upsertJornada(data as Jornada);
      resetForm();
      setCreateModalVisible(false);
      mostrarMensaje("success", isEditing ? "La jornada se actualizo correctamente." : "La jornada se creo correctamente.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : (editingJornadaId !== null ? "No fue posible actualizar la jornada." : "No fue posible crear la jornada.");
      mostrarMensaje("error", detail);
    } finally {
      setCreando(false);
    }
  };

  const handleActualizarEstado = async (jornada: Jornada, siguiente: JornadaEstado) => {
    setActualizando(jornada.id);
    setMensaje(null);
    try {
      const { res, data } = await callApi(`jornadas/${jornada.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: siguiente }),
      });

      if (!res.ok || !data) {
        const detail = data?.detail || "No fue posible actualizar el estado de la jornada.";
        throw new Error(detail);
      }

      upsertJornada(data as Jornada);
      mostrarMensaje("success", "La jornada se actualiz? correctamente.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "No fue posible actualizar el estado de la jornada.";
      mostrarMensaje("error", detail);
    } finally {
      setActualizando(null);
    }
  };

  const handleEliminarJornada = async (jornada: Jornada) => {
    const confirmado = window.confirm(`?Deseas eliminar la jornada de ${jornada.empresa_nombre}${jornada.sucursal ? ` - ${jornada.sucursal}` : ""}?`);
    if (!confirmado) return;

    setEliminando(jornada.id);
    setMensaje(null);
    try {
      const { res, data } = await callApi(`jornadas/${jornada.id}/`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const detail = data?.detail || "No fue posible eliminar la jornada.";
        throw new Error(detail);
      }

      removeJornada(jornada.id);
      if (editingJornadaId === jornada.id) {
        resetForm();
        setCreateModalVisible(false);
      }
      mostrarMensaje("success", "La jornada se elimino correctamente.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "No fue posible eliminar la jornada.";
      mostrarMensaje("error", detail);
    } finally {
      setEliminando(null);
    }
  };

  const renderEmpresaBody = (jornada: Jornada) => (
    <div>
      <div className="fw-semibold">{jornada.empresa_nombre}</div>
      <div className="text-muted small">{jornada.sucursal ? `Sucursal: ${jornada.sucursal}` : "Sin sucursal"}</div>
      {(jornada.condicion_pago || jornada.cantidad_cuotas || jornada.fecha_vencimiento) && (
        <div className="text-muted small mt-1">
          Pago: {jornada.condicion_pago || "-"} - Cuotas: {Number(jornada.cantidad_cuotas || 0)} - Vence: {formatDate(jornada.fecha_vencimiento)}
        </div>
      )}
      {jornada.observaciones && <div className="text-muted small fst-italic mt-1">{jornada.observaciones}</div>}
    </div>
  );

  const canManageJornada = (jornada: Jornada) => jornada.estado === "planned";

  const renderEstadoBody = (jornada: Jornada) => (
    <Tag
      value={ESTADO_LABELS[jornada.estado]}
      severity={jornada.estado === "closed" ? "success" : jornada.estado === "in_progress" ? "info" : "secondary"}
    />
  );

  const handleRowExpand = async (event: { data: Jornada }) => {
    await ensureJornadaDetail(event.data.id);
    refreshTooltips(true);
  };

  const renderJornadaDetalle = (jornada: Jornada) => {
    const detalle = jornadaDetails[jornada.id];
    const loading = detailLoading[jornada.id];

    if (loading && !detalle) {
      return <div className="jornadas-detail-loading">Cargando detalle de la jornada...</div>;
    }

    if (!detalle) {
      return <div className="jornadas-detail-empty">No fue posible cargar el detalle de la jornada.</div>;
    }

    return (
      <div className="jornadas-detail-wrap">
        <div className="jornadas-detail-stats">
          <div className="jornadas-detail-stat">
            <span className="jornadas-detail-label">Ventas</span>
            <strong>{detalle.resumen.ventas_count}</strong>
          </div>
          <div className="jornadas-detail-stat">
            <span className="jornadas-detail-label">Unidades</span>
            <strong>{detalle.resumen.total_unidades}</strong>
          </div>
          <div className="jornadas-detail-stat">
            <span className="jornadas-detail-label">Vendido</span>
            <strong>{formatCurrency(detalle.resumen.total_vendido)}</strong>
          </div>
          <div className="jornadas-detail-stat">
            <span className="jornadas-detail-label">Abonos</span>
            <strong>{formatCurrency(detalle.resumen.total_abonos)}</strong>
          </div>
          <div className="jornadas-detail-stat">
            <span className="jornadas-detail-label">Saldo</span>
            <strong>{formatCurrency(detalle.resumen.total_saldos)}</strong>
          </div>
        </div>

        <div className="table-responsive jornadas-detail-table-wrap">
          <table className="table table-sm align-middle mb-0 jornadas-detail-table">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Cliente</th>
                <th>Resumen</th>
                <th>Estados</th>
                <th>Articulos</th>
              </tr>
            </thead>
            <tbody>
              {detalle.ventas.length ? detalle.ventas.map((venta) => (
                <tr key={venta.id}>
                  <td>
                    <div className="fw-semibold">#{venta.id}</div>
                    <div className="small text-muted">{venta.empresa_cliente || "-"}</div>
                    <div className="small text-muted">{formatDate(venta.fecha)}</div>
                  </td>
                  <td>
                    <div>{formatCliente(venta)}</div>
                    <div className="small text-muted">{venta.cliente_telefono || "Sin telefono"}</div>
                  </td>
                  <td>
                    <div className="jornadas-detail-meta"><span className="jornadas-detail-meta-label">Precio:</span> {formatCurrency(venta.precio)}</div>
                    <div className="jornadas-detail-meta"><span className="jornadas-detail-meta-label">Abonos:</span> {formatCurrency(venta.total_abono)}</div>
                    <div className="jornadas-detail-meta"><span className="jornadas-detail-meta-label">Saldo:</span> {formatCurrency(venta.saldo)}</div>
                    <div className="jornadas-detail-meta"><span className="jornadas-detail-meta-label">Vendedor:</span> {venta.vendedor_nombre || "-"}</div>
                  </td>
                  <td>
                    <div className="jornadas-detail-meta"><span className="jornadas-detail-meta-label">Pago:</span> {venta.estado_pago || "-"}</div>
                    <div className="jornadas-detail-meta"><span className="jornadas-detail-meta-label">Pedido:</span> {venta.estado_pedido || "-"}</div>
                    <div className="jornadas-detail-meta"><span className="jornadas-detail-meta-label">Condicion:</span> {formatCondicionPago(venta.condicion_pago)}</div>
                  </td>
                  <td>
                    <div className="jornadas-detail-items">
                      {venta.articulos.length ? venta.articulos.map((item) => (
                        <div key={item.id} className="jornadas-detail-item">
                          <div className="fw-semibold">{item.articulo || `Articulo ${item.articulo_id}`}</div>
                          <div className="small text-muted">
                            Cant. {item.cantidad} ? Unit. {formatCurrency(item.precio_unitario)} ? Desc. {formatDescuento(item)} ? Total {formatCurrency(item.total)}
                          </div>
                        </div>
                      )) : <span className="text-muted">Sin articulos</span>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-3">No hay ventas asociadas a esta jornada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAccionBody = (jornada: Jornada) => {
    const accion = ESTADO_ACCIONES[jornada.estado];
    const canManage = canManageJornada(jornada);
    const bloqueado = actualizando === jornada.id || eliminando === jornada.id;
    const bloqueadoEdicion = bloqueado || !canManage;
    const manageTooltip = canManage ? "Editar jornada" : "No disponible: la jornada ya fue iniciada";
    const deleteTooltip = canManage
      ? (eliminando === jornada.id ? "Eliminando jornada" : "Eliminar jornada")
      : "No disponible: la jornada ya fue iniciada";

    return (
      <div className="gap-2 d-flex justify-content-end flex-wrap">
        {accion ? (
          <button
            type="button"
            className="btn-action btn btn-sm btn-outline-secondary jornadas-action-tooltip"
            data-pr-tooltip={actualizando === jornada.id ? "Actualizando estado" : accion.label}
            data-pr-position="top"
            disabled={bloqueado}
            onClick={() => handleActualizarEstado(jornada, accion.value)}
          >
            {actualizando === jornada.id ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M12 6V3m-6.364 4.636L3.514 6.514m14.95 1.122l2.122-2.122M6 12H3m18 0h-3m-9 6v3m11.314-5.314l-2.122 2.122M5.05 17.95l-2.122 2.122"/><circle cx="12" cy="12" r="3"/></g></svg>
            )}
          </button>
        ) : (
          <span className="text-muted small align-self-center">Jornada cerrada</span>
        )}

        <button
          type="button"
          className="btn-action btn btn-sm btn-primary jornadas-action-tooltip"
          data-pr-tooltip={manageTooltip}
          data-pr-position="top"
          disabled={bloqueadoEdicion}
          onClick={() => canManage && hydrateForm(jornada)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16zm9.5-13.5l4 4" /></svg>
        </button>

        <button
          type="button"
          className="btn-action btn btn-sm btn-danger jornadas-action-tooltip"
          data-pr-tooltip={deleteTooltip}
          data-pr-position="top"
          disabled={bloqueadoEdicion}
          onClick={() => canManage && handleEliminarJornada(jornada)}
        >
          {eliminando === jornada.id ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      <Tooltip key={tooltipVersion} ref={tooltipRef} target=".jornadas-action-tooltip" showDelay={120} hideDelay={80} />

      <BootstrapModal
        show={modalEmpresaShow}
        onHide={() => setModalEmpresaShow(false)}
        title="Crear Empresa"
        onSubmit={handleNuevaEmpresa}
        submitBtn="Crear"
      >
        <EmpresaForm />
      </BootstrapModal>

      <Dialog
        header={editingJornadaId !== null ? "Editar jornada" : "Nueva jornada"}
        visible={createModalVisible}
        style={{ width: "min(860px, 94vw)" }}
        contentClassName="jornadas-create-dialog-content"
        modal
        draggable={false}
        onHide={() => { setCreateModalVisible(false); resetForm(); }}
      >
        <form className="row g-2 jornadas-modal-form" onSubmit={handleCrearJornada}>
          <div className="col-12">
            <label className="form-label" htmlFor="empresa">Empresa</label>
            <div className="input-group">
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
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => setModalEmpresaShow(true)}
                aria-label="Crear empresa"
                title="Crear empresa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 1024 1024"><path fill="currentColor" d="M839.7 734.7c0 33.3-17.9 41-17.9 41S519.7 949.8 499.2 960c-10.2 5.1-20.5 5.1-30.7 0c0 0-314.9-184.3-325.1-192c-5.1-5.1-10.2-12.8-12.8-20.5V368.6c0-17.9 20.5-28.2 20.5-28.2L466 158.6q19.2-7.65 38.4 0s279 161.3 309.8 179.2c17.9 7.7 28.2 25.6 25.6 46.1c-.1-5-.1 317.5-.1 350.8M714.2 371.2c-64-35.8-217.6-125.4-217.6-125.4c-7.7-5.1-20.5-5.1-30.7 0L217.6 389.1s-17.9 10.2-17.9 23v297c0 5.1 5.1 12.8 7.7 17.9c7.7 5.1 256 148.5 256 148.5c7.7 5.1 17.9 5.1 25.6 0c15.4-7.7 250.9-145.9 250.9-145.9s12.8-5.1 12.8-30.7v-74.2l-276.5 169v-64c0-17.9 7.7-30.7 20.5-46.1L745 535c5.1-7.7 10.2-20.5 10.2-30.7v-66.6l-279 169v-69.1c0-15.4 5.1-30.7 17.9-38.4zM919 135.7c0-5.1-5.1-7.7-7.7-7.7h-58.9V66.6c0-5.1-5.1-5.1-10.2-5.1l-30.7 5.1c-5.1 0-5.1 2.6-5.1 5.1V128h-56.3c-5.1 0-5.1 5.1-7.7 5.1v38.4h69.1v64c0 5.1 5.1 5.1 10.2 5.1l30.7-5.1c5.1 0 5.1-2.6 5.1-5.1v-56.3h64z"></path></svg>
              </button>
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="sucursal">Sucursal o punto</label>
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
            <label className="form-label" htmlFor="fecha">Fecha</label>
            <Calendar
              inputId="fecha"
              value={parseLocalDate(formData.fecha)}
              onChange={(e) => setFormData((prev) => ({ ...prev, fecha: toISODate(e.value) }))}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-100"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="fecha_inicio">Fecha de inicio</label>
            <Calendar
              inputId="fecha_inicio"
              value={parseLocalDate(formData.fecha_inicio)}
              onChange={(e) => setFormData((prev) => ({ ...prev, fecha_inicio: toISODate(e.value) }))}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-100"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="condicion_pago">Condicion de pago</label>
            <select
              id="condicion_pago"
              className="form-select"
              value={formData.condicion_pago}
              onChange={handleFormChange("condicion_pago")}
            >
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="cantidad_cuotas">Cantidad de cuotas</label>
            <input
              type="number"
              id="cantidad_cuotas"
              className="form-control"
              min={1}
              value={formData.cantidad_cuotas}
              onChange={handleFormChange("cantidad_cuotas")}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="fecha_vencimiento">Fecha de vencimiento</label>
            <Calendar
              inputId="fecha_vencimiento"
              value={parseLocalDate(formData.fecha_vencimiento)}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-100"
              readOnlyInput
            />
          </div>

          <div className="col-md-6">
            <label className="form-label" htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              className="form-control"
              rows={2}
              placeholder="Detalle objetivo, responsable o notas de la jornada"
              value={formData.observaciones}
              onChange={handleFormChange("observaciones")}
            />
            <small className="text-muted">Se evita crear jornadas duplicadas para una misma empresa, sucursal y fecha.</small>
          </div>

          <div className="col-12 d-flex justify-content-end gap-2 pt-1">
            <Button type="button" label="Cancelar" severity="secondary" outlined className="jornadas-modal-button p-button-rounded" onClick={() => { setCreateModalVisible(false); resetForm(); }} />
            <Button type="submit" label={creando ? (editingJornadaId !== null ? "Guardando..." : "Creando...") : (editingJornadaId !== null ? "Guardar cambios" : "Crear jornada")} loading={creando} className="jornadas-modal-button p-button-rounded" />
          </div>
        </form>
      </Dialog>

      <section className="jornadas-module">
        <div className="ventas-toolbar mb-4 jornadas-toolbar-top">
          <div>
            <h1 className="ventas-page-title mb-1">Jornadas comerciales</h1>
            <p className="text-muted mb-0">
              Crea y monitorea las jornadas de venta por empresa y sucursal para validar los pedidos generados.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge text-bg-primary px-3 py-2">
              {resumen.total} registro{resumen.total === 1 ? "" : "s"}
            </span>
          </div>
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
            <div className="display-6 fw-semibold">{resumen.estados.planned + resumen.estados.in_progress}</div>
          </div>
        </div>

        <div className="ventas-card jornadas-panel jornadas-panel-full">
          <div className="jornadas-panel-actions mb-3">
            <Button
              label="Nueva jornada"
              icon="pi pi-plus"
              onClick={() => { resetForm(); setCreateModalVisible(true); }}
              className="jornadas-create-button p-button-rounded"
            />
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center mb-3 justify-content-between">
            <div className="flex-grow-1 jornadas-filtros">
              {filtros.map((filtro) => (
                <button
                  key={filtro.value}
                  type="button"
                  className={`btn btn-sm ${filtroEstado === filtro.value ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setFiltroEstado(filtro.value)}
                >
                  {filtro.label}
                  <span className="badge text-bg-light ms-2">{filtro.count}</span>
                </button>
              ))}
            </div>
            <div className="jornadas-busqueda">
              <span className="p-input-icon-left w-100">
                <i className="pi pi-search" />
                <InputText
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar empresa, responsable o nota"
                  className="w-100"
                />
              </span>
            </div>
          </div>

          {mensaje && (
            <div className={`alert alert-${mensaje.tipo === "error" ? "danger" : "success"} py-2`} role="alert">
              {mensaje.mensaje}
            </div>
          )}

          <DataTable
            value={jornadasFiltradas}
            expandedRows={expandedRows}
            onRowToggle={(event) => setExpandedRows(event.data)}
            onRowExpand={handleRowExpand}
            onRowCollapse={() => refreshTooltips(true)}
            rowExpansionTemplate={renderJornadaDetalle}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 20, 50]}
            stripedRows
            showGridlines
            responsiveLayout="scroll"
            className="jornadas-table p-datatable-sm"
            dataKey="id"
            paginatorTemplate="RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
            emptyMessage="No hay jornadas para los filtros seleccionados."
          >
            <Column expander style={{ width: "3.5rem" }} />
            <Column field="empresa_nombre" header="Empresa" sortable style={{ minWidth: "22rem" }} body={renderEmpresaBody} />
            <Column field="fecha" header="Fecha" sortable body={(jornada: Jornada) => formatDate(jornada.fecha)} style={{ minWidth: "9rem" }} />
            <Column field="ventas_count" header="Ventas" sortable body={(jornada: Jornada) => <span className="fw-semibold">{Number(jornada.ventas_count || 0)}</span>} bodyClassName="text-center" style={{ width: "7rem" }} />
            <Column field="total_vendido" header="Total vendido" sortable body={(jornada: Jornada) => formatCurrency(jornada.total_vendido)} bodyClassName="text-center" style={{ minWidth: "10rem" }} />
            <Column field="total_abonos" header="Abonos" sortable body={(jornada: Jornada) => formatCurrency(jornada.total_abonos)} bodyClassName="text-center" style={{ minWidth: "10rem" }} />
            <Column field="responsable_nombre" header="Responsable" sortable body={(jornada: Jornada) => jornada.responsable_nombre || "-"} style={{ minWidth: "12rem" }} />
            <Column field="estado" header="Estado" sortable body={renderEstadoBody} style={{ minWidth: "10rem" }} />
            <Column header="Accion" body={renderAccionBody} bodyClassName="text-end" style={{ minWidth: "11rem" }} />
          </DataTable>
        </div>
      </section>
    </>
  );
};

export default JornadasModule;
