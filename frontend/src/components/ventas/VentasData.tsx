// @ts-nocheck
﻿// @ts-nocheck
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
import { buildBackendUrl, buildMediaUrl } from '@/utils/js/env';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Tooltip } from 'primereact/tooltip';
import { Galleria } from 'primereact/galleria';
import '@/styles/style.css';






import { Row } from 'react-bootstrap';

const moneyformat = (amount: unknown) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(amount || 0));

const formatDateTime = (value: unknown) => {
  if (!value) return 'Sin fecha';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDateOnly = (value: unknown) => {
  if (!value) return 'Sin fecha';
  const raw = String(value).trim();
  const plainDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    return `${day}/${month}/${year}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const parseLocalDateValue = (value: unknown) => {
  if (!value) return null;
  const raw = String(value).trim();
  const plainDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toLocalDateInputValue = (date: Date | null) => {
  if (!date || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayLocalDate = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
};

const ORIGEN_ESTADO_LABELS = {
  manual: 'Manual',
  masivo: 'Masivo',
  automatico: 'Automatico',
};

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

const galleryResponsiveOptions = [
  {
    breakpoint: '991px',
    numVisible: 5,
  },
  {
    breakpoint: '767px',
    numVisible: 3,
  },
  {
    breakpoint: '575px',
    numVisible: 2,
  },
];

const toDateTimeLocalValue = (value?: string | null) => {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) {
    return '';
  }
  const offset = base.getTimezoneOffset();
  const localDate = new Date(base.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const toDateInputValue = (value?: string | null) => {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) {
    return '';
  }
  const offset = base.getTimezoneOffset();
  const localDate = new Date(base.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
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
  const [formulaActiveIndex, setFormulaActiveIndex] = useState(0);
  const [fotosVentaModalOpen, setFotosVentaModalOpen] = useState(false);
  const [fotosVentaLoading, setFotosVentaLoading] = useState(false);
  const [fotosVentaError, setFotosVentaError] = useState<string | null>(null);
  const [fotosVentaImages, setFotosVentaImages] = useState<string[]>([]);
  const [fotosVentaId, setFotosVentaId] = useState<number | null>(null);
  const [fotosVentaActiveIndex, setFotosVentaActiveIndex] = useState(0);
  const detailCache = useRef(new Map());
  const [expandedRows, setExpandedRows] = useState(null);
  const [detailLoading, setDetailLoading] = useState({});
  const [estadoPagoFilter, setEstadoPagoFilter] = useState('todos');
  const [estadoPedidoFilter, setEstadoPedidoFilter] = useState('todos');
  const [globalFilter, setGlobalFilter] = useState('');
  const [datePreset, setDatePreset] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const tooltipRef = useRef<any>(null);
  const [tooltipVersion, setTooltipVersion] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [estadoModalRow, setEstadoModalRow] = useState(null);
  const [estadoTargetSlug, setEstadoTargetSlug] = useState('');
  const [estadoMotivoSinAnticipo, setEstadoMotivoSinAnticipo] = useState('');
  const [estadoFecha, setEstadoFecha] = useState('');
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMotivoSinAnticipo, setBulkMotivoSinAnticipo] = useState('');
  const [bulkEstadoDestino, setBulkEstadoDestino] = useState('');
  const [bulkEstadoFecha, setBulkEstadoFecha] = useState('');
  const [bulkRemisionModalOpen, setBulkRemisionModalOpen] = useState(false);
  const [bulkRemisionLoading, setBulkRemisionLoading] = useState(false);
  const [bulkRemisionFecha, setBulkRemisionFecha] = useState(() => toDateInputValue());
  const [bulkRemisionObservacion, setBulkRemisionObservacion] = useState('');
  const [bulkRemisionPreviewLoading, setBulkRemisionPreviewLoading] = useState(false);
  const [bulkRemisionPreviewError, setBulkRemisionPreviewError] = useState<string | null>(null);
  const [bulkRemisionPreview, setBulkRemisionPreview] = useState<any[]>([]);
  const [bulkRemisionExpandedIds, setBulkRemisionExpandedIds] = useState<number[]>([]);

  const refreshVentasTooltips = (forceRemount = false) => {
    if (typeof window === 'undefined') return;
    window.setTimeout(() => {
      if (tooltipRef.current?.unloadTargetEvents) {
        tooltipRef.current.unloadTargetEvents();
      }
      if (forceRemount) {
        setTooltipVersion((value) => value + 1);
      }
      window.setTimeout(() => {
        if (tooltipRef.current?.loadTargetEvents) {
          tooltipRef.current.loadTargetEvents();
        }
        if (tooltipRef.current?.updateTargetEvents) {
          tooltipRef.current.updateTargetEvents();
        }
      }, 0);
    }, 0);
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    refreshVentasTooltips(true);
  }, [dataTablee, estadoPagoFilter, estadoPedidoFilter, globalFilter, datePreset, fechaDesde, fechaHasta, first, rows]);

  useEffect(() => {
    refreshVentasTooltips(true);
  }, [expandedRows]);

  const toggleState = () => {
    setShow(!show);
  };

  const fetchRemisionData = async (ventaId: number) => {
    setRemisionLoading(true);
    setRemisionError(null);
    try {
      const req = await callApi(`venta/${ventaId}`);
      if (!req.res.ok) {
        throw new Error(req.data.detail || 'No fue posible obtener la informacion de remisiones.');
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
    if (path.startsWith('/media/')) {
      return buildMediaUrl(path);
    }
    return buildMediaUrl(`media/${path.replace(/^\/+/, '')}`);
  };

  const handleFormulaModal = async (rowData) => {
    setFormulaVentaId(rowData.id);
    setFormulaModalOpen(true);
    setFormulaLoading(true);
    setFormulaError(null);
    setFormulaImages([]);
    setFormulaActiveIndex(0);
    try {
      const req = await callApi(`venta/${rowData.id}`);
      if (!req.res.ok) {
        throw new Error(req.data.detail || 'No fue posible obtener la formula.');
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
        setFormulaError('No hay formulas asociadas a esta venta.');
      }
      setFormulaImages(resolved);
    } catch (error) {
      setFormulaError(error instanceof Error ? error.message : "Error al cargar la f?rmula.");
    } finally {
      setFormulaLoading(false);
    }
  };

  const handleFotosVentaModal = async (rowData) => {
    setFotosVentaId(rowData.id);
    setFotosVentaModalOpen(true);
    setFotosVentaLoading(true);
    setFotosVentaError(null);
    setFotosVentaImages([]);
    setFotosVentaActiveIndex(0);
    try {
      const req = await callApi(`venta/${rowData.id}`);
      if (!req.res.ok) {
        throw new Error(req.data.detail || 'No fue posible obtener las fotos de la venta.');
      }
      const data = req.data || {};
      const candidates: string[] = [];
      if (Array.isArray(data.fotosVenta)) {
        candidates.push(...data.fotosVenta);
      }
      if (Array.isArray(data.foto)) {
        candidates.push(...data.foto);
      } else if (data.foto) {
        candidates.push(data.foto);
      }
      const resolved = [...new Set(candidates
        .map((item) => resolveMediaUrl(item))
        .filter(Boolean) as string[])];

      if (!resolved.length) {
        setFotosVentaError('No hay fotos asociadas a esta venta.');
      }
      setFotosVentaImages(resolved);
    } catch (error) {
      setFotosVentaError(error instanceof Error ? error.message : 'Error al cargar las fotos de la venta.');
    } finally {
      setFotosVentaLoading(false);
    }
  };

  const handleRemisionCreated = async () => {
    if (remisionRowContext) {
      if (remisionRowContext?.id != null) {
        await fetchRemisionData(remisionRowContext.id);
      }
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

  const getEstadoOrder = (slug) => ESTADO_PEDIDO_FLOW.indexOf(slug);

  const getAvailableEstadoTargets = (row) => {
    const actualKey = identifyEstadoPedidoKey(row?.estadoPedidoNombre);
    const actualOrder = getEstadoOrder(actualKey);
    return ESTADO_PEDIDO_FLOW.filter((slug) => {
      const order = getEstadoOrder(slug);
      return order >= actualOrder;
    });
  };

  const requiresMotivoSinAnticipo = (row, targetSlug) => {
    if (!targetSlug) return false;
    if (ventaPerteneceAJornada(row) || cumpleMitadPago(row)) return false;
    return getEstadoOrder(targetSlug) >= getEstadoOrder('para_fabricacion');
  };

  const normalize = (value) => String(value ?? '').toLowerCase().trim();

  const renderEstadoPedidoBadge = (nombre) => {
    const value = String(nombre ?? '').trim() || 'Pedido tomado';
    const key = identifyEstadoPedidoKey(value);
    const badge = estadoPedidoBadgeClass(key);
    return <span className={`badge ${badge} badge-estado-pedido`}>{value}</span>;
  };


  const getCuotasEstadoInfo = (row) => {
    const totalCuotas = Number(row.cuotas ?? row.numeroCuotas ?? row.compromisoPago ?? 0);
    const precio = Number(row.precioRaw ?? row.precio ?? 0);
    const abonado = Number(row.totalAbonoRaw ?? row.totalAbono ?? row.total_abonos ?? 0);

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

  const formatDescuento = (item) => {
    const tipo = String(item?.tipo_descuento ?? item?.tipoDescuento ?? 'precio').toLowerCase();
    const valor = Number(item?.descuento ?? 0);
    if (!valor) return '-';
    if (tipo === 'porcentaje') {
      return `${valor} %`;
    }
    return `$ ${valor}`;
  };

  const applyDatePreset = (preset) => {
    const today = getTodayLocalDate();
    let desde = '';
    let hasta = '';

    if (preset === 'hoy') {
      desde = toLocalDateInputValue(today);
      hasta = toLocalDateInputValue(today);
    } else if (preset === 'semana') {
      const dayOfWeek = today.getDay();
      const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = addDays(today, -offset);
      desde = toLocalDateInputValue(weekStart);
      hasta = toLocalDateInputValue(today);
    } else if (preset === 'mes_actual') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      desde = toLocalDateInputValue(monthStart);
      hasta = toLocalDateInputValue(monthEnd);
    } else if (preset === 'mes_anterior') {
      const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      desde = toLocalDateInputValue(previousMonthStart);
      hasta = toLocalDateInputValue(previousMonthEnd);
    } else if (preset === 'ultimos_30') {
      desde = toLocalDateInputValue(addDays(today, -29));
      hasta = toLocalDateInputValue(today);
    }

    setDatePreset(preset);
    setFechaDesde(desde);
    setFechaHasta(hasta);
    setFirst(0);
  };

  const handleFechaDesdeChange = (value) => {
    setDatePreset('personalizado');
    setFechaDesde(value);
    setFirst(0);
  };

  const handleFechaHastaChange = (value) => {
    setDatePreset('personalizado');
    setFechaHasta(value);
    setFirst(0);
  };

  const clearDateFilter = () => {
    setDatePreset('todos');
    setFechaDesde('');
    setFechaHasta('');
    setFirst(0);
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

      if (fechaDesde || fechaHasta) {
        const ventaDate = parseLocalDateValue(row.fecha);
        const desde = parseLocalDateValue(fechaDesde);
        const hasta = parseLocalDateValue(fechaHasta);
        if (!ventaDate) return false;
        if (desde && ventaDate < desde) return false;
        if (hasta && ventaDate > hasta) return false;
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
  }, [dataTablee, estadoPagoFilter, estadoPedidoFilter, fechaDesde, fechaHasta, globalFilter]);

  const bulkEstadoKeys = useMemo(
    () => [...new Set((selectedVentas ?? []).map((row) => identifyEstadoPedidoKey(row.estadoPedidoNombre)))],
    [selectedVentas]
  );

  const bulkMixedStates = bulkEstadoKeys.length > 1;
  const bulkBaseRow = selectedVentas[0] ?? null;
  const bulkAvailableTargets = useMemo(() => {
    if (bulkMixedStates || !bulkBaseRow) return [];
    return getAvailableEstadoTargets(bulkBaseRow);
  }, [bulkMixedStates, bulkBaseRow]);
  const bulkRowsRequiringMotivo = useMemo(() => {
    if (!bulkEstadoDestino) return [];
    return (selectedVentas ?? []).filter((row) => requiresMotivoSinAnticipo(row, bulkEstadoDestino));
  }, [selectedVentas, bulkEstadoDestino]);
  const bulkRowsWithoutMotivo = useMemo(() => {
    const requiringIds = new Set(bulkRowsRequiringMotivo.map((row) => row.id));
    return (selectedVentas ?? []).filter((row) => !requiringIds.has(row.id));
  }, [selectedVentas, bulkRowsRequiringMotivo]);
  const bulkCanConfirm =
    Boolean(selectedVentas.length) &&
    !bulkMixedStates &&
    Boolean(bulkEstadoDestino) &&
    (bulkRowsRequiringMotivo.length === 0 || Boolean(bulkMotivoSinAnticipo.trim()));


  const bulkRemisionComputedSummary = useMemo(() => {
    const preview = Array.isArray(bulkRemisionPreview) ? bulkRemisionPreview : [];
    return {
      ventas_con_pendientes: preview.filter((item) => Number(item.total_unidades_incluir || 0) > 0).length,
      ventas_sin_pendientes: preview.filter((item) => Number(item.total_unidades_incluir || 0) <= 0).length,
      total_unidades_pendientes: preview.reduce((acc, item) => acc + Number(item.total_unidades_incluir || 0), 0),
    };
  }, [bulkRemisionPreview]);

  const bulkRemisionCanConfirm = Boolean(selectedVentas.length) && Boolean(bulkRemisionFecha) && bulkRemisionComputedSummary.total_unidades_pendientes > 0;

  const handleOpenBulkModal = async () => {
    if (!selectedVentas.length) {
      await swalErr('Selecciona al menos una venta.');
      return;
    }
    if (bulkMixedStates) {
      await swalErr('No puedes mezclar ventas con diferentes estados de pedido en una misma accion.');
      return;
    }
    const availableTargets = getAvailableEstadoTargets(selectedVentas[0]);
    if (!availableTargets.length) {
      await swalErr('No hay estados disponibles para las ventas seleccionadas.');
      return;
    }
    setBulkEstadoDestino(identifyEstadoPedidoKey(selectedVentas[0]?.estadoPedidoNombre) || availableTargets[0]);
    setBulkMotivoSinAnticipo('');
    setBulkEstadoFecha(toDateTimeLocalValue(selectedVentas[0]?.estadoPedidoFecha));
    setBulkModalOpen(true);
  };

  const handleOpenBulkRemisionModal = async () => {
    if (!selectedVentas.length) {
      await swalErr('Selecciona al menos una venta.');
      return;
    }
    setBulkRemisionFecha(toDateInputValue());
    setBulkRemisionObservacion('');
    setBulkRemisionPreview([]);
    setBulkRemisionExpandedIds([]);
    setBulkRemisionPreviewError(null);
    setBulkRemisionModalOpen(true);
    await loadBulkRemisionPreview();
  };

  const loadBulkRemisionPreview = async () => {
    setBulkRemisionPreviewLoading(true);
    setBulkRemisionPreviewError(null);
    try {
      const req = await callApi('remisiones/masivo/preview/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venta_ids: selectedVentas.map((row) => row.id),
        }),
      });

      if (!req.res.ok) {
        throw new Error(req.data.detail || 'No fue posible cargar la validacion de remision masiva.');
      }

      const resultados = Array.isArray(req.data.resultados)
        ? req.data.resultados.map((preview) => ({
            ...preview,
            total_unidades_incluir: Array.isArray(preview.items)
              ? preview.items.reduce((acc, item) => acc + Number(item.cantidad_incluir || 0), 0)
              : 0,
          }))
        : [];
      setBulkRemisionPreview(resultados);
      setBulkRemisionExpandedIds(resultados.length > 0 ? [Number(resultados[0].venta_id)] : []);
    } catch (error) {
      console.error(error);
      setBulkRemisionPreview([]);
      setBulkRemisionExpandedIds([]);
      setBulkRemisionPreviewError(error instanceof Error ? error.message : 'No fue posible cargar la validacion de remision masiva.');
    } finally {
      setBulkRemisionPreviewLoading(false);
    }
  };

  const handleBulkRemisionCantidadChange = (ventaId: number, itemVentaId: number, value: string) => {
    let cantidad = parseInt(value, 10);
    if (Number.isNaN(cantidad) || cantidad < 0) {
      cantidad = 0;
    }

    setBulkRemisionPreview((prev) =>
      (prev || []).map((preview) => {
        if (preview.venta_id !== ventaId) return preview;
        const items = (preview.items || []).map((item) => {
          if (item.item_venta_id !== itemVentaId) return item;
          const maximo = Number(item.cantidad_pendiente || 0);
          return {
            ...item,
            cantidad_incluir: Math.min(cantidad, maximo),
          };
        });
        return {
          ...preview,
          items,
          total_unidades_incluir: items.reduce((acc, item) => acc + Number(item.cantidad_incluir || 0), 0),
        };
      })
    );
  };

  const toggleBulkRemisionExpanded = (ventaId: number) => {
    setBulkRemisionExpandedIds((prev) =>
      prev.includes(ventaId) ? prev.filter((id) => id !== ventaId) : [...prev, ventaId]
    );
  };

  const expandAllBulkRemision = () => {
    setBulkRemisionExpandedIds((bulkRemisionPreview || []).map((preview) => Number(preview.venta_id)));
  };

  const collapseAllBulkRemision = () => {
    setBulkRemisionExpandedIds([]);
  };

  const handleBulkRemisionSubmit = async () => {
    if (!bulkRemisionFecha) {
      await swalErr('Debes indicar la fecha de remision.');
      return;
    }

    setBulkRemisionLoading(true);
    try {
      const req = await callApi('remisiones/masivo/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha: bulkRemisionFecha,
          observacion: bulkRemisionObservacion.trim() || null,
          remisiones: (bulkRemisionPreview || []).map((preview) => ({
            venta_id: preview.venta_id,
            observacion: bulkRemisionObservacion.trim() || null,
            items: (preview.items || [])
              .filter((item) => Number(item.cantidad_incluir || 0) > 0)
              .map((item) => ({
                itemVenta: item.item_venta_id,
                cantidad: Number(item.cantidad_incluir || 0),
              })),
          })),
        }),
      });

      if (!req.res.ok) {
        await swalErr(req.data.detail || 'No fue posible generar las remisiones masivas.');
        return;
      }

      const procesadas = Number(req.data.procesadas || 0);
      const omitidas = Array.isArray(req.data.omitidas) ? req.data.omitidas : [];
      const errores = Array.isArray(req.data.errores) ? req.data.errores : [];
      const detalles: string[] = [];

      omitidas.forEach((item) => {
        detalles.push(`Venta ${item.venta_id}: ${typeof item.detail === 'string' ? item.detail : 'Sin detalle.'}`);
      });
      errores.forEach((item) => {
        const detail = typeof item.detail === 'string' ? item.detail : JSON.stringify(item.detail);
        detalles.push(`Venta ${item.venta_id}: ${detail}`);
      });

      if (detalles.length > 0) {
        await swalHtmlCreation(
          'Resultado de remision masiva',
          `Se generaron ${procesadas} remisiones.<br><br>${detalles.join('<br>')}`
        );
      } else {
        await swalconfirmation(`Se generaron ${procesadas} remisiones correctamente.`);
      }

      selectedVentas.forEach((row) => {
        if (row?.id) {
          detailCache.current.delete(row.id);
        }
      });
      setBulkRemisionModalOpen(false);
      setSelectedVentas([]);
      setBulkRemisionObservacion('');
      setBulkRemisionFecha(toDateInputValue());
      setBulkRemisionPreview([]);
      setBulkRemisionExpandedIds([]);
      setBulkRemisionPreviewError(null);
        await handleFetchVentas(false);
    } catch (error) {
      console.error(error);
      await swalErr('Ocurrio un error al generar las remisiones masivas.');
    } finally {
      setBulkRemisionLoading(false);
    }
  };

  const handleBulkEstadoSubmit = async () => {
    if (!bulkEstadoDestino) {
      await swalErr('Debes seleccionar el estado destino.');
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
          estado: bulkEstadoDestino,
          fecha_estado: bulkEstadoFecha || null,
          ...(bulkRowsRequiringMotivo.length > 0
            ? { motivo_sin_anticipo: bulkMotivoSinAnticipo.trim() }
            : {}),
        }),
      });

      if (!req.res.ok) {
        await swalErr(req.data.detail || 'No fue posible aplicar el cambio masivo.');
        return;
      }

      const errores = req.data.errores || [];
      if (errores.length > 0) {
        const detalle = errores
          .map((item) => `Venta ${item.venta_id}: ${item.detail}`)
          .join('<br>');
        await swalHtmlCreation('Resultado del cambio masivo', `Se actualizaron ${Number(req.data.procesadas || 0)} ventas.<br><br>${detalle}`);
      } else {
        await swalconfirmation(`Se actualizaron ${Number(req.data.procesadas || 0)} ventas correctamente.`);
      }

      selectedVentas.forEach((row) => {
        if (row?.id) {
          detailCache.current.delete(row.id);
        }
      });
      setBulkModalOpen(false);
      setSelectedVentas([]);
      setBulkEstadoDestino('');
      setBulkEstadoFecha('');
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
      const precioRaw = Number(item.precioRaw ?? item.precio ?? 0);
      const totalAbonoRaw = Number(item.totalAbonoRaw ?? item.totalAbono ?? 0);
      const saldoRaw = Number(item.saldoRaw ?? item.saldo ?? 0);

      return {
        ...item,
        precioRaw,
        totalAbonoRaw,
        saldoRaw,
        empresaCliente: item.empresaCliente || "",
        precio: moneyformat(precioRaw),
        totalAbono: moneyformat(totalAbonoRaw),
        saldo: moneyformat(saldoRaw),
        estadoPedidoId: item.estadoPedidoId ?? item.estado_pedido_id ?? null,
        estadoPedidoNombre: item.estadoPedidoNombre ?? item.estado_pedido_nombre ?? '',
        motivoSinAnticipo: item.motivoSinAnticipo ?? item.motivo_sin_anticipo ?? '',
        estadoPedidoFecha: item.estadoPedidoFecha ?? item.estado_pedido_actualizado ?? null,
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
        console.log("Accion no reconocida:", action);
    }
  };

  const handleEstadoPedidoAction = async (rowData) => {
    const availableTargets = getAvailableEstadoTargets(rowData);
    if (!availableTargets.length) {
      await swalErr('No hay estados disponibles para esta venta.');
      return;
    }
    setEstadoModalRow(rowData);
    setEstadoTargetSlug(identifyEstadoPedidoKey(rowData?.estadoPedidoNombre) || availableTargets[0]);
    setEstadoMotivoSinAnticipo('');
    setEstadoFecha(toDateTimeLocalValue(rowData?.estadoPedidoFecha));
    setEstadoModalOpen(true);
  };

  const handleEstadoPedidoSubmit = async () => {
    if (!estadoModalRow || !estadoTargetSlug) {
      await swalErr('Debes seleccionar el estado destino.');
      return;
    }
    if (requiresMotivoSinAnticipo(estadoModalRow, estadoTargetSlug) && !estadoMotivoSinAnticipo.trim()) {
      await swalErr('Debes indicar un motivo para continuar sin anticipo suficiente.');
      return;
    }

    setEstadoLoading(estadoModalRow.id);
    try {
      const req = await callApi('venta/' + estadoModalRow.id + '/estado-pedido/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: estadoTargetSlug,
          fecha_estado: estadoFecha || null,
          ...(requiresMotivoSinAnticipo(estadoModalRow, estadoTargetSlug)
            ? { motivo_sin_anticipo: estadoMotivoSinAnticipo.trim() }
            : {}),
        }),
      });

      if (!req.res.ok) {
        await swalErr(req.data.detail || 'No fue posible actualizar el estado.');
        return;
      }

      await swalconfirmation('Estado actualizado: ' + (req.data.estado || ESTADO_PEDIDO_LABELS[estadoTargetSlug]) + '.');
      if (estadoModalRow?.id) {
        detailCache.current.delete(estadoModalRow.id);
      }
      setEstadoModalOpen(false);
      setEstadoModalRow(null);
      setEstadoTargetSlug('');
      setEstadoMotivoSinAnticipo('');
      setEstadoFecha('');
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
      v === 'anulado' ? 'danger' :
      v === 'pagado' ? 'success' :
      v === 'con abono' ? 'info' :
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
      <div className='gap-1 d-flex justify-content-center flex-nowrap ventas-row-actions'>
        <button
          className="btn-action btn btn-sm btn-outline-secondary ventas-action-tooltip"
          data-pr-tooltip="Actualizar estado del pedido"
          data-pr-position="top"
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
        </button>
        <button
          className="btn-action btn btn-sm btn-primary ventas-action-tooltip"
          data-pr-tooltip="Abonar a la venta"
          data-pr-position="top"
          onClick={() => handleAction("abonar", row)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M21 15h-2.5a1.503 1.503 0 0 0-1.5 1.5a1.503 1.503 0 0 0 1.5 1.5h1a1.503 1.503 0 0 1 1.5 1.5a1.503 1.503 0 0 1-1.5 1.5H17m2 0v1m0-8v1m-6 6H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2m12 3.12V9a2 2 0 0 0-2-2h-2" /><path d="M16 10V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6m8 0H8m8 0h1m-9 0H7m1 4v.01M8 17v.01m4-3.02V14m0 3v.01" /></g></svg>
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
    refreshVentasTooltips(true);
  };

  const onRowExpand = async (e) => {
    await ensureDetalle(e.data);
    refreshVentasTooltips(true);
  };

  const onRowCollapse = () => {
    refreshVentasTooltips(true);
  };

  const galleryItemTemplate = (item) => (
    <div className="d-flex justify-content-center align-items-center bg-light rounded p-3">
      <img
        src={item}
        alt="Vista previa"
        style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
      />
    </div>
  );

  const galleryThumbnailTemplate = (item) => (
    <img
      src={item}
      alt="Miniatura"
      style={{ display: 'block', width: '100%', height: '5rem', objectFit: 'cover' }}
    />
  );

  const rowExpansionTemplate = (rowData) => {
    const detalle = detailCache.current.get(rowData.id);
    if (!detalle) {
      return (
        <div className="px-3 py-2 text-muted">
          {detailLoading[rowData.id] ? 'Cargando detalles' : 'No hay detalle disponible.'}
        </div>
      );
    }

    const ventasItems = detalle.ventas || [];
    const remisiones = detalle.remisiones || [];
    const observacion = detalle.observacion || '';
    const detallePedido = detalle.detalle || detalle.detalle_pedido || '';
    const detalleAnulacion = detalle.detalleAnulacion || detalle.detalle_anulacion || '';
    const estadoPedido = detalle.estadoPedidoNombre ?? detalle.estado_pedido_nombre ?? '';
    const motivoSinAnticipo = detalle.motivoSinAnticipo ?? detalle.motivo_sin_anticipo ?? '';
    const historicoEstadoPedido = Array.isArray(detalle.historicoEstadoPedido) ? detalle.historicoEstadoPedido : [];
    const fechaCreacion = detalle.fechaCreacion ?? detalle.fecha_creacion ?? detalle.fecha ?? rowData.fechaCreacion ?? rowData.fecha_creacion ?? rowData.fecha;
    const fechaInicio = detalle.fechaInicio ?? detalle.fecha_inicio ?? rowData.fechaInicio ?? rowData.fecha_inicio;
    const fechaVencimiento = detalle.fechaVencimiento ?? detalle.fecha_vencimiento ?? rowData.fechaVencimiento ?? rowData.fecha_vencimiento;
    const condicionPago = detalle.condicionPago ?? detalle.condicion_pago ?? rowData.condicionPago ?? rowData.condicion_pago;
    const cuotasVenta = detalle.numeroCuotas ?? detalle.cuotas ?? detalle.compromisoPago ?? rowData.numeroCuotas ?? rowData.cuotas ?? rowData.compromisoPago;
    const tieneFormula = Boolean(
      detalle.foto_formula ||
      detalle.fotoFormula ||
      detalle.foto_formula_url ||
      detalle.formula ||
      detalle.formulas ||
      ventasItems.some((item) => item.foto_formula || item.fotoFormula)
    );

    return (
      <div className="ventas-card my-2">

        <div className="mb-3">
          <div className="fw-semibold">Estado pedido: {estadoPedido || ''}</div>
          <div className="mt-2">
            <span className={`badge ${tieneFormula ? 'bg-success' : 'bg-secondary'}`}>
              {tieneFormula ? 'Formula asociada' : 'Sin formula'}
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
          <div className="row g-2 mt-2">
            <div className="col-12 col-md-6">
              <div className="small"><span className="fw-semibold text-dark">Fecha de creacion:</span> <span className="text-muted">{formatDateTime(fechaCreacion)}</span></div>
            </div>
            <div className="col-12 col-md-6">
              <div className="small"><span className="fw-semibold text-dark">Fecha de inicio:</span> <span className="text-muted">{formatDateOnly(fechaInicio)}</span></div>
            </div>
            <div className="col-12 col-md-6">
              <div className="small"><span className="fw-semibold text-dark">Fecha de vencimiento:</span> <span className="text-muted">{formatDateOnly(fechaVencimiento)}</span></div>
            </div>
            <div className="col-12 col-md-6">
              <div className="small"><span className="fw-semibold text-dark">Condicion de pago:</span> <span className="text-muted">{condicionPago || 'Sin definir'}</span></div>
            </div>
          </div>
          {motivoSinAnticipo && <div className="small mt-2"><span className="fw-semibold text-dark">Motivo sin anticipo:</span> <span className="text-muted">{motivoSinAnticipo}</span></div>}

          {(detallePedido || observacion) && <hr className="my-3 text-body-tertiary opacity-50" />}

          {(detallePedido || observacion) && (
            <div className="row g-2 mt-2">
              {detallePedido && (
                <div className="col-12 col-md-6">
                  <div className="small"><span className="fw-semibold text-dark">Detalle:</span> <span className="text-muted">{detallePedido}</span></div>
                </div>
              )}
              {observacion && (
                <div className="col-12 col-md-6">
                  <div className="small"><span className="fw-semibold text-dark">Observacion:</span> <span className="text-muted">{observacion}</span></div>
                </div>
              )}
            </div>
          )}

          {detalleAnulacion && <div className="small mt-2"><span className="fw-semibold text-danger">Detalle de anulacion:</span> <span className="text-danger-emphasis">{detalleAnulacion}</span></div>}

          <div className="mt-3 pt-3 border-top">
            <div className="fw-semibold mb-2">Acciones adicionales</div>
            <div className='gap-2 d-flex flex-wrap'>
              <button
                className="btn-action btn btn-sm btn-outline-primary ventas-action-tooltip"
                data-pr-tooltip="Ver formula"
                data-pr-position="top"
                onClick={() => handleFormulaModal(rowData)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></g></svg>
              </button>
              <button
                className="btn-action btn btn-sm btn-outline-primary ventas-action-tooltip"
                data-pr-tooltip="Ver fotos de la venta"
                data-pr-position="top"
                onClick={() => handleFotosVentaModal(rowData)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M15 8h.01"/><path d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="m3 15l4-4a3 5 0 0 1 3 0l5 5"/><path d="m14 14l1-1a3 5 0 0 1 3 0l.5 .5"/></g></svg>
              </button>
              <button
                className="btn-action btn btn-sm btn-primary ventas-action-tooltip"
                data-pr-tooltip="Ver historico de abonos"
                data-pr-position="top"
                onClick={() => handleAction("verAbonos", rowData)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2m5 6h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10m2 0v1m0-8v1" /></g></svg>
              </button>
              <button
                className="btn-action btn btn-sm btn-primary ventas-action-tooltip"
                data-pr-tooltip="Devoluciones"
                data-pr-position="top"
                onClick={() => handleAction("verAbonos", rowData)}
              >
                <svg style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-u-turn-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 20v-11.5a4.5 4.5 0 0 1 9 0v8.5" /><path d="M13 14l3 3l3 -3" /></svg>
              </button>
              <button
                className="btn-action btn btn-sm btn-danger ventas-action-tooltip"
                data-pr-tooltip="Anular venta"
                data-pr-position="top"
                onClick={() => handleAction("eliminar", rowData)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="fw-semibold mb-2">Historico de estados</div>
            {historicoEstadoPedido.length === 0 ? (
              <div className="text-muted small">Sin cambios de estado registrados.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {historicoEstadoPedido.map((item) => (
                  <div key={item.id} className="border rounded px-3 py-2 bg-light-subtle">
                    <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="text-muted small">Estado:</span>
                        <span className={`badge ${estadoPedidoBadgeClass(identifyEstadoPedidoKey(item.estadoNuevo || ''))} badge-estado-pedido`}>
                          {item.estadoNuevo || "Sin estado final"}
                        </span>
                      </div>
                      <div className="text-muted small">{formatDateTime(item.fecha)}</div>
                    </div>
                    {item.estadoAnterior ? (
                      <div className="text-muted small mt-1">
                        Estado previo: <span className={`badge ${estadoPedidoBadgeClass(identifyEstadoPedidoKey(item.estadoAnterior || ''))} badge-estado-pedido`}>{item.estadoAnterior}</span>
                      </div>
                    ) : null}
                    <div className="text-muted small mt-1">
                      Origen: {ORIGEN_ESTADO_LABELS[item.origen] || item.origen || "Manual"}
                      {item.usuario ? ` | Usuario: ${item.usuario}` : ""}
                    </div>
                    {item.motivo ? (
                      <div className="text-muted small mt-1">Motivo: {item.motivo}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="table-modern table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Art­culo</th>
                <th className="text-center">Cantidad</th>
                <th className="text-end">Precio</th>
                <th className="text-center">Descuento</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasItems.length === 0 ? (
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
                    <td className="text-center">{formatDescuento(item)}</td>
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
                <th>Remision</th>
                <th>Fecha</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {remisiones.length === 0 ? (
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
      <Tooltip key={tooltipVersion} ref={tooltipRef} target=".ventas-action-tooltip" showDelay={120} hideDelay={80} />
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
            Remisiones - Venta #{remisionRowContext?.id ?? "--"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {remisionLoading && (
            <div className="py-5 text-center">
              <Spinner animation="border" role="status" />
              <p className="text-muted mt-3 mb-0">Cargando informacion de remisiones</p>
            </div>
          )}

          {remisionError && (
            <div className="alert alert-danger" role="alert">
              {remisionError}
            </div>
          )}

          {!remisionLoading && !remisionError && remisionContext && (
            <RemisionesPanel
              ventaId={Number(remisionRowContext?.id || 0)}
              items={remisionContext.ventas || []}
              remisiones={remisionContext.remisiones || []}
              articulos={generalData.articulos || []}
              cliente={{
                cedula: remisionRowContext?.cedula,
                nombre: remisionRowContext?.cliente,
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
            Formula - Venta #{formulaVentaId ?? "--"}
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
            <Galleria
              value={formulaImages}
              activeIndex={formulaActiveIndex}
              onItemChange={(e) => setFormulaActiveIndex(e.index)}
              responsiveOptions={galleryResponsiveOptions}
              numVisible={5}
              circular
              showItemNavigators
              showThumbnails={formulaImages.length > 1}
              item={galleryItemTemplate}
              thumbnail={galleryThumbnailTemplate}
              className="ventas-image-galleria"
            />
          )}
        </Modal.Body>
      </Modal>

      <Modal
        size="lg"
        show={fotosVentaModalOpen}
        onHide={() => setFotosVentaModalOpen(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Fotos de la venta - Venta #{fotosVentaId ?? "--"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {fotosVentaLoading && (
            <div className="py-4 text-center">
              <Spinner animation="border" role="status" />
              <p className="text-muted mt-3 mb-0">Cargando fotos de la venta</p>
            </div>
          )}
          {fotosVentaError && !fotosVentaLoading && (
            <div className="alert alert-warning">{fotosVentaError}</div>
          )}
          {!fotosVentaLoading && !fotosVentaError && fotosVentaImages.length > 0 && (
            <Galleria
              value={fotosVentaImages}
              activeIndex={fotosVentaActiveIndex}
              onItemChange={(e) => setFotosVentaActiveIndex(e.index)}
              responsiveOptions={galleryResponsiveOptions}
              numVisible={5}
              circular
              showItemNavigators
              showThumbnails={fotosVentaImages.length > 1}
              item={galleryItemTemplate}
              thumbnail={galleryThumbnailTemplate}
              className="ventas-image-galleria"
            />
          )}
        </Modal.Body>
      </Modal>

      <Modal size="lg" show={estadoModalOpen} onHide={() => setEstadoModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar estado del pedido</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!estadoModalRow ? (
            <div className="alert alert-warning mb-0">No hay venta seleccionada.</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="fw-semibold">Pedido #{estadoModalRow.id}</div>
                <div className="text-muted small mt-1">Estado actual: {renderEstadoPedidoBadge(estadoModalRow.estadoPedidoNombre)}</div>
              </div>
              <div className="mb-3">
                <label className="form-label">Estado destino</label>
                <select
                  className="form-select"
                  value={estadoTargetSlug}
                  onChange={(event) => {
                    setEstadoTargetSlug(event.target.value);
                    setEstadoMotivoSinAnticipo('');
                  }}
                  disabled={estadoLoading === estadoModalRow.id}
                >
                  {getAvailableEstadoTargets(estadoModalRow).map((slug) => (
                    <option key={slug} value={slug}>{ESTADO_PEDIDO_LABELS[slug]}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Fecha del cambio</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={estadoFecha}
                  onChange={(event) => setEstadoFecha(event.target.value)}
                  disabled={estadoLoading === estadoModalRow.id}
                />
              </div>
              {requiresMotivoSinAnticipo(estadoModalRow, estadoTargetSlug) && (
                <div className="mb-3">
                  <label className="form-label">Motivo sin anticipo</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={estadoMotivoSinAnticipo}
                    onChange={(event) => setEstadoMotivoSinAnticipo(event.target.value)}
                    placeholder="Motivo para avanzar el pedido sin cumplir el anticipo minimo..."
                    disabled={estadoLoading === estadoModalRow.id}
                  />
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEstadoModalOpen(false)} disabled={estadoLoading === estadoModalRow?.id}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleEstadoPedidoSubmit} disabled={!estadoTargetSlug || estadoLoading === estadoModalRow?.id}>
            {estadoLoading === estadoModalRow?.id ? 'Aplicando...' : 'Confirmar cambio'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal size="lg" show={bulkModalOpen} onHide={() => !bulkLoading && setBulkModalOpen(false)} centered>
        <Modal.Header closeButton={!bulkLoading}>
          <Modal.Title>Cambio masivo de estado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedVentas.length ? (
            <div className="alert alert-warning mb-0">No hay ventas seleccionadas.</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="fw-semibold">Ventas seleccionadas: {selectedVentas.length}</div>
                {!bulkMixedStates && bulkEstadoKeys[0] && (
                  <div className="text-muted small mt-1">
                    Estado actual compartido: {ESTADO_PEDIDO_LABELS[bulkEstadoKeys[0]]}
                  </div>
                )}
              </div>

              {bulkMixedStates && (
                <div className="alert alert-danger">
                  No puedes mezclar ventas con diferentes estados de pedido en una misma accion.
                </div>
              )}

              {!bulkMixedStates && bulkAvailableTargets.length > 0 && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Estado destino</label>
                    <select
                      className="form-select"
                      value={bulkEstadoDestino}
                      onChange={(event) => {
                        setBulkEstadoDestino(event.target.value);
                        setBulkMotivoSinAnticipo('');
                      }}
                      disabled={bulkLoading}
                    >
                      {bulkAvailableTargets.map((slug) => (
                        <option key={slug} value={slug}>{ESTADO_PEDIDO_LABELS[slug]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fecha del cambio</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={bulkEstadoFecha}
                      onChange={(event) => setBulkEstadoFecha(event.target.value)}
                      disabled={bulkLoading}
                    />
                  </div>
                </>
              )}

              {!bulkMixedStates && !bulkAvailableTargets.length && (
                <div className="alert alert-warning">Las ventas seleccionadas ya no tienen estados disponibles para avanzar.</div>
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
                    {(selectedVentas ?? []).map((row) => {
                      const requiereMotivo = requiresMotivoSinAnticipo(row, bulkEstadoDestino);
                      return (
                        <tr key={row.id}>
                          <td className="fw-semibold">#{row.id}</td>
                          <td>{row.cliente || 'Sin cliente'}</td>
                          <td>{renderEstadoPedidoBadge(row.estadoPedidoNombre)}</td>
                          <td>
                            {requiereMotivo ? (
                              <span className="badge bg-warning text-dark">Si</span>
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
            {bulkLoading ? 'Aplicando...' : 'Confirmar cambio masivo'}
          </Button>
        </Modal.Footer>
      </Modal>



      <Modal size="xl" show={bulkRemisionModalOpen} onHide={() => !bulkRemisionLoading && setBulkRemisionModalOpen(false)} centered>
        <Modal.Header closeButton={!bulkRemisionLoading}>
          <Modal.Title>Validacion de remision masiva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedVentas.length ? (
            <div className="alert alert-warning mb-0">No hay ventas seleccionadas.</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="fw-semibold">Ventas seleccionadas: {selectedVentas.length}</div>
                <div className="text-muted small mt-1">
                  Ajusta la fecha, la observacion general y las cantidades por articulo antes de confirmar la remision masiva.
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label">Fecha de remision</label>
                  <input
                    type="date"
                    className="form-control"
                    value={bulkRemisionFecha}
                    onChange={(event) => setBulkRemisionFecha(event.target.value)}
                    disabled={bulkRemisionLoading}
                  />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Observacion general</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bulkRemisionObservacion}
                    onChange={(event) => setBulkRemisionObservacion(event.target.value)}
                    placeholder="Observacion opcional para todas las remisiones"
                    disabled={bulkRemisionLoading}
                  />
                </div>
              </div>

              {bulkRemisionPreviewLoading && (
                <div className="py-4 text-center">
                  <Spinner animation="border" role="status" />
                  <p className="text-muted mt-3 mb-0">Cargando unidades pendientes por remisionar...</p>
                </div>
              )}

              {bulkRemisionPreviewError && !bulkRemisionPreviewLoading && (
                <div className="alert alert-danger mb-3">{bulkRemisionPreviewError}</div>
              )}

              {!bulkRemisionPreviewLoading && !bulkRemisionPreviewError && bulkRemisionPreview.length > 0 && (
                <>
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100 bg-light">
                        <div className="small text-muted">Ventas con pendiente</div>
                        <div className="fw-semibold fs-5">{bulkRemisionComputedSummary.ventas_con_pendientes}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100 bg-light">
                        <div className="small text-muted">Ventas sin pendiente</div>
                        <div className="fw-semibold fs-5">{bulkRemisionComputedSummary.ventas_sin_pendientes}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100 bg-light">
                        <div className="small text-muted">Unidades a remisionar</div>
                        <div className="fw-semibold fs-5">{bulkRemisionComputedSummary.total_unidades_pendientes}</div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <div className="small text-muted">
                      La informacion de cada pedido se concentra en su bloque desplegable.
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={expandAllBulkRemision} disabled={bulkRemisionLoading}>
                        Expandir todo
                      </button>
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={collapseAllBulkRemision} disabled={bulkRemisionLoading}>
                        Colapsar todo
                      </button>
                    </div>
                  </div>

                  <div className="accordion" id="bulk-remision-preview-accordion">
                  {bulkRemisionPreview.map((preview) => {
                    const row = (selectedVentas ?? []).find((item) => item.id === preview.venta_id);
                    const isExpanded = bulkRemisionExpandedIds.includes(Number(preview.venta_id));
                    return (
                      <div className="accordion-item" key={preview.venta_id}>
                        <h2 className="accordion-header">
                          <button
                            className={`accordion-button ${isExpanded ? '' : 'collapsed'}`}
                            type="button"
                            onClick={() => toggleBulkRemisionExpanded(Number(preview.venta_id))}
                            aria-expanded={isExpanded ? 'true' : 'false'}
                          >
                            <div className="d-flex flex-wrap align-items-center gap-3 w-100 pe-3">
                              <span className="fw-semibold">Pedido #{preview.venta_id}</span>
                              <span>{row?.cliente || 'Sin cliente'}</span>
                              <span className={`badge ${preview.puede_remisionar ? 'bg-success' : 'bg-secondary'}`}>
                                {preview.puede_remisionar ? 'Lista para remisionar' : 'Sin pendiente'}
                              </span>
                              <span className="text-muted small">Articulos: {preview.total_articulos_pendientes}</span>
                              <span className="text-muted small">Unidades: {preview.total_unidades_incluir}</span>
                            </div>
                          </button>
                        </h2>
                        <div className={`accordion-collapse collapse ${isExpanded ? 'show' : ''}`}>
                          <div className="accordion-body">
                            <div className="d-flex flex-wrap gap-3 small text-muted mb-3">
                              <span><strong>Empresa:</strong> {row?.empresaCliente || 'Sin empresa'}</span>
                              <span><strong>Total:</strong> {moneyformat(Number(row?.precio || 0))}</span>
                              <span><strong>Saldo:</strong> {moneyformat(Number(row?.saldo || 0))}</span>
                              <span><strong>Estado:</strong> {row?.estadoPedidoNombre || 'Sin estado'}</span>
                            </div>
                            {preview.detail && (
                              <div className="alert alert-warning py-2 mb-3">{preview.detail}</div>
                            )}
                            {preview.items?.length ? (
                              <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                  <thead>
                                    <tr>
                                      <th>Articulo</th>
                                      <th className="text-center">Facturado</th>
                                      <th className="text-center">Ya remisionado</th>
                                      <th className="text-center">Pendiente</th>
                                      <th className="text-center">A incluir</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {preview.items.map((item) => (
                                      <tr key={item.item_venta_id}>
                                        <td>{item.articulo}</td>
                                        <td className="text-center">{item.cantidad_factura}</td>
                                        <td className="text-center">{item.cantidad_remisionada}</td>
                                        <td className="text-center text-danger fw-semibold">{item.cantidad_pendiente}</td>
                                        <td className="text-center" style={{ maxWidth: 110 }}>
                                          <input
                                            type="number"
                                            className="form-control form-control-sm text-center"
                                            min={0}
                                            max={item.cantidad_pendiente}
                                            value={item.cantidad_incluir ?? 0}
                                            onChange={(event) => handleBulkRemisionCantidadChange(preview.venta_id, item.item_venta_id, event.target.value)}
                                            disabled={bulkRemisionLoading}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-muted">Esta venta no tiene items pendientes por remisionar.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={loadBulkRemisionPreview} disabled={bulkRemisionLoading || bulkRemisionPreviewLoading || !selectedVentas.length}>
            {bulkRemisionPreviewLoading ? 'Validando...' : 'Actualizar validacion'}
          </Button>
          <Button variant="secondary" onClick={() => setBulkRemisionModalOpen(false)} disabled={bulkRemisionLoading}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleBulkRemisionSubmit} disabled={!bulkRemisionCanConfirm || bulkRemisionLoading}>
            {bulkRemisionLoading ? 'Remisionando...' : 'Confirmar remision masiva'}
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="data-table-shell">
        <div className="mb-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="small fw-semibold text-dark">Filtro por estado de pago</div>
            <button
              type="button"
              className="btn btn-link p-0 text-muted ventas-action-tooltip"
              data-pr-tooltip="Usa este grupo para ver ventas pagadas, con abono, sin pago o anuladas."
              data-pr-position="top"
              aria-label="Ayuda sobre filtro por estado de pago"
            >
              <i className="pi pi-question-circle" />
            </button>
            <div className="d-flex flex-wrap gap-2">
          <button type="button" className={`btn ${estadoPagoFilter === 'todos' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPagoFilter('todos')}>Todos</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'con_abono' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setEstadoPagoFilter('con_abono')}>Con abono</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'sin_pago' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setEstadoPagoFilter('sin_pago')}>Sin pago</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'pagado' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setEstadoPagoFilter('pagado')}>Pagado</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'anulado' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setEstadoPagoFilter('anulado')}>Anulado</button>
          <button type="button" className={`btn ${estadoPagoFilter === 'no_anulados' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setEstadoPagoFilter('no_anulados')}>No anulados</button>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="small fw-semibold text-dark">Filtro por estado del pedido</div>
            <button
              type="button"
              className="btn btn-link p-0 text-muted ventas-action-tooltip"
              data-pr-tooltip="Permite revisar en qu? etapa del proceso se encuentra cada venta."
              data-pr-position="top"
              aria-label="Ayuda sobre filtro por estado del pedido"
            >
              <i className="pi pi-question-circle" />
            </button>
            <div className="d-flex flex-wrap gap-2">
          <button type="button" className={`btn ${estadoPedidoFilter === 'todos' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('todos')}>Todos</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'creado' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('creado')}>{ESTADO_PEDIDO_LABELS.creado}</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'para_fabricacion' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('para_fabricacion')}>{ESTADO_PEDIDO_LABELS.para_fabricacion}</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'en_fabricacion' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('en_fabricacion')}>{ESTADO_PEDIDO_LABELS.en_fabricacion}</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'listo_entrega' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('listo_entrega')}>{ESTADO_PEDIDO_LABELS.listo_entrega}</button>
          <button type="button" className={`btn ${estadoPedidoFilter === 'entregado' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setEstadoPedidoFilter('entregado')}>{ESTADO_PEDIDO_LABELS.entregado}</button>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="small fw-semibold text-dark">Filtro por fecha de venta</div>
            <button
              type="button"
              className="btn btn-link p-0 text-muted ventas-action-tooltip"
              data-pr-tooltip="Puedes usar periodos r?pidos o definir un rango manual entre fechas."
              data-pr-position="top"
              aria-label="Ayuda sobre filtro por fecha de venta"
            >
              <i className="pi pi-question-circle" />
            </button>
            <div className="d-flex flex-wrap gap-2">
          <button type="button" className={`btn ${datePreset === 'todos' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={clearDateFilter}>Todas las fechas</button>
          <button type="button" className={`btn ${datePreset === 'hoy' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('hoy')}>Hoy</button>
          <button type="button" className={`btn ${datePreset === 'semana' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('semana')}>Esta semana</button>
          <button type="button" className={`btn ${datePreset === 'mes_actual' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('mes_actual')}>Este mes</button>
          <button type="button" className={`btn ${datePreset === 'mes_anterior' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('mes_anterior')}>Mes anterior</button>
          <button type="button" className={`btn ${datePreset === 'ultimos_30' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => applyDatePreset('ultimos_30')}>Ultimos 30 dias</button>
            </div>
          </div>
        </div>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
          <div className="d-flex flex-wrap align-items-end gap-2">
            <div>
              <label className="form-label small mb-1">Desde</label>
              <input type="date" className="form-control" value={fechaDesde} onChange={(e) => handleFechaDesdeChange(e.target.value)} />
            </div>
            <div>
              <label className="form-label small mb-1">Hasta</label>
              <input type="date" className="form-control" value={fechaHasta} onChange={(e) => handleFechaHastaChange(e.target.value)} />
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={!selectedVentas.length}
              onClick={handleOpenBulkModal}
            >
              Cambiar estado masivamente ({selectedVentas.length || 0})
            </button>
            <button
              type="button"
              className="btn btn-outline-success"
              disabled={!selectedVentas.length}
              onClick={handleOpenBulkRemisionModal}
            >
              Remisionar masivamente ({selectedVentas.length || 0})
            </button>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar ventas..." />
            </span>
          </div>
        </div>

        <DataTable
          value={filteredData}
          paginator
          first={first}
          rows={rows}
          rowsPerPageOptions={[5, 10, 20, 50]}
          onPage={(event) => {
            setFirst(event.first);
            setRows(event.rows);
            refreshVentasTooltips(true);
          }}
          sortField="id"
          sortOrder={-1}
          stripedRows
          rowHover
          showGridlines
          dataKey="id"
          responsiveLayout="scroll"
          sortMode="single"
          removableSort
          expandedRows={expandedRows}
          onRowToggle={onRowToggle}
          onRowExpand={onRowExpand}
          onRowCollapse={onRowCollapse}
          selection={selectedVentas}
          onSelectionChange={(e) => setSelectedVentas(e.value)}
          rowExpansionTemplate={rowExpansionTemplate}
          className="ventas-table p-datatable-sm"
          paginatorTemplate="RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
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
            body={(row) => getEstadoPagoBadge(row.estado || '')}
          />
          <Column header="Acciones" body={(row) => slots.Acciones(null, row)} />
        </DataTable>
      </div>
    </>
  )
}

export default VentasData

