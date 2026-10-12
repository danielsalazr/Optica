// @ts-nocheck
"use client";
import React, { useRef, useEffect, useState } from 'react'
import TablaArticulos from '@/components/TablaArticulos';
import dynamic from 'next/dynamic';

import { buildMediaUrl } from "@/utils/js/env";
import { handleFormSubmitUpdate, handleFormSubmit } from "@/utils/js/ventaFormSubmit.js"
import "@/styles/style.css"
import '@/styles/selectwithImage.css';
import Abonos from '@/components/abonos/Abonos';
import SaleMobileSummary from './SaleMobileSummary';
import SalePhotoUpload from './SalePhotoUpload';
import '@/styles/sale-form.css';
import { SALE_CONTEXT_KEY, resolveSaleContext } from '@/utils/js/saleContext';
import { useWarehouses } from '@/hooks/useWarehouses';

import $ from 'jquery';

import BootstrapModal from '../bootstrap/BootstrapModal';
import { UserRoundPlus } from 'lucide-react';

const ClientesForm = dynamic(() => import('../usuarios/ClientesForm'), {
  loading: () => <p role="status">Cargando formulario de cliente...</p>,
});
const EmpresaForm = dynamic(() => import('../usuarios/EmpresaForm'), {
  loading: () => <p role="status">Cargando formulario de empresa...</p>,
});

