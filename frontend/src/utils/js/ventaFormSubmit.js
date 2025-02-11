// ventaForm.addEventListener('submit', async function(e) 
import $ from 'jquery';
import 'selectize';
import { swalErr, swalHtmlCreation, swalHtml} from "@/utils/js/sweetAlertFunctions"


import { callApiFile } from './api';
import { 
    fromMoneyToText,
    separadorMiles,
    moneyformat,
    almacenarInputs,
    convertirSeparadorMilesANumero 
} from './utils';

function agregarArrayAFormData(formData, fieldName, values, useIndex = false, separator = ',') {
    if (useIndex) {
      // Agrega cada valor con un índice (ej: campo[0], campo[1], etc.)
      formData.delete(`${fieldName}`)
      values.forEach((value, index) => {
        formData.append(`${fieldName}`, value);
      });
    } else {
      // Agrega todos los valores en un solo campo, separados por el separador
      
      const joinedValues = values.join(separator);
      formData.append(`${fieldName}`, joinedValues);
    }
  }

function transformarArray(array, transformFn) {
    return array.map(transformFn);
}

function contieneValorVacio(array) {
    return array.some(valor => valor.trim() === "");
}

function eliminarElementosFormData(formData, tags) {
    tags.forEach((value, index) => {
        formData.delete(`${value}`)
      });

    // return nuevoFormData;
}

