'use client';

import { useEffect, useState } from 'react';
import { callApi } from '@/utils/js/api';

export type Warehouse = { id: number; nombre: string; activa: boolean };

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    callApi('inventario/bodegas/').then(({ res, data }) => {
      if (!res.ok) throw new Error('No fue posible cargar las bodegas. Recarga la vista.');
      if (active) setWarehouses(data);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  return { warehouses, error };
}
