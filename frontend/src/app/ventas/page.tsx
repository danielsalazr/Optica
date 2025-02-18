// "use client"; 
import React from 'react'
import '@/styles/selectwithImage.css';
import Link from "next/link";
import "intl-tel-input/build/css/intlTelInput.css";

import DataTables from '@/components/Datatables';
import { moneyformat } from '@/utils/js/utils';


  async function getDataVentas() {
    const res = await fetch("http://localhost:8000/venta/", {
      cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
    });
    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const data =  await res.json();
    return data
  }


async function page() {

    
    
    // const data = await getData();
    // console.log(data)


    let table = await getDataVentas();
    console.log(table)

    // Modificar la propiedad "precio" de cada objeto en la lista
    table = table.map(item => {
      // Eliminar el símbolo "$" y reemplazar "." por ","
      item.precio = moneyformat(item.precio)
      item.totalAbono = moneyformat(item.totalAbono)
      item.saldo = moneyformat(item.saldo)
      return item; // Retornar el objeto modificado
    });


    

    
    
  return (
    <>
      
        <div className='container-md'>
          
        {/* <link rel="stylesheet" href="{% static " css selectwithimage.css" %}" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.15.2/css/selectize.bootstrap5.min.css" integrity="sha512-Ars0BmSwpsUJnWMw+KoUKGKunT7+T8NGK0ORRKj+HT8naZzLSIQoOSIIM3oyaJljgLxFi0xImI5oZkAWEFARSA==" crossOrigin="anonymous" referrerPolicy="no-referrer" /> */}
        <a className="previous round" href="{% url 'main' %}" 
            style={{position: 'relative !important', top: '20px !important', left: '20px !important', padding: '8px 16px', borderRadius: '50%', backgroundColor: '#f1f1f1'}}>
            <i className="fa-solid fa-arrow-left" />
        </a>
        <div className="d-flex w-100 flex-column vh-100 align-items-center mt-4">

          <div className="mx-auto">
              <h3>Ventas</h3>
          </div>
            
          <div className='d-flex w-100 justify-content-end'>
            <Link className="pe-2" rel="stylesheet" href="ventas/crearVenta" ><button className='btn btn-success'> crear Venta</button></Link> 
          </div>

          <DataTables 
            data={table}
            // header={[
            //   'factura',
            //   'cedula',
            //   'cliente',
            //   'empresaCliente',
            //   'detalle',
            //   'observacion',
            //   'precio',
            //   'totalAbono',
            //   'estado_id',
            //   'fecha',]}
          />
            {/* {'{'}% comment %{'}'}
            <div className="row w-100">
            {'{'}% endcomment %{'}'} */}
            
            {/* </div> */}
        </div>
        </div>


    </>
  )
}

export default page
