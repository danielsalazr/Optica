// @ts-nocheck
"use client";
import React, { useRef, useEffect, useState, ReactElement, useMemo, useCallback } from 'react';
import TablaArticulos from '@/components/TablaArticulos';
import Abonos from '@/components/abonos/Abonos';
import ClientesForm from '@/components/usuarios/ClientesForm';
import EmpresaForm from '@/components/usuarios/EmpresaForm';
import BootstrapModal from '@/components/bootstrap/BootstrapModal';
import RemisionesPanel from '@/components/remisiones/RemisionesPanel';
import { buildMediaUrl } from '@/utils/js/env';

// import { IP_URL, callApiFile } from '@/utils/js/api';
import { handleFormSubmitUpdate } from "@/utils/js/ventaFormSubmit.js"





import $ from 'jquery';
import "@/styles/style.css"
import '@/styles/selectwithImage.css';

// import Button from 'react-bootstrap/Button';




// Iconos
import { UserRoundPlus } from 'lucide-react';


// const IntlTelInput = dynamic(() => import("intl-tel-input/react/build/IntlTelInputWithUtils"), {
//   ssr: false,
// });
// import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/intlTelInput.min.js")

function VentaUpdateForm(props) {

    const {data, ventaData} = props;
    const formRef = useRef(null);
    const usuarioRef = useRef(null);
    const empresaRef = useRef(null);
    const vendedorRef = useRef(null);
    const telefonoRef = useRef(null);

    console.log(data)

    

    const [telefono, setTelefono] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [usuario, setUsuario] = useState(null);
    const [pedido, setPedido] = useState(data.pedido);
    const [iti,setIti] = useState(null);
    const [modalShow, setModalShow] = React.useState(false);
    const [dataVenta, setDataVenta] = useState(ventaData);
    // const [clientes, setClientes] = useState(data.clientes);

    console.log(dataVenta)

    const [modalEmpresaShow, setModalEmpresaShow] = React.useState(false);
    const [clientes, setClientes] = useState(data.clientes);
    const [empresas, setEmpresas] = useState(data.empresas);
    const [vendedores, setVendedores] = useState(data.vendedores || []);

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
                await import('selectize');
                
                // await import ("@/utils/js/selectizeElements.js");
                // const selectize = await import ("selectize/dist/js/standalone/selectize.min.js");
                await import ("@/utils/js/ventas.js");
                // const intlInput =  await import ("@/utils/js/intlInput");
                

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

            if (vendedorRef.current) {
                $(vendedorRef.current).selectize({
                    createOnBlur: true,
                    persist: false,
                    maxItems: 1,
                    highlight: false,
                    hideSelected: true,
                });
            }
              };
              loadUtils();
              
          },[])

    const ventaId = Number(dataVenta?.id || 0);

    const vendedorSeleccionado = dataVenta?.vendedor_id ?? dataVenta?.vendedor ?? '';

    const formulaActualUrl = useMemo(() => {
        const formulaPath = dataVenta?.foto_formula;
        if (!formulaPath) return null;
        if (String(formulaPath).startsWith('http://') || String(formulaPath).startsWith('https://')) {
            return String(formulaPath);
        }
        if (String(formulaPath).startsWith('/media/')) {
            return buildMediaUrl(String(formulaPath));
        }
        return buildMediaUrl(`media/${String(formulaPath).replace(/^\/+/, '')}`);
    }, [dataVenta?.foto_formula]);

    const fotoVentaActualUrls = useMemo(() => {
        const fotos = Array.isArray(dataVenta?.fotosVenta) && dataVenta.fotosVenta.length
            ? dataVenta.fotosVenta
            : (dataVenta?.foto ? [dataVenta.foto] : []);

        return fotos.map((fotoPath) => {
            if (!fotoPath) return null;
            if (String(fotoPath).startsWith('http://') || String(fotoPath).startsWith('https://')) {
                return String(fotoPath);
            }
            if (String(fotoPath).startsWith('/media/')) {
                return buildMediaUrl(String(fotoPath));
            }
            return buildMediaUrl(`media/${String(fotoPath).replace(/^\/+/, '')}`);
        }).filter(Boolean);
    }, [dataVenta?.fotosVenta, dataVenta?.foto]);

    const [ventaPreviewUrls, setVentaPreviewUrls] = useState<string[]>([]);
    const [formulaPreviewUrl, setFormulaPreviewUrl] = useState<string | null>(null);

    const revokeIfBlobUrl = (url?: string | null) => {
        if (url && String(url).startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    };

    const fotoVentaPreviewPrincipal = ventaPreviewUrls[0] || null;
    const formulaPreviewPrincipal = formulaPreviewUrl || null;

    const mostrandoFotoActual = Boolean(
        fotoVentaActualUrls.length > 0 && fotoVentaPreviewPrincipal === fotoVentaActualUrls[0]
    );

    const mostrandoFormulaActual = Boolean(
        formulaActualUrl && formulaPreviewPrincipal === formulaActualUrl
    );

    const clienteInfo = useMemo(() => {
        const clienteEncontrado = clientes.find(
            (elemento) => Number(elemento.cedula) === Number(dataVenta.cliente_id)
        );

        if (clienteEncontrado) {
            return {
                cedula: clienteEncontrado.cedula,
                nombre: clienteEncontrado.nombre,
                telefono: clienteEncontrado.telefono,
            };
        }

        return {
            cedula: dataVenta.cliente_id,
        };
    }, [clientes, dataVenta.cliente_id]);

    const handleRemisionCreated = useCallback((remision: any) => {
        setDataVenta((prev) => {
            if (!prev) {
                return prev;
            }

            const remisionesPrevias = Array.isArray(prev.remisiones) ? prev.remisiones : [];
            const ventasActualizadas = Array.isArray(prev.ventas)
                ? prev.ventas.map((item) => {
                    const detalle = remision.items.find(
                        (detalleItem: any) => detalleItem.itemVenta === item.id
                    );
                      if (!detalle) {
                          return item;
                      }

                      return {
                          ...item,
                          remisionado: detalle.cantidadDespachada,
                          pendienteRemision: detalle.restante,
                      };
                })
                : prev.ventas;

            return {
                ...prev,
                remisiones: [remision, ...remisionesPrevias],
                ventas: ventasActualizadas,
            };
        });
    }, [setDataVenta]);


        useEffect(() => {
            if (fotoVentaActualUrls.length > 0) {
                setVentaPreviewUrls((prev) => (prev.length ? prev : fotoVentaActualUrls));
            }
        }, [fotoVentaActualUrls]);

        useEffect(() => {
            if (formulaActualUrl) {
                setFormulaPreviewUrl((prev) => prev || formulaActualUrl);
            }
        }, [formulaActualUrl]);

        useEffect(() => {
            return () => {
                ventaPreviewUrls.forEach((url) => revokeIfBlobUrl(url));
                revokeIfBlobUrl(formulaPreviewUrl);
            };
        }, [ventaPreviewUrls, formulaPreviewUrl]);

        const handleVentaImagesChange = (e) => {
            const files = Array.from(e.target.files || []);
            setVentaPreviewUrls((prev) => {
                prev.forEach((url) => revokeIfBlobUrl(url));
                return files.length ? files.map((file) => URL.createObjectURL(file)) : fotoVentaActualUrls;
            });
        };

        const handleFormulaImageChange = (e) => {
            const file = e.target.files?.[0];
            setFormulaPreviewUrl((prev) => {
                revokeIfBlobUrl(prev);
                if (file) {
                    return URL.createObjectURL(file);
                }
                return formulaActualUrl || null;
            });
        };

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
                    
                    <label htmlFor="email"># Pedido</label>
                    <input type="number" className="form-control" id="idVenta"  name="id" value={dataVenta.pedido} onChange={(e) => setPedido(Number(e.target.value))} />
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
                <div className="form-group col-sm-12 col-md-6 col-xl-3">
                    <label htmlFor="vendedor">Vendedor</label>
                    <select
                        ref={vendedorRef}
                        className="form-select"
                        id="vendedor"
                        name="vendedor"
                        defaultValue={vendedorSeleccionado}
                        required
                    >
                        <option value="">--</option>
                        {vendedores.map((vendedor) => (
                            <option key={vendedor.id} value={vendedor.id}>
                                {vendedor.nombre}
                            </option>
                        ))}
                    </select>
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
                <div className="row align-items-stretch g-3 mt-3 pt-2 border-top position-relative">
                  <div
                    className="d-none d-md-block position-absolute top-0 bottom-0"
                    style={{
                      left: "calc(50% + 0.75rem)",
                      transform: "translateX(-50%)",
                      width: "1px",
                      backgroundColor: "rgba(148, 163, 184, 0.12)",
                      transform: "translateX(-50%) scaleX(0.5)",
                      zIndex: 1,
                    }}
                    aria-hidden="true"
                  />
                <div className="form-group col-sm-12 col-md-6 col-xl-6 d-flex flex-column justify-content-start h-100">
                <label htmlFor="foto">Fotos de la venta:</label>
                {ventaPreviewUrls.length > 0 && (
                  <div className="mb-2">
                    <div className="small text-muted mb-2">
                      {mostrandoFotoActual ? 'Fotos actuales de la venta' : 'Vista previa de la seleccion'}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {ventaPreviewUrls.map((src, index) => (
                        <a key={`${src}-${index}`} href={src} target="_blank" rel="noreferrer" className="d-inline-block">
                          <img
                            src={src}
                            alt={mostrandoFotoActual ? `Foto actual de la venta ${index + 1}` : `Vista previa de foto de venta ${index + 1}`}
                            style={{ maxWidth: '180px', maxHeight: '180px', objectFit: 'cover' }}
                            className="img-thumbnail"
                          />
                        </a>
                      ))}
                    </div>
                    <div className="small text-muted mt-1">
                      {mostrandoFotoActual ? `${ventaPreviewUrls.length} imagenes actuales.` : `${ventaPreviewUrls.length} imagenes seleccionadas.`}
                    </div>
                  </div>
                )}
                <input type="file" className="form-control" id="imagenes" multiple accept="image/*"  name="foto" onChange={handleVentaImagesChange} />
                <div className="small text-muted mt-1">
                  Si seleccionas nuevas fotos, reemplazaran la foto actual de la venta.
                </div>
              </div>
              <div className="form-group col-sm-12 col-md-6 col-xl-6 d-flex flex-column justify-content-start ps-md-4 h-100">
                <label htmlFor="foto_formula">Foto de formula:</label>
                {formulaPreviewPrincipal && (
                  <div className="mb-2">
                    <div className="small text-muted mb-2">
                      {mostrandoFormulaActual ? 'Formula actual' : 'Vista previa de la seleccion'}
                    </div>
                    <a href={formulaPreviewPrincipal} target="_blank" rel="noreferrer" className="d-inline-block">
                      <img
                        src={formulaPreviewPrincipal}
                        alt={mostrandoFormulaActual ? 'Formula actual' : 'Formula seleccionada'}
                        className="img-thumbnail"
                        style={{ maxWidth: '220px', maxHeight: '220px', objectFit: 'contain' }}
                      />
                    </a>
                    <div className="small text-muted mt-1">
                      Si seleccionas un nuevo archivo, se reemplazara la formula actual.
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  className="form-control"
                  id="foto_formula"
                  name="foto_formula"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFormulaImageChange}
                />
              </div>
              </div>
                
                <hr className="my-3" />
                <div className="row my-1">
                <div className="form-group">
                {/* <FormulaLentes data={data} />  */}
                <TablaArticulos articulos={data.articulos || []} ventaData={dataVenta.ventas} />
                <Abonos
                    data={data}
                    ventaData={dataVenta.abonos}
                    totalAbonoLoad={dataVenta.totalAbono}
                    condicionPagoInit={dataVenta.condicion_pago}
                    compromisoPagoInit={dataVenta.cuotas}
                    fechaInicioInit={dataVenta.fecha_inicio}
                    fechaVencimientoInit={dataVenta.fecha_vencimiento}
                />
                
                    <button type="submit" className="btn btn-primary col-12" id="submitVenta" >
                    Actualizar venta
                    </button>
                </div>
                </div>

            
        </form>

        <div className="container-md px-0 mt-5">
            <RemisionesPanel
                ventaId={Number(ventaId)}
                items={dataVenta.ventas ?? []}
                remisiones={dataVenta.remisiones ?? []}
                articulos={data.articulos ?? []}
                cliente={clienteInfo}
                onCreated={handleRemisionCreated}
            />
        </div>
    </>
                )
}

export default VentaUpdateForm;
