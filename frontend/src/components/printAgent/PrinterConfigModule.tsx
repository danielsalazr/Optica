// @ts-nocheck
﻿"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { buildPrintAgentUrl } from "@/utils/js/env";
import "@/styles/style.css";

type PrinterInfo = {
  name: string;
  port: string;
  driver: string;
  is_default: boolean;
};

type PrinterStatus = {
  name: string;
  installed: boolean;
  online: boolean;
  port: string | null;
  driver: string | null;
  is_default: boolean;
  status: string;
};

type CompanyConfig = {
  name: string;
  document: string;
  phone: string;
  address: string;
  footer: string;
};

type PrinterProfile = {
  receipt_width: number;
  item_desc_width: number;
  item_qty_width: number;
  item_price_width: number;
  item_total_width: number;
  abono_medio_width: number;
  abono_fecha_width: number;
  abono_valor_width: number;
};

type AgentConfigResponse = {
  api_token_configured: boolean;
  host: string;
  port: number;
  printers: Record<string, string>;
  company: CompanyConfig;
  printer_profiles: Record<string, PrinterProfile>;
};

type DocumentType = "constancia" | "remision" | "factura" | "recibo" | "abono" | "pedido";

const DOCUMENT_TYPES: Array<{ key: DocumentType; label: string }> = [
  { key: "constancia", label: "Constancia" },
  { key: "remision", label: "Remision" },
  { key: "factura", label: "Factura" },
  { key: "recibo", label: "Recibo" },
  { key: "abono", label: "Abono" },
  { key: "pedido", label: "Pedido" },
];

const TOKEN_STORAGE_KEY = "optica_print_agent_token";
const DEFAULT_PROFILE: PrinterProfile = {
  receipt_width: 42,
  item_desc_width: 18,
  item_qty_width: 4,
  item_price_width: 10,
  item_total_width: 10,
  abono_medio_width: 16,
  abono_fecha_width: 10,
  abono_valor_width: 16,
};

function deriveProfileFromReceiptWidth(receiptWidth: number): PrinterProfile {
  const safeWidth = Math.max(28, Math.round(receiptWidth || DEFAULT_PROFILE.receipt_width));
  const itemQtyWidth = 4;
  const itemPriceWidth = safeWidth >= 40 ? 10 : 8;
  const itemTotalWidth = safeWidth >= 40 ? 10 : 8;
  const itemFixedWidth = itemQtyWidth + itemPriceWidth + itemTotalWidth;
  const itemDescWidth = Math.max(8, safeWidth - itemFixedWidth);

  const abonoFechaWidth = 10;
  const abonoValorWidth = safeWidth >= 40 ? 16 : 12;
  const abonoMedioWidth = Math.max(8, safeWidth - (abonoFechaWidth + abonoValorWidth));

  return {
    receipt_width: safeWidth,
    item_desc_width: itemDescWidth,
    item_qty_width: itemQtyWidth,
    item_price_width: itemPriceWidth,
    item_total_width: itemTotalWidth,
    abono_medio_width: abonoMedioWidth,
    abono_fecha_width: abonoFechaWidth,
    abono_valor_width: abonoValorWidth,
  };
}

function wrapText(text: string, width: number): string[] {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (!current) {
      current = word;
      return;
    }
    if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
      return;
    }
    lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines;
}

function buildPreviewText(profile: PrinterProfile, printerName: string): string {
  const width = profile.receipt_width;
  const digitsLine = Array.from({ length: width }, (_, index) => String((index + 1) % 10)).join("");
  const tensLine = Array.from({ length: width }, (_, index) => String(Math.floor(index / 10) % 10)).join("");
  const edgeLine = width >= 2 ? `|${"-".repeat(width - 2)}|` : "|";
  const fullLine = "X".repeat(width);
  const alternatingLine = Array.from({ length: width }, (_, index) => (index % 2 === 0 ? "." : "#")).join("");
  const sampleWrap = wrapText(
    "Este texto debe respetar el ancho exacto configurado sin saltos inesperados al final de cada linea.",
    width
  );
  const calibrationTitle = "CALIBRACION";
  const titlePadding = Math.max(0, Math.floor((width - calibrationTitle.length) / 2));
  const centeredTitle = `${" ".repeat(titlePadding)}${calibrationTitle}`.slice(0, width);

  return [
    centeredTitle,
    `Impresora: ${printerName || "Sin seleccionar"}`.slice(0, width),
    `Ancho configurado: ${width} chars`.slice(0, width),
    edgeLine,
    tensLine,
    digitsLine,
    fullLine,
    alternatingLine,
    edgeLine,
    ...sampleWrap,
    edgeLine,
    "Si alguna linea se desborda, reduce el ancho.".slice(0, width),
    "Si sobra mucho espacio, aumentalo.".slice(0, width),
    edgeLine,
  ].join("\n");
}

