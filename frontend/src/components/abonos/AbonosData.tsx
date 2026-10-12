// @ts-nocheck
"use client";

import '@/styles/selectwithImage.css';

import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { useTablePagination } from '@/hooks/useTablePagination';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { Paginator } from 'primereact/paginator';
import AbonosMobileList from './AbonosMobileList';
import { useAuth } from '@/components/auth/AuthProvider';
import '@/styles/abonos-workspace.css';
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { callApi } from "@/utils/js/api";
import Link from "next/link";

type AbonoDataRow = {
  id: string | number;
  cedula: string | number;
  cliente: string;
  factura_id: string | number;
  fecha: string;
  fechaRaw: string;
  fechaRegistro?: string;
  nombre: string;
  precio: string | number;
  medioDePago_id: string | number;
  abono_masivo_id: string | number | null;
  descripcion: string | null;
  [key: string]: unknown;
};

type GeneralData = {
  mediosPago: Array<{
    id: number | string;
    nombre: string;
    imagen: string;
  }>;
  [key: string]: unknown;
};

type AbonoMasivoSummary = {
  id: number;
  tipo: string;
  nombre_objetivo: string | null;
  empresa: string | null;
  jornada: number | null;
  cliente: string | null;
  creado_en: string;
  fecha_abono: string | null;
  total: number;
  cantidad_abonos: number;
  cantidad_ventas: number;
};

type AbonosDataProps = {
  data: AbonoDataRow[];
  generalData: GeneralData;
  massiveData: AbonoMasivoSummary[];
};

type PreparedAbonoRow = AbonoDataRow & {
  idLabel: string;
  facturaLabel: string;
  clienteLabel: string;
  cedulaLabel: string;
  metodoPagoLabel: string;
  fechaLabel: string;
  fechaRegistroLabel: string;
  precioLabel: string;
  isAbonoMasivo: boolean;
};

type AbonoMasivoDetail = {
  id: number;
  tipo: string;
  nombre_objetivo: string | null;
  empresa: string | null;
  jornada: number | null;
  cliente: string | null;
  creado_en: string;
  total: number;
  cantidad_abonos: number;
  abonos: Array<{
    id: number;
    venta_id: number;
    cliente_id: number;
    cliente_nombre: string | null;
    precio: number;
    fecha: string;
    fecha_registro?: string;
    descripcion: string | null;
    medioDePago: string | null;
    venta_precio?: number;
    venta_total_abono?: number;
    venta_saldo?: number;
    estado_pago?: string | null;
  }>;
};

type EditFormState = {
  snapshot: string;
  id: number | null;
  venta: number | null;
  cliente_id: number | null;
  precio: number;
  medioDePago: number | null;
  descripcion: string;
  fecha: Date | null;
};

const createEditState = (): EditFormState => ({
  snapshot: "",
  id: null,
  venta: null,
  cliente_id: null,
  precio: 0,
  medioDePago: null,
  descripcion: "",
  fecha: null,
});

