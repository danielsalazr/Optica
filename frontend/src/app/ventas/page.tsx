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
    // console.log(table)
    // console.log(generalData)

    // Modificar la propiedad "precio" de cada objeto en la lista
    table = table.map(item => {
      const precioRaw = item.precio ?? 0;
      const totalAbonoRaw = item.totalAbono ?? 0;
      const saldoRaw = item.saldo ?? 0;
      return {
        ...item,
        precioRaw,
        totalAbonoRaw,
        saldoRaw,
        precio: moneyformat(precioRaw),
        totalAbono: moneyformat(totalAbonoRaw),
        saldo: moneyformat(saldoRaw),
        estadoPedidoId: item.estado_pedido_id ?? null,
        estadoPedidoNombre: item.estado_pedido_nombre ?? '',
        estadoPedidoDetalle: item.estado_pedido_detalle ?? '',
        estadoPedidoFecha: item.estado_pedido_actualizado ?? null,
      };
    });

    
    
  return (
    <div className="page-shell">
      <div className="ventas-toolbar">
        <Link href="/" className="floating-back-button">
          <i className="fa-solid fa-arrow-left" />
        </Link>
        <h1 className="ventas-page-title mb-0">Ventas</h1>
        <Link href="/ventas/crearVenta" className="btn btn-primary fw-semibold px-4 py-2 rounded-pill">
          Crear venta
        </Link>
      </div>

      <div className="ventas-card">
        <VentasData data={table} generalData={generalData} />
      </div>
    </div>
  )
}

export default page
