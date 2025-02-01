'use client';

import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useState } from 'react';

const MyPhoneInput = () => {
  const [value, setValue] = useState()

  return (
    <div className="form-group col-sm-12 col-md-6 col-xl-3">
      <label htmlFor="telefonocliente">Telefono:</label>
      <PhoneInput
        international
        defaultCountry="CO"
        value={value}
        onChange={setValue} // Actualiza el estado al cambiar el valor
        className="form-control telefono" // Clase para mantener el estilo
        id="telefonoCliente"
        placeholder="xxx-xxx-xxxx" // Ajusta el placeholder
        maxLength={17} // Limita el tamaño máximo del teléfono
        name="telefonocliente"
      />
    </div>
  )
}

export default MyPhoneInput;