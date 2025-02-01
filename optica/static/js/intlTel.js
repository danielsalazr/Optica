const input = document.querySelector("#telefonoCliente");
  const iti = window.intlTelInput(input, {
    loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/utils.js"),
    initialCountry: "co",
  });

  const parentElement = input.parentElement;
  parentElement.style.display = "block";

  // Obtener  numero del campo
  const number = iti.getNumber();