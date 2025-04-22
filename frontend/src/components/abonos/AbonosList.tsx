import React, {useEffect, useState} from 'react';
import { callApi } from '@/utils/js/api';
import Image from 'next/image';

import { executeUtils, moneyformat, formatMoneyInput, separadorDeMiles, fromNumberToMoney, fromMoneyToText } from '@/utils/js/utils';

function AbonosList(props) {
  const {data, generalData} = props;

  const [listaAbonos, setListaAbonos] = useState([{
      cedula :data.cedula, 
      cliente :data.cliente, 
      factura :data.factura,  
      // imagenMedioPago :"https://cdn-icons-png.flaticon.com/512/1041/1041971.png", 
      // medioDePago :"Efectivo", 
      abono :data.abono, 
      precio :data.precio, 
  }])

  useEffect(() => {
    const fetchData = async () => {
      const req = await callApi(`abono/${data.factura}`)
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
              <label htmlFor="inputEmail4" className="form-label">Factura</label>
              <input type="text" className="form-control" id="factura" name="factura" defaultValue={data.factura} readOnly/>
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
            {listaAbonos.map((abono) => (
              <tr>
                <td>{abono.fecha}</td>
                <td> <img 
                    style={{borderRadius: '30px'}}
                    src={abono.imagenMedioPago}
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
    </>
  )
}

export default AbonosList;
