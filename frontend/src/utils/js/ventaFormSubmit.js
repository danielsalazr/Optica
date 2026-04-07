// ventaForm.addEventListener('submit', async function(e) 
import $ from 'jquery';
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



// const precio_articulos = transformarArrayInFormData(precio_articulo, fromMoneyToText)

function contieneValorVacio(array) {
    return array.some(valor => valor.trim() === "");
}

function eliminarElementosFormData(formData, tags) {
    tags.forEach((value, index) => {
        formData.delete(`${value}`)
      });

    // return nuevoFormData;
}

function tieneAbonoSinMedioDePago(abonos) {
    return abonos.some((item) => Number(item?.precio || 0) > 0 && !item?.medioDePago);
}

function obtenerDetalleError(errorData) {
    if (!errorData) return '';
    if (typeof errorData === 'string') return errorData;
    if (typeof errorData.detail === 'string') return errorData.detail;
    return '';
}

async function mostrarErrorVenta(errorData) {
    const detalle = obtenerDetalleError(errorData);
    const mensaje = detalle
        ? `Hubo un error y no se pudo completar la venta.<br><br><small>${detalle}</small>`
        : 'Hubo un error y no se pudo completar la venta.';
    await swalHtml('Error', mensaje);
}

function validarCondicionContado(condicionPago, compromisoPago, total, totalAbono) {
    if ((condicionPago || '').trim().toLowerCase() !== 'contado') {
        return '';
    }
    if (Number(compromisoPago || 0) !== 1) {
        return 'La condicion de pago de contado solo permite 1 cuota.';
    }
    if (Number(totalAbono || 0) !== Number(total || 0)) {
        return 'En condicion de pago de contado el abono debe ser igual al total de la compra.';
    }
    return '';
}

