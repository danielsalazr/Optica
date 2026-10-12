import Link from 'next/link';
import { buildAdminUrl } from '@/utils/js/env';
import SalesIndicator from '@/components/SalesIndicator';
import styles from './home.module.css';
import { currentUser } from '@/lib/server-api';
import { can } from '@/lib/access';
import { redirect } from 'next/navigation';

const modules = [
  { title: 'Inventario', description: 'Existencias y movimientos', href: '/inventario', icon: 'pi-box' },
  { title: 'Ventas', description: 'Pedidos y clientes', href: '/ventas', icon: 'pi-shopping-bag' },
  { title: 'Remisiones', description: 'Entregas y tickets', href: '/remisiones', icon: 'pi-truck' },
  { title: 'Jornadas', description: 'Ventas por empresa', href: '/jornadas', icon: 'pi-calendar' },
  { title: 'Abonos', description: 'Pagos y distribuciones', href: '/abonos', icon: 'pi-wallet' },
  { title: 'Saldos', description: 'Cartera pendiente', href: '/saldos', icon: 'pi-dollar' },
  { title: 'Reportes', description: 'Consulta de resultados', href: '/reportes', icon: 'pi-chart-bar' },
  { title: 'Impresoras', description: 'Configura tu equipo', href: '/impresoras', icon: 'pi-print' },
];

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect('/login');
  const adminUrl = buildAdminUrl('admin/');
  return (
    <main className={styles.home}>
      <section className={styles.modules} aria-labelledby="home-modules-title">
        <div className={styles.heading}>
          <div><h2 id="home-modules-title">Tu espacio de trabajo</h2><p>Elige un modulo para continuar.</p></div>
          {can(user, 'view_ventas') && can(user, 'add_ventas') && <Link href="/ventas/crearVenta" className={styles.create}><i className="pi pi-plus" aria-hidden="true" /> Crear venta</Link>}
        </div>
        <nav className={styles.grid} aria-label="Accesos a los modulos">
          {modules.filter(module => can(user, `view_${module.href.slice(1)}`)).map(module => (
            <Link key={module.href} href={module.href} className={styles.tile} prefetch={false}>
              <i className={`pi ${module.icon} ${styles.icon}`} aria-hidden="true" />
              <span><strong>{module.title}</strong><small>{module.description}</small></span>
              <i className={`pi pi-arrow-up-right ${styles.arrow}`} aria-hidden="true" />
            </Link>
          ))}
          {user?.is_staff && <a href={adminUrl} className={styles.tile}><i className={`pi pi-list ${styles.icon}`} aria-hidden="true" /><span><strong>Pedidos</strong><small>Gestion en el backend</small></span><i className={`pi pi-arrow-up-right ${styles.arrow}`} aria-hidden="true" /></a>}
          {user?.is_staff && <a href={adminUrl} className={styles.tile}><i className={`pi pi-cog ${styles.icon}`} aria-hidden="true" /><span><strong>Administrador</strong><small>Configuracion general</small></span><i className={`pi pi-arrow-up-right ${styles.arrow}`} aria-hidden="true" /></a>}
        </nav>
      </section>
      {can(user, 'view_resumen') && <section className={styles.summary} aria-labelledby="home-summary-title">
        <h2 id="home-summary-title">Resumen del negocio</h2>
        <SalesIndicator />
      </section>}
    </main>
  );
}
