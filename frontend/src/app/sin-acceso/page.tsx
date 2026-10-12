import Link from 'next/link';

export default function ForbiddenPage() {
  return <main className="page-shell"><section className="alert alert-warning" role="status">
    <h2>Acceso restringido</h2><p>Tu cuenta no tiene permiso para entrar a este modulo. Consulta con tu administrador.</p>
    <Link href="/" className="btn btn-primary">Volver al inicio</Link>
  </section></main>;
}
