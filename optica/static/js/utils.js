//Este archivo contiene funciones generales para todo el programa

// poner fecha en un campo tipo fecha

document.getElementById('fechaVenta').valueAsDate = new Date();

const fecha = new Date().toISOString().split('T')[0];
document.getElementById('fechaVenta').value = fecha;


// Poner formato de moneda a campos de precios

const inputPrecio = document.querySelectorAll(".precio");
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

//   for (let i=0; i<inputTelefono.length; i++){

//     inputPrecio[i].addEventListener("input", () => {

//       let phoneInput = inputPrecio[i]
//       let phoneNumber = phoneInput.value.replace(/\D/g, ''); // Eliminar todos los caracteres que no sean dígitos
//       let formattedPhoneNumber = '';

//       if (phoneNumber.length > 0) {
//         formattedPhoneNumber += phoneNumber.substring(0, 3);
//       }
//       if (phoneNumber.length > 3) {
//         formattedPhoneNumber += '-' + phoneNumber.substring(3, 6);
//       }
//       if (phoneNumber.length > 6) {
//         formattedPhoneNumber += '-' + phoneNumber.substring(6, 10);
//       }

//       phoneInput.value = formattedPhoneNumber;

//   }
// }
//Aplicar formato de moneda a un texto

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
        input.addEventListener('input', function() {
            let value = parseFloat(this.value.replace(/[^0-9.]/g, '')) || 0;
            this.value = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
            }).format(value);
        });
    });
});