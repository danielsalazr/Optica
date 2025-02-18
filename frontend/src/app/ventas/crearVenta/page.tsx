import React from 'react'
import VentasForm from '@/components/VentasForm';
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
                {/* <table className="table table-striped table-hover"><thead>
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
                </table> */}
            </div>
    </div>
  )
}

export default page;
