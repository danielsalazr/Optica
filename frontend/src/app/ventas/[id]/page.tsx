import React from 'react'
import VentaUpdateForm from '@/components/ventas/VentaUpdateForm';


async function getVenta(id) {
  const res = await fetch(`http://localhost:8000/venta/${id}`, {
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


async function page(props) {

  const { id } = props.params
  const data = await getVenta(id);

  const generalData = await getGeneralData()
  console.log(data)
  return (
    <div>
      Si sr {2}

      <VentaUpdateForm data={generalData} ventaData={data} />
    </div>
  )
}

export default page
