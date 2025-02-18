import React from 'react'
import DataTables from '@/components/Datatables';
import { moneyformat, fechaFormat } from '@/utils/js/utils';


async function getDataAbonos() {
    const res = await fetch("http://localhost:8000/abono/", {
      cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
    });
    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const data =  await res.json();
    return data
  }

async function page() {

    let data = await getDataAbonos();
    console.log(data)

    const formateador = new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false, // Usar formato de 24 horas
    });

    data = data.map(item => {
          // Eliminar el símbolo "$" y reemplazar "." por ","
          item.precio = moneyformat(item.precio)
          item.fecha = fechaFormat(item.fecha)
            
        //   item.totalAbono = moneyformat(item.totalAbono)
        //   item.saldo = moneyformat(item.saldo)
          return item; // Retornar el objeto modificado
        });

  return (
    <>
      Abonos
        <DataTables data={data}/> 
    </>
  )
}

export default page
