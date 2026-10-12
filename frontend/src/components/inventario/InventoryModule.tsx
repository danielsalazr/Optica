'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTablePagination } from '@/hooks/useTablePagination';
import { callApi } from '@/utils/js/api';
import '@/styles/inventory.css';
import MovementTable, { Movement } from './MovementTable';
import { useWarehouses } from '@/hooks/useWarehouses';

type Article = { id: number; nombre: string; codigo: string; controla: boolean; servicio: boolean; minimo: number; existencia: number; reservado: number; disponible: number; bajo: boolean };
const paginator = 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport';
const types: Record<string, string> = { entrada: 'Entrada', ajuste: 'Ajuste', salida: 'Salida por remision', devolucion: 'Devolucion', reversion: 'Reversion' };
const message = (data: unknown) => typeof data === 'object' && data ? Object.values(data).flat().filter(v => typeof v === 'string').join(' ') || 'No se pudo completar la operacion.' : 'No se pudo completar la operacion.';

export default function InventoryModule() {
  const { can } = useAuth();
  const { warehouses, error: warehouseError } = useWarehouses();
  const [warehouseId, setWarehouseId] = useState('1');
  const activeWarehouse = warehouses.find(bodega => String(bodega.id) === warehouseId)?.activa !== false;
  const stockRequest = useRef(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [warehouse, setWarehouse] = useState('Bodega principal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [dialog, setDialog] = useState<'movement' | null>(null);
  const [selected, setSelected] = useState<Article | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ tipo: 'entrada', cantidad: 1, motivo: '', fecha: '', origen_id: undefined as number | undefined });
  const key = useRef('');
  const saving = useRef(false);
  const pagination = useTablePagination('inventario', 20, [10, 20, 50, 100]);
  const [history, setHistory] = useState(false);
  const [historyArticle, setHistoryArticle] = useState<Article | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyFirst, setHistoryFirst] = useState(0);
  const historyRequest = useRef(0);

  const refresh = async () => {
    const generation = ++stockRequest.current;
    const { res, data } = await callApi(`inventario/?bodega_id=${warehouseId}`);
    if (generation !== stockRequest.current) return;
    if (!res.ok) throw new Error(message(data));
    setArticles(data.articulos); setWarehouse(data.bodega);
  };
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setArticles([]);
    refresh().catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; stockRequest.current++; };
  }, [warehouseId]);
  useEffect(() => {
    if (!history) return;
    const generation = ++historyRequest.current;
    setHistoryLoading(true); setHistoryError('');
    const target = historyArticle ? `&articulo_id=${historyArticle.id}` : '';
    callApi(`inventario/movimientos/?page=${Math.floor(historyFirst / 20) + 1}&bodega_id=${warehouseId}${target}`).then(({ res, data }) => {
      if (generation !== historyRequest.current) return;
      if (!res.ok) throw new Error(message(data));
      setMovements(data.results); setHistoryTotal(data.count);
    }).catch(e => { if (generation === historyRequest.current) setHistoryError(e.message); })
      .finally(() => { if (generation === historyRequest.current) setHistoryLoading(false); });
    return () => { historyRequest.current++; };
  }, [history, historyArticle, historyFirst, warehouseId]);

  const openHistory = (article: Article | null) => { setHistoryArticle(article); setHistoryFirst(0); setHistory(true); };
  const openMovement = (article: Article, tipo: string, origen?: number) => {
    setSelected(article); setForm({ tipo, cantidad: tipo === 'ajuste' ? article.existencia : 1, motivo: '', fecha: '', origen_id: origen });
    key.current = crypto.randomUUID(); setFormError(''); setDialog('movement');
  };
  const save = async () => {
    if (!selected || saving.current) return;
    saving.current = true; setBusy(true); setFormError(''); setSuccess('');
    try {
      const payload = { ...form, articulo_id: selected.id, bodega_id: Number(warehouseId), clave: key.current, fecha: form.fecha || null };
      const { res, data } = await callApi('inventario/movimientos/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(message(data));
      setDialog(null); setHistory(false); setSuccess('Operacion registrada correctamente.');
      await refresh().catch(() => setError('La operacion se registro, pero no fue posible actualizar el listado. Recarga la vista.'));
    } catch (e) { setFormError(e instanceof Error ? e.message : 'No se pudo completar la operacion.'); }
    finally { saving.current = false; setBusy(false); }
  };

  const visible = articles.filter(a => (filter === 'todos' || (filter === 'controlados' ? a.controla : a.bajo)) && `${a.nombre} ${a.codigo || ''}`.toLowerCase().includes(search.toLowerCase()));
  const controlled = articles.filter(a => a.controla);
  const actions = (a: Article) => <div className="inventory-actions">
    {can('add_inventario') && a.controla && <Button key={`entry-${a.id}`} icon="pi pi-plus" rounded disabled={!activeWarehouse} aria-label={`Entrada de ${a.nombre}`} tooltip="Registrar entrada" onClick={() => openMovement(a, 'entrada')} />}
    {can('change_inventario') && a.controla && <Button key={`adjust-${a.id}`} icon="pi pi-pencil" rounded outlined disabled={!activeWarehouse} aria-label={`Ajustar ${a.nombre}`} tooltip="Conteo fisico y ajuste" onClick={() => openMovement(a, 'ajuste')} />}
    <Button key={`history-${a.id}`} icon="pi pi-history" rounded outlined aria-label={`Historial de ${a.nombre}`} tooltip="Ver movimientos" onClick={() => openHistory(a)} />
  </div>;

  return <main className="inventory-page">
    <header className="inventory-toolbar"><div><h2>Existencias: {warehouse}</h2><p>Existencia fisica, unidades reservadas y disponibilidad.</p></div>
      <Button label="Movimientos" icon="pi pi-history" rounded outlined onClick={() => openHistory(null)} />
    </header>
    {(error || warehouseError) && <div className="alert alert-danger" role="alert">{error || warehouseError}</div>}
    {success && <div className="alert alert-success" role="status">{success}</div>}
    <section className="inventory-summary" aria-label="Resumen de inventario">
      {[['Articulos controlados', controlled.length], ['Existencias', controlled.reduce((s, a) => s + a.existencia, 0)], ['Reservadas', controlled.reduce((s, a) => s + a.reservado, 0)], ['Stock bajo', controlled.filter(a => a.bajo).length]].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}
    </section>
    <div className="inventory-filters"><InputText aria-label="Buscar articulo" placeholder="Buscar por nombre o codigo" value={search} onChange={e => { setSearch(e.target.value); pagination.setFirst(0); }} />
      <select aria-label="Bodega de existencias" className="form-select" value={warehouseId} disabled={busy || dialog !== null || history} onChange={e => { setWarehouseId(e.target.value); pagination.setFirst(0); }}>
        {!warehouses.length && <option value="1">Bodega principal</option>}
        {warehouses.map(bodega => <option key={bodega.id} value={bodega.id}>{bodega.nombre}{bodega.activa ? '' : ' (Inactiva)'}</option>)}
      </select>
      <select aria-label="Filtrar inventario" className="form-select" value={filter} onChange={e => { setFilter(e.target.value); pagination.setFirst(0); }}><option value="todos">Todos los articulos</option><option value="controlados">Con inventario</option><option value="bajos">Stock bajo</option></select>
    </div>
    <DataTable value={visible} dataKey="id" loading={loading} className="inventory-table" size="small"
      paginator paginatorPosition="both" paginatorTemplate={paginator} rows={pagination.rows} first={pagination.first} onPage={pagination.onPage} rowsPerPageOptions={[10, 20, 50, 100]} currentPageReportTemplate="{first} - {last} de {totalRecords}" emptyMessage="No hay articulos para esta seleccion.">
      <Column header="Articulo" body={(a: Article) => <div><strong>{a.nombre}</strong><small>{a.codigo || `Articulo #${a.id}`}</small></div>} style={{ width: '28%' }} />
      <Column header="Control" body={(a: Article) => <Tag value={a.servicio ? 'Servicio' : a.controla ? 'Controlado' : 'Sin control'} severity={a.controla ? 'info' : 'secondary'} rounded />} />
      <Column field="existencia" header="Existencia" sortable body={(a: Article) => a.controla ? a.existencia : '-'} />
      <Column field="reservado" header="Reservado" sortable body={(a: Article) => a.controla ? a.reservado : '-'} />
      <Column header="Disponible" body={(a: Article) => a.controla ? <div className={a.bajo ? 'text-danger fw-semibold' : ''}>{a.disponible}<small>Minimo: {a.minimo}</small></div> : '-'} />
      <Column header="Acciones" body={actions} style={{ width: '12rem' }} />
    </DataTable>
    <Dialog visible={dialog !== null} onHide={() => !busy && setDialog(null)} header={types[form.tipo]} className="inventory-dialog" modal draggable={false} style={{ width: '32rem', maxWidth: '95vw' }} footer={<><Button label="Cancelar" rounded outlined disabled={busy} onClick={() => setDialog(null)} /><Button label="Guardar" icon="pi pi-check" rounded loading={busy} onClick={save} /></>}>
      <h3>{selected?.nombre}</h3>
      <p className="small text-muted">Bodega: {warehouse}</p>
      {formError && <div className="alert alert-danger" role="alert">{formError}</div>}
      <div className="inventory-form">
        <p>{form.tipo === 'ajuste' ? `Existencia actual: ${selected?.existencia}. Ingresa la cantidad total contada, no la diferencia.` : form.tipo === 'devolucion' ? 'Registra solo unidades fisicamente devueltas. Esto no anula la venta.' : 'Registra unidades recibidas fisicamente en la bodega.'}</p>
        <label htmlFor="inventory-quantity">{form.tipo === 'ajuste' ? 'Existencia contada' : 'Cantidad recibida'}</label><InputNumber inputId="inventory-quantity" min={form.tipo === 'ajuste' ? 0 : 1} maxFractionDigits={0} value={form.cantidad} disabled={busy} onValueChange={e => setForm({ ...form, cantidad: e.value || 0 })} />
        <label htmlFor="inventory-date">Fecha efectiva (opcional)</label><input id="inventory-date" type="date" className="form-control" disabled={busy} value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
        <label htmlFor="inventory-reason">Motivo / referencia</label><InputTextarea id="inventory-reason" rows={3} maxLength={250} disabled={busy} value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
      </div>
    </Dialog>
    <Dialog visible={history} onHide={() => setHistory(false)} header={historyArticle ? `Movimientos: ${historyArticle.nombre}` : 'Historial de movimientos'} className="inventory-history" modal maximizable draggable={false} style={{ width: '65rem', maxWidth: '96vw' }}>
      {historyError && <div className="alert alert-danger">{historyError}</div>}
      <MovementTable value={movements} loading={historyLoading} total={historyTotal} first={historyFirst} rows={20} onPage={e => setHistoryFirst(e.first)}
        action={(m: Movement) => m.tipo === 'salida' && can('add_inventario') ? <Button label="Devolver" rounded outlined onClick={() => { const article = articles.find(a => a.id === m.articulo_id); if (article) { setHistory(false); openMovement(article, 'devolucion', m.id); } }} /> : null} />
    </Dialog>
  </main>;
}
