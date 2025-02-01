import $ from 'jquery';
import 'selectize';

import { callApi, IP_URL } from "./api";
// import { hiddenInput,errorMessage } from "./selectwithImage";
// import { usuario } from "./selectizeElements";
import { moneyformat, separadorDeMiles, formatMoneyInput } from "./utils.js";

// if (typeof document === "undefined") {
//   return null; // Si se ejecuta en SSR, no hay cookies disponibles
// }else {
  
// }

//import { moneyformat } from "./utils.js";

const hiddenInput = document.querySelector('#metodoPago');
const errorMessage = document.querySelector('.error-message');



export async function obtenerInfoArticulo(value) {
    const req = await callApi(`articuloInfo/${value}`)
    console.log(req.data)
    
    return req.data
  }

// export async function ejecutarSelectize(){

  const medioDePago = $('#medioDePago').selectize();

  const usuario = $('#cedula').selectize({
    create: true,
    createOnBlur: true,       // Crea el valor cuando el input pierde el foco
    sortField: null,        // Ordena las opciones por texto, pero esto se modificará dinámicamente
    persist: false, // No persiste las opciones creadas si no están seleccionadas
    allowEmptyOption: true, // Permite un campo vacío
    maxItems: 1,
    maxOptions: 10,
  })

  const precioArticulo = $("#precioArticulo");
  const cantidadArticulo = $("#cantidadArticulo");
  const descuentoArticulo = $("#descuentoArticulo");
  const totalArticulo = $("#totalArticulo");
  const tipoDescuentoArticulo = $("#tipoDescuentoArticulo");
  const imageArticulo = $(`#imageArticulo`);
  /*
  tipoDescuentoArticulo.on("change", function(){
    if (tipoDescuentoArticulo.val() != "precio"){
      descuentoArticulo.removeClass('precio')
    } else {
      descuentoArticulo.addClass('precio')
    }
  })
  */


  const articulo = $('#articulo').selectize({
    onChange: async function(value) {
      // console.log(value)
      
      if (value != ''){
        const data = await obtenerInfoArticulo(value);
        precioArticulo.val(moneyformat(data.precio))
        cantidadArticulo.prop('disabled', false);
        calculateTotalArticle()
        imageArticulo.attr("src", `${IP_URL()}/media/${data.fotos[0].foto}`);
      } else{
        cantidadArticulo.prop('disabled', true);
        imageArticulo.attr("src", ``);
      }

    }
  })

  descuentoArticulo.on("input", function() {
    // console.log("ejecutado")
    descuentoArticulo.val(separadorDeMiles(descuentoArticulo.val()));
  });

  precioArticulo.on('input', function () {
    precioArticulo.val(formatMoneyInput(precioArticulo.val())) 
  })

  

async function calculateTotalArticle() {
    if (tipoDescuentoArticulo.val() != "porcentaje"){
    totalArticulo.val(moneyformat(precioArticulo.val().replace(/\D/g, "") * cantidadArticulo.val() - descuentoArticulo.val().replace(/\D/g, "")))
    } else {
      totalArticulo.val(moneyformat(precioArticulo.val().replace(/\D/g, "") * cantidadArticulo.val() - (precioArticulo.val().replace(/\D/g, "") * cantidadArticulo.val() * descuentoArticulo.val().replace(/\D/g, "")/100)))
    }

    calcularTotales()
  }



  $('#descuentoArticulo, #precioArticulo, #cantidadArticulo').on('change',async function() {
    await calculateTotalArticle()
    calcularTotales()
    
  });

// }

export function calcularTotales(){
  const totales = document.querySelectorAll('[id^="totalArticulo"]');

  let total = 0
  Array.from(totales).forEach(elemento => {
    //console.log(elemento.value)
      total += Number(Number(elemento.value.replace(/\D/g, "")))
      //console.log(total)
      //return elemento.value
  })

  //console.log(total)

  $("#totalVenta").text(`${moneyformat(total)}`)
  
}




/*------------------------------------------------------------------*/


// const ventaForm = document.querySelector('#ventaForm');
// const submitVenta = document.querySelector('#submitVenta');
// const cedula = document.querySelector('#cedula');
// const nombreCliente = document.querySelector('#nombreCliente');
// const apellidoCliente = document.querySelector('#apellidoCliente');
// const telefonoCliente = document.querySelector('#telefonoCliente');

