// ventaForm.addEventListener('submit', async function(e) 
import $ from 'jquery';
import 'selectize';
import { swalErr, swalHtmlCreation} from "@/utils/js/sweetAlertFunctions"

import { callApiFile } from './api';
export const handleFormSubmit = async (e, formRef, usuario, empresa, iti) => {


    const hiddenInput = document.querySelector('#metodoPago');
    const errorMessage = document.querySelector('.error-message');

    e.preventDefault();
    console.log(usuario);

    console.log(usuario[0].selectize.getValue())

    const formData = new FormData(ventaForm);

    if (!hiddenInput.value) {
        e.preventDefault();
        errorMessage.style.display = 'block';
    }

    let cliente_id = usuario[0].selectize.getValue()
    let empresaID = empresa[0].selectize.getValue() 
    console.log(cliente_id) //formData.get('cliente_id');
    let factura = formData.get('factura');
    let precio = formData.get('precio');
    let abono = formData.get('abono');
    let metodoPago = formData.get('metodoPago');

    

    // extraer el texto del selector del medio de pago
    let medioDePago = document.querySelector('#valorSelect');
    // var index = medioDePago.value //selectedIndex;

    var medioDePagoText = document.querySelector('#valorSelect').innerHTML
        // var medioDePagoText = medioDePago.options[index].text;


    const precioArticulo = formData.getAll('precioArticulo');
    const totalArticulo =  formData.getAll('totalArticulo'); // Esto puede ser un array o un string dependiendo del envío



// Convierte los valores a números sin formato
    const precioArticulos = precioArticulo.map(valor => {
        return fromMoneyToText(valor);
    });

    const totalArticulos = totalArticulo.map(valor => {
        return fromMoneyToText(valor);
    });

    //console.log(preciosArticulos)

    precio = fromMoneyToText(precio)
    abono = fromMoneyToText(abono)
    const total = fromMoneyToText($("#totalVenta").text());

    const indicativo = document.querySelector('.iti__a11y-text')
    
    console.log(iti.current?.getInstance().getNumber())
    formData.set('telefonocliente', iti.current?.getInstance().getNumber().slice(1))
    formData.set('precio', precio)
    formData.set('abono', abono)
    formData.set('total', total)
    formData.set('EmpresaCliente', empresaID)

    formData.delete('precioArticulo');
    formData.delete('totalArticulo');
    
    precioArticulos.forEach(valor => {
        console.log(valor)
        formData.append('precioArticulo', valor); // Reasigna los valores limpios
    });

    totalArticulos.forEach(valor => {
        console.log(valor)
        formData.append('totalArticulo', valor); // Reasigna los valores limpios
    });


    if (!cliente_id) {
        swalErr("Ingrese la cedula del cliente");
        return
    }

    if (precio == 0) {
        swalErr("Ingrese un precio");
        return
    }

    if (!medioDePago) {
        swalErr("Ingrese un medio de pago.");
        return
    }

    if (abono > precio) {
        swalErr("El abono no puede ser mayor al precio.");
        return
    }

    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    const req = await callApiFile('venta/', {
        method: 'POST',
        body: formData, //JSON.stringify(Object.fromEntries(formData)),
    });

    console.log(req.res);
    console.log(req.data);

    // swalconfirmationAndReload('Se creo la factura #\n a nombre de daniel')
    await swalHtmlCreation(`Se creo factura: ${factura} <br>Cedula cilente: ${separadorMiles(cliente_id)}<br>Precio: ${moneyformat(total)} <br>Medio de pago: ${medioDePagoText}`)

    almacenarInputs()
    
}
//);
