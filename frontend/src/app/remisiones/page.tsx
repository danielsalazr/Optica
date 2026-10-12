// @ts-nocheck
import RemisionesDataClient from "@/components/remisiones/RemisionesDataClient";
import { serverApiFetch } from '@/lib/server-api';

async function getRemisiones() {
  const res = await serverApiFetch("remisiones/?include_anuladas=1", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  return res.json();
}

export default async function RemisionesPage() {
  const remisiones = await getRemisiones();

  return (
    <div className="page-shell remisiones-page" >
      <RemisionesDataClient data={remisiones} />
    </div>
  );
}
