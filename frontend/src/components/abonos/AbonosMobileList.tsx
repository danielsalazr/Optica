'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

type PaymentRow = {
  id: string | number;
  idLabel: string;
  facturaLabel: string;
  clienteLabel: string;
  cedulaLabel: string;
  metodoPagoLabel: string;
  fechaLabel: string;
  fechaRegistroLabel: string;
  precioLabel: string;
  isAbonoMasivo: boolean;
  descripcion: string | null;
};

type MassiveRow = {
  id: number;
  tipo: string;
  nombre_objetivo: string | null;
  empresa: string | null;
  cliente: string | null;
  jornada: number | null;
  fecha_abono: string | null;
  cantidad_ventas: number;
  cantidad_abonos: number;
  total: number;
};

type DetailItem = {
  id: number;
  venta_id: number;
  cliente_nombre: string | null;
  cliente_id: number;
  precio: number;
  fecha: string;
  fecha_registro?: string;
  medioDePago: string | null;
  descripcion: string | null;
};

type Props = {
  rows?: PaymentRow[];
  massiveRows?: MassiveRow[];
  detailItems?: DetailItem[];
  onEdit?: (row: PaymentRow) => void;
  onDelete?: (row: PaymentRow) => void;
  onMassiveDetail?: (row: PaymentRow) => void;
  formatDate?: (date: unknown) => string;
  expandedRows?: Record<string, boolean> | null;
  onToggleMassive?: (row: MassiveRow) => void;
  renderMassiveDetail?: (row: MassiveRow) => ReactNode;
};

const money = (value: number) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(value) || 0);

export default function AbonosMobileList({
  rows, massiveRows, detailItems, onEdit, onDelete, onMassiveDetail,
  formatDate = () => '-', expandedRows, onToggleMassive, renderMassiveDetail,
}: Props) {
  const { can } = useAuth();
  if (!(rows ?? massiveRows ?? detailItems ?? []).length) {
    return <p className="abonos-empty" role="status">No se encontraron abonos{massiveRows ? ' masivos' : ''}.</p>;
  }

  return <div className="abonos-mobile-list">
    {rows?.map(row => <article key={row.id} className="abonos-mobile-card">
      <header><span className="abonos-record-id">Abono {row.idLabel}</span><strong className="abonos-mobile-amount">{row.precioLabel}</strong></header>
      <h2>{row.clienteLabel}</h2>
      <p className="abonos-mobile-meta">{row.cedulaLabel} - Venta {row.facturaLabel}</p>
      <div className="abonos-mobile-facts"><span><i className="pi pi-calendar" aria-hidden="true" /> {row.fechaLabel}</span><span>{row.metodoPagoLabel}</span></div>
      <footer>
        {row.isAbonoMasivo ? <button type="button" className="abonos-mobile-origin" onClick={() => onMassiveDetail?.(row)}>Ver abono masivo <i className="pi pi-external-link" aria-hidden="true" /></button> : <span className="abonos-mobile-origin">Individual</span>}
        <div className="abonos-mobile-actions">
          {can('change_abonos') && <button type="button" className="btn btn-outline-primary" aria-label={`Editar abono ${row.idLabel}`} onClick={() => onEdit?.(row)}><i className="pi pi-pencil" aria-hidden="true" /></button>}
          {can('delete_abonos') && <button type="button" className="btn btn-outline-danger" aria-label={`Eliminar abono ${row.idLabel}`} onClick={() => onDelete?.(row)}><i className="pi pi-trash" aria-hidden="true" /></button>}
        </div>
      </footer>
      <details><summary>Detalles del abono</summary><dl><dt>Fecha de registro</dt><dd>{row.fechaRegistroLabel}</dd><dt>Observaciones</dt><dd>{row.descripcion || 'Sin observaciones'}</dd></dl></details>
    </article>)}
    {massiveRows?.map(row => <article key={row.id} className="abonos-mobile-card">
      <header><span className="abonos-record-id">Lote #{row.id}</span><strong className="abonos-mobile-amount">{money(row.total)}</strong></header>
      <h2>{row.nombre_objetivo || row.empresa || row.cliente || (row.jornada ? `Jornada #${row.jornada}` : 'Sin objetivo')}</h2>
      <p className="abonos-mobile-meta">{row.tipo} - {formatDate(row.fecha_abono)}</p>
      <div className="abonos-mobile-facts"><span>{row.cantidad_ventas || 0} ventas</span><span>{row.cantidad_abonos || 0} abonos</span></div>
      <button type="button" className="abonos-mobile-expand" aria-expanded={!!expandedRows?.[row.id]} aria-controls={`abonos-lote-${row.id}`} onClick={() => onToggleMassive?.(row)}>
        {expandedRows?.[row.id] ? 'Ocultar ventas' : 'Ver ventas del lote'} <i className={`pi pi-chevron-${expandedRows?.[row.id] ? 'up' : 'down'}`} aria-hidden="true" />
      </button>
      {expandedRows?.[row.id] ? <div id={`abonos-lote-${row.id}`}>{renderMassiveDetail?.(row)}</div> : null}
    </article>)}
    {detailItems?.map(item => <article key={item.id} className="abonos-mobile-card">
      <header><span className="abonos-record-id">Abono #{item.id}</span><strong className="abonos-mobile-amount">{money(item.precio)}</strong></header>
      <h2>{item.cliente_nombre || item.cliente_id || 'Sin cliente'}</h2>
      <dl><dt>Venta</dt><dd>#{item.venta_id || '-'}</dd><dt>Medio de pago</dt><dd>{item.medioDePago || '-'}</dd><dt>Fecha abono</dt><dd>{formatDate(item.fecha)}</dd><dt>Fecha registro</dt><dd>{formatDate(item.fecha_registro)}</dd><dt>Observaciones</dt><dd>{item.descripcion || 'Sin observaciones'}</dd></dl>
      {item.venta_id ? <Link href={`/ventas/${item.venta_id}`} className="btn btn-outline-primary">Ver venta</Link> : null}
    </article>)}
  </div>;
}
