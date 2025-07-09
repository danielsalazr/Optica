import React from 'react'
import VentasForm from '@/components/ventas/VentasForm';
import '@/styles/selectwithImage.css';

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

    const data = await getData();
    console.log(data)

  return (
    <div className="d-flex w-100 flex-column vh-100 align-items-center mt-4">
      <div className="mx-auto">
                <h3>Crear Venta</h3>
            </div>
            < VentasForm data={data} />
            <hr className="my-3" />
            
            
            <div className="mx-auto">
                <h3>Facturas recientes</h3>
            </div>
            <div className="table-responsive container-md">
            </div>
    </div>
  )
}

export default page;
