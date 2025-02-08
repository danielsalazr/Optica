import React, { useImperativeHandle, useRef } from 'react'
import { callApi, IP_URL, callApiForm } from '@/utils/js/api';
import { swalHtml, swalconfirmation } from '@/utils/js/sweetAlertFunctions';


function EmpresaForm(props) {
    const formRef = useRef(null);

    const handleSubmit = async  () => {
      console.log(props.ref);
        const formData = new FormData(formRef.current); 
        
        for (let [key, value] of formData.entries()) {
          console.log('Clientes Form:', key, value);
        }//formRef.current);
        
        const req = await callApiForm("usuarios/Empresas/", formData)

        console.log(req.res);

        if (req.res.status !== 201) {
          await swalHtml("Error", req.data) ;
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
    <form className="row" 
    ref={formRef}
    // ref={formRef}
    id="empresaForm"> 
        <div className="form-group col-sm-12 col-md-6 col-xl-4">
            <label htmlFor="nombre">Nombre empresa</label>
            <input type="text" className="form-control" id="nombre"  name="nombre" defaultValue="" />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-4">
            <label htmlFor="email">Email</label>
            <input type="email" className="form-control" id="email"  name="email" defaultValue="" />
        </div>

        <div className="form-group col-sm-12 col-md-6 col-xl-4">
            <label htmlFor="nit">Nit:</label>
            <input type="number" className="form-control" id="nit"  name="nit" defaultValue="" />
        </div>

        <div className="form-group col-sm-12 col-md-12 col-xl-12 mt-2">
            <label htmlFor="personas_contacto">Personas de contacto: </label>
            {/* <input type="number" className="form-control" id="personas_contacto"  name="personas_contacto" defaultValue="" /> */}
            <textarea className="form-control" id="personas_contacto"  name="personas_contacto" defaultValue="" rows={4}></textarea>
        </div>
      	
    
    </form>
  )
}


export default EmpresaForm
