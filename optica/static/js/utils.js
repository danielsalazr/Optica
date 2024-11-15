//Este archivo contiene funciones generales para todo el programa

// poner fecha en un campo tipo fecha

document.getElementById('fechaVenta').valueAsDate = new Date();

const fecha = new Date().toISOString().split('T')[0];
document.getElementById('fechaVenta').value = fecha;


// Poner formato de moneda a campos de precios

const inputPrecio = document.querySelectorAll(".precio");
const inputTelefono = document.querySelectorAll(".telefono");

    for (let i=0; i<inputPrecio.length; i++){

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