// @ts-nocheck
﻿"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { useTablePagination } from '@/hooks/useTablePagination';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import RemisionesMobileList from './RemisionesMobileList';
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Paginator } from 'primereact/paginator';
import { Tag } from "primereact/tag";
import { moneyformat } from "@/utils/js/utils";
import { buildMediaUrl, buildPrintAgentUrl } from "@/utils/js/env";
import { swalErr, swalconfirmation, swalQuestion } from "@/utils/js/sweetAlertFunctions";
import { callApi } from "@/utils/js/api";
import { useAuth } from '@/components/auth/AuthProvider';
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";

import "@/styles/style.css";
import "@/styles/remisiones-workspace.css";

type RemisionItem = {
  id: number;
  itemVenta: number;
  cantidad: number;
  cantidadDespachada: number;
  restante: number;
  precioUnitario: number;
  totalRemisionado: number;
  descuento: number;
  tipoDescuento?: string | null;
  articulo: {
    id: number;
    nombre: string;
  };
};

type Abono = {
  id: number;
  precio: number;
  medioDePago: number;
  medioPagoNombre: string | null;
  fecha: string | null;
  fechaRegistro?: string | null;
  descripcion: string | null;
};

type RemisionRow = {
  id: number;
  venta: number;
  cliente: {
    cedula: number;
    nombre: string;
    telefono: string;
  };
  empresaCliente: string | null;
  fecha: string;
  creado_en: string;
  observacion: string | null;
  items: RemisionItem[];
  totalRemision: number;
  abonos: Abono[];
  totalVenta?: number | null;
  totalAbonado?: number | null;
  saldoVenta?: number | null;
  condicionPago: string | null;
  compromisoPago: number | null;
  numeroCuotas: number | null;
  fechaInicio: string | null;
  fechaVencimiento: string | null;
  valorCuota: number | null;
  cuotasPagadas: number | null;
  anulado?: boolean;
  detalleAnulacion?: string | null;
  usuarioAnulacion?: number | null;
  fechaAnulacion?: string | null;
};

type PreparedRemisionRow = RemisionRow & {
  clienteNombre: string;
  clienteCedula: string;
  fechaFormateada: string;
  itemsCount: number;
  cantidadRemitida: number;
  totalDespachado: number;
  totalRemision: number;
  empresaCliente: string;
  estadoRemision: 'activa' | 'anulada';
};

type ColumnMeta = {
  field: keyof PreparedRemisionRow | string;
  header: string;
  sortable: boolean;
  bodyClassName: string;
};

type Props = {
  data: RemisionRow[];
};

