"use client";

import React, { useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";

type SaldoRow = {
  venta_id: number;
  fecha: string;
  cliente: string;
  empresa: string;
  precio: number;
  totalAbono: number;
  saldo: number;
  fecha_vencimiento: string | null;
  condicion_pago: string | null;
  cuotas: number | null;
  estado_pago: string | null;
};

type FilterKey = "todos" | "con_vencimiento" | "vencidos" | "sin_vencimiento";

type FilterDefinition = {
  key: FilterKey;
  label: string;
  description: string;
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

const normalize = (value: unknown) => String(value ?? "").toLowerCase().trim();
const formatText = (value: unknown) => (value == null || value === "" ? "-" : String(value));

const exportRowsToExcel = (rows: SaldoRow[]) => {
  const headers = [
    "Venta",
    "Fecha",
    "Cliente",
    "Empresa",
    "Total",
    "Abonado",
    "Saldo pendiente",
    "Condicion",
    "Cuotas",
    "Vencimiento",
    "Estado pago",
  ];

  const body = rows.map((row) => [
    formatText(row.venta_id),
    formatText(row.fecha),
    formatText(row.cliente),
    formatText(row.empresa),
    formatText(row.precio),
    formatText(row.totalAbono),
    formatText(row.saldo),
    formatText(row.condicion_pago),
    formatText(row.cuotas),
    formatText(row.fecha_vencimiento),
    formatText(row.estado_pago),
  ]);

  const content = [headers, ...body].map((line) => line.join("\t")).join("\n");
  const blob = new Blob(["\ufeff" + content], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "saldos_pendientes.xls";
  link.click();
  URL.revokeObjectURL(url);
};

const isOverdue = (value: unknown) => {
  if (!value) return false;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

function SaldosModule({
  rows,
  fetchError,
}: {
  rows: SaldoRow[];
  fetchError: string | null;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState<FilterKey>("todos");

  const filterDefinitions: FilterDefinition[] = [
    { key: "todos", label: "Todos", description: "Muestra toda la cartera pendiente." },
    {
      key: "con_vencimiento",
      label: "Con vencimiento",
      description: "Solo ventas con fecha de vencimiento.",
    },
    {
      key: "vencidos",
      label: "Vencidos",
      description: "Saldos cuya fecha ya vencio.",
    },
    {
      key: "sin_vencimiento",
      label: "Sin vencimiento",
      description: "Ventas sin fecha limite configurada.",
    },
  ];

  const activeFilterDefinition =
    filterDefinitions.find((item) => item.key === conditionFilter) - filterDefinitions[0];

  const filteredRows = useMemo(() => {
    return (rows ?? []).filter((row) => {
      if (conditionFilter !== "todos") {
        if (conditionFilter === "con_vencimiento" && !row.fecha_vencimiento) return false;
        if (conditionFilter === "vencidos" && !isOverdue(row.fecha_vencimiento)) return false;
        if (conditionFilter === "sin_vencimiento" && row.fecha_vencimiento) return false;
      }

      if (!globalFilter.trim()) return true;
      const term = normalize(globalFilter);
      return [
        row.venta_id,
        row.fecha,
        row.cliente,
        row.empresa,
        row.precio,
        row.totalAbono,
        row.saldo,
        row.fecha_vencimiento,
        row.condicion_pago,
        row.cuotas,
        row.estado_pago,
      ]
        .map(normalize)
        .some((value) => value.includes(term));
    });
  }, [rows, globalFilter, conditionFilter]);

  const summary = useMemo(() => {
    const totalSaldo = filteredRows.reduce((acc, row) => acc + Number(row.saldo || 0), 0);
    const totalVentas = filteredRows.length;
    const vencidas = filteredRows.filter((row) => isOverdue(row.fecha_vencimiento)).length;
    return { totalSaldo, totalVentas, vencidas };
  }, [filteredRows]);

  const countsByFilter = useMemo<Record<FilterKey, number>>(() => {
    const sourceRows = rows ?? [];
    return {
      todos: sourceRows.length,
      con_vencimiento: sourceRows.filter((row) => Boolean(row.fecha_vencimiento)).length,
      vencidos: sourceRows.filter((row) => isOverdue(row.fecha_vencimiento)).length,
      sin_vencimiento: sourceRows.filter((row) => !row.fecha_vencimiento).length,
    };
  }, [rows]);

  return (
    <div className="page-shell page-shell-narrow">
      <div className="ventas-toolbar mb-3">
        <div>
          <h1 className="ventas-page-title mb-1">Saldos pendientes</h1>
          <p className="text-muted mb-0">
            Consulta consolidada de cartera pendiente, abonos acumulados y vencimientos.
          </p>
        </div>
      </div>

      {fetchError ? (
        <div className="alert alert-warning" role="alert">
          Error cargando saldos: {fetchError}
        </div>
      ) : null}

      <div className="abonos-summary">
        <div className="abonos-summary-card">
          <span className="label">Vista activa</span>
          <span className="value">{activeFilterDefinition.label}</span>
        </div>
        <div className="abonos-summary-card">
          <span className="label">Registros visibles</span>
          <span className="value">{summary.totalVentas}</span>
        </div>
        <div className="abonos-summary-card">
          <span className="label">Total relevante</span>
          <span className="value">
            {conditionFilter === "vencidos"
                ? `${summary.vencidas} registro(s)`
              : formatCurrency(summary.totalSaldo)}
          </span>
        </div>
      </div>

      <div className="abonos-payment-badges">
        {filterDefinitions.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`abonos-payment-badge ${conditionFilter === filter.key ? "is-active" : ""}`}
            onClick={() => setConditionFilter(filter.key)}
          >
            <span className="method">{filter.label}</span>
            <span className="amount">{countsByFilter[filter.key]}</span>
          </button>
        ))}
      </div>

      <div className="ventas-card">
        <div className="abonos-header d-flex w-100 justify-content-between align-items-center gap-2 flex-wrap mb-3">
          <div className="d-flex flex-column">
            <span className="fw-semibold">{activeFilterDefinition.label}</span>
            <span className="text-muted small">
              {activeFilterDefinition.description}
              {conditionFilter === "vencidos" ? " Revisa estos saldos para priorizar cobro." : ""}
            </span>
          </div>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <span className="p-input-icon-left abonos-search">
              <i className="pi pi-search" />
              <InputText
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder="Filtrar reporte..."
              />
            </span>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => exportRowsToExcel(filteredRows)}
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
          emptyMessage="No hay saldos pendientes para los filtros seleccionados."
        >
          <Column
            field="venta_id"
            header="Venta"
            sortable
            body={(row: SaldoRow) => <span className="fw-semibold">#{row.venta_id}</span>}
          />
          <Column
            field="fecha"
            header="Fecha"
            sortable
            body={(row: SaldoRow) => formatDate(row.fecha)}
          />
          <Column field="cliente" header="Cliente" sortable />
          <Column field="empresa" header="Empresa" sortable />
          <Column
            field="precio"
            header="Total"
            sortable
            body={(row: SaldoRow) => formatCurrency(row.precio)}
          />
          <Column
            field="totalAbono"
            header="Abonado"
            sortable
            body={(row: SaldoRow) => formatCurrency(row.totalAbono)}
          />
          <Column
            field="saldo"
            header="Saldo pendiente"
            sortable
            body={(row: SaldoRow) => (
              <span className="fw-semibold text-danger">{formatCurrency(row.saldo)}</span>
            )}
          />
          <Column
            field="condicion_pago"
            header="Condicion"
            sortable
            body={(row: SaldoRow) => row.condicion_pago || "-"}
          />
          <Column
            field="cuotas"
            header="Cuotas"
            sortable
            body={(row: SaldoRow) => row.cuotas || "-"}
          />
          <Column
            field="fecha_vencimiento"
            header="Vencimiento"
            sortable
            body={(row: SaldoRow) => {
              if (!row.fecha_vencimiento) return <span className="text-muted">-</span>;
              const overdue = isOverdue(row.fecha_vencimiento);
              return (
                <span className={`badge ${overdue ? "bg-danger" : "bg-primary"} badge-estado-pedido`}>
                  {formatDate(row.fecha_vencimiento)}
                </span>
              );
            }}
          />
          <Column
            field="estado_pago"
            header="Estado pago"
            sortable
            body={(row: SaldoRow) => {
              const estado = normalize(row.estado_pago);
              const badge =
                estado === "pagado"
                  ? "bg-success"
                  : estado === "con abono"
                    ? "bg-info text-dark"
                    : "bg-warning text-dark";
              return (
                <span className={`badge ${badge} badge-estado-pedido`}>
                  {row.estado_pago || "Sin pago"}
                </span>
              );
            }}
          />
        </DataTable>
      </div>
    </div>
  );
}

export default SaldosModule;
