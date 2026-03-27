import $ from 'jquery';

import { callApi, IP_URL } from "./api";
import { moneyformat, separadorDeMiles, formatMoneyInput } from "./utils.js";

const hiddenInput = typeof document !== "undefined"  document.querySelector('#metodoPago') : null;
const errorMessage = typeof document !== "undefined"  document.querySelector('.error-message') : null;

export async function obtenerInfoArticulo(value) {
  const req = await callApi(`articuloInfo/${value}`);
  console.log(req.data);
  return req.data;
}

const initVentasUi = async () => {
  if (typeof window === "undefined") return;
  await import('selectize');

  const medioDePago = $('#medioDePago').selectize();

  const usuario = $('#cedula').selectize({
    create: true,
    createOnBlur: true,
    sortField: null,
    persist: false,
    allowEmptyOption: true,
    maxItems: 1,
    maxOptions: 10,
  });

  const precio_articulo = $("#precio_articulo");
  const cantidadArticulo = $("#cantidadArticulo");
  const descuentoArticulo = $("#descuentoArticulo");
  const totalArticulo = $("#totalArticulo");
  const tipoDescuentoArticulo = $("#tipoDescuentoArticulo");
  const imageArticulo = $(`#imageArticulo`);

  const articulo = $('#articulo').selectize({
    onChange: async function(value) {
      if (value != '') {
        const data = await obtenerInfoArticulo(value);
        precio_articulo.val(moneyformat(data.precio));
        cantidadArticulo.prop('disabled', false);
        calculateTotalArticle();
        imageArticulo.attr("src", `${IP_URL()}/media/${data.fotos[0].foto}`);
      } else {
        cantidadArticulo.prop('disabled', true);
        imageArticulo.attr("src", ``);
      }
    }
  });

  descuentoArticulo.on("input", function() {
    descuentoArticulo.val(separadorDeMiles(descuentoArticulo.val()));
  });

  precio_articulo.on('input', function () {
    precio_articulo.val(formatMoneyInput(precio_articulo.val()));
  });

  async function calculateTotalArticle() {
    if (tipoDescuentoArticulo.val() != "porcentaje") {
      totalArticulo.val(
        moneyformat(
          precio_articulo.val().replace(/\D/g, "") * cantidadArticulo.val() -
          descuentoArticulo.val().replace(/\D/g, "")
        )
      );
    } else {
      totalArticulo.val(
        moneyformat(
          precio_articulo.val().replace(/\D/g, "") * cantidadArticulo.val() -
          (precio_articulo.val().replace(/\D/g, "") * cantidadArticulo.val() * descuentoArticulo.val().replace(/\D/g, "") / 100)
        )
      );
    }

    calcularTotales();
  }

  $('#descuentoArticulo, #precio_articulo, #cantidadArticulo').on('change', async function() {
    await calculateTotalArticle();
    calcularTotales();
  });
};

if (typeof window !== "undefined") {
  initVentasUi();
}

export function calcularTotales(){
  const totales = document.querySelectorAll('[id^="totalArticulo"]');

  let total = 0;
  Array.from(totales).forEach(elemento => {
    total += Number(Number(elemento.value.replace(/\D/g, "")));
  });

  $("#totalVenta").text(`${moneyformat(total)}`);
}