const formatDescuento = (descuento: number | null | undefined, tipo: string | null | undefined) => {
  const value = Number(descuento || 0);
  if (!value) {
    return tipo === 'porcentaje' ? '0 %' : '$ 0';
  }
  return tipo === 'porcentaje' ? `${value} %` : `$ ${value.toLocaleString('es-CO')}`;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";

  const raw = String(value).trim();
  const plainDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    return `${day}/${month}/${year}`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const parseLocalDateValue = (value: string | null | undefined) => {
  if (!value) return null;
  const raw = String(value).trim();
  const plainDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toLocalDateInputValue = (date: Date | null) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayLocalDate = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
};

const RemisionesData: React.FC<Props> = ({ data }) => {
  const { can } = useAuth();
  const pagination = useTablePagination('remisiones', 10, [5, 10, 20, 50, 100]);
  const mobileLayout = useMobileLayout();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [tableSort, setTableSort] = useState({ field: 'id', order: -1 });
  const [tableData, setTableData] = useState<RemisionRow[]>(data ?? []);
  const [activeRemision, setActiveRemision] = useState<PreparedRemisionRow | null>(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState<string>("");
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [formulaLoading, setFormulaLoading] = useState(false);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [formulaImages, setFormulaImages] = useState<string[]>([]);
  const [estadoRemisionFilter, setEstadoRemisionFilter] = useState<'todas' | 'activas' | 'anuladas'>('todas');
  const [datePreset, setDatePreset] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const tooltipRef = useRef<any>(null);
  const [tooltipVersion, setTooltipVersion] = useState(0);

  const refreshRemisionTooltips = (forceRemount = false) => {
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
  };

  useEffect(() => {
    setTableData(data ?? []);
  }, [data]);

  useEffect(() => {
    refreshRemisionTooltips(true);
  }, [tableData, estadoRemisionFilter, globalFilterValue, datePreset, fechaDesde, fechaHasta, expandedRows]);

  const resolveMediaUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/media/")) {
      return buildMediaUrl(path);
    }
    return buildMediaUrl(`media/${path.replace(/^\/+/, "")}`);
  };

  const handleFormulaModal = useCallback(async (row: PreparedRemisionRow) => {
    if (!row?.venta) return;
    setActiveRemision(row);
    setFormulaOpen(true);
    setFormulaLoading(true);
    setFormulaError(null);
    setFormulaImages([]);
    try {
      const req = await callApi(`venta/${row.venta}`);
      if (!req.res.ok) {
        throw new Error(req.data.detail || "No fue posible obtener la f?rmula.");
      }
      const data = req.data || {};
      const candidates: string[] = [];
      if (Array.isArray(data.foto_formula)) {
        candidates.push(...data.foto_formula);
      } else if (data.foto_formula) {
        candidates.push(data.foto_formula);
      }
      if (Array.isArray(data.formulas)) {
        candidates.push(...data.formulas);
      }
      const resolved = candidates
        .map((item) => resolveMediaUrl(item))
        .filter(Boolean) as string[];

      if (!resolved.length) {
        setFormulaError("No hay f?rmulas asociadas a esta venta.");
      }
      setFormulaImages(resolved);
    } catch (error) {
      setFormulaError(error instanceof Error ? error.message : "Error al cargar la f?rmula.");
    } finally {
      setFormulaLoading(false);
    }
  }, []);

  const handlePrintRemision = useCallback(async (row: PreparedRemisionRow) => {
    if (!row) return;
    setActiveRemision(row);

    setPrinting(true);
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("optica_print_agent_token") || "" : "";
      const agentHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token.trim()) {
        agentHeaders.Authorization = `Bearer ${token.trim()}`;
      }

      const ventaReq = await callApi(`venta/${row.venta}`);
      if (!ventaReq.res.ok) {
        throw new Error(ventaReq.data.detail || "No fue posible obtener el detalle de la venta para imprimir.");
      }

      const ventaData = ventaReq.data || {};
      const abonos = Array.isArray(row.abonos) ? row.abonos : [];
      const abonado = ventaData.totalAbonoRaw ?? ventaData.totalAbono ?? abonos.reduce((acc: number, abono: Abono) => acc + Number(abono.precio || 0), 0);
      const valorVenta = ventaData.precioRaw ?? ventaData.precio ?? 0;
      const saldo = ventaData.saldoRaw ?? ventaData.saldo ?? Math.max(Number(valorVenta || 0) - Number(abonado || 0), 0);

      const payload = {
        document_type: "remision",
        format: "pos",
        copies: 1,
        data: {
          numero: `REM-${row.id}`,
          fecha: row.fecha,
          cliente: row.clienteNombre,
          cliente_cedula: row.clienteCedula,
          detalle: ventaData.detalle || ventaData.detalle_pedido || "",
          items: (row.items || []).map((item) => ({
            descripcion: item.articulo?.nombre || `Item ${item.itemVenta}`,
            cantidad: item.cantidad,
            valor_unitario: Number(item.precioUnitario || 0),
            valor_total: Number(item.totalRemisionado || 0) || (Number(item.precioUnitario || 0) * Number(item.cantidad || 0)),
            descuento: Number(item.descuento || 0),
            tipo_descuento: item.tipoDescuento || 'precio',
          })),
          valor_venta: valorVenta,
          abonado: abonado,
          saldo: saldo,
          abonos: abonos.map((abono) => ({
            medio_pago: abono.medioPagoNombre || String(abono.medioDePago || "N/A"),
            fecha: abono.fecha || "",
            valor: Number(abono.precio || 0),
          })),
        },
      };

      const response = await fetch(buildPrintAgentUrl("jobs/print"), {
        method: "POST",
        headers: agentHeaders,
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.detail || "No fue posible enviar la remisión al servicio de impresión.");
      }

      await swalconfirmation(`Remisión #${row.id} enviada a impresión.`);
    } catch (error) {
      console.error(error);
      await swalErr(error instanceof Error ? error.message : "Error desconocido al imprimir la remision.");
    } finally {
      setPrinting(false);
    }
  }, []);


  const preparedData = useMemo<PreparedRemisionRow[]>(() => {
    return (tableData ?? []).map((remision) => {
      const items = remision.items ?? [];
      const cantidadRemitida = items.reduce(
        (acc, item) => acc + Number(item.cantidad || 0),
        0
      );
      const totalDespachado = items.reduce(
        (acc, item) => acc + Number(item.cantidadDespachada || 0),
        0
      );
      return {
        ...remision,
        clienteNombre: remision.cliente?.nombre || "Sin dato",
        clienteCedula: remision.cliente?.cedula ? remision.cliente.cedula.toString() : "Sin dato",
        empresaCliente: remision.empresaCliente || "Sin empresa",
        fechaFormateada: formatDate(remision.fecha),
        itemsCount: items.length,
        cantidadRemitida,
        totalDespachado,
        estadoRemision: remision.anulado ? 'anulada' : 'activa',
        totalRemision:
          Number(remision.totalRemision || 0) ||
          items.reduce((acc, item) => {
            const totalItem =
              Number(item.totalRemisionado || 0) ||
              (Number(item.precioUnitario || 0) * Number(item.cantidad || 0));
            return acc + (Number.isNaN(totalItem) ? 0 : totalItem);
          }, 0),
      };
    });
  }, [tableData]);

  const orderedData = useMemo<PreparedRemisionRow[]>(() => {
    return [...preparedData].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [preparedData]);

  const applyDatePreset = (preset: string) => {
    const today = getTodayLocalDate();
    let desde = "";
    let hasta = "";

    if (preset === "hoy") {
      desde = toLocalDateInputValue(today);
      hasta = toLocalDateInputValue(today);
    } else if (preset === "semana") {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = addDays(today, diffToMonday);
      desde = toLocalDateInputValue(start);
      hasta = toLocalDateInputValue(today);
    } else if (preset === "mes_actual") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      desde = toLocalDateInputValue(start);
      hasta = toLocalDateInputValue(today);
    } else if (preset === "mes_anterior") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      desde = toLocalDateInputValue(start);
      hasta = toLocalDateInputValue(end);
    } else if (preset === "ultimos_30") {
      desde = toLocalDateInputValue(addDays(today, -29));
      hasta = toLocalDateInputValue(today);
    }

    setDatePreset(preset);
    setFechaDesde(desde);
    setFechaHasta(hasta);
  };

  const handleFechaDesdeChange = (value: string) => {
    setDatePreset("personalizado");
    setFechaDesde(value);
  };

  const handleFechaHastaChange = (value: string) => {
    setDatePreset("personalizado");
    setFechaHasta(value);
  };

  const clearDateFilter = () => {
    setDatePreset("todos");
    setFechaDesde("");
    setFechaHasta("");
  };


  const filteredData = useMemo<PreparedRemisionRow[]>(() => {
    return orderedData.filter((row) => {
      if (estadoRemisionFilter === 'activas' && row.anulado) {
        return false;
      }
      if (estadoRemisionFilter === 'anuladas' && !row.anulado) {
        return false;
      }
      if (fechaDesde || fechaHasta) {
        const remisionDate = parseLocalDateValue(row.fecha);
        const desde = parseLocalDateValue(fechaDesde);
        const hasta = parseLocalDateValue(fechaHasta);
        if (!remisionDate) return false;
        if (desde && remisionDate < desde) return false;
        if (hasta && remisionDate > hasta) return false;
      }
      if (globalFilterValue.trim()) {
        const search = globalFilterValue.trim().toLocaleLowerCase('es');
        const fields = ['id', 'venta', 'clienteNombre', 'clienteCedula', 'empresaCliente', 'fechaFormateada',
          'itemsCount', 'cantidadRemitida', 'totalDespachado', 'totalRemision', 'observacion', 'estadoRemision'];
        if (!fields.some(field => String(row[field] ?? '').toLocaleLowerCase('es').includes(search))) return false;
      }
      return true;
    });
  }, [orderedData, estadoRemisionFilter, fechaDesde, fechaHasta, globalFilterValue]);

  const mobileRemissions = useMemo(() => mobileLayout ? [...filteredData].sort((a, b) => {
    if (!tableSort.order) return 0;
    const left = a[tableSort.field] ?? '';
    const right = b[tableSort.field] ?? '';
    return (typeof left === 'number' && typeof right === 'number' ? left - right
      : String(left).localeCompare(String(right), 'es', { numeric: true })) * tableSort.order;
  }) : [], [filteredData, tableSort, mobileLayout]);

  useEffect(() => { pagination.setFirst(0); }, [estadoRemisionFilter, fechaDesde, fechaHasta, globalFilterValue]);
  useEffect(() => {
    if (pagination.first >= filteredData.length && pagination.first !== 0) pagination.setFirst(0);
  }, [filteredData.length, pagination.first]);

  const columns = useMemo<ColumnMeta[]>(
    () => [
      { field: "id", header: "Remision", sortable: true },
      { field: "venta", header: "Venta", sortable: true },
      { field: "clienteNombre", header: "Cliente", sortable: true },
      { field: "empresaCliente", header: "Empresa" },
      { field: "fechaFormateada", header: "Fecha", sortable: true },
      { field: "estadoRemision", header: "Estado" },
      { field: "itemsCount", header: "Items", bodyClassName: "text-center" },
      { field: "cantidadRemitida", header: "Remitido", bodyClassName: "text-center" },
      { field: "totalRemision", header: "Total remision", bodyClassName: "text-end" },
    ],
    []
  );

  const handleGlobalFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setGlobalFilterValue(value);
    },
    []
  );

  const handleDeleteRemision = useCallback(async (row: PreparedRemisionRow) => {
    if (!row || row.anulado) return;

    const confirmed = await swalQuestion(
      "Anular remision",
      `Se anulara la remision #${row.id}. Si sus articulos llevan inventario, las unidades despachadas se reintegraran a la bodega (sin duplicar devoluciones ya registradas). Confirma solo si la entrega no ocurrio o la mercancia ya regreso. Si completaba la entrega, la venta volvera a 'Listo Para Entrega'.`
    );

    if (!confirmed) return;

    try {
      const req = await callApi(`remisiones/${row.id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          detalleAnulacion: `Remision #${row.id} anulada desde el modulo de remisiones.`,
        }),
      });

      if (!req.res.ok) {
        throw new Error(req.data.detail || "No fue posible anular la remision.");
      }

      const updatedRemision = req.data?.remision;
      setTableData((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, ...(updatedRemision || {}), anulado: true } : item
        )
      );

      await swalconfirmation(`Remision #${row.id} anulada correctamente.`);
    } catch (error) {
      await swalErr(error instanceof Error ? error.message : "No fue posible anular la remision.");
    }
  }, []);


  const getTotalRemision = useCallback((row: PreparedRemisionRow) => {
    return (row.items ?? []).reduce((acc, item) => {
      const totalItem =
        Number(item.totalRemisionado || 0) ||
        (Number(item.precioUnitario || 0) * Number(item.cantidad || 0));
      return acc + (Number.isNaN(totalItem) ? 0 : totalItem);
    }, 0);
  }, []);

  const rowExpansionTemplate = (row: PreparedRemisionRow) => {
    const totalRemisionSeleccionada = getTotalRemision(row);
    return (
      <div className="ventas-card mt-3">
        <div className="row g-3 mb-3 align-items-stretch">
          {!mobileLayout && <div className="col-12 col-xl-4">
            <div className="border rounded h-100 p-3 bg-light-subtle">
              <div className="text-muted small text-uppercase">Remision</div>
              <h4 className="mb-1">Detalle remision #{row.id}</h4>
              <div className="text-muted small d-flex flex-wrap align-items-center gap-2">
                <span>Venta #{row.venta} - {row.fechaFormateada}</span>
                <Tag value={row.anulado ? 'Anulada' : 'Activa'} severity={row.anulado ? 'danger' : 'success'} rounded />
              </div>
              {row.observacion && (
                <div className="text-muted small mt-2">
                  Observacion: {row.observacion}
                </div>
              )}
              {row.anulado && (
                <div className="text-danger small mt-2">
                  Anulada el {formatDate(row.fechaAnulacion)}{row.detalleAnulacion ? ` - Motivo: ${row.detalleAnulacion}` : ''}
                </div>
              )}
            </div>
          </div>}
          {!mobileLayout && <div className="col-12 col-xl-4">
            <div className="border rounded h-100 p-3 bg-light-subtle">
              <div className="text-muted small text-uppercase">Cliente</div>
              <div className="fw-semibold mt-1">{row.clienteNombre}</div>
              <div className="text-muted small">Documento: {row.clienteCedula}</div>
              <div className="text-muted small">Empresa: {row.empresaCliente || "Sin empresa"}</div>
            </div>
          </div>}
          <div className="col-12 col-xl-4">
            <div className="border rounded h-100 p-3 bg-light-subtle d-flex flex-column justify-content-between">
              <div>
                <div className="text-muted small text-uppercase">Resumen financiero</div>
                <div className="mt-2 d-flex justify-content-between gap-3">
                  <span className="text-muted small">Total venta</span>
                  <span className="fw-semibold">{moneyformat(Number(row.totalVenta || 0))}</span>
                </div>
                <div className="mt-2 d-flex justify-content-between gap-3">
                  <span className="text-muted small">Total abonado</span>
                  <span className="fw-semibold text-success">{moneyformat(Number(row.totalAbonado || 0))}</span>
                </div>
                <div className="mt-2 d-flex justify-content-between gap-3">
                  <span className="text-muted small">Saldo venta</span>
                  <span className="fw-semibold text-danger">{moneyformat(Number(row.saldoVenta || 0))}</span>
                </div>
                <div className="mt-2 d-flex justify-content-between gap-3">
                  <span className="text-muted small">Total remision</span>
                  <span className="fw-semibold">{moneyformat(totalRemisionSeleccionada)}</span>
                </div>
              </div>
              <div className="mt-3 d-flex gap-2 justify-content-end flex-wrap">
                <button type="button" className="btn btn-sm btn-outline-primary remisiones-action-tooltip" data-pr-tooltip="Ver formula" data-pr-position="top" onClick={() => handleFormulaModal(row)}>
                  Ver formula
                </button>
                {!mobileLayout && <button type="button" className="btn btn-sm btn-primary remisiones-action-tooltip" data-pr-tooltip="Imprimir ticket" data-pr-position="top" onClick={() => handlePrintRemision(row)} disabled={printing}>
                  {printing ? "Imprimiendo..." : "Imprimir ticket"}
                </button>}
                {!row.anulado && can('delete_remisiones') && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger remisiones-action-tooltip"
                    data-pr-tooltip="Anular remision"
                    data-pr-position="top"
                    onClick={() => handleDeleteRemision(row)}
                  >
                    Anular remision
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {mobileLayout && <div className="small mb-3">
          {row.observacion && <p className="mb-2"><strong>Observacion:</strong> {row.observacion}</p>}
          {row.anulado && <p className="text-danger mb-2"><strong>Anulada el:</strong> {formatDate(row.fechaAnulacion)}{row.detalleAnulacion ? ` - ${row.detalleAnulacion}` : ''}</p>}
        </div>}
        {mobileLayout ? <div className="remisiones-mobile-items">
          {(row.items ?? []).map(item => <div key={item.id} className="remisiones-mobile-item">
            <strong>{item.articulo?.nombre || `Item ${item.itemVenta}`}</strong>
            <dl>
              <div><dt>Remitido</dt><dd>{item.cantidad}</dd></div>
              <div><dt>Precio unitario</dt><dd>{moneyformat(Number(item.precioUnitario || 0))}</dd></div>
              <div><dt>Descuento</dt><dd>{formatDescuento(item.descuento, item.tipoDescuento)}</dd></div>
              <div><dt>Total</dt><dd>{moneyformat(Number(item.totalRemisionado || 0) || Number(item.precioUnitario || 0) * Number(item.cantidad || 0))}</dd></div>
              <div><dt>Total despachado</dt><dd>{item.cantidadDespachada}</dd></div>
              <div><dt>Pendiente</dt><dd>{item.restante}</dd></div>
            </dl>
          </div>)}
          {!row.items?.length && <p className="text-muted small">Sin articulos registrados.</p>}
        </div> : <div className="table-modern table-responsive remisiones-detail-table">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Articulo</th>
                <th className="text-center">Remitido</th>
                <th className="text-center">Precio</th>
                <th className="text-center">Descuento</th>
                <th className="text-center">Total</th>
                <th className="text-center">Total despachado</th>
                <th className="text-center">Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {(row.items ?? []).map((item) => (
                <tr key={item.id}>
                  <td>{item.articulo?.nombre || `Item ${item.itemVenta}`}</td>
                  <td className="text-center fw-semibold">{item.cantidad}</td>
                  <td className="text-center">{moneyformat(Number(item.precioUnitario || 0))}</td>
                  <td className="text-center">{formatDescuento(item.descuento, item.tipoDescuento)}</td>
                  <td className="text-center fw-semibold">
                    {moneyformat(Number(item.totalRemisionado || 0) || (Number(item.precioUnitario || 0) * Number(item.cantidad || 0)))}
                  </td>
                  <td className="text-center text-primary">{item.cantidadDespachada}</td>
                  <td className="text-center text-danger">{item.restante}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        <div className="mt-4">
          <h5 className="mb-3">Abonos asociados</h5>
          {(row.abonos ?? []).length === 0 ? (
            <div className="text-muted small">No hay abonos registrados.</div>
          ) : mobileLayout ? (
            <div className="remisiones-mobile-payments">
              {(row.abonos ?? []).map(abono => <div key={abono.id} className="remisiones-mobile-item">
                <div className="remisiones-mobile-meta"><strong>{moneyformat(Number(abono.precio || 0))}</strong><span>{formatDate(abono.fecha)}</span></div>
                <div className="small">{abono.medioPagoNombre || abono.medioDePago || '-'}</div>
                {abono.descripcion && <div className="text-muted small">{abono.descripcion}</div>}
              </div>)}
              <div className="remisiones-mobile-meta fw-semibold"><span>Total abonos</span><span>{moneyformat((row.abonos ?? []).reduce((acc, abono) => acc + Number(abono.precio || 0), 0))}</span></div>
            </div>
          ) : (
            <div className="table-modern table-responsive remisiones-detail-table">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Medio de pago</th>
                    <th>Descripcion</th>
                    <th className="text-end">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {(row.abonos ?? []).map((abono) => (
                    <tr key={abono.id}>
                      <td>{formatDate(abono.fecha)}</td>
                      <td>{abono.medioPagoNombre || abono.medioDePago || "-"}</td>
                      <td>{abono.descripcion || "-"}</td>
                      <td className="text-end fw-semibold">{moneyformat(Number(abono.precio || 0))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-end fw-semibold">Total abonos</td>
                    <td className="text-end fw-semibold">
                      {moneyformat((row.abonos ?? []).reduce((acc, abono) => acc + Number(abono.precio || 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <div className="mt-3 text-muted small">
            <div>Condicion de pago: <strong>{row.condicionPago || "-"}</strong></div>
            <div>Compromiso de pago: <strong>{row.compromisoPago || "-"}</strong></div>
            <div>Numero de cuotas: <strong>{row.numeroCuotas || "-"}</strong></div>
            <div>Valor por cuota: <strong>{moneyformat(Number(row.valorCuota || 0))}</strong></div>
            <div>Cuotas pagadas: <strong>{Number(row.cuotasPagadas || 0)}</strong></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`remisiones-module ${mobileFiltersOpen ? 'mobile-filters-open' : ''}`}>
      <Tooltip key={tooltipVersion} ref={tooltipRef} target=".remisiones-action-tooltip" showDelay={120} hideDelay={80} />
      <div className="remisiones-workspace ventas-card">
      <div id="remisiones-filters">
      <div className="remisiones-filter-group">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="small fw-semibold text-dark">Estado de remision</span>
          <button type="button" className={`btn btn-sm ${estadoRemisionFilter === 'todas' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoRemisionFilter('todas')}>Todas</button>
          <button type="button" className={`btn btn-sm ${estadoRemisionFilter === 'activas' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setEstadoRemisionFilter('activas')}>Activas</button>
          <button type="button" className={`btn btn-sm ${estadoRemisionFilter === 'anuladas' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setEstadoRemisionFilter('anuladas')}>Anuladas</button>
        </div>
      </div>

      <div className="remisiones-filter-group remisiones-date-filter">
        <div className="remisiones-date-presets">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="small fw-semibold text-dark">Filtro por fecha de remision</div>
            <button
              type="button"
              className="btn btn-link p-0 text-muted remisiones-action-tooltip"
              data-pr-tooltip="Puedes usar periodos rapidos o definir un rango manual entre fechas."
              data-pr-position="top"
              aria-label="Ayuda sobre filtro por fecha de remision"
            >
              <i className="pi pi-question-circle" />
            </button>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className={`btn ${datePreset === 'todos' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={clearDateFilter}>Todas las fechas</button>
              <button type="button" className={`btn ${datePreset === 'hoy' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('hoy')}>Hoy</button>
              <button type="button" className={`btn ${datePreset === 'semana' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('semana')}>Esta semana</button>
              <button type="button" className={`btn ${datePreset === 'mes_actual' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('mes_actual')}>Este mes</button>
              <button type="button" className={`btn ${datePreset === 'mes_anterior' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('mes_anterior')}>Mes anterior</button>
              <button type="button" className={`btn ${datePreset === 'ultimos_30' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('ultimos_30')}>Ultimos 30 dias</button>
            </div>
          </div>
        </div>
        <div className="remisiones-date-range">
          <div className="remisiones-date-field">
            <label className="form-label small mb-0" htmlFor="remisiones-fecha-desde">Desde</label>
            <input id="remisiones-fecha-desde" type="date" className="form-control" value={fechaDesde} onChange={(e) => handleFechaDesdeChange(e.target.value)} />
          </div>
          <div className="remisiones-date-field">
            <label className="form-label small mb-0" htmlFor="remisiones-fecha-hasta">Hasta</label>
            <input id="remisiones-fecha-hasta" type="date" className="form-control" value={fechaHasta} onChange={(e) => handleFechaHastaChange(e.target.value)} />
          </div>
        </div>
      </div>
      </div>

      <div className="remisiones-results">
        <div className="remisiones-pagination-toolbar">
          <Paginator first={pagination.first} rows={pagination.rows} totalRecords={filteredData.length}
            rowsPerPageOptions={[5, 10, 20, 50, 100]}
            onPageChange={event => { pagination.onPage(event); refreshRemisionTooltips(true); }}
            template={mobileLayout
              ? 'RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink NextPageLink LastPageLink'
              : 'RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink'}
            currentPageReportTemplate="{first} a {last} de {totalRecords}" />
          <div className="remisiones-workspace-search">
            <InputText value={globalFilterValue} onChange={handleGlobalFilterChange} placeholder="Buscar remisiones..." aria-label="Buscar remisiones" />
            {mobileLayout && <button type="button" className="btn btn-outline-secondary rounded-pill"
              aria-expanded={mobileFiltersOpen} aria-controls="remisiones-filters" onClick={() => setMobileFiltersOpen(open => !open)}>
              <i className="pi pi-filter" aria-hidden="true" /> Filtros
            </button>}
          </div>
        </div>
        {mobileLayout ? <RemisionesMobileList remissions={mobileRemissions} first={pagination.first} rows={pagination.rows}
          expanded={expandedRows} printing={printing} formatMoney={moneyformat}
          onPage={event => { pagination.onPage(event); refreshRemisionTooltips(true); }}
          onExpand={row => setExpandedRows(previous => ({ ...previous, [row.id]: !previous?.[row.id] }))}
          onPrint={handlePrintRemision} renderDetail={rowExpansionTemplate} /> : <DataTable
          value={filteredData}
          sortField={tableSort.field}
          sortOrder={tableSort.order}
          onSort={event => setTableSort({ field: event.sortField, order: event.sortOrder })}
          paginator
          paginatorPosition="bottom"
          first={pagination.first}
          rows={pagination.rows}
          onPage={(event) => {
            pagination.onPage(event);
            refreshRemisionTooltips(true);
          }}
          onValueChange={pagination.onValueChange}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
          stripedRows
          // rowHover
          showGridlines
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => {
            setExpandedRows(e.data);
            refreshRemisionTooltips(true);
          }}
          rowExpansionTemplate={rowExpansionTemplate}
          emptyMessage="No se encontraron remisiones."
          responsiveLayout="scroll"
          className="remisiones-table p-datatable-sm"
          paginatorTemplate="RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
        >
          <Column expander style={{ width: "3rem" }} />
          {columns.map((column) => {
            const field = String(column.field);

            if (field === "id") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  sortable={column.sortable}
                  body={(row: PreparedRemisionRow) => (
                    <span className="badge text-bg-dark remisiones-badge">
                      #{row.id}
                    </span>
                  )}
                  style={{ width: "5rem" }}
                />
              );
            }

            if (field === "venta") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  sortable={column.sortable}
                  body={(row: PreparedRemisionRow) => (
                    <span className="badge text-bg-primary remisiones-badge">
                      #{row.venta}
                    </span>
                  )}
                  style={{ width: "5rem" }}
                />
              );
            }

            if (field === "clienteNombre") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  sortable={column.sortable}
                  body={(row: PreparedRemisionRow) => (
                    <div className="d-flex flex-column">
                      <span className="fw-semibold">{row.clienteNombre}</span>
                      <span className="text-muted small">{row.clienteCedula}</span>
                    </div>
                  )}
                  style={{ minWidth: "10rem" }}
                />
              );
            }

            if (field === "fechaFormateada") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  sortable={column.sortable}
                  body={(row: PreparedRemisionRow) => (
                    <span className="fw-semibold remisiones-fecha">
                      {row.fechaFormateada}
                    </span>
                  )}
                  style={{ minWidth: "6.5rem" }}
                />
              );
            }

            if (field === "empresaCliente") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  body={(row: PreparedRemisionRow) => (
                    <span className="fw-semibold">{row.empresaCliente}</span>
                  )}
                  style={{ minWidth: "8rem" }}
                />
              );
            }

            if (field === "estadoRemision") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  body={(row: PreparedRemisionRow) => (
                    <Tag value={row.anulado ? 'Anulada' : 'Activa'} severity={row.anulado ? 'danger' : 'success'} rounded className="remisiones-tag" />
                  )}
                  style={{ width: "8rem" }}
                />
              );
            }

            if (field === "itemsCount") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  body={(row: PreparedRemisionRow) => (
                    <Tag value={row.itemsCount} severity="info" rounded className="remisiones-tag" />
                  )}
                  bodyClassName="text-center"
                  style={{ width: "6rem" }}
                />
              );
            }

            if (field === "cantidadRemitida") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  body={(row: PreparedRemisionRow) => (
                    <Tag value={row.cantidadRemitida} severity="warning" rounded className="remisiones-tag" />
                  )}
                  bodyClassName="text-center"
                  style={{ width: "7.5rem" }}
                />
              );
            }

            if (field === "totalDespachado") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  body={(row: PreparedRemisionRow) => (
                    <Tag value={row.totalDespachado} severity="success" rounded className="remisiones-tag" />
                  )}
                  bodyClassName="text-center"
                  style={{ width: "9rem" }}
                />
              );
            }

            if (field === "totalRemision") {
              return (
                <Column
                  key={field}
                  field={field}
                  header={column.header}
                  body={(row: PreparedRemisionRow) => (
                    <span className="fw-semibold">{moneyformat(row.totalRemision)}</span>
                  )}
                  bodyClassName="text-end"
                  style={{ width: "8rem" }}
                />
              );
            }

            return (
              <Column
                key={field}
                field={field}
                header={column.header}
                sortable={column.sortable}
                bodyClassName={column.bodyClassName}
              />
            );
          })}
        </DataTable>}
      </div>
      </div>

      <Dialog
        header={`Formula - Venta #${activeRemision?.venta ?? "--"}`}
        visible={formulaOpen}
        style={{ width: "70vw", maxWidth: "900px" }}
        breakpoints={{ '767px': '95vw' }}
        onHide={() => setFormulaOpen(false)}
      >
        {formulaLoading && (
          <div className="py-3 text-center text-muted">Cargando formulas</div>
        )}
        {formulaError && !formulaLoading && (
          <div className="text-danger mb-2">{formulaError}</div>
        )}
        {!formulaLoading && !formulaError && formulaImages.length > 0 && (
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            {formulaImages.map((src, idx) => (
              <div key={`${src}-${idx}`} className="border rounded p-2 bg-light">
                <img
                  src={src}
                  alt={`F?rmula ${idx + 1}`}
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
                />
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default RemisionesData;



