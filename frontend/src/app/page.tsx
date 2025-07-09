//'use client';

import Image from "next/image";
import Link from "next/link";
//import { useEffect } from 'react';
import styles from "./page.module.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import TablaArticulos from "@/components/TablaArticulos";
import Footer from "@/components/Footer";
// import 'bootstrap/dist/js/bootstrap.bundle.min';


async function getData() {
  const res = await fetch("http://localhost:8000/articuloInfo/1", {
    cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
  });
  return res.json();
}



// Puedes usar revalidate: X para actualizar los datos cada X segundos:

// async function getData() {
//   const res = await fetch("https://api.example.com/posts", {
//     next: { revalidate: 10 }, // 🔄 Revalida cada 10 segundos (ISR)
//   });
//   return res.json();
// }

export default async function Home() {
const data = await getData();

  return (
    // <div className={styles.page}>
      <>

<div className="container-fluid d-flex w-100 vh-100 align-items-center">
  <div className="row w-100">
    <div className="col-sm-6 col-md-6 mb-3  mx-auto">
      <div className="card">
        <div className="card-header">
          <h3>Seleccione un modulo</h3>
        </div>
        <div className="card-body d-flex flex-column">
          <Link href="ventas" type="button" className="btn btn-primary btn-lg my-1">Ventas</Link>
          <Link href="abonos" type="button" className="btn btn-primary btn-lg my-1">Abonos</Link>
          <Link href="reportes" type="button" className="btn btn-primary btn-lg my-1">Reportes</Link>
          <Link href="admin" type="button" className="btn btn-primary btn-lg my-1">Pedidos</Link>
          <Link href="reportes" type="button" className="btn btn-primary btn-lg my-1">Saldos</Link>
          <Link href="admin" type="button" className="btn btn-primary btn-lg my-1">Administrador</Link>
          {/* <Link href="reportes" type="button" className="btn btn-primary btn-lg my-1">Reportes</Link>
          <Link href="admin" type="button" className="btn btn-primary btn-lg my-1">Administrador</Link> */}
          {/* {'{'}% comment %{'}'} <button type="button" className="btn btn-primary btn-lg my-1">Crear Proveedor</button>
          <button type="button" className="btn btn-primary btn-lg my-1" /> {'{'}% endcomment %{'}'} */}
           {/* <form>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico:</label>
              <input type="email" className="form-control" id="email" placeholder="Ingrese su correo electrónico" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input type="password" className="form-control" id="password" placeholder="Ingrese su contraseña" />
            </div>
            <button type="submit" className="btn btn-primary">
              Iniciar sesión
            </button>
          </form>  */}
        </div>
      </div>
    </div>
  </div>
</div>



      {/* <pre>{JSON.stringify(data, null, 2)}</pre>  
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Get started by editing <code>src/app/page.tsx</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
        
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
        
        
      </footer> */}
    </>
  );
}
