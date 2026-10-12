'use client';

import { useEffect, useState } from 'react';
import type { DataTableStateEvent } from 'primereact/datatable';

export function useTablePagination(tableKey: string, defaultRows: number, allowedRows: number[]) {
  const [rows, updateRows] = useState(defaultRows);
  const [first, setFirst] = useState(0);
  const storageKey = `optica:table:${tableKey}:rows`;
  const allowedValues = allowedRows.join(',');

  // Read after hydration so server and browser initially render the same page.
  useEffect(() => {
    try {
      const savedRows = Number(window.localStorage.getItem(storageKey));
      if (allowedValues.split(',').map(Number).includes(savedRows)) {
        updateRows(savedRows);
        setFirst(0);
      }
    } catch {
      // Pagination still works when browser storage is unavailable.
    }
  }, [storageKey, allowedValues]);

  const setRows = (value: number) => {
    if (!allowedRows.includes(value)) return;
    updateRows(value);
    try {
      window.localStorage.setItem(storageKey, String(value));
    } catch {
      // Keep the selection for this session even if it cannot be persisted.
    }
  };

  const onPage = (event: DataTableStateEvent) => {
    setFirst(event.rows !== rows ? 0 : event.first);
    setRows(event.rows);
  };

  const onValueChange = (value: unknown[]) => {
    setFirst(previous => previous >= value.length ? 0 : previous);
  };

  return { first, rows, setFirst, setRows, onPage, onValueChange };
}
