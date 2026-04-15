from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


DocumentType = Literal["constancia", "remision", "factura", "recibo", "abono", "pedido"]
FormatType = Literal["pos", "text", "pdf"]


class PrinterInfo(BaseModel):
    name: str
    port: str = ""
    driver: str = ""
    is_default: bool = False


class PrinterStatus(BaseModel):
    name: str
    installed: bool
    online: bool
    port: str | None = None
    driver: str | None = None
    is_default: bool = False
    status: str = "not_found"


class PrinterSelectionRequest(BaseModel):
    document_type: str = Field(..., examples=["constancia"])
    printer_name: str = Field(..., examples=["EPSON TM-T20II Receipt"])


class CompanyConfig(BaseModel):
    name: str = ""
    document: str = ""
    phone: str = ""
    address: str = ""
    footer: str = ""


class CompanyConfigRequest(BaseModel):
    name: str = ""
    document: str = ""
    phone: str = ""
    address: str = ""
    footer: str = ""


class PrinterProfile(BaseModel):
    receipt_width: int = Field(default=42, ge=20, le=120)
    item_desc_width: int = Field(default=18, ge=5, le=80)
    item_qty_width: int = Field(default=4, ge=2, le=20)
    item_price_width: int = Field(default=10, ge=4, le=30)
    item_total_width: int = Field(default=10, ge=4, le=30)
    abono_medio_width: int = Field(default=16, ge=5, le=60)
    abono_fecha_width: int = Field(default=10, ge=6, le=30)
    abono_valor_width: int = Field(default=16, ge=4, le=30)


class PrinterProfileRequest(BaseModel):
    printer_name: str = Field(..., examples=["EPSON TM-T20II Receipt"])
    profile: PrinterProfile


class AgentConfigResponse(BaseModel):
    api_token_configured: bool
    host: str
    port: int
    printers: dict[str, str]
    company: CompanyConfig
    printer_profiles: dict[str, PrinterProfile]


class PrintJobRequest(BaseModel):
    document_type: DocumentType
    format: FormatType = "pos"
    printer_name: str | None = None
    copies: int = Field(default=1, ge=1, le=10)
    data: dict[str, Any] = Field(default_factory=dict)


class PrintJobResponse(BaseModel):
    id: int
    status: str
    printer_name: str
    document_type: str
    format: str
    copies: int
    error_message: str | None = None
    generated_file: str | None = None
    created_at: str
    processed_at: str | None = None


class TestPrintRequest(BaseModel):
    printer_name: str | None = None
    message: str = "Prueba de impresion desde Optica Print Agent"
    profile: PrinterProfile | None = None
