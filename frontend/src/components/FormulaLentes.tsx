import React, { useEffect, useRef, useState } from 'react'
import MedioPago from './MedioPago'
import { executeUtils } from '@/utils/js/utils.js';
import { fromMoneyToText, fromNumberToMoney } from '@/utils/js/utils.js';
import 'boxicons';


function FormulaLentes({data}) {
  const [abonoTotal, setAbonoTotal] = useState(0)
  const [rows, setRows] = useState([[{
    precio: '$ 0',
    total: '$ 0',
  }]]);

    useEffect(() => {
        // const loadUtils = async () => {
        //     await import('@/utils/js/utils.js');     
        // }
        // loadUtils()
        
    }, [])

    const addMetodoPago = () => {
      // Añadir una fila vacía al estado
      setRows(prevRows => [...prevRows, { 
        precio: '$ 0',
        total: '$ 0', 
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
          <h2 className="mb-4">Formula</h2>
          
            <div className="table-responsive" style={{overflowX: 'visible'}}>
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th rowspan="2"></th>
                    <th>Ojo</th>
                    <th>Esferico</th>
                    <th>Cilindrico</th>
                    <th>Eje</th>
                    <th>Av</th>
                    </tr>
                </thead>
                <tbody>
                <tr>
                    <td className="section" rowspan="2">LEJOS</td>
                    <td>DERECHO</td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue="NEUTRO"
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue="-0.75"
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue="180°"
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue="20/20"
                    /></td>
                </tr>
                <tr>
                    <td>IZQUIERDO</td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue="NEUTRO"
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue="-0.75"
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue="20°"
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue="20/20"
                    /></td>
                </tr>
                <tr>
                    <td class="section" rowspan="2">CERCA</td>
                    <td>DERECHO</td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      // defaultValue={0}
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      // defaultValue={0}
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      // defaultValue={0}
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      // defaultValue={0}
                    /></td>
                </tr>
                <tr>
                    <td>IZQUIERDO</td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue=""
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue=""
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      defaultValue=""
                    /></td>
                    <td><input
                      className="form-control"
                      id=""
                      name=""
                      placeholder=""
                      //value={row.total}
                      // defaultValue={0}
                    /></td>
                </tr>
                
                </tbody>
              </table>
            </div>
            {/* <div className="d-flex justify-content-between">
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addMetodoPago}
                >
                    Agregar Fila
                </button>
              

              
              <div 
              // className="d-flex justify-content-end col-sm-12 col-md-12 col-xl-12 col-xl-12 mt-3"
               style={{fontSize: 24}}>
                <label className="" htmlFor="nombreCliente">Total: </label>
                <strong id="totalVenta">{fromNumberToMoney(abonoTotal)}</strong>
              </div>
            </div> */}
            
          
        </div>
    
        //   <button onClick={datatos}>lets do it</button>
        // </>
  )
  
}

export default FormulaLentes
