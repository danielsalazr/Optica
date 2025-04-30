// const abono = document.querySelector('#abono');

// const ventaForm = document.querySelector('#ventaForm');
// const submitVenta = document.querySelector('#submitVenta');
// const cedula = document.querySelector('#cedula');

const abonarForm = document.querySelector('#abonarForm');
const submitAbonar = document.querySelector('#submitAbonar');

window.addEventListener('load', function() {
    
    abono.focus(); 
});


submitAbonar.addEventListener('click', async function (e){
    e.preventDefault();

    const formData = new FormData(abonarForm);

    let cliente_id = formData.get('cliente_id');
    let factura = formData.get('factura');
    let nombre = formData.get('nombre');
    let precio = formData.get('precio');
    let abono = formData.get('abono');
    let medioDePago = formData.get('medioDePago');

    // extraer el texto del selector del medio de pago
    let metodoPago = document.querySelector('#medioDePago');
    var index = metodoPago.selectedIndex;
    var medioDePagoText = metodoPago.options[index].text;

    //convertir el texto del precio y el abono en valores numericos
    precio = Number(precio.replace(/\D/g, ""));
    // abono = Number(abono.replace(/\D/g, ""))
    
    formData.set('precio', precio)
    // formData.set('abono', abono)

    // if (!cliente_id){
    //     swalErr("Ingrese la cedula del cliente");
    //     return 
    // }

    if (precio == 0){
        swalErr("Ingrese un precio");
        return 
    }

    if (!medioDePago){
        swalErr("AbonosData para la venta 2.");
        return 
    }

    // if (abono > precio){
    //     swalErr("El abono no puede ser mayor al precio.");
    //     return 
    // }

    const req = await callApi('abono/',
    {
        method: 'POST',
        body:JSON.stringify(Object.fromEntries(formData)),
    });

    console.log(req.res);
    console.log(req.data);

    // swalconfirmationAndReload('Se creo la factura #\n a nombre de daniel')
    await swalHtmlCreation(`Se creo factura: ${factura} <br>Cedula cilente: ${separadorMiles(cliente_id)}<br>Nombre cilente: ${nombre}<br>Precio Abono: ${moneyformat(precio)}<br>Medio de pago: ${medioDePagoText}`)
    
});



