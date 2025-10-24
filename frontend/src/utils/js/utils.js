//Este archivo contiene funciones generales para todo el programa

// poner fecha en un campo tipo fecha

//document.getElementById('fechaVenta').valueAsDate = new Date();

if (typeof document === "undefined") {
    return null; // Si se ejecuta en SSR, no hay cookies disponibles
}

const fecha = new Date().toISOString().split('T')[0];
// document.getElementById('fechaVenta').value = fecha;


// Poner formato de moneda a campos de precios

const inputPrecio = document.querySelectorAll(".precio");
const inputNumerico = document.querySelectorAll(".numerico");
const inputTelefono = document.querySelectorAll(".telefono");

for (let i = 0; i < inputPrecio.length; i++) {

    inputPrecio[i].addEventListener("input", () => {
        // Obtener el valor del input y convertirlo a número
        const cant = inputPrecio[i].value;
        const cantidad = Number(cant.replace(/\D/g, ""));

        // Dar formato a la cantidad como moneda con separación de decimales
        const cantidadFormateada = cantidad.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: true,
            currencyDisplay: "symbol",
        });

        // Actualizar el valor del input con la cantidad formateada
        inputPrecio[i].value = cantidadFormateada;
    });
}




export  function moneyformat(amount) {
    const cantidad = Number(amount);

    // Dar formato a la cantidad como moneda con separación de decimales
    const cantidadFormateada = cantidad.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
        currencyDisplay: "symbol",
    });

    // Actualizar el valor del input con la cantidad formateada
    return cantidadFormateada;
}

// funcion para hacer separador de miles en texto
export function separadorMiles(numero) {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


function formatPhone() {
    let phoneInput = document.getElementById('phone-input');
    let phoneNumber = phoneInput.value.replace(/\D/g, ''); // Eliminar todos los caracteres que no sean dígitos
    let formattedPhoneNumber = '';

    if (phoneNumber.length > 0) {
        formattedPhoneNumber += phoneNumber.substring(0, 3);
    }
    if (phoneNumber.length > 3) {
        formattedPhoneNumber += '-' + phoneNumber.substring(3, 6);
    }
    if (phoneNumber.length > 6) {
        formattedPhoneNumber += '-' + phoneNumber.substring(6, 10);
    }

    phoneInput.value = formattedPhoneNumber;
}


function phoneFormat(input) {
    input = input.replace(/\D/g, '');

    // Formatea el número a xxx-xxx-xxxx
    // Si el número tiene más de 10 dígitos, se asume que tiene código de país
    if (input.length > 10) {
        let countryCodeLength = Math.min(input.length - 10, 3); // El código de país tiene un máximo de 3 dígitos
        let countryCode = input.slice(0, countryCodeLength); // Obtener los primeros 1, 2 o 3 dígitos como código de país
        let restOfNumber = input.slice(countryCodeLength); // El resto del número

        // Formateamos el número con el código de país
        input = `+${countryCode} ${restOfNumber.slice(0, 3)}-${restOfNumber.slice(3, 6)}-${restOfNumber.slice(6, 10)}`;
    } else {
        // Si el número tiene 10 o menos dígitos, formateamos como número local
        if (input.length <= 3) {
            input = input.slice(0, 3); // Solo los primeros 3 dígitos
        } else if (input.length <= 6) {
            input = input.slice(0, 3) + '-' + input.slice(3, 6); // 3 primeros y luego 3 más con guion
        } else {
            input = input.slice(0, 3) + '-' + input.slice(3, 6) + '-' + input.slice(6, 10); // 3-3-4 formato
        }
    }

    return input;

}



document.addEventListener('DOMContentLoaded', function() {
    
    const inputs = document.querySelectorAll('input.precio');
    inputs.forEach(input => {
        input.addEventListener('change', function() {

            let value = this.value;

            // Limpia el valor quitando caracteres no numéricos
            let numericValue = parseFloat(value.replace(/[^\d]/g, '')) || 0;

            // Si el valor ya está formateado correctamente, no lo reprocesa
            if (new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(numericValue) === value) {
                return;
            }

            /*
            console.log("cambio mano")
            let value = parseFloat(this.value.replace(/[^0-9.]/g, '')) || 0;
            this.value = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
            }).format(value);
            */

        });
    });


    
    inputNumerico.forEach(element => {
        element.addEventListener("input", function() {
            console.log("ejecutado")
            element.value = separadorDeMiles(element.value);
        });
    })

    cargarInputs();
});


export function formatMoneyInput (input) {
    // Obtener el valor del input y convertirlo a número
    const cant = input;
    const cantidad = Number(cant.replace(/\D/g, ""));

    // Dar formato a la cantidad como moneda con separación de decimales
    const cantidadFormateada = cantidad.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
        currencyDisplay: "symbol",
    });

    // Actualizar el valor del input con la cantidad formateada
    return cantidadFormateada;
};



