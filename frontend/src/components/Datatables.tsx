"use client"; // Asegúrate de marcar el componente como del lado del cliente

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import $ from 'jquery';
import "datatables.net-dt/css/dataTables.dataTables.css";

// import "datatables.net";
// import 'datatables.net-dt';
// import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import AbonosForm from "./abonos/AbonosForm";

import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
 




const DataTables = (props) => {
    // const tableRef = useRef(null);
    DataTable.use(DT);
    const tableRef = useRef(null);
    const [activeFilter, setActiveFilter] = useState("todos");
    const { header, data, imprimir, columns, onAction, order, slotes } = props;
    

    console.log("columns", columns);


    // const headers = ['Nombre', 'telefono', 'vinilla']  
    useEffect(() => {
    //     console.log(data)

    // // Inicializar DataTables
    //     const table = $("#myTable").DataTable({
    //         // if (!$.fn.DataTable.isDataTable("#myTable")) {

    //     // const table = $(tableRef.current).DataTable({
        
    //         "data": data,
    //         "scrollX": true,
    //         "pageLength": 30,
    //         "scrollY": 500,
    //         // "columns": Object.keys(data[0]).map((row) =>  {
    //         //     return {'data': row} 
    //         // }),

    //         "columns": columns,   
    //         "order": order,
    //         // drawCallback: function (settings) {
                
    //         // }
    //         //     const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
            
    //     });


    //     $("#myTable").on("click", ".btn-action", function () {
    //         const action = $(this).data("action"); // Acción (eliminar, editar, etc.)
    //         const rowData = table.row($(this).closest("tr")).data(); // Datos de la fila
    //         onAction(action, rowData); // Llamar a la función onAction
    //     });

    //     $('#myTable').on('draw.dt', function () {

    //         const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    //         const popoverList = popoverTriggerList.map(function(popoverTriggerEl) {
    //             return new bootstrap.Popover(popoverTriggerEl)  
    //         })
    //     })

    //     // }

        const handlePageLoaded = () => {
            console.log("Pagina Cargada")
            const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
            const popoverList = popoverTriggerList.map(function(popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl)
        })};
      
          window.onload = handlePageLoaded;

    //     if (table.current) {
    //     // inicializa DataTable si no está ya
    //     const dt = table.current.dt();
    //     // ejemplo: botones manuales
    //     document.getElementById("btn-activos")?.addEventListener("click", () => {
    //       dt.column(6).search("Activo").draw();
    //     });
    //     document.getElementById("btn-inactivos")?.addEventListener("click", () => {
    //       dt.column(6).search("Inactivo").draw();
    //     });
    //     document.getElementById("btn-todos")?.addEventListener("click", () => {
    //       dt.column(6).search("").draw();
    //     });
    // }
        
    }, []);

//     const applyFilter = (filter: string) => {
//   if (!table.current) return;
//   const dt = table.current.dt();

//   console.log(dt)

//   switch (filter) {
//     case "todos":
//       dt.column("estado:name").search("").draw();
//       break;
//     case "con abono":
//       dt.column("estado:name").search("Con abono", false, false).draw();
//       break;
//     case "sin pago":
//       dt.column("estado:name").search("^Sin Pago$", true, false).draw();
//       break;
//     case "pagado":
//       dt.column("estado:name").search("^Pagado$", true, false).draw();
//       break;
//     case "anulado":
//       dt.column(6).search("^Anulado$", true, false).draw();
//       break;
//     case "no anulado":
//       // todo excepto "Anulado"
//       dt.column("estado:name").search("^(?!Anulado$).*", true, false).draw();
//       break;
//   }
//   setActiveFilter(filter);
// };

const debugEstado = () => {
  const dt = tableRef.current?.dt();
  if (!dt) return;

  // 1) Datos crudos de la columna (procedentes de tu 'data')
  console.log('RAW data:', dt.column('estado:name').data().toArray());

  // 2) Texto visible en celdas (lo que queda en el DOM, sin HTML)
  const displayText = dt
    .cells(null, 'estado:name')
    .nodes()
    .to$()
    .map((i, td) => td.textContent?.trim())
    .get();
  console.log('DISPLAY text:', displayText);

  // 3) Valor usado para filtrar si usas render ortogonal (filter)
  //    Si no has definido render('filter'), esto devolverá lo mismo que display/raw
  const filterValues = dt.cells(null, 'estado:name').render('filter').toArray();
  console.log('FILTER values:', filterValues);
};

const setEstado = (expr: string, regex = true, smart = false, ci = true) => {
    const dt = tableRef.current?.dt();
    if (!dt) return;
    dt.column("estado:name").search(expr, regex, smart, ci).draw();
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

  return (
    <div 
    className="container-xl mt-4"
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
        {/* <button onClick={imprimir}>eliminar</button> */}
        {/* <table id="myTable" ref={tableRef} className="table  table-striped table-bordered"> */}
       { data.length > 0 && <DataTable 
            // ajax="http://localhost:8000/venta/"
            data={data} 
            columns={columns} 
            className="display"
            customStyles={customStyles}
            fixedHeader
            scroller
            ref={tableRef}
            
            // options={{
            //     // columns: columns,
            //     // data=data,
            //     // responsive: true,
            //     select: true,
            //     order: order,
            //     // fixedHeader: true,
                
            // }}
            slots={slotes}
        // ref={table}
        >

          
        <thead>
            <tr>
                    {
                    data.length > 0 
                      ? ( !header   ? Object.keys(data[0]).map((key, index) => (
                      // ? Object.keys(data).map((key, index) => (
                            <th key={index}>{key}</th>
                        ))
                      : // Si header está definido, usarlo para generar las columnas
                        header.map((item, index) => <th key={index}>{item}</th>) )
                        : null
                    }

                    
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