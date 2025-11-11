import React from "react";
import JornadasModule from "@/components/jornadas/JornadasModule";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/").replace(/\/?$/, "/");

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE}${normalizedPath}`;
};

async function fetchJornadas() {
  const response = await fetch(buildUrl("jornadas/"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible cargar las jornadas.");
  }

  return response.json();
}

async function fetchEmpresas() {
  const response = await fetch(buildUrl("usuarios/Empresas/"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible cargar las empresas.");
  }

  const data = await response.json();
  return data?.empresas ?? [];
}

async function JornadasPage() {
  const [jornadas, empresas] = await Promise.all([fetchJornadas(), fetchEmpresas()]);

  return (
    <div className="container py-4">
      <JornadasModule initialJornadas={jornadas} empresas={empresas} />
    </div>
  );
}

export default JornadasPage;
