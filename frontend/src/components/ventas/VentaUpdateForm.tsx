"use client";
import React, { useRef, useEffect, useState, ReactElement } from 'react';
import dynamic from 'next/dynamic';
import FormulaLentes from '@/components/FormulaLentes';
import TablaArticulos from '@/components/TablaArticulos';
import Abonos from '@/components/abonos/Abonos';
import ClientesForm from '@/components/usuarios/ClientesForm';
import EmpresaForm from '@/components/usuarios/EmpresaForm';
import AnularVentaForm from '@/components/ventas/AnularVentaForm';
import BootstrapModal from '@/components/bootstrap/BootstrapModal';

// import { IP_URL, callApiFile } from '@/utils/js/api';
import { obtenerInfoArticulo } from "@/utils/js/selectizeElements"
import { handleFormSubmitUpdate } from "@/utils/js/ventaFormSubmit.js"





import $ from 'jquery';
import 'selectize';
import "@/styles/style.css"
import '@/styles/selectwithImage.css';

// import Button from 'react-bootstrap/Button';




// Iconos
import { UserRoundPlus } from 'lucide-react';
import { Icon } from "@iconify/react";
import { IconArrowLeft } from '@tabler/icons-react';
import { FaBeer } from 'react-icons/fa';


// const IntlTelInput = dynamic(() => import("intl-tel-input/react/build/IntlTelInputWithUtils"), {
//   ssr: false,
// });
// import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/intlTelInput.min.js")

