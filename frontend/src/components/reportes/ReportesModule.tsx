"use client";

import React, { useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";

type ReportRow = Record<string, unknown>;

type ReportesData = {
  movimientos_ingresos: ReportRow[];
  informe_ventas: ReportRow[];
  informe_cartera: ReportRow[];
};

type ReportKey = keyof ReportesData;

type ReportDefinition = {
  key: ReportKey;
  label: string;
  description: string;
  filename: string;
  columns: Array<{
    field: string;
    header: string;
    body: (row: ReportRow) => React.ReactNode;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
});

const formatCurrency = (value: unknown) => currencyFormatter.format(Number(value || 0));

const formatDate = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-CO");
};

const formatText = (value: unknown) => (value == null || value === "" ? "-" : String(value));

const exportRowsToExcel = (
  rows: ReportRow[],
  columns: ReportDefinition["columns"],
  filename: string
) => {
  const headers = columns.map((column) => column.header);
  const body = rows.map((row) =>
    columns.map((column) => {
      const rawValue = row[column.field];
      return formatText(rawValue).replace(/\t/g, " ").replace(/\n/g, " ");
    })
  );

  const content = [headers, ...body]
    .map((line) => line.join("\t"))
    .join("\n");

  const blob = new Blob(["\ufeff" + content], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(url);
};

function ReportesModule({
  data,
  fetchError,
}: {
  data: ReportesData;
  fetchError: string | null;
}) {
  const [activeReport, setActiveReport] = useState<ReportKey>("movimientos_ingresos");
  const [filters, setFilters] = useState<Record<ReportKey, string>>({
    movimientos_ingresos: "",
    informe_ventas: "",
    informe_cartera: "",
  });

  const reportDefinitions = useMemo<Record<ReportKey, ReportDefinition>>(
    () => ({
      movimientos_ingresos: {
        key: "movimientos_ingresos",
        label: "Movimientos de ingresos",
        description: "Registro de abonos recibidos por venta y medio de pago.",
        filename: "movimientos_ingresos",
        columns: [
          { field: "id", header: "Abono" },
          { field: "venta_id", header: "Venta" },
          { field: "cliente", header: "Cliente" },
          { field: "medio_pago", header: "Medio de pago" },
          { field: "tipo_abono", header: "Tipo" },
          { field: "fecha", header: "Fecha", body: (row) => formatDate(row.fecha) },
          { field: "precio", header: "Valor", body: (row) => formatCurrency(row.precio) },
        ],
      },
      informe_ventas: {
        key: "informe_ventas",
        label: "Informe de ventas",
        description: "Vista consolidada de ventas, abonos, saldo y estados.",
        filename: "informe_ventas",
        columns: [
          { field: "id", header: "Venta" },
          { field: "fecha", header: "Fecha", body: (row) => formatDate(row.fecha) },
          { field: "cliente", header: "Cliente" },
          { field: "empresa", header: "Empresa" },
          { field: "vendedor", header: "Vendedor" },
          { field: "precio", header: "Total", body: (row) => formatCurrency(row.precio) },
          { field: "totalAbono", header: "Abonado", body: (row) => formatCurrency(row.totalAbono) },
          { field: "saldo", header: "Saldo", body: (row) => formatCurrency(row.saldo) },
          { field: "estado_pago", header: "Estado pago" },
          { field: "estado_pedido", header: "Estado pedido" },
        ],
      },
      informe_cartera: {
        key: "informe_cartera",
        label: "Informe de cartera",
        description: "Ventas con saldo pendiente y vencimientos asociados.",
        filename: "informe_cartera",
        columns: [
          { field: "venta_id", header: "Venta" },
          { field: "fecha", header: "Fecha", body: (row) => formatDate(row.fecha) },
          { field: "cliente", header: "Cliente" },
          { field: "empresa", header: "Empresa" },
          { field: "precio", header: "Total", body: (row) => formatCurrency(row.precio) },
          { field: "totalAbono", header: "Abonado", body: (row) => formatCurrency(row.totalAbono) },
          { field: "saldo", header: "Saldo pendiente", body: (row) => formatCurrency(row.saldo) },
          { field: "condicion_pago", header: "Condicion" },
          { field: "cuotas", header: "Cuotas" },
          { field: "fecha_vencimiento", header: "Vencimiento", body: (row) => formatDate(row.fecha_vencimiento) },
        ],
      },
    }),
    []
  );

  const activeDefinition = reportDefinitions[activeReport];
  const activeRows = data[activeReport] ?? [];
  const activeFilter = filters[activeReport];

  const filteredRows = useMemo(() => {
    if (!activeFilter.trim()) return activeRows;
    const needle = activeFilter.toLowerCase();
    return activeRows.filter((row) =>
      Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle))
    );
  }, [activeFilter, activeRows]);

  const totalAmount = useMemo(() => {
    const field = activeReport === "movimientos_ingresos" ? "precio" : activeReport === "informe_ventas" ? "precio" : "saldo";
    return filteredRows.reduce((acc, row) => acc + Number(row[field] || 0), 0);
  }, [activeReport, filteredRows]);

  return (
    <div className="page-shell">
      <div className="ventas-toolbar mb-3">
        <div>
          <h1 className="ventas-page-title mb-1">Reportes</h1>
          <p className="text-muted mb-0">
            Consulta consolidada de ingresos, ventas y cartera con exportacion compatible con Excel.
          </p>
        </div>
      </div>

      {fetchError ? (
        <div className="alert alert-warning" role="alert">
          Error cargando reportes: {fetchError}
        </div>
      ) : null}

      <div className="abonos-summary">
        <div className="abonos-summary-card">
          <span className="label">Reporte activo</span>
          <span className="value">{activeDefinition.label}</span>
        </div>
        <div className="abonos-summary-card">
          <span className="label">Registros visibles</span>
          <span className="value">{filteredRows.length}</span>
        </div>
        <div className="abonos-summary-card">
          <span className="label">Total relevante</span>
          <span className="value">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div className="abonos-payment-badges">
        {Object.values(reportDefinitions).map((report) => (
          <button
            key={report.key}
            type="button"
            className={`abonos-payment-badge ${activeReport === report.key ? "is-active" : ""}`}
            onClick={() => setActiveReport(report.key)}
          >
            <span className="method">{report.label}</span>
          </button>
        ))}
      </div>

      <div className="ventas-card">
        <div className="abonos-header d-flex w-100 justify-content-between align-items-center gap-2 flex-wrap mb-3">
          <div className="d-flex flex-column">
            <span className="fw-semibold">{activeDefinition.label}</span>
            <span className="text-muted small">{activeDefinition.description}</span>
          </div>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <span className="p-input-icon-left abonos-search">
              <i className="pi pi-search" />
              <InputText
                value={activeFilter}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, [activeReport]: event.target.value }))
                }
                placeholder="Filtrar reporte..."
              />
            </span>
            <button
              type="button"
              className="btn btn-success"
              onClick={() =>
                exportRowsToExcel(filteredRows, activeDefinition.columns, activeDefinition.filename)
              }
            >
              Descargar Excel
            </button>
          </div>
        </div>

        <DataTable
          value={filteredRows}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 50, 100]}
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          sortMode="multiple"
          removableSort
          className="abonos-table p-datatable-sm"
          paginatorTemplate="RowsPerPageDropdown CurrentPageReport PrevPageLink PageLinks NextPageLink"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
          emptyMessage="No hay informacion para este reporte."
        >
          {activeDefinition.columns.map((column) => (
            <Column
              key={column.field}
              field={column.field}
              header={column.header}
              sortable
              body={column.body}
            />
          ))}
        </DataTable>
      </div>
    </div>
  );
}

export default ReportesModule;