export const handleFormSubmit = async (e, formRef, usuario, empresa, iti) => {

    e.preventDefault();
    const formData = new FormData(formRef.current);

    
    let cliente_id = usuario[0].selectize.getValue()
    let empresaID = empresa[0].selectize.getValue() 
    console.log(cliente_id) //formData.get('cliente_id');
    let id = formData.get('id');
    let precio = formData.get('precio');
    // let abono = formData.get('abono');
    // let metodoPago = formData.get('metodoPago');

    

    // extraer el texto del selector del medio de pago
    // let medioDePago = document.querySelector('#valorSelect');
    // var index = medioDePago.value //selectedIndex;

    // var medioDePagoText = document.querySelector('#valorSelect').innerHTML
        // var medioDePagoText = medioDePago.options[index].text;


    const precio_articulo = formData.getAll('precio_articulo');
    const totalArticulo =  formData.getAll('totalArticulo');
    const precioAbono = formData.getAll("precioAbono");
    const descuento = formData.getAll("descuento");
    const condicionPago = formData.get("condicion_pago");
    const fechaInicio = formData.get("fecha_inicio");
    const fechaVencimiento = formData.get("fecha_Vencimiento");
    const compromisoPago = formData.get("compromisoPago");
    
    // const arrayPrueba = transformarArray(precio_articulo, fromMoneyToText)   // Esto puede ser un array o un string dependiendo del envío
    // console.log(arrayPrueba)

    const precio_articulos = transformarArray(precio_articulo, fromMoneyToText)
    const totalArticulos = transformarArray(totalArticulo, fromMoneyToText)
    const precioAbonos = transformarArray(precioAbono, fromMoneyToText)
    const descuentos = transformarArray(descuento, convertirSeparadorMilesANumero)



    const total = fromMoneyToText($("#totalVenta").text());
    const totalAbono = fromMoneyToText($("#totalAbono").text());
    const metodoPago = formData.getAll("metodoPago")
    const numero_articulo = formData.getAll("numero_articulo")
    const cantidad = formData.getAll("cantidad")
    const tipo_descuento = formData.getAll("tipo_descuento")
    const descripcionAbono = formData.getAll("descripcionAbono")
    const fechaAbono = formData.getAll("fechaAbono")

    console.log(numero_articulo)
    console.log(metodoPago)
    // numero_articulo
    
    formData.set('precio', total)  // total
    formData.set('totalAbono', totalAbono)
    formData.set('empresaCliente', empresaID)
    if (condicionPago) {
        formData.set('condicion_pago', condicionPago);
    }
    if (fechaInicio) {
        formData.set('fecha_inicio', fechaInicio);
    }
    if (fechaVencimiento) {
        formData.set('fecha_vencimiento', fechaVencimiento);
    }
    if (compromisoPago) {
        formData.set('cuotas', compromisoPago);
    }

    
    agregarArrayAFormData(formData, 'descuento', descuentos, true);
    agregarArrayAFormData(formData, 'precio_articulo', precio_articulos, true);
    agregarArrayAFormData(formData, 'totalArticulo', totalArticulos, true);
    agregarArrayAFormData(formData, 'precioAbono', precioAbonos, true);
    // agregarArrayAFormData(formData, 'descripcionAbono', descripcionAbono, true);

    eliminarElementosFormData(formData, ['descuento', 'precio_articulo', 'totalArticulo', 'tipo_descuento', 'cantidad', 'numero_articulo'])
    eliminarElementosFormData(formData, ['metodoPago', 'descripcionAbono', 'precioAbono', 'fechaAbono'])

    const articulos = numero_articulo.map((numeroArticulo, index) => {
        return {
            venta: id,
            articulo: numeroArticulo,
            cantidad: cantidad[index],
            precio_articulo: precio_articulos[index],
            tipo_descuento: tipo_descuento[index],
            descuento: descuentos[index],
            totalArticulo:  totalArticulos[index],//formData.getAll("totalArticulo")[index]
        };
    });

    const abono = metodoPago.map((metodo_Pago, index) => {
        return {
            venta: id,
            cliente_id: cliente_id,
            medioDePago: metodo_Pago,
            descripcion: descripcionAbono[index],
            precio: precioAbonos[index],
            fecha_abono: fechaAbono[index],

        };
    });

    const saldo =  {
            venta: id,
            cliente: cliente_id,
            saldo: total - totalAbono,

        };
    formData.set('venta', JSON.stringify(articulos))
    formData.set('abonos', JSON.stringify(abono))
    formData.set('saldo', JSON.stringify(saldo))
    formData.set('estado', 1)
    
    console.log(JSON.stringify(articulos));


    if (!cliente_id) {
        swalErr("Ingrese la cedula del cliente");
        return
    }

    if (precio == 0) {
        await swalErr("Ingrese un precio para la venta.");
        return
    }  

    if (contieneValorVacio(numero_articulo)) {
        await swalErr("Hay Articulos sin ingresar.");
        return
    }

    if (tieneAbonoSinMedioDePago(abono)) {
        await swalErr("Ingrese un medio de pago para la venta.");
        return
    }

    

    if (totalAbono > total) {
        await swalErr("El abono no puede ser mayor al precio.");
        return
    }

    const errorContado = validarCondicionContado(condicionPago, compromisoPago, total, totalAbono);
    if (errorContado) {
        await swalErr(errorContado);
        return
    }

    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    let req;
    try {
        req = await callApiFile('venta/', {
            method: 'POST',
            body: formData,
        });
    } catch (error) {
        console.error('Error creando venta', error);
        await mostrarErrorVenta(error instanceof Error ? error.message : 'Error de red al crear la venta.');
        return
    }

    console.log(req.res);
    console.log(req.data);

    if (req.res.status >= 500) {
        console.error('Error 500 creando venta', req.data);
        await mostrarErrorVenta(req.data);
        return
    }

    if (req.res.status != 200) {
        await swalHtml('Error', req.data)
        return
    }

    // swalconfirmationAndReload('Se creo la factura #\n a nombre de daniel')
    await swalHtmlCreation('Venta creada!', `Se creo Venta: ${id} <br>Cedula cilente: ${separadorMiles(cliente_id)}<br>Precio: ${moneyformat(total)} <br>
        
        `)
        // Medio de pago: ${medioDePagoText}

    almacenarInputs()
    
    return true
}


