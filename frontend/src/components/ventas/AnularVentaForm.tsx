import React, {useRef, useImperativeHandle} from 'react';
import { swalHtml, swalconfirmation, swalQuestion } from '@/utils/js/sweetAlertFunctions';
import {callApiForm} from '@/utils/js/api';

function AnularVentaForm(props) {
  const formRef = useRef(null);

  const {factura} = props;

  const handleSubmit = async  () => {

            const question = await swalQuestion("¿Esta seguro de anular la factura?")
            console.log(question)
            if (question != true) {
              return false;
            }


            console.log(props.ref);
              const formData = new FormData(formRef.current);
              
              
              
              const req = await callApiForm("venta/", formData, {method: "DELETE"})
      
              console.log(req.res);
      
              if (req.res.status !== 200) {
              //   await swalErr("No se pudo crear Empresa")
              await swalHtml("Error", req.data)
                return false;
              }
              
              console.log(req.data);
              
              await swalconfirmation("Se anulo la factura.")
  
      
            };
      
            useImperativeHandle(props.ref, () => ({
              submit: handleSubmit,
              current: formRef.current,
              // telefono: telefonoRef.current,
            }));

  return (
    <form className="row" ref={formRef} id="anularVentaForm">

        <div className="form-group col-sm-12 col-md-6 col-xl-3">
            <label htmlFor="factura"># Factura</label>
            <input type="text" className="form-control" id="id"  name="id" defaultValue={factura} readOnly/>
        </div>

        <div className="form-group col-sm-12 col-md-12 col-xl-12 ">
            <label htmlFor="detalleAnulacion">Detalle</label>
            <textarea rows={3} cols={50} className="form-control" id="detalleAnulacion" name="detalleAnulacion" placeholder="Detalle Anulacion" defaultValue=""  />
        </div>

    </form>
  )
}

export default AnularVentaForm
