// @ts-nocheck
import React from 'react';

import SaldosModule from '@/components/saldos/SaldosModule';
import { serverApiFetch } from '@/lib/server-api';
import '@/styles/style.css';


async function getSaldosData() {
  const res = await serverApiFetch("saldos/", {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }
  return res.json();
}

async function page() {
  let data = { rows: [], fecha_referencia: null };
  let fetchError = null;

  try {
    data = await getSaldosData();
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'Error desconocido';
  }

  return <SaldosModule rows={data.rows ?? []} referenceDate={data.fecha_referencia} fetchError={fetchError} />;
}

export default page;
