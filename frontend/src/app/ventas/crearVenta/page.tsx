// @ts-nocheck
export const dynamic = 'force-dynamic';

import React from 'react'
import VentasForm from '@/components/ventas/VentasForm';
import { buildServerBackendUrl } from '@/utils/js/env';
import '@/styles/selectwithImage.css';

async function getData() {
    const res = await fetch(buildServerBackendUrl("ventas/?solo_catalogos=1"), {
      cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
    });
    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const data =  await res.json();
    return data
}

async function page() {

    let data = { pedido: 0, clientes: [], empresas: [], vendedores: [], jornadas: [], articulos: [], mediosPago: [], contextOptionsLoaded: false };

    try {
      data = { ...await getData(), contextOptionsLoaded: true };
    } catch (error) {
      console.error('Error cargando /ventas/crearVenta:', error);
    }

  return (
    <div className="sale-create-page d-flex w-100 flex-column vh-100 align-items-center mt-4">
            < VentasForm data={data} />
    </div>
  )
}

export default page;
