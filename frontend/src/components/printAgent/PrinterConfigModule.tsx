"use client";

import React, { useEffect, useMemo, useState } from "react";
import { buildPrintAgentUrl } from "@/utils/js/env";
import "@/styles/style.css";


type PrinterInfo = {
  name: string;
  port?: string;
  driver?: string;
  is_default?: boolean;
};

type PrinterStatus = {
  name: string;
  installed: boolean;
  online: boolean;
  port?: string | null;
  driver?: string | null;
  is_default?: boolean;
  status?: string;
};

type CompanyConfig = {
  name: string;
  document: string;
  phone: string;
  address: string;
  footer: string;
};

type AgentConfigResponse = {
  api_token_configured: boolean;
  host: string;
  port: number;
  printers: Record<string, string>;
  company: CompanyConfig;
};

type DocumentType = "constancia" | "remision" | "factura" | "recibo" | "abono" | "pedido";

const DOCUMENT_TYPES: Array<{ key: DocumentType; label: string }> = [
  { key: "constancia", label: "Constancia" },
  { key: "remision", label: "Remisión" },
  { key: "factura", label: "Factura" },
  { key: "recibo", label: "Recibo" },
  { key: "abono", label: "Abono" },
  { key: "pedido", label: "Pedido" },
];

const TOKEN_STORAGE_KEY = "optica_print_agent_token";

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
  const [savingCompany, setSavingCompany] = useState(false);

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

  const loadAgentData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const healthResponse = await fetch(buildPrintAgentUrl("health"));
      if (!healthResponse.ok) {
        throw new Error("No fue posible conectar con el servicio local de impresión.");
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
        throw new Error("No fue posible cargar la configuración de impresoras.");
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
        throw new Error("Token inválido o ausente en el print agent.");
      }

      if (!response.ok) {
        throw new Error("No fue posible guardar la impresora seleccionada.");
      }

      setSuccess(`Impresora guardada para ${documentType}.`);
      await loadAgentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar la configuración.");
    } finally {
      setSavingDocument(null);
    }
  };

  return (
    <div className="page-shell page-shell-narrow page-shell-print-agent">
      <div className="ventas-toolbar mb-3">
        <div>
          <h1 className="ventas-page-title mb-1">Impresoras</h1>
          <p className="text-muted mb-0">
            Configura la impresora por tipo de documento y valida su conexión con el print agent local.
          </p>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="abonos-summary">
        <div className="abonos-summary-card">
          <span className="label">Servicio</span>
          <span className="value">{serviceOnline ? "Conectado" : "Sin conexión"}</span>
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
            <span className="fw-semibold d-block">Conexión al agente local</span>
            <span className="text-muted small">Usa el token solo si el print agent lo tiene configurado.</span>
          </div>
          <button type="button" className="btn btn-outline-primary" onClick={loadAgentData} disabled={loading}>
            {loading ? "Consultando..." : "Validar conexión"}
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
            <span className="fw-semibold d-block">Configuración por documento</span>
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
                <th className="text-end">Acción</th>
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
                            {printer.name}{printer.is_default ? " (Predeterminada)" : ""}
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


