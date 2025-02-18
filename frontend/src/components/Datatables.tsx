"use client"; // Asegúrate de marcar el componente como del lado del cliente

import dynamic from "next/dynamic";
import { useEffect } from "react";
import $ from 'jquery';
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net";
// import 'bootstrap/dist/css/bootstrap.min.css';



const DataTables = (props) => {

    const { header, data } = props

    // const headers = ['Nombre', 'telefono', 'vinilla']
    // const data =[
    //     {
    //         nombre: "nombre",
    //         telefono: "telefono",
    //         vinilla: "telefono",
    //         lelo: "leloso loso"
    //     },
    // ]
        
    console.log("");
  
    useEffect(() => {
    // Inicializar DataTables
        $("#myTable").DataTable(
            {
        "data": data,
        "scrollX": true,
        "pageLength": 30,
        "scrollY": 500,
        "columns": Object.keys(data[0]).map((row) =>  {
            return {'data': row} 
        }),
        order: {
            idx: 0,
            dir: 'desc'
        }
        
        // [
        //     {"data": "nombre"},
        //     {"data": "telefono"},
        //     {"data": "vinilla"},
        // ]
    }
        );
        
    }, []);

    

  return (
    <div className="container-xl">
        <table id="myTable" className="table  table-striped table-bordered">
        <thead>
            <tr>
                {/* {Object.keys(data[0]).map((header, index) => (
                    <th key={index}>{header}</th>
            ))} */}

                    {!header 
                        ? Object.keys(data[0]).map((key, index) => (
                              <th key={index}>{key}</th>
                          ))
                        : // Si header está definido, usarlo para generar las columnas
                          header.map((item, index) => <th key={index}>{item}</th>)}
            </tr>
        </thead>
        <tbody>
            {/* <tr>
            <td>Juan Pérez</td>
            <td>25</td>
            <td>Madrid</td>
            </tr>
            <tr>
            <td>Ana Gómez</td>
            <td>30</td>
            <td>Barcelona</td>
            </tr>
            <tr>
            <td>Carlos Ruiz</td>
            <td>28</td>
            <td>Valencia</td>
            </tr> */}
        </tbody>
        </table>

        
    </div>
  );
};

export default DataTables;