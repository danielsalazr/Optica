// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { InputNumber } from "primereact/inputnumber";
import { callApi } from "@/utils/js/api";
import { fechaFormat } from "@/utils/js/utils";

const defaultMode = "empresa";

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
  tipo: string;
  medioDePago: string;
  descripcion: string;
  fecha: string;
  items: Array<{
    venta_id: PreviewRow["id"];
    monto: number | undefined;
  }>;
  empresa_id?: string;
  jornada_id?: string;
  cliente_id?: string;
};

const BALANCE_EPSILON = 0.01;

function AbonosMasivosPage() {
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
        const { res, data } = await callApi("ventas/");
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
    setPreviewRows([]);
    setSelectedVentas(new Set());
    setPreviewMonto(null);
    setPreviewError("");
    setApplyError("");
    setApplySuccess("");
  }, [modo]);

  const clientesMap = useMemo(() => {
    const map = new Map();
    clientes.forEach((cliente) => {
      const key = cliente.cedula || cliente.id;
      const nombre = `${cliente.nombre || ""}${cliente.apellido ? ` ${cliente.apellido}` : ""}`.trim();
      if (key) {
        map.set(key, nombre || key);
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

  const applyMontoToSelected = (
    rows: PreviewRow[],
    selectedSet: Set<string>,
    montoTotal: number
  ) => {
    const selectedCount = selectedSet.size;
    const perVenta = selectedCount ? (montoTotal / selectedCount) : 0;
    const nextRows = rows.map((row) => {
      const saldo = normalizeSaldoInicial(row);
      if (!isVentaSelected(selectedSet, row.id)) {
        return {
          ...row,
          saldoInicial: saldo,
          aplicar: 0,
          saldoFinal: saldo,
        };
      }
      const aplicar = Math.min(Math.max(perVenta, 0), saldo);
      return {
        ...row,
        saldoInicial: saldo,
        aplicar,
        saldoFinal: saldo - aplicar,
      };
    });
    return {
      rows: nextRows,
      summary: buildSummary(nextRows, selectedSet, montoTotal),
    };
  };

  const applyValorCuotaToSelected = (
    rows: PreviewRow[],
    selectedSet: Set<string>,
    montoTotal: number
  ) => {
    let restante = Math.max(Number(montoTotal || 0), 0);

    const nextRows = rows.map((row) => {
      const saldo = normalizeSaldoInicial(row);
      if (!isVentaSelected(selectedSet, row.id)) {
        return {
          ...row,
          saldoInicial: saldo,
          aplicar: 0,
          saldoFinal: saldo,
        };
      }
      const valorCuota = getValorCuotaCalculado(row);
      const aplicar = Math.min(Math.max(valorCuota, 0), saldo, restante);
      restante = Math.max(restante - aplicar, 0);
      return {
        ...row,
        saldoInicial: saldo,
        aplicar,
        saldoFinal: saldo - aplicar,
      };
    });

    return {
      rows: nextRows,
      summary: buildSummary(nextRows, selectedSet, montoTotal),
    };
  };

  const distributeEqual = (
    rows: PreviewRow[],
    selectedSet: Set<string>,
    montoTotal: number
  ) => {
    const selectedCount = selectedSet.size;
    if (!selectedCount) {
      const nextRows = rows.map((row) => ({
        ...row,
        saldoInicial: normalizeSaldoInicial(row),
        aplicar: 0,
        saldoFinal: normalizeSaldoInicial(row),
      }));
      return {
        rows: nextRows,
        summary: buildSummary(nextRows, selectedSet, montoTotal),
      };
    }

    let restante = montoTotal;
    const selectedIds = rows.filter((row) => isVentaSelected(selectedSet, row.id)).map((row) => ventaKey(row.id));
    const basePerVenta = montoTotal / selectedCount;
    const nextRows = rows.map((row) => {
      const saldo = normalizeSaldoInicial(row);
      if (!isVentaSelected(selectedSet, row.id)) {
        return {
          ...row,
          saldoInicial: saldo,
          aplicar: 0,
          saldoFinal: saldo,
        };
      }
      const aplicarBase = Math.min(Math.max(basePerVenta, 0), saldo);
      return {
        ...row,
        saldoInicial: saldo,
        aplicar: aplicarBase,
        saldoFinal: saldo - aplicarBase,
      };
    });

    let totalAsignado = nextRows.reduce((acc, row) => acc + (row.aplicar || 0), 0);
    restante = Math.max(montoTotal - totalAsignado, 0);

    if (restante > 0 && selectedIds.length > 0) {
      let disponible = selectedIds.filter((id) => {
        const row = nextRows.find((r) => ventaKey(r.id) === id);
        return row && row.saldoFinal > 0;
      });

      while (restante > 0 && disponible.length > 0) {
        const extra = restante / disponible.length;
        let newDisponible: string[] = [];
        disponible.forEach((id) => {
          const idx = nextRows.findIndex((r) => ventaKey(r.id) === id);
          if (idx < 0) return;
          const row = nextRows[idx];
          const saldoLibre = row.saldoFinal;
          if (saldoLibre <= 0) return;
          const aplicarExtra = Math.min(extra, saldoLibre);
          row.aplicar += aplicarExtra;
          row.saldoFinal -= aplicarExtra;
          if (row.saldoFinal > 0) {
            newDisponible.push(id);
          }
        });
        totalAsignado = nextRows.reduce((acc, row) => acc + (row.aplicar || 0), 0);
        restante = Math.max(montoTotal - totalAsignado, 0);
        disponible = newDisponible;
      }
    }

    return {
      rows: nextRows,
      summary: buildSummary(nextRows, selectedSet, montoTotal),
    };
  };

  const handlePrevisualizar = async () => {
    setPreviewError("");
    setApplyError("");
    setApplySuccess("");
    setPreviewRows([]);
    setSelectedVentas(new Set());

    let tipo = "";
    let montoRaw = 0;
    let endpoint = "";

    if (modo === "empresa") {
      tipo = "empresa";
      montoRaw = empresaForm.monto || 0;
      if (!empresaForm.empresaId) {
        setPreviewError("Selecciona una empresa.");
        return;
      }
      endpoint = `abonos/masivo/preview/?tipo=empresa&empresa_id=${empresaForm.empresaId}`;
    } else if (modo === "jornada") {
      tipo = "jornada";
      montoRaw = jornadaForm.monto || 0;
      if (!jornadaForm.jornadaId) {
        setPreviewError("Selecciona una jornada.");
        return;
      }
      endpoint = `abonos/masivo/preview/?tipo=jornada&jornada_id=${jornadaForm.jornadaId}`;
    } else {
      tipo = "cliente";
      montoRaw = clienteForm.monto || 0;
      if (!clienteForm.clienteId) {
        setPreviewError("Selecciona un cliente.");
        return;
      }
      endpoint = `abonos/masivo/preview/?tipo=cliente&cliente_id=${clienteForm.clienteId}`;
    }

    const monto = Number(montoRaw || 0);
    if (!monto || monto <= 0) {
      setPreviewError("Ingresa un monto válido para previsualizar.");
      return;
    }

    setPreviewLoading(true);
    try {
      const { res, data } = await callApi(endpoint);
      if (!res.ok) {
        throw new Error(data.detail || "No se pudo cargar las ventas.");
      }

      const ventas = Array.isArray(data) ? data : [];
      if (!ventas.length) {
        setPreviewError("No hay ventas con saldo pendiente para esta selección.");
        return;
      }

      const selected = new Set(ventas.map((row) => ventaKey(row.id)));
      const { rows } = distributeEqual(ventas, selected, monto);
      setPreviewRows(rows);
      setSelectedVentas(selected);
      setPreviewMonto(monto);
    } catch (err: unknown) {
      setPreviewError(getErrorMessage(err, "Error al previsualizar."));
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const selected = new Set(previewRows.map((row) => ventaKey(row.id)));
      setSelectedVentas(selected);
      const monto = Number(previewMonto || 0);
      const { rows } = distributeEqual(previewRows, selected, monto);
      setPreviewRows(rows);
      setPreviewMonto(monto);
    } else {
      setSelectedVentas(new Set());
      const monto = Number(previewMonto || 0);
      const { rows } = distributeEqual(previewRows, new Set(), monto);
      setPreviewRows(rows);
      setPreviewMonto(monto);
    }
  };

  const toggleSelectRow = (ventaId: PreviewRow["id"]) => {
    setSelectedVentas((prev) => {
      const next = new Set(prev);
      const key = ventaKey(ventaId);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      const monto = Number(previewMonto || 0);
      const { rows } = distributeEqual(previewRows, next, monto);
      setPreviewRows(rows);
      setPreviewMonto(monto);
      return next;
    });
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
    setApplyError("");
    setApplySuccess("");

    if (!previewRows.length) {
      setApplyError("No hay previsualización cargada.");
      return;
    }
    if (selectedVentas.size === 0) {
      setApplyError("Selecciona al menos una venta.");
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
      fecha:
        modo === "empresa"
          ? empresaForm.fecha
          : modo === "jornada"
            ? jornadaForm.fecha
            : clienteForm.fecha,
      items: previewRows
        .filter((row) => isVentaSelected(selectedVentas, row.id))
        .map((row) => ({
          venta_id: row.id,
          monto: row.aplicar,
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

    setApplyLoading(true);
    try {
      const { res, data } = await callApi("abonos/masivo/aplicar/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(data.detail || "No se pudo aplicar el abono masivo.");
      }
      setApplySuccess("Abono masivo aplicado correctamente.");
    } catch (err: unknown) {
      setApplyError(getErrorMessage(err, "Error al aplicar el abono masivo."));
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">Abonos masivos</h2>

      <div className="mb-4">
        <label className="form-label">Selecciona el tipo de abono</label>
        <select
          className="form-select"
          value={modo}
          onChange={(e) => setModo(e.target.value)}
        >
          <option value="empresa">Por empresa</option>
          <option value="jornada">Por jornada</option>
          <option value="cliente">Por cliente</option>
        </select>
      </div>

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : null}

      {modo === "empresa" ? (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Abono masivo por empresa</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Empresa</label>
                <select
                  className="form-select"
                  value={empresaForm.empresaId}
                  onChange={(e) =>
                    setEmpresaForm((prev) => ({ ...prev, empresaId: e.target.value }))
                  }
                  disabled={loading}
                >
                  <option value="" disabled>
                    {loading ? "Cargando empresas..." : "Selecciona una empresa"}
                  </option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre} {empresa.nit ? `(${empresa.nit})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={empresaForm.fecha}
                  onChange={(e) =>
                    setEmpresaForm((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Monto total a distribuir</label>
                <InputNumber
                  inputId="monto-empresa"
                  className="w-100"
                  min={0}
                  mode="currency"
                  currency="COP"
                  locale="es-CO"
                  value={empresaForm.monto || null}
                  onValueChange={(e) =>
                    setEmpresaForm((prev) => ({ ...prev, monto: Number(e.value || 0) }))
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Medio de pago</label>
                <select
                  className="form-select"
                  value={empresaForm.medioPago}
                  onChange={(e) =>
                    setEmpresaForm((prev) => ({ ...prev, medioPago: e.target.value }))
                  }
                  disabled={loading}
                >
                  <option value="" disabled>
                    {loading ? "Cargando medios..." : "Selecciona un medio"}
                  </option>
                  {mediosPago.map((medio) => (
                    <option key={medio.id} value={medio.id}>
                      {medio.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                 <label className="form-label">Descripcion</label>
                <input
                  type="text"
                  className="form-control"
                  value={empresaForm.descripcion}
                  onChange={(e) =>
                    setEmpresaForm((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-4 d-flex gap-2">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handlePrevisualizar}
                disabled={previewLoading}
              >
                Previsualizar distribucion
              </button>
              <button className="btn btn-success" type="button" onClick={handleAplicarAbonos} disabled={applyLoading}>
                Aplicar abonos
              </button>
            </div>
          </div>
        </div>
      ) : modo === "jornada" ? (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Abono masivo por jornada</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Jornada</label>
                <select
                  className="form-select"
                  value={jornadaForm.jornadaId}
                  onChange={(e) =>
                    setJornadaForm((prev) => ({ ...prev, jornadaId: e.target.value }))
                  }
                  disabled={loading}
                >
                  <option value="" disabled>
                    {loading ? "Cargando jornadas..." : "Selecciona una jornada"}
                  </option>
                  {jornadas.map((jornada) => {
                    const fechaLabel = jornada.fecha ? fechaFormat(jornada.fecha) : "";
                    const empresaLabel = jornada.empresa__nombre || jornada.empresa_nombre || "";
                    const sucursalLabel = jornada.sucursal ? ` - ${jornada.sucursal}` : "";
                    return (
                      <option key={jornada.id} value={jornada.id}>
                        {empresaLabel}{sucursalLabel} {fechaLabel ? `(${fechaLabel})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={jornadaForm.fecha}
                  onChange={(e) =>
                    setJornadaForm((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Monto total a distribuir</label>
                <InputNumber
                  inputId="monto-jornada"
                  className="w-100"
                  min={0}
                  mode="currency"
                  currency="COP"
                  locale="es-CO"
                  value={jornadaForm.monto || null}
                  onValueChange={(e) =>
                    setJornadaForm((prev) => ({ ...prev, monto: Number(e.value || 0) }))
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Medio de pago</label>
                <select
                  className="form-select"
                  value={jornadaForm.medioPago}
                  onChange={(e) =>
                    setJornadaForm((prev) => ({ ...prev, medioPago: e.target.value }))
                  }
                  disabled={loading}
                >
                  <option value="" disabled>
                    {loading ? "Cargando medios..." : "Selecciona un medio"}
                  </option>
                  {mediosPago.map((medio) => (
                    <option key={medio.id} value={medio.id}>
                      {medio.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-8">
                 <label className="form-label">Descripcion</label>
                <input
                  type="text"
                  className="form-control"
                  value={jornadaForm.descripcion}
                  onChange={(e) =>
                    setJornadaForm((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-4 d-flex gap-2">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handlePrevisualizar}
                disabled={previewLoading}
              >
                Previsualizar distribucion
              </button>
              <button className="btn btn-success" type="button" onClick={handleAplicarAbonos} disabled={applyLoading}>
                Aplicar abonos
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Abono masivo por cliente</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Cliente</label>
                <select
                  className="form-select"
                  value={clienteForm.clienteId}
                  onChange={(e) =>
                    setClienteForm((prev) => ({ ...prev, clienteId: e.target.value }))
                  }
                  disabled={loading}
                >
                  <option value="" disabled>
                    {loading ? "Cargando clientes..." : "Selecciona un cliente"}
                  </option>
                  {clientes.map((cliente) => (
                    <option key={cliente.cedula || cliente.id} value={cliente.cedula || cliente.id}>
                      {cliente.nombre} {cliente.apellido ? ` ${cliente.apellido}` : ""}{" "}
                      {cliente.cedula ? `(${cliente.cedula})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={clienteForm.fecha}
                  onChange={(e) =>
                    setClienteForm((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Monto total a distribuir</label>
                <InputNumber
                  inputId="monto-cliente"
                  className="w-100"
                  min={0}
                  mode="currency"
                  currency="COP"
                  locale="es-CO"
                  value={clienteForm.monto || null}
                  onValueChange={(e) =>
                    setClienteForm((prev) => ({ ...prev, monto: Number(e.value || 0) }))
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Medio de pago</label>
                <select
                  className="form-select"
                  value={clienteForm.medioPago}
                  onChange={(e) =>
                    setClienteForm((prev) => ({ ...prev, medioPago: e.target.value }))
                  }
                  disabled={loading}
                >
                  <option value="" disabled>
                    {loading ? "Cargando medios..." : "Selecciona un medio"}
                  </option>
                  {mediosPago.map((medio) => (
                    <option key={medio.id} value={medio.id}>
                      {medio.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-8">
                 <label className="form-label">Descripcion</label>
                <input
                  type="text"
                  className="form-control"
                  value={clienteForm.descripcion}
                  onChange={(e) =>
                    setClienteForm((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-4 d-flex gap-2">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handlePrevisualizar}
                disabled={previewLoading}
              >
                Previsualizar distribucion
              </button>
              <button className="btn btn-success" type="button" onClick={handleAplicarAbonos} disabled={applyLoading}>
                Aplicar abonos
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        {previewError ? <div className="alert alert-warning">{previewError}</div> : null}
        {previewLoading ? <div className="alert alert-info">Cargando previsualizacion...</div> : null}
        {applyError ? <div className="alert alert-danger">{applyError}</div> : null}
        {applySuccess ? <div className="alert alert-success">{applySuccess}</div> : null}
        {previewRows.length > 0 ? (
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Previsualizacion de distribucion</h6>
              <div className="row g-3 align-items-end mb-3">
                <div className="col-md-4">
                  <label className="form-label">Monto a distribuir</label>
                  <InputNumber
                    inputId="monto-distribuir"
                    className="w-100"
                    min={0}
                    mode="currency"
                    currency="COP"
                    locale="es-CO"
                    value={previewMonto}
                    onValueChange={(e) => {
                      const montoNum = Number(e.value || 0);
                      setPreviewMonto(montoNum);
                      const { rows } = distributeEqual(
                        previewRows,
                        selectedVentas,
                        montoNum
                      );
                      setPreviewRows(rows);
                    }}
                  />
                </div>
                <div className="col-md-8">
                  <div className="d-flex flex-wrap gap-3">
                    <div><strong>Seleccionadas:</strong> {selectedCount}</div>
                    <div><strong>Monto:</strong> {formatCurrency(previewSummary.monto)}</div>
                    <div><strong>Pendiente:</strong> {formatCurrency(previewSummary.pendiente)}</div>
                  </div>
                  <div className={`alert ${balanceStatus.className} py-2 px-3 mt-2 mb-0 fw-semibold`}>
                    {balanceStatus.label}: {formatCurrency(balanceStatus.value)}
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end mb-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const montoNum = Number(previewMonto || 0);
                    const { rows } = distributeEqual(
                      previewRows,
                      selectedVentas,
                      montoNum
                    );
                    setPreviewRows(rows);
                  }}
                  disabled={selectedVentas.size === 0}
                >
                  Redistribuir abono
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary ms-2"
                  onClick={() => {
                    const montoNum = Number(previewMonto || 0);
                    const { rows } = applyValorCuotaToSelected(
                      previewRows,
                      selectedVentas,
                      montoNum
                    );
                    setPreviewRows(rows);
                  }}
                  disabled={selectedVentas.size === 0}
                >
                  Aplicar valor cuota
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={allSelected}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>Venta</th>
                      <th>Cliente</th>
                      <th className="text-center">Cuotas pag./total</th>
                      <th className="text-center">Cuotas pendientes</th>
                      <th className="text-center">Valor venta</th>
                      <th className="text-center">Valor cuota</th>
                      <th>Saldo actual</th>
                      <th className="text-center">Abono a aplicar</th>
                      <th>Saldo restante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => {
                      const selected = isVentaSelected(selectedVentas, row.id);
                      const saldoActual = normalizeSaldoInicial(row);
                      const aplicarActual = selected ? Number(row.aplicar || 0) : 0;
                      const saldoRestante = saldoActual - aplicarActual;
                      const exceedsSaldo = selected && roundMoney(aplicarActual) > roundMoney(saldoActual);

                      return (
                        <tr key={row.id} className={exceedsSaldo ? "table-danger" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selected}
                              onChange={() => toggleSelectRow(row.id)}
                            />
                          </td>
                          <td>{row.id}</td>
                          <td>{clientesMap.get(row.cliente_id) || row.cliente_id}</td>
                          <td className="text-center">
                            {(() => {
                              const cuotas = getCuotasVersus(row);
                              if (!cuotas) return getNumeroCuotas(row);
                              return `${formatCuotasMetric(cuotas.pagadas)} / ${formatCuotasMetric(Number((row.cuotas ?? row.numeroCuotas ?? row.compromisoPago) || 0))}`;
                            })()}
                          </td>
                          <td className="text-center">
                            {(() => {
                              const cuotas = getCuotasVersus(row);
                              if (!cuotas) return '-';
                              return formatCuotasMetric(cuotas.pendientes);
                            })()}
                          </td>
                          <td className="text-center">{formatCurrency(Number(row.precio || 0))}</td>
                          <td className="text-center">{formatCurrency(getValorCuota(row))}</td>
                          <td>{formatCurrency(saldoActual)}</td>
                          <td className="text-center">
                            <InputNumber
                              inputId={`aplicar-${row.id}`}
                              className="abono-masivo-aplicar-input"
                              style={{ width: "11rem" }}
                              inputStyle={{ width: "11rem" }}
                              inputClassName={exceedsSaldo ? "is-invalid" : undefined}
                              min={0}
                              mode="currency"
                              currency="COP"
                              locale="es-CO"
                              disabled={!selected}
                              value={aplicarActual}
                              onValueChange={(e) => {
                                const value = Number(e.value || 0);
                                const nextRows = previewRows.map((item) => {
                                  if (item.id !== row.id) return item;
                                  const saldoInicial = normalizeSaldoInicial(item);
                                  const aplicar = Math.max(value, 0);
                                  return {
                                    ...item,
                                    saldoInicial,
                                    aplicar,
                                    saldoFinal: saldoInicial - aplicar,
                                  };
                                });
                                setPreviewRows(nextRows);
                              }}
                            />
                            {exceedsSaldo ? (
                              <div className="text-danger small mt-1">
                                Supera el saldo actual por {formatCurrency(aplicarActual - saldoActual)}.
                              </div>
                            ) : null}
                          </td>
                          <td className={saldoRestante < 0 ? "text-danger fw-semibold" : ""}>
                            {formatCurrency(saldoRestante)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {overAssignedRows.length > 0 ? (
                <div className="alert alert-danger mt-3 mb-0">
                  Hay {overAssignedRows.length} venta{overAssignedRows.length === 1 ? "" : "s"} con abono superior al saldo actual. Ajusta el valor antes de aplicar.
                </div>
              ) : null}
              {previewSummary.restante !== 0 || previewSummary.excedente !== 0 ? (
                <div className={`alert mt-3 mb-0 ${previewSummary.excedente > 0 ? "alert-danger" : "alert-warning"}`}>
                  {previewSummary.excedente > 0
                    ? "El total asignado supera el monto a distribuir. Reduce uno o más abonos."
                    : "El monto a distribuir no está completamente asignado. Ajusta los valores o el monto total."}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AbonosMasivosPage;
