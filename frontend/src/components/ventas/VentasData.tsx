"use client";
import React, {useState, } from 'react'
import { moneyformat, fechaFormat } from '@/utils/js/utils';
import { Trash2 } from 'lucide-react';

import DataTables from '@/components/Datatables';
import SideAction from '../SideAction';

import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';


import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function VentasData(props) {
    let { header, data } = props;
    const [show, setShow] = useState(false);
    const [clientData, setClientData] = useState(false);
  
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
  
    const toggleState = () => {
      setShow(!show);
    };
    
    // console.log(data)
  
  
        const handleAction = (action, rowData) => {
          switch (action) {
            case "eliminar":
              console.log(action)
              console.log("Eliminar:", rowData);
              break;
            case "editar":
              console.log(action)
              console.log("Editar:", rowData);
              break;
            case "abonar":
              // console.log("abonat:", rowData);
              console.log(action)
              setClientData(rowData);
              toggleState();
                  break;
            default:
              console.log("Acción no reconocida:", action);
          }
        };
  
        const columns = [
          {  "data": "factura" },
          {  "data": "cedula" },
          {  "data": "cliente" },
          {  "data": "precio" },
          {  "data": "totalAbono" },
          {  "data": "saldo" },
          {  "data": "estado" },
          {
            "data": null,
            render: function (data, type, row) {
              return `
                <button 
                  class="btn-action btn btn-sm btn-danger" data-action="eliminar"
                  data-bs-container="body"
                  data-bs-toggle="popover" 
                  data-bs-placement="top" 
                  data-bs-content="Eliminar Abono"
                  data-bs-delay='{"show":500,"hide":150}'
                  data-bs-trigger="hover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
                </button>
                <button 
                  class="btn-action btn btn-sm btn-primary" data-action="editar"
                  data-bs-container="body"
                  data-bs-toggle="popover" 
                  data-bs-placement="top" 
                  data-bs-content="Editar Abono"
                  data-bs-delay='{"show":500,"hide":150}'
                  data-bs-trigger="hover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16zm9.5-13.5l4 4"/></svg>
                </button>
                <button 
                  class="btn-action btn btn-sm btn-primary" data-action="abonar"
                  data-bs-container="body"
                  data-bs-toggle="popover" 
                  data-bs-placement="top" 
                  data-bs-content="Abonar a factura"
                  data-bs-delay='{"show":500,"hide":150}'
                  data-bs-trigger="hover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M21 15h-2.5a1.503 1.503 0 0 0-1.5 1.5a1.503 1.503 0 0 0 1.5 1.5h1a1.503 1.503 0 0 1 1.5 1.5a1.503 1.503 0 0 1-1.5 1.5H17m2 0v1m0-8v1m-6 6H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2m12 3.12V9a2 2 0 0 0-2-2h-2"/><path d="M16 10V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6m8 0H8m8 0h1m-9 0H7m1 4v.01M8 17v.01m4-3.02V14m0 3v.01"/></g></svg>
                </button>

                <button 
                  class="btn-action btn btn-sm btn-primary" data-action="abonar"
                  data-bs-container="body"
                  data-bs-toggle="popover" 
                  data-bs-placement="top" 
                  data-bs-content="Ver historico de abonos"
                  data-bs-delay='{"show":500,"hide":150}'
                  data-bs-trigger="hover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2m5 6h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10m2 0v1m0-8v1"/></g></svg>
                </button>

                
              `;
            },
          },
        ];
        
        const order = {
            idx: 0,
            dir: 'desc'
        }
  
    function con(){
      console.log("eliminar")
    }
  
    return (
      <>
          
        <SideAction key="1" placement="end" name="end" title="Abonar" toggleState={toggleState} show={show} data={clientData}>
          <form action="" id="crearAbono">
              <h6>Crear abono</h6>
          </form>
        </SideAction>
  
          <DataTables data={data} columns={columns} order={order} onAction={handleAction} imprimir ={con} /> 
      </>
    )
}

export default VentasData