export const handleFormSubmitUpdate = async (e, formRef, usuario, empresa, iti) => {

    e.preventDefault();
    const formData = new FormData(formRef.current);

    
    let cliente_id = usuario[0].selectize.getValue()
    let empresaID = empresa[0].selectize.getValue() 
    console.log(cliente_id) //formData.get('cliente_id');
    let id = formData.get('id');
    let precio = formData.get('precio');
    // let abono = formData.get('abono');
    // let metodoPago = formData.get('metodoPago');


    const precio_articulo = formData.getAll('precio_articulo');
    const totalArticulo =  formData.getAll('totalArticulo');
    const precioAbono = formData.getAll("precioAbono");
    const descuento = formData.getAll("descuento");
    const condicionPago = formData.get("condicion_pago");
    const fechaInicio = formData.get("fecha_inicio");
    const fechaVencimiento = formData.get("fecha_Vencimiento");
    const compromisoPago = formData.get("compromisoPago");
    
    // const arrayPrueba = transformarArray(precio_articulo, fromMoneyToText)   // Esto puede ser un array o un string dependiendo del envío
    // console.log(arrayPrueba)

    const precio_articulos = transformarArray(precio_articulo, fromMoneyToText)
    const totalArticulos = transformarArray(totalArticulo, fromMoneyToText)
    const precioAbonos = transformarArray(precioAbono, fromMoneyToText)
    const descuentos = transformarArray(descuento, convertirSeparadorMilesANumero)



    const total = fromMoneyToText($("#totalVenta").text());
    const totalAbono = fromMoneyToText($("#totalAbono").text());
    const metodoPago = formData.getAll("metodoPago")
    const numero_articulo = formData.getAll("numero_articulo")
    const cantidad = formData.getAll("cantidad")
    const tipo_descuento = formData.getAll("tipo_descuento")
    const descripcionAbono = formData.getAll("descripcionAbono")
    const fechaAbono = formData.getAll("fechaAbono")

    console.log(numero_articulo)
    console.log(metodoPago)
    // numero_articulo
    
    formData.set('precio', total)  // total
    formData.set('totalAbono', totalAbono)
    formData.set('empresaCliente', empresaID)
    if (condicionPago) {
        formData.set('condicion_pago', condicionPago);
    }
    if (fechaInicio) {
        formData.set('fecha_inicio', fechaInicio);
    }
    if (fechaVencimiento) {
        formData.set('fecha_vencimiento', fechaVencimiento);
    }
    if (compromisoPago) {
        formData.set('cuotas', compromisoPago);
    }

    
    agregarArrayAFormData(formData, 'descuento', descuentos, true);
    agregarArrayAFormData(formData, 'precio_articulo', precio_articulos, true);
    agregarArrayAFormData(formData, 'totalArticulo', totalArticulos, true);
    agregarArrayAFormData(formData, 'precioAbono', precioAbonos, true);
    // agregarArrayAFormData(formData, 'descripcionAbono', descripcionAbono, true);

    eliminarElementosFormData(formData, ['descuento', 'precio_articulo', 'totalArticulo', 'tipo_descuento', 'cantidad', 'numero_articulo'])
    eliminarElementosFormData(formData, ['metodoPago', 'descripcionAbono', 'precioAbono', 'fechaAbono'])

    const articulos = numero_articulo.map((numeroArticulo, index) => {
        return {
            venta: id,
            articulo: numeroArticulo,
            cantidad: cantidad[index],
            precio_articulo: precio_articulos[index],
            tipo_descuento: tipo_descuento[index],
            descuento: descuentos[index],
            totalArticulo:  totalArticulos[index],//formData.getAll("totalArticulo")[index]
        };
    });

    const abono = metodoPago.map((metodo_Pago, index) => {
        return {
            venta: id,
            cliente_id: cliente_id,
            medioDePago: metodo_Pago,
            descripcion: descripcionAbono[index],
            precio: precioAbonos[index],
            fecha_abono: fechaAbono[index],

        };
    });

    const saldo =  {
            venta: id,
            cliente: cliente_id,
            saldo: total - totalAbono,

        };
    formData.set('venta', JSON.stringify(articulos))
    formData.set('abonos', JSON.stringify(abono))
    formData.set('saldo', JSON.stringify(saldo))
    formData.set('estado', 1)
    
    console.log(JSON.stringify(articulos));


    if (!cliente_id) {
        swalErr("Ingrese la cedula del cliente");
        return
    }

    if (precio == 0) {
        await swalErr("Ingrese un precio para la venta.");
        return
    }  

    if (contieneValorVacio(numero_articulo)) {
        await swalErr("Hay Articulos sin ingresar.");
        return
    }

    if (tieneAbonoSinMedioDePago(abono)) {
        await swalErr("Ingrese un medio de pago para la venta.");
        return
    }

    

    if (totalAbono > total) {
        await swalErr("El abono no puede ser mayor al precio.");
        return
    }

    const errorContado = validarCondicionContado(condicionPago, compromisoPago, total, totalAbono);
    if (errorContado) {
        await swalErr(errorContado);
        return
    }

    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    let req;
    try {
        req = await callApiFile('venta/', {
            method: 'PUT',
            body: formData,
        });
    } catch (error) {
        console.error('Error actualizando venta', error);
        await mostrarErrorVenta(error instanceof Error ? error.message : 'Error de red al actualizar la venta.');
        return
    }

    console.log(req.res);
    console.log(req.data);

    if (req.res.status >= 500) {
        console.error('Error 500 actualizando venta', req.data);
        await mostrarErrorVenta(req.data);
        return
    }

    if (req.res.status != 200) {
        await swalHtml('Error', req.data)
        return
    }

    // swalconfirmationAndReload('Se creo la factura #\n a nombre de daniel')
    await swalHtmlCreation('Venta Actualizada', `Se Actualizo Venta: ${id} <br>Cedula cilente: ${separadorMiles(cliente_id)}<br>Precio: ${moneyformat(total)} <br>
        
        `)
        // Medio de pago: ${medioDePagoText}

    almacenarInputs()
    
    return true
}