export const handleFormSubmit = async (e, formRef, usuario, empresa, iti) => {

    e.preventDefault();
    const formData = new FormData(formRef.current);

    
    let cliente_id = usuario[0].selectize.getValue()
    let empresaID = empresa[0].selectize.getValue() 
    console.log(cliente_id) //formData.get('cliente_id');
    let factura = formData.get('factura');
    let precio = formData.get('precio');
    // let abono = formData.get('abono');
    // let metodoPago = formData.get('metodoPago');

    

    // extraer el texto del selector del medio de pago
    // let medioDePago = document.querySelector('#valorSelect');
    // var index = medioDePago.value //selectedIndex;

    // var medioDePagoText = document.querySelector('#valorSelect').innerHTML
        // var medioDePagoText = medioDePago.options[index].text;


    const precioArticulo = formData.getAll('precioArticulo');
    const totalArticulo =  formData.getAll('totalArticulo');
    const precioAbono = formData.getAll("precioAbono");
    const descuento = formData.getAll("descuento");
    
    const arrayPrueba = transformarArray(precioArticulo, fromMoneyToText)   // Esto puede ser un array o un string dependiendo del envío
    console.log(arrayPrueba)

    const precioArticulos = transformarArray(precioArticulo, fromMoneyToText)
    const totalArticulos = transformarArray(totalArticulo, fromMoneyToText)
    const precioAbonos = transformarArray(precioAbono, fromMoneyToText)
    const descuentos = transformarArray(descuento, convertirSeparadorMilesANumero)



    const total = fromMoneyToText($("#totalVenta").text());
    const totalAbono = fromMoneyToText($("totalVenta").text());
    const metodoPago = formData.getAll("metodoPago")
    const numero_articulo = formData.getAll("numero_articulo")
    const cantidad = formData.getAll("cantidad")
    const tipo_descuento = formData.getAll("tipo_descuento")
    const descripcionAbono = formData.getAll("descripcionAbono")

    console.log(numero_articulo)
    console.log(metodoPago)
    // numero_articulo
    
    formData.set('total', total)
    formData.set('totalAbono', totalAbono)
    formData.set('EmpresaCliente', empresaID)

    

    
    agregarArrayAFormData(formData, 'descuento', descuentos, true);
    agregarArrayAFormData(formData, 'precioArticulo', precioArticulos, true);
    agregarArrayAFormData(formData, 'totalArticulo', totalArticulos, true);

    agregarArrayAFormData(formData, 'precioAbono', precioAbonos, true);

    eliminarElementosFormData(formData, ['descuento', 'precioArticulo', 'totalArticulo', 'tipo_descuento', 'cantidad', 'numero_articulo'])
    eliminarElementosFormData(formData, ['metodoPago', 'descripcionAbono', 'precioAbono', ])

    const articulos = numero_articulo.map((numeroArticulo, index) => {
        return {
            numero_articulo: numeroArticulo,
            cantidad: cantidad[index],
            precioArticulo: precioArticulos[index],
            tipo_descuento: tipo_descuento[index],
            descuentos: descuentos[index],
            totalArticulo:  totalArticulos[index],//formData.getAll("totalArticulo")[index]
        };
    });

    const abono = metodoPago.map((metodo_Pago, index) => {
        return {
            metodoPago: metodo_Pago,
            descripcionAbono: descripcionAbono[index],
            precioAbono: precioAbonos[index],

        };
    });

    formData.set('venta', JSON.stringify(articulos))
    formData.set('abonos', JSON.stringify(abono))
    
    console.log(JSON.stringify(articulos));


    if (!cliente_id) {
        swalErr("Ingrese la cedula del cliente");
        return
    }

    if (precio == 0) {
        await swalErr("Ingrese un precio");
        return
    }  

    if (contieneValorVacio(numero_articulo)) {
        await swalErr("Hay Articulos sin ingresar.");
        return
    }

    if (contieneValorVacio(metodoPago)) {
        await swalErr("Ingrese un medio de pago.");
        return
    }

    

    if (totalAbono > total) {
        await swalErr("El abono no puede ser mayor al precio.");
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

    if (req.res.status != 200) {
        await swalHtml('Error', req.data)
        return
    }

    // swalconfirmationAndReload('Se creo la factura #\n a nombre de daniel')
    await swalHtmlCreation(`Se creo factura: ${factura} <br>Cedula cilente: ${separadorMiles(cliente_id)}<br>Precio: ${moneyformat(total)} <br>
        
        `)
        // Medio de pago: ${medioDePagoText}

    almacenarInputs()
    
}
//);




// export const oldhandleFormSubmit = async (e, formRef, usuario, empresa, iti) => {


//     const hiddenInput = document.querySelector('#metodoPago');
//     const errorMessage = document.querySelector('.error-message');

//     e.preventDefault();
//     console.log(usuario);

//     console.log(usuario[0].selectize.getValue())

//     formRef

//     const formData = new FormData(formRef.current);

//     // if (!hiddenInput.value) {
//     //     e.preventDefault();
//     //     errorMessage.style.display = 'block';
//     // }

//     let cliente_id = usuario[0].selectize.getValue()
//     let empresaID = empresa[0].selectize.getValue() 
//     console.log(cliente_id) //formData.get('cliente_id');
//     let factura = formData.get('factura');
//     let precio = formData.get('precio');
//     // let abono = formData.get('abono');
//     // let metodoPago = formData.get('metodoPago');

    

//     // extraer el texto del selector del medio de pago
//     // let medioDePago = document.querySelector('#valorSelect');
//     // var index = medioDePago.value //selectedIndex;

//     // var medioDePagoText = document.querySelector('#valorSelect').innerHTML
//         // var medioDePagoText = medioDePago.options[index].text;


//     const precioArticulo = formData.getAll('precioArticulo');
//     const totalArticulo =  formData.getAll('totalArticulo');
    
//     const arrayPrueba = transformarArray(precioArticulo, fromMoneyToText)   // Esto puede ser un array o un string dependiendo del envío
//     console.log(arrayPrueba)

//     const precioArticulos = transformarArray(precioArticulo, fromMoneyToText)
//     const totalArticulos = transformarArray(totalArticulo, fromMoneyToText)
    

// // Convierte los valores a números sin formato
//     // const precioArticulos = precioArticulo.map(valor => {
//     //     return fromMoneyToText(valor);
//     // });
//     // console.log(precioArticulos)
//     // const totalArticulos = totalArticulo.map(valor => {
//     //     return fromMoneyToText(valor);
//     // });

//     //console.log(preciosArticulos)

//     // precio = fromMoneyToText(precio)
//     // abono = fromMoneyToText(abono)
//     const total = fromMoneyToText($("#totalVenta").text());

//     const indicativo = document.querySelector('.iti__a11y-text')
    
//     // console.log(iti.current?.getInstance().getNumber())
//     // formData.set('telefonocliente', iti.current?.getInstance().getNumber().slice(1))
//     // formData.set('precio', precio)
//     // formData.set('abono', abono)
//     formData.set('total', total)
//     formData.set('EmpresaCliente', empresaID)

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

//     // precioAbono

//     agregarArrayAFormData(formData, 'prueba', formData.getAll('precioAbono'), true);


//     if (!cliente_id) {
//         swalErr("Ingrese la cedula del cliente");
//         return
//     }

//     if (precio == 0) {
//         swalErr("Ingrese un precio");
//         return
//     }

//     // if (!medioDePago) {
//     //     swalErr("Ingrese un medio de pago.");
//     //     return
//     // }

//     // if (abono > precio) {
//     //     swalErr("El abono no puede ser mayor al precio.");
//     //     return
//     // }

//     for (let [key, value] of formData.entries()) {
//         console.log(`${key}:`, value);
//     }

//     const req = await callApiFile('venta/', {
//         method: 'POST',
//         body: formData, //JSON.stringify(Object.fromEntries(formData)),
//     });

//     console.log(req.res);
//     console.log(req.data);

//     if (req.res.status != 200) {
//         await swalHtml('Error', req.data)
//         return
//     }

//     // swalconfirmationAndReload('Se creo la factura #\n a nombre de daniel')
//     await swalHtmlCreation(`Se creo factura: ${factura} <br>Cedula cilente: ${separadorMiles(cliente_id)}<br>Precio: ${moneyformat(total)} <br>
        
//         `)
//         // Medio de pago: ${medioDePagoText}

//     almacenarInputs()
    
// }
//);
