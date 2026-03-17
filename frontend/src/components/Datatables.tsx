"use client"; // Asegúrate de marcar el componente como del lado del cliente
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "datatables.net-dt/css/dataTables.dataTables.css";

const DataTable = dynamic(async () => {
    const DataTableComponentModule = await import("datatables.net-react");
    const DataTableComponent = DataTableComponentModule.default ?? DataTableComponentModule;

    const DataTablesLibModule = await import("datatables.net-dt");
    const DataTablesLib = DataTablesLibModule.default ?? DataTablesLibModule;

    DataTableComponent.use(DataTablesLib);

    return DataTableComponent;
}, { ssr: false });



type DataTableColumn = {
    data?: string | null;
    title?: string;
    name?: string;
    width?: string;
    [key: string]: unknown;
};

type EstadoPedidoFilter = {
    key: string;
    label: string;
    expr?: string;
    regex?: boolean;
    smart?: boolean;
    ci?: boolean;
};

type DataTablesProps = {
    header?: string[];
    data?: Array<Record<string, unknown>>;
    imprimir?: () => void;
    columns?: DataTableColumn[];
    onAction?: (action: string, rowData: Record<string, unknown>) => void;
    order?: Record<string, unknown>;
    slotes?: Record<string, unknown>;
    estadoPedidoFilters?: EstadoPedidoFilter[];
    rowDetail?: (row: Record<string, unknown>) => Promise<string> | string;
};

type JQueryDataTableLike = {
    row: (element: Element) => {
        data: () => Record<string, unknown> | null;
        child: ((html: string) => { show: () => void }) & {
            isShown: () => boolean;
            hide: () => void;
            show: () => void;
        };
    };
    on: (event: string, selector: string, handler: (event: Event) => void) => void;
    off: (event: string, selector: string, handler: (event: Event) => void) => void;
    column: (name: string) => any;
    cells: (...args: unknown[]) => any;
};

const DataTables = (props: DataTablesProps) => {
    // const tableRef = useRef(null);
    const tableRef = useRef<{ dt?: () => JQueryDataTableLike | undefined } | null>(null);
    const [activeFilter, setActiveFilter] = useState("todos");
    const [activeEstadoPedidoFilter, setActiveEstadoPedidoFilter] = useState("todos");
    const {
        header,
        data = [],
        imprimir,
        columns = [],
        onAction,
        order,
        slotes,
        estadoPedidoFilters,
        rowDetail,
    } = props;
    

    console.log("columns", columns);


    // const headers = ['Nombre', 'telefono', 'vinilla']  
  useEffect(() => {
        let cleanup: (() => void) | undefined;

        (async () => {
            if (typeof window === "undefined") {
                return;
            }

            const { Popover } = await import("bootstrap/dist/js/bootstrap.bundle.min.js");

            const popoverTriggerList = [].slice.call(
                document.querySelectorAll('[data-bs-toggle="popover"]')
            );

            const popoverList = popoverTriggerList.map(
                (popoverTriggerEl: Element) => new Popover(popoverTriggerEl)
            );

            cleanup = () => {
                popoverList.forEach((popoverInstance) => popoverInstance?.dispose?.());
            };
        })();

    return () => {
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    if (!rowDetail) return;

    let dt: JQueryDataTableLike | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const handler = async (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target?.closest?.('button, a, input, select, textarea, svg, path')) {
        return;
      }
      const tr = target.closest('tr');
      if (!tr || tr.classList.contains('child')) return;
      if (!dt) return;
      const row = dt.row(tr);
      if (!row || !row.data()) return;

      if (row.child.isShown()) {
        row.child.hide();
        tr.classList.remove('shown');
        return;
      }

      const html = await rowDetail(row.data() as Record<string, unknown>);
      row.child(html).show();
      tr.classList.add('shown');
    };

    const attach = () => {
      if (!dt) return;
      dt.off('click', 'tbody tr', handler);
      dt.on('click', 'tbody tr', handler);
    };

    intervalId = setInterval(() => {
      dt = tableRef.current?.dt?.() ?? null;
      if (dt) {
        attach();
        if (intervalId) {
          clearInterval(intervalId);
        }
      }
    }, 150);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (dt) {
        dt.off('click', 'tbody tr', handler);
      }
    };
  }, [rowDetail, data]);

//     const applyFilter = (filter: string) => {
//   if (!table.current) return;
//   const dt = table.current.dt();

//   console.log(dt)

//   switch (filter) {
//     case "todos":
//       dt.column("estado_pago:name").search("").draw();
//       break;
//     case "con abono":
//       dt.column("estado_pago:name").search("Con abono", false, false).draw();
//       break;
//     case "sin pago":
//       dt.column("estado_pago:name").search("^Sin Pago$", true, false).draw();
//       break;
//     case "pagado":
//       dt.column("estado_pago:name").search("^Pagado$", true, false).draw();
//       break;
//     case "anulado":
//       dt.column(6).search("^Anulado$", true, false).draw();
//       break;
//     case "no anulado":
//       // todo excepto "Anulado"
//       dt.column("estado_pago:name").search("^(?!Anulado$).*", true, false).draw();
//       break;
//   }
//   setActiveFilter(filter);
// };

