'use client';

import { Column } from 'primereact/column';
import { DataTable, DataTableStateEvent } from 'primereact/datatable';
import { Tag } from 'primereact/tag';

export type Movement = { id: number; articulo_id: number; articulo: string; bodega_id: number; bodega: string; tipo: string; cantidad: number; saldo_resultante: number; motivo: string; fecha: string; usuario: string; venta_id: number | null; remision_id: number | null };
export const movementTypes: Record<string, string> = { entrada: 'Entrada', ajuste: 'Ajuste', salida: 'Salida por remision', devolucion: 'Devolucion', reversion: 'Reversion' };
const dateLabel = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date.split('-').reverse().join('/') : '-';

type Props = {
  value: Movement[]; loading: boolean; total: number; first: number; rows: number;
  onPage: (event: DataTableStateEvent) => void;
  action?: (movement: Movement) => React.ReactNode;
  rowsPerPageOptions?: number[];
};

export default function MovementTable({ value, loading, total, first, rows, onPage, action, rowsPerPageOptions }: Props) {
  return <DataTable value={value} dataKey="id" lazy paginator paginatorPosition="both" loading={loading} totalRecords={total}
    first={first} rows={rows} onPage={onPage} rowsPerPageOptions={rowsPerPageOptions}
    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink ${rowsPerPageOptions ? 'RowsPerPageDropdown ' : ''}CurrentPageReport`}
    currentPageReportTemplate="{first} - {last} de {totalRecords}" size="small" className="inventory-history-table" emptyMessage="No hay movimientos registrados.">
    <Column header="Item / bodega / fecha" body={(m: Movement) => <div><strong>{m.articulo}</strong><small>{m.bodega}</small><small>{dateLabel(m.fecha)} - #{m.id}</small></div>} />
    <Column header="Movimiento" body={(m: Movement) => <Tag value={movementTypes[m.tipo] || m.tipo} severity={m.cantidad > 0 ? 'success' : 'warning'} />} />
    <Column field="cantidad" header="Unidades" /><Column field="saldo_resultante" header="Existencia posterior" />
    <Column header="Detalle" body={(m: Movement) => <div>{m.motivo}<small>{m.usuario}{m.venta_id ? ` - Venta #${m.venta_id}` : ''}{m.remision_id ? ` - Remision #${m.remision_id}` : ''}</small></div>} />
    {action && <Column header="Acciones" body={action} />}
  </DataTable>;
}
