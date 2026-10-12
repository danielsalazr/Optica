// @ts-nocheck
﻿"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { callApi } from "@/utils/js/api";
import { useAuth } from '@/components/auth/AuthProvider';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from "primereact/datatable";
import { useTablePagination } from '@/hooks/useTablePagination';
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { balanceDate, localISODate } from '@/utils/balances';
import '@/styles/sale-remisiones.css';
import { FilterMatchMode } from "primereact/api";
import { moneyformat } from "@/utils/js/utils";
import { swalconfirmation } from "@/utils/js/sweetAlertFunctions";

type ArticuloCatalogo = {
  id: number;
  nombre: string;
};

type VentaItem = {
  id: number;
  articulo_id: number;
  cantidad: number;
  remisionado: number;
  pendienteRemision: number;
};

type RemisionItem = {
  id: number;
  itemVenta: number;
  cantidad: number;
  cantidadFactura: number;
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

type Remision = {
  id: number;
  venta: number;
  cliente_id: number;
  fecha: string;
  observacion: string | null;
  creado_en: string;
  items: RemisionItem[];
};

type RemisionTableRow = Remision & {
  fechaLegible: string;
  creadoLegible: string;
  articulosResumen: string;
  totalItems: number;
};

type ClienteInfo = {
  cedula: number;
  nombre: string;
  telefono: string;
};

type Props = {
  ventaId: number;
  items: VentaItem[];
  remisiones: Remision[];
  articulos: ArticuloCatalogo[];
  cliente: ClienteInfo;
  onCreated: (payload: Remision) => void | Promise<void>;
};

const RemisionesPanel: React.FC<Props> = ({
  ventaId,
  items,
  remisiones,
  articulos,
  cliente,
  onCreated,
}) => {
  const { can } = useAuth();
  const [localItems, setLocalItems] = useState<VentaItem[]>(items || []);
  const pagination = useTablePagination('remisiones-venta', 5, [5, 10, 20]);
  const [localRemisiones, setLocalRemisiones] = useState<Remision[]>(remisiones || []);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [fecha, setFecha] = useState<string>(() => localISODate(new Date()));
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | undefined>(undefined);

  useEffect(() => {
    setLocalItems(items || []);
  }, [items]);

  useEffect(() => {
    setLocalRemisiones(remisiones || []);
  }, [remisiones]);

  const articulosMap = useMemo(() => {
    const mapa = new Map<number, string>();
    articulos.forEach((elemento) => {
      if (elemento.id != null) {
        mapa.set(Number(elemento.id), elemento.nombre);
      }
    });
    return mapa;
  }, [articulos]);

  const handleCantidadChange = useCallback(
    (itemId: number, value: string) => {
      const maximo = Number(localItems.find((elemento) => elemento.id === itemId)?.pendienteRemision || 0);
      let cantidad = parseInt(value, 10);
      if (Number.isNaN(cantidad) || cantidad < 0) {
        cantidad = 0;
      }
      if (cantidad > maximo) {
        cantidad = maximo;
      }
      setCantidades((prev) => ({
        ...prev,
        [itemId]: cantidad,
      }));
    },
    [localItems]
  );

  const totalSeleccionado = useMemo(
    () => Object.values(cantidades).reduce((acum, val) => acum + (val || 0), 0),
    [cantidades]
  );

  const formatearFecha = (valor: string) => balanceDate(valor);

  const remisionesTableData = useMemo<RemisionTableRow[]>(() => {
    return (localRemisiones || []).map((remision) => {
      const articulosResumen =
        remision.items
          .map((item) => {
            const nombre = item.articulo?.nombre || `Item ${item.itemVenta}`;
            return `${nombre} (${item.cantidad})`;
          })
          .join(" - ") || "";

      const totalItems = Number(
        remision.items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0)
      );

      return {
        ...remision,
        fechaLegible: formatearFecha(remision.fecha),
        creadoLegible: formatearFecha(remision.creado_en),
        articulosResumen,
        totalItems,
      };
    });
  }, [localRemisiones]);

  const mobileRemisiones = remisionesTableData.filter((row) =>
    [row.id, row.venta, row.articulosResumen, row.fechaLegible, row.creadoLegible, row.observacion || '']
      .join(' ').toLowerCase().includes(globalFilterValue.toLowerCase())).sort((a, b) => b.id - a.id);
  const mobilePaginator = <Paginator first={pagination.first} rows={pagination.rows} totalRecords={mobileRemisiones.length}
    onPageChange={pagination.onPage} rowsPerPageOptions={[5, 10, 20]} template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown" currentPageReportTemplate="{first}-{last} de {totalRecords}" />;

  const handleGlobalFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    pagination.setFirst(0);
    const value = event.target.value;
    setFilters((prev) => {
      const globalFilter = prev.global ?? { value: "", matchMode: FilterMatchMode.CONTAINS };
      return {
        ...prev,
        global: {
          ...globalFilter,
          value,
        },
      };
    });
    setGlobalFilterValue(value);
  }, []);

  const remisionesHeader = useMemo(
    () => (
      <div className="remision-history-header">
        <h5 className="mb-0">Remisiones generadas</h5>
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

  const renderRemisionItems = useCallback(
    (remision: RemisionTableRow) => {
      if (!remision.items || remision.items.length === 0) {
        return <div className="text-muted p-3">Esta remision no tiene items asociados.</div>;
      }

      return (
        <div className="remision-detail">
          <div className="remision-detail-meta"><span>Registrada: {remision.creadoLegible}</span>
            {remision.observacion && <span>Observacion: {remision.observacion}</span>}
            {remision.anulado && <strong className="text-danger">Remision anulada</strong>}
          </div>
          <div className="remision-detail-items">
              {remision.items.map((item) => (
                <div className="remision-detail-item" key={item.id}>
                  <strong>{item.articulo?.nombre || `Item ${item.itemVenta}`}</strong>
                  <div><span>En esta remision: <b>{item.cantidad}</b></span><span>Total: <b>{moneyformat(Number(item.totalRemisionado || 0))}</b></span></div>
                  <div><span>Unitario: {moneyformat(Number(item.precioUnitario || 0))}</span>
                    <span>Descuento: {item.descuento ? item.tipoDescuento === 'porcentaje' ? `${item.descuento} %` : moneyformat(Number(item.descuento)) : 'Sin descuento'}</span></div>
                  <small>Despachado: {item.cantidadDespachada} / Pendiente: {item.restante}</small>
                </div>
              ))}
          </div>
        </div>
      );
    },
    []
  );

  const limpiarFormulario = () => {
    setCantidades({});
    setObservacion("");
    setFecha(localISODate(new Date()));
  };

  const actualizarItemsDesdeRemision = (remision: Remision) => {
    const mapaTotales = new Map<number, RemisionItem>();
    remision.items.forEach((item) => {
      mapaTotales.set(item.itemVenta, item);
    });

    setLocalItems((prev) =>
      prev.map((item) => {
        const detalle = mapaTotales.get(item.id);
        if (!detalle) {
          return item;
        }
        return {
          ...item,
          remisionado: detalle.cantidadDespachada,
          pendienteRemision: detalle.restante,
        };
      })
    );
  };

  const construirMensajeError = (respuesta: any): string => {
    if (!respuesta || typeof respuesta !== "object") {
      return "No fue posible crear la remision. Intenta nuevamente.";
    }

    const mensajes: string[] = [];
    if (respuesta.items && typeof respuesta.items === "object") {
      Object.entries(respuesta.items).forEach(([clave, valor]) => {
        if (typeof valor === "string") {
          mensajes.push(`${clave}: ${valor}`);
        } else if (valor && typeof valor === "object") {
          Object.entries(valor).forEach(([campo, detalle]) => {
            mensajes.push(`${campo}: ${detalle}`);
          });
        }
      });
    }

    if (respuesta.non_field_errors) {
      mensajes.push(...[].concat(respuesta.non_field_errors as any));
    }

    return mensajes.length > 0
      ? mensajes.join(" | ")
      : "No fue posible crear la remision. Revisa la informacion ingresada.";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const itemsSeleccionados = Object.entries(cantidades)
      .filter(([_, cantidad]) => cantidad && Number(cantidad) > 0)
      .map(([itemVenta, cantidad]) => ({
        itemVenta: Number(itemVenta),
        cantidad: Number(cantidad),
      }));

    if (itemsSeleccionados.length === 0) {
      setError("Selecciona al menos un articulo y una cantidad para remisionar.");
      return;
    }

    const payload = {
      venta: ventaId,
      fecha,
      observacion: observacion || null,
      items: itemsSeleccionados,
    };

    try {
      setLoading(true);
      const req = await callApi("remisiones/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!req.res.ok) {
        throw new Error(construirMensajeError(req.data));
      }

      const data: Remision = req.data;

      setLocalRemisiones((prev) => [data, ...prev]);
      actualizarItemsDesdeRemision(data);
      limpiarFormulario();
      setSuccess(`Remision #${data.id} generada correctamente.`);
      await swalconfirmation(`Remisión #${data.id} generada correctamente.`);

      if (onCreated) {
        await onCreated(data);
      }
    } catch (err: any) {
      setError(err.message || "No fue posible crear la remision.");
    } finally {
      setLoading(false);
    }
  };

  if (!ventaId) {
    return null;
  }

  return (
    <section className="remision-section sale-remisiones-workspace">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <h2 className="venta-section-title mb-0">Remisiones</h2>
        <div className="remision-client-info text-muted small">
          {cliente.nombre ? (
            <>
              <strong>{cliente.nombre}</strong>
              {cliente.cedula && <span className="ms-2">CC {cliente.cedula}</span>}
              {cliente.telefono && <span className="ms-2">Tel. {cliente.telefono}</span>}
            </>
          ) : (
            <span>Cliente asociado a la venta</span>
          )}
        </div>
      </div>

      <div className="remision-workspace-grid">
      <div className="ventas-card remision-card remision-create-card">
        <h3 className="remision-block-title">Nueva remision</h3>
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-sm-6 col-md-4">
              <label className="form-label" htmlFor="fechaRemision">
                Fecha de remision
              </label>
              <input
                id="fechaRemision"
                type="date"
                className="form-control"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                required
              />
            </div>
            <div className="col-sm-12 col-md-8">
              <label className="form-label" htmlFor="observacionRemision">
                Observaciones (opcional)
              </label>
              <input
                id="observacionRemision"
                type="text"
                className="form-control"
                placeholder="Notas sobre esta remision"
                value={observacion}
                onChange={(event) => setObservacion(event.target.value)}
              />
            </div>
          </div>

          <div className="table-modern table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Articulo</th>
                  <th className="text-center">Pendiente</th>
                  <th className="text-center">A remitir</th>
                </tr>
              </thead>
              <tbody>
                {localItems.map((item) => {
                  const pendiente = item.pendienteRemision ?? Math.max((item.cantidad || 0) - (item.remisionado || 0), 0);
                  const seleccionado = Number(cantidades[item.id] || 0);
                  const nombreArticulo =
                    articulosMap.get(item.articulo_id) ||
                    `Articulo #${item.articulo_id}`;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">{nombreArticulo}</span>
                          <span className="text-muted small">
                            Vendidos: {item.cantidad} / Despachados: {Number(item.remisionado || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="text-center text-danger">{pendiente}</td>
                      <td className="text-center" style={{ maxWidth: 120 }}>
                        <input
                          type="number"
                          aria-label={`Cantidad a remitir de ${nombreArticulo}`}
                          className="form-control text-center"
                          min={0}
                          max={pendiente}
                          value={seleccionado}
                          disabled={pendiente === 0}
                          onChange={(event) =>
                            handleCantidadChange(item.id, event.target.value)
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success mt-3" role="alert">
              {success}
            </div>
          )}

          <div className="remision-create-actions">
            <span>{totalSeleccionado} unidades seleccionadas</span>
            <Button
              type="submit"
              rounded
              icon="pi pi-send"
              label={loading ? 'Creando...' : 'Generar remision'}
              loading={loading}
              disabled={!can('add_remisiones') || loading || totalSeleccionado === 0}
            />
          </div>
        </form>
      </div>

      <div className="remision-list ventas-card remision-history-card">
        {localRemisiones.length === 0 ? (
          <div className="text-muted fst-italic">Aun no hay remisiones asociadas a esta venta.</div>
        ) : (
          <>
          <div className="remision-history-desktop"><DataTable
            value={remisionesTableData}
            header={remisionesHeader}
            globalFilterFields={["id", "venta", "observacion", "articulosResumen", "fechaLegible", "creadoLegible"]}
            filters={filters}
            paginator
            paginatorPosition="both"
            first={pagination.first}
            rows={pagination.rows}
            onPage={pagination.onPage}
            onValueChange={pagination.onValueChange}
            rowsPerPageOptions={[5, 10, 20]}
            stripedRows
            showGridlines
            emptyMessage="No se encontraron remisiones."
            dataKey="id"
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data as DataTableExpandedRows)}
            rowExpansionTemplate={renderRemisionItems}
            sortField="id" sortOrder={-1}
            className="p-datatable-sm"
            paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="{first}-{last} de {totalRecords}"
          >
            <Column expander style={{ width: "3rem" }} />
            <Column
              header="Remision"
              field="id" sortable
              body={(row: RemisionTableRow) => <span className="fw-semibold">#{row.id}</span>}
              style={{ width: "5rem" }}
            />
            <Column field="fechaLegible" header="Fecha" style={{ width: '6rem' }} />
            <Column
              field="totalItems"
              header="Unid."
              body={(row: RemisionTableRow) => <span className="text-center d-block">{row.totalItems}</span>}
              style={{ width: "3.5rem" }}
            />
            <Column
              header="Articulos"
              body={(row: RemisionTableRow) => <span>{row.articulosResumen}{row.anulado && <small className="d-block text-danger">Anulada</small>}</span>}
            />
          </DataTable></div>
          <div className="remision-history-mobile">
            {remisionesHeader}
            {mobilePaginator}
            {mobileRemisiones.slice(pagination.first, pagination.first + pagination.rows).map((row) => <article className="remision-history-mobile-item" key={row.id}>
              <div><strong>#{row.id}</strong><span>{row.fechaLegible}</span><span>{row.totalItems} unid.</span></div>
              <p>{row.articulosResumen}</p>
              {row.anulado && <small className="text-danger">Anulada</small>}
              <Button text size="small" label={expandedRows?.[row.id] ? 'Ocultar detalle' : 'Ver detalle'} icon="pi pi-list" aria-expanded={Boolean(expandedRows?.[row.id])} onClick={() => setExpandedRows((prev) => ({ ...prev, [row.id]: !prev?.[row.id] }))} />
              {expandedRows?.[row.id] && renderRemisionItems(row)}
            </article>)}
            {!mobileRemisiones.length && <p>No se encontraron remisiones.</p>}
            {mobilePaginator}
          </div>
          </>
        )}
      </div>
      </div>
    </section>
  );
};

export default RemisionesPanel;