const debugEstado = () => {
  const dt = tableRef.current?.dt?.();
  if (!dt) return;

  // 1) Datos crudos de la columna (procedentes de tu 'data')
  console.log('RAW data:', dt.column('estado_pago:name').data().toArray());

  // 2) Texto visible en celdas (lo que queda en el DOM, sin HTML)
  const displayText = dt
    .cells(null, 'estado_pago:name')
    .nodes()
    .to$()
    .map((i: number, td: HTMLElement) => td.textContent?.trim())
    .get();
  console.log('DISPLAY text:', displayText);

  // 3) Valor usado para filtrar si usas render ortogonal (filter)
  //    Si no has definido render('filter'), esto devolverá lo mismo que display/raw
  const filterValues = dt.cells(null, 'estado_pago:name').render('filter').toArray();
  console.log('FILTER values:', filterValues);
};

const setEstado = (expr: string, regex = true, smart = false, ci = true) => {
    const dt = tableRef.current?.dt?.();
    if (!dt) return;
    dt.column("estado_pago:name").search(expr, regex, smart, ci).draw();
  };

const setEstadoPedido = (expr: string, regex = true, smart = false, ci = true) => {
    const dt = tableRef.current?.dt?.();
    if (!dt) return;
    dt.column("estado_pedido:name").search(expr, regex, smart, ci).draw();
  };

    const customStyles = {
      cells: {
        style: {
          '&:first-child': {
            position: 'sticky',
            left: 0,
            backgroundColor: 'white',
            zIndex: 1
          }
        }
      }
    };

  const btn = (variant: string, key: string) =>
    `btn ${activeFilter === key ? `btn-${variant}` : `btn-outline-${variant}`}`;
  const btnPedido = (variant: string, key: string) =>
    `btn ${activeEstadoPedidoFilter === key ? `btn-${variant}` : `btn-outline-${variant}`}`;

  const headerLabels =
    header ??
    (columns
      ? columns.map((col: DataTableColumn, index: number) => {
          if (col?.title) {
            return col.title;
          }
          if (typeof col?.data === 'string') {
            return col.data;
          }
          return `Columna ${index + 1}`;
        })
      : data.length > 0
      ? Object.keys(data[0])
      : []);

  return (
    <div 
    className="data-table-shell"
    >

      {/* <button className="btn btn-outline-secondary mb-2" onClick={debugEstado}>
  Debug columna estado
</button> */}

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
        type="button"
        className={btn("secondary", "todos")}
        aria-pressed={activeFilter === "todos"}
        onClick={() => {
          setEstado("", false);
          setActiveFilter("todos");
        }}
      >
        Todos
      </button>

      <button
        type="button"
        className={btn("info", "conAbono")}
        aria-pressed={activeFilter === "conAbono"}
        onClick={() => {
          setEstado("^Con abono$", true, false, true);
          setActiveFilter("conAbono");
        }}
      >
        Con abono
      </button>

      <button
        type="button"
        className={btn("warning", "sinPago")}
        aria-pressed={activeFilter === "sinPago"}
        onClick={() => {
          setEstado("^Sin Pago$", true, false, true);
          setActiveFilter("sinPago");
        }}
      >
        Sin pago
      </button>

      <button
        type="button"
        className={btn("success", "pagado")}
        aria-pressed={activeFilter === "pagado"}
        onClick={() => {
          setEstado("^Pagado$", true, false, true);
          setActiveFilter("pagado");
        }}
      >
        Pagado
      </button>

      <button
        type="button"
        className={btn("danger", "anulado")}
        aria-pressed={activeFilter === "anulado"}
        onClick={() => {
          setEstado("^Anulado$", true, false, true);
          setActiveFilter("anulado");
        }}
      >
        Anulado
      </button>

      <button
        type="button"
        className={btn("primary", "noAnulados")}
        aria-pressed={activeFilter === "noAnulados"}
        onClick={() => {
          setEstado("^(?!Anulado$).*", true, false, true);
          setActiveFilter("noAnulados");
        }}
      >
        No anulados
      </button>
      </div>
      {estadoPedidoFilters?.length ? (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {estadoPedidoFilters.map((f: EstadoPedidoFilter) => (
            <button
              key={f.key}
              type="button"
              className={btnPedido("secondary", f.key)}
              aria-pressed={activeEstadoPedidoFilter === f.key}
              onClick={() => {
                setEstadoPedido(f.expr ?? "", f.regex ?? true, f.smart ?? false, f.ci ?? true);
                setActiveEstadoPedidoFilter(f.key);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}
        {/* <button onClick={imprimir}>eliminar</button> */}
        {/* <table id="myTable" ref={tableRef} className="table  table-striped table-bordered"> */}
       { data.length > 0 && <DataTable 
            // ajax="http://localhost:8000/venta/"
            data={data} 
            columns={columns} 
            className="display"
            ref={tableRef as any}
            
            // options={{
            //     // columns: columns,
            //     // data=data,
            //     // responsive: true,
            //     select: true,
            //     order: order,
            //     // fixedHeader: true,
                
            // }}
            slots={slotes as any}
        // ref={table}
        >

          
        <thead>
            <tr>
              {headerLabels.map((label, index) => (
                <th key={`${label}-${index}`}>{label}</th>
              ))}
            </tr>
        </thead>
        {/* <tbody>

        </tbody> */}
        </DataTable>}
        {/* </table> */}

        
    </div>
  );
};

export default DataTables;
