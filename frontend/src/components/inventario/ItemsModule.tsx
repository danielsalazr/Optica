'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
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
import { buildMediaUrl } from '@/utils/js/env';
import '@/styles/inventory.css';

type Item = { id: number; nombre: string; descripcion: string | null; precio: number; tipo_articulo: string | null; fotos: { id: number; url: string }[]; inventario: { controla: boolean; codigo: string | null; minimo: number } };
const empty = { nombre: '', descripcion: '', precio: 0, tipo_articulo: '1', controla: false, codigo: '', minimo: 0 };
const paginator = 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport';
const errorMessage = (data: unknown) => data && typeof data === 'object'
  ? Object.values(data).flat().filter(value => typeof value === 'string').join(' ') || 'No se pudo completar la operacion.'
  : 'No se pudo completar la operacion.';
const priceLabel = (value: number) => `$ ${Number(value || 0).toLocaleString('es-CO')}`;

export default function ItemsModule() {
  const { can } = useAuth();
  const pagination = useTablePagination('inventario-items', 20, [10, 20, 50, 100]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [dialog, setDialog] = useState<'view' | 'edit' | 'create' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const saving = useRef(false);
  const readOnly = dialog === 'view';

  const refresh = async () => {
    const { res, data } = await callApi('inventario/items/');
    if (!res.ok) throw new Error(errorMessage(data));
    setItems(data);
    pagination.onValueChange(data);
  };
  useEffect(() => { refresh().catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const open = (mode: typeof dialog, item: Item | null = null) => {
    setSelected(item);
    setForm(item ? { nombre: item.nombre, descripcion: item.descripcion || '', precio: item.precio, tipo_articulo: item.tipo_articulo || '', controla: item.inventario.controla, codigo: item.inventario.codigo || '', minimo: item.inventario.minimo } : empty);
    setFiles([]); setRemoved([]); setFormError(''); setDialog(mode);
  };
  const close = () => { if (!saving.current) { setDialog(null); setFiles([]); } };
  const save = async () => {
    if (saving.current) return;
    if (dialog !== 'delete' && (!form.nombre.trim() || form.precio < 0)) {
      setFormError('Indica el nombre y un precio mayor o igual a cero.'); return;
    }
    saving.current = true; setBusy(true); setFormError(''); setSuccess('');
    try {
      const body = new FormData();
      body.append('nombre', form.nombre.trim()); body.append('descripcion', form.descripcion);
      body.append('precio', String(form.precio)); body.append('tipo_articulo', form.tipo_articulo);
      body.append('controla', String(form.controla)); body.append('codigo', form.codigo.trim()); body.append('minimo', String(form.minimo));
      files.forEach(file => body.append('imagenes', file));
      removed.forEach(id => body.append('quitar_fotos', String(id)));
      const { res, data } = await callApi(selected ? `inventario/items/${selected.id}/` : 'inventario/items/', {
        method: dialog === 'delete' ? 'DELETE' : selected ? 'PUT' : 'POST',
        ...(dialog === 'delete' ? {} : { body })
      });
      if (!res.ok) throw new Error(errorMessage(data));
      setDialog(null); setFiles([]); setSuccess(dialog === 'delete' ? 'Item eliminado.' : 'Item guardado correctamente.');
      await refresh().catch(() => setError('La operacion se completo, pero no fue posible actualizar el listado. Recarga la vista.'));
    } catch (e) { setFormError(e instanceof Error ? e.message : 'No se pudo completar la operacion.'); }
    finally { saving.current = false; setBusy(false); }
  };

  const visible = items.filter(item => (filter === 'todos' || item.tipo_articulo === filter) &&
    `${item.id} ${item.nombre} ${item.descripcion || ''}`.toLowerCase().includes(search.toLowerCase()));
  const actions = (item: Item) => <div className="inventory-actions">
    <Button key={`view-${item.id}`} icon="pi pi-eye" rounded outlined tooltip="Ver item" aria-label={`Ver ${item.nombre}`} onClick={() => open('view', item)} />
    {can('change_inventario') && <Button key={`edit-${item.id}`} icon="pi pi-pencil" rounded tooltip="Editar item" aria-label={`Editar ${item.nombre}`} onClick={() => open('edit', item)} />}
    {can('delete_inventario') && <Button key={`delete-${item.id}`} icon="pi pi-trash" rounded outlined severity="danger" tooltip="Eliminar item" aria-label={`Eliminar ${item.nombre}`} onClick={() => open('delete', item)} />}
  </div>;

  return <main className="inventory-page">
    <header className="inventory-toolbar"><div><h2>Maestro de items</h2><p>Articulos y servicios disponibles para registrar ventas.</p></div>
      {can('add_inventario') && <Button label="Nuevo item" icon="pi pi-plus" rounded onClick={() => open('create')} />}
    </header>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {success && <div className="alert alert-success" role="status">{success}</div>}
    <div className="inventory-filters">
      <InputText aria-label="Buscar items" placeholder="Buscar nombre, descripcion o ID" value={search} onChange={e => { setSearch(e.target.value); pagination.setFirst(0); }} />
      <select className="form-select" aria-label="Tipo de item" value={filter} onChange={e => { setFilter(e.target.value); pagination.setFirst(0); }}>
        <option value="todos">Todos los items</option><option value="1">Articulos</option><option value="2">Servicios</option>
      </select>
    </div>
    <DataTable value={visible} dataKey="id" loading={loading} className="inventory-items-table" size="small" sortField="id" sortOrder={-1}
      paginator paginatorPosition="both" paginatorTemplate={paginator} first={pagination.first} rows={pagination.rows} onPage={pagination.onPage}
      rowsPerPageOptions={[10, 20, 50, 100]} currentPageReportTemplate="{first} - {last} de {totalRecords}" emptyMessage="No hay items para esta seleccion.">
      <Column field="id" header="ID" sortable style={{ width: '4rem' }} />
      <Column field="nombre" header="Item" sortable body={(item: Item) => <div><strong>{item.nombre}</strong><small>{item.inventario.codigo || `Item #${item.id}`}</small><small>{item.descripcion || 'Sin descripcion'}</small></div>} />
      <Column header="Tipo" body={(item: Item) => <Tag value={item.tipo_articulo === '2' ? 'Servicio' : item.tipo_articulo === '1' ? 'Articulo' : 'Sin tipo'} />} style={{ width: '7rem' }} />
      <Column field="precio" header="Precio" sortable body={(item: Item) => priceLabel(item.precio)} style={{ width: '9rem' }} />
      <Column header="Acciones" body={actions} style={{ width: '10rem' }} />
    </DataTable>
    <Dialog visible={dialog !== null} onHide={close} header={dialog === 'delete' ? 'Eliminar item' : dialog === 'create' ? 'Nuevo item' : readOnly ? 'Detalle del item' : 'Editar item'}
      className="inventory-dialog" modal draggable={false} style={{ width: '36rem', maxWidth: '95vw' }}
      footer={<><Button label={readOnly ? 'Cerrar' : 'Cancelar'} rounded outlined disabled={busy} onClick={close} />
        {!readOnly && <Button label={dialog === 'delete' ? 'Eliminar' : 'Guardar'} severity={dialog === 'delete' ? 'danger' : undefined} rounded loading={busy} onClick={save} />}</>}>
      {formError && <div className="alert alert-danger" role="alert">{formError}</div>}
      {dialog === 'delete' ? <p>¿Eliminar <strong>{selected?.nombre}</strong>? Solo se pueden eliminar items sin ventas, pedidos, stock ni historial de movimientos.</p> : <div className="inventory-form">
        <label htmlFor="item-name">Nombre</label><InputText id="item-name" maxLength={100} value={form.nombre} disabled={busy || readOnly} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        <label htmlFor="item-description">Descripcion</label><InputTextarea id="item-description" rows={3} maxLength={255} value={form.descripcion} disabled={busy || readOnly} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
        <label htmlFor="item-type">Tipo</label><select id="item-type" className="form-select" value={form.tipo_articulo} disabled={busy || readOnly || selected?.inventario.controla} onChange={e => setForm({ ...form, tipo_articulo: e.target.value, controla: e.target.value === '2' ? false : form.controla })}>
          <option value="">Sin tipo</option><option value="1">Articulo</option><option value="2">Servicio</option>
        </select>
        <label htmlFor="item-price">Precio</label><InputNumber inputId="item-price" min={0} max={2147483647} maxFractionDigits={0} value={form.precio} disabled={busy || readOnly} onValueChange={e => setForm({ ...form, precio: e.value ?? 0 })} />
        <fieldset className="inventory-item-settings">
          <legend>Configuracion de inventario</legend>
          <label className="inventory-check" htmlFor="item-control"><Checkbox inputId="item-control" checked={form.controla} disabled={busy || readOnly || form.tipo_articulo === '2'} onChange={e => setForm({ ...form, controla: !!e.checked })} /> Controlar inventario</label>
          <p>Solo se reservaran ventas registradas despues de activar el control. Los pedidos antiguos no descuentan existencias. Los servicios no llevan inventario.</p>
          <label htmlFor="item-code">Codigo / SKU</label><InputText id="item-code" maxLength={60} value={form.codigo} disabled={busy || readOnly} onChange={e => setForm({ ...form, codigo: e.target.value })} />
          <label htmlFor="item-min">Stock minimo</label><InputNumber inputId="item-min" min={0} max={2147483647} maxFractionDigits={0} value={form.minimo} disabled={busy || readOnly} onValueChange={e => setForm({ ...form, minimo: e.value ?? 0 })} />
        </fieldset>
        {!readOnly && <><label htmlFor="item-images">Agregar fotos</label><input id="item-images" className="form-control" type="file" accept="image/*" multiple disabled={busy} onChange={e => { setFiles(previous => [...previous, ...Array.from(e.target.files || [])]); e.target.value = ''; }} /></>}
        <div className="inventory-item-photos">
          {selected?.fotos.filter(photo => !removed.includes(photo.id)).map(photo => <div key={photo.id}><img src={buildMediaUrl(photo.url)} alt={selected.nombre} />
            {!readOnly && <button type="button" disabled={busy} aria-label="Quitar foto existente" onClick={() => setRemoved(previous => [...previous, photo.id])}>×</button>}</div>)}
          {previews.map((url, index) => <div key={url}><img src={url} alt={`Nueva foto ${index + 1}`} /><button type="button" disabled={busy} aria-label={`Quitar nueva foto ${index + 1}`} onClick={() => setFiles(previous => previous.filter((_, i) => i !== index))}>×</button></div>)}
        </div>
        {readOnly && !selected?.fotos.length && <p>Sin fotos registradas.</p>}
      </div>}
    </Dialog>
  </main>;
}
