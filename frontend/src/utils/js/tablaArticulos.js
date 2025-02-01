import $ from 'jquery';
import 'selectize'; 
// Asegúrate de que jQuery esté cargado primero


// const selectize = dynamic(() => import('selectize'), { ssr: false });


import { callApi, IP_URL } from '@/utils/js/api';
// import { obtenerInfoArticulo  } from "@/utils/js/selectizeElements";
import { moneyformat, separadorDeMiles, formatMoneyInput  } from "./utils.js";
import { calcularTotales, obtenerInfoArticulo } from "./ventas.js";



export async function addRow() {

  const table = document.querySelector("table tbody");
  const row = document.createElement("tr");

  const numeroFila = table.rows.length;

  const articulos = await callApi("articulos/");
  console.log(articulos);
  row.innerHTML = `
        <td class="bg-secondary-subtle">${numeroFila + 1}</td>
        <td class="" style="width: 25%">
            <select class="form-select border-0" id="articulo${numeroFila}" name="numero_articulo" id="articulo${numeroFila? numeroFila + 1 : 1}">
                <option value="">Seleccione</option>
                ${articulos.data.articulos.map(
                  (item) => `         
                    <option value="${item.id}" >${item.nombre}</option>
                `
                )}
            </select>
        </td>
        <td ><img id="imageArticulo${numeroFila}" height="35" src="" /> </td>
        <td class=""><input type="number" class="form-control " id="cantidadArticulo${numeroFila}" name="cantidad" placeholder="Cantidad" value="1" disabled></td>
        <td><input type="text" class="form-control precio" id="precioArticulo${numeroFila}" name="precioArticulo" placeholder="Precio" step="1000"></td>
        <td>
            <select class="form-select" id="tipoDescuentoArticulo${numeroFila}" name="indicador_impuestos">
                <option value="">Seleccione</option>
                <option value="porcentaje">porcentaje %</option>
                <option value="precio" selected>precio $</option>
            </select>
        </td>
        <td class="">
              <input
                type="text"
                class="form-control border-0"
                id="descuentoArticulo${numeroFila}"
                name="descuento"
                placeholder="% Descuento"
                
              />
            </td>
        
        
        <td><input type="text" class="form-control" id="totalArticulo${numeroFila}"  name="totalArticulo" placeholder="Total" value="0" readonly></td>
        
    `;
  table.appendChild(row);


  
  
  const precioArticuloTable = $(`#precioArticulo${numeroFila}`);
  const cantidadArticuloTable = $(`#cantidadArticulo${numeroFila}`);
  const descuentoArticuloTable = $(`#descuentoArticulo${numeroFila}`);
  const totalArticuloTable = $(`#totalArticulo${numeroFila}`);
  const tipoDescuentoArticuloTable = $(`#tipoDescuentoArticulo${numeroFila}`);
  const imageArticuloTable = $(`#imageArticulo${numeroFila}`);


  precioArticuloTable.on('input', function () {
    precioArticuloTable.val(formatMoneyInput(precioArticuloTable.val())) 
  })

  
  descuentoArticuloTable.on("input", function() {
      // console.log("ejecutado")
      descuentoArticuloTable.val(separadorDeMiles(descuentoArticuloTable.val()));
  });


  /*
  precioArticuloTable.on('change', function () {
    precioArticuloTable.val(fromTextToMoney(precioArticuloTable.val())) 
  })
  */

  const selectorArticuloRow = $(`#articulo${numeroFila}`).selectize({
    onChange: async function(value) {

      if (value != ''){
        const data = await obtenerInfoArticulo(value);

        console.log(data);

        precioArticuloTable.val(moneyformat(data.precio))
        cantidadArticuloTable.prop('disabled', false);
        calculateTotalArticleTable()
        imageArticuloTable.attr("src", `${IP_URL()}/media/${data.fotos[0].foto}`);
      } else{
        cantidadArticuloTable.prop('disabled', true);
        imageArticuloTable.attr("src", ``);
      }

      

      // $0.src= '/media/fotos_articulos/D_NQ_NP_944070-MCO53184551951_012023-O.jpg'

      // ${BASE_URL+"/"+ articulos.data.fotos[0].foto}
    }
  })

  

  async function calculateTotalArticleTable() {

    // console.log("totalizado")

    const precio = precioArticuloTable.val();

    if (tipoDescuentoArticuloTable.val() != "porcentaje"){
    totalArticuloTable.val(moneyformat(precio.replace(/\D/g, "") * cantidadArticuloTable.val() - descuentoArticuloTable.val().replace(/\D/g, "")))
    } else {
      totalArticuloTable.val(moneyformat(precio.replace(/\D/g, "") * cantidadArticuloTable.val() - (precio.replace(/\D/g, "") * cantidadArticuloTable.val() * descuentoArticuloTable.val().replace(/\D/g, "")/100)))
    }

    calcularTotales()
  }


  $(`#descuentoArticulo${numeroFila}, #precioArticulo${numeroFila}, #cantidadArticulo${numeroFila}`).on('change', async function() {
    // console.log("A totalizar")
    await calculateTotalArticleTable()
    calcularTotales()
  });

  //$('.selectize-dropdown-content').style.width = '100%';
}
