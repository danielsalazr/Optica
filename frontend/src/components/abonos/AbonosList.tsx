// @ts-nocheck
import React, {useEffect, useState} from 'react';
import { callApi } from '@/utils/js/api';
import Image from 'next/image';

import { executeUtils, moneyformat, formatMoneyInput, separadorDeMiles, fromNumberToMoney, fromMoneyToText } from '@/utils/js/utils';

type AbonoListVenta = {
  id: number | string;
  cedula: number | string;
  cliente: string;
  abono: number | string;
  precio: number | string;
  saldo: number | string;
  totalAbono: number | string;
};

type AbonoListRow = {
  fecha?: string;
  fecha_raw?: string;
  fecha_registro?: string;
  imagenMedioPago?: string;
  medioDePago?: string;
  precio: number | string;
  [key: string]: unknown;
};

type AbonosListProps = {
  data: AbonoListVenta;
  generalData: unknown;
};

function AbonosList(props: AbonosListProps) {
  const {data, generalData} = props;
  // console.log(data)

  const [listaAbonos, setListaAbonos] = useState<AbonoListRow[]>([{
    
      cedula :data.cedula, 
      cliente :data.cliente, 
      pedido :data.id,  
      // imagenMedioPago :"https://cdn-icons-png.flaticon.com/512/1041/1041971.png", 
      // medioDePago :"Efectivo", 
      abono :data.abono, 
      precio :data.precio, 
  }])

  useEffect(() => {
    const fetchData = async () => {
      const req = await callApi(`abono/${data.id}`)
      console.log(req.data)
      // setAbonos(req.data)
      setListaAbonos(req.data) 
    }
    // console.log(data)
    fetchData();
    
  },[])

  return (
    <>
        <div className="row g-3 mb-3" >
          <div className="col-md-6">
              <label htmlFor="inputEmail4" className="form-label">Pedido</label>
              <input type="text" className="form-control" id="factura" name="factura" defaultValue={data.id} readOnly/>
          </div>
          <div className="col-md-6">
              <label htmlFor="inputPassword4" className="form-label">cliente</label>
              <input type="text" className="form-control" id="clienteName" name="clienteName" defaultValue={data.cliente} readOnly />
          </div>
          <div className="col-md-6">
              <label htmlFor="inputEmail4" className="form-label">Compra</label>
              <input type="text" className="form-control" id="factura" name="factura" defaultValue={data.precio} readOnly/>
          </div>
          <div className="col-md-6">
              <label htmlFor="inputPassword4" className="form-label">Saldo</label>
              <input type="text" className="form-control" id="clienteName" name="clienteName" defaultValue={data.saldo} readOnly />
          </div>
          <div className="col-md-6">
              <label htmlFor="inputPassword4" className="form-label">Abonado</label>
              <input type="text" className="form-control" id="clienteName" name="clienteName" defaultValue={data.totalAbono} readOnly />
          </div>
        </div>

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>fecha</th>
              <th>medio</th>
              <th>abono</th>
            </tr>
          </thead>
          <tbody>
            {listaAbonos.map((abono, index) => (
              <tr key={`${abono.fecha || 'abono'}-${index}`}>
                <td>{abono.fecha}</td>
                <td> <img 
                    style={{borderRadius: '30px'}}
                    src={abono.imagenMedioPago || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbyC6amH2B9H4vu3pEVEms33iwwLjgS1v0iw&s"}
                    alt="Mi imagen"
                    width={32}
                    height={32}
                  /> {'  '}
                  {abono.medioDePago}</td>
                <td>{moneyformat(abono.precio)}</td>

                

              </tr>
            ))}

          </tbody>
          
        </table>
        <hr />
        <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 10px'}}>
          <label htmlFor="">Total:</label>
          <span>{data.totalAbono}</span>
        </div>
    </>
  )
}

export default AbonosList;
