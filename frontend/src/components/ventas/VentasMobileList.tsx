'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Paginator, type PaginatorPageChangeEvent } from 'primereact/paginator';

type Sale = { id: number; cliente: string; cedula: string; empresaCliente: string; precio: string; saldo: string; estado: string; estadoPedidoNombre: string };
type Props = {
  sales: Sale[];
  first: number;
  rows: number;
  selected: Sale[];
  expanded: Record<string, boolean> | null;
  onPage: (event: PaginatorPageChangeEvent) => void;
  onSelect: (sale: Sale, selected: boolean) => void;
  onExpand: (sale: Sale) => void;
  onPayment: (sale: Sale) => void;
  onState: (sale: Sale) => void;
  onRemissions: (sale: Sale) => void;
  renderState: (state: string) => ReactNode;
  renderPayment: (state: string) => ReactNode;
  renderDetail: (sale: Sale) => ReactNode;
};

export default function VentasMobileList(props: Props) {
  const { can } = useAuth();
  const paginator = (
    <Paginator first={props.first} rows={props.rows} totalRecords={props.sales.length}
      rowsPerPageOptions={[5, 10, 20, 50]} onPageChange={props.onPage}
      template="RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink NextPageLink LastPageLink"
      currentPageReportTemplate="{first} a {last} de {totalRecords}" />
  );

  return (
    <div className="ventas-mobile-list">
      {!props.sales.length && <p className="ventas-mobile-empty" role="status">No hay ventas que coincidan con los filtros.</p>}
      {props.sales.slice(props.first, props.first + props.rows).map(sale => {
        const expanded = Boolean(props.expanded?.[sale.id]);
        return (
          <article key={sale.id} className="ventas-mobile-card" aria-label={`Pedido ${sale.id}`}>
            <div className="ventas-mobile-card-heading">
              <label className="ventas-mobile-selection">
                <input type="checkbox" checked={props.selected.some(item => item.id === sale.id)}
                  onChange={event => props.onSelect(sale, event.target.checked)} aria-label={`Seleccionar pedido ${sale.id}`} />
                <span>Pedido #{sale.id}</span>
              </label>
              <button type="button" className="ventas-mobile-detail-toggle" aria-expanded={expanded}
                aria-controls={`venta-mobile-detail-${sale.id}`} onClick={() => props.onExpand(sale)}>
                {expanded ? 'Cerrar detalle' : 'Ver detalle'} <i className={`pi pi-chevron-${expanded ? 'up' : 'down'}`} aria-hidden="true" />
              </button>
            </div>
            <h2 className="ventas-mobile-client">{sale.cliente || 'Sin cliente'}</h2>
            <p className="ventas-mobile-document">{sale.cedula || 'Sin documento'}{sale.empresaCliente && ` | ${sale.empresaCliente}`}</p>
            <div className="ventas-mobile-statuses">{props.renderState(sale.estadoPedidoNombre)}{props.renderPayment(sale.estado)}</div>
            <div className="ventas-mobile-amounts">
              <div><span>Total venta</span><strong>{sale.precio}</strong></div>
              <div><span>Saldo pendiente</span><strong>{sale.saldo}</strong></div>
            </div>
            <div className="ventas-mobile-primary-actions">
              {can('change_ventas') && <Link href={`/ventas/${sale.id}`} prefetch={false} className="btn btn-outline-primary rounded-pill"><i className="pi pi-pencil" aria-hidden="true" /> Editar</Link>}
              {(can('change_ventas') || can('add_abonos')) && <button type="button" className="btn btn-primary rounded-pill" onClick={() => props.onPayment(sale)}><i className="pi pi-plus" aria-hidden="true" /> Abonar</button>}
            </div>
            {expanded && (
              <div id={`venta-mobile-detail-${sale.id}`} className="ventas-mobile-detail">
                <div className="ventas-mobile-secondary-actions">
                  {can('change_ventas') && <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={() => props.onState(sale)}>Cambiar estado</button>}
                  {can('view_remisiones') && <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => props.onRemissions(sale)}>Remisiones</button>}
                </div>
                {props.renderDetail(sale)}
              </div>
            )}
          </article>
        );
      })}
      {paginator}
    </div>
  );
}
