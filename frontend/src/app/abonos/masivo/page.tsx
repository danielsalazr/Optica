// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { InputNumber as PrimeInputNumber } from "primereact/inputnumber";
import { callApi } from "@/utils/js/api";
import { fechaFormat } from "@/utils/js/utils";
import { distributePayments, proposePayments } from "@/utils/massPayment";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import '@/styles/mass-payments.css';

const defaultMode = "empresa";
const InputNumber = (props: React.ComponentProps<typeof PrimeInputNumber>) => (
  <PrimeInputNumber {...props} minFractionDigits={0} maxFractionDigits={0} />
);

const apiError = (data: unknown, fallback: string): string => {
  if (typeof data === 'string') return fallback;
  const messages = Object.values((data || {}) as Record<string, unknown>).flat().filter((value) => typeof value === 'string');
  return messages.length ? messages.join(' ') : fallback;
};

type ClienteOption = {
  id: number;
  cedula: number | string;
  nombre: string;
  apellido: string;
};

type EmpresaOption = {
  id: number | string;
  nombre: string;
  nit: string;
};

type JornadaOption = {
  id: number | string;
  fecha: string;
  fecha_inicio?: string;
  empresa__nombre: string;
  empresa_nombre: string;
  sucursal: string;
};

type MedioPagoOption = {
  id: number | string;
  nombre: string;
};

type PreviewRow = {
  id: number | string;
  cliente_id: number | string;
  empresaCliente: string;
  jornada_id: number | string | null;
  precio: number;
  total_abonos: number;
  saldo: number;
  saldoInicial: number;
  aplicar: number;
  saldoFinal: number;
  cuotas: number | string | null;
  numeroCuotas: number | string | null;
  compromisoPago: number | string | null;
  fecha: string;
};

type ApplyPayload = {
  clave_operacion: string;
  monto_total: number;
  tipo: string;
  medioDePago: string;
  descripcion: string;
  fecha: string | null;
  items: Array<{
    venta_id: PreviewRow["id"];
    monto: number | undefined;
    saldo_esperado: number;
  }>;
  empresa_id?: string;
  jornada_id?: string;
  cliente_id?: string;
};

const BALANCE_EPSILON = 0.01;

