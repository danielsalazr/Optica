"use client"; // Asegúrate de marcar el componente como del lado del cliente

import dynamic from "next/dynamic";
import { useEffect } from "react";
import $ from 'jquery';
import "datatables.net-dt/css/dataTables.dataTables.css";

import "datatables.net";
import 'datatables.net-dt';
// import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import AbonosForm from "./abonos/AbonosForm";



const DataTables = (props) => {

    const { header, data, imprimir, columns, onAction, order } = props

    // const headers = ['Nombre', 'telefono', 'vinilla']  
    useEffect(() => {
        console.log(data)

    // Inicializar DataTables
        const table = $("#myTable").DataTable({
            "data": data,
            "scrollX": true,
            "pageLength": 30,
            "scrollY": 500,
            // "columns": Object.keys(data[0]).map((row) =>  {
            //     return {'data': row} 
            // }),

            "columns": columns,   
            "order": order,
            // drawCallback: function (settings) {
                
            // }
            //     const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
            
        });


        $("#myTable").on("click", ".btn-action", function () {
            const action = $(this).data("action"); // Acción (eliminar, editar, etc.)
            const rowData = table.row($(this).closest("tr")).data(); // Datos de la fila
            onAction(action, rowData); // Llamar a la función onAction
        });

        $('#myTable').on('draw.dt', function () {

            const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
            const popoverList = popoverTriggerList.map(function(popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl)  
            })
        });

        const handlePageLoaded = () => {
            console.log("Pagina Cargada")
            const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
            const popoverList = popoverTriggerList.map(function(popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl)
        })};
      
          window.onload = handlePageLoaded;

        return () => {
            table.destroy();
          };
        
    }, []);

    

  return (
    <div 
    className="container-xl mt-4"
    >
        {/* <button onClick={imprimir}>eliminar</button> */}
        <table id="myTable" className="table  table-striped table-bordered">
        <thead>
            <tr>
                    {data.length > 0 
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
        <tbody>

        </tbody>
        </table>

        
    </div>
  );
};

export default DataTables;