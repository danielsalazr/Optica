"use client";

import React, { useMemo, useState } from "react";
import { DataTable, type DataTableExpandedRows } from "primereact/datatable";
import { useTablePagination } from '@/hooks/useTablePagination';
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { callApi } from '@/utils/js/api';
import { balanceDate, dateOnly, overdue, safeCsvCell } from '@/utils/balances';
import '@/styles/saldos-workspace.css';

type SaldoRow = {
  venta_id: number;
  fecha: string;
  cliente: string;
  cliente_id: number | string;
  jornada_id: number | null;
  jornada: string | null;
  fecha_creacion: string | null;
  fecha_inicio: string | null;
  empresa: string;
  precio: number;
  totalAbono: number;
  saldo: number;
  fecha_vencimiento: string | null;
  condicion_pago: string | null;
  cuotas: number | null;
  estado_pago: string | null;
};

type SaleDetail = {
  detalle: string | null;
  articulos: Array<{ id: number; articulo__nombre: string; cantidad: number; precio_articulo: number; totalArticulo: number }>;
  abonos: Array<{ id: number; precio: number; fecha_abono: string | null; descripcion: string | null; medioDePago__nombre: string; abono_masivo_id: number | null }>;
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

  const content = [headers, ...body].map((line) => line.map(safeCsvCell).join(";")).join("\r\n");
  const blob = new Blob(["\ufeff" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "saldos_pendientes.csv";
  link.click();
  URL.revokeObjectURL(url);
};

function SaldosModule({
  rows,
  fetchError,
  referenceDate,
}: {
  rows: SaldoRow[];
  fetchError: string | null;
  referenceDate: string | null;
}) {
  const { can } = useAuth();
  const isOverdue = (value: unknown) => overdue(value, referenceDate);
  const [companyFilter, setCompanyFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>({});
  const [details, setDetails] = useState<Record<number, SaleDetail>>({});
  const [detailErrors, setDetailErrors] = useState<Record<number, string>>({});
  const [detailLoading, setDetailLoading] = useState<Record<number, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const pagination = useTablePagination('saldos', 10, [10, 20, 50, 100]);
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
    filterDefinitions.find((item) => item.key === conditionFilter) ?? filterDefinitions[0];

  const contextRows = useMemo(() => {
    return (rows ?? []).filter((row) => {
      if (companyFilter && row.empresa !== companyFilter) return false;
      if (dayFilter && String(row.jornada_id) !== dayFilter) return false;
      if (!globalFilter.trim()) return true;
      const term = normalize(globalFilter);
      return [
        row.venta_id,
        row.fecha,
        row.cliente,
        row.cliente_id,
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
  }, [rows, globalFilter, companyFilter, dayFilter]);

  const filteredRows = useMemo(() => contextRows.filter((row) => {
    if (conditionFilter === 'con_vencimiento') return !!dateOnly(row.fecha_vencimiento);
    if (conditionFilter === 'sin_vencimiento') return !dateOnly(row.fecha_vencimiento);
    if (conditionFilter === 'vencidos') return overdue(row.fecha_vencimiento, referenceDate);
    return true;
  }), [contextRows, conditionFilter, referenceDate]);

  const summary = useMemo(() => {
    const totalSaldo = filteredRows.reduce((acc, row) => acc + Number(row.saldo || 0), 0);
    const totalVentas = filteredRows.length;
    const vencidas = filteredRows.filter((row) => isOverdue(row.fecha_vencimiento)).length;
    const vencido = filteredRows.filter((row) => isOverdue(row.fecha_vencimiento)).reduce((sum, row) => sum + Number(row.saldo || 0), 0);
    const sinVencimiento = filteredRows.filter((row) => !dateOnly(row.fecha_vencimiento)).reduce((sum, row) => sum + Number(row.saldo || 0), 0);
    return { totalSaldo, totalVentas, vencidas, vencido, sinVencimiento, porVencer: totalSaldo - vencido - sinVencimiento };
  }, [filteredRows, referenceDate]);

  const countsByFilter = useMemo<Record<FilterKey, number>>(() => {
    const sourceRows = contextRows;
    return {
      todos: sourceRows.length,
      con_vencimiento: sourceRows.filter((row) => Boolean(dateOnly(row.fecha_vencimiento))).length,
      vencidos: sourceRows.filter((row) => isOverdue(row.fecha_vencimiento)).length,
      sin_vencimiento: sourceRows.filter((row) => !dateOnly(row.fecha_vencimiento)).length,
    };
  }, [contextRows, referenceDate]);

  const loadDetail = async (row: SaldoRow) => {
    if (details[row.venta_id] || detailLoading[row.venta_id]) return;
    setDetailLoading((prev) => ({ ...prev, [row.venta_id]: true }));
    setDetailErrors((prev) => ({ ...prev, [row.venta_id]: '' }));
    try {
      const { res, data } = await callApi(`saldos/${row.venta_id}/`);
      if (!res.ok) throw new Error('No se pudo consultar el detalle de la venta.');
      setDetails((prev) => ({ ...prev, [row.venta_id]: data }));
    } catch {
      setDetailErrors((prev) => ({ ...prev, [row.venta_id]: 'No se pudo consultar el detalle. Intenta nuevamente.' }));
    } finally {
      setDetailLoading((prev) => ({ ...prev, [row.venta_id]: false }));
    }
  };
  const renderDetail = (row: SaldoRow) => {
    const detail = details[row.venta_id];
    return <div className="saldos-detail">
      <div className="saldos-detail-dates">
        <span><strong>Creacion:</strong> {balanceDate(row.fecha_creacion)}</span>
        <span><strong>Fecha de venta:</strong> {balanceDate(row.fecha)}</span>
        <span><strong>Inicio de pago:</strong> {balanceDate(row.fecha_inicio)}</span>
        <span><strong>Vencimiento de venta:</strong> {balanceDate(row.fecha_vencimiento)}</span>
        <span><strong>Condicion:</strong> {row.condicion_pago || 'Sin indicar'} - {row.cuotas || '-'} cuotas</span>
        <span><strong>Jornada:</strong> {row.jornada || 'Sin jornada'}</span>
      </div>
      {can('change_ventas') && <Link href={`/ventas/${row.venta_id}`} className="saldos-sale-link">Abrir venta</Link>}
      {detailLoading[row.venta_id] && <p role="status">Consultando detalle...</p>}
      {detailErrors[row.venta_id] && <div role="alert">{detailErrors[row.venta_id]} <Button label="Reintentar" text onClick={() => loadDetail(row)} /></div>}
      {detail && <div className="saldos-detail-columns">
        <section><h3>Articulos</h3>{detail.detalle && <p>{detail.detalle}</p>}
          {detail.articulos.map((item) => <p key={item.id}><strong>{item.articulo__nombre}</strong><br />
            Cant. {item.cantidad} - Unit. {formatCurrency(item.precio_articulo)} - Total {formatCurrency(item.totalArticulo)}</p>)}
          {!detail.articulos.length && <p>Sin articulos registrados.</p>}
        </section>
        <section><h3>Historial de abonos</h3>{detail.abonos.map((item) => <p key={item.id}>
          <strong>{formatCurrency(item.precio)}</strong> - {balanceDate(item.fecha_abono)}<br />
          {item.medioDePago__nombre}{item.abono_masivo_id ? ` - Masivo #${item.abono_masivo_id}` : ''}
          {item.descripcion && <span className="d-block">{item.descripcion}</span>}
        </p>)}{!detail.abonos.length && <p>Sin abonos registrados.</p>}</section>
      </div>}
    </div>;
  };
  const toggleDetail = (row: SaldoRow) => {
    setExpandedRows((prev) => ({ ...prev, [row.venta_id]: !prev[row.venta_id] }));
    loadDetail(row);
  };
  const companies = [...new Set(rows.map((row) => row.empresa).filter(Boolean))].sort();
  const days = [...new Map(rows.filter((row) => row.jornada_id).map((row) => [String(row.jornada_id), row.jornada])).entries()];
  const dueLabel = (row: SaldoRow) => !dateOnly(row.fecha_vencimiento) ? 'Sin vencimiento' : isOverdue(row.fecha_vencimiento) ? 'Vencido' : 'Por vencer';

  return (
    <div className="page-shell saldos-page">
      <div className="ventas-toolbar saldos-toolbar">
        <div>
          <h1 className="ventas-page-title mb-1">Saldos pendientes</h1>
          <span className="text-muted small">Cartera pendiente por venta</span>
          <Button icon="pi pi-question-circle" text rounded aria-label="Informacion sobre saldos"
            tooltip="Cartera calculada con los abonos registrados. El vencimiento es la fecha limite de la venta, no de cada cuota."
            tooltipOptions={{ event: 'both', position: 'bottom' }} />
        </div>
        <Button label="Actualizar" icon="pi pi-refresh" size="small" rounded outlined onClick={() => window.location.reload()} />
      </div>

      {fetchError ? (
        <div className="alert alert-warning" role="alert">
          Error cargando saldos: {fetchError}
        </div>
      ) : null}

      <div className="abonos-summary">
        <div className="abonos-summary-card">
          <span className="label">Cartera visible ({summary.totalVentas} ventas)</span>
          <span className="value">{fetchError ? 'No disponible' : formatCurrency(summary.totalSaldo)}</span>
        </div>
        <div className="abonos-summary-card">
          <span className="label">Cartera vencida ({summary.vencidas})</span>
          <span className="value">{fetchError ? 'No disponible' : formatCurrency(summary.vencido)}</span>
        </div>
        <div className="abonos-summary-card">
          <span className="label">Por vencer</span>
          <span className="value">{fetchError ? 'No disponible' : formatCurrency(summary.porVencer)}</span>
        </div>
        <div className="abonos-summary-card"><span className="label">Sin vencimiento</span><span className="value">{fetchError ? 'No disponible' : formatCurrency(summary.sinVencimiento)}</span></div>
      </div>

      <div className="abonos-payment-badges">
        {filterDefinitions.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`abonos-payment-badge ${conditionFilter === filter.key ? "is-active" : ""}`}
            onClick={() => { setConditionFilter(filter.key); pagination.setFirst(0); }}
          >
            <span className="method">{filter.label}</span>
            <span className="amount">{countsByFilter[filter.key]}</span>
          </button>
        ))}
      </div>

      <div className="ventas-card">
        <div className="saldos-controls">
          <label>Empresa<select aria-label="Filtrar por empresa" className="form-select" value={companyFilter} onChange={(e) => { setCompanyFilter(e.target.value); setDayFilter(''); pagination.setFirst(0); }}>
            <option value="">Todas</option>{companies.map((name) => <option key={name}>{name}</option>)}
          </select></label>
          <label>Jornada<select aria-label="Filtrar por jornada" className="form-select" value={dayFilter} onChange={(e) => { setDayFilter(e.target.value); pagination.setFirst(0); }}>
            <option value="">Todas</option>{days.filter(([id]) => !companyFilter || rows.some((row) => String(row.jornada_id) === id && row.empresa === companyFilter)).map(([id, name]) => <option key={id} value={id}>#{id} - {name}</option>)}
          </select></label>
          <label className="saldos-search-control">Buscar
            <span className="p-input-icon-left abonos-search">
              <i className="pi pi-search" />
              <InputText
                value={globalFilter}
              onChange={(event) => { setGlobalFilter(event.target.value); pagination.setFirst(0); }}
                aria-label="Buscar venta, cliente o documento"
                placeholder="Filtrar reporte..."
              />
            </span>
          </label>
            <Button type="button" icon="pi pi-download" label="CSV" rounded outlined size="small" aria-label="Exportar cartera CSV"
              disabled={Boolean(fetchError)}
              onClick={() => exportRowsToExcel(filteredRows)}
            />
        </div>
        <div className="saldos-filter-status">
          <span>{activeFilterDefinition.label}: {filteredRows.length} ventas</span>
          <Button icon="pi pi-info-circle" text rounded size="small" aria-label="Descripcion del filtro activo" tooltip={activeFilterDefinition.description} tooltipOptions={{ event: 'both', position: 'bottom' }} />
        </div>

        <div className="saldos-desktop">
        <DataTable
          value={filteredRows}
          dataKey="venta_id"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data as DataTableExpandedRows)}
          onRowExpand={(e) => loadDetail(e.data as SaldoRow)}
          rowExpansionTemplate={renderDetail}
          paginator
          paginatorPosition="both"
          first={pagination.first}
          rows={pagination.rows}
          onPage={pagination.onPage}
          onValueChange={pagination.onValueChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          sortMode="multiple"
          removableSort
          className="abonos-table p-datatable-sm"
          paginatorTemplate="RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
          emptyMessage={fetchError ? 'No se pudo consultar la cartera.' : 'No hay saldos pendientes para los filtros seleccionados.'}
        >
          <Column expander style={{ width: '2.5rem' }} />
          <Column
            field="venta_id"
            header="Venta"
            sortable
            style={{ width: '8%' }}
            body={(row: SaldoRow) => <div><strong>#{row.venta_id}</strong><small className="saldos-cell-secondary">{balanceDate(row.fecha)}</small></div>}
          />
          <Column field="cliente" header="Cliente / Empresa" sortable style={{ width: '24%' }}
            body={(row: SaldoRow) => <div><strong>{row.cliente || 'Sin nombre'}</strong><small className="saldos-cell-secondary">CC {row.cliente_id}</small><small className="saldos-cell-secondary">{row.empresa}</small></div>} />
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
            header="Saldo"
            sortable
            body={(row: SaldoRow) => (
              <span className="fw-semibold text-danger">{formatCurrency(row.saldo)}</span>
            )}
          />
          <Column field="condicion_pago" header="Pago" sortable style={{ width: '12%' }}
            body={(row: SaldoRow) => <div>{row.condicion_pago || 'Sin indicar'}<small className="saldos-cell-secondary">{row.cuotas || '-'} cuotas / {row.estado_pago || 'Sin pago'}</small></div>} />
          <Column
            field="fecha_vencimiento"
            header="Vencimiento"
            sortable
            body={(row: SaldoRow) => {
              if (!row.fecha_vencimiento) return <span className="text-muted">-</span>;
              const overdue = isOverdue(row.fecha_vencimiento);
              return (
                <span className={`badge ${overdue ? "bg-danger" : "bg-primary"} badge-estado-pedido`}>
                  {balanceDate(row.fecha_vencimiento)}
                </span>
              );
            }}
          />
        </DataTable>
        </div>
        <div className="saldos-mobile">
          <Paginator first={pagination.first} rows={pagination.rows} totalRecords={filteredRows.length}
            rowsPerPageOptions={[10, 20, 50, 100]} onPageChange={(e) => pagination.onPage(e as Parameters<typeof pagination.onPage>[0])}
            template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="{first}-{last} de {totalRecords}" />
          {filteredRows.slice(pagination.first, pagination.first + pagination.rows).map((row) => <article className="saldos-mobile-card" key={row.venta_id}>
            <div className="saldos-mobile-heading"><strong>Venta #{row.venta_id}</strong><span className={isOverdue(row.fecha_vencimiento) ? 'text-danger' : 'text-muted'}>{dueLabel(row)}</span></div>
            <strong>{row.cliente || 'Sin nombre'}</strong><small>Documento: {row.cliente_id} - {row.empresa}</small>
            <div className="saldos-mobile-values"><span>Total<strong>{formatCurrency(row.precio)}</strong></span><span>Abonado<strong>{formatCurrency(row.totalAbono)}</strong></span><span>Saldo<strong className="text-danger">{formatCurrency(row.saldo)}</strong></span></div>
            <small>Vencimiento: {balanceDate(row.fecha_vencimiento)}</small>
            <Button label={expandedRows[row.venta_id] ? 'Ocultar detalle' : 'Ver detalle'} text icon="pi pi-list" onClick={() => toggleDetail(row)} aria-expanded={Boolean(expandedRows[row.venta_id])} />
            {expandedRows[row.venta_id] && renderDetail(row)}
          </article>)}
          {!filteredRows.length && <p>{fetchError ? 'No se pudo consultar la cartera.' : 'No hay saldos pendientes para estos filtros.'}</p>}
          <Paginator first={pagination.first} rows={pagination.rows} totalRecords={filteredRows.length}
            rowsPerPageOptions={[10, 20, 50, 100]} onPageChange={(e) => pagination.onPage(e as Parameters<typeof pagination.onPage>[0])}
            template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="{first}-{last} de {totalRecords}" />
        </div>
      </div>
    </div>
  );
}

export default SaldosModule;
