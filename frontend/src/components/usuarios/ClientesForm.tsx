import React, {useImperativeHandle, useRef} from 'react'
import {  callApiForm,  } from '@/utils/js/api';
import { swalHtml, swalconfirmation } from '@/utils/js/sweetAlertFunctions';

function ClientesForm(props) {
     const formRef = useRef(null);
    
        const handleSubmit = async  () => {
          console.log(props.ref);
            const formData = new FormData(formRef.current); 
            
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
            return true;
    
          };
    
          useImperativeHandle(props.ref, () => ({
            submit: handleSubmit,
            current: formRef.current,
          }));
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
            <input type="text" className="form-control telefono" id="telefono"  name="telefono" defaultValue="" />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-3">
            <label htmlFor="email">email</label>
            <input type="email" className="form-control" id="email"  name="email" defaultValue="" />
        </div>
        
        
    </form>
    
  )
}
    // )
export default ClientesForm;
