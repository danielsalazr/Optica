// @ts-nocheck
﻿"use client";

import React, { useMemo, useState, useCallback } from "react";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import { moneyformat } from "@/utils/js/utils";
import { buildMediaUrl, buildPrintAgentUrl } from "@/utils/js/env";
import { swalErr, swalconfirmation } from "@/utils/js/sweetAlertFunctions";
import { callApi } from "@/utils/js/api";
import { Dialog } from "primereact/dialog";

import "@/styles/style.css";

type RemisionItem = {
  id: number;
  itemVenta: number;
  cantidad: number;
  cantidadDespachada: number;
  restante: number;
  precioUnitario: number;
  totalRemisionado: number;
  descuento: number;
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
  fecha: string;
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
  condicionPago: string | null;
  compromisoPago: number | null;
  numeroCuotas: number | null;
  fechaInicio: string | null;
  fechaVencimiento: string | null;
  valorCuota: number | null;
  cuotasPagadas: number | null;
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

const formatDate = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const RemisionesData: React.FC<Props> = ({ data }) => {
  const [selected, setSelected] = useState<PreparedRemisionRow | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState<string>("");
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [formulaLoading, setFormulaLoading] = useState(false);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [formulaImages, setFormulaImages] = useState<string[]>([]);

  const resolveMediaUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/media/")) {
      return buildMediaUrl(path);
    }
    return buildMediaUrl(`media/${path.replace(/^\/+/, "")}`);
  };

  const handleFormulaModal = useCallback(async () => {
    if (!selected.venta) return;
    setFormulaOpen(true);
    setFormulaLoading(true);
    setFormulaError(null);
    setFormulaImages([]);
    try {
      const req = await callApi(`venta/${selected.venta}`);
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
  }, [selected]);

  const handlePrintRemision = useCallback(async () => {
    if (!selected) return;

    setPrinting(true);
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("optica_print_agent_token") || "" : "";
      const agentHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token.trim()) {
        agentHeaders.Authorization = `Bearer ${token.trim()}`;
      }

      const ventaReq = await callApi(`venta/${selected.venta}`);
      if (!ventaReq.res.ok) {
        throw new Error(ventaReq.data.detail || "No fue posible obtener el detalle de la venta para imprimir.");
      }

      const ventaData = ventaReq.data || {};
      const abonos = Array.isArray(selected.abonos) ? selected.abonos : [];
      const abonado = ventaData.totalAbonoRaw ?? ventaData.totalAbono ?? abonos.reduce((acc: number, abono: Abono) => acc + Number(abono.precio || 0), 0);
      const valorVenta = ventaData.precioRaw ?? ventaData.precio ?? 0;
      const saldo = ventaData.saldoRaw ?? ventaData.saldo ?? Math.max(Number(valorVenta || 0) - Number(abonado || 0), 0);

      const payload = {
        document_type: "remision",
        format: "pos",
        copies: 1,
        data: {
          numero: `REM-${selected.id}`,
          fecha: selected.fecha,
          cliente: selected.clienteNombre,
          items: (selected.items || []).map((item) => ({
            descripcion: item.articulo?.nombre || `Item ${item.itemVenta}`,
            cantidad: item.cantidad,
            valor_unitario: Number(item.precioUnitario || 0),
            valor_total: Number(item.totalRemisionado || 0) || (Number(item.precioUnitario || 0) * Number(item.cantidad || 0)),
          })),
          valor_venta: valorVenta,
          abonado: abonado,
          saldo: saldo,
          abonos: abonos.map((abono) => ({
            medio_pago: abono.medioPagoNombre || String(abono.medioDePago || "N/A"),
            fecha: abono.fecha || "",
            valor: Number(abono.precio || 0),
          })),
          observaciones: selected.observacion || "",
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

      await swalconfirmation(`Remisión #${selected.id} enviada a impresión.`);
    } catch (error) {
      console.error(error);
      await swalErr(error instanceof Error ? error.message : "Error desconocido al imprimir la remisi?n.");
    } finally {
      setPrinting(false);
    }
  }, [selected]);


  const preparedData = useMemo<PreparedRemisionRow[]>(() => {
    return (data ?? []).map((remision) => {
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
  }, [data]);

  const columns = useMemo<ColumnMeta[]>(
    () => [
      { field: "id", header: "Remisi?n", sortable: true },
      { field: "venta", header: "Venta", sortable: true },
      { field: "clienteNombre", header: "Cliente", sortable: true },
      { field: "clienteCedula", header: "Documento" },
      { field: "empresaCliente", header: "Empresa" },
      { field: "fechaFormateada", header: "Fecha", sortable: true },
      { field: "itemsCount", header: "Items", bodyClassName: "text-center" },
      { field: "cantidadRemitida", header: "Remitido", bodyClassName: "text-center" },
      { field: "totalDespachado", header: "Despachado total", bodyClassName: "text-center" },
      { field: "totalRemision", header: "Total remisi?n", bodyClassName: "text-end" },
    ],
    []
  );

  const handleGlobalFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFilters((prev) => ({
        ...prev,
        global: { value, matchMode: FilterMatchMode.CONTAINS },
      }));
      setGlobalFilterValue(value);
    },
    []
  );

  const handleSelectionChange = useCallback(
    (event: { value: PreparedRemisionRow | null }) => {
      setSelected(event.value ?? null);
    },
    []
  );

  const tableHeader = useMemo(
    () => ( 
    <>
      <div className="remisiones-header d-flex w-100 justify-content-between align-items-center gap-1 flex-wrap">
        <div className="d-flex flex-column">
          {/* <span className="fw-semibold">Listado de remisiones</span> */}
          <span className="text-muted small">
            Consulta r?pida por cliente, fecha o documento.
          </span>
        </div>
        <span className="p-input-icon-left remisiones-search">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={handleGlobalFilterChange}
            placeholder="Buscar remisiones..."
          />
        </span>
      </div>
      </>
    ),
    [globalFilterValue, handleGlobalFilterChange]
  );

  const globalFilterFields = useMemo(
    () => [
      "id",
      "venta",
      "clienteNombre",
      "clienteCedula",
      "empresaCliente",
      "fechaFormateada",
      "itemsCount",
      "cantidadRemitida",
      "totalDespachado",
      "totalRemision",
      "observacion",
    ],
    []
  );

  const totalRemisionSeleccionada = useMemo(() => {
    if (!selected) return 0;
    return (selected.items ?? []).reduce((acc, item) => {
      const totalItem =
        Number(item.totalRemisionado || 0) ||
        (Number(item.precioUnitario || 0) * Number(item.cantidad || 0));
      return acc + (Number.isNaN(totalItem) ? 0 : totalItem);
    }, 0);
  }, [selected]);

  return (
    <div className="remisiones-module">
      <div className="ventas-toolbar mb-1 gap-3">
        <h1 className="ventas-page-title mb-0">Remisiones</h1>
        <span className="badge text-bg-primary px-3 py-2">
          {preparedData.length} registro{preparedData.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="ventas-card">
        <DataTable
          value={preparedData}
          header={tableHeader}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
          stripedRows
          // rowHover
          showGridlines
          dataKey="id"
          selectionMode="single"
          selection={selected}
          onSelectionChange={(event) =>
            handleSelectionChange(event as unknown as { value: PreparedRemisionRow | null })
          }
          filters={filters}
          globalFilterFields={globalFilterFields}
          emptyMessage="No se encontraron remisiones."
          responsiveLayout="scroll"
          sortMode="multiple"
          removableSort
          className="remisiones-table p-datatable-sm"
          paginatorTemplate="RowsPerPageDropdown CurrentPageReport PrevPageLink PageLinks NextPageLink"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
        >
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
                  style={{ width: "8rem" }}
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
                  style={{ width: "8rem" }}
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
                  style={{ minWidth: "14rem" }}
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
                  style={{ minWidth: "10rem" }}
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
                  style={{ minWidth: "12rem" }}
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
                  style={{ width: "12rem" }}
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
        </DataTable>
      </div>

      {selected && (
        <>
          {/* <hr className="remisiones-divider" /> */}
        <div className="ventas-card ">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h4 className="mb-1">Detalle remisi?n #{selected.id}</h4>
              <div className="text-muted small">
                Venta #{selected.venta} - {selected.fechaFormateada}
              </div>
              {selected.observacion && (
                <div className="text-muted small mt-1">
                  Observacion: {selected.observacion}
                </div>
              )}
            </div>
            <div className="text-end">
              <div className="fw-semibold">Cliente</div>
              <div className="text-muted small">
                {selected.clienteNombre} - {selected.clienteCedula}
              </div>
              <div className="mt-2">
                <div className="text-muted small">Total remisi?n</div>
                <div className="fw-semibold">
                  {moneyformat(totalRemisionSeleccionada)}
                </div>
              </div>
              <div className="mt-3 d-flex gap-2 justify-content-end flex-wrap">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleFormulaModal}
                >
                  Ver formula
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handlePrintRemision}
                  disabled={printing}
                >
                  {printing ? "Imprimiendo..." : "Imprimir ticket"}
                </button>
              </div>
            </div>
          </div>

          <div className="table-modern table-responsive remisiones-detail-table">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Art?culo</th>
                  <th className="text-center">Remitido</th>
                  <th className="text-center">Precio</th>
                  <th className="text-center">Descuento</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Total despachado</th>
                  <th className="text-center">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {(selected.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.articulo?.nombre || `Item ${item.itemVenta}`}</td>
                    <td className="text-center fw-semibold">{item.cantidad}</td>
                    <td className="text-center">{moneyformat(Number(item.precioUnitario || 0))}</td>
                    <td className="text-center">
                      {item.descuento ? `${item.descuento}%` : "0%"}
                    </td>
                    <td className="text-center fw-semibold">
                      {moneyformat(
                        item.totalRemisionado -
                          (Number(item.precioUnitario || 0) * Number(item.cantidad || 0))
                      )}
                    </td>
                    <td className="text-center text-primary">
                      {item.cantidadDespachada}
                    </td>
                    <td className="text-center text-danger">{item.restante}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <h5 className="mb-3">Abonos asociados</h5>
            {(selected.abonos ?? []).length === 0 ? (
              <div className="text-muted small">No hay abonos registrados.</div>
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
                    {(selected.abonos ?? []).map((abono) => (
                      <tr key={abono.id}>
                        <td>{formatDate(abono.fecha)}</td>
                        <td>{abono.medioPagoNombre || abono.medioDePago || "-"}</td>
                        <td>{abono.descripcion || "-"}</td>
                        <td className="text-end fw-semibold">
                          {moneyformat(Number(abono.precio || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-end fw-semibold">
                        Total abonos
                      </td>
                      <td className="text-end fw-semibold">
                        {moneyformat(
                          (selected.abonos ?? []).reduce(
                            (acc, abono) => acc + Number(abono.precio || 0),
                            0
                          )
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <div className="mt-3 text-muted small">
              <div>Condici?n de pago: <strong>{selected.condicionPago || "-"}</strong></div>
              <div>Compromiso de pago: <strong>{selected.compromisoPago || "-"}</strong></div>
              <div>N?mero de cuotas: <strong>{selected.numeroCuotas || "-"}</strong></div>
              <div>Valor por cuota: <strong>{moneyformat(Number(selected.valorCuota || 0))}</strong></div>
              <div>Cuotas pagadas: <strong>{Number(selected.cuotasPagadas || 0)}</strong></div>
            </div>
          </div>
        </div>
        </>
      )}

      <Dialog
        header={`F?rmula - Venta #${selected?.venta ?? "--"}`}
        visible={formulaOpen}
        style={{ width: "70vw", maxWidth: "900px" }}
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



