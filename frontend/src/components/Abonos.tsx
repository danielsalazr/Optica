import React, { useEffect, useRef, useState } from 'react'
import MedioPago from './MedioPago'
import { executeUtils } from '@/utils/js/utils.js';
import { fromMoneyToText, fromNumberToMoney } from '@/utils/js/utils.js';
import 'boxicons';
import Button from 'react-bootstrap/Button';



function Abonos({data}) {
  console.log(data)
  const [abonoTotal, setAbonoTotal] = useState(0)
  const [rows, setRows] = useState([[{
    precio: '$ 0',
    // total: '$ 0',
  }]]);

    const hoy = new Date();

    // Sumar 2 meses a la fecha actual
    hoy.setMonth(hoy.getMonth() + 2);

    // Formatear la fecha como YYYY-MM-DD
    const hoyMas2Meses = hoy.toISOString().split('T')[0];
    console.log(hoyMas2Meses)

    const addMetodoPago = () => {
      // Añadir una fila vacía al estado
      setRows(prevRows => [...prevRows, { 
        precio: '$ 0',
      }]);
      
    }

    const handlePrecioChange = (index, value) => {

      // const precio = value || 0;
      // Actualizar el precio y total de la fila correspondiente
      const newRows = [...rows];
      newRows[index].precio = value || 0; // Convertir a número
      newRows[index].total = newRows[index].precio;  // El total será igual al precio
      setRows(newRows);
       // Actualizar el estado
      //  executeUtils()

      setAbonoTotal(rows.reduce((acumulador, item) => acumulador + fromMoneyToText(item.total), 0));
    };

    const handleDeleteRow = (index) => {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
  
      // Actualizar el total después de eliminar la fila
      setAbonoTotal(
        newRows.reduce((acumulador, item) => acumulador + fromMoneyToText(item.total), 0)
      );
    };

    const handleLoad = () => {
      executeUtils()
    };

  return (
    <div className="container mw-100 my-4" onLoad={handleLoad}>
          <h2 className="mb-4">Abonos</h2>

          <div className='row'>

            <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
                <label htmlFor="password">Fecha de vencimiento</label>
                <input type="date" className="form-control" id="fecha_Vencimiento" placeholder="Ingrese su contraseña" name="fecha_Vencimiento" defaultValue={hoyMas2Meses} required />
            </div>

            <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
                <label htmlFor="password">Compromiso de pago</label>
                <input type="number" className="form-control" id="compromisoPago" placeholder="Cuotas" name="compromisoPago" defaultValue='' required />
            </div>

            <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
                <label htmlFor="password">Tipo de Pago</label>
                {/* <input type="number" className="form-control" id="fecha_Vencimiento" placeholder="Cuotas" name="fecha_Vencimiento" defaultValue={hoyMas2Meses} required /> */}
                <select className="form-select" name="tipoPago" id="tipoPago">
                  <option value="1" >Personal</option>
                  <option value="2">Por Empresa</option>
                  {/* <option value="3">Abono</option> */}
                </select>
            </div>

          </div>
          
            <div className="table-responsive mt-4" style={{overflowX: 'visible'}}>
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr >
                    <th style={{width: "2%"}}>#</th>
                    <th style={{width: "35%"}}>Medio de Pago</th>
                    <th>Descripcion</th>
                    <th style={{width: "20%"}}>Valor</th>
                    {/* <th>Total $</th> */}
                    </tr>
                </thead>
                <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                  <td className="bg-secondary-subtle">{index + 1}</td>
                  <td style={{ width: '25%' }}>
                    <MedioPago 
                      data={data} 
                      name="metodoPago" 
                      className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3 w-100"
                      required={false}
                    />
                  </td>
                  <td width={40}>
                    <input
                      className="form-control"
                      id={`descripcion-${index}`}
                      name="descripcionAbono"
                      placeholder="descripcionAbono"
                      //value={row.total}
                      // defaultValue={0}
                    />
                  </td>
                  <td width={150}>
                    <input
                      type="text"
                      className="form-control border-0 precio"
                      id={`precio_articulo-${index}`}
                      name="precioAbono"
                      step={1000}
                      placeholder="Precio"
                      value={row.precio}
                      onChange={(e) => handlePrecioChange(index, e.target.value)}
                      onBlur={(e) => handlePrecioChange(index, e.target.value)}
                      defaultValue={`$ 0`}
                      // defaultValue="$ 0"
                      
                    />
                  </td>
                  {/* <td>
                    <input
                      className="form-control"
                      id={`totalAbono-${index}`}
                      name="totalAbono"
                      placeholder="Total"
                      readOnly
                      value={row.total}
                      // defaultValue={0}
                    />
                  </td> */}
                  <box-icon type='solid' onClick={() => handleDeleteRow(index)} size="md" name='trash' style={{ display: "table-cell", width: "4.2%"}} color="red" ></box-icon>
                </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-between">
            <button
            type="button"
            className="btn btn-primary"
            onClick={addMetodoPago}
          >
            Agregar Fila
          </button>
              {/* <button type="button" className="btn btn-primary" onClick={addRow}>
                Agregar Fila
              </button> */}

              {/* <button type="submit" className="btn btn-success">Enviar</button> */}
              <div 
              // className="d-flex justify-content-end col-sm-12 col-md-12 col-xl-12 col-xl-12 mt-3"
               style={{fontSize: 24}}>
                <label className="" htmlFor="nombreCliente">Total: </label>
                <strong id="totalAbono">{fromNumberToMoney(abonoTotal)}</strong>
              </div>
            </div>
            
          
        </div>
    
        //   <button onClick={datatos}>lets do it</button>
        // </>
  )
  
}

export default Abonos