function AbonosMasivosPage() {
  const operationKey = useRef<string | null>(null);
  const requestGeneration = useRef(0);
  const applying = useRef(false);
  const [modo, setModo] = useState(defaultMode);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [jornadas, setJornadas] = useState<JornadaOption[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPagoOption[]>([]);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [selectedVentas, setSelectedVentas] = useState<Set<string>>(new Set());
  const [previewMonto, setPreviewMonto] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [distributionLabel, setDistributionLabel] = useState('Sin distribuir');
  const [empresaForm, setEmpresaForm] = useState({
    empresaId: "",
    fecha: "",
    monto: 0,
    medioPago: "",
    descripcion: "",
  });
  const [jornadaForm, setJornadaForm] = useState({
    jornadaId: "",
    fecha: "",
    monto: 0,
    medioPago: "",
    descripcion: "",
  });
  const [clienteForm, setClienteForm] = useState({
    clienteId: "",
    fecha: "",
    monto: 0,
    medioPago: "",
    descripcion: "",
  });

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const { res, data } = await callApi("abonos/masivo/catalogos/");
        if (!res.ok) {
          throw new Error("No se pudo cargar la data inicial.");
        }

        if (!isMounted) return;

        setEmpresas(Array.isArray(data.empresas) ? data.empresas : []);
        setJornadas(Array.isArray(data.jornadas) ? data.jornadas : []);
        setMediosPago(Array.isArray(data.mediosPago) ? data.mediosPago : []);
        setClientes(Array.isArray(data.clientes) ? data.clientes : []);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(getErrorMessage(err, "Error al cargar la data."));
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    requestGeneration.current += 1;
    operationKey.current = null;
    setPreviewRows([]);
    setSelectedVentas(new Set());
    setPreviewMonto(null);
    setPreviewLoading(false);
    setPreviewError("");
    setApplyError("");
    setApplySuccess("");
    setConfirmOpen(false);
    setDistributionLabel('Sin distribuir');
  }, [modo, empresaForm.empresaId, jornadaForm.jornadaId, clienteForm.clienteId]);

  const clientesMap = useMemo(() => {
    const map = new Map();
    clientes.forEach((cliente) => {
      const key = cliente.cedula || cliente.id;
      const nombre = `${cliente.nombre || ""}${cliente.apellido ? ` ${cliente.apellido}` : ""}`.trim();
      if (key) {
        map.set(String(key), nombre || key);
      }
    });
    return map;
  }, [clientes]);

  const normalizeSaldoInicial = (row: PreviewRow): number => {
    const rawSaldo = row.saldoInicial ?? row.saldo ?? 0;
    return Number(rawSaldo || 0);
  };

  const getValorCuotaCalculado = (row: PreviewRow): number => {
    const totalVenta = Number(row.precio || 0);
    const cuotasRaw = row.cuotas ?? row.numeroCuotas ?? row.compromisoPago;
    const cuotas = Number(cuotasRaw || 0);
    if (!cuotas || totalVenta <= 0) return 0;
    return totalVenta / cuotas;
  };

  const roundMoney = (value: number): number => Math.round(Number(value || 0) * 100) / 100;
  const ventaKey = (ventaId: PreviewRow["id"]): string => String(ventaId);
  const isVentaSelected = (selectedSet: Set<string>, ventaId: PreviewRow["id"]): boolean =>
    selectedSet.has(ventaKey(ventaId));

  const buildSummary = (
    rows: PreviewRow[],
    selectedSet: Set<string>,
    montoTotal: number
  ) => {
    const selectedRows = rows.filter((row) => isVentaSelected(selectedSet, row.id));
    const monto = roundMoney(montoTotal || 0);
    const totalAsignado = roundMoney(selectedRows.reduce((acc, row) => acc + (row.aplicar || 0), 0));
    const rawBalance = roundMoney(monto - totalAsignado);
    const balance = Math.abs(rawBalance) < BALANCE_EPSILON ? 0 : rawBalance;
    const restante = balance > 0 ? balance : 0;
    const excedente = balance < 0 ? Math.abs(balance) : 0;
    const pendiente = roundMoney(selectedRows.reduce((acc, row) => acc + (row.saldoFinal || 0), 0));
    return {
      monto,
      totalAsignado,
      restante,
      excedente,
      balance,
      pendiente,
    };
  };

  const previewSummary = useMemo(
    () => buildSummary(previewRows, selectedVentas, Number(previewMonto || 0)),
    [previewRows, selectedVentas, previewMonto]
  );

  const distributeEqual = (rows: PreviewRow[], selectedSet: Set<string>, montoTotal: number) => {
    const nextRows = distributePayments(rows, selectedSet, montoTotal);
    return { rows: nextRows, summary: buildSummary(nextRows, selectedSet, montoTotal) };
  };

  const handlePrevisualizar = async () => {
    const generation = ++requestGeneration.current;
    operationKey.current = null;
    setPreviewError("");
    setApplyError("");
    setApplySuccess("");
    setPreviewRows([]);
    setSelectedVentas(new Set());

    let endpoint = "";

    if (modo === "empresa") {
      if (!empresaForm.empresaId) {
        setPreviewError("Selecciona una empresa.");
        return;
      }
      endpoint = `abonos/masivo/preview/?tipo=empresa&empresa_id=${empresaForm.empresaId}`;
    } else if (modo === "jornada") {
      if (!jornadaForm.jornadaId) {
        setPreviewError("Selecciona una jornada.");
        return;
      }
      endpoint = `abonos/masivo/preview/?tipo=jornada&jornada_id=${jornadaForm.jornadaId}`;
    } else {
      if (!clienteForm.clienteId) {
        setPreviewError("Selecciona un cliente.");
        return;
      }
      endpoint = `abonos/masivo/preview/?tipo=cliente&cliente_id=${clienteForm.clienteId}`;
    }

    setPreviewLoading(true);
    try {
      const { res, data } = await callApi(endpoint);
      if (generation !== requestGeneration.current) return;
      if (!res.ok) {
        throw new Error(apiError(data, "No se pudo cargar las ventas."));
      }

      const ventas = Array.isArray(data) ? data : [];
      if (!ventas.length) {
        setPreviewError("No hay ventas con saldo pendiente para esta selección.");
        return;
      }

      const selected = new Set(ventas.map((row) => ventaKey(row.id)));
      const { rows } = distributeEqual(ventas, selected, 0);
      setPreviewRows(rows);
      setSelectedVentas(selected);
      setPreviewMonto(null);
      setDistributionLabel('Sin distribuir');
      operationKey.current = crypto.randomUUID();
    } catch (err: unknown) {
      if (generation === requestGeneration.current) setPreviewError(getErrorMessage(err, "Error al previsualizar."));
    } finally {
      if (generation === requestGeneration.current) setPreviewLoading(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    const next = checked ? new Set(previewRows.map((row) => ventaKey(row.id))) : new Set<string>();
    updateSelection(next);
  };

  const updateSelection = (next: Set<string>) => {
    setSelectedVentas(next);
    setPreviewRows((rows) => rows.map((row) => next.has(ventaKey(row.id)) ? row : {
      ...row, aplicar: 0, saldoFinal: normalizeSaldoInicial(row),
    }));
    setDistributionLabel('Personalizada');
  };

  const toggleSelectRow = (ventaId: PreviewRow["id"]) => {
      const next = new Set(selectedVentas);
      const key = ventaKey(ventaId);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      updateSelection(next);
  };

  const allSelected = previewRows.length > 0 && selectedVentas.size === previewRows.length;
  const selectedCount = selectedVentas.size;

  const formatCurrency = (value: number | string | null | undefined) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const balanceStatus =
    previewSummary.excedente > 0
      ? {
          label: "Te pasaste",
          value: previewSummary.excedente,
          className: "alert-danger text-danger",
        }
      : previewSummary.restante > 0
        ? {
            label: "Falta asignar",
            value: previewSummary.restante,
            className: "alert-success text-success",
          }
        : {
            label: "Distribucion exacta",
            value: 0,
            className: "alert-info text-primary",
          };

  const overAssignedRows = useMemo(
    () =>
      previewRows
        .filter((row) => isVentaSelected(selectedVentas, row.id))
        .filter((row) => roundMoney(Number(row.aplicar || 0)) > roundMoney(normalizeSaldoInicial(row))),
    [previewRows, selectedVentas]
  );

  const getNumeroCuotas = (row: PreviewRow) => {
    const cuotas = row.cuotas ?? row.numeroCuotas ?? row.compromisoPago;
    return cuotas ?? "-";
  };

  const getValorCuota = (row: PreviewRow): number => {
    return getValorCuotaCalculado(row);
  };


  const getCuotasVersus = (row: PreviewRow) => {
    const totalCuotas = Number((row.cuotas ?? row.numeroCuotas ?? row.compromisoPago) || 0);
    const precio = Number(row.precio || 0);
    const totalAbonos = Number(row.total_abonos || 0);

    if (!totalCuotas || totalCuotas <= 0 || !precio || precio <= 0) {
      return null;
    }

    const valorCuota = precio / totalCuotas;
    if (!valorCuota || valorCuota <= 0) {
      return null;
    }

    const pagadas = Math.min(totalCuotas, totalAbonos / valorCuota);
    const pendientes = Math.max(totalCuotas - pagadas, 0);
    return { pagadas, pendientes };
  };

  const formatCuotasMetric = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };

  const handleAplicarAbonos = async () => {
    if (applying.current) return;
    setApplyError("");
    setApplySuccess("");

    if (!previewRows.length) {
      setApplyError("No hay previsualización cargada.");
      return;
    }
    if (!operationKey.current) {
      setApplyError("Actualiza la previsualizacion antes de aplicar el pago.");
      return;
    }
    if (selectedVentas.size === 0) {
      setApplyError("Selecciona al menos una venta.");
      return;
    }
    if (!Number.isSafeInteger(previewMonto) || previewMonto <= 0 || previewRows.some((row) =>
      selectedVentas.has(ventaKey(row.id)) && (!Number.isSafeInteger(row.aplicar) || row.aplicar < 0))) {
      setApplyError('El monto y los abonos deben ser valores enteros positivos en pesos.');
      return;
    }
    if (overAssignedRows.length > 0) {
      setApplyError("Hay abonos que superan el saldo actual de la venta.");
      return;
    }
    if (previewSummary.restante !== 0 || previewSummary.excedente !== 0) {
      setApplyError("El monto a distribuir no coincide con el total asignado.");
      return;
    }

    let payload: ApplyPayload = {
      clave_operacion: operationKey.current,
      monto_total: previewSummary.monto,
      tipo: modo,
      medioDePago:
        modo === "empresa"
          ? empresaForm.medioPago
          : modo === "jornada"
            ? jornadaForm.medioPago
            : clienteForm.medioPago,
      descripcion:
        modo === "empresa"
          ? empresaForm.descripcion
          : modo === "jornada"
            ? jornadaForm.descripcion
            : clienteForm.descripcion,
      fecha: (
        modo === "empresa"
          ? empresaForm.fecha
          : modo === "jornada"
            ? jornadaForm.fecha
            : clienteForm.fecha) || null,
      items: previewRows
        .filter((row) => isVentaSelected(selectedVentas, row.id))
        .map((row) => ({
          venta_id: row.id,
          monto: row.aplicar,
          saldo_esperado: normalizeSaldoInicial(row),
        }))
        .filter((item) => Number(item.monto || 0) > 0),
    };

    if (modo === "empresa") {
      payload.empresa_id = empresaForm.empresaId;
    } else if (modo === "jornada") {
      payload.jornada_id = jornadaForm.jornadaId;
    } else {
      payload.cliente_id = clienteForm.clienteId;
    }

    if (!payload.medioDePago) {
      setApplyError("Selecciona el medio de pago.");
      return;
    }

    if (!payload.items.length) {
      setApplyError("No hay montos válidos para aplicar.");
      return;
    }

    applying.current = true;
    setConfirmOpen(false);
    setApplyLoading(true);
    try {
      const { res, data } = await callApi("abonos/masivo/aplicar/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(apiError(data, "No se pudo aplicar el abono masivo."));
      }
      if (data.accion !== "ok" || data.creados?.length !== payload.items.length || data.total !== payload.monto_total) {
        throw new Error("No se pudo confirmar el registro completo del pago. No repitas la operacion sin verificarla.");
      }
      operationKey.current = null;
      setPreviewRows([]);
      setSelectedVentas(new Set());
      setPreviewMonto(null);
      setApplySuccess("Abono masivo aplicado correctamente.");
    } catch (err: unknown) {
      setApplyError(getErrorMessage(err, "Error al aplicar el abono masivo."));
    } finally {
      applying.current = false;
      setApplyLoading(false);
    }
  };

  const currentForm = modo === 'empresa' ? empresaForm : modo === 'jornada' ? jornadaForm : clienteForm;
  const targetField = modo === 'empresa' ? 'empresaId' : modo === 'jornada' ? 'jornadaId' : 'clienteId';
  const targetLabel = modo === 'empresa' ? 'Empresa' : modo === 'jornada' ? 'Jornada' : 'Cliente';
  const updateForm = (values: Record<string, unknown>) => {
    const setter = modo === 'empresa' ? setEmpresaForm : modo === 'jornada' ? setJornadaForm : setClienteForm;
    setter((prev) => ({ ...prev, ...values }));
  };
  const updateAmount = (value: number) => {
    updateForm({ monto: value });
    if (previewRows.length) {
      setPreviewMonto(value);
    }
  };
  const selectedRows = previewRows.filter((row) => isVentaSelected(selectedVentas, row.id));
  const selectedBalance = selectedRows.reduce((sum, row) => sum + normalizeSaldoInicial(row), 0);
  const quotaProposal = proposePayments(previewRows, selectedVentas, true).amount;
  const propose = (byQuota: boolean) => {
    const { amount, rows } = proposePayments(previewRows, selectedVentas, byQuota);
    setPreviewRows(rows);
    updateAmount(amount);
    setDistributionLabel(byQuota ? 'Una cuota por venta' : 'Saldar seleccionadas');
  };
  const dateLabel = (value: unknown) => value ? fechaFormat(value) : 'Sin indicar';
  const readyToApply = previewRows.length > 0 && selectedCount > 0 &&
    Number.isSafeInteger(previewMonto) && previewMonto > 0 &&
    selectedRows.every((row) => Number.isSafeInteger(row.aplicar) && row.aplicar >= 0) &&
    previewSummary.totalAsignado > 0 && previewSummary.balance === 0 && overAssignedRows.length === 0;

  return (
    <div className="page-shell mass-payments">
      <fieldset disabled={applyLoading} className="border-0 p-0 m-0 w-100">
        <legend className="visually-hidden">Registrar un abono masivo</legend>
        <section className="mass-payment-panel" aria-labelledby="mass-payment-form-title">
          <div className="mass-payment-heading">
            <div>
              <h2 id="mass-payment-form-title">1. Consultar obligaciones</h2>
              <p>Selecciona una empresa, jornada o cliente. No necesitas indicar un monto para consultar.</p>
            </div>
          </div>
          <div className="mass-payment-form">
            <div className="mass-payment-field mass-payment-mode">
              <label htmlFor="mass-payment-mode">Agrupar por</label>
              <select id="mass-payment-mode" className="form-select" value={modo} onChange={(e) => setModo(e.target.value)}>
                <option value="empresa">Empresa</option>
                <option value="jornada">Jornada</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            <div className="mass-payment-field mass-payment-target">
              <label htmlFor="mass-payment-target">{targetLabel}</label>
              <select id="mass-payment-target" className="form-select" value={currentForm[targetField]}
                onChange={(e) => updateForm({ [targetField]: e.target.value })} disabled={loading}>
                <option value="" disabled>{loading ? 'Cargando opciones...' : `Selecciona una ${modo === 'cliente' ? 'persona' : modo}`}</option>
                {modo === 'empresa' ? empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>{empresa.nombre}{empresa.nit ? ` (${empresa.nit})` : ''}</option>
                )) : modo === 'jornada' ? jornadas.map((jornada) => {
                  const fecha = jornada.fecha_inicio || jornada.fecha;
                  return <option key={jornada.id} value={jornada.id}>
                    {jornada.empresa__nombre || jornada.empresa_nombre}{jornada.sucursal ? ` - ${jornada.sucursal}` : ''}
                    {fecha ? ` (${fechaFormat(fecha)})` : ''}
                  </option>;
                }) : clientes.map((cliente) => (
                  <option key={cliente.cedula || cliente.id} value={cliente.cedula || cliente.id}>
                    {cliente.nombre}{cliente.cedula ? ` (${cliente.cedula})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mass-payment-field mass-payment-form-actions">
              <Button type="button" label={previewRows.length ? 'Consultar de nuevo' : 'Consultar'} icon="pi pi-eye"
                rounded className="mass-payment-preview-button" loading={previewLoading} disabled={loading}
                onClick={() => {
                  if (previewSummary.totalAsignado > 0 && !window.confirm('Consultar de nuevo descartara la distribucion preparada. Continuar?')) return;
                  handlePrevisualizar();
                }} />
            </div>
          </div>
        </section>

        <div className="mass-payment-notices" aria-live="polite">
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {previewError && <div className="alert alert-warning" role="alert">{previewError}</div>}
          {previewLoading && <div className="alert alert-info" role="status">Consultando ventas con saldo pendiente...</div>}
          {applyError && <div className="alert alert-danger" role="alert">{applyError}</div>}
          {applySuccess && <div className="alert alert-success" role="status">{applySuccess}</div>}
        </div>

        {previewRows.length > 0 ? (
          <section className="mass-payment-panel" aria-labelledby="mass-payment-preview-title">
            <div className="mass-payment-heading">
              <div>
                <h2 id="mass-payment-preview-title">2. Revisar y preparar la distribucion</h2>
                <p>{previewRows.length} ventas disponibles. Despliega cada pedido para ver su detalle. Las propuestas no registran pagos.</p>
              </div>
            </div>
            <div className="mass-payment-summary">
              <div><span>Saldo seleccionado</span><strong>{formatCurrency(selectedBalance)}</strong></div>
              <div><span>Una cuota por venta (estimado)</span><strong>{formatCurrency(quotaProposal)}</strong></div>
              <div><span>Total asignado</span><strong>{formatCurrency(previewSummary.totalAsignado)}</strong></div>
              <div className={previewSummary.excedente > 0 ? 'mass-payment-exceeded' : previewSummary.restante > 0 ? 'mass-payment-unbalanced' : 'mass-payment-balanced'}>
                <span>{balanceStatus.label}</span><strong>{formatCurrency(balanceStatus.value)}</strong>
              </div>
              <div><span>Saldo posterior seleccionado</span><strong>{formatCurrency(previewSummary.pendiente)}</strong></div>
            </div>
            <div className="mass-payment-toolbar">
              <label className="mass-payment-select-all">
                <input type="checkbox" className="form-check-input m-0" checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)} />
                Seleccionar todas ({selectedCount}/{previewRows.length})
              </label>
              <div className="mass-payment-tools">
                <Button type="button" label="Proponer una cuota" icon="pi pi-calculator" rounded outlined
                  disabled={selectedCount === 0}
                  onClick={() => propose(true)} />
                <Button type="button" label="Saldar seleccionadas" icon="pi pi-check-circle" rounded outlined
                  disabled={selectedCount === 0} onClick={() => propose(false)} />
              </div>
            </div>
            <p className="mass-payment-status">Cuota de referencia = valor de venta / cuotas, limitada al saldo. No indica cuotas vencidas. Propuesta: {distributionLabel}.</p>
            <div className="mass-payment-toolbar mass-payment-distribution-controls">
              <div className="mass-payment-field">
                <label htmlFor="mass-payment-total">Monto recibido / a distribuir</label>
                <InputNumber inputId="mass-payment-total" min={0} mode="currency" currency="COP" locale="es-CO"
                  value={previewMonto} onValueChange={(e) => updateAmount(Number(e.value || 0))} />
              </div>
              <div className="mass-payment-tools">
                <Button type="button" label="Repartir monto por igual" icon="pi pi-sync" rounded outlined
                  disabled={selectedCount === 0 || !previewMonto}
                  onClick={() => {
                    setPreviewRows(distributeEqual(previewRows, selectedVentas, Number(previewMonto || 0)).rows);
                    setDistributionLabel('Reparto por igual, limitado al saldo');
                  }} />
                <Button type="button" label="Usar total asignado" icon="pi pi-wallet" rounded outlined
                  disabled={previewSummary.totalAsignado <= 0} onClick={() => updateAmount(previewSummary.totalAsignado)} />
              </div>
            </div>
            <p className="mass-payment-status">Cambiar el monto no modifica tus abonos. Para recalcularlos utiliza una de las acciones de distribucion.</p>

            <table className="mass-payment-table">
              <caption className="visually-hidden">Ventas seleccionables y distribucion de los abonos</caption>
              <thead>
                <tr>
                  <th><span className="visually-hidden">Seleccionar</span></th>
                  <th>Pedido / cliente</th><th>Cuotas</th><th>Venta / valor cuota</th>
                  <th>Saldo actual</th><th>Abono a aplicar</th><th>Saldo restante</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => {
                  const selected = isVentaSelected(selectedVentas, row.id);
                  const saldoActual = normalizeSaldoInicial(row);
                  const aplicarActual = selected ? Number(row.aplicar || 0) : 0;
                  const saldoRestante = saldoActual - aplicarActual;
                  const exceedsSaldo = selected && roundMoney(aplicarActual) > roundMoney(saldoActual);
                  const cuotas = getCuotasVersus(row);
                  const nombre = clientesMap.get(String(row.cliente_id));
                  return (
                    <tr key={row.id} className={exceedsSaldo ? 'mass-payment-invalid' : ''}>
                      <td className="mass-payment-row-select">
                        <label>
                          <span className="visually-hidden">Seleccionar venta #{row.id}</span>
                          <input type="checkbox" className="form-check-input m-0" checked={selected}
                            onChange={() => toggleSelectRow(row.id)} />
                        </label>
                      </td>
                      <td className="mass-payment-customer">
                        <span className="mass-payment-order">Pedido #{row.id}</span>
                        <strong>{nombre || row.cliente_id}</strong>
                        {nombre && <small>Documento: {row.cliente_id}</small>}
                        <details className="mass-payment-sale-detail">
                          <summary>Ver detalle de venta</summary>
                          <div>
                            <p><strong>Venta:</strong> {dateLabel(row.fecha)}<br />
                              <strong>Inicio de pago:</strong> {dateLabel(row.fecha_inicio)}<br />
                              <strong>Vencimiento:</strong> {dateLabel(row.fecha_vencimiento)}<br />
                              <strong>Condicion:</strong> {row.condicion_pago || 'Sin indicar'}</p>
                            {row.detalle && <p>{row.detalle}</p>}
                            <strong>Articulos</strong>
                            {(row.articulos || []).map((item, index) => <p key={index}>
                              {item.articulo__nombre} - Cant. {item.cantidad} - Unit. {formatCurrency(item.precio_articulo)} - Total {formatCurrency(item.totalArticulo)}
                            </p>)}
                            {!row.articulos?.length && <p>Sin articulos registrados.</p>}
                            <strong>Abonos anteriores</strong>
                            {(row.abonos || []).map((abono) => <p key={abono.id}>
                              {dateLabel(abono.fecha_abono)} - {formatCurrency(abono.precio)} - {abono.medioDePago__nombre || 'Sin medio'}
                            </p>)}
                            {!row.abonos?.length && <p>Sin abonos registrados.</p>}
                          </div>
                        </details>
                      </td>
                      <td data-label="Cuotas">
                        {cuotas ? `${formatCuotasMetric(cuotas.pagadas)} / ${getNumeroCuotas(row)}` : getNumeroCuotas(row)}
                        <small>{cuotas ? `${formatCuotasMetric(cuotas.pendientes)} pendientes` : 'Sin detalle de cuotas'}</small>
                      </td>
                      <td data-label="Valor de venta">
                        {formatCurrency(row.precio)}
                        <small>Cuota: {formatCurrency(getValorCuota(row))}</small>
                      </td>
                      <td data-label="Saldo actual">{formatCurrency(saldoActual)}</td>
                      <td data-label="Abono a aplicar" className="mass-payment-apply">
                        <label className="visually-hidden" htmlFor={`aplicar-${row.id}`}>Abono a aplicar a venta #{row.id}</label>
                        <InputNumber inputId={`aplicar-${row.id}`} className="mass-payment-amount"
                          inputClassName={exceedsSaldo ? 'is-invalid' : undefined}
                          min={0} mode="currency" currency="COP" locale="es-CO" disabled={!selected}
                          value={aplicarActual} onValueChange={(e) => {
                            setDistributionLabel('Personalizada');
                            const value = Math.round(Number(e.value || 0));
                            setPreviewRows(previewRows.map((item) => {
                              if (item.id !== row.id) return item;
                              const saldoInicial = normalizeSaldoInicial(item);
                              const aplicar = Math.max(value, 0);
                              return { ...item, saldoInicial, aplicar, saldoFinal: saldoInicial - aplicar };
                            }));
                          }} />
                        {exceedsSaldo && <small className="mass-payment-error">Supera el saldo por {formatCurrency(aplicarActual - saldoActual)}.</small>}
                      </td>
                      <td data-label="Saldo restante" className={saldoRestante < 0 ? 'text-danger fw-semibold' : ''}>
                        {formatCurrency(saldoRestante)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!readyToApply && <p className="mass-payment-status" role="status">
              {overAssignedRows.length > 0 ? 'Corrige los abonos que superan el saldo actual.'
                : selectedCount === 0 ? 'Selecciona al menos una venta.'
                : previewSummary.excedente > 0 ? 'Reduce los abonos: el total asignado supera el monto a distribuir.'
                : previewSummary.restante > 0 ? 'Distribuye el monto pendiente antes de registrar el pago.'
                : 'Indica un monto mayor que cero para registrar el pago.'}
            </p>}
            <div className="mass-payment-heading mass-payment-registration-heading">
              <div><h2>3. Registrar el pago</h2><p>Confirma los datos del abono cuando la distribucion este completa.</p></div>
            </div>
            <div className="mass-payment-form">
              <div className="mass-payment-field">
                <label htmlFor="mass-payment-date">Fecha del abono</label>
                <input id="mass-payment-date" type="date" className="form-control" value={currentForm.fecha}
                  onChange={(e) => updateForm({ fecha: e.target.value })} />
                <small>Sin indicar: fecha actual.</small>
              </div>
              <div className="mass-payment-field mass-payment-method">
                <label htmlFor="mass-payment-method">Medio de pago</label>
                <select id="mass-payment-method" className="form-select" value={currentForm.medioPago}
                  onChange={(e) => updateForm({ medioPago: e.target.value })}>
                  <option value="">Selecciona un medio</option>
                  {mediosPago.map((medio) => <option key={medio.id} value={medio.id}>{medio.nombre}</option>)}
                </select>
              </div>
              <div className="mass-payment-field mass-payment-target">
                <label htmlFor="mass-payment-description">Descripcion (opcional)</label>
                <input id="mass-payment-description" type="text" className="form-control" maxLength={200}
                  value={currentForm.descripcion} onChange={(e) => updateForm({ descripcion: e.target.value })} />
              </div>
            </div>
            <div className="mass-payment-footer">
              <div>
                <strong>{formatCurrency(previewSummary.totalAsignado)}</strong>
                <small>{selectedCount} ventas seleccionadas</small>
              </div>
              <Button type="button" label="Revisar y confirmar" icon="pi pi-check" severity="success" rounded
                loading={applyLoading} disabled={!readyToApply || !currentForm.medioPago} onClick={() => setConfirmOpen(true)} />
            </div>
          </section>
        ) : !previewLoading && !error && !previewError && !applySuccess ? (
          <div className="mass-payment-empty">
            <i className="pi pi-wallet" aria-hidden="true" />
            <span>Consulta primero las obligaciones pendientes. Despues podras preparar una propuesta o distribuir un monto.</span>
          </div>
        ) : null}
      </fieldset>
      <Dialog header="Confirmar abono masivo" visible={confirmOpen} modal style={{ width: '32rem', maxWidth: '95vw' }}
        onHide={() => setConfirmOpen(false)}>
        <p>Se registraran {previewRows.filter((row) => selectedVentas.has(ventaKey(row.id)) && row.aplicar > 0).length} abonos por <strong>{formatCurrency(previewSummary.totalAsignado)}</strong>.</p>
        <p>Fecha: {currentForm.fecha ? dateLabel(currentForm.fecha) : 'Fecha actual'}<br />
          Medio: {mediosPago.find((medio) => String(medio.id) === String(currentForm.medioPago))?.nombre}</p>
        <p>Los saldos se verificaran nuevamente antes de guardar el pago completo.</p>
        <div className="d-flex justify-content-end gap-2">
          <Button label="Volver" rounded outlined onClick={() => setConfirmOpen(false)} />
          <Button label="Confirmar pago" rounded severity="success" disabled={!readyToApply || !currentForm.medioPago}
            onClick={handleAplicarAbonos} />
        </div>
      </Dialog>
    </div>
  );
}

export default AbonosMasivosPage;
