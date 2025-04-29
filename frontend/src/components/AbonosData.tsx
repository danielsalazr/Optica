"use client";

import React, {useState, useEffect} from 'react'
import { moneyformat, fechaFormat } from '@/utils/js/utils';
import DataTables from '@/components/Datatables';

import { Trash2 } from 'lucide-react';

import 'bootstrap/dist/js/bootstrap.bundle.min.js';




import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import SideAction from './SideAction';

function AbonosData(props) {

  

  let { header, data } = props;
  const [show, setShow] = useState(false);

  

  const [datatable, setDataTable] = useState(data);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const toggleState = () => {
    setShow(!show);
  };
  
  useEffect(() => {
    console.log(data)
  }, [])


    //   const modifiedData = data.map(item => {
    //     item.acciones = `
    //     <button className="btn-action btn btn-danger" data-action="eliminar">Eliminar</button>
    //     <button className="btn-action btn btn-primary" data-action="editar">Editar</button>
    //     <button className="btn-action btn btn-primary" data-action="abonar">Abonar</button>
        
    //     `;
    //     return item;
    //   });


      const handleAction = (action, rowData) => {
        switch (action) {
          case "eliminar":
            console.log("Eliminar:", rowData);
            break;
          case "editar":
            console.log("Editar:", rowData);
            break;
          case "abonar":
            // console.log("abonat:", rowData);
            toggleState();
                break;
          default:
            console.log("Acción no reconocida:", action);
        }
      };

      const columns = [
        // { data: "id" },
        {  "data": "cedula", title: 'Cedula'},
        {  "data": "cliente", title: 'Cliente' },
        {  "data": "factura_id", title: 'Factura', width: '7%' },
        {  "data": "fecha" },
        {  "data": "id", name:'Numero pago', title: 'Numero pago' },
        {  "data": "nombre", title: 'Metodo pago' },
        {  "data": "precio" },
        {
          "data": null, name: 'Acciones', width: '15%'
        },
      ];



      const slots = {
        Acciones: (data, row) => (
          <div className='gap-2 d-flex justify-content-center flex-wrap'>
            <button 
                className="btn-action btn btn-sm btn-danger" data-action="eliminar"
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
                className="btn-action btn btn-sm btn-primary" data-action="editar"
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
                className="btn-action btn btn-sm btn-primary" data-action="abonar"
                data-bs-container="body"
                data-bs-toggle="popover" 
                data-bs-placement="top" 
                data-bs-content="Abonar a factura"
                data-bs-delay='{"show":500,"hide":150}'
                data-bs-trigger="hover"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M21 15h-2.5a1.503 1.503 0 0 0-1.5 1.5a1.503 1.503 0 0 0 1.5 1.5h1a1.503 1.503 0 0 1 1.5 1.5a1.503 1.503 0 0 1-1.5 1.5H17m2 0v1m0-8v1m-6 6H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2m12 3.12V9a2 2 0 0 0-2-2h-2"/><path d="M16 10V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6m8 0H8m8 0h1m-9 0H7m1 4v.01M8 17v.01m4-3.02V14m0 3v.01"/></g></svg>
              </button>
          </div>
        )
    }

    // const order = {
    //   idx: 4,
    //   dir: 'desc'
    // }

    const order = {
      name: 'Numero pago',
      dir: 'desc'
    } 
  

  function con(){
    console.log("eliminar")
  }

  return (
    <div>
        {/* <button onClick={toggleState}>
            offcanva
        </button> */}
      

      {/* <SideAction key="1" placement="end" name="end" title="Abonar" toggleState={toggleState} show={show} >
        <form action="" id="crearAbono">
            <h6>Crear abono</h6>
        </form>
      </SideAction> */}

      {/* <Trash2 /> */}


        <DataTables data={datatable} columns={columns} onAction={handleAction} order={order} imprimir ={con} slotes={slots} /> 
    </div>
  )
}

export default AbonosData