function VentaForm({ data, ventaData = null, disabled = false }) {
    const { warehouses, error: warehouseError } = useWarehouses();
    const saleWarehouse = String(ventaData?.bodega_id ?? ventaData?.bodega ?? 1);
    const [warehouseSelection, setWarehouseSelection] = useState(saleWarehouse);
    const editing = Boolean(ventaData);
    const mediaUrl = (path) => {
      if (!path) return null;
      if (/^https?:\/\//.test(String(path))) return String(path);
      return buildMediaUrl(String(path).startsWith('/media/') ? path : `media/${String(path).replace(/^\/+/, '')}`);
    };
    const currentFormulaUrl = mediaUrl(ventaData?.foto_formula);
    const currentPhotos = (ventaData?.fotosVenta?.length ? ventaData.fotosVenta : (ventaData?.foto ? [ventaData.foto] : [])).map(mediaUrl).filter(Boolean);
    const formRef = useRef(null);
    const usuarioRef = useRef(null);
    const empresaRef = useRef(null);
    const vendedorRef = useRef(null);
    const telefonoRef = useRef(null);

    const [empresa, setEmpresa] = useState('');
    const [usuario, setUsuario] = useState(null);
    const [pedido, setPedido] = useState(ventaData?.pedido ?? data.pedido);
    const [reiniciarModulos, seRreiniciarModulos] = useState(false);
    const [modalShow, setModalShow] = React.useState(false);

    const [modalEmpresaShow, setModalEmpresaShow] = React.useState(false);
    const [clientes, setClientes] = useState(data.clientes);
    const [empresas, setEmpresas] = useState(data.empresas);
    const [vendedores, setVendedores] = useState(data.vendedores || []);
    const [jornadas, setJornadas] = useState(() => {
      const options = [...(data.jornadas || [])];
      if (ventaData?.jornadaData && !options.some(item => String(item.id) === String(ventaData.jornadaData.id))) options.unshift(ventaData.jornadaData);
      return options;
    });
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>(String(ventaData?.empresaId || ''));
    const [jornadaSeleccionada, setJornadaSeleccionada] = useState(String(ventaData?.jornada_id ?? ventaData?.jornada ?? ''));
    const [recordarContexto, setRecordarContexto] = useState(false);
    const [contextPreferenceChanged, setContextPreferenceChanged] = useState(false);
    const [contextReady, setContextReady] = useState(false);
    const [contextNotice, setContextNotice] = useState('');
    const contextInitialized = useRef(false);
    const [formulaPreviewUrl, setFormulaPreviewUrl] = useState<string | null>(null);
    const [notesExpanded, setNotesExpanded] = useState(false);
    const [photosExpanded, setPhotosExpanded] = useState(false);

    let selectizeInstance = null;

    const now = new Date();
    const fechaHoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const formatFecha = (fecha: string) => {
      if (!fecha) {
        return '';
      }
      const date = new Date(`${fecha}T00:00:00`);
      if (Number.isNaN(date.getTime())) {
        return fecha;
      }
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    const estadoJornadaLabels: Record<string, string> = {
      planned: 'Planificada',
      in_progress: 'En progreso',
      closed: 'Cerrada',
    };

    const currentJornadaId = String(ventaData?.jornada_id ?? ventaData?.jornada ?? '');
    const jornadasFiltradas = jornadas.filter(jornada => {
      const current = editing && String(jornada.id) === currentJornadaId && empresaSeleccionada === String(ventaData?.empresaId || '');
      return current || (jornada.estado !== 'closed' && (!empresaSeleccionada || String(jornada.empresa_id) === empresaSeleccionada));
    });

    const handleEmpresaChange = (value: string) => {
      const nextCompany = String(value || '');
      setEmpresaSeleccionada(nextCompany);
      setJornadaSeleccionada(previous => {
        if (editing && previous === currentJornadaId && nextCompany === String(ventaData?.empresaId || '')) return previous;
        return resolveSaleContext({ empresaId: nextCompany, jornadaId: previous }, empresas, jornadas).jornadaId;
      });
    };
    const companyChangeRef = useRef(handleEmpresaChange);
    companyChangeRef.current = handleEmpresaChange;

    useEffect(() => {
      if (editing) {
        setContextReady(true);
        return;
      }
      if (!data.contextOptionsLoaded || contextInitialized.current) return;
      contextInitialized.current = true;
      try {
        const raw = localStorage.getItem(SALE_CONTEXT_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          const context = resolveSaleContext(saved, empresas, jornadas);
          setEmpresaSeleccionada(context.empresaId);
          setJornadaSeleccionada(context.jornadaId);
          setRecordarContexto(Boolean(context.empresaId));
          if (saved?.jornadaId && !context.jornadaId) {
            setContextNotice('La jornada recordada ya no esta disponible para esta empresa. Selecciona otra.');
          } else if (!context.empresaId) {
            setContextNotice('La empresa recordada ya no esta disponible. Selecciona otra.');
          }
        }
      } catch {
        setContextNotice('No se pudo recuperar la seleccion guardada en este navegador.');
      }
      setContextReady(true);
    }, [editing, data.contextOptionsLoaded, empresas, jornadas]);

    useEffect(() => {
      if (!contextReady || (editing && !contextPreferenceChanged)) return;
      try {
        const context = resolveSaleContext({ empresaId: empresaSeleccionada, jornadaId: jornadaSeleccionada }, empresas, jornadas);
        if (recordarContexto && context.empresaId) {
          localStorage.setItem(SALE_CONTEXT_KEY, JSON.stringify(context));
        } else {
          localStorage.removeItem(SALE_CONTEXT_KEY);
        }
      } catch {
        setContextNotice('El navegador no permite recordar la seleccion. Puedes continuar con la venta.');
      }
    }, [editing, contextPreferenceChanged, contextReady, recordarContexto, empresaSeleccionada, jornadaSeleccionada, empresas, jornadas]);

    useEffect(() => {
      const select = empresaRef.current;
      if (select?.selectize) select.selectize.setValue(empresaSeleccionada);
      else if (select) select.value = empresaSeleccionada;
    }, [empresa, empresaSeleccionada]);

      useEffect(() => {
              let isMounted = true;

              const initClientOnly = async () => {
                await import('selectize');

                if (!isMounted) {
                  return;
                }

                if (usuarioRef.current) {
                    selectizeInstance = $(usuarioRef.current).selectize({
                        create: true,
                        createOnBlur: true,
                        persist: false,
                        maxItems: 1,
                        hideSelected: true,
                    });
        
                    if (disabled) selectizeInstance[0].selectize.disable();
                    setUsuario(selectizeInstance);
                }

                if (empresaRef.current) {
                    const selectizeInstance2 = $(empresaRef.current).selectize({
                        createOnBlur: true,
                        persist: false,
                        maxItems: 1,
                        highlight: false,
                        hideSelected: true,
                    });
        
                    if (disabled) selectizeInstance2[0].selectize.disable();
                    setEmpresa(selectizeInstance2);
                    selectizeInstance2[0].selectize.on('change', (value: string) => {
                        companyChangeRef.current(value);
                    });
                }

                if (vendedorRef.current) {
                    const seller = $(vendedorRef.current).selectize({
                        createOnBlur: true,
                        persist: false,
                        maxItems: 1,
                        highlight: false,
                        hideSelected: true,
                    });
                    if (disabled) seller[0].selectize.disable();
                }
              };

              initClientOnly();

              return () => {
                isMounted = false;
                [usuarioRef, empresaRef, vendedorRef].forEach(ref => ref.current?.selectize?.destroy());
              };

          },[])

    useEffect(() => {
      [usuarioRef, empresaRef, vendedorRef].forEach(ref => {
        const selector = ref.current?.selectize;
        if (selector) disabled ? selector.disable() : selector.enable();
      });
    }, [disabled, usuario, empresa]);

        useEffect(() => {
            return () => {
                if (formulaPreviewUrl) {
                    URL.revokeObjectURL(formulaPreviewUrl);
                }
            };
        }, [formulaPreviewUrl]);

        const handleFormulaImageChange = (e) => {
            const file = e.target.files?.[0];
            setFormulaPreviewUrl(file ? URL.createObjectURL(file) : null);
        };

        const handleNuevoCliente = (nuevoCliente) => {
            setClientes(previous => [...previous, { ...nuevoCliente, cedula: nuevoCliente.cedula ?? nuevoCliente.id }]);
            if (usuario) {
                usuario[0].selectize.addOption({ value: nuevoCliente.id, text: `${nuevoCliente.id} - ${nuevoCliente.nombre} - ${nuevoCliente.telefono}`}); // Agregar el nuevo cliente al selector
                usuario[0].selectize.refreshOptions(false); // Refrescar las opciones del selector
            }
        };

        const handleNuevaEmpresa = (nuevaEmpresa) => {
            if (empresa) {

                if (!nuevaEmpresa.id) return;
                setEmpresas(previous => [...previous, nuevaEmpresa]);
                empresa[0].selectize.addOption({ value: nuevaEmpresa.id, text: nuevaEmpresa.nombre });
                empresa[0].selectize.refreshOptions(false); // Refrescar las opciones del selector
            }
        };

        const toggleReinicioModulos = () => {
            seRreiniciarModulos(!reiniciarModulos);
        }

        const handleFormSubmitWrapper = async (e, formRef, usuario, empresa, telefonoRef) => {
            if (disabled) {
              e.preventDefault();
              return;
            }
            if (editing) {
              return handleFormSubmitUpdate(e, formRef, usuario, empresa, telefonoRef);
            }
            const nextContext = recordarContexto
              ? resolveSaleContext({ empresaId: empresaSeleccionada, jornadaId: jornadaSeleccionada }, empresas, jornadas)
              : { empresaId: '', jornadaId: '' };
            const formulario = await handleFormSubmit(e, formRef, usuario, empresa, telefonoRef);
            if (formulario == true) 
                {    
                    setPedido(parseInt(pedido) + 1 );
    
                    formRef.current.reset();
                    setFormulaPreviewUrl(null);


                    usuario[0].selectize.clear();
                    empresa[0].selectize.setValue(nextContext.empresaId);
                    setEmpresaSeleccionada(nextContext.empresaId);
                    setJornadaSeleccionada(nextContext.jornadaId);
                    
                    toggleReinicioModulos()
                    
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

        <form ref={formRef} className={`container-md sale-create-form ${editing ? 'sale-edit-form' : ''}`} id="ventaForm" onSubmit={(e) => handleFormSubmitWrapper(e, formRef, usuario, empresa, telefonoRef)} encType="multipart/form-data">
            {editing && <input type="hidden" name="venta_snapshot" value={ventaData?.snapshot || ''} />}
            {disabled && <div className="alert alert-warning" role="alert">Esta venta tiene condicion de pago de contado y ya fue remisionada. No se permite editarla.</div>}
            <fieldset disabled={disabled}>

                <div className="row sale-basics-grid">
                <div className="form-group col-sm-12 col-md-6 col-xl-3">
                    
                    <label htmlFor="idVenta"># Pedido</label>
                    <input type="number" className="form-control" id="idVenta" name="id" value={pedido} readOnly={editing} onChange={(e) => setPedido(Number(e.target.value))} />
                </div>

                <div className="form-group col-sm-12 col-md-12 col-xl-6">
                    <label htmlFor="cedula">Cedula cliente:</label>

                    <div className="input-group mb-3">
                        
                        <select ref={usuarioRef} className="form-select camposbc " id="cedula" name="cliente_id" defaultValue={ventaData?.cliente_id ?? ''} required>
                            <option key="" value="">--</option>
                            
                            {clientes.map(element => (
                                <option key={element.cedula} value={element.cedula}>
                                {element.cedula} - {element.nombre} - {element.telefono}</option> 
                            ))}
                        </select>
                        <button type="button" aria-label="Crear cliente" title="Crear cliente" className="btn btn-outline-dark position-relative" onClick={() => setModalShow(true)}> <UserRoundPlus  size={24} /> </button>
                    </div>
                </div>

                <div className="form-group col-sm-12 col-md-6 col-xl-3 col-xl-3">
                    <label htmlFor="EmpresaCliente">Empresa:</label>

                    <div className="input-group mb-3">
                    <select ref={empresaRef} className="form-select  " id="EmpresaCliente" name={editing ? "empresaCliente" : "EmpresaCliente"} defaultValue={ventaData?.empresaId ?? ''} required onChange={event => handleEmpresaChange(event.target.value)}>
                        <option key="" value="">--</option>
                        
                        {empresas.map(element => (
                            <option key={element.id} value={element.id}>
                            {element.nombre}</option> 
                        ))}
                    </select>

                        <button type="button" aria-label="Crear empresa" title="Crear empresa" className="btn btn-outline-dark position-relative" onClick={() => setModalEmpresaShow(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width={28} height={28} viewBox="0 0 1024 1024"><path fill="currentColor" d="M839.7 734.7c0 33.3-17.9 41-17.9 41S519.7 949.8 499.2 960c-10.2 5.1-20.5 5.1-30.7 0c0 0-314.9-184.3-325.1-192c-5.1-5.1-10.2-12.8-12.8-20.5V368.6c0-17.9 20.5-28.2 20.5-28.2L466 158.6q19.2-7.65 38.4 0s279 161.3 309.8 179.2c17.9 7.7 28.2 25.6 25.6 46.1c-.1-5-.1 317.5-.1 350.8M714.2 371.2c-64-35.8-217.6-125.4-217.6-125.4c-7.7-5.1-20.5-5.1-30.7 0L217.6 389.1s-17.9 10.2-17.9 23v297c0 5.1 5.1 12.8 7.7 17.9c7.7 5.1 256 148.5 256 148.5c7.7 5.1 17.9 5.1 25.6 0c15.4-7.7 250.9-145.9 250.9-145.9s12.8-5.1 12.8-30.7v-74.2l-276.5 169v-64c0-17.9 7.7-30.7 20.5-46.1L745 535c5.1-7.7 10.2-20.5 10.2-30.7v-66.6l-279 169v-69.1c0-15.4 5.1-30.7 17.9-38.4zM919 135.7c0-5.1-5.1-7.7-7.7-7.7h-58.9V66.6c0-5.1-5.1-5.1-10.2-5.1l-30.7 5.1c-5.1 0-5.1 2.6-5.1 5.1V128h-56.3c-5.1 0-5.1 5.1-7.7 5.1v38.4h69.1v64c0 5.1 5.1 5.1 10.2 5.1l30.7-5.1c5.1 0 5.1-2.6 5.1-5.1v-56.3h64z"></path></svg>    
                        </button>
                    </div>

                                </div>
                <div className="form-group col-sm-12 col-md-6 col-xl-3">
                    <label htmlFor="jornada">Jornada</label>
                    <select className="form-select" id="jornada" name="jornada" value={jornadaSeleccionada} onChange={event => { setJornadaSeleccionada(event.target.value); setContextNotice(''); }}>
                        <option value="">Sin jornada</option>
                        {jornadasFiltradas.map((jornada) => {
                            const fechaReferencia = jornada.fecha_inicio || jornada.fecha;
                            const fechaLegible = formatFecha(fechaReferencia) || fechaReferencia;
                            const estadoLegible = estadoJornadaLabels[jornada.estado] || jornada.estado;
                            return (
                                <option key={jornada.id} value={jornada.id}>
                                    {jornada.empresa__nombre}
                                    {jornada.sucursal ? ` - ${jornada.sucursal}` : ""}
                                    {` | ${fechaLegible} (${estadoLegible})`}
                                </option>
                            );
                        })}
                    </select>
                    <small className="form-text text-muted">
                        Vincula la venta a una jornada activa o&nbsp;
                        <a href="/jornadas" target="_blank" rel="noreferrer">
                            crea una nueva
                        </a>.
                    </small>
                    <label className="sale-context-retention" htmlFor="recordar-contexto" title="Conserva la empresa y la jornada al guardar una venta y al volver a Crear Venta en este navegador.">
                      <input id="recordar-contexto" type="checkbox" checked={recordarContexto} disabled={!contextReady || !empresaSeleccionada} onChange={event => { setContextPreferenceChanged(true); setRecordarContexto(event.target.checked); setContextNotice(''); }} />
                      <span>Recordar empresa y jornada</span>
                    </label>
                    {recordarContexto && <small className="d-block text-muted">Para nuevas ventas, en este navegador. Desmarca para dejar de recordar.</small>}
                    {contextNotice && <small role="status" className="d-block text-warning-emphasis">{contextNotice}</small>}
                </div>
                <div className="form-group col-sm-12 col-md-6 col-xl-3 sale-seller-field">
                    <label htmlFor="vendedor">Vendedor</label>
                    <select ref={vendedorRef} className="form-select" id="vendedor" name="vendedor" defaultValue={ventaData?.vendedor_id ?? ventaData?.vendedor ?? ''} required>
                        <option value="">--</option>
                        {vendedores.map((vendedor) => (
                            <option key={vendedor.id} value={vendedor.id}>
                                {vendedor.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group col-sm-12 col-md-6 col-xl-3 sale-date-field">
                    <label htmlFor="fechaVenta">Fecha de venta</label>
                    <input type="date" className="form-control" id="fechaVenta" name="fecha" defaultValue={ventaData?.fecha?.slice(0, 10) ?? fechaHoy} required />
                </div>
                <div className="form-group col-sm-12 col-md-6 col-xl-3">
                    <label htmlFor="sale-warehouse">Bodega de origen</label>
                    <select id="sale-warehouse" name="bodega" className="form-select" value={warehouseSelection} onChange={event => setWarehouseSelection(event.target.value)} disabled={disabled || ventaData?.bodega_bloqueada}>
                      {!warehouses.length && <option value={saleWarehouse}>{ventaData?.bodega_nombre || 'Bodega principal'}</option>}
                      {warehouses.filter(bodega => bodega.activa || String(bodega.id) === saleWarehouse).map(bodega => <option key={bodega.id} value={bodega.id} disabled={!bodega.activa}>{bodega.nombre}{bodega.activa ? '' : ' (Inactiva)'}</option>)}
                    </select>
                    {ventaData?.bodega_bloqueada && <input type="hidden" name="bodega" value={saleWarehouse} />}
                    <small className="text-muted">Origen de las reservas y despachos de inventario.</small>
                    {warehouseError && <small role="alert" className="text-danger">{warehouseError}</small>}
                </div>
                
                </div>
                <div className="sale-optional-section">
                <button type="button" className="sale-section-toggle" aria-expanded={notesExpanded} aria-controls="sale-notes" onClick={() => setNotesExpanded(!notesExpanded)}>
                  Detalle y observaciones <span aria-hidden="true">{notesExpanded ? '-' : '+'}</span>
                </button>
                <div id="sale-notes" className={`sale-section-content ${notesExpanded ? '' : 'sale-section-collapsed'}`}>
                <div className="row"> 
                    <div className="form-group col-sm-12 col-md-12 col-xl-6 ">
                        <label htmlFor="detalleVenta">Detalle</label>
                        <textarea rows={3} cols={50} className="form-control" id="detalleVenta" name="detalle" placeholder="Detalle" defaultValue={ventaData?.detalle ?? ''}  />
                    </div>
                <div className="form-group col-sm-12 col-md-12 col-xl-6">
                    <label htmlFor="observacionVenta">Observaciones:</label>
                    <textarea rows={3} cols={50} className="form-control" id="observacionVenta" name="observacion" placeholder="Observaciones" defaultValue={ventaData?.observacion ?? ''} />
                </div>
                </div>
                </div>
                </div>
                <div className="sale-optional-section">
                <button type="button" className="sale-section-toggle" aria-expanded={photosExpanded} aria-controls="sale-photos" onClick={() => setPhotosExpanded(!photosExpanded)}>
                  Fotos de venta y formula <span aria-hidden="true">{photosExpanded ? '-' : '+'}</span>
                </button>
                <div id="sale-photos" className={`sale-section-content ${photosExpanded ? '' : 'sale-section-collapsed'}`}>
                <div className="row align-items-stretch g-3 mt-3 pt-2 border-top position-relative">
                  <div
                    className="d-none d-md-block position-absolute top-0 bottom-0"
                    style={{
                      left: "calc(50% + 0.75rem)",
                      transform: "translateX(-50%) scaleX(0.5)",
                      width: "1px",
                      backgroundColor: "rgba(148, 163, 184, 0.12)",
                      zIndex: 1,
                    }}
                    aria-hidden="true"
                  />
                <div className="form-group col-sm-12 col-md-6 col-xl-6 d-flex flex-column justify-content-start h-100">
                <SalePhotoUpload existingUrls={currentPhotos} />
              </div>
              <div className="form-group col-sm-12 col-md-6 col-xl-6 d-flex flex-column justify-content-start ps-md-4 h-100">
                <label htmlFor="foto_formula">Foto de formula:</label>
                {(formulaPreviewUrl || currentFormulaUrl) && (
                  <div className="mb-2">
                    <div className="small text-muted mb-2">{formulaPreviewUrl ? 'Vista previa de la seleccion' : 'Formula actual'}</div>
                    <a href={formulaPreviewUrl || currentFormulaUrl} target="_blank" rel="noreferrer" className="d-inline-block">
                      <img
                        src={formulaPreviewUrl || currentFormulaUrl}
                        alt={formulaPreviewUrl ? "Formula seleccionada" : "Formula actual"}
                        className="img-thumbnail"
                        style={{ maxWidth: '220px', maxHeight: '220px', objectFit: 'contain' }}
                      />
                    </a>
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
              </div>
              </div>
                
                <hr className="my-3" />
                <div className="row my-1">
                <div className="form-group">
                
                <TablaArticulos articulos={data.articulos || []} ventaData={ventaData?.ventas} clear={reiniciarModulos} changeClear={toggleReinicioModulos}/>
                <Abonos data={data} ventaData={ventaData?.abonos} totalAbonoLoad={ventaData?.totalAbono} condicionPagoInit={ventaData?.condicion_pago} compromisoPagoInit={ventaData?.cuotas} fechaInicioInit={ventaData?.fecha_inicio} fechaVencimientoInit={ventaData?.fecha_vencimiento} clear={reiniciarModulos} changeClear={toggleReinicioModulos}/>
                
                    <div className="sale-submit-bar">
                    <SaleMobileSummary formRef={formRef} />
                    <button type="submit" className="btn btn-primary col-12" id="submitVenta" disabled={disabled}>
                        {editing ? 'Actualizar venta' : 'Crear venta'}
                    </button>
                    </div>
                </div>
                </div>

            </fieldset>
            </form>
        </>
  )
}

export default VentaForm
