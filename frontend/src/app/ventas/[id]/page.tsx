// @ts-nocheck
import React from 'react'
import VentaUpdateForm from '@/components/ventas/VentaUpdateForm';
import { serverApiFetch } from '@/lib/server-api';

interface VentaPageProps {
  params: Promise<{
    id: string;
  }>;
}


async function getVenta(id: string) {
  const res = await serverApiFetch(`venta/${id}`, {
    cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
  });
  if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
  }
  const data =  await res.json();
  return data
}

async function getGeneralData() {
  const res = await serverApiFetch("ventas/?solo_catalogos=1", {
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
  const [data, generalData] = await Promise.all([getVenta(id), getGeneralData()]);
  return (
    <>
      <VentaUpdateForm data={generalData} ventaData={data} />
    </>
  )
}

export default page
