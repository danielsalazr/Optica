"use client";

import dynamic from "next/dynamic";

const RemisionesData = dynamic(() => import("@/components/remisiones/RemisionesData"), {
  ssr: false,
  loading: () => <div className="page-shell">Cargando remisiones...</div>,
});

export default function RemisionesDataClient(props: any) {
  return <RemisionesData {...props} />;
}
