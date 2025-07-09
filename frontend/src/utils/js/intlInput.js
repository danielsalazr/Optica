const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/intlTelInput.min.js";
    script.async = true;
    script.onload = () => {
      // Ahora que el script se ha cargado, inicializamos intlTelInput
      const input = document.querySelector("#telefonoCliente");
      if (input && window.intlTelInput) {
        const iti = window.intlTelInput(input, {
          initialCountry: "co",
          utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/utils.js",
        });

        console.log("IntlTelInput inicializado:", iti);
      }
    };
    document.body.appendChild(script);