function VentaUpdateForm(props) {

    const {data, ventaData} = props;
    const formRef = useRef(null);
    const usuarioRef = useRef(null);
    const empresaRef = useRef(null);
    const telefonoRef = useRef(null);

    const [telefono, setTelefono] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [usuario, setUsuario] = useState(null);
    const [factura, setFactura] = useState(data.factura);
    const [iti,setIti] = useState(null);
    const [modalShow, setModalShow] = React.useState(false);
    const [dataVenta, setDataVenta] = useState(ventaData);
    // const [clientes, setClientes] = useState(data.clientes);

    const [modalEmpresaShow, setModalEmpresaShow] = React.useState(false);
    const [clientes, setClientes] = useState(data.clientes);
    const [empresas, setEmpresas] = useState(data.empresas);

    let selectizeInstance = null;

    const fechaHoy = new Date().toISOString().split('T')[0];
    console.log(fechaHoy)

      useEffect(()=>{
              //import( "bootstrap/dist/js/bootstrap.bundle.js");
              
              const loadUtils = async () => {
                // await import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/intlTelInput.min.js")
                // const getCookie = await import('@/utils/js/getCookie.js');
                
                await import('@/utils/js/utils.js');
                await import('@/utils/js/api.js');
                await import ("@/utils/js/intlInput.js");
                
                
                // await import ("@/utils/js/selectizeElements.js");
                // const selectize = await import ("selectize/dist/js/standalone/selectize.min.js");
                await import ("@/utils/js/imagenesInputs.js");
                await import ("@/utils/js/ventas.js");
                // const intlInput =  await import ("@/utils/js/intlInput");
                
              };
              loadUtils();


            if (usuarioRef.current) {
                    selectizeInstance = $(usuarioRef.current).selectize({
                    create: true,
                    createOnBlur: true,
                    persist: false,
                    maxItems: 1,
                    hideSelected: true,
                    //maxOptions: 10,
                });
    
                setUsuario(selectizeInstance);
            }

            if (empresaRef.current) {
                const selectizeInstance2 = $(empresaRef.current).selectize({
                
                    // create: true,
                    createOnBlur: true,
                    persist: false,
                    maxItems: 1,
                    highlight: false,
                    // closeAfterSelect: true,
                    hideSelected: true,
                    
                });
    
                setEmpresa(selectizeInstance2);
            }
              
          },[])


        const handleNuevoCliente = (nuevoCliente) => {
            setClientes([...clientes, nuevoCliente]); // Agregar el nuevo cliente al estado
            if (usuario) {
                usuario[0].selectize.addOption({ value: nuevoCliente.id, text: `${nuevoCliente.id} - ${nuevoCliente.nombre} - ${nuevoCliente.telefono}`}); // Agregar el nuevo cliente al selector
                usuario[0].selectize.refreshOptions(false); // Refrescar las opciones del selector
            }
        };

        const handleNuevaEmpresa = (nuevaEmpresa) => {
             // Agregar el nuevo cliente al estado
            if (empresa) {
                console.log(empresas)
                const maxId = empresas.reduce((max, item) => (item.id > max ? item.id : max), empresas[0].id);
                console.log(maxId)
                setEmpresas([...empresas, nuevaEmpresa]);
                empresa[0].selectize.addOption({ value: maxId+1, text: `${nuevaEmpresa.nombre}`}); // Agregar el nuevo cliente al selector
                empresa[0].selectize.refreshOptions(false); // Refrescar las opciones del selector
            }
        };

        const handleFormSubmitWrapperUpdate = async (e, formRef, usuario, empresa, telefonoRef) => {
            const formulario = await handleFormSubmitUpdate(e, formRef, usuario, empresa, telefonoRef);

            console.log(formulario)
    
            // Incrementar el valor de factura en el estado
            if (formulario == true) 
            {    
                // setFactura(parseInt(factura) + 1 );

                // formRef.current.reset();

                // console.log(setUsuario.selectize)
                // console.log(selectizeInstance)

                // usuario[0].selectize.clear();
                // empresa[0].selectize.clear();
                
            }

        };

  return (
    <>
            <BootstrapModal
                    show={modalShow}
                    onHide={() => setModalShow(false)}
                    title="Crear cliente"
                    onSubmit={handleNuevoCliente}
                    submitBtn="Crear cliente"
            >
                <ClientesForm/>
            </BootstrapModal>  

            <BootstrapModal
                show={modalEmpresaShow}
                onHide={() => setModalEmpresaShow(false)}
                title="Crear Empresa"
                onSubmit={handleNuevaEmpresa}
                submitBtn="Crear"
            >
                <EmpresaForm />
               
            </BootstrapModal>  

        <form ref={formRef} className="container-md" id="ventaForm" onSubmit={(e) => handleFormSubmitWrapperUpdate(e, formRef, usuario, empresa, telefonoRef)} encType="multipart/form-data">

                <div className="row"> 
                <div className="form-group col-sm-12 col-md-6 col-xl-3">
                    
                    <label htmlFor="email"># Factura</label>
                    <input type="number" className="form-control" id="facturaVenta"  name="factura" value={dataVenta.factura} onChange={(e) => setFactura(Number(e.target.value))} />
                </div>

                <div className="form-group col-sm-12 col-md-12 col-xl-6">
                    <label htmlFor="cedula position-absolute">cedula cliente:</label>
                   
                    {/* {'{'}% comment %{'}'} <input type="text" className="form-control" id="cedula" placeholder="Cedula del cliente" name="cliente_id" required /> {'{'}% endcomment %{'}'} */}
                    <div className="input-group mb-3">
                        
                        <select ref={usuarioRef} className="form-select camposbc " id="cedula" name="cliente_id" defaultValue={dataVenta.cliente_id} required>
                            <option key="" value="" defaultValue="2">--</option>
                            {/* {data.cliente defs.map(element => ( */}
                            {clientes.map(element => (
                                <option key={element.cedula} value={element.cedula}  style={{backgroundImage: 'url("https://copu.media/wp-content/uploads/2023/10/Logo-Nequi-1.jpg")'}}> 
                                {element.cedula} - {element.nombre} - {element.telefono}</option> 
                            ))}
                        </select>
                        <button className="btn btn-outline-dark position-relative" onClick={() => setModalShow(true)}> <UserRoundPlus  size={24} /> </button>
                    </div>
                </div>

                <div className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3">
                    <label htmlFor="EmpresaCliente">Empresa:</label>

                    <div className="input-group mb-3">
                    <select ref={empresaRef} className="form-select  " id="empresaCliente" name="empresaCliente" defaultValue={dataVenta.empresaId} required>
                        <option key="" value="">--</option>
                        {/* {data.clientes.map(element => ( */}
                        {empresas.map(element => (
                            <option key={element.id} value={element.id} style={{backgroundImage: 'url("https://copu.media/wp-content/uploads/2023/10/Logo-Nequi-1.jpg")'}}> 
                            {element.nombre}</option> 
                        ))}
                    </select>
                    {/* <input type="text" className="form-control" id="EmpresaCliente"  maxLength={17} name="EmpresaCliente" /> */}
                    
                    
                        <button className="btn btn-outline-dark position-relative" onClick={() => setModalEmpresaShow(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width={28} height={28} viewBox="0 0 1024 1024"><path fill="currentColor" d="M839.7 734.7c0 33.3-17.9 41-17.9 41S519.7 949.8 499.2 960c-10.2 5.1-20.5 5.1-30.7 0c0 0-314.9-184.3-325.1-192c-5.1-5.1-10.2-12.8-12.8-20.5V368.6c0-17.9 20.5-28.2 20.5-28.2L466 158.6q19.2-7.65 38.4 0s279 161.3 309.8 179.2c17.9 7.7 28.2 25.6 25.6 46.1c-.1-5-.1 317.5-.1 350.8M714.2 371.2c-64-35.8-217.6-125.4-217.6-125.4c-7.7-5.1-20.5-5.1-30.7 0L217.6 389.1s-17.9 10.2-17.9 23v297c0 5.1 5.1 12.8 7.7 17.9c7.7 5.1 256 148.5 256 148.5c7.7 5.1 17.9 5.1 25.6 0c15.4-7.7 250.9-145.9 250.9-145.9s12.8-5.1 12.8-30.7v-74.2l-276.5 169v-64c0-17.9 7.7-30.7 20.5-46.1L745 535c5.1-7.7 10.2-20.5 10.2-30.7v-66.6l-279 169v-69.1c0-15.4 5.1-30.7 17.9-38.4zM919 135.7c0-5.1-5.1-7.7-7.7-7.7h-58.9V66.6c0-5.1-5.1-5.1-10.2-5.1l-30.7 5.1c-5.1 0-5.1 2.6-5.1 5.1V128h-56.3c-5.1 0-5.1 5.1-7.7 5.1v38.4h69.1v64c0 5.1 5.1 5.1 10.2 5.1l30.7-5.1c5.1 0 5.1-2.6 5.1-5.1v-56.3h64z"></path></svg>    
                        </button>
                    </div>

                    
                                </div>
                
                <div className="form-group col-sm-12 col-md-6 col-xl-3 ">
                    <label htmlFor="password">Fecha de venta</label>
                    <input type="date" className="form-control" id="fechaVenta" placeholder="Ingrese su contraseña" name="fecha" defaultValue={dataVenta.fecha} required />
                </div>
                
                </div>
                <div className="row"> 
                    <div className="form-group col-sm-12 col-md-12 col-xl-6 ">
                        <label htmlFor="detalleVenta">Detalle</label>
                        <textarea rows={3} cols={50} className="form-control" id="detalleVenta" name="detalle" placeholder="Detalle" defaultValue={dataVenta.detalle}  />
                    </div>
                <div className="form-group col-sm-12 col-md-12 col-xl-6">
                    <label htmlFor="observacionVenta">Observaciones:</label>
                    <textarea rows={3} cols={50} className="form-control" id="observacionVenta" name="observacion" placeholder="Observaciones" defaultValue={dataVenta.observacion} />
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
                {/* <FormulaLentes data={data} />  */}
                <TablaArticulos articulos={data.articulos || []} ventaData={dataVenta.ventas} />
                <Abonos data={data} ventaData={dataVenta.abonos} totalAbonoLoad={dataVenta.totalAbono} />
                
                    <button type="submit" className="btn btn-primary col-12" id="submitVenta" >
                    Actualizar venta
                    </button>
                </div>
                </div>

                
            </form>
        </>
                )
}

export default VentaUpdateForm;
