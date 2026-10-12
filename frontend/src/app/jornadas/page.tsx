// @ts-nocheck
export const dynamic = 'force-dynamic';

import React from "react";
import JornadasModule from "@/components/jornadas/JornadasModule";
import { serverApiFetch } from '@/lib/server-api';

async function fetchJornadas() {
  const response = await serverApiFetch("jornadas/", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible cargar las jornadas.");
  }

  return response.json();
}

async function fetchEmpresas() {
  const response = await serverApiFetch("usuarios/Empresas/", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible cargar las empresas.");
  }

  const data = await response.json();
  return data.empresas ?? [];
}

async function JornadasPage() {
  let jornadas = [];
  let empresas = [];
  let fetchError: string | null = null;

  try {
    [jornadas, empresas] = await Promise.all([fetchJornadas(), fetchEmpresas()]);
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "No fue posible cargar las jornadas desde el backend.";
    console.error("Error cargando /jornadas:", error);
  }

  return (
    <div className="page-shell jornadas-page">
      {fetchError ? (
        <div className="alert alert-danger" role="alert">
          Error cargando jornadas: {fetchError}
        </div>
      ) : null}
      <JornadasModule initialJornadas={jornadas} empresas={empresas} />
    </div>
  );
}

export default JornadasPage;
