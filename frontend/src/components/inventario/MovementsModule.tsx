'use client';

import { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { useTablePagination } from '@/hooks/useTablePagination';
import { callApi } from '@/utils/js/api';
import MovementTable, { Movement, movementTypes } from './MovementTable';
import '@/styles/inventory.css';
import { useWarehouses } from '@/hooks/useWarehouses';

export default function MovementsModule() {
  const { warehouses, error: warehouseError } = useWarehouses();
  const [warehouseId, setWarehouseId] = useState('');
  const pagination = useTablePagination('inventario-movimientos', 20, [10, 20, 50, 100]);
  const [items, setItems] = useState<{ id: number; nombre: string }[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [item, setItem] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    let active = true;
    callApi('inventario/items/').then(({ res, data }) => {
      if (!res.ok) throw new Error('No fue posible cargar los items.');
      if (active) setItems(data);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const query = new URLSearchParams({ page: String(Math.floor(pagination.first / pagination.rows) + 1), rows: String(pagination.rows) });
    if (item) query.set('articulo_id', item);
    if (warehouseId) query.set('bodega_id', warehouseId);
    if (type) query.set('tipo', type);
    if (search.trim()) query.set('buscar', search.trim());
    const timer = window.setTimeout(() => {
      callApi(`inventario/movimientos/?${query}`).then(({ res, data }) => {
        if (!active) return;
        if (!res.ok) throw new Error('No fue posible cargar los movimientos.');
        setMovements(data.results); setTotal(data.count);
      }).catch(e => { if (active) { setError(e.message); setMovements([]); setTotal(0); } })
        .finally(() => { if (active) setLoading(false); });
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [pagination.first, pagination.rows, item, type, search, warehouseId]);

  return <main className="inventory-page inventory-movements-page">
    <header className="inventory-toolbar"><div><h2>Movimientos de inventario</h2><p>Entradas, ajustes, salidas y devoluciones de todos los items, del mas reciente al mas antiguo.</p></div></header>
    <div className="inventory-filters">
      <select className="form-select" aria-label="Bodega de movimientos" value={warehouseId} onChange={e => { setWarehouseId(e.target.value); pagination.setFirst(0); }}>
        <option value="">Todas las bodegas</option>{warehouses.map(bodega => <option key={bodega.id} value={bodega.id}>{bodega.nombre}{bodega.activa ? '' : ' (Inactiva)'}</option>)}
      </select>
      <InputText aria-label="Buscar movimientos" placeholder="Buscar item o motivo" value={search} onChange={e => { setSearch(e.target.value); pagination.setFirst(0); }} />
      <select className="form-select" aria-label="Filtrar por item" value={item} onChange={e => { setItem(e.target.value); pagination.setFirst(0); }}>
        <option value="">Todos los items</option>{items.map(article => <option key={article.id} value={article.id}>{article.nombre}</option>)}
      </select>
      <select className="form-select" aria-label="Tipo de movimiento" value={type} onChange={e => { setType(e.target.value); pagination.setFirst(0); }}>
        <option value="">Todos los movimientos</option>{Object.entries(movementTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
    {(error || warehouseError) && <div className="alert alert-danger" role="alert">{error || warehouseError}</div>}
    <MovementTable value={movements} loading={loading} total={total} first={pagination.first} rows={pagination.rows}
      onPage={pagination.onPage} rowsPerPageOptions={[10, 20, 50, 100]} />
  </main>;
}
