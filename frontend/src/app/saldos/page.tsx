import React from 'react'
import DataTables from '@/components/Datatables'
import { buildBackendUrl } from '@/utils/js/env';


async function getDataVentas() {
  const res = await fetch(buildBackendUrl("venta/"), {
    cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
  });
  if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
  }
  const data =  await res.json();
  return data
}

function page() {
  return (
    <div>
      {/* <DataTables /> */}
      Saldos
    </div>
  )
}

export default page
