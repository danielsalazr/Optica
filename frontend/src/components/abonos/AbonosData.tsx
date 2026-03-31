// @ts-nocheck
"use client";

import '@/styles/selectwithImage.css';

import React, { useEffect, useMemo, useState } from "react";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Tooltip } from "primereact/tooltip";
import { Toast } from "primereact/toast";
import { FilterMatchMode } from "primereact/api";
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

type AbonosDataProps = {
  data: AbonoDataRow[];
  generalData: GeneralData;
};

type PreparedAbonoRow = AbonoDataRow & {
  idLabel: string;
  facturaLabel: string;
  clienteLabel: string;
  cedulaLabel: string;
  metodoPagoLabel: string;
  fechaLabel: string;
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
    descripcion: string | null;
    medioDePago: string | null;
  }>;
};

type EditFormState = {
  id: number | null;
  venta: number | null;
  cliente_id: number | null;
  precio: number;
  medioDePago: number | null;
  descripcion: string;
  fecha: Date | null;
};

const createEditState = (): EditFormState => ({
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
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateForApi(value: Date | null) {
  if (!value) return null;
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
}

function parseCurrencyValue(value: string | number | undefined) {
  if (typeof value === "number") return value;
  return Number(String(value ?? 0).replace(/\D/g, "")) || 0;
}

function AbonosData({ data = [], generalData = { mediosPago: [] } }: AbonosDataProps) {
  const toastRef = React.useRef<Toast | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [tableData, setTableData] = useState<AbonoDataRow[]>(data);
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

  const preparedData = useMemo<PreparedAbonoRow[]>(
    () =>
      tableData.map((item) => ({
        ...item,
        idLabel: item.id ? `#${item.id}` : "-",
        facturaLabel: item.factura_id ? `#${item.factura_id}` : "-",
        clienteLabel: item.cliente.toString().trim() || "Sin cliente",
        cedulaLabel: item.cedula.toString() || "Sin documento",
        metodoPagoLabel: item.nombre.toString().trim() || "Sin medio de pago",
        fechaLabel: item.fecha.toString() || "-",
        precioLabel: item.precio.toString() || "$ 0",
        isAbonoMasivo: !!item.abono_masivo_id,
      })),
    [tableData]
  );

  const globalFilterFields = useMemo(
    () => ["idLabel", "facturaLabel", "clienteLabel", "cedulaLabel", "metodoPagoLabel", "fechaLabel", "precioLabel"],
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
      const key = item.nombre.toString().trim() || "Sin medio de pago";
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

  const openMassiveDetail = async (row: PreparedAbonoRow) => {
    if (!row.abono_masivo_id) return;
    setActionError(null);
    setDetailLoading(true);
    setMassiveDetailOpen(true);

    try {
      const req = await callApi(`abonos/masivo/${row.abono_masivo_id}/`);
      if (!req.res.ok) {
        throw new Error(req.data.detail || "No fue posible cargar el detalle del abono masivo.");
      }
      setMassiveDetail(req.data as AbonoMasivoDetail);
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

  const openEditModal = (row: PreparedAbonoRow) => {
    setActionError(null);
    setEditForm({
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
      id: editForm.id,
      venta: editForm.venta,
      cliente_id: editForm.cliente_id,
      precio: editForm.precio,
      medioDePago: editForm.medioDePago,
      descripcion: editForm.descripcion,
      fecha: formatDateForApi(editForm.fecha),
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
        body: JSON.stringify({ id: deleteTarget.id }),
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
      <div className="d-flex flex-column">
        <span className="text-muted small">
          Consulta rápida por cliente, documento, venta o medio de pago.
        </span>
      </div>
      <span className="p-input-icon-left abonos-search">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(event) => {
            const value = event.target.value;
            setGlobalFilterValue(value);
            setFilters({
              global: { value, matchMode: FilterMatchMode.CONTAINS },
            });
          }}
          placeholder="Buscar abonos..."
        />
      </span>
    </div>
  );

  return (
    <>
      <Toast ref={toastRef} position="top-right" />
      <Tooltip target=".abonos-action-tooltip" />

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
            <label className="form-label">Fecha</label>
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
            ?Seguro que deseas eliminar el abono{" "}
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

            <div className="table-modern table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Abono</th>
                    <th>Venta</th>
                    <th>Cliente</th>
                    <th>Medio de pago</th>
                    <th>Fecha</th>
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
                      <td>{item.fecha ? new Date(item.fecha).toLocaleDateString("es-CO") : "-"}</td>
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
            </div>
          </div>
        ) : null}
      </Dialog>

      <div className="abonos-module">
        <div className="ventas-toolbar mb-1 gap-3">
          <h1 className="ventas-page-title mb-0">Abonos</h1>
        </div>

        <div className="abonos-summary">
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
        </div>

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

        <div className="ventas-card">
          <DataTable
            value={preparedData}
            header={tableHeader}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 20, 50, 100]}
            stripedRows
            showGridlines
            dataKey="id"
            filters={filters}
            globalFilterFields={globalFilterFields}
            emptyMessage="No se encontraron abonos."
            responsiveLayout="scroll"
            sortMode="multiple"
            removableSort
            className="abonos-table p-datatable-sm"
            paginatorTemplate="RowsPerPageDropdown CurrentPageReport PrevPageLink PageLinks NextPageLink"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
          >
            <Column
              field="id"
              header="Pago"
              sortable
              body={(row: PreparedAbonoRow) => (
                <span className="badge text-bg-dark remisiones-badge">{row.idLabel}</span>
              )}
              style={{ width: "7rem" }}
            />
            <Column
              field="factura_id"
              header="Venta"
              sortable
              body={(row: PreparedAbonoRow) => (
                <span className="badge text-bg-primary remisiones-badge">{row.facturaLabel}</span>
              )}
              style={{ width: "7rem" }}
            />
            <Column field="cedulaLabel" header="Documento" sortable />
            <Column field="clienteLabel" header="Cliente" sortable />
            <Column
              field="metodoPagoLabel"
              header="Medio de pago"
              sortable
              body={(row: PreparedAbonoRow) => (
                <Tag value={row.metodoPagoLabel} severity="success" rounded />
              )}
            />
            <Column
              field="fechaLabel"
              header="Fecha"
              sortable
              body={(row: PreparedAbonoRow) => (
                <span className="abonos-date-cell">{row.fechaLabel}</span>
              )}
            />
            <Column
              header="Tipo"
              body={(row: PreparedAbonoRow) => (
                row.isAbonoMasivo ? (
                  <button
                    type="button"
                    className="abonos-massive-trigger"
                    onClick={() => openMassiveDetail(row)}
                  >
                    <Tag value="Abono masivo" severity="warning" rounded />
                  </button>
                ) : (
                  <Tag value="Abono individual" severity="info" rounded />
                )
              )}
              style={{ width: "10rem" }}
            />
            <Column
              field="precioLabel"
              header="Valor"
              sortable
              body={(row: PreparedAbonoRow) => (
                <span className="fw-semibold">{row.precioLabel}</span>
              )}
              bodyClassName="text-end"
              style={{ width: "10rem" }}
            />
            <Column
              header="Acciones"
              bodyClassName="text-center"
              style={{ width: "8rem" }}
              body={(row: PreparedAbonoRow) => (
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary abonos-action-tooltip"
                    data-pr-tooltip="Editar abono"
                    data-pr-position="top"
                    onClick={() => openEditModal(row)}
                  >
                    <i className="pi pi-pencil" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger abonos-action-tooltip"
                    data-pr-tooltip="Eliminar abono"
                    data-pr-position="top"
                    onClick={() => confirmDelete(row)}
                  >
                    <i className="pi pi-trash" />
                  </button>
                </div>
              )}
            />
          </DataTable>
        </div>
      </div>
    </>
  );
}

export default AbonosData;