function parseDate(value: string) {
  if (!value) return null;
  const raw = String(value).trim();
  const plainDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateForApi(value: Date | null) {
  if (!value) return null;
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}


function safeDateLabel(value: unknown) {
  if (!value) return "-";
  const raw = String(value).trim();
  const plainDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    return `${day}/${month}/${year}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-CO");
}

function parseCurrencyValue(value: string | number | undefined) {
  if (typeof value === "number") return value;
  return Number(String(value ?? 0).replace(/\D/g, "")) || 0;
}

function AbonosData({ data = [], generalData = { mediosPago: [] }, massiveData = [] }: AbonosDataProps) {
  const { can } = useAuth();
  const pagination = useTablePagination('abonos', 10, [5, 10, 20, 50, 100]);
  const massivePagination = useTablePagination('abonos-masivos', 10, [5, 10, 20, 50]);
  const toastRef = React.useRef<Toast | null>(null);
  const isMobile = useMobileLayout();
  const [sortMeta, setSortMeta] = useState([{ field: 'id', order: -1 }]);
  const [massiveSort, setMassiveSort] = useState({ field: 'id', order: -1 });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [tableData, setTableData] = useState<AbonoDataRow[]>(data);
  const [massiveTableData, setMassiveTableData] = useState<AbonoMasivoSummary[]>(massiveData);
  const [activeView, setActiveView] = useState<"abonos" | "masivos">("abonos");
  const [massiveTipoFilter, setMassiveTipoFilter] = useState<string>("all");
  const [massiveFechaDesde, setMassiveFechaDesde] = useState<Date | null>(null);
  const [massiveFechaHasta, setMassiveFechaHasta] = useState<Date | null>(null);
  const [expandedMassiveRows, setExpandedMassiveRows] = useState<any>(null);
  const [massiveDetailsById, setMassiveDetailsById] = useState<Record<number, AbonoMasivoDetail>>({});
  const [massiveDetailLoadingMap, setMassiveDetailLoadingMap] = useState<Record<number, boolean>>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [massiveDetailOpen, setMassiveDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PreparedAbonoRow | null>(null);
  const [massiveDetail, setMassiveDetail] = useState<AbonoMasivoDetail | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(createEditState());
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  useEffect(() => {
    setMassiveTableData(massiveData);
  }, [massiveData]);

  const preparedData = useMemo<PreparedAbonoRow[]>(
    () =>
      tableData.map((item) => ({
        ...item,
        idLabel: item.id ? `#${item.id}` : "-",
        facturaLabel: item.factura_id ? `#${item.factura_id}` : "-",
        clienteLabel: String(item.cliente ?? '').trim() || "Sin cliente",
        cedulaLabel: String(item.cedula ?? '') || "Sin documento",
        metodoPagoLabel: String(item.nombre ?? '').trim() || "Sin medio de pago",
        fechaLabel: String(item.fecha ?? '') || "-",
        fechaRegistroLabel: item.fechaRegistro?.toString().trim() || "-",
        precioLabel: String(item.precio ?? '') || "$ 0",
        isAbonoMasivo: !!item.abono_masivo_id,
      })),
    [tableData]
  );

  const globalFilterFields = useMemo(
    () => ["idLabel", "facturaLabel", "clienteLabel", "cedulaLabel", "metodoPagoLabel", "fechaLabel", "fechaRegistroLabel", "precioLabel"],
    []
  );

  const massiveGlobalFilterFields = useMemo(
    () => ["id", "tipo", "nombre_objetivo", "empresa", "cliente", "jornada"],
    []
  );

  const massiveTipoOptions = useMemo(
    () => [
      { label: "Todos los tipos", value: "all" },
      { label: "Empresa", value: "empresa" },
      { label: "Jornada", value: "jornada" },
      { label: "Cliente", value: "cliente" },
    ],
    []
  );

  const mediosPagoOptions = useMemo(
    () =>
      (generalData.mediosPago ?? []).map((medio) => ({
        label: medio.nombre,
        value: Number(medio.id),
      })),
    [generalData]
  );

  const totalAbonado = useMemo(
    () => tableData.reduce((acc, item) => acc + parseCurrencyValue(item.precio as string | number), 0),
    [tableData]
  );

  const totalsByMethod = useMemo(() => {
    const totals = new Map<string, number>();
    tableData.forEach((item) => {
      const key = String(item.nombre ?? '').trim() || "Sin medio de pago";
      totals.set(key, (totals.get(key) || 0) + parseCurrencyValue(item.precio as string | number));
    });

    return Array.from(totals.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [tableData]);

  const totalsByOrigin = useMemo(() => {
    const masivo = tableData.reduce(
      (acc, item) => acc + (item.abono_masivo_id ? parseCurrencyValue(item.precio as string | number) : 0),
      0
    );
    const individual = tableData.reduce(
      (acc, item) => acc + (!item.abono_masivo_id ? parseCurrencyValue(item.precio as string | number) : 0),
      0
    );

    return { masivo, individual };
  }, [tableData]);

  const filteredMassiveData = useMemo(() => {
    return massiveTableData.filter((item) => {
      const matchesTipo = massiveTipoFilter === "all" || item.tipo === massiveTipoFilter;
      if (!matchesTipo) return false;

      const fecha = parseDate(String(item.fecha_abono || item.creado_en || ""));
      if (massiveFechaDesde && fecha && fecha < new Date(massiveFechaDesde.getFullYear(), massiveFechaDesde.getMonth(), massiveFechaDesde.getDate())) {
        return false;
      }
      if (massiveFechaDesde && !fecha) {
        return false;
      }
      if (massiveFechaHasta && fecha) {
        const hasta = new Date(massiveFechaHasta.getFullYear(), massiveFechaHasta.getMonth(), massiveFechaHasta.getDate(), 23, 59, 59, 999);
        if (fecha > hasta) return false;
      }
      if (massiveFechaHasta && !fecha) {
        return false;
      }

      return true;
    });
  }, [massiveTableData, massiveTipoFilter, massiveFechaDesde, massiveFechaHasta]);

  const totalMasivos = useMemo(
    () => filteredMassiveData.reduce((acc, item) => acc + Number(item.total || 0), 0),
    [filteredMassiveData]
  );

  const totalVentasImpactadas = useMemo(
    () => filteredMassiveData.reduce((acc, item) => acc + Number(item.cantidad_ventas || 0), 0),
    [filteredMassiveData]
  );

  const searchRows = (rows, fields) => {
    const query = globalFilterValue.trim().toLocaleLowerCase('es');
    return rows.filter(row => !query || fields.some(field =>
      String(row[field] ?? '').toLocaleLowerCase('es').includes(query)
    ));
  };
  const visibleAbonos = searchRows(preparedData, globalFilterFields).sort((a, b) => {
    for (const sort of sortMeta || []) {
      const result = String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? ''), 'es', { numeric: true });
      if (result) return result * sort.order;
    }
    return 0;
  });
  const visibleMassive = searchRows(filteredMassiveData, massiveGlobalFilterFields).sort((a, b) =>
    String(a[massiveSort.field] ?? '').localeCompare(String(b[massiveSort.field] ?? ''), 'es', { numeric: true }) * massiveSort.order
  );
  const activePagination = activeView === 'abonos' ? pagination : massivePagination;
  const visibleCount = activeView === 'abonos' ? visibleAbonos.length : visibleMassive.length;
  const paginatorTemplate = isMobile
    ? 'RowsPerPageDropdown FirstPageLink PrevPageLink NextPageLink LastPageLink CurrentPageReport'
    : 'RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport';

  useEffect(() => {
    pagination.setFirst(0);
    massivePagination.setFirst(0);
  }, [globalFilterValue, massiveTipoFilter, massiveFechaDesde, massiveFechaHasta]);

  useEffect(() => {
    if (activePagination.first >= visibleCount) activePagination.setFirst(0);
  }, [visibleCount, activePagination.first]);

  const renderPaginator = () => (
    <Paginator first={activePagination.first} rows={activePagination.rows}
      onPageChange={activePagination.onPage} totalRecords={visibleCount}
      rowsPerPageOptions={activeView === 'abonos' ? [5, 10, 20, 50, 100] : [5, 10, 20, 50]}
      template={paginatorTemplate} currentPageReportTemplate="{first} - {last} de {totalRecords}" />
  );

  const fetchMassiveDetailById = async (abonoMasivoId: number) => {
    if (massiveDetailsById[abonoMasivoId]) {
      return massiveDetailsById[abonoMasivoId];
    }

    setMassiveDetailLoadingMap((prev) => ({ ...prev, [abonoMasivoId]: true }));
    try {
      const req = await callApi(`abonos/masivo/${abonoMasivoId}/`);
      if (!req.res.ok) {
        throw new Error(req.data.detail || "No fue posible cargar el detalle del abono masivo.");
      }
      setMassiveDetailsById((prev) => ({ ...prev, [abonoMasivoId]: req.data as AbonoMasivoDetail }));
      return req.data as AbonoMasivoDetail;
    } finally {
      setMassiveDetailLoadingMap((prev) => ({ ...prev, [abonoMasivoId]: false }));
    }
  };

  const openMassiveDetail = async (row: PreparedAbonoRow) => {
    if (!row.abono_masivo_id) return;
    setActionError(null);
    setDetailLoading(true);
    setMassiveDetailOpen(true);

    try {
      const detail = await fetchMassiveDetailById(Number(row.abono_masivo_id));
      setMassiveDetail(detail);
    } catch (error) {
      setActionError(
        error instanceof Error
            ? error.message
            : "No fue posible cargar el detalle del abono masivo."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMassiveRowExpand = async (event: { data: AbonoMasivoSummary }) => {
    try {
      await fetchMassiveDetailById(Number(event.data.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No fue posible cargar el detalle del abono masivo.");
    }
  };

  const renderMassiveExpansion = (row: AbonoMasivoSummary) => {
    const detail = massiveDetailsById[Number(row.id)];
    const loading = massiveDetailLoadingMap[Number(row.id)];

    if (loading && !detail) {
      return <div className="py-3 text-center text-muted">Cargando ventas del abono masivo...</div>;
    }

    if (!detail) {
      return <div className="py-3 text-center text-muted">No fue posible cargar el detalle.</div>;
    }

    return (
      <div className="abonos-massive-detail-wrap">
        <div className="abonos-summary mb-3">
          <div className="abonos-summary-card">
            <span className="label">Objetivo</span>
            <span className="value">{detail.nombre_objetivo || "-"}</span>
          </div>
          <div className="abonos-summary-card">
            <span className="label">Fecha real</span>
            <span className="value">{safeDateLabel(detail.abonos?.[0]?.fecha || row.fecha_abono)}</span>
          </div>
          <div className="abonos-summary-card">
            <span className="label">Ventas impactadas</span>
            <span className="value">{detail.abonos?.length || 0}</span>
          </div>
        </div>
        <div className="abonos-massive-sales">
          {(detail.abonos || []).map((item) => (
            <article key={item.id} className="abonos-massive-sale-card">
              <div className="abonos-massive-sale-header">
                <div>
                  <div className="fw-semibold">Venta #{item.venta_id || "-"}</div>
                  <div className="small text-muted">{item.cliente_nombre || item.cliente_id || "-"}</div>
                </div>
                <Link href={`/ventas/${item.venta_id}`} className="btn btn-sm btn-outline-primary">Ver venta</Link>
              </div>
              <div className="abonos-massive-sale-grid">
                <div><span className="label">Abono aplicado</span><strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(item.precio || 0)}</strong></div>
                <div><span className="label">Total venta</span><strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(item.venta_precio || 0)}</strong></div>
                <div><span className="label">Saldo</span><strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(item.venta_saldo || 0)}</strong></div>
                <div><span className="label">Estado pago</span><strong>{item.estado_pago || "-"}</strong></div>
                <div><span className="label">Medio de pago</span><strong>{item.medioDePago || "-"}</strong></div>
                <div><span className="label">Fecha abono</span><strong>{safeDateLabel(item.fecha)}</strong></div>
                <div><span className="label">Fecha registro</span><strong>{safeDateLabel(item.fecha_registro)}</strong></div>
                {item.descripcion ? <div className="abonos-detail-note"><span className="label">Observaciones</span><strong>{item.descripcion}</strong></div> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  };

  const openEditModal = (row: PreparedAbonoRow) => {
    setActionError(null);
    setEditForm({
      snapshot: String(row.snapshot || ""),
      id: row.id ? Number(row.id) : null,
      venta: row.factura_id ? Number(row.factura_id) : null,
      cliente_id: row.cedula ? Number(row.cedula) : null,
      precio: Number(String(row.precio ?? 0).replace(/\D/g, "")) || 0,
      medioDePago: row.medioDePago_id ? Number(row.medioDePago_id) : null,
      descripcion: row.descripcion?.toString() || "",
      fecha: parseDate(row.fechaRaw || row.fecha),
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editForm.id || !editForm.venta || !editForm.cliente_id) {
      setActionError("No fue posible identificar el abono seleccionado.");
      return;
    }

    if (!editForm.precio || editForm.precio <= 0) {
      setActionError("El valor del abono debe ser mayor a 0.");
      return;
    }

    if (!editForm.medioDePago) {
      setActionError("Selecciona un medio de pago.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    const payload = {
      snapshot: editForm.snapshot,
      id: editForm.id,
      venta: editForm.venta,
      cliente_id: editForm.cliente_id,
      precio: editForm.precio,
      medioDePago: editForm.medioDePago,
      descripcion: editForm.descripcion,
      fecha_abono: formatDateForApi(editForm.fecha),
    };

    try {
      const req = await callApi("abono/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!req.res.ok) {
        throw new Error(req.data.detail || "No fue posible actualizar el abono.");
      }

      const medioSeleccionado = (generalData.mediosPago ?? []).find(
        (medio) => Number(medio.id) === editForm.medioDePago
      );

      setTableData((prev) =>
        prev.map((item) =>
          Number(item.id) === editForm.id
            ? {
                ...item,
                snapshot: req.data.snapshot,
                precio: new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                }).format(editForm.precio),
                fecha: editForm.fecha
                  ? editForm.fecha.toLocaleDateString("es-CO")
                  : item.fecha,
                fechaRaw: formatDateForApi(editForm.fecha) || item.fechaRaw,
                medioDePago_id: editForm.medioDePago ?? item.medioDePago_id,
                nombre: medioSeleccionado?.nombre || item.nombre,
                descripcion: editForm.descripcion,
              }
            : item
        )
      );

      setEditModalOpen(false);
      setEditForm(createEditState());
      toastRef.current?.show({
        severity: "success",
        summary: "Abono actualizado",
        detail: `Se actualizó el abono #${editForm.id}.`,
        life: 3000,
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No fue posible actualizar el abono."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (row: PreparedAbonoRow) => {
    setActionError(null);
    setDeleteTarget(row);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const req = await callApi("abono/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: deleteTarget.id, snapshot: deleteTarget.snapshot }),
      });

      if (!req.res.ok) {
        throw new Error(req.data.detail || "No fue posible eliminar el abono.");
      }

      setTableData((prev) =>
        prev.filter((item) => Number(item.id) !== Number(deleteTarget.id))
      );
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      toastRef.current?.show({
        severity: "success",
        summary: "Abono eliminado",
        detail: `Se eliminó el abono ${deleteTarget.idLabel}.`,
        life: 3000,
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No fue posible eliminar el abono."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const tableHeader = (
    <div className="abonos-header d-flex w-100 justify-content-between align-items-center gap-2 flex-wrap">
      {renderPaginator()}
      <span className="p-input-icon-left abonos-search">
        <i className="pi pi-search" />
        <InputText
          aria-label={activeView === 'abonos' ? 'Buscar abonos' : 'Buscar abonos masivos'}
          value={globalFilterValue}
          onChange={(event) => {
            const value = event.target.value;
            setGlobalFilterValue(value);
          }}
          placeholder={activeView === "abonos" ? "Buscar abonos..." : "Buscar abonos masivos..."}
        />
      </span>
    </div>
  );

  return (
    <>
      <Toast ref={toastRef} position="top-right" />

      <Dialog
        header={editForm.id ? `Editar abono #${editForm.id}` : "Editar abono"}
        visible={editModalOpen}
        style={{ width: "min(92vw, 38rem)" }}
        modal
        draggable={false}
        resizable={false}
        onHide={() => {
          setEditModalOpen(false);
          setEditForm(createEditState());
          setActionError(null);
        }}
      >
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label">Valor del abono</label>
            <InputNumber
              value={editForm.precio}
              onValueChange={(e) =>
                setEditForm((prev) => ({ ...prev, precio: e.value || 0 }))
              }
              mode="currency"
              currency="COP"
              locale="es-CO"
              min={0}
              className="w-100"
              inputClassName="w-100"
            />
          </div>

          <div>
            <label className="form-label">Medio de pago</label>
            <Dropdown
              value={editForm.medioDePago}
              options={mediosPagoOptions}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, medioDePago: e.value }))
              }
              placeholder="Selecciona un medio de pago"
              className="w-100"
            />
          </div>

          <div>
            <label className="form-label">Fecha real del abono</label>
            <Calendar
              value={editForm.fecha}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, fecha: e.value ?? null }))
              }
              dateFormat="dd/mm/yy"
              showIcon
              className="w-100"
              inputClassName="w-100"
            />
          </div>

          <div>
            <label className="form-label">Descripción</label>
            <InputText
              value={editForm.descripcion}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, descripcion: e.target.value }))
              }
              className="w-100"
              placeholder="Detalle opcional"
            />
          </div>

          {actionError ? (
            <div className="alert alert-danger py-2 mb-0">{actionError}</div>
          ) : null}

          <div className="d-flex justify-content-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setEditModalOpen(false);
                setEditForm(createEditState());
                setActionError(null);
              }}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleEditSubmit}
              disabled={submitting}
            >
              {submitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        header={deleteTarget ? `Eliminar abono ${deleteTarget.idLabel}` : "Eliminar abono"}
        visible={deleteModalOpen}
        style={{ width: "min(92vw, 30rem)" }}
        modal
        draggable={false}
        resizable={false}
        onHide={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
          setActionError(null);
        }}
      >
        <div className="d-flex flex-column gap-3">
          <p className="mb-0">
            Deseas eliminar el abono{" "}
            <strong>{deleteTarget?.idLabel || ""}</strong> de la venta{" "}
            <strong>{deleteTarget?.facturaLabel || ""}</strong>
          </p>

          {actionError ? (
            <div className="alert alert-danger py-2 mb-0">{actionError}</div>
          ) : null}

          <div className="d-flex justify-content-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteTarget(null);
                setActionError(null);
              }}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={submitting}
            >
               {submitting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        header={
          massiveDetail ? `Abono masivo #${massiveDetail.id}` : "Detalle de abono masivo"
        }
        visible={massiveDetailOpen}
        style={{ width: "min(92vw, 54rem)" }}
        className="abonos-detail-dialog"
        modal
        draggable={false}
        resizable={false}
        onHide={() => {
          setMassiveDetailOpen(false);
          setMassiveDetail(null);
          setActionError(null);
        }}
      >
        {detailLoading ? (
          <div className="py-4 text-center">Cargando detalle...</div>
        ) : actionError ? (
          <div className="alert alert-danger mb-0">{actionError}</div>
        ) : massiveDetail ? (
          <div className="d-flex flex-column gap-3">
            <div className="abonos-summary">
              <div className="abonos-summary-card">
                <span className="label">Tipo</span>
                <span className="value text-capitalize">{massiveDetail.tipo || "-"}</span>
              </div>
              <div className="abonos-summary-card">
                <span className="label">Objetivo</span>
                <span className="value">{massiveDetail.nombre_objetivo || "-"}</span>
              </div>
              <div className="abonos-summary-card">
                <span className="label">Total</span>
                <span className="value">
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  }).format(massiveDetail.total || 0)}
                </span>
              </div>
            </div>

            {isMobile ? (
              <AbonosMobileList detailItems={massiveDetail.abonos ?? []} formatDate={safeDateLabel} />
            ) : <div className="table-modern table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Abono</th>
                    <th>Venta</th>
                    <th>Cliente</th>
                    <th>Medio de pago</th>
                    <th>Fecha abono</th>
                    <th>Fecha registro</th>
                    <th className="text-end">Valor</th>
                    <th className="text-center">Ir a venta</th>
                  </tr>
                </thead>
                <tbody>
                  {(massiveDetail.abonos ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>#{item.venta_id || "-"}</td>
                      <td>{item.cliente_nombre || item.cliente_id || "-"}</td>
                      <td>{item.medioDePago || "-"}</td>
                      <td>{safeDateLabel(item.fecha)}</td>
                      <td>{safeDateLabel(item.fecha_registro)}</td>
                      <td className="text-end">
                        {new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                        }).format(item.precio || 0)}
                      </td>
                      <td className="text-center">
                        {item.venta_id ? (
                          <Link
                            href={`/ventas/${item.venta_id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Ver venta
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </div>
        ) : null}
      </Dialog>

      <div className="abonos-module">
        {activeView === 'abonos' ? <div className="abonos-summary">
          <div className="abonos-summary-card">
            <span className="label">Registros</span>
            <span className="value">
              {preparedData.length} abono{preparedData.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="abonos-summary-card">
            <span className="label">Total abonado</span>
            <span className="value">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(totalAbonado)}
            </span>
          </div>
          <div className="abonos-summary-card">
            <span className="label">Abono individual</span>
            <span className="value">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(totalsByOrigin.individual)}
            </span>
          </div>
          <div className="abonos-summary-card">
            <span className="label">Abono masivo</span>
            <span className="value">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(totalsByOrigin.masivo)}
            </span>
          </div>
        </div> : null}

        <div className="abonos-view-toggle mb-3">
          <button
            type="button"
            className={`btn ${activeView === "abonos" ? "btn-primary" : "btn-outline-primary"}`}
            aria-pressed={activeView === 'abonos'}
            onClick={() => {
              setActiveView("abonos");
              setGlobalFilterValue("");
            }}
          >
            Abonos individuales
          </button>
          <button
            type="button"
            className={`btn ${activeView === "masivos" ? "btn-primary" : "btn-outline-primary"}`}
            aria-pressed={activeView === 'masivos'}
            onClick={() => {
              setActiveView("masivos");
              setGlobalFilterValue("");
            }}
          >
            Abonos masivos
          </button>
        </div>

        {activeView === "abonos" ? (
          <>
            <details className="abonos-method-summary" open={!isMobile}>
              <summary>Resumen por medio de pago</summary>
              <div className="abonos-payment-badges">
              {totalsByMethod.map((item) => (
                <div key={item.name} className="abonos-payment-badge">
                  <span className="method">{item.name}</span>
                  <span className="amount">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(item.total)}
                  </span>
                </div>
              ))}
              </div>
            </details>

            <div className="ventas-card">
              {tableHeader}
              {isMobile ? <>
                <AbonosMobileList rows={visibleAbonos.slice(pagination.first, pagination.first + pagination.rows)}
                  onEdit={openEditModal} onDelete={confirmDelete} onMassiveDetail={openMassiveDetail} />
                {renderPaginator()}
              </> :
              <DataTable
                value={visibleAbonos}
                paginator
                paginatorPosition="bottom"
                first={pagination.first}
                rows={pagination.rows}
                onPage={pagination.onPage}
                onValueChange={pagination.onValueChange}
                rowsPerPageOptions={[5, 10, 20, 50, 100]}
                stripedRows
                showGridlines
                dataKey="id"
                emptyMessage="No se encontraron abonos."
                responsiveLayout="scroll"
                sortMode="multiple"
                multiSortMeta={sortMeta}
                onSort={(event) => { setSortMeta(event.multiSortMeta || []); pagination.setFirst(0); }}
                removableSort
                className="abonos-table abonos-individual-table p-datatable-sm"
                paginatorTemplate={paginatorTemplate}
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
              >
                <Column field="id" header="Pago" sortable body={(row: PreparedAbonoRow) => (
                  <span className="badge text-bg-dark remisiones-badge">{row.idLabel}</span>
                )} style={{ width: "4rem" }} />
                <Column field="factura_id" header="Venta" sortable body={(row: PreparedAbonoRow) => (
                  <span className="badge text-bg-primary remisiones-badge">{row.facturaLabel}</span>
                )} style={{ width: "4rem" }} />
                <Column field="clienteLabel" header="Cliente" sortable body={(row) => <div><strong>{row.clienteLabel}</strong><div className="small text-muted">{row.cedulaLabel}</div></div>} />
                <Column field="metodoPagoLabel" header="Medio de pago" sortable body={(row: PreparedAbonoRow) => (
                  <Tag value={row.metodoPagoLabel} severity="success" rounded />
                )} style={{ width: '8rem' }} />
                <Column field="fechaLabel" header="Fecha" sortable body={(row: PreparedAbonoRow) => (
                  <span className="abonos-date-cell">{row.fechaLabel}</span>
                )} style={{ width: '6rem' }} />
                <Column header="Tipo" body={(row: PreparedAbonoRow) => (
                  row.isAbonoMasivo ? (
                    <button type="button" className="abonos-massive-trigger" onClick={() => openMassiveDetail(row)}>
                      <Tag value="Abono masivo" severity="warning" rounded />
                    </button>
                  ) : (
                    <Tag value="Abono individual" severity="info" rounded />
                  )
                )} style={{ width: "8rem" }} />
                <Column field="precioLabel" header="Valor" sortable body={(row: PreparedAbonoRow) => (
                  <span className="fw-semibold">{row.precioLabel}</span>
                )} bodyClassName="text-end" style={{ width: "8rem" }} />
                <Column header="Acciones" bodyClassName="text-center" style={{ width: "6rem" }} body={(row: PreparedAbonoRow) => (
                  <div className="d-flex justify-content-center gap-2">
                    <Button type="button" disabled={!can('change_abonos')} aria-label={`Editar abono ${row.idLabel}`} className="abonos-row-action" icon="pi pi-pencil" rounded outlined tooltip="Editar abono" tooltipOptions={{ position: 'top' }} onClick={() => openEditModal(row)} />
                    <Button type="button" disabled={!can('delete_abonos')} aria-label={`Eliminar abono ${row.idLabel}`} className="abonos-row-action" icon="pi pi-trash" severity="danger" rounded outlined tooltip="Eliminar abono" tooltipOptions={{ position: 'top' }} onClick={() => confirmDelete(row)} />
                  </div>
                )} />
              </DataTable>}
            </div>
          </>
        ) : (
          <>
            <div className="abonos-summary mb-3">
              <div className="abonos-summary-card">
                <span className="label">Lotes masivos</span>
                <span className="value">{filteredMassiveData.length}</span>
              </div>
              <div className="abonos-summary-card">
                <span className="label">Total masivo</span>
                <span className="value">{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(totalMasivos)}</span>
              </div>
              <div className="abonos-summary-card">
                <span className="label">Ventas impactadas</span>
                <span className="value">{totalVentasImpactadas}</span>
              </div>
            </div>

            <div className="abonos-massive-filters mb-3">
              <div className="abonos-massive-filter-item">
                <label className="form-label" htmlFor="abonos-masivos-tipo">Tipo</label>
                <Dropdown
                  inputId="abonos-masivos-tipo"
                  value={massiveTipoFilter}
                  options={massiveTipoOptions}
                  onChange={(e) => setMassiveTipoFilter(e.value)}
                  className="w-100"
                />
              </div>
              <div className="abonos-massive-filter-item">
                <label className="form-label" htmlFor="abonos-masivos-desde">Desde</label>
                <Calendar
                  inputId="abonos-masivos-desde"
                  value={massiveFechaDesde}
                  onChange={(e) => setMassiveFechaDesde(e.value ?? null)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  className="w-100"
                  inputClassName="w-100"
                />
              </div>
              <div className="abonos-massive-filter-item">
                <label className="form-label" htmlFor="abonos-masivos-hasta">Hasta</label>
                <Calendar
                  inputId="abonos-masivos-hasta"
                  value={massiveFechaHasta}
                  onChange={(e) => setMassiveFechaHasta(e.value ?? null)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  className="w-100"
                  inputClassName="w-100"
                />
              </div>
              <div className="abonos-massive-filter-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setMassiveTipoFilter("all");
                    setMassiveFechaDesde(null);
                    setMassiveFechaHasta(null);
                    setGlobalFilterValue("");
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            <div className="ventas-card">
              {tableHeader}
              {isMobile ? <>
                <AbonosMobileList massiveRows={visibleMassive.slice(massivePagination.first, massivePagination.first + massivePagination.rows)}
                  formatDate={safeDateLabel} expandedRows={expandedMassiveRows}
                  onToggleMassive={(row) => {
                    const key = row.id;
                    const opening = !expandedMassiveRows?.[key];
                    setExpandedMassiveRows(prev => ({ ...(prev || {}), [key]: opening }));
                    if (opening) handleMassiveRowExpand({ data: row });
                  }} renderMassiveDetail={renderMassiveExpansion} />
                {renderPaginator()}
              </> :
              <DataTable
                value={visibleMassive}
                sortField={massiveSort.field}
                sortOrder={massiveSort.order}
                onSort={(event) => { setMassiveSort({ field: event.sortField, order: event.sortOrder }); massivePagination.setFirst(0); }}
                paginator
                paginatorPosition="bottom"
                first={massivePagination.first}
                rows={massivePagination.rows}
                onPage={massivePagination.onPage}
                onValueChange={massivePagination.onValueChange}
                rowsPerPageOptions={[5, 10, 20, 50]}
                stripedRows
                showGridlines
                dataKey="id"
                emptyMessage="No se encontraron abonos masivos."
                responsiveLayout="scroll"
                expandedRows={expandedMassiveRows}
                onRowToggle={(event) => setExpandedMassiveRows(event.data)}
                onRowExpand={handleMassiveRowExpand}
                rowExpansionTemplate={renderMassiveExpansion}
                className="abonos-table abonos-massive-table p-datatable-sm"
                paginatorTemplate={paginatorTemplate}
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
              >
                <Column expander style={{ width: '3rem' }} />
                <Column field="id" header="Lote" sortable body={(row: AbonoMasivoSummary) => <span className="badge text-bg-warning remisiones-badge">#{row.id}</span>} style={{ width: '7rem' }} />
                <Column field="tipo" header="Tipo" sortable body={(row: AbonoMasivoSummary) => <Tag value={row.tipo} severity="warning" rounded />} style={{ width: '8rem' }} />
                <Column field="nombre_objetivo" header="Objetivo" sortable body={(row: AbonoMasivoSummary) => row.nombre_objetivo || row.empresa || row.cliente || (row.jornada ? `Jornada #${row.jornada}` : '-')} />
                <Column field="fecha_abono" header="Fecha abono" sortable body={(row: AbonoMasivoSummary) => safeDateLabel(row.fecha_abono)} style={{ width: '9rem' }} />
                <Column field="cantidad_ventas" header="Ventas" sortable body={(row: AbonoMasivoSummary) => <span className="fw-semibold">{row.cantidad_ventas || 0}</span>} style={{ width: '7rem' }} />
                <Column field="cantidad_abonos" header="Abonos" sortable body={(row: AbonoMasivoSummary) => <span className="fw-semibold">{row.cantidad_abonos || 0}</span>} style={{ width: '7rem' }} />
                <Column field="total" header="Total" sortable body={(row: AbonoMasivoSummary) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(row.total || 0)} bodyClassName="text-end" style={{ width: '10rem' }} />
              </DataTable>}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default AbonosData;
