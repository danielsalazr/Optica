"use client";

import React, { useMemo, useState, useCallback } from "react";

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

  const columns = useMemo(
    () => [
      { key: "id", label: "Remisión" },
      { key: "venta", label: "Venta" },
      { key: "clienteNombre", label: "Cliente" },
      { key: "clienteCedula", label: "Documento" },
      { key: "fechaFormateada", label: "Fecha" },
      { key: "itemsCount", label: "Items" },
      { key: "cantidadRemitida", label: "Remitido" },
      { key: "totalDespachado", label: "Despachado total" },
    ],
    []
  );

  const handleSelect = useCallback((row: PreparedRemisionRow) => {
    setSelected(row);
  }, []);

  return (
    <div className="remisiones-module">
      <div className="ventas-toolbar mb-4">
        <h1 className="ventas-page-title mb-0">Remisiones</h1>
        <span className="badge text-bg-primary px-3 py-2 ms-auto">
          {preparedData.length} registro{preparedData.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="ventas-card table-modern table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {preparedData.map((row) => (
              <tr key={row.id} className={selected?.id === row.id ? "table-active" : ""}>
                <td>{row.id}</td>
                <td>{row.venta}</td>
                <td>{row.clienteNombre}</td>
                <td>{row.clienteCedula}</td>
                <td>{row.fechaFormateada}</td>
                <td className="text-center">{row.itemsCount}</td>
                <td className="text-center">{row.cantidadRemitida}</td>
                <td className="text-center text-primary">{row.totalDespachado}</td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm rounded-pill"
                    onClick={() => handleSelect(row)}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
