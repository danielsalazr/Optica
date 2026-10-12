import styles from './sale-route-loading.module.css';

export default function SaleRouteLoading({ form = false }: { form?: boolean }) {
  return (
    <section className={styles.shell} aria-busy="true" aria-label={form ? 'Cargando formulario de venta' : 'Cargando ventas'}>
      <div className={styles.status} role="status">
        <i className="pi pi-spin pi-spinner" aria-hidden="true" />
        <span>{form ? 'Cargando formulario de venta...' : 'Cargando ventas...'}</span>
      </div>
      <div className={form ? styles.fields : styles.table} aria-hidden="true">
        {Array.from({ length: form ? 6 : 8 }, (_, index) => <div className={styles.placeholder} key={index} />)}
      </div>
    </section>
  );
}
