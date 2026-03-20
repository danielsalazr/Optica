import React from 'react';

import SaldosModule from '@/components/saldos/SaldosModule';
import { buildBackendUrl } from '@/utils/js/env';

async function getSaldosData() {
  const res = await fetch(buildBackendUrl("reportes/data/"), {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }
  return res.json();
}

async function page() {
  let data = { informe_cartera: [] };
  let fetchError = null;

  try {
    data = await getSaldosData();
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'Error desconocido';
  }

  return <SaldosModule rows={data?.informe_cartera ?? []} fetchError={fetchError} />;
}

export default page;