export function fromTextToMoney(input) {

    let value = input;

    // Limpia el valor quitando caracteres no numéricos
    let numericValue = parseFloat(value.replace(/[^\d]/g, '')) || 0;

    // Si el valor ya está formateado correctamente, no lo reprocesa
    if (new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(numericValue) === value) {
        return numericValue
    }

    return numericValue

    /*
    let value = parseFloat(input.replace(/[^0-9.]/g, '')) || 0;

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
    }).format(value);
    
    */
}

export function fromNumberToMoney(input) {

  let value = input;

  // Limpia el valor quitando caracteres no numéricos
  let numericValue = parseFloat(input) || 0;

  // Si el valor ya está formateado correctamente, no lo reprocesa
  const cantidadFormateada = numericValue.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
    currencyDisplay: "symbol",
});

// Actualizar el valor del input con la cantidad formateada
return cantidadFormateada;

  return numericValue
}

export function fromMoneyToText(input){
    console.log(input)
    // Elimina todos los caracteres no numéricos y convierte a número
    return Number(input.replace(/\D/g, "").replace(',', '.'))
    
}

export function separadorDeMiles(input){
    let value = input.replace(/\D/g, '');

                // Aplica el formato con separadores de miles
    let formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Establece el valor formateado en el input
    return formattedValue;
}

export function convertirSeparadorMilesANumero(formattedValue) {
    // Elimina los puntos (separadores de miles) y convierte a número
    let value = formattedValue.replace(/\./g, '');

    // Convierte el valor a número
    let numericValue = parseFloat(value);

    return numericValue;
}


// Almacena los valores de todos los inputs excepto el de id="facturaVenta"
export function almacenarInputs() {
    const inputs = document.querySelectorAll('input:not(#idVenta), textarea, select'); // Selecciona todos los inputs excepto facturaVenta
    const valores = {};

    inputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            valores[input.id] = input.value; // Guarda el valor seleccionado en el <select>
        } else {
            valores[input.id] = input.value; // Guarda el valor de otros inputs o textareas
        }
    });

    localStorage.setItem('inputs', JSON.stringify(valores)); // Guarda los valores en localStorage
    console.log('Valores almacenados:', valores);
}

export function fechaFormat(data) {

    const fechaISO = data;
    const fecha = new Date(fechaISO);

    const formateador = new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true, // Usar formato de 24 horas
    });

    return formateador.format(fecha);

}	

// Carga los valores desde localStorage y los asigna a los inputs
export function cargarInputs() {
    const valores = JSON.parse(localStorage.getItem('inputs')) || {}; // Obtén los valores del localStorage
    console.log('Cargando valores:', valores);

    Object.keys(valores).forEach(id => {

        console.log(valores[id])

        const input = document.getElementById(id);
        console.log(input)
        if (input) {
            try{
                // input.value = valores[id];
                if (input.tagName === 'SELECT') {
                    input.value = valores[id]; // Asigna el valor del select
                } else {
                    input.value = valores[id]; // Asigna el valor de otros inputs o textareas
                }
            } catch {

            }
             // Asigna el valor si el input existe
        } else {
            console.warn(`Input con ID "${id}" no encontrado.`);
        }
    });
}



