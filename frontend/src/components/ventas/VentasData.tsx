"use client";
import React, { useState, useEffect } from 'react'
import { moneyformat, fechaFormat } from '@/utils/js/utils';
import { swalErr, swalHtml, swalconfirmation, swalInput, swalQuestion } from '@/utils/js/sweetAlertFunctions';

import Link from 'next/link'

import DataTables from '@/components/Datatables';
import SideAction from '../bootstrap/SideAction';
import AbonosForm from '../abonos/AbonosForm';
import AbonosList from '../abonos/AbonosList';
import AnularVentaForm from './AnularVentaForm';
import RemisionesPanel from '@/components/remisiones/RemisionesPanel';

import BootstrapModal from '../bootstrap/BootstrapModal';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import '@/styles/style.css';
import { callApi } from '@/utils/js/api';






import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { title } from 'process';

const ESTADO_PEDIDO_FLOW = ['creado', 'para_fabricacion', 'en_fabricacion', 'listo_entrega', 'entregado'];

const identifyEstadoPedidoKey = (nombre?: string): string => {
  const value = (nombre || '').toLowerCase();
  if (value.includes('pendiente') || value.includes('pedido tomado') || value.includes('creado')) {
    return 'creado';
  }
  if (value.includes('enviar a fabric')) {
    return 'para_fabricacion';
  }
  if (value.includes('en fabric')) {
    return 'en_fabricacion';
  }
  if (value.includes('listo')) {
    return 'listo_entrega';
  }
  if (value.includes('garantia') || value.includes('entregado')) {
    return 'entregado';
  }
  return 'creado';
};

const estadoPedidoBadgeClass = (key: string): string => {
  switch (key) {
    case 'creado':
      return 'bg-secondary';
    case 'para_fabricacion':
      return 'bg-info text-dark';
    case 'en_fabricacion':
      return 'bg-warning text-dark';
    case 'listo_entrega':
      return 'bg-primary';
    case 'entregado':
      return 'bg-success';
    default:
      return 'bg-secondary';
  }
};

