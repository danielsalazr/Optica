import RemisionesData from "@/components/remisiones/RemisionesData";

async function getRemisiones() {
  const res = await fetch("http://localhost:8000/remisiones/", {
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
    <div className="page-shell">
      <RemisionesData data={remisiones} />
    </div>
  );
}
