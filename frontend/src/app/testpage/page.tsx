"use client";

import React, { useRef } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "bootstrap/dist/css/bootstrap.min.css";

DataTable.use(DT);

export default function Page() {

const rows = [
  { factura: 1001, cedula: "1032456789", cliente: "Laura Pérez",       precio: "$ 680.000", totalAbono: "$ 100.000", saldo: "$ 580.000", estado: "Anulado" },
  { factura: 1002, cedula: "9876543210", cliente: "Tony Montana",      precio: "$ 340.000", totalAbono: "$  60.000", saldo: "$ 280.000", estado: "Con abono" },
  { factura: 1003, cedula: "1144556677", cliente: "Daniel Valdez",     precio: "$ 300.000", totalAbono: "$  77.000", saldo: "$ 223.000", estado: "Con abono" },
  { factura: 1004, cedula: "1098765432", cliente: "Daniel Salazar",    precio: "$ 560.000", totalAbono: "$ 120.000", saldo: "$ 440.000", estado: "Sin Pago" },
  { factura: 1005, cedula: "1098765432", cliente: "Daniel Salazar",    precio: "$ 700.000", totalAbono: "$   0",     saldo: "$ 700.000", estado: "Sin Pago" },
  { factura: 1006, cedula: "1098765432", cliente: "Daniel Salazar",    precio: "$ 400.000", totalAbono: "$   0",     saldo: "$ 400.000", estado: "Sin Pago" },
  { factura: 1007, cedula: "1144556677", cliente: "Daniel Valdez",     precio: "$ 340.000", totalAbono: "$   0",     saldo: "$ 340.000", estado: "Sin Pago" },
  { factura: 1008, cedula: "1098765432", cliente: "Daniel Salazar",    precio: "$ 340.000", totalAbono: "$   0",     saldo: "$ 340.000", estado: "Sin Pago" },
  { factura: 1009, cedula: "9876543210", cliente: "Tony Montana",      precio: "$ 360.000", totalAbono: "$ 109.000", saldo: "$ 251.000", estado: "Con abono" },
  { factura: 1010, cedula: "9876543210", cliente: "Tony Montana",      precio: "$ 280.000", totalAbono: "$   0",     saldo: "$ 280.000", estado: "Sin Pago" },
  { factura: 1011, cedula: "1030030030", cliente: "María Gómez",       precio: "$ 520.000", totalAbono: "$ 520.000", saldo: "$   0",     estado: "Pagado" },
  { factura: 1012, cedula: "1010101010", cliente: "Juan Rodríguez",    precio: "$ 250.000", totalAbono: "$   0",     saldo: "$ 250.000", estado: "Sin Pago" },
  { factura: 1013, cedula: "1022334455", cliente: "Ana Martínez",      precio: "$ 150.000", totalAbono: "$  50.000", saldo: "$ 100.000", estado: "Con abono" },
  { factura: 1014, cedula: "1045678901", cliente: "Carlos Herrera",    precio: "$ 900.000", totalAbono: "$ 900.000", saldo: "$   0",     estado: "Pagado" },
  { factura: 1015, cedula: "1056789012", cliente: "Sofía Torres",      precio: "$ 430.000", totalAbono: "$   0",     saldo: "$ 430.000", estado: "Sin Pago" },
  { factura: 1016, cedula: "1067890123", cliente: "Pedro Díaz",        precio: "$ 300.000", totalAbono: "$ 100.000", saldo: "$ 200.000", estado: "Con abono" },
  { factura: 1017, cedula: "1078901234", cliente: "Camila Rojas",      precio: "$ 760.000", totalAbono: "$ 760.000", saldo: "$   0",     estado: "Pagado" },
  { factura: 1018, cedula: "1089012345", cliente: "Andrés Castillo",   precio: "$ 610.000", totalAbono: "$   0",     saldo: "$ 610.000", estado: "Sin Pago" },
  { factura: 1019, cedula: "1090123456", cliente: "Valentina López",   precio: "$ 275.000", totalAbono: "$  75.000", saldo: "$ 200.000", estado: "Con abono" },
  { factura: 1020, cedula: "1101234567", cliente: "Felipe Ramírez",    precio: "$ 820.000", totalAbono: "$   0",     saldo: "$ 820.000", estado: "Anulado" }
];

  const ref = useRef<any>(null);

  // IMPORTANTE: da un "name" a la columna que vas a filtrar
  const columns = [
    { title: "Factura", data: "factura" },
    { title: "Cédula", data: "cedula" },
    { title: "Cliente", data: "cliente" },
    { title: "Precio", data: "precio" },
    { title: "Abono", data: "totalAbono" },
    { title: "Saldo", data: "saldo" },
    { title: "Estado", data: "estado", name: "estado" }, // 👈 filtraremos por aquí
    { title: "Acciones", data: null, defaultContent: "" },
  ];

  /**
   * column().search(input, regex?, smart?, caseInsensitive?)
   *  - input: string o regex
   *  - regex: interpreta 'input' como regex (true/false)
   *  - smart: "búsqueda inteligente" (true/false)
   *  - caseInsensitive: ignora mayúsculas/minúsculas (true/false)
   */
  const setEstado = (expr: string, regex = true, smart = false, ci = true) => {
    const dt = ref.current?.dt();
    if (!dt) return;
    dt.column("estado:name").search(expr, regex, smart, ci).draw();
  };

  // Ejemplos de botones (frontend filtering)
  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button className="btn btn-secondary" onClick={() => setEstado("", false)}>
          Todos
        </button>
        <button className="btn btn-info" onClick={() => setEstado("^Con abono$", true, false, true)}>
          Con abono
        </button>
        <button className="btn btn-warning" onClick={() => setEstado("^Sin Pago$", true, false, true)}>
          Sin pago
        </button>
        <button className="btn btn-success" onClick={() => setEstado("^Pagado$", true, false, true)}>
          Pagado
        </button>
        <button className="btn btn-danger" onClick={() => setEstado("^Anulado$", true, false, true)}>
          Anulado
        </button>
        <button className="btn btn-primary" onClick={() => setEstado("^(?!Anulado$).*", true, false, true)}>
          No anulados
        </button>
      </div>

      <DataTable
        ref={ref}
        data={rows}
        columns={columns}
        options={{ order: [[0, "desc"]] }}
      />
    </>
  );
}
