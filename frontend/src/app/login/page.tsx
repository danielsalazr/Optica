'use client';

import { useState, type FormEvent } from 'react';
import { safeReturnPath } from '@/lib/access';
import styles from './login.module.css';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.get('username'), password: data.get('password') }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'No fue posible iniciar sesion.');
      window.location.assign(safeReturnPath(new URLSearchParams(window.location.search).get('next')));
    } catch (err) { setError(err instanceof Error ? err.message : 'No fue posible iniciar sesion.'); setBusy(false); }
  }
  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="login-title">
      <div className={styles.brand}><i className="pi pi-eye" aria-hidden="true" /> BIENESTAR OPTICA</div>
      <h1 id="login-title">Tu espacio de trabajo</h1>
      <p>Inicia sesion con el usuario asignado por tu administrador.</p>
      <form onSubmit={submit}>
        <label htmlFor="username">Usuario</label>
        <input id="username" name="username" autoComplete="username" required maxLength={150} disabled={busy} autoFocus />
        <label htmlFor="password">Contrasena</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required disabled={busy} />
        {error ? <div role="alert" className={styles.error}>{error}</div> : null}
        <button type="submit" disabled={busy}>{busy ? 'Ingresando...' : 'Iniciar sesion'} <i className="pi pi-arrow-right" aria-hidden="true" /></button>
      </form>
      <small>Los accesos dependen de los permisos de tu cuenta.</small>
    </section>
  </main>;
}
