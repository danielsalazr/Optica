import React, {useImperativeHandle, useRef, useState} from 'react'
import {  callApiForm,  } from '@/utils/js/api';
import { swalHtml, swalconfirmation } from '@/utils/js/sweetAlertFunctions';

import dynamic from 'next/dynamic';
import { te } from 'intl-tel-input/i18n';
const IntlTelInput = dynamic(() => import("intl-tel-input/react/build/IntlTelInputWithUtils"), {
  ssr: false,
});

function ClientesForm(props) {
     const formRef = useRef(null);
     const telefonoRef = useRef(null);

     const [telefono, setTelefono] = useState('');
    
        const handleSubmit = async  () => {
          console.log(props.ref);
            const formData = new FormData(formRef.current);
            formData.set("telefono", telefono);
            
            for (let [key, value] of formData.entries()) {
              console.log('Clientes Form:', key, value);
            }//formRef.current);
            
            const req = await callApiForm("usuarios/Cliente/", formData)
    
            console.log(req.res);
    
            if (req.res.status !== 201) {
            //   await swalErr("No se pudo crear Empresa")
            await swalHtml("Error", req.data)
              return false;
            }
    
            
            console.log(req.data);
            
            await swalconfirmation("Se creo la empresa correctamente.")

          const nuevoCliente = {
            id: formRef.current.querySelector('#cedula').value,
            nombre: formRef.current.querySelector('#nombre').value,
            telefono: telefono,
            email: formRef.current.querySelector('#email').value,
          };
            
          return nuevoCliente;
    
          };
    
          useImperativeHandle(props.ref, () => ({
            submit: handleSubmit,
            current: formRef.current,
            // telefono: telefonoRef.current,
          }));

          const handleTelefonoChange = () => {
            
            setTelefono(telefonoRef.current?.getInstance().getNumber());
            console.log((telefonoRef.current?.getInstance().getNumber()))
            
          };
  return (
    <form className="row" ref={formRef} id="clientesForm"> 
        <div className="form-group col-sm-12 col-md-6 col-xl-3">
            <label htmlFor="cedula"># Cedula</label>
            <input type="number" className="form-control" id="cedula"  name="cedula" defaultValue="" />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-3">
            <label htmlFor="nombre">Nombre</label>
            <input type="text" className="form-control" id="nombre"  name="nombre" defaultValue="" />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-3">
            <label htmlFor="telefono">Telefono</label>
            <IntlTelInput
                        ref={telefonoRef}
                        inputProps={{
                            className: "form-control  " // Agrega la clase "mi-clase-input" al input de teléfono
                          }}
                        id="telefono"
                        name="telefono"
                        onChangeNumber={handleTelefonoChange}
        // onChangeValidity={setIsValid}
                        initOptions={{
                            initialCountry: "co",
                        }}
                    />
            {/* <input type="text" className="form-control telefono" id="telefono"  name="telefono" defaultValue="" /> */}
        </div>

        

        <div className="form-group col-sm-12 col-md-6 col-xl-3">
            <label htmlFor="email">email</label>
            <input type="email" className="form-control" id="email"  name="email" defaultValue="" />
        </div>
        

        <div className="form-group col-sm-12 col-md-6 col-xl-3">
            <label htmlFor="nombre">Fecha nacimiento</label>
            <input type="date" className="form-control" id="FechaNacimiento"  name="FechaNacimiento" defaultValue="" />
        </div>
        
    </form>
    
  )
}
    // )
export default ClientesForm;
