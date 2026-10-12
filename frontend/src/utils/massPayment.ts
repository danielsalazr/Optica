type PaymentRow = { id: number | string; saldo: number; saldoInicial?: number; precio: number; cuotas?: number | string | null };

export function proposePayments<T extends PaymentRow>(rows: T[], selected: Set<string>, byQuota = false) {
  const amount = rows.filter((row) => selected.has(String(row.id))).reduce((sum, row) => {
    const balance = Math.max(0, Math.trunc(Number(row.saldoInicial ?? row.saldo ?? 0)));
    const quota = Number(row.cuotas || 0);
    return sum + (byQuota ? Math.min(balance, quota > 0 ? Math.max(0, Math.round(row.precio / quota)) : 0) : balance);
  }, 0);
  return { amount, rows: distributePayments(rows, selected, amount, byQuota) };
}

export function distributePayments<T extends PaymentRow>(rows: T[], selected: Set<string>, amount: number, byQuota = false) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('El monto debe ser un valor entero en pesos.');
  const result = rows.map((row) => {
    const saldo = Math.max(0, Math.trunc(Number(row.saldoInicial ?? row.saldo ?? 0)));
    return { ...row, saldoInicial: saldo, aplicar: 0, saldoFinal: saldo };
  });
  let remaining = amount;
  const eligible = result.filter((row) => selected.has(String(row.id)) && row.saldoFinal > 0);
  if (byQuota) {
    for (const row of eligible) {
      const quota = Number(row.cuotas || 0);
      row.aplicar = Math.min(quota > 0 ? Math.round(row.precio / quota) : 0, row.saldoFinal, remaining);
      row.saldoFinal -= row.aplicar;
      remaining -= row.aplicar;
    }
    return result;
  }
  // Integer shares preserve every peso; capped balances are redistributed in later passes.
  let pending = eligible;
  while (remaining > 0 && pending.length > 0) {
    const share = Math.max(1, Math.floor(remaining / pending.length));
    for (const row of pending) {
      const extra = Math.min(share, row.saldoFinal, remaining);
      row.aplicar += extra;
      row.saldoFinal -= extra;
      remaining -= extra;
    }
    pending = pending.filter((row) => row.saldoFinal > 0);
  }
  return result;
}
