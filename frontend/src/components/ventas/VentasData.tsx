"use client";
import React, {useState, useEffect} from 'react'
import { moneyformat, fechaFormat } from '@/utils/js/utils';
import { Trash2 } from 'lucide-react';
import { swalHtml, swalconfirmation, swalQuestion} from '@/utils/js/sweetAlertFunctions';

import DataTables from '@/components/Datatables';
import SideAction from '../SideAction';
import AbonosForm from '../abonos/AbonosForm';
import AbonosList from '../abonos/AbonosList';
import AnularVentaForm from './AnularVentaForm';

import BootstrapModal from '../BootstrapModal';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';







import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function VentasData(props) {
    let { header, data, generalData } = props;
    const [templateAbono, setTemplateAbono] = useState(0);
    const [show, setShow] = useState(false);
    const [show2, setShow2] = useState(false);
    const [sideTemplate, setSideTemplate] = useState(false);
    const [modalAnularShow, setModalAnularShow] = useState(false);
    const [clientData, setClientData] = useState(false);
    const [sideBarData, setSideBarData] = useState([]);
    const [dataTablee, setDataTable] = useState(data);
    const [overrideData, setOverrideData] = useState(0);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const toggleState = () => {
      setShow(!show);
    };
    


    const handleFetchVentas = async () => {
      //etLoading(true);

      const res = await fetch("http://localhost:8000/venta/", {
        cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
      });
      if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
      }
      let redata =  await res.json();

      console.log(redata)
      redata = redata.map(item => {
            // Eliminar el símbolo "$" y reemplazar "." por ","
            item.precio = moneyformat(item.precio)
            item.totalAbono = moneyformat(item.totalAbono)
            item.saldo = moneyformat(item.saldo)
            return item; // Retornar el objeto modificado
          });
      setDataTable(redata)
      console.log(dataTablee)
      toggleState()
      return redata
    };
  
    const handleAction = async (action, rowData) => {
      switch (action) {
        case "eliminar":
          console.log(action)
          console.log("Eliminar:", rowData);
          setOverrideData(rowData.factura)
          setModalAnularShow(!modalAnularShow)
          
          // const question = await swalQuestion("¿Esta seguro de eliminar el abono?")

          // if (!question) {
          //   return false
          // }



          // const req = await fetch(`http://localhost:8000/media/${rowData.factura}`, {
          //   method: 'DELETE',
          //   headers: {
          //     'Content-Type': 'application/json',
          //   },
          // });

          break;

        case "editar":
          console.log(action)
          console.log("Editar:", rowData);
          break;

        case "abonar":
          console.log(action)
          setClientData(rowData);
          setTemplateAbono(1);
          console.log(templateAbono)
          toggleState();
              break;

        case "verAbonos":
          setClientData(rowData);
          setTemplateAbono(2);
          console.log(templateAbono)
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
            "data": null, "name": 'Acciones',
          }

        ];

        const slots = {
          Acciones: (data, row) => (
            <div className='gap-2 d-flex justify-content-center flex-wrap'>
              
              <button 
                  className="btn-action btn btn-sm btn-danger" 
                  // data-action="eliminar"
                  data-bs-container="body"
                  data-bs-toggle="popover" 
                  data-bs-placement="top" 
                  data-bs-content="Eliminar Abono"
                  data-bs-delay='{"show":500,"hide":150}'
                  data-bs-trigger="hover"
                  onClick={() => handleAction("eliminar", row)}
                  
                >
                  
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
                </button>
                <button 
                  className="btn-action btn btn-sm btn-primary" 
                  // data-action="editar"
                  data-bs-container="body"
                  data-bs-toggle="popover" 
                  data-bs-placement="top" 
                  data-bs-content="Editar Abono"
                  data-bs-delay='{"show":500,"hide":150}'
                  data-bs-trigger="hover"
                  onClick={() => handleAction("editar", row)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16zm9.5-13.5l4 4"/></svg>
                </button>
                <button 
                  className="btn-action btn btn-sm btn-primary" 
                  // data-action="abonar"
                  data-bs-container="body"
                  data-bs-toggle="popover" 
                  data-bs-placement="top" 
                  // data-bs-content="Abonar a factura"
                  data-bs-delay='{"show":500,"hide":150}'
                  data-bs-trigger="hover"
                  onClick={() => handleAction("abonar", row)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M21 15h-2.5a1.503 1.503 0 0 0-1.5 1.5a1.503 1.503 0 0 0 1.5 1.5h1a1.503 1.503 0 0 1 1.5 1.5a1.503 1.503 0 0 1-1.5 1.5H17m2 0v1m0-8v1m-6 6H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2m12 3.12V9a2 2 0 0 0-2-2h-2"/><path d="M16 10V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6m8 0H8m8 0h1m-9 0H7m1 4v.01M8 17v.01m4-3.02V14m0 3v.01"/></g></svg>
                </button>

                <button 
                  className="btn-action btn btn-sm btn-primary" 
                  // data-action="verAbonos"
                  data-bs-container="body"
                  data-bs-toggle="popover" 
                  data-bs-placement="top" 
                  data-bs-content="Ver historico de abonos"
                  data-bs-delay='{"show":500,"hide":150}'
                  data-bs-trigger="hover"
                  onClick={() => handleAction("verAbonos", row)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2m5 6h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10m2 0v1m0-8v1"/></g></svg>
                </button>
                <button 
                  className="btn-action btn btn-sm btn-primary" 
                  // data-action="verAbonos"
                  data-bs-container="body"
                  data-bs-toggle="popover" 
                  data-bs-placement="top" 
                  data-bs-content="Devoluciones"
                  data-bs-delay='{"show":500,"hide":150}'
                  data-bs-trigger="hover"
                  onClick={() => handleAction("verAbonos", row)}
                >

                <svg style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }} xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-u-turn-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 20v-11.5a4.5 4.5 0 0 1 9 0v8.5" /><path d="M13 14l3 3l3 -3" /></svg>

                </button>
            </div>
          )
      }
        
        const order = {
            idx: 0,
            dir: 'desc'
        }
  
    function con(){
      console.log("eliminar")
    }


    const componentesPorEstado = {
      1: <AbonosForm data={clientData} generalData={generalData} fun={handleFetchVentas}/>,
      2: <AbonosList data={clientData} generalData={generalData}/>,
      // default: <ComponenteDefault />
    }
    return (
      <>
        <BootstrapModal
              show={modalAnularShow}
              onHide={() => setModalAnularShow(false)}
              title="Anular venta"
              // onSubmit={handleNuevaEmpresa}
              submitBtn="Anular"
              
          >
              <AnularVentaForm factura={overrideData} />
              {/* <AnularVentaForm /> */}
          </BootstrapModal> 

        <SideAction key="1" placement="end" name="end" title="Abonar" togglestate={toggleState} show={show} data={clientData} >   
            {/* {templateAbono === 2 && <AbonosList data={clientData} generalData={generalData}/>}
            {templateAbono === 1 && <AbonosForm data={clientData} generalData={generalData} fun={handleFetchVentas}/>} */}
            
            {componentesPorEstado[templateAbono]}
        </SideAction>


  
          <DataTables data={dataTablee} columns={columns} order={order} onAction={handleAction} imprimir ={con} slotes={slots} /> 
      </>
    )
}

export default VentasData
