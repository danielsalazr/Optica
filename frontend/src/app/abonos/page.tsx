import React from 'react'

import { moneyformat, fechaFormat } from '@/utils/js/utils';
import AbonosData from '@/components/abonos/AbonosData';
import { buildBackendUrl } from '@/utils/js/env';

type AbonoRow = {
  precio: number | string;
  fecha: string;
  [key: string]: unknown;
};


async function getDataAbonos() {
    const res = await fetch(buildBackendUrl("abono/"), {
      cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
    });
    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const data: AbonoRow[] =  await res.json();
    return data
  }

  function imprimir() {
    console.log("lo imprimi desde el server")
  }

async function page() {

    let data = await getDataAbonos();

    // data.forEach(item => console.log(typeof(item.fecha)))
    data = data.map((item: AbonoRow) => {
      // Eliminar el símbolo "$" y reemplazar "." por ","
      item.precio = moneyformat(item.precio)
      item.fecha = fechaFormat(item.fecha)
      // item.acciones = `<button click="eliminar()"> eliminar</button>`//() => <button onClick={con}> lol </button>
        
    //   item.totalAbono = moneyformat(item.totalAbono)
    //   item.saldo = moneyformat(item.saldo)
      return item; // Retornar el objeto modificado
    });
  console.log(data);
      

  return (
    <>
      <h2 className='' style={{textAlign: 'center', padding: '24px 0'}}>Abonos</h2>
      <AbonosData data={data}  />
        
    </>
  )
}

export default page