function PrinterConfigModule() {
  const [token, setToken] = useState("");
  const [serviceOnline, setServiceOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingDocument, setSavingDocument] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [statuses, setStatuses] = useState<PrinterStatus[]>([]);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [company, setCompany] = useState<CompanyConfig>({
    name: "",
    document: "",
    phone: "",
    address: "",
    footer: "",
  });
  const [printerProfiles, setPrinterProfiles] = useState<Record<string, PrinterProfile>>({});
  const [selectedProfilePrinter, setSelectedProfilePrinter] = useState("");
  const [profileDraft, setProfileDraft] = useState<PrinterProfile>(DEFAULT_PROFILE);
  const [savingProfile, setSavingProfile] = useState(false);
  const [testingProfile, setTestingProfile] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
    setToken(storedToken);
  }, []);

  const headers = useMemo<Record<string, string>>(() => {
    if (!token.trim()) return {} as Record<string, string>;
    return { Authorization: `Bearer ${token.trim()}` };
  }, [token]);

  const statusesByName = useMemo(() => {
    const map = new Map<string, PrinterStatus>();
    statuses.forEach((printer) => map.set(printer.name, printer));
    return map;
  }, [statuses]);

  const onlineCount = useMemo(() => statuses.filter((item) => item.online).length, [statuses]);
  const profilePreview = useMemo(
    () => buildPreviewText(profileDraft, selectedProfilePrinter),
    [profileDraft, selectedProfilePrinter]
  );

  const loadAgentData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const healthResponse = await fetch(buildPrintAgentUrl("health"));
      if (!healthResponse.ok) {
        throw new Error("No fue posible conectar con el servicio local de impresion.");
      }

      setServiceOnline(true);

      const [printersResponse, statusesResponse, configResponse] = await Promise.all([
        fetch(buildPrintAgentUrl("printers"), { headers }),
        fetch(buildPrintAgentUrl("printers/status"), { headers }),
        fetch(buildPrintAgentUrl("config"), { headers }),
      ]);

      if (printersResponse.status === 401 || statusesResponse.status === 401 || configResponse.status === 401) {
        throw new Error("El print agent requiere token. Ingresa el token configurado y vuelve a consultar.");
      }

      if (!printersResponse.ok || !statusesResponse.ok || !configResponse.ok) {
        throw new Error("No fue posible cargar la configuracion de impresoras.");
      }

      const printersPayload: PrinterInfo[] = await printersResponse.json();
      const statusesPayload: PrinterStatus[] = await statusesResponse.json();
      const configPayload: AgentConfigResponse = await configResponse.json();

      setPrinters(printersPayload);
      setStatuses(statusesPayload);
      setSelection(configPayload.printers || {});
      setCompany(
        configPayload.company || {
          name: "",
          document: "",
          phone: "",
          address: "",
          footer: "",
        }
      );
      setPrinterProfiles(configPayload.printer_profiles || {});
    } catch (err) {
      setServiceOnline(false);
      setError(err instanceof Error ? err.message : "Error desconocido al consultar el servicio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgentData();
  }, [token]);

  useEffect(() => {
    if (!printers.length) {
      setSelectedProfilePrinter("");
      return;
    }

    setSelectedProfilePrinter((current) => {
      if (current && printers.some((printer) => printer.name === current)) {
        return current;
      }
      return printers[0]?.name || "";
    });
  }, [printers]);

  useEffect(() => {
    if (!selectedProfilePrinter) {
      setProfileDraft(DEFAULT_PROFILE);
      return;
    }
    const baseProfile = printerProfiles[selectedProfilePrinter] || DEFAULT_PROFILE;
    setProfileDraft(deriveProfileFromReceiptWidth(baseProfile.receipt_width));
  }, [selectedProfilePrinter, printerProfiles]);

  const handleTokenSave = () => {
    if (typeof window !== "undefined") {
      if (token.trim()) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    loadAgentData();
  };

  const handleSavePrinter = async (documentType: DocumentType) => {
    const printerName = selection[documentType];
    if (!printerName) {
      setError(`Selecciona una impresora para ${documentType}.`);
      return;
    }

    setSavingDocument(documentType);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildPrintAgentUrl("config/printers"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          document_type: documentType,
          printer_name: printerName,
        }),
      });

      if (response.status === 401) {
        throw new Error("Token invalido o ausente en el print agent.");
      }

      if (!response.ok) {
        throw new Error("No fue posible guardar la impresora seleccionada.");
      }

      setSuccess(`Impresora guardada para ${documentType}.`);
      await loadAgentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar la configuracion.");
    } finally {
      setSavingDocument(null);
    }
  };

  const handleProfileChange = (value: string) => {
    const parsedValue = Number(value);
    const nextReceiptWidth = Number.isFinite(parsedValue) ? parsedValue : DEFAULT_PROFILE.receipt_width;
    setProfileDraft(deriveProfileFromReceiptWidth(nextReceiptWidth));
  };

  const openProfileModal = () => {
    if (!printers.length) {
      setError("No hay impresoras detectadas para configurar un perfil.");
      return;
    }
    setError(null);
    setSuccess(null);
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    if (savingProfile || testingProfile) return;
    setProfileModalVisible(false);
  };

  const handleTestPrint = async () => {
    if (!selectedProfilePrinter) {
      setError("Selecciona una impresora para la prueba.");
      return;
    }

    setTestingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildPrintAgentUrl("printers/test"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          printer_name: selectedProfilePrinter,
          message: `Prueba de ancho ${profileDraft.receipt_width} caracteres`,
          profile: profileDraft,
        }),
      });

      if (response.status === 401) {
        throw new Error("Token invalido o ausente en el print agent.");
      }

      if (!response.ok) {
        throw new Error("No fue posible enviar la impresion de prueba.");
      }

      setSuccess(`Impresion de prueba enviada a ${selectedProfilePrinter}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible enviar la prueba.");
    } finally {
      setTestingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedProfilePrinter) {
      setError("Selecciona una impresora para configurar su perfil.");
      return;
    }

    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildPrintAgentUrl("config/printer-profiles"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          printer_name: selectedProfilePrinter,
          profile: profileDraft,
        }),
      });

      if (response.status === 401) {
        throw new Error("Token invalido o ausente en el print agent.");
      }

      if (!response.ok) {
        throw new Error("No fue posible guardar el perfil de impresion.");
      }

      setSuccess(`Perfil guardado para ${selectedProfilePrinter}.`);
      setProfileModalVisible(false);
      await loadAgentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="page-shell page-shell-narrow page-shell-print-agent">
      <div className="ventas-toolbar mb-3 gap-3">
        <div>
          <h1 className="ventas-page-title mb-1">Impresoras</h1>
          <p className="text-muted mb-0">
            Configura la impresora por tipo de documento y valida su conexion con el print agent local.
          </p>
        </div>
        <Button
          type="button"
          label="Perfil de impresion"
          icon="pi pi-sliders-h"
          className="p-button-primary p-button-rounded"
          onClick={openProfileModal}
          disabled={!printers.length}
        />
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="abonos-summary">
        <div className="abonos-summary-card">
          <span className="label">Servicio</span>
          <span className="value">{serviceOnline ? "Conectado" : "Sin conexion"}</span>
        </div>
        <div className="abonos-summary-card">
          <span className="label">Impresoras</span>
          <span className="value">{printers.length}</span>
        </div>
        <div className="abonos-summary-card">
          <span className="label">Online</span>
          <span className="value">{onlineCount}</span>
        </div>
      </div>

      <div className="ventas-card mb-4">
        <div className="abonos-header d-flex w-100 justify-content-between align-items-center gap-2 flex-wrap mb-3">
          <div>
            <span className="fw-semibold d-block">Conexion al agente local</span>
            <span className="text-muted small">Usa el token solo si el print agent lo tiene configurado.</span>
          </div>
          <button type="button" className="btn btn-outline-primary" onClick={loadAgentData} disabled={loading}>
            {loading ? "Consultando..." : "Validar conexion"}
          </button>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-md-8">
            <label className="form-label">Token del print agent</label>
            <input
              type="text"
              className="form-control"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Bearer token opcional"
            />
          </div>
          <div className="col-md-4">
            <button type="button" className="btn btn-primary w-100" onClick={handleTokenSave}>
              Guardar token y consultar
            </button>
          </div>
        </div>
      </div>

      <div className="ventas-card mb-4">
        <div className="abonos-header mb-3">
          <div>
            <span className="fw-semibold d-block">Configuracion por documento</span>
            <span className="text-muted small">Cada tipo de documento puede usar una impresora distinta.</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Impresora seleccionada</th>
                <th>Estado</th>
                <th>Puerto</th>
                <th className="text-end">Accion</th>
              </tr>
            </thead>
            <tbody>
              {DOCUMENT_TYPES.map((doc) => {
                const selectedPrinter = selection[doc.key] || "";
                const printerStatus = selectedPrinter ? statusesByName.get(selectedPrinter) : null;
                return (
                  <tr key={doc.key}>
                    <td className="fw-semibold">{doc.label}</td>
                    <td>
                      <select
                        className="form-select"
                        value={selectedPrinter}
                        onChange={(event) =>
                          setSelection((prev) => ({
                            ...prev,
                            [doc.key]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona una impresora...</option>
                        {printers.map((printer) => (
                          <option key={printer.name} value={printer.name}>
                            {printer.name}
                            {printer.is_default ? " (Predeterminada)" : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {!selectedPrinter ? (
                        <span className="badge bg-secondary">Sin configurar</span>
                      ) : printerStatus?.online ? (
                        <span className="badge bg-success">Online</span>
                      ) : (
                        <span className="badge bg-danger">Offline</span>
                      )}
                    </td>
                    <td>{printerStatus?.port || "-"}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleSavePrinter(doc.key)}
                        disabled={savingDocument === doc.key || !selectedPrinter}
                      >
                        {savingDocument === doc.key ? "Guardando..." : "Guardar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        header="Perfil de impresion"
        visible={profileModalVisible}
        style={{ width: "min(900px, 96vw)" }}
        modal
        draggable={false}
        resizable={false}
        className="jornadas-create-dialog"
        onHide={closeProfileModal}
      >
        <div className="mb-3">
          <div className="fw-semibold">Perfil de ancho por impresora</div>
          <div className="text-muted small">
            La TM-T20II queda con los valores actuales. Ajusta otras impresoras, como la TM-T220U, desde este panel.
          </div>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-md-7">
            <label className="form-label">Impresora</label>
            <select
              className="form-select"
              value={selectedProfilePrinter}
              onChange={(event) => setSelectedProfilePrinter(event.target.value)}
            >
              <option value="">Selecciona una impresora...</option>
              {printers.map((printer) => (
                <option key={printer.name} value={printer.name}>
                  {printer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-5">
            <label className="form-label">Ancho ticket</label>
            <input
              type="number"
              min="28"
              className="form-control"
              value={profileDraft.receipt_width}
              onChange={(event) => handleProfileChange(event.target.value)}
            />
          </div>
        </div>

        <div className="row g-3 mt-2">
          <div className="col-md-6">
            <div className="border rounded p-3 h-100 bg-light-subtle">
              <div className="fw-semibold mb-2">Distribucion automatica de articulos</div>
              <div className="small text-muted">Descripcion: {profileDraft.item_desc_width} chars</div>
              <div className="small text-muted">Cantidad: {profileDraft.item_qty_width} chars</div>
              <div className="small text-muted">Precio: {profileDraft.item_price_width} chars</div>
              <div className="small text-muted">Total: {profileDraft.item_total_width} chars</div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded p-3 h-100 bg-light-subtle">
              <div className="fw-semibold mb-2">Distribucion automatica de abonos</div>
              <div className="small text-muted">Medio pago: {profileDraft.abono_medio_width} chars</div>
              <div className="small text-muted">Fecha: {profileDraft.abono_fecha_width} chars</div>
              <div className="small text-muted">Valor: {profileDraft.abono_valor_width} chars</div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="fw-semibold mb-2">Vista previa</div>
          <pre
            className="border rounded bg-dark text-light p-3 small mb-0"
            style={{ fontFamily: "Consolas, 'Courier New', monospace", whiteSpace: "pre-wrap" }}
          >
            {profilePreview}
          </pre>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4 flex-wrap">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            outlined
            className="p-button-rounded"
            onClick={closeProfileModal}
            disabled={savingProfile || testingProfile}
          />
          <Button
            type="button"
            label={testingProfile ? "Imprimiendo..." : "Impresion de prueba"}
            icon="pi pi-print"
            severity="help"
            className="p-button-rounded"
            onClick={handleTestPrint}
            disabled={testingProfile || savingProfile || !selectedProfilePrinter}
          />
          <Button
            type="button"
            label={savingProfile ? "Guardando..." : "Guardar perfil"}
            icon="pi pi-save"
            className="p-button-rounded"
            onClick={handleSaveProfile}
            disabled={savingProfile || testingProfile || !selectedProfilePrinter}
          />
        </div>
      </Dialog>

      <div className="ventas-card">
        <div className="abonos-header mb-3">
          <div>
            <span className="fw-semibold d-block">Impresoras detectadas</span>
            <span className="text-muted small">Estado reportado por el print agent local.</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Impresora</th>
                <th>Driver</th>
                <th>Puerto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {statuses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    {loading ? "Consultando impresoras..." : "No se detectaron impresoras."}
                  </td>
                </tr>
              ) : (
                statuses.map((printer) => (
                  <tr key={printer.name}>
                    <td>
                      <span className="fw-semibold">{printer.name}</span>
                      {printer.is_default ? <span className="ms-2 badge bg-info text-dark">Predeterminada</span> : null}
                    </td>
                    <td>{printer.driver || "-"}</td>
                    <td>{printer.port || "-"}</td>
                    <td>
                      <span className={`badge ${printer.online ? "bg-success" : "bg-danger"}`}>
                        {printer.online ? "Online" : printer.status || "Offline"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PrinterConfigModule;
