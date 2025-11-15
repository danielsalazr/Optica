"use client";

import React, { useMemo, useState, useCallback } from "react";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

type RemisionItem = {
  id: number;
  itemVenta: number;
  cantidad: number;
  cantidadDespachada: number;
  restante: number;
  articulo?: {
    id: number;
    nombre: string;
  };
};

type RemisionRow = {
  id: number;
  venta: number;
  cliente?: {
    cedula?: number;
    nombre?: string;
    telefono?: string;
  };
  fecha: string;
  creado_en: string;
  observacion?: string | null;
  items?: RemisionItem[];
};

type PreparedRemisionRow = RemisionRow & {
  clienteNombre: string;
  clienteCedula: string;
  fechaFormateada: string;
  itemsCount: number;
  totalDespachado: number;
};

type ColumnMeta = {
  field: keyof PreparedRemisionRow | string;
  header: string;
  sortable?: boolean;
  bodyClassName?: string;
};

type Props = {
  data: RemisionRow[];
};

const formatDate = (value?: string) => {
  if (!value) return "";
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

const RemisionesData: React.FC<Props> = ({ data }) => {
  const [selected, setSelected] = useState<PreparedRemisionRow | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState<string>("");

  const preparedData = useMemo<PreparedRemisionRow[]>(() => {
    return (data ?? []).map((remision) => {
      const items = remision.items ?? [];
      const cantidadRemitida = items.reduce(
        (acc, item) => acc + (item?.cantidad ?? 0),
        0
      );
      const totalDespachado = items.reduce(
        (acc, item) => acc + (item?.cantidadDespachada ?? 0),
        0
      );
      return {
        ...remision,
        clienteNombre: remision.cliente?.nombre ?? "—",
        clienteCedula: remision.cliente?.cedula
          ? remision.cliente.cedula.toString()
          : "—",
        fechaFormateada: formatDate(remision.fecha),
        itemsCount: items.length,
        cantidadRemitida,
        totalDespachado,
      };
    });
  }, [data]);

  const columns = useMemo<ColumnMeta[]>(
    () => [
      { field: "id", header: "Remisión", sortable: true },
      { field: "venta", header: "Venta", sortable: true },
      { field: "clienteNombre", header: "Cliente", sortable: true },
      { field: "clienteCedula", header: "Documento" },
      { field: "fechaFormateada", header: "Fecha", sortable: true },
      { field: "itemsCount", header: "Items", bodyClassName: "text-center" },
      { field: "cantidadRemitida", header: "Remitido", bodyClassName: "text-center" },
      { field: "totalDespachado", header: "Despachado total", bodyClassName: "text-center text-primary fw-semibold" },
    ],
    []
  );

  const handleGlobalFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  }, []);

  const handleSelectionChange = useCallback((event: { value: PreparedRemisionRow | null }) => {
    setSelected(event.value ?? null);
  }, []);

  const tableHeader = useMemo(
    () => (
      <div className="d-flex w-100 justify-content-between align-items-center gap-3 flex-wrap">
        <span className="fw-semibold text-muted">Listado de remisiones</span>
        <span className="p-input-icon-left">
          {/* <i className="pi pi-search" /> */}
          <InputText
            value={globalFilterValue}
            onChange={handleGlobalFilterChange}
            placeholder="Buscar remisiones..."
          />
        </span>
      </div>
    ),
    [globalFilterValue, handleGlobalFilterChange]
  );

  const globalFilterFields = useMemo(
    () => [
      "id",
      "venta",
      "clienteNombre",
      "clienteCedula",
      "fechaFormateada",
      "itemsCount",
      "cantidadRemitida",
      "totalDespachado",
      "observacion",
    ],
    []
  );

  return (
    <div className="remisiones-module">
      <div className="ventas-toolbar mb-4 gap-3">
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
          rowsPerPageOptions={[5, 10, 20, 50]}
          stripedRows
          showGridlines
          dataKey="id"
          selectionMode="single"
          selection={selected}
          onSelectionChange={handleSelectionChange}
          filters={filters}
          globalFilterFields={globalFilterFields}
          emptyMessage="No se encontraron remisiones."
          responsiveLayout="scroll"
        >
          {columns.map((column) => {
            const field = String(column.field);
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
        <div className="ventas-card mt-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h4 className="mb-1">Detalle remisión #{selected.id}</h4>
              <div className="text-muted small">
                Venta #{selected.venta} · {selected.fechaFormateada}
              </div>
              {selected.observacion && (
                <div className="text-muted small mt-1">
                  Observación: {selected.observacion}
                </div>
              )}
            </div>
            <div className="text-end">
              <div className="fw-semibold">Cliente</div>
              <div className="text-muted small">
                {selected.clienteNombre} · {selected.clienteCedula}
              </div>
            </div>
          </div>

          <div className="table-modern table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th className="text-center">Remitido</th>
                  <th className="text-center">Total despachado</th>
                  <th className="text-center">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {(selected.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.articulo?.nombre ?? `Item ${item.itemVenta}`}</td>
                    <td className="text-center fw-semibold">{item.cantidad}</td>
                    <td className="text-center text-primary">
                      {item.cantidadDespachada}
                    </td>
                    <td className="text-center text-danger">
                      {item.restante}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemisionesData;
