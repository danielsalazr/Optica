"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IP_URL } from "@/utils/js/api";
import { DataTable, DataTableExpandedRowsType, DataTableFilterMeta } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

type ArticuloCatalogo = {
  id: number;
  nombre: string;
};

type VentaItem = {
  id: number;
  articulo_id: number;
  cantidad: number;
  remisionado?: number;
  pendienteRemision?: number;
};

type RemisionItem = {
  id: number;
  itemVenta: number;
  cantidad: number;
  cantidadFactura: number;
  cantidadDespachada: number;
  restante: number;
  articulo?: {
    id: number;
    nombre: string;
  };
};

type Remision = {
  id: number;
  venta: number;
  cliente_id: number;
  fecha: string;
  observacion?: string | null;
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
  cedula?: number;
  nombre?: string;
  telefono?: string;
};

type Props = {
  ventaId: number;
  items: VentaItem[];
  remisiones: Remision[];
  articulos: ArticuloCatalogo[];
  cliente?: ClienteInfo;
  onCreated?: (payload: Remision) => void;
};

const RemisionesPanel: React.FC<Props> = ({
  ventaId,
  items,
  remisiones,
  articulos,
  cliente,
  onCreated,
}) => {
  const [localItems, setLocalItems] = useState<VentaItem[]>(items || []);
  const [localRemisiones, setLocalRemisiones] = useState<Remision[]>(remisiones || []);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRowsType>(null);

  useEffect(() => {
    setLocalItems(items || []);
  }, [items]);

  useEffect(() => {
    setLocalRemisiones(remisiones || []);
  }, [remisiones]);

  const articulosMap = useMemo(() => {
    const mapa = new Map<number, string>();
    articulos?.forEach((elemento) => {
      if (elemento?.id != null) {
        mapa.set(Number(elemento.id), elemento.nombre);
      }
    });
    return mapa;
  }, [articulos]);

  const handleCantidadChange = useCallback(
    (itemId: number, value: string) => {
      const maximo = localItems.find((elemento) => elemento.id === itemId)?.pendienteRemision ?? 0;
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

  const formatearFecha = (valor: string) => {
    if (!valor) return "";
    const fechaLocal = new Date(valor);
    if (Number.isNaN(fechaLocal.getTime())) {
      return valor;
    }
    return fechaLocal.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const remisionesTableData = useMemo<RemisionTableRow[]>(() => {
    return (localRemisiones || []).map((remision) => {
      const articulosResumen =
        remision.items
          ?.map((item) => {
            const nombre = item.articulo?.nombre ?? `Item ${item.itemVenta}`;
            return `${nombre} (${item.cantidad})`;
          })
          .join(" · ") ?? "";

      const totalItems = remision.items?.reduce((acc, item) => acc + (item.cantidad ?? 0), 0) ?? 0;

      return {
        ...remision,
        fechaLegible: formatearFecha(remision.fecha),
        creadoLegible: formatearFecha(remision.creado_en),
        articulosResumen,
        totalItems,
      };
    });
  }, [localRemisiones]);

  const handleGlobalFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => {
      const globalFilter = prev?.global ?? { value: "", matchMode: FilterMatchMode.CONTAINS };
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
      <div className="d-flex flex-wrap w-100 justify-content-between align-items-center gap-3">
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
        <div className="table-modern table-responsive px-3 pb-3">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Articulo</th>
                <th className="text-center">En esta remision</th>
                <th className="text-center">Total despachado</th>
                <th className="text-center">Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {remision.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.articulo?.nombre ?? `Item ${item.itemVenta}`}</td>
                  <td className="text-center fw-semibold">{item.cantidad}</td>
                  <td className="text-center text-primary">{item.cantidadDespachada}</td>
                  <td className="text-center text-danger">{item.restante}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
    []
  );

  const limpiarFormulario = () => {
    setCantidades({});
    setObservacion("");
    setFecha(new Date().toISOString().split("T")[0]);
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
      return "No fue posible crear la remisión. Intenta nuevamente.";
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
      : "No fue posible crear la remisión. Revisa la información ingresada.";
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
      setError("Selecciona al menos un artículo y una cantidad para remisionar.");
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
      const response = await fetch(`${IP_URL()}remisiones/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detalle = await response.json().catch(() => ({}));
        throw new Error(construirMensajeError(detalle));
      }

      const data: Remision = await response.json();

      setLocalRemisiones((prev) => [data, ...prev]);
      actualizarItemsDesdeRemision(data);
      limpiarFormulario();
      setSuccess(`Remisión #${data.id} generada correctamente.`);

      if (onCreated) {
        onCreated(data);
      }
    } catch (err: any) {
      setError(err?.message || "No fue posible crear la remisión.");
    } finally {
      setLoading(false);
    }
  };

  if (!ventaId) {
    return null;
  }

  return (
    <section className="remision-section">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <h2 className="venta-section-title mb-0">Remisiones</h2>
        <div className="remision-client-info text-muted small">
          {cliente?.nombre ? (
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

      <div className="ventas-card remision-card mb-4">
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-sm-6 col-md-4">
              <label className="form-label" htmlFor="fechaRemision">
                Fecha de remisión
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
                placeholder="Notas sobre esta remisión"
                value={observacion}
                onChange={(event) => setObservacion(event.target.value)}
              />
            </div>
          </div>

          <div className="table-modern table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th className="text-center">Factura</th>
                  <th className="text-center">Despachado</th>
                  <th className="text-center">Pendiente</th>
                  <th className="text-center">A remitir</th>
                </tr>
              </thead>
              <tbody>
                {localItems.map((item) => {
                  const pendiente = item.pendienteRemision ?? Math.max((item.cantidad || 0) - (item.remisionado || 0), 0);
                  const seleccionado = cantidades[item.id] ?? 0;
                  const nombreArticulo =
                    articulosMap.get(item.articulo_id) ??
                    `Articulo #${item.articulo_id}`;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">{nombreArticulo}</span>
                          <span className="text-muted small">
                            ID item: {item.id}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">{item.cantidad}</td>
                      <td className="text-center text-primary">{item.remisionado ?? 0}</td>
                      <td className="text-center text-danger">{pendiente}</td>
                      <td className="text-center" style={{ maxWidth: 120 }}>
                        <input
                          type="number"
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

          <div className="ventas-actions mt-4">
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading || totalSeleccionado === 0}
            >
              {loading ? "Creando..." : "Generar remisión"}
            </button>
          </div>
        </form>
      </div>

      <div className="remision-list">
        {localRemisiones.length === 0 ? (
          <div className="text-muted fst-italic">Aun no hay remisiones asociadas a esta venta.</div>
        ) : (
          <DataTable
            value={remisionesTableData}
            header={remisionesHeader}
            globalFilterFields={["id", "venta", "observacion", "articulosResumen", "fechaLegible", "creadoLegible"]}
            filters={filters}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 20]}
            stripedRows
            showGridlines
            emptyMessage="No se encontraron remisiones."
            dataKey="id"
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={renderRemisionItems}
            className="ventas-card remision-card"
          >
            <Column expander style={{ width: "3rem" }} />
            <Column
              header="Remisión"
              body={(row: RemisionTableRow) => <span className="fw-semibold">#{row.id}</span>}
              style={{ width: "8rem" }}
            />
            <Column
              header="Venta"
              body={(row: RemisionTableRow) => <span className="badge text-bg-primary px-3 py-2">#{row.venta}</span>}
              style={{ width: "8rem" }}
            />
            <Column field="fechaLegible" header="Fecha" style={{ minWidth: "10rem" }} />
            <Column field="creadoLegible" header="Creada" style={{ minWidth: "10rem" }} />
            <Column
              field="totalItems"
              header="Ítems"
              body={(row: RemisionTableRow) => <span className="text-center d-block">{row.totalItems}</span>}
              style={{ width: "6rem" }}
            />
            <Column
              header="Artículos"
              body={(row: RemisionTableRow) =>
                row.articulosResumen ? row.articulosResumen : <span className="text-muted">Sin artículos</span>
              }
              style={{ minWidth: "16rem" }}
            />
            <Column
              header="Observación"
              body={(row: RemisionTableRow) =>
                row.observacion ? row.observacion : <span className="text-muted">Sin nota</span>
              }
              style={{ minWidth: "14rem" }}
            />
          </DataTable>
        )}
      </div>
    </section>
  );
};

export default RemisionesPanel;
