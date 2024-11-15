const ventaForm = document.querySelector('#ventaForm');
const submitVenta = document.querySelector('#submitVenta');
const cedula = document.querySelector('#cedula');
const nombreCliente = document.querySelector('#nombreCliente');
const apellidoCliente = document.querySelector('#apellidoCliente');
const telefonoCliente = document.querySelector('#telefonoCliente');

window.addEventListener('load', function() {
    
    cedula.focus(); 
});

submitVenta.addEventListener('click', async function (e){
    e.preventDefault();

    const formData = new FormData(ventaForm);

    let cliente_id = formData.get('cliente_id');
    let factura = formData.get('factura');
    let precio = formData.get('precio');
    let abono = formData.get('abono');
    let metodoPago = formData.get('metodoPago');

    // extraer el texto del selector del medio de pago
    let medioDePago = document.querySelector('#medioDePago');
    var index = medioDePago.selectedIndex;
    var medioDePagoText = medioDePago.options[index].text;

    //convertir el texto del precio y el abono en valores numericos
    precio = Number(precio.replace(/\D/g, ""));
    abono = Number(abono.replace(/\D/g, ""))
    
    formData.set('precio', precio)
    formData.set('abono', abono)

    if (!cliente_id){
        swalErr("Ingrese la cedula del cliente");
        return 
    }

    if (precio == 0){
        swalErr("Ingrese un precio");
        return 
    }

    if (!medioDePago){
        swalErr("Ingrese un medio de pago.");
        return 
    }

    if (abono > precio){
        swalErr("El abono no puede ser mayor al precio.");
        return 
    }

    const req = await callApi('venta/',
    {
        method: 'POST',
        body:JSON.stringify(Object.fromEntries(formData)),
    });

    console.log(req.res);
    console.log(req.data);

    // swalconfirmationAndReload('Se creo la factura #\n a nombre de daniel')
    await swalHtmlCreation(`Se creo factura: ${factura} <br>Cedula cilente: ${separadorMiles(cliente_id)}<br>Precio: ${moneyformat(precio)}<br>Medio de pago: ${medioDePagoText}`)
    
});

cedula.addEventListener('blur', async  () => {
    console.log("blur");

    const id =  cedula.value
    const url = `usuarios/infoCliente/${id}`
    const req = await callApi(url);

    if (req.res.status != 200){
        return
    }

    nombreCliente.value  = req.data[0].nombre;
    apellidoCliente.value  = req.data[0].apellido;
    telefonoCliente.value  = req.data[0].telefono;

    nombreCliente.readOnly = true;
    apellidoCliente.readOnly = true;
    telefonoCliente.readOnly = true;

    nombreCliente.style.borderBottom = '5px solid green';
    apellidoCliente.style.borderBottom = '5px solid green';
    telefonoCliente.style.borderBottom = '5px solid green';
            

    console.log(req.res.status);
    console.log(req.data);
})



