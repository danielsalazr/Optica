"use client";
import React, { useRef, useEffect, useState, ReactElement } from 'react'
import TablaArticulos from '@/components/TablaArticulos';

import {obtenerInfoArticulo} from "@/utils/js/selectizeElements"
import { IP_URL, callApiFile } from '@/utils/js/api';
import { handleFormSubmit } from "@/utils/js/ventaFormSubmit.js"
import Abonos from './Abonos';

import $ from 'jquery';
import 'selectize';
import dynamic from 'next/dynamic';
import MedioPago from './MedioPago';
// import intlTelInput from 'intl-tel-input';
// import IntlTelInput from 'react-intl-tel-input';
const IntlTelInput = dynamic(() => import("intl-tel-input/react/build/IntlTelInputWithUtils"), {
  ssr: false,
});
// import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/intlTelInput.min.js")

function VentasForm({data}) {
    const formRef = useRef(null);
    const usuarioRef = useRef(null);
    const telefonoRef = useRef(null);

    const [telefono, setTelefono] = useState('');
    const [usuario, setUsuario] = useState(null);
    const [iti,setIti] = useState(null);

    const fechaHoy = new Date().toISOString().split('T')[0];
    console.log(fechaHoy)

      useEffect(()=>{
              //import( "bootstrap/dist/js/bootstrap.bundle.js");
              
              const loadUtils = async () => {
                
                // await import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/intlTelInput.min.js")
                const getCookie = await import('@/utils/js/getCookie.js');
                
                await import('@/utils/js/utils.js');
                await import('@/utils/js/api.js');
                await import ("@/utils/js/intlInput.js");
                
                // await import ("@/utils/js/selectwithImage.js");
                
                await import ("@/utils/js/selectizeElements.js");
                // const selectize = await import ("selectize/dist/js/standalone/selectize.min.js");
                await import ("@/utils/js/imagenesInputs.js");
                await import ("@/utils/js/ventas.js");
                // const intlInput =  await import ("@/utils/js/intlInput");
                //console.log(utils); // Verifica que se haya importado correctamente
                // const script = document.createElement('script');
                // script.src = "./selectizeElements.js";
                // script.async = true;
                // document.body.appendChild(script);
                // setUtilsLoaded(true);
              };
              loadUtils();


              if (usuarioRef.current) {
                const selectizeInstance = $(usuarioRef.current).selectize({
                    create: true,
                    createOnBlur: true,
                    persist: false,
                    maxItems: 1,
                    maxOptions: 10,
                });
    
                setUsuario(selectizeInstance);
            }
            //   if (telefonoRef.current) {
            //     intlTelInput(telefonoRef.current, {
            //         loadUtils: () => import("intl-tel-input/utils"),
            //     });
            // }

                // setIti(intlTelInput(telefonoRef.current,))
                // console.log(iti)

                // const input = telefonoRef.current;
                // const instance = intlTelInput(input, {
                // initialCountry: 'co',
                // utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/utils.js',
                // });

                // setIti(instance);

              
      
              // const data = await getData();
              // ejecutarSelectize()
              //loadIntlTelInput();
              // obtenerInfoArticulo();
              
              //intelInputUtil();

            //   return () => {
            //     instance.destroy();
            //   };
              
          },[])

          const handleTelefonoChange = () => {
            
            telefonoRef.current?.getInstance().getNumber(telefono);
          };

  return (
    <form className="container-md" id="ventaForm" onSubmit={(e) => handleFormSubmit(e, formRef,usuario, telefonoRef)} encType="multipart/form-data">
                <div className="row"> 
                <div className="form-group col-sm-12 col-md-6 col-xl-3">
                    
                    <label htmlFor="email"># Factura</label>
                    <input type="number" className="form-control" id="facturaVenta"  name="factura" defaultValue={data.factura} />
                </div>
                <div className="form-group col-sm-12 col-md-6 col-xl-3">
                    <label htmlFor="cedula">cedula cliente:</label>
                    {/* {'{'}% comment %{'}'} <input type="text" className="form-control" id="cedula" placeholder="Cedula del cliente" name="cliente_id" required /> {'{'}% endcomment %{'}'} */}
                    <select ref={usuarioRef} className="form-select camposbc" id="cedula" name="cliente_id" required>
                        <option key="">--</option>
                        {data.clientes.map(element => (
                            <option key={element.id} style={{backgroundImage: 'url("https://copu.media/wp-content/uploads/2023/10/Logo-Nequi-1.jpg")'}}> 
                            {element.id}</option> 
                        ))}
                    </select>
                </div>
                <div className="form-group col-sm-12 col-md-6 col-xl-3">
                    <label htmlFor="nombreCliente">Nombre Cliente:</label>
                    <input type="text" className="form-control" id="nombreCliente" placeholder="Nombre Cliente"  name="nombreCliente" />
                </div>
                <div className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3 d-flex flex-column">
                    <label htmlFor="telefonocliente">Telefono:</label>
                    {/* <input type="text" className="form-control telefono" id="telefonoCliente" placeholder="xxx-xxx-xxxx"  maxLength={17} name="telefonocliente" value={telefono}
        onChange={handleTelefonoChange} /> */}
                    <IntlTelInput
                        ref={telefonoRef}
                        inputProps={{
                            className: "form-control  " // Agrega la clase "mi-clase-input" al input de teléfono
                          }}
                        id="EmpresaCliente"
                        onChangeNumber={handleTelefonoChange}
        // onChangeValidity={setIsValid}
                        initOptions={{
                            initialCountry: "co",
                        }}
                    />
                </div>
                <div className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3">
                    <label htmlFor="EmpresaCliente">Empresa:</label>

                    <input type="text" className="form-control" id="EmpresaCliente"  maxLength={17} name="EmpresaCliente" />
                    
                                </div>
                {/* <div className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3">
                    <label htmlFor="valor">Precio de venta $</label>
                    <input type="text" className="form-control precio" id="valor" placeholder="$ 0" defaultValue="$ 0" name="precio" required />
                </div> */}
                {/* <div className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3">
                    <label htmlFor="valor">Abono $</label>
                    <input type="text" className="form-control precio" id="abono" placeholder="$ 0" defaultValue="$ 0" name="abono" />
                </div> */}

                {/* <MedioPago data={data} name="metodoPago" className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3" labelInput="Metodo de pago:" /> */}
    

                {/* <div className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3">
                    <label htmlFor="valor">Metodo de Pago</label>
                    <div className="custom-select">
                    <div className="selectedPayment form-select">
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbyC6amH2B9H4vu3pEVEms33iwwLjgS1v0iw&s" alt="Default" />
                        <span id="valorSelect">Seleccione una opción</span>
                    </div>
                    <div className="dropdown form-select">
                        {
                            data.mediosPago.map(element => (
                                <div className="optionPayment" data-value={element.id}>
                                <img src={element.imagen} alt={element.id} />
                                {element.nombre}
                                </div>
                            ))
                        }
                    </div>
                    <input type="hidden" name="metodoPago" id="metodoPago" required />
                    <div className="error-message" style={{display: 'none'}}>Este campo es obligatorio.</div>
                    </div>
                </div> */}
                
                {/* {'{'}% comment %{'}'} <div className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3">
                    <label htmlFor="apelidoCliente">Apellido Cliente:</label>
                    <input type="text" className="form-control" id="apellidoCliente" placeholder="ApellidoCliente" defaultValue name="apellidoCliente" />
                </div>
                {'{'}% endcomment %{'}'} */}
                <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
                    <label htmlFor="password">Fecha de venta</label>
                    <input type="date" className="form-control" id="fechaVenta" placeholder="Ingrese su contraseña" name="fecha" defaultValue={fechaHoy} required />
                </div>
                </div>
                <div className="row"> 
                <div className="form-group col-sm-12 col-md-12 col-xl-6 ">
                    <label htmlFor="detalleVenta">Detalle</label>
                    <textarea rows={3} cols={50} className="form-control" id="detalleVenta" name="detalle" placeholder="Detalle" defaultValue="algo"  />
                </div>
                <div className="form-group col-sm-12 col-md-12 col-xl-6">
                    <label htmlFor="observacionVenta">Observaciones:</label>
                    <textarea rows={3} cols={50} className="form-control" id="observacionVenta" name="observacion" placeholder="Observaciones" defaultValue={""} />
                </div>
                </div>
                <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
                <label htmlFor="foto">Fotos de la venta:</label>
                <input type="file" className="form-control" id="imagenes" multiple accept="image/*"  name="foto" />
                </div>
                <div id="previsualizadores" className="mt-2" />
                
                <hr className="my-3" />
                <div className="row my-1">
                <div className="form-group">
                <TablaArticulos articulos={data.articulos || []} />
                <Abonos data={data} />
                    <button type="submit" className="btn btn-primary col-12" id="submitVenta" >
                    Crear venta
                    </button>
                </div>
                </div>

                
            </form>
  )
}

export default VentasForm
