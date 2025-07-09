import React, {useState, useEffect, useRef} from 'react'
import MedioPago from '../MedioPago';
import { executeUtils, moneyformat, formatMoneyInput, separadorDeMiles, fromNumberToMoney, fromMoneyToText } from '@/utils/js/utils.js';
import { swalconfirmation, swalErr, swalHtml } from '@/utils/js/sweetAlertFunctions';
import { callApi, callApiForm } from '@/utils/js/api';
import {eliminarElementosFormData, transformarFormDataValues} from '@/utils/js/utilsFormData.js';

function AbonosForm(props) {
    const formRef = useRef(null);
    const [mediosPago, setMediosPago] = useState([])

    
    const {data, generalData, fun} = props;
    console.log(data)
    console.log(generalData)

    const handleSubmit = async (e) => {
        e.preventDefault()
        console.log(props.ref);
        const formData = new FormData(formRef.current);

        
        
        for (let [key, value] of formData.entries()) {
            console.log('abonos Form:', key, value);
        }

        const medioDePago = formData.get("medioDePago")
        console.log(medioDePago)


        const newFormData = transformarFormDataValues(formData,fromMoneyToText, ['precio', 'totalventa', 'totalAbono', 'saldo', ], 'string')         // console.log(req.res);

        const saldo = parseInt(formData.get('saldo'));
        const precio = parseInt(formData.get('precio'));

        console.log(precio)
        console.log(saldo)

        if (precio > saldo) {
            await swalErr("Por favor ingrese un valor que no sea mayor que el saldo")
            return
        }


        if (precio == '' || precio == null || precio == undefined || precio <= 0) {
            await swalErr("Por favor ingrese un valor para abonar")
            return
        }

        if (medioDePago == "") {
            console.log("metodoPago vacio")
            await swalErr("Seleccione un metodo de pago")
            return
        }

        const req = await callApiForm('abono/', newFormData)

        if (req.res.status !== 201) {
        //   await swalErr("No se pudo crear Empresa")
            await swalHtml("Error", req.data)
            return false;
        }
        const data = req.data;



        

        // console.log(data)

        await swalconfirmation("Se creo la empresa correctamente.")

        await fun()

    };
    

    useEffect(()=>{
            executeUtils();
            
        },[])

  return (
    <>
      <form className="row g-3" ref={formRef} onSubmit={handleSubmit}>
        <div className="col-md-6">
            <label htmlFor="inputEmail4" className="form-label">Factura</label>
            <input type="text" className="form-control" id="factura" name="factura" defaultValue={data.factura} readOnly/>
        </div>
        <div className="col-md-6">
            <label htmlFor="inputPassword4" className="form-label">cliente</label>
            <input type="text" className="form-control" id="clienteName" name="clienteName" defaultValue={data.cliente} readOnly />
        </div>
        <div className="col-md-6" hidden>
            <label htmlFor="inputPassword4" className="form-label">cedula</label>
            <input type="text" className="form-control" id="cliente" name="cliente_id" defaultValue={data.cedula} readOnly />
        </div>
        <div className="col-6">
            <label htmlFor="inputAddress" className="form-label">Valor Compra</label>
            <input type="text" className="form-control" id="totalventa" name="totalventa" defaultValue={data.precio} readOnly/>
        </div>
        <div className="col-6">
            <label htmlFor="inputAddress2" className="form-label">Total Abonos</label>
            <input type="text" className="form-control" id="totalAbono" name="totalAbono" defaultValue={data.totalAbono} readOnly/>
        </div>
        <div className="col-6">
            <label htmlFor="inputAddress2" className="form-label">Saldo</label>
            <input type="text" className="form-control" id="saldo" name="saldo" defaultValue={data.saldo} readOnly/>
        </div>
        <div className="col-md-12">
            <label htmlFor="precio" className="form-label">Abonar</label>
            <input type="text" className="form-control precio" id="precio" name="precio" />
        </div>

        <div className="col-md-12">
            <label htmlFor="inputState" className="form-label">Medio de pago</label>
            <MedioPago 
                data={generalData}
                name="medioDePago" 
                className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3 w-100"
                required={true}
            />
        </div>
        {/* <div className="col-md-2">
            <label htmlFor="inputZip" className="form-label">Zip</label>
            <input type="text" className="form-control" id="inputZip" />
        </div> */}
        {/* <div className="col-12">
            <div className="form-check">
            <input className="form-check-input" type="checkbox" id="gridCheck" />
            <label className="form-check-label" htmlFor="gridCheck">
                Check me out
            </label>
            </div> */}
        {/* </div> */}
        <div className="col-12">
            <button type="submit" className="btn btn-primary">Abonar</button>
        </div>
        </form>
    </>
  )
}

export default AbonosForm
