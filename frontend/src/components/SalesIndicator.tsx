'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, CreditCard, XCircle } from 'lucide-react';
import { callApi } from '@/utils/js/api';
import styles from './sales-indicator.module.css';

type Summary = { TotalVentas: number; TotalAbonos: number; TotalSaldo: number; TotalVentasAnuladas: number };
const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const toNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const percentage = (value: number, total: number) => total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';

export default function SalesIndicator() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    const load = async () => {
      try {
        const { res: response, data: result } = await callApi('informacionGeneral/', { signal: controller.signal });
        if (!response.ok) throw new Error('Summary unavailable');
        if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Invalid summary');
        if (!controller.signal.aborted) setData({
          TotalVentas: toNumber(result.TotalVentas), TotalAbonos: toNumber(result.TotalAbonos),
          TotalSaldo: toNumber(result.TotalSaldo), TotalVentasAnuladas: toNumber(result.TotalVentasAnuladas),
        });
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    };
    load();
    return () => controller.abort();
  }, [attempt]);

  if (error) return <div className={styles.notice} role="status">
    <span>No se pudo cargar el resumen. Puedes continuar usando los modulos.</span>
    <button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>
  </div>;

  if (!data) return <div className={styles.grid} aria-busy="true" aria-label="Cargando resumen del negocio">
    {[0, 1, 2, 3].map(index => <div key={index} className={`${styles.card} ${styles.placeholder}`} aria-hidden="true" />)}
  </div>;

  const indicators = [
    { title: 'Ventas totales', value: currency.format(data.TotalVentas), icon: TrendingUp, tone: styles.green, note: 'Total registrado' },
    { title: 'Abonos recibidos', value: currency.format(data.TotalAbonos), icon: CreditCard, tone: styles.blue, note: `${percentage(data.TotalAbonos, data.TotalVentas)} del total` },
    { title: 'Saldo pendiente', value: currency.format(data.TotalSaldo), icon: DollarSign, tone: styles.amber, note: `${percentage(data.TotalSaldo, data.TotalVentas)} pendiente` },
    { title: 'Ventas anuladas', value: new Intl.NumberFormat('es-CO').format(data.TotalVentasAnuladas), icon: XCircle, tone: styles.red, note: 'Ventas' },
  ];

  return <div className={styles.grid}>
    {indicators.map(indicator => <div key={indicator.title} className={`${styles.card} ${indicator.tone}`}>
      <div className={styles.heading}><indicator.icon size={20} aria-hidden="true" /><h3>{indicator.title}</h3></div>
      <strong>{indicator.value}</strong><small>{indicator.note}</small>
    </div>)}
  </div>;
}