// window.addEventListener('load', function() {

//     cedula.focus();
// });



//         // console.log("IntlTelInput inicializado:", iti);
//     // }
// ventaForm.addEventListener('submit', async function(e) {
//     e.preventDefault();

//     const formData = new FormData(ventaForm);

//     if (!hiddenInput.value) {
//         e.preventDefault();
//         errorMessage.style.display = 'block';
//     }

//     let cliente_id = usuario[0].selectize.getValue()
//     console.log(cliente_id) //formData.get('cliente_id');
//     let factura = formData.get('factura');
//     let precio = formData.get('precio');
//     let abono = formData.get('abono');
//     let metodoPago = formData.get('metodoPago');

    

//     // extraer el texto del selector del medio de pago
//     let medioDePago = document.querySelector('#valorSelect');
//     // var index = medioDePago.value //selectedIndex;

//     var medioDePagoText = document.querySelector('#valorSelect').innerHTML
//         // var medioDePagoText = medioDePago.options[index].text;


//     const precioArticulo = formData.getAll('precioArticulo');
//     const totalArticulo =  formData.getAll('totalArticulo'); // Esto puede ser un array o un string dependiendo del envío



// // Convierte los valores a números sin formato
//     const precioArticulos = precioArticulo.map(valor => {
//         return fromMoneyToText(valor);
//     });

//     const totalArticulos = totalArticulo.map(valor => {
//         return fromMoneyToText(valor);
//     });

//     //console.log(preciosArticulos)

//     precio = fromMoneyToText(precio)
//     abono = fromMoneyToText(abono)
//     const total = fromMoneyToText($("#totalVenta").text());

//     const indicativo = document.querySelector('.iti__a11y-text')

//     formData.set('telefonocliente', iti.getNumber().slice(1))
//     formData.set('precio', precio)
//     formData.set('abono', abono)
//     formData.set('total', total)

//     formData.delete('precioArticulo');
//     formData.delete('totalArticulo');
    
//     precioArticulos.forEach(valor => {
//         console.log(valor)
//         formData.append('precioArticulo', valor); // Reasigna los valores limpios
//     });

//     totalArticulos.forEach(valor => {
//         console.log(valor)
//         formData.append('totalArticulo', valor); // Reasigna los valores limpios
//     });


//     if (!cliente_id) {
//         swalErr("Ingrese la cedula del cliente");
//         return
//     }

//     if (precio == 0) {
//         swalErr("Ingrese un precio");
//         return
//     }

//     if (!medioDePago) {
//         swalErr("Ingrese un medio de pago.");
//         return
//     }

//     if (abono > precio) {
//         swalErr("El abono no puede ser mayor al precio.");
//         return
//     }

//     for (let [key, value] of formData.entries()) {
//         console.log(`${key}:`, value);
//     }

//     const req = await callApiFile('venta/', {
//         method: 'POST',
//         body: formData, //JSON.stringify(Object.fromEntries(formData)),
//     });

//     console.log(req.res);
//     console.log(req.data);

//     // swalconfirmationAndReload('Se creo la factura #\n a nombre de daniel')
//     await swalHtmlCreation(`Se creo factura: ${factura} <br>Cedula cilente: ${separadorMiles(cliente_id)}<br>Precio: ${moneyformat(total)} <br>Medio de pago: ${medioDePagoText}`)

//     almacenarInputs()
    
// });


// cedula.addEventListener('blur', async() => {
    

//     const id = cedula.value
//     if (id == ''){
//         return
//     }
//     console.log(id)
//     const url = `usuarios/infoCliente/${id}`
//     console.log(url)
//     const req = await callApi(url);

//     if (req.res.status != 200) {
//         return
//     }

//     nombreCliente.value = req.data[0].nombre;
//     //apellidoCliente.value = req.data[0].apellido;
//     telefonoCliente.value = req.data[0].telefono;

//     nombreCliente.readOnly = true;
//     //apellidoCliente.readOnly = true;
//     telefonoCliente.readOnly = true;

//     nombreCliente.style.borderBottom = '5px solid green';
//     //apellidoCliente.style.borderBottom = '5px solid green';
//     telefonoCliente.style.borderBottom = '5px solid green';


//     console.log(req.res.status);
//     console.log(req.data);
// })