function obtenerTodosLosValoresLocalStorage() {
    const valores = {};

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i); // Obtén la clave del índice actual
        const valor = localStorage.getItem(clave); // Obtén el valor asociado a la clave
        valores[clave] = valor;
    }

    return valores;
}

// Uso
// const valoresLocalStorage = obtenerTodosLosValoresLocalStorage();
// console.log(valoresLocalStorage);


export function executeUtils (){

    if (typeof document === "undefined") {
    return null; // Si se ejecuta en SSR, no hay cookies disponibles
}

const fecha = new Date().toISOString().split('T')[0];
// document.getElementById('fechaVenta').value = fecha;


// Poner formato de moneda a campos de precios

const inputPrecio = document.querySelectorAll(".precio");
const inputNumerico = document.querySelectorAll(".numerico");
const inputTelefono = document.querySelectorAll(".telefono");

for (let i = 0; i < inputPrecio.length; i++) {

    inputPrecio[i].addEventListener("input", () => {
        // Obtener el valor del input y convertirlo a número
        const cant = inputPrecio[i].value;
        const cantidad = Number(cant.replace(/\D/g, ""));

        // Dar formato a la cantidad como moneda con separación de decimales
        const cantidadFormateada = cantidad.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: true,
            currencyDisplay: "symbol",
        });

        // Actualizar el valor del input con la cantidad formateada
        inputPrecio[i].value = cantidadFormateada;
    });
}





  // Conversion a numero
  function moneyformat(amount) {
    const cantidad = Number(amount);
  
    // Dar formato a la cantidad como moneda con separación de decimales
    const cantidadFormateada = cantidad.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
        currencyDisplay: "symbol",
    });

    // Actualizar el valor del input con la cantidad formateada
    return cantidadFormateada;
}

// funcion para hacer separador de miles en texto
function separadorMiles(numero) {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


function formatPhone() {
    let phoneInput = document.getElementById('phone-input');
    let phoneNumber = phoneInput.value.replace(/\D/g, ''); // Eliminar todos los caracteres que no sean dígitos
    let formattedPhoneNumber = '';

    if (phoneNumber.length > 0) {
        formattedPhoneNumber += phoneNumber.substring(0, 3);
    }
    if (phoneNumber.length > 3) {
        formattedPhoneNumber += '-' + phoneNumber.substring(3, 6);
    }
    if (phoneNumber.length > 6) {
        formattedPhoneNumber += '-' + phoneNumber.substring(6, 10);
    }

    phoneInput.value = formattedPhoneNumber;
}


function phoneFormat(input) {
    input = input.replace(/\D/g, '');

    // Formatea el número a xxx-xxx-xxxx
    // Si el número tiene más de 10 dígitos, se asume que tiene código de país
    if (input.length > 10) {
        let countryCodeLength = Math.min(input.length - 10, 3); // El código de país tiene un máximo de 3 dígitos
        let countryCode = input.slice(0, countryCodeLength); // Obtener los primeros 1, 2 o 3 dígitos como código de país
        let restOfNumber = input.slice(countryCodeLength); // El resto del número

        // Formateamos el número con el código de país
        input = `+${countryCode} ${restOfNumber.slice(0, 3)}-${restOfNumber.slice(3, 6)}-${restOfNumber.slice(6, 10)}`;
    } else {
        // Si el número tiene 10 o menos dígitos, formateamos como número local
        if (input.length <= 3) {
            input = input.slice(0, 3); // Solo los primeros 3 dígitos
        } else if (input.length <= 6) {
            input = input.slice(0, 3) + '-' + input.slice(3, 6); // 3 primeros y luego 3 más con guion
        } else {
            input = input.slice(0, 3) + '-' + input.slice(3, 6) + '-' + input.slice(6, 10); // 3-3-4 formato
        }
    }

    return input;

}



document.addEventListener('DOMContentLoaded', function() {
    
    const inputs = document.querySelectorAll('input.precio');
    inputs.forEach(input => {
        input.addEventListener('change', function() {

            let value = this.value;

            // Limpia el valor quitando caracteres no numéricos
            let numericValue = parseFloat(value.replace(/[^\d]/g, '')) || 0;

            // Si el valor ya está formateado correctamente, no lo reprocesa
            if (new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(numericValue) === value) {
                return;
            }

            /*
            console.log("cambio mano")
            let value = parseFloat(this.value.replace(/[^0-9.]/g, '')) || 0;
            this.value = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
            }).format(value);
            */

        });
    });


    
    inputNumerico.forEach(element => {
        element.addEventListener("input", function() {
            console.log("ejecutado")
            element.value = separadorDeMiles(element.value);
        });
    })

    cargarInputs();
});


 function formatMoneyInput (input) {
    // Obtener el valor del input y convertirlo a número
    const cant = input;
    const cantidad = Number(cant.replace(/\D/g, ""));

    // Dar formato a la cantidad como moneda con separación de decimales
    const cantidadFormateada = cantidad.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
        currencyDisplay: "symbol",
    });

    // Actualizar el valor del input con la cantidad formateada
    return cantidadFormateada;
};



 function fromTextToMoney(input) {

    // let value = input;

    // Limpia el valor quitando caracteres no numéricos
    let numericValue = parseFloat(input.replace(/[^\d]/g, '')) || 0;

    // Si el valor ya está formateado correctamente, no lo reprocesa
    if (new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(numericValue) === value) {
        return numericValue
    }

    return numericValue

    /*
    let value = parseFloat(input.replace(/[^0-9.]/g, '')) || 0;

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
    }).format(value);
    
    */
}

