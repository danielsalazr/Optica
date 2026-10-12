'use client';

import type { ReactNode } from 'react';
import { Paginator, type PaginatorPageChangeEvent } from 'primereact/paginator';
import { Tag } from 'primereact/tag';

type Remission = {
  id: number; venta: number; clienteNombre: string; clienteCedula: string; empresaCliente: string;
  fechaFormateada: string; anulado?: boolean; cantidadRemitida: number; totalRemision: number;
};
type Props<T extends Remission> = {
  remissions: T[]; first: number; rows: number; printing: boolean;
  expanded: Record<string, boolean> | null;
  onPage: (event: PaginatorPageChangeEvent) => void;
  onExpand: (row: T) => void;
  onPrint: (row: T) => void;
  formatMoney: (value: number) => string;
  renderDetail: (row: T) => ReactNode;
};

export default function RemisionesMobileList<T extends Remission>(props: Props<T>) {
  const paginator = <Paginator first={props.first} rows={props.rows} totalRecords={props.remissions.length}
    rowsPerPageOptions={[5, 10, 20, 50, 100]} onPageChange={props.onPage}
    template="RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink NextPageLink LastPageLink"
    currentPageReportTemplate="{first} a {last} de {totalRecords}" />;

  return <div className="remisiones-mobile-list">
    {!props.remissions.length && <p className="text-muted text-center py-4" role="status">No se encontraron remisiones.</p>}
    {props.remissions.slice(props.first, props.first + props.rows).map(row => {
      const expanded = Boolean(props.expanded?.[row.id]);
      return <article key={row.id} className="remisiones-mobile-card" aria-label={`Remision ${row.id}`}>
        <div className="remisiones-mobile-card-heading">
          <strong>Remision #{row.id}</strong>
          <Tag value={row.anulado ? 'Anulada' : 'Activa'} severity={row.anulado ? 'danger' : 'success'} rounded />
        </div>
        <h2>{row.clienteNombre}</h2>
        <p className="remisiones-mobile-secondary">{row.clienteCedula} | {row.empresaCliente}</p>
        <div className="remisiones-mobile-meta"><span>Venta #{row.venta}</span><span>{row.fechaFormateada}</span></div>
        <div className="remisiones-mobile-amounts">
          <div><span>Unidades remitidas</span><strong>{row.cantidadRemitida}</strong></div>
          <div><span>Total remision</span><strong>{props.formatMoney(row.totalRemision)}</strong></div>
        </div>
        <div className="remisiones-mobile-actions">
          <button type="button" className="btn btn-outline-primary rounded-pill" aria-expanded={expanded}
            aria-controls={`remision-mobile-detail-${row.id}`} onClick={() => props.onExpand(row)}>
            {expanded ? 'Cerrar detalle' : 'Ver detalle'} <i className={`pi pi-chevron-${expanded ? 'up' : 'down'}`} aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-primary rounded-pill" disabled={props.printing} onClick={() => props.onPrint(row)}>
            <i className="pi pi-print" aria-hidden="true" /> {props.printing ? 'Imprimiendo...' : 'Imprimir ticket'}
          </button>
        </div>
        {expanded && <div id={`remision-mobile-detail-${row.id}`} className="remisiones-mobile-detail">{props.renderDetail(row)}</div>}
      </article>;
    })}
    {paginator}
  </div>;
}
