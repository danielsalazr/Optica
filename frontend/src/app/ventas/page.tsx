// "use client"; 
import React from 'react'
import Link from "next/link";

import VentasData from '@/components/ventas/VentasData';
import DataTables from '@/components/Datatables';
import { moneyformat } from '@/utils/js/utils';

import '@/styles/selectwithImage.css';
import "intl-tel-input/build/css/intlTelInput.css";



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

async function getGeneralData() {
  const res = await fetch("http://localhost:8000/ventas/", {
    cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
  });
  if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
  }
  const data =  await res.json();
  return data
}


async function page() {
    let table = await getDataVentas();

    const generalData = await getGeneralData()
    console.log(table)
    console.log(generalData)

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

          <VentasData data={table} generalData={generalData} />
          
        </div>
      </div>


    </>
  )
}

export default page
