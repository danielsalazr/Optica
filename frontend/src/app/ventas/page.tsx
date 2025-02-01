//"use client"; 
import React from 'react'
//import { useEffect,useState } from 'react';
import '@/styles/selectwithImage.css';
import MyPhoneInput  from '@/components/MyPhoneInput ';
import PhoneInputIntl from '@/components/PhoneInputIntl';
//import '@/utils/js/intlInput.js';
//import "selectize/dist/css/selectize.css";

// import intlTelInput from "intl-tel-input";
import IntlTelInput from 'react-intl-tel-input';
import "intl-tel-input/build/css/intlTelInput.css";

import TablaArticulos from '@/components/TablaArticulos';
import dynamic from 'next/dynamic';

import {obtenerInfoArticulo} from "@/utils/js/selectizeElements"
import { callApiFile } from '@/utils/js/api';

import VentasForm from '@/components/VentasForm';

// const PhoneInput = dynamic(() => import('../components/PhoneInput'), { ssr: false });

// import ("@/utils/js/selectizeElements");
// import ("@/utils/js/ventas");
// import ("@/utils/js/imagenesInputs");
// import ("@/utils/js/selectwithImage");
// import ("@/utils/js/intlInput");
{/* <script src="{% static 'js/selectwithImage.js' %}"></script>
  
  <script src="{% static 'js/ventas.js' %}"></script>
  <script src="{% static 'js/tablaArticulos.js' %}"></script> */}



async function getData() {
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

    const fechaHoy = new Date().toISOString().split('T')[0];
    console.log(fechaHoy)
    
    const data = await getData();

    console.log(data)


    

    
    
  return (
    <>
      
        <div>
        {/* <link rel="stylesheet" href="{% static " css selectwithimage.css" %}" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.15.2/css/selectize.bootstrap5.min.css" integrity="sha512-Ars0BmSwpsUJnWMw+KoUKGKunT7+T8NGK0ORRKj+HT8naZzLSIQoOSIIM3oyaJljgLxFi0xImI5oZkAWEFARSA==" crossOrigin="anonymous" referrerPolicy="no-referrer" /> */}
        <a className="previous round" href="{% url 'main' %}" 
            style={{position: 'relative !important', top: '20px !important', left: '20px !important', padding: '8px 16px', borderRadius: '50%', backgroundColor: '#f1f1f1'}}>
            <i className="fa-solid fa-arrow-left" />
        </a>
        <div className="d-flex w-100 flex-column vh-100 align-items-center mt-4">
            {/* {'{'}% comment %{'}'}
            <div className="row w-100">
            {'{'}% endcomment %{'}'} */}
            <div className="mx-auto">
                <h3>Crear Venta</h3>
            </div>
            < VentasForm data={data} />
            <hr className="my-3" />
            <div className="mx-auto">
                <h3>Facturas recientes</h3>
            </div>
            <div className="table-responsive container-md">
                {'{'}% comment %{'}'} style="width: 90%" table-bordered {'{'}% endcomment %{'}'}
                {'{'}% if ventas %{'}'}
                {'{'}% for venta in ventas %{'}'}
                {'{'}% if venta.estado == "Pagado"  %{'}'}
                {'{'}% else %{'}'}
                {'{'}% endif %{'}'}
                {'{'}% endfor %{'}'}
                {'{'}% endif %{'}'}
                <table className="table table-striped table-hover"><thead>
                    <tr>
                    <th scope="col">#</th>
                    <th scope="col">Factura</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Precio venta</th>
                    <th scope="col">Abono Total</th>
                    <th scope="col">Saldo</th>
                    <th scope="col">Estado</th>
                    </tr>
                </thead>
                <tbody><tr>
                    <td>{'{'}{'{'}venta.numero{'}'}{'}'}</td>
                    <th scope="row">{'{'}{'{'}venta.factura{'}'}{'}'}</th>
                    <td>{'{'}{'{'}venta.nombre{'}'}{'}'}</td>
                    <td>$ {'{'}{'{'}venta.precio|floatformat:2|intcomma {'}'}{'}'}</td>
                    <td>$ {'{'}{'{'}venta.abono|floatformat:2|intcomma {'}'}{'}'}</td>
                    <td>$ {'{'}{'{'}venta.saldo|floatformat:2|intcomma {'}'}{'}'}</td><th scope="col" className="text-success">{'{'}{'{'}venta.estado{'}'}{'}'}</th><th scope="col" className="text-danger">{'{'}{'{'}venta.estado{'}'}{'}'}</th></tr></tbody>
                </table>
            </div>
            {/* </div> */}
        </div>
        </div>


    </>
  )
}

export default page
