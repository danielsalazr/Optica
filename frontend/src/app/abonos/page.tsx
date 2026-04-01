// @ts-nocheck
import React from 'react'
import '@/styles/style.css';
import '@/styles/selectwithImage.css';
import { moneyformat, fechaFormat } from '@/utils/js/utils';
import AbonosData from '@/components/abonos/AbonosData';
import { buildServerBackendUrl } from '@/utils/js/env';

type AbonoRow = {
  id: number | string;
  cedula: number | string;
  cliente: string;
  factura_id: number | string;
  nombre: string;
  precio: number | string;
  fecha: string;
  fechaRaw: string;
  medioDePago_id: number | string;
  abono_masivo_id: number | string | null;
  descripcion: string | null;
  [key: string]: unknown;
};

type GeneralData = {
  mediosPago: Array<{
    id: number | string;
    nombre: string;
    imagen: string;
  }>;
  [key: string]: unknown;
};

async function getDataAbonos() {
  const res = await fetch(buildServerBackendUrl("abono/"), {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }
  const data: AbonoRow[] = await res.json();
  return data;
}

async function getGeneralData() {
  const res = await fetch(buildServerBackendUrl("ventas/"), {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }
  const data: GeneralData = await res.json();
  return data;
}

async function page() {
  let data: AbonoRow[] = [];
  let generalData: GeneralData = { mediosPago: [] };
  let fetchError: string | null = null;

  try {
    [data, generalData] = await Promise.all([getDataAbonos(), getGeneralData()]);
  } catch (error) {
    fetchError =
      error instanceof Error
        ? error.message
        : "No fue posible cargar los abonos desde el backend.";
  }

  data = data.map((item: AbonoRow) => {
    const fechaOriginal = item.fecha;
    return {
      ...item,
      precio: moneyformat(item.precio),
      fecha: fechaFormat(item.fecha),
      fechaRaw: fechaOriginal,
    };
  });

  return (
    <div className="page-shell page-shell-narrow">
      {fetchError ? (
        <div className="alert alert-danger mx-3" role="alert">
          Error cargando abonos: {fetchError}
        </div>
      ) : null}
      <AbonosData data={data} generalData={generalData} />
    </div>
  );
}

export default page
