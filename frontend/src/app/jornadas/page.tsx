// @ts-nocheck
export const dynamic = 'force-dynamic';

import React from "react";
import JornadasModule from "@/components/jornadas/JornadasModule";
import { buildServerBackendUrl } from "@/utils/js/env";

async function fetchJornadas() {
  const response = await fetch(buildServerBackendUrl("jornadas/"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible cargar las jornadas.");
  }

  return response.json();
}

async function fetchEmpresas() {
  const response = await fetch(buildServerBackendUrl("usuarios/Empresas/"), {
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
    <div className="container py-4">
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
