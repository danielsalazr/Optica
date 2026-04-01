// @ts-nocheck
export const dynamic = 'force-dynamic';

import React from 'react'
import VentasForm from '@/components/ventas/VentasForm';
import { buildServerBackendUrl } from '@/utils/js/env';
import '@/styles/selectwithImage.css';

async function getData() {
    const res = await fetch(buildServerBackendUrl("ventas/"), {
      cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
    });
    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const data =  await res.json();
    return data
}

async function page() {

    let data = { pedido: 0, clientes: [], empresas: [], vendedores: [], jornadas: [], articulos: [], mediosPago: [] };

    try {
      data = await getData();
    } catch (error) {
      console.error('Error cargando /ventas/crearVenta:', error);
    }

  return (
    <div className="d-flex w-100 flex-column vh-100 align-items-center mt-4">
      <div className="mx-auto">
                <h3>Crear Venta</h3>
            </div>
            < VentasForm data={data} />
            <hr className="my-3" />
            
            
            <div className="mx-auto">
                <h3>Pedidos recientes</h3>
            </div>
            <div className="table-responsive container-md">
            </div>
    </div>
  )
}

export default page;
