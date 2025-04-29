'use client';
import React from 'react'
import { useEffect,useState, useRef  } from 'react';

import "intl-tel-input/build/css/intlTelInput.css";
import '@/styles/selectizeTable.css';
// import "selectize/dist/js/standalone/selectize.min.js";
// import "selectize/dist/css/selectize.css";
import { callApi, IP_URL } from "@/utils/js/api";
import { addRow } from "@/utils/js/tablaArticulos.js"
import { ejecutarSelectize } from "@/utils/js/selectizeElements"
import ("@/utils/js/ventas");
import { obtenerInfoArticulo } from '@/utils/js/ventas';
import { executeUtils, moneyformat, formatMoneyInput, separadorDeMiles, fromNumberToMoney, fromMoneyToText } from '@/utils/js/utils.js';

import $ from 'jquery';
import 'selectize';

function TablaArticulos({articulos}) {
  const [ventaTotal, setVentaTotal] = useState(0);
  const selectRefs = useRef([]);
    const [rows, setRows] = useState([[{
      precio: '$ 0',
      total: '$ 0',
    }]]);
  // const = 
  const [utilsLoaded, setUtilsLoaded] = useState(false);

    const datatos = async () => {
        const req =  await fetch("http://localhost:8000/articuloInfo/1");
        const data = await req.json();
    
        console.log(data)
    }

    // function calcularTotales2(){
    //   const totales = document.querySelectorAll('[id^="totalArticulo"]');
    //   console.log(totales)
  
    //   let total = 0
    //   Array.from(totales).forEach(elemento => {
    //       total += Number(Number(elemento.value.replace(/\D/g, "")))

    //   })
  
    //   //console.log(total)
  
    //   $("#totalVenta").text(`${moneyformat(total)}`)
    //   // setVentaTotal(moneyformat(total))
    // }

    

    function calcularTotales(){
        const totales = document.querySelectorAll('[id^="totalArticulo"]');
        console.log(totales)
    
        let total = 0
        Array.from(totales).forEach(elemento => {
            total += Number(Number(elemento.value.replace(/\D/g, "")))

        })
    
        //console.log(total)
    
        $("#totalVenta").text(`${moneyformat(total)}`)
        // setVentaTotal(moneyformat(total))
      }

    const initializeSelectize = (index) => {
      const precio_articulo = $(`#precio_articulo-${index}`);
      const cantidadArticulo = $(`#cantidadArticulo-${index}`);
      const descuentoArticulo = $(`#descuentoArticulo-${index}`);
      const totalArticulo = $(`#totalArticulo-${index}`);
      const tipoDescuentoArticulo = $(`#tipoDescuentoArticulo-${index}`);
      const imageArticulo = $(`#imageArticulo-${index}`);

      const selectElement = selectRefs.current[index];

      
      async function calculateTotalArticle() {
        console.log(tipoDescuentoArticulo.val())
        if (tipoDescuentoArticulo.val() != "porcentaje"){
        totalArticulo.val(moneyformat(precio_articulo.val().replace(/\D/g, "") * cantidadArticulo.val() - descuentoArticulo.val().replace(/\D/g, "")))
        } else {
          totalArticulo.val(moneyformat(precio_articulo.val().replace(/\D/g, "") * cantidadArticulo.val() - (precio_articulo.val().replace(/\D/g, "") * cantidadArticulo.val() * descuentoArticulo.val().replace(/\D/g, "")/100)))
        }
    
        calcularTotales()
      }
  
      if (selectElement) {

        $(selectElement).selectize({
          hideSelected: true,
          onChange: async function (value) {
            if (value != 'Seleccione') {
              const data = await obtenerInfoArticulo(value);
              // Actualizar directamente los valores en la tabla
              precio_articulo.val(formatMoneyInput(`$ ${data.precio}`));
              totalArticulo.val(`$ ${data.precio}`);
              cantidadArticulo.prop('disabled', false);
              data.fotos.length > 0 ? imageArticulo.attr("src", `${IP_URL()}/media/${data.fotos[0].foto}`) : '' ;
              await calculateTotalArticle()
              calcularTotales()
            } else{
              cantidadArticulo.prop('disabled', true);
              imageArticulo.attr("src", ``);
              precio_articulo.val('$ 0');
            }
          }
        });
      }

      
    
      precio_articulo.on('input', function () {
        precio_articulo.val(formatMoneyInput(precio_articulo.val())) 
      })

      descuentoArticulo.on("input", function() {
        // console.log("ejecutado")
        descuentoArticulo.val(separadorDeMiles(descuentoArticulo.val()));
      });

      

      $(`#descuentoArticulo-${index}, #precio_articulo-${index}, #cantidadArticulo-${index}`).on('change',async function() {
          await calculateTotalArticle()
          calcularTotales()
          
        });
    };

    const addArticulo = () => {
      // Añadir una fila vacía al estado
      setRows(prevRows => [...prevRows, { 
        precio: '$ 0',
        total: '$ 0', 
      }]);
    }

    const handleDeleteRow = (index) => {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
  
      // Actualizar el total después de eliminar la fila
      // setVentaTotal(
      //   newRows.reduce((acumulador, item) => acumulador + fromMoneyToText(item.total), 0)
      // );
      // calcularTotales2()
    };

    
    

    useEffect(()=>{
        //import( "bootstrap/dist/js/bootstrap.bundle.js");
        
        const loadUtils = async () => {

          // const getCookie = await import('@/utils/js/getCookie.js');
          
          // const utils = await import('@/utils/js/utils.js');
          // const api = await import('@/utils/js/api.js');
          // const intl = await import ("@/utils/js/intlInput.js");
          
          // await import ("@/utils/js/selectwithImage.js");
          
          await import ("@/utils/js/selectizeElements.js");
          // // const selectize = await import ("selectize/dist/js/standalone/selectize.min.js");
          // await import ("@/utils/js/imagenesInputs.js");
          // await import ("@/utils/js/ventas.js");
         
        };

        

        
        loadUtils();
        executeUtils();
        
    },[])

    useEffect(() => {
      if (rows.length > 0) {
        initializeSelectize(rows.length - 1);
      }
      calcularTotales()
    }, [rows]);

    
  return (
    <>
    <div className="container mw-100 my-2">
      <h2 className="mb-4">Articulos</h2>
      
        <div className="table-responsive" style={{overflowX: 'visible'}}>
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Articulo</th>
                <th>Imagen</th>
                <th style={{width: "10%"}}>cantidad</th>
                <th>Precio_und</th>
                <th>tipo descuento</th>
                <th>descuento</th>
                <th>Total $</th>
                </tr>
            </thead>
            <tbody>
            {rows.map((row, index) => (
              <tr>
                <td className="bg-secondary-subtle">{index+1}</td>
                <td className="" style={{width: '25%'}}>
                  <select 
                    ref={(el) => (selectRefs.current[index] = el)}
                    className="form-select border-0"
                    // onChange={obtenerInfoArticulo(this.key)}
                    name="numero_articulo" 
                    // id="articulo"
                    id={`articulo-${index}`}
                  >
                    <option key="" value="">Seleccione</option>
                    {
                      articulos.map(element => (
                        <option 
                          key={element.id}
                          value={element.id}
                        >{element.nombre}
                        </option>
                      ))
                    }
                  </select>
                </td>
                <td>
                  <img 
                  // id="imageArticulo" 
                  id={`imageArticulo-${index}`}
                  src="" 
                  height={35} />
                </td>
                <td className="">
                  <input 
                    type="number" 
                    className="form-control border-0" 
                    // id="cantidadArticulo"
                    id={`cantidadArticulo-${index}`} 
                    name="cantidad" 
                    placeholder="Cantidad" 
                    defaultValue={1}
                    
                    // onInput={calcularTotales}
                    disabled 
                  />
                </td>
                <td className="">
                  <input 
                    type="text"
                    className="form-control border-0 precio"
                    // id="precio_articulo"
                    id={`precio_articulo-${index}`}
                    name="precio_articulo"
                    step={1000}
                    placeholder="Precio"
                    defaultValue="$ 0" 
                  />
                </td>
                <td className="">
                  <select 
                    className="form-select border-0"
                    // id="tipoDescuentoArticulo"
                    id={`tipoDescuentoArticulo-${index}`}
                    name="tipo_descuento"
                    defaultValue="precio"
                  >
                    <option value="">Seleccione</option>
                    <option value="porcentaje">porcentaje %</option>
                    <option value="precio" >precio $</option>
                  </select>
                </td>
                <td className="">
                  <input 
                    type="text" 
                    className="form-control border-0 numerico" 
                    id={`descuentoArticulo-${index}`} 
                    name="descuento" 
                    placeholder="% Descuento" 
                    defaultValue={0}
                  />
                </td>
                <td className="">
                  <input 
                    type="text" 
                    className="form-control" 
                    // id="totalArticulo" 
                    id={`totalArticulo-${index}`}
                    name="totalArticulo" 
                    placeholder="Total" 
                    readOnly 
                    defaultValue={0} 
                  />
                </td>
                <box-icon type='solid' onClick={() => handleDeleteRow(index)} size="md" name='trash' style={{ display: "table-cell", width: "4.2%"}} color="red" ></box-icon>
              </tr> 
            ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between">
          <button type="button" className="btn btn-primary" onClick={addArticulo}>
            Agregar Fila
          </button>
          {/* <button type="submit" className="btn btn-success">Enviar</button> */}
          <div 
            // className="d-flex justify-content-end col-sm-12 col-md-12 col-xl-12 col-xl-12 mt-1"
             style={{fontSize: 24}}>
            <label className="" htmlFor="nombreCliente">Total: </label>
            <strong id="totalVenta">{fromNumberToMoney(ventaTotal)}</strong>
          </div>
        </div>
        
      
    </div>

      {/* <button onClick={datatos}>lets do it</button> */}
    </>
  )
}

export default TablaArticulos