function VentasData(props) {
  let { header, data, generalData } = props;
  const [templateAbono, setTemplateAbono] = useState(0);
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [sideTemplate, setSideTemplate] = useState(false);
  const [modalAnularShow, setModalAnularShow] = useState(false);
  const [clientData, setClientData] = useState(false);
  const [sideBarData, setSideBarData] = useState([]);
  const [dataTablee, setDataTable] = useState(data);
  const [overrideData, setOverrideData] = useState(0);
  const [estadoLoading, setEstadoLoading] = useState<number | null>(null);
  const [remisionModalOpen, setRemisionModalOpen] = useState(false);
  const [remisionLoading, setRemisionLoading] = useState(false);
  const [remisionError, setRemisionError] = useState<string | null>(null);
  const [remisionContext, setRemisionContext] = useState(null);
  const [remisionRowContext, setRemisionRowContext] = useState(null);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const toggleState = () => {
    setShow(!show);
  };

  const fetchRemisionData = async (ventaId: number) => {
    setRemisionLoading(true);
    setRemisionError(null);
    try {
      const req = await callApi(`venta/${ventaId}`);
      if (!req.res.ok) {
        throw new Error(req.data?.detail || 'No fue posible obtener la información de remisiones.');
      }
      setRemisionContext(req.data);
    } catch (error) {
      console.error(error);
      setRemisionContext(null);
      setRemisionError(error instanceof Error ? error.message : 'Error desconocido al cargar remisiones.');
    } finally {
      setRemisionLoading(false);
    }
  };

  const handleRemisionModal = async (rowData) => {
    setRemisionRowContext(rowData);
    setRemisionModalOpen(true);
    await fetchRemisionData(rowData.id);
  };

  const handleRemisionCreated = async () => {
    if (remisionRowContext) {
      await fetchRemisionData(remisionRowContext.id);
    }
    await handleFetchVentas(false);
  };

  const getPrecioRaw = (row) => Number(row?.precioRaw ?? 0);
  const getAbonoRaw = (row) => Number(row?.totalAbonoRaw ?? 0);

  const cumpleMitadPago = (row) => {
    const precio = getPrecioRaw(row);
    const abono = getAbonoRaw(row);
    if (precio <= 0) {
      return false;
    }
    return abono >= Math.ceil(precio / 2);
  };

  const buildEstadoAction = (row) => {
    const key = identifyEstadoPedidoKey(row?.estadoPedidoNombre);
    if (key === 'creado') {
      return {
        slug: 'para_fabricacion',
        label: 'Marcar para enviar a fabricación',
        needsHalfPayment: true,
      };
    }
    if (key === 'para_fabricacion') {
      return {
        slug: 'en_fabricacion',
        label: 'Enviar a fabricación',
        requiresDetail: true,
      };
    }
    if (key === 'en_fabricacion') {
      return {
        slug: 'listo_entrega',
        label: 'Marcar listo para entrega',
      };
    }
    return null;
  };



  const handleFetchVentas = async (withToggle = true) => {
    //etLoading(true);

    const res = await fetch("http://localhost:8000/venta/", {
      cache: "no-store", // 🔥 Equivalente a getServerSideProps (sin caché)
    });
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    let redata = await res.json();

    console.log(redata)
    redata = redata.map(item => {
      // Eliminar el símbolo "$" y reemplazar "." por ","
      item.precio = moneyformat(item.precio)
      item.totalAbono = moneyformat(item.totalAbono)
      item.saldo = moneyformat(item.saldo)
      return item; // Retornar el objeto modificado
    });
    setDataTable(redata)
    console.log(dataTablee)
    if (withToggle) {
      toggleState()
    }
    return redata
  };

  const handleAction = async (action, rowData) => {
    switch (action) {
      case "eliminar":
        console.log(action)
        console.log("Eliminar:", rowData);
        setOverrideData(rowData.id)
        setModalAnularShow(!modalAnularShow)

        // const question = await swalQuestion("¿Esta seguro de eliminar el abono?")

        // if (!question) {
        //   return false
        // }



        // const req = await fetch(`http://localhost:8000/media/${rowData.factura}`, {
        //   method: 'DELETE',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        // });

        break;

      case "editar":
        console.log(action)
        console.log("Editar:", rowData);
        break;

      case "abonar":
        console.log(action)
        setClientData(rowData);
        setTemplateAbono(1);
        console.log(templateAbono)
        toggleState();
        break;

      case "verAbonos":
        setClientData(rowData);
        setTemplateAbono(2);
        console.log(templateAbono)
        toggleState();
        break;

      default:
        console.log("Acción no reconocida:", action);
    }
  };

  const handleEstadoPedidoAction = async (rowData) => {
    const config = buildEstadoAction(rowData);
    if (!config) {
      await swalErr('Este pedido ya completó todos los estados configurados.');
      return;
    }

    if (config.needsHalfPayment && !cumpleMitadPago(rowData)) {
      await swalErr('Debe registrarse al menos el 50% del valor de la venta para enviar a fabricación.');
      return;
    }

    let detalle = null;
    if (config.requiresDetail) {
      detalle = await swalInput('Estás enviando a fabricar sin cumplir con la mitad del pago. ¿Cuál es el motivo?');
      if (detalle === null) {
        return;
      }
      if (!detalle.trim()) {
        await swalErr('Debe ingresar un motivo válido.');
        return;
      }
    }

    setEstadoLoading(rowData.id);
    try {
      const req = await callApi(`venta/${rowData.id}/estado-pedido/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: config.slug,
          ...(detalle ? { detalle } : {}),
        }),
      });

      if (!req.res.ok) {
        await swalErr(req.data?.detail || 'No fue posible actualizar el estado.');
        return;
      }

      await swalconfirmation(`Estado actualizado: ${req.data?.estado || config.label}.`);
      await handleFetchVentas(false);
    } catch (error) {
      console.error(error);
      await swalErr('Ocurrió un error al actualizar el estado.');
    } finally {
      setEstadoLoading(null);
    }
  };

  const columns = [
    { title: "Pedido", data: "id"},
    { "data": "cedula" },
    { "data": "cliente" },
    { "data": "precio" },
    { "data": "totalAbono" },
    { "data": "saldo" },
    { title: "Estado", data: "estadoPedidoNombre", name: 'estado_pedido', className: 'dt-body-center estado-pedido-col',
      render: (data, type, row) => {
        const value = (data ?? '').toString().trim() || 'Creado / Pendiente de pago (Pedido tomado)';
        if (type === 'display') {
            const key = identifyEstadoPedidoKey(value);
            const badge = estadoPedidoBadgeClass(key);
          const detail = row?.estadoPedidoDetalle ? row.estadoPedidoDetalle.replace(/"/g, '&quot;') : '';
          const titleAttr = detail ? `title="${detail}"` : '';
          return `<span class="badge ${badge} badge-estado-pedido" ${titleAttr}>${value}</span>`;
        }
        return value;
      }
    },
    { title: "Estado pago", data: "estado", name: 'estado_pago', className: 'dt-body-center estado-pago-col',
      render: (data, type) => {
        const value = (data ?? '').toString().trim();
        if (type === 'display') {
          const v = value.toLowerCase();
          const color =
            v === 'anulado'   ? 'danger'  :
            v === 'pagado'    ? 'success' :
            v === 'con abono' ? 'info'    :
                                'warning';
          return `<span class="badge bg-${color} badge-estado-pedido">${value}</span>`;
        }
        return value;
      }
    },
    {
      "data": null, "name": 'Acciones',
    }

  ];

  const slots = {
    // estado: (data, row) => {
    //   return (
    //     <span className={`badge ${data === "Pagado" ? 'bg-success' : data === "Con abono" ? 'bg-warning' : data == "Sin Pago" ? 'bg-danger' : "anulado"}`}

    //       style={{ fontSize: '16px', }}>
    //       {data}
    //     </span >
    //   );
    // },
    Acciones: (data, row) => (
      <div className='gap-2 d-flex justify-content-center flex-wrap'>
        <button
          className="btn-action btn btn-sm btn-outline-secondary"
          data-bs-container="body"
          data-bs-toggle="popover"
          data-bs-placement="top"
          data-bs-content="Actualizar estado del pedido"
          data-bs-delay='{"show":500,"hide":150}'
          data-bs-trigger="hover"
          onClick={() => handleEstadoPedidoAction(row)}
          disabled={estadoLoading === row.id}
        >
          {estadoLoading === row.id ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M12 6V3m-6.364 4.636L3.514 6.514m14.95 1.122l2.122-2.122M6 12H3m18 0h-3m-9 6v3m11.314-5.314l-2.122 2.122M5.05 17.95l-2.122 2.122"/><circle cx="12" cy="12" r="3"/></g></svg>
          )}
        </button>

        <button
          className="btn-action btn btn-sm btn-danger"
          // data-action="eliminar"
          data-bs-container="body"
          data-bs-toggle="popover"
          data-bs-placement="top"
          data-bs-content="Eliminar Abono"
          data-bs-delay='{"show":500,"hide":150}'
          data-bs-trigger="hover"
          onClick={() => handleAction("eliminar", row)}

        >

          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
        </button>
        <button
          className="btn-action btn btn-sm btn-outline-primary"
          data-bs-container="body"
          data-bs-toggle="popover"
          data-bs-placement="top"
          data-bs-content="Remisiones"
          data-bs-delay='{"show":500,"hide":150}'
          data-bs-trigger="hover"
          onClick={() => handleRemisionModal(row)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M4 5h16M4 19h16M9 5v8a2 2 0 0 0 2 2h2"></path><path d="M15 19v-8a2 2 0 0 0-2-2h-2"></path></g></svg>
        </button>
        <button
          className="btn-action btn btn-sm btn-primary"
          // data-action="editar"
          data-bs-container="body"
          data-bs-toggle="popover"
          data-bs-placement="top"
          data-bs-content="Editar Abono"
          data-bs-delay='{"show":500,"hide":150}'
          data-bs-trigger="hover"
          onClick={() => handleAction("editar", row)}
        >
          <Link href={`ventas/${row.id}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16zm9.5-13.5l4 4" /></svg>
          </Link>
          {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16zm9.5-13.5l4 4"/></svg> */}

        </button>
        <button
          className="btn-action btn btn-sm btn-primary"
          // data-action="abonar"
          data-bs-container="body"
          data-bs-toggle="popover"
          data-bs-placement="top"
          // data-bs-content="Abonar a factura"
          data-bs-delay='{"show":500,"hide":150}'
          data-bs-trigger="hover"
          onClick={() => handleAction("abonar", row)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M21 15h-2.5a1.503 1.503 0 0 0-1.5 1.5a1.503 1.503 0 0 0 1.5 1.5h1a1.503 1.503 0 0 1 1.5 1.5a1.503 1.503 0 0 1-1.5 1.5H17m2 0v1m0-8v1m-6 6H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2m12 3.12V9a2 2 0 0 0-2-2h-2" /><path d="M16 10V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6m8 0H8m8 0h1m-9 0H7m1 4v.01M8 17v.01m4-3.02V14m0 3v.01" /></g></svg>
        </button>

        <button
          className="btn-action btn btn-sm btn-primary"
          // data-action="verAbonos"
          data-bs-container="body"
          data-bs-toggle="popover"
          data-bs-placement="top"
          data-bs-content="Ver historico de abonos"
          data-bs-delay='{"show":500,"hide":150}'
          data-bs-trigger="hover"
          onClick={() => handleAction("verAbonos", row)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2m5 6h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10m2 0v1m0-8v1" /></g></svg>
        </button>
        <button
          className="btn-action btn btn-sm btn-primary"
          // data-action="verAbonos"
          data-bs-container="body"
          data-bs-toggle="popover"
          data-bs-placement="top"
          data-bs-content="Devoluciones"
          data-bs-delay='{"show":500,"hide":150}'
          data-bs-trigger="hover"
          onClick={() => handleAction("verAbonos", row)}
        >

          <svg style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-u-turn-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 20v-11.5a4.5 4.5 0 0 1 9 0v8.5" /><path d="M13 14l3 3l3 -3" /></svg>

        </button>
      </div>
    )
  }

  const order = {
    idx: 0,
    dir: 'desc'
  }

  function con() {
    console.log("eliminar")
  }


  const componentesPorEstado = {
    1: <AbonosForm data={clientData} generalData={generalData} fun={handleFetchVentas} />,
    2: <AbonosList data={clientData} generalData={generalData} />,
    // default: <ComponenteDefault />
  }
  return (
    <>
      <BootstrapModal
        show={modalAnularShow}
        onHide={() => setModalAnularShow(false)}
        title="Anular venta"
        // onSubmit={handleNuevaEmpresa}
        submitBtn="Anular"

      >
        <AnularVentaForm factura={overrideData} onSuccess={() => {
          handleFetchVentas();   // 🔥 refresca la tabla
          setModalAnularShow(false); // 🔥 cierra el modal
        }} />
        {/* <AnularVentaForm /> */}
      </BootstrapModal>

      <SideAction key="1" placement="end" name="end" title="Abonar" togglestate={toggleState} show={show} data={clientData} >
        {/* {templateAbono === 2 && <AbonosList data={clientData} generalData={generalData}/>}
            {templateAbono === 1 && <AbonosForm data={clientData} generalData={generalData} fun={handleFetchVentas}/>} */}

        {componentesPorEstado[templateAbono]}
      </SideAction>

      <Modal
        size="xl"
        show={remisionModalOpen}
        onHide={() => setRemisionModalOpen(false)}
        scrollable
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Remisiones · Venta #{remisionRowContext?.id ?? '--'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {remisionLoading && (
            <div className="py-5 text-center">
              <Spinner animation="border" role="status" />
              <p className="text-muted mt-3 mb-0">Cargando información de remisiones…</p>
            </div>
          )}

          {remisionError && (
            <div className="alert alert-danger" role="alert">
              {remisionError}
            </div>
          )}

          {!remisionLoading && !remisionError && remisionContext && (
            <RemisionesPanel
              ventaId={remisionRowContext?.id ?? 0}
              items={remisionContext?.ventas ?? []}
              remisiones={remisionContext?.remisiones ?? []}
              articulos={generalData?.articulos ?? []}
              cliente={{
                cedula: remisionRowContext?.cedula,
                nombre: remisionRowContext?.cliente,
              }}
              onCreated={handleRemisionCreated}
            />
          )}
        </Modal.Body>
      </Modal>



      <DataTables data={dataTablee} columns={columns} order={order} onAction={handleAction} imprimir={con} slotes={slots} />
    </>
  )
}

export default VentasData
