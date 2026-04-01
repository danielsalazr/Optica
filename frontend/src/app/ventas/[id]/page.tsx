// @ts-nocheck
import React from 'react'
import VentaUpdateForm from '@/components/ventas/VentaUpdateForm';
import { buildServerBackendUrl } from '@/utils/js/env';

interface VentaPageProps {
  params: Promise<{
    id: string;
  }>;
}


async function getVenta(id: string) {
  const res = await fetch(buildServerBackendUrl(`venta/${id}`), {
    cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
  });
  if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
  }
  const data =  await res.json();
  return data
}

async function getGeneralData() {
  const res = await fetch(buildServerBackendUrl("ventas/"), {
    cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
  });
  if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
  }
  const data =  await res.json();
  return data
}


async function page(props: VentaPageProps) {

  const { id } = await props.params
  const data = await getVenta(id);

  const generalData = await getGeneralData()
  console.log(data)
  return (
    <>
      <h2 className='text-center'>Editar Venta</h2>

      <VentaUpdateForm data={generalData} ventaData={data} />
    </>
  )
}

export default page
