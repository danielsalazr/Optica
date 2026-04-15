from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .auth import require_token
from .config_service import (
    build_runtime_config,
    get_printer_mapping,
    get_printer_profiles,
    seed_defaults,
    set_company_config,
    set_printer_mapping,
    set_printer_profile,
)
from .db import init_db
from .job_service import create_job, get_job, list_jobs
from .printer_service import (
    build_calibration_test_text,
    build_constancia_text,
    get_printer_status,
    list_printer_statuses,
    list_printers,
    print_text,
)
from .schemas import (
    AgentConfigResponse,
    CompanyConfig,
    CompanyConfigRequest,
    PrintJobRequest,
    PrintJobResponse,
    PrinterInfo,
    PrinterProfile,
    PrinterProfileRequest,
    PrinterStatus,
    PrinterSelectionRequest,
    TestPrintRequest,
)


app = FastAPI(
    title="Optica Print Agent API",
    version="0.1.0",
    description=(
        "API local para detectar impresoras Windows, configurar impresoras por "
        "tipo de documento y enviar trabajos de impresion POS o texto."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={"name": "Optica"},
    license_info={"name": "Uso interno"},
    openapi_tags=[
        {"name": "health", "description": "Verificacion del estado del servicio."},
        {"name": "printers", "description": "Deteccion y prueba de impresoras."},
        {"name": "config", "description": "Configuracion persistente del agente."},
        {"name": "jobs", "description": "Creacion y consulta de trabajos de impresion."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()
    seed_defaults()


@app.get("/health", tags=["health"], summary="Verificar estado del servicio")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get(
    "/printers",
    response_model=list[PrinterInfo],
    dependencies=[Depends(require_token)],
    tags=["printers"],
    summary="Listar impresoras detectadas",
)
def get_printers() -> list[PrinterInfo]:
    return list_printers()


@app.get(
    "/printers/status",
    response_model=list[PrinterStatus],
    dependencies=[Depends(require_token)],
    tags=["printers"],
    summary="Listar estado de impresoras",
)
def get_printers_status() -> list[PrinterStatus]:
    return list_printer_statuses()


@app.get(
    "/printers/status/{printer_name}",
    response_model=PrinterStatus,
    dependencies=[Depends(require_token)],
    tags=["printers"],
    summary="Consultar estado de una impresora",
)
def get_single_printer_status(printer_name: str) -> PrinterStatus:
    return get_printer_status(printer_name)


@app.post(
    "/printers/test",
    dependencies=[Depends(require_token)],
    tags=["printers"],
    summary="Enviar impresion de prueba",
)
def test_printer(payload: TestPrintRequest) -> dict[str, str]:
    printer_name = payload.printer_name or get_printer_mapping().get("constancia", "")
    if not printer_name:
        raise HTTPException(status_code=400, detail="No hay impresora configurada.")

    profile_data = payload.profile.model_dump() if payload.profile else get_printer_profiles().get(printer_name)
    content = build_calibration_test_text(printer_name, profile=profile_data)
    print_text(printer_name, content, copies=1)
    return {"status": "sent", "printer_name": printer_name}


@app.get(
    "/config",
    response_model=AgentConfigResponse,
    dependencies=[Depends(require_token)],
    tags=["config"],
    summary="Consultar configuracion actual",
)
def get_config() -> AgentConfigResponse:
    config = build_runtime_config()
    return AgentConfigResponse(
        api_token_configured=bool(config["api_token"]),
        host=str(config["host"]),
        port=int(config["port"]),
        printers=dict(config["printers"]),
        company=CompanyConfig(**dict(config["company"])),
        printer_profiles={
            name: PrinterProfile(**profile)
            for name, profile in dict(config["printer_profiles"]).items()
        },
    )


@app.put(
    "/config/printers",
    dependencies=[Depends(require_token)],
    tags=["config"],
    summary="Guardar impresora por tipo de documento",
)
def set_default_printer(payload: PrinterSelectionRequest) -> dict[str, str]:
    set_printer_mapping(payload.document_type, payload.printer_name)
    return {
        "status": "saved",
        "document_type": payload.document_type,
        "printer_name": payload.printer_name,
    }


@app.get(
    "/config/printer-profiles",
    response_model=dict[str, PrinterProfile],
    dependencies=[Depends(require_token)],
    tags=["config"],
    summary="Consultar perfiles de ancho por impresora",
)
def get_configured_printer_profiles() -> dict[str, PrinterProfile]:
    return {
        name: PrinterProfile(**profile)
        for name, profile in get_printer_profiles().items()
    }


@app.put(
    "/config/printer-profiles",
    dependencies=[Depends(require_token)],
    tags=["config"],
    summary="Guardar perfil de ancho para una impresora",
)
def save_printer_profile(payload: PrinterProfileRequest) -> dict[str, object]:
    profile_data = payload.profile.model_dump()
    set_printer_profile(payload.printer_name, profile_data)
    return {
        "status": "saved",
        "printer_name": payload.printer_name,
        "profile": profile_data,
    }


@app.put(
    "/config/company",
    dependencies=[Depends(require_token)],
    tags=["config"],
    summary="Guardar informacion de la empresa para encabezados",
)
def set_company(payload: CompanyConfigRequest) -> dict[str, object]:
    data = payload.model_dump()
    set_company_config(data)
    return {
        "status": "saved",
        "company": data,
    }


@app.post(
    "/jobs/print",
    response_model=PrintJobResponse,
    dependencies=[Depends(require_token)],
    tags=["jobs"],
    summary="Crear e imprimir un trabajo",
)
def enqueue_print_job(payload: PrintJobRequest) -> PrintJobResponse:
    printer_name = payload.printer_name or get_printer_mapping().get(payload.document_type, "")
    if not printer_name:
        raise HTTPException(
            status_code=400,
            detail=f"No hay impresora configurada para '{payload.document_type}'.",
        )

    job = create_job(
        document_type=payload.document_type,
        format_name=payload.format,
        printer_name=printer_name,
        copies=payload.copies,
        payload=payload.data,
    )
    return PrintJobResponse(**job)


@app.get(
    "/jobs",
    response_model=list[PrintJobResponse],
    dependencies=[Depends(require_token)],
    tags=["jobs"],
    summary="Listar trabajos de impresion",
)
def get_jobs(limit: int = Query(default=50, ge=1, le=200)) -> list[PrintJobResponse]:
    return [PrintJobResponse(**row) for row in list_jobs(limit=limit)]


@app.get(
    "/jobs/{job_id}",
    response_model=PrintJobResponse,
    dependencies=[Depends(require_token)],
    tags=["jobs"],
    summary="Consultar un trabajo de impresion",
)
def get_job_detail(job_id: int) -> PrintJobResponse:
    try:
        row = get_job(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return PrintJobResponse(**row)
