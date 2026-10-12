export function dateOnly(value: unknown): string | null {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T| )/);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) return null;
  return `${year}-${month}-${day}`;
}

export function overdue(value: unknown, reference: unknown): boolean {
  const due = dateOnly(value);
  const today = dateOnly(reference);
  return !!due && !!today && due < today;
}

export function balanceDate(value: unknown): string {
  const date = dateOnly(value);
  return date ? `${date.slice(8)}/${date.slice(5, 7)}/${date.slice(0, 4)}` : 'Sin indicar';
}

export function parseCalendarDate(value: unknown): Date | null {
  const day = dateOnly(value);
  if (!day) return null;
  return new Date(`${day}T00:00:00`);
}

export function localISODate(value: Date | null): string {
  if (!value || !Number.isFinite(value.getTime())) return '';
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export const MAX_INSTALLMENTS = 360;

export function paymentDueDate(start: Date | null, condition: string, installments: number): Date | null {
  if (!start || !Number.isFinite(start.getTime()) || !Number.isInteger(installments) || installments < 1 || installments > MAX_INSTALLMENTS) return null;
  const result = new Date(start.getTime());
  const periods = installments - 1;
  if (condition === 'contado' || periods === 0) return result;
  if (condition === 'mensual') {
    const day = Math.min(start.getDate(), 30);
    result.setDate(1);
    result.setMonth(result.getMonth() + periods);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, lastDay));
  } else {
    let remaining = periods * 15;
    while (remaining > 0) {
      const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
      const available = Math.max(Math.min(lastDay, 30) - result.getDate(), 0);
      if (remaining <= available) {
        result.setDate(result.getDate() + remaining);
        remaining = 0;
      } else {
        remaining -= available + 1;
        result.setDate(1);
        result.setMonth(result.getMonth() + 1);
      }
    }
  }
  return Number.isFinite(result.getTime()) ? result : null;
}

export function safeCsvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
