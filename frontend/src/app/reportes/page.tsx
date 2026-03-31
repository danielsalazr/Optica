// @ts-nocheck
import React from "react";
import "@/styles/style.css";
import ReportesModule from "@/components/reportes/ReportesModule";
import { buildBackendUrl } from "@/utils/js/env";

async function getReportesData() {
  try {
    const res = await fetch(buildBackendUrl("reportes/data/"), {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    return {
      data: await res.json(),
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible cargar los reportes.";
    return {
      data: {
        movimientos_ingresos: [],
        informe_ventas: [],
        informe_cartera: [],
      },
      error: message,
    };
  }
}

export default async function ReportesPage() {
  const { data, error } = await getReportesData();
  return <ReportesModule data={data} fetchError={error} />;
}
