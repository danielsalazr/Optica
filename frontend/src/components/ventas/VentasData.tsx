// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { swalErr, swalHtmlCreation, swalconfirmation, swalInput, swalQuestion } from '@/utils/js/sweetAlertFunctions';

import Link from 'next/link'

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

import { callApi, IP_URL } from '@/utils/js/api';
import { buildBackendUrl } from '@/utils/js/env';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Tooltip } from 'primereact/tooltip';
import '@/styles/style.css';






import { Row } from 'react-bootstrap';

const moneyformat = (amount: unknown) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(amount || 0));

const ESTADO_PEDIDO_FLOW = ['creado', 'para_fabricacion', 'en_fabricacion', 'listo_entrega', 'entregado'];
const ESTADO_PEDIDO_LABELS = {
  creado: 'Pedido tomado',
  para_fabricacion: 'Para enviar a Fabricar',
  en_fabricacion: 'Enviado a Fabricar',
  listo_entrega: 'Listo Para Entrega',
  entregado: 'Entregado',
};

const identifyEstadoPedidoKey = (nombre: string): string => {
  const value = (nombre || '').toLowerCase();
  if (value.includes('pendiente') || value.includes('pedido tomado') || value.includes('creado')) {
    return 'creado';
  }
  if (value.includes('para enviar a fabricar') || value.includes('enviar a fabric')) {
    return 'para_fabricacion';
  }
  if (value.includes('enviado a fabricar') || value.includes('en fabric')) {
    return 'en_fabricacion';
  }
  if (value.includes('listo para entrega') || value.includes('listo')) {
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
      return 'badge-estado-creado';
    case 'para_fabricacion':
      return 'badge-estado-para-fabricacion';
    case 'en_fabricacion':
      return 'badge-estado-en-fabricacion';
    case 'listo_entrega':
      return 'badge-estado-listo-entrega';
    case 'entregado':
      return 'badge-estado-entregado';
    default:
      return 'badge-estado-creado';
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
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [formulaLoading, setFormulaLoading] = useState(false);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [formulaImages, setFormulaImages] = useState<string[]>([]);
  const [formulaVentaId, setFormulaVentaId] = useState<number | null>(null);
  const detailCache = useRef(new Map());
  const [expandedRows, setExpandedRows] = useState(null);
  const [detailLoading, setDetailLoading] = useState({});
  const [estadoPagoFilter, setEstadoPagoFilter] = useState('todos');
  const [estadoPedidoFilter, setEstadoPedidoFilter] = useState('todos');
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMotivoSinAnticipo, setBulkMotivoSinAnticipo] = useState('');

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
        throw new Error(req.data.detail || 'No fue posible obtener la informaciÃ³n de remisiones.');
      }
      setRemisionContext(req.data);
    } catch (error) {
      console.error(error);
      setRemisionContext(null);
      setRemisionError(error instanceof Error ? error.message : "Error desconocido al cargar remisiones.");
    } finally {
      setRemisionLoading(false);
    }
  };

  const handleRemisionModal = async (rowData) => {
    setRemisionRowContext(rowData);
    setRemisionModalOpen(true);
    await fetchRemisionData(rowData.id);
  };

  const resolveMediaUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = IP_URL();
    if (path.startsWith('/media/')) {
      return `${base.replace(/\/$/, '')}${path}`;
    }
    return `${base.replace(/\/$/, '')}/media/${path.replace(/^\/+/, '')}`;
  };

  const handleFormulaModal = async (rowData) => {
    setFormulaVentaId(rowData.id);
    setFormulaModalOpen(true);
    setFormulaLoading(true);
    setFormulaError(null);
    setFormulaImages([]);
    try {
      const req = await callApi(`venta/${rowData.id}`);
      if (!req.res.ok) {
        throw new Error(req.data.detail || 'No fue posible obtener la fÃ³rmula.');
      }
      const data = req.data || {};
      const candidates: string[] = [];
      if (Array.isArray(data.foto_formula)) {
        candidates.push(...data.foto_formula);
      } else if (data.foto_formula) {
        candidates.push(data.foto_formula);
      }
      if (Array.isArray(data.formulas)) {
        candidates.push(...data.formulas);
      }
      const resolved = candidates
        .map((item) => resolveMediaUrl(item))
        .filter(Boolean) as string[];

      if (!resolved.length) {
        setFormulaError('No hay fÃ³rmulas asociadas a esta venta.');
      }
      setFormulaImages(resolved);
    } catch (error) {
      setFormulaError(error instanceof Error ? error.message : "Error al cargar la f?rmula.");
    } finally {
      setFormulaLoading(false);
    }
  };

  const handleRemisionCreated = async () => {
    if (remisionRowContext) {
      await fetchRemisionData(remisionRowContext.id);
    }
    await handleFetchVentas(false);
  };




  const getPrecioRaw = (row) => Number(row.precioRaw - 0);
  const getAbonoRaw = (row) => Number(row.totalAbonoRaw - 0);

  const cumpleMitadPago = (row) => {
    console.log(row)
    const precio = getPrecioRaw(row);
    const abono = getAbonoRaw(row);

    console.log('Precio:', precio);
    console.log('Abono:', abono);
    if (precio <= 0) {
      return false;
    }
    return abono >= Math.ceil(precio / 2);
  };

  const ventaPerteneceAJornada = (row) => {
    const jornadaId = row.jornada_id - row.jornadaId - row.jornada;
    return Boolean(jornadaId);
  };

  const buildEstadoAction = (row) => {
    const key = identifyEstadoPedidoKey(row.estadoPedidoNombre);
    if (key === 'creado') {
      return {
        slug: 'para_fabricacion',
        label: 'Marcar para enviar a fabricaciÃ³n',
        needsHalfPayment: true,
      };
    }
    if (key === 'para_fabricacion') {
      return {
        slug: 'en_fabricacion',
        label: 'Enviar a fabricaciÃ³n',
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

  const normalize = (value) => (value - '').toString().toLowerCase().trim();

  const renderEstadoPedidoBadge = (nombre) => {
    const value = (nombre - '').toString().trim() || 'Pedido tomado';
    const key = identifyEstadoPedidoKey(value);
    const badge = estadoPedidoBadgeClass(key);
    return <span className={`badge ${badge} badge-estado-pedido`}>{value}</span>;
  };


  const getCuotasEstadoInfo = (row) => {
    const totalCuotas = Number(row.cuotas - row.numeroCuotas - row.compromisoPago - 0);
    const precio = Number(row.precioRaw - row.precio - 0);
    const abonado = Number(row.totalAbonoRaw - row.totalAbono - row.total_abonos - 0);

    if (!totalCuotas || totalCuotas <= 0 || !precio || precio <= 0) {
      return null;
    }

    const valorCuota = precio / totalCuotas;
    if (!valorCuota || valorCuota <= 0) {
      return null;
    }

    const pagadas = Math.min(totalCuotas, abonado / valorCuota);
    const pendientes = Math.max(totalCuotas - pagadas, 0);
    return { totalCuotas, pagadas, pendientes };
  };

  const formatCuotaMetric = (value) => {
    if (!Number.isFinite(value)) return '0';
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };


  const filteredData = useMemo(() => {
    return (dataTablee ?? []).filter((row) => {
      const estadoPago = normalize(row.estado);
      const estadoPedidoKey = identifyEstadoPedidoKey(row.estadoPedidoNombre);

      if (estadoPagoFilter !== 'todos') {
        if (estadoPagoFilter === 'con_abono' && estadoPago !== 'con abono') return false;
        if (estadoPagoFilter === 'sin_pago' && estadoPago !== 'sin pago') return false;
        if (estadoPagoFilter === 'pagado' && estadoPago !== 'pagado') return false;
        if (estadoPagoFilter === 'anulado' && estadoPago !== 'anulado') return false;
        if (estadoPagoFilter === 'no_anulados' && estadoPago === 'anulado') return false;
      }

      if (estadoPedidoFilter !== 'todos' && estadoPedidoKey !== estadoPedidoFilter) {
        return false;
      }

      if (globalFilter.trim()) {
        const term = normalize(globalFilter);
        const fields = [
          row.id,
          row.cedula,
          row.cliente,
          row.empresaCliente,
          row.precio,
          row.totalAbono,
          row.saldo,
          row.estado,
          row.estadoPedidoNombre,
        ]
          .filter(Boolean)
          .map((v) => normalize(v));
        return fields.some((v) => v.includes(term));
      }

      return true;
    });
  }, [dataTablee, estadoPagoFilter, estadoPedidoFilter, globalFilter]);

  const bulkEstadoKeys = useMemo(
    () => [...new Set((selectedVentas ?? []).map((row) => identifyEstadoPedidoKey(row.estadoPedidoNombre)))],
    [selectedVentas]
  );

  const bulkMixedStates = bulkEstadoKeys.length > 1;
  const bulkBaseRow = selectedVentas[0] ?? null;
  const bulkActionConfig = !bulkMixedStates && bulkBaseRow ? buildEstadoAction(bulkBaseRow) : null;
  const bulkRowsRequiringMotivo = useMemo(() => {
    if (!bulkActionConfig || bulkActionConfig.slug !== 'para_fabricacion') return [];
    return (selectedVentas ?? []).filter((row) => !ventaPerteneceAJornada(row) && !cumpleMitadPago(row));
  }, [selectedVentas, bulkActionConfig]);
  const bulkRowsWithoutMotivo = useMemo(() => {
    const requiringIds = new Set(bulkRowsRequiringMotivo.map((row) => row.id));
    return (selectedVentas - []).filter((row) => !requiringIds.has(row.id));
  }, [selectedVentas, bulkRowsRequiringMotivo]);
  const bulkCanConfirm =
    Boolean(selectedVentas.length) &&
    !bulkMixedStates &&
    Boolean(bulkActionConfig) &&
    (bulkRowsRequiringMotivo.length === 0 || Boolean(bulkMotivoSinAnticipo.trim()));

  const handleOpenBulkModal = async () => {
    if (!selectedVentas.length) {
      await swalErr('Selecciona al menos una venta.');
      return;
    }
    setBulkMotivoSinAnticipo('');
    setBulkModalOpen(true);
  };

  const handleBulkEstadoSubmit = async () => {
    if (!bulkActionConfig) {
      await swalErr('La selecciÃ³n no permite un cambio masivo.');
      return;
    }
    if (bulkRowsRequiringMotivo.length > 0 && !bulkMotivoSinAnticipo.trim()) {
      await swalErr('Debes indicar un motivo para las ventas sin anticipo suficiente.');
      return;
    }

    setBulkLoading(true);
    try {
      const req = await callApi('venta/estado-pedido/masivo/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venta_ids: selectedVentas.map((row) => row.id),
          estado: bulkActionConfig.slug,
          ...(bulkRowsRequiringMotivo.length > 0
            ? { motivo_sin_anticipo: bulkMotivoSinAnticipo.trim() }
            : {}),
        }),
      });

      if (!req.res.ok) {
        await swalErr(req.data.detail || 'No fue posible aplicar el cambio masivo.');
        return;
      }

      const errores = req.data.errores - [];
      if (errores.length > 0) {
        const detalle = errores
          .map((item) => `Venta ${item.venta_id}: ${item.detail}`)
          .join('<br>');
        await swalHtmlCreation('Resultado del cambio masivo', `Se actualizaron ${req.data.procesadas - 0} ventas.<br><br>${detalle}`);
      } else {
        await swalconfirmation(`Se actualizaron ${req.data.procesadas - 0} ventas correctamente.`);
      }

      setBulkModalOpen(false);
      setSelectedVentas([]);
      await handleFetchVentas(false);
    } catch (error) {
      console.error(error);
      await swalErr('Ocurrio un error al aplicar el cambio masivo.');
    } finally {
      setBulkLoading(false);
    }
  };



  const handleFetchVentas = async (withToggle = true) => {
    //etLoading(true);

    const res = await fetch(buildBackendUrl("venta/"), {
      cache: "no-store", // ðŸ”¥ Equivalente a getServerSideProps (sin cachÃ©)
    });
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    let redata = await res.json();

    redata = redata.map((item) => {
      const precioRaw = Number(item.precioRaw - item.precio - 0);
      const totalAbonoRaw = Number(item.totalAbonoRaw - item.totalAbono - 0);
      const saldoRaw = Number(item.saldoRaw - item.saldo - 0);

      return {
        ...item,
        precioRaw,
        totalAbonoRaw,
        saldoRaw,
        empresaCliente: item.empresaCliente || "",
        precio: moneyformat(precioRaw),
        totalAbono: moneyformat(totalAbonoRaw),
        saldo: moneyformat(saldoRaw),
        estadoPedidoId: item.estadoPedidoId - item.estado_pedido_id - null,
        estadoPedidoNombre: item.estadoPedidoNombre - item.estado_pedido_nombre - '',
        motivoSinAnticipo: item.motivoSinAnticipo - item.motivo_sin_anticipo - '',
        estadoPedidoFecha: item.estadoPedidoFecha - item.estado_pedido_actualizado - null,
      };
    });
    setDataTable(redata)
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

        // const question = await swalQuestion("Â¿Esta seguro de eliminar el abono")

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
        console.log("AcciÃ³n no reconocida:", action);
    }
  };

  const handleEstadoPedidoAction = async (rowData) => {
    const config = buildEstadoAction(rowData);
    if (!config) {
      await swalErr('Este pedido ya completo todos los estados configurados.');
      return;
    }

    const cumpleMitad = cumpleMitadPago(rowData);
    const esVentaJornada = ventaPerteneceAJornada(rowData);
    const requiereMitadPago = Boolean(config.needsHalfPayment) && !esVentaJornada;
    const faltaMitadPago = requiereMitadPago && !cumpleMitad;
    const requiereDetallePorPago =
      !esVentaJornada && !cumpleMitad && (Boolean(config.requiresDetail) || faltaMitadPago);

    let motivoSinAnticipo = null;
    if (requiereDetallePorPago) {
      motivoSinAnticipo = await swalInput('Estas enviando a fabricar sin cumplir con la mitad del pago. Cual es el motivo');
      if (motivoSinAnticipo === null) {
        return;
      }
      if (!motivoSinAnticipo.trim()) {
        await swalErr('Debe ingresar un motivo valido.');
        return;
      }
    }

    setEstadoLoading(rowData.id);
    try {
      const req = await callApi('venta/' + rowData.id + '/estado-pedido/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: config.slug,
          ...(motivoSinAnticipo ? { motivo_sin_anticipo: motivoSinAnticipo } : {}),
        }),
      });

      if (!req.res.ok) {
        await swalErr(req.data.detail || 'No fue posible actualizar el estado.');
        return;
      }

      await swalconfirmation('Estado actualizado: ' + (req.data.estado || config.label) + '.');
      await handleFetchVentas(false);
    } catch (error) {
      console.error(error);
      await swalErr('Ocurrio un error al actualizar el estado.');
    } finally {
      setEstadoLoading(null);
    }
  };


  const getEstadoPagoBadge = (value) => {
    const v = normalize(value);
    const color =
      v === 'anulado'  'danger' :
      v === 'pagado'  'success' :
      v === 'con abono'  'info' :
      'warning';
    return <span className={`badge bg-${color} badge-estado-pedido`}>{value}</span>;
  };

  const slots = {
    // estado: (data, row) => {
    //   return (
    //     <span className={`badge ${data === "Pagado"  'bg-success' : data === "Con abono"  'bg-warning' : data == "Sin Pago"  'bg-danger' : "anulado"}`}

    //       style={{ fontSize: '16px', }}>
    //       {data}
    //     </span >
    //   );
    // },
    Acciones: (data, row) => (
      <div className='gap-2 d-flex justify-content-center flex-wrap'>
        <button
          className="btn-action btn btn-sm btn-outline-secondary ventas-action-tooltip"
          data-pr-tooltip="Actualizar estado del pedido"
          data-pr-position="top"
          onClick={() => handleEstadoPedidoAction(row)}
          disabled={estadoLoading === row.id}
        >
          {estadoLoading === row.id  (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M12 6V3m-6.364 4.636L3.514 6.514m14.95 1.122l2.122-2.122M6 12H3m18 0h-3m-9 6v3m11.314-5.314l-2.122 2.122M5.05 17.95l-2.122 2.122"/><circle cx="12" cy="12" r="3"/></g></svg>
          )}
        </button>

        <button
          className="btn-action btn btn-sm btn-danger ventas-action-tooltip"
          data-pr-tooltip="Anular venta"
          data-pr-position="top"
          onClick={() => handleAction("eliminar", row)}

        >

          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
        </button>
        <button
          className="btn-action btn btn-sm btn-outline-primary ventas-action-tooltip"
          data-pr-tooltip="Remisiones"
          data-pr-position="top"
          onClick={() => handleRemisionModal(row)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M4 5h16M4 19h16M9 5v8a2 2 0 0 0 2 2h2"></path><path d="M15 19v-8a2 2 0 0 0-2-2h-2"></path></g></svg>
        </button>
        <button
          className="btn-action btn btn-sm btn-primary ventas-action-tooltip"
          data-pr-tooltip="Editar venta"
          data-pr-position="top"
          onClick={() => handleAction("editar", row)}
        >
          <Link href={`ventas/${row.id}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16zm9.5-13.5l4 4" /></svg>
          </Link>
          {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16zm9.5-13.5l4 4"/></svg> */}

        </button>
        <button
          className="btn-action btn btn-sm btn-outline-primary ventas-action-tooltip"
          data-pr-tooltip="Ver fÃ³rmula"
          data-pr-position="top"
          onClick={() => handleFormulaModal(row)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></g></svg>
        </button>
        <button
          className="btn-action btn btn-sm btn-primary ventas-action-tooltip"
          data-pr-tooltip="Abonar a la venta"
          data-pr-position="top"
          onClick={() => handleAction("abonar", row)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M21 15h-2.5a1.503 1.503 0 0 0-1.5 1.5a1.503 1.503 0 0 0 1.5 1.5h1a1.503 1.503 0 0 1 1.5 1.5a1.503 1.503 0 0 1-1.5 1.5H17m2 0v1m0-8v1m-6 6H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2m12 3.12V9a2 2 0 0 0-2-2h-2" /><path d="M16 10V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6m8 0H8m8 0h1m-9 0H7m1 4v.01M8 17v.01m4-3.02V14m0 3v.01" /></g></svg>
        </button>

        <button
          className="btn-action btn btn-sm btn-primary ventas-action-tooltip"
          data-pr-tooltip="Ver histÃ³rico de abonos"
          data-pr-position="top"
          onClick={() => handleAction("verAbonos", row)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2m5 6h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10m2 0v1m0-8v1" /></g></svg>
        </button>
        <button
          className="btn-action btn btn-sm btn-primary ventas-action-tooltip"
          data-pr-tooltip="Devoluciones"
          data-pr-position="top"
          onClick={() => handleAction("verAbonos", row)}
        >

          <svg style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-u-turn-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 20v-11.5a4.5 4.5 0 0 1 9 0v8.5" /><path d="M13 14l3 3l3 -3" /></svg>

        </button>
      </div>
    )
  }

  const componentesPorEstado = {
    1: <AbonosForm data={clientData} generalData={generalData} fun={handleFetchVentas} />,
    2: <AbonosList data={clientData} generalData={generalData} />,
    // default: <ComponenteDefault />
  }

  const ensureDetalle = async (row) => {
    const id = row.id;
    if (!id || detailCache.current.has(id)) return;
    setDetailLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const req = await callApi(`venta/${id}`);
      if (req.res.ok) {
        detailCache.current.set(id, req.data);
      }
    } finally {
      setDetailLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const onRowToggle = (e) => {
    setExpandedRows(e.data);
  };

  const onRowExpand = async (e) => {
    await ensureDetalle(e.data);
  };

  const rowExpansionTemplate = (rowData) => {
    const detalle = detailCache.current.get(rowData.id);
    if (!detalle) {
      return (
        <div className="px-3 py-2 text-muted">
          {detailLoading[rowData.id]  'Cargando detalles' : 'No hay detalle disponible.'}
        </div>
      );
    }

    const ventasItems = detalle.ventas - [];
    const remisiones = detalle.remisiones - [];
    const observacion = detalle.observacion - '';
    const estadoPedido = detalle.estadoPedidoNombre - detalle.estado_pedido_nombre - '';
    const motivoSinAnticipo = detalle.motivoSinAnticipo - detalle.motivo_sin_anticipo - '';
    const tieneFormula = Boolean(
      detalle.foto_formula ||
      detalle.fotoFormula ||
      detalle.foto_formula_url ||
      detalle.formula ||
      detalle.formulas ||
      detalle.ventas.some((item) => item.foto_formula || item.fotoFormula)
    );

    return (
      <div className="ventas-card my-2">
        <div className="mb-3">
          <div className="fw-semibold">Estado pedido: {estadoPedido || ''}</div>
          <div className="mt-2">
            <span className={`badge ${tieneFormula  'bg-success' : 'bg-secondary'}`}>
              {tieneFormula  'Formula asociada' : 'Sin formula'}
            </span>
          </div>
          {getCuotasEstadoInfo(rowData) && (
            <>
              <div className="text-muted small">
                Cuotas: {formatCuotaMetric(getCuotasEstadoInfo(rowData).pagadas)} / {formatCuotaMetric(getCuotasEstadoInfo(rowData).totalCuotas)}
              </div>
              <div className="text-muted small">
                Cuotas pendientes: {formatCuotaMetric(getCuotasEstadoInfo(rowData).pendientes)}
              </div>
            </>
          )}
          {motivoSinAnticipo && <div className="text-muted small">Motivo sin anticipo: {motivoSinAnticipo}</div>}
          {observacion && <div className="text-muted small">ObservaciÃ³n: {observacion}</div>}
        </div>
        <div className="table-modern table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>ArtÃ­culo</th>
                <th className="text-center">Cantidad</th>
                <th className="text-end">Precio</th>
                <th className="text-center">Descuento</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasItems.length === 0  (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    Sin Ã­tems
                  </td>
                </tr>
              ) : (
                ventasItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.articulo_nombre || item.articulo?.nombre || `Articulo #${item.articulo_id || ""}`}</td>
                    <td className="text-center">{item.cantidad - 0}</td>
                    <td className="text-end">{moneyformat(item.precio_articulo - 0)}</td>
                    <td className="text-center">{item.descuento - 0}%</td>
                    <td className="text-end fw-semibold">{moneyformat(item.totalArticulo - 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-modern table-responsive mt-3">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>RemisiÃ³n</th>
                <th>Fecha</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {remisiones.length === 0  (
                <tr>
                  <td colSpan={3} className="text-center text-muted">
                    Sin remisiones
                  </td>
                </tr>
              ) : (
                remisiones.map((rem) => (
                  <tr key={rem.id}>
                    <td>#{rem.id}</td>
                    <td>{rem.fecha}</td>
                    <td className="text-end">{moneyformat(rem.totalRemision - 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  return (
    <>
      <Tooltip target=".ventas-action-tooltip" />
      <BootstrapModal
        show={modalAnularShow}
        onHide={() => setModalAnularShow(false)}
        title="Anular venta"
        // onSubmit={handleNuevaEmpresa}
        submitBtn="Anular"

      >
        <AnularVentaForm factura={overrideData} onSuccess={() => {
          handleFetchVentas();   // ðŸ”¥ refresca la tabla
          setModalAnularShow(false); // ðŸ”¥ cierra el modal
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
            Remisiones Â- Venta #{remisionRowContext.id - '--'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {remisionLoading && (
            <div className="py-5 text-center">
              <Spinner animation="border" role="status" />
              <p className="text-muted mt-3 mb-0">Cargando informaciÃ³n de remisiones</p>
            </div>
          )}

          {remisionError && (
            <div className="alert alert-danger" role="alert">
              {remisionError}
            </div>
          )}

          {!remisionLoading && !remisionError && remisionContext && (
            <RemisionesPanel
              ventaId={remisionRowContext.id - 0}
              items={remisionContext.ventas - []}
              remisiones={remisionContext.remisiones - []}
              articulos={generalData.articulos - []}
              cliente={{
                cedula: remisionRowContext.cedula,
                nombre: remisionRowContext.cliente,
              }}
              onCreated={handleRemisionCreated}
            />
          )}
        </Modal.Body>
      </Modal>

      <Modal
        size="lg"
        show={formulaModalOpen}
        onHide={() => setFormulaModalOpen(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            FÃ³rmula Â- Venta #{formulaVentaId - '--'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formulaLoading && (
            <div className="py-4 text-center">
              <Spinner animation="border" role="status" />
              <p className="text-muted mt-3 mb-0">Cargando formulas</p>
            </div>
          )}
          {formulaError && !formulaLoading && (
            <div className="alert alert-warning">{formulaError}</div>
          )}
          {!formulaLoading && !formulaError && formulaImages.length > 0 && (
            <div className="d-flex flex-wrap gap-3 justify-content-center">
              {formulaImages.map((src, idx) => (
                <div key={`${src}-${idx}`} className="border rounded p-2 bg-light">
                  <img
                    src={src}
                    alt={`Formula ${idx + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                  />
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal size="lg" show={bulkModalOpen} onHide={() => !bulkLoading && setBulkModalOpen(false)} centered>
        <Modal.Header closeButton={!bulkLoading}>
          <Modal.Title>Cambio masivo de estado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedVentas.length  (
            <div className="alert alert-warning mb-0">No hay ventas seleccionadas.</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="fw-semibold">Ventas seleccionadas: {selectedVentas.length}</div>
                {bulkActionConfig && !bulkMixedStates && (
                  <div className="text-muted small mt-1">
                    Siguiente estado: {ESTADO_PEDIDO_LABELS[bulkActionConfig.slug]}
                  </div>
                )}
              </div>

              {bulkMixedStates && (
                <div className="alert alert-danger">
                  No puedes mezclar ventas con diferentes estados de pedido en una misma acciÃ³n.
                </div>
              )}

              <div className="table-responsive mb-3">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Estado actual</th>
                      <th>Requiere motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedVentas - []).map((row) => {
                      const requiereMotivo =
                        bulkActionConfig.slug === 'para_fabricacion' &&
                        !ventaPerteneceAJornada(row) &&
                        !cumpleMitadPago(row);
                      return (
                        <tr key={row.id}>
                          <td className="fw-semibold">#{row.id}</td>
                          <td>{row.cliente || 'Sin cliente'}</td>
                          <td>{renderEstadoPedidoBadge(row.estadoPedidoNombre)}</td>
                          <td>
                            {requiereMotivo  (
                              <span className="badge bg-warning text-dark">SÃ­</span>
                            ) : (
                              <span className="badge bg-success">No</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {bulkRowsWithoutMotivo.length > 0 && (
                <div className="mb-3">
                  <div className="fw-semibold">Pueden avanzar sin motivo</div>
                  <div className="text-muted small">
                    {bulkRowsWithoutMotivo.map((row) => `#${row.id}`).join(', ')}
                  </div>
                </div>
              )}

              {bulkRowsRequiringMotivo.length > 0 && (
                <div className="mb-3">
                  <div className="fw-semibold">Requieren motivo sin anticipo</div>
                  <div className="text-muted small mb-2">
                    {bulkRowsRequiringMotivo.map((row) => `#${row.id}`).join(', ')}
                  </div>
                  <label className="form-label">Motivo sin anticipo</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={bulkMotivoSinAnticipo}
                    onChange={(event) => setBulkMotivoSinAnticipo(event.target.value)}
                    placeholder="Motivo general para las ventas seleccionadas que no cumplen el 50%..."
                    disabled={bulkLoading}
                  />
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBulkModalOpen(false)} disabled={bulkLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleBulkEstadoSubmit} disabled={!bulkCanConfirm || bulkLoading}>
            {bulkLoading  'Aplicando...' : 'Confirmar cambio masivo'}
          </Button>
        </Modal.Footer>
      </Modal>



      <div className="data-table-shell">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button type="button" className={`btn ${estadoPagoFilter === 'todos'  'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPagoFilter('todos')}>Todos</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'con_abono'  'btn-info' : 'btn-outline-info'}`} onClick={() => setEstadoPagoFilter('con_abono')}>Con abono</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'sin_pago'  'btn-warning' : 'btn-outline-warning'}`} onClick={() => setEstadoPagoFilter('sin_pago')}>Sin pago</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'pagado'  'btn-success' : 'btn-outline-success'}`} onClick={() => setEstadoPagoFilter('pagado')}>Pagado</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'anulado'  'btn-danger' : 'btn-outline-danger'}`} onClick={() => setEstadoPagoFilter('anulado')}>Anulado</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'no_anulados'  'btn-primary' : 'btn-outline-primary'}`} onClick={() => setEstadoPagoFilter('no_anulados')}>No anulados</button>
        </div>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button type="button" className={`btn ${estadoPedidoFilter === 'todos'  'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('todos')}>Todos</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'creado'  'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('creado')}>{ESTADO_PEDIDO_LABELS.creado}</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'para_fabricacion'  'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('para_fabricacion')}>{ESTADO_PEDIDO_LABELS.para_fabricacion}</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'en_fabricacion'  'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('en_fabricacion')}>{ESTADO_PEDIDO_LABELS.en_fabricacion}</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'listo_entrega'  'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('listo_entrega')}>{ESTADO_PEDIDO_LABELS.listo_entrega}</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'entregado'  'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('entregado')}>{ESTADO_PEDIDO_LABELS.entregado}</button>
        </div>
        <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
          <div>
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={!selectedVentas.length}
              onClick={handleOpenBulkModal}
            >
              Cambiar estado masivamente ({selectedVentas.length || 0})
            </button>
          </div>
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar ventas..." />
          </span>
        </div>

        <DataTable
          value={filteredData}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          stripedRows
          rowHover
          showGridlines
          dataKey="id"
          responsiveLayout="scroll"
          sortMode="multiple"
          removableSort
          expandedRows={expandedRows}
          onRowToggle={onRowToggle}
          onRowExpand={onRowExpand}
          selection={selectedVentas}
          onSelectionChange={(e) => setSelectedVentas(e.value)}
          rowExpansionTemplate={rowExpansionTemplate}
          className="ventas-table p-datatable-sm"
          paginatorTemplate="RowsPerPageDropdown CurrentPageReport PrevPageLink PageLinks NextPageLink"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column expander style={{ width: '3rem' }} />
          <Column field="id" header="Pedido" sortable style={{ width: '7rem' }} />
          <Column field="cedula" header="Cedula" sortable />
          <Column field="cliente" header="Cliente" sortable />
          <Column field="empresaCliente" header="Empresa" sortable />
          <Column field="precio" header="Precio" sortable />
          <Column field="totalAbono" header="Total abono" sortable />
          <Column field="saldo" header="Saldo" sortable />
          <Column
            header="Estado"
            body={(row) => renderEstadoPedidoBadge(row.estadoPedidoNombre)}
          />
          <Column
            header="Estado pago"
            body={(row) => getEstadoPagoBadge(row.estado - '')}
          />
          <Column header="Acciones" body={(row) => slots.Acciones(null, row)} />
        </DataTable>
      </div>
    </>
  )
}

export default VentasData