function fromNumberToMoney(input) {

  let value = input;

  // Limpia el valor quitando caracteres no numéricos
  let numericValue = parseFloat(input) || 0;

  // Si el valor ya está formateado correctamente, no lo reprocesa
  if (new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(numericValue) === value) {
      return numericValue
  }

  return numericValue
}



  function fromMoneyToText(input){
    return Number(input.replace(/\D/g, "").replace(',', '.'))
 
  }

 function separadorDeMiles(input){
    let value = input.replace(/\D/g, '');

                // Aplica el formato con separadores de miles
    let formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Establece el valor formateado en el input
    return formattedValue;
}

function convertirSeparadorMilesANumero(formattedValue) {
    // Elimina los puntos (separadores de miles) y convierte a número
    let value = formattedValue.replace(/\./g, '');

    // Convierte el valor a número
    let numericValue = parseFloat(value);

    return numericValue;
}


// Almacena los valores de todos los inputs excepto el de id="facturaVenta"
function almacenarInputs() {
    const inputs = document.querySelectorAll('input:not(#idVenta), textarea, select'); // Selecciona todos los inputs excepto facturaVenta
    const valores = {};

    inputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            valores[input.id] = input.value; // Guarda el valor seleccionado en el <select>
        } else {
            valores[input.id] = input.value; // Guarda el valor de otros inputs o textareas
        }
    });

    localStorage.setItem('inputs', JSON.stringify(valores)); // Guarda los valores en localStorage
    console.log('Valores almacenados:', valores);
}

// Carga los valores desde localStorage y los asigna a los inputs
function cargarInputs() {
    const valores = JSON.parse(localStorage.getItem('inputs')) || {}; // Obtén los valores del localStorage
    console.log('Cargando valores:', valores);

    Object.keys(valores).forEach(id => {

        console.log(valores[id])

        const input = document.getElementById(id);
        console.log(input)
        if (input) {
            try{
                // input.value = valores[id];
                if (input.tagName === 'SELECT') {
                    input.value = valores[id]; // Asigna el valor del select
                } else {
                    input.value = valores[id]; // Asigna el valor de otros inputs o textareas
                }
            } catch {

            }
             // Asigna el valor si el input existe
        } else {
            console.warn(`Input con ID "${id}" no encontrado.`);
        }
    });
}



function obtenerTodosLosValoresLocalStorage() {
    const valores = {};

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i); // Obtén la clave del índice actual
        const valor = localStorage.getItem(clave); // Obtén el valor asociado a la clave
        valores[clave] = valor;
    }

    return valores;
}

// Uso
// const valoresLocalStorage = obtenerTodosLosValoresLocalStorage();
// console.log(valoresLocalStorage);
}