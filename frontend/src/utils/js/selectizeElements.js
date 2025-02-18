import $ from 'jquery';
import 'selectize';

import { callApi, IP_URL } from "./api";

async function obtenerInfoArticulo(value) {
    const req = await callApi(`articuloInfo/${value}`)
    console.log(req.data)
    
    return req.data
  }


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
  const precio_articulo = $("#precio_articulo");
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
        precio_articulo.val(moneyformat(data.precio))
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

  precio_articulo.on('input', function () {
    precio_articulo.val(formatMoneyInput(precio_articulo.val())) 
  })

  

async function calculateTotalArticle() {
    if (tipoDescuentoArticulo.val() != "porcentaje"){
    totalArticulo.val(moneyformat(precio_articulo.val().replace(/\D/g, "") * cantidadArticulo.val() - descuentoArticulo.val().replace(/\D/g, "")))
    } else {
      totalArticulo.val(moneyformat(precio_articulo.val().replace(/\D/g, "") * cantidadArticulo.val() - (precio_articulo.val().replace(/\D/g, "") * cantidadArticulo.val() * descuentoArticulo.val().replace(/\D/g, "")/100)))
    }

    calcularTotales()
  }

function calcularTotales(){
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

  $('#descuentoArticulo, #precio_articulo, #cantidadArticulo').on('change',async function() {
    await calculateTotalArticle()
    calcularTotales()
    
  });