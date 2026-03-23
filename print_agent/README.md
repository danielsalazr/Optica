# Optica Print Agent

Agente local para Windows que expone una API REST en `127.0.0.1:7719`, detecta impresoras, guarda configuración local y procesa trabajos de impresión.

## Swagger / OpenAPI

Cuando el servicio está arriba, FastAPI publica automáticamente:

- Swagger UI: `http://127.0.0.1:7719/docs`
- ReDoc: `http://127.0.0.1:7719/redoc`
- OpenAPI JSON: `http://127.0.0.1:7719/openapi.json`

Si quieres exportar el esquema a un archivo local:

```powershell
cd print_agent
python export_openapi.py
```

## Endpoints MVP

- `GET /health`
- `GET /printers`
- `GET /printers/status`
- `GET /printers/status/{printer_name}`
- `POST /printers/test`
- `GET /config`
- `PUT /config/printers`
- `POST /jobs/print`
- `GET /jobs`
- `GET /jobs/{id}`

## Instalación de dependencias

Si tu Python no trae `pip`, primero:

```powershell
python -m ensurepip --upgrade
python -m pip install -r print_agent\requirements.txt
```

## Ejecución en desarrollo

```powershell
cd print_agent
python run.py
```

También puedes usar:

```powershell
cd print_agent
uvicorn app.main:app --host 127.0.0.1 --port 7719
```

## Prueba rápida

Listar impresoras:

```powershell
Invoke-RestMethod http://127.0.0.1:7719/printers
```

Consultar estado de impresoras:

```powershell
Invoke-RestMethod http://127.0.0.1:7719/printers/status
```

Consultar una impresora puntual:

```powershell
Invoke-RestMethod "http://127.0.0.1:7719/printers/status/EPSON%20TM-T20II%20Receipt"
```

Guardar impresora por defecto para constancias:

```powershell
Invoke-RestMethod `
  -Method Put `
  -Uri http://127.0.0.1:7719/config/printers `
  -ContentType "application/json" `
  -Body '{"document_type":"constancia","printer_name":"EPSON TM-T20II Receipt"}'
```

Enviar constancia:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:7719/jobs/print `
  -ContentType "application/json" `
  -Body '{
    "document_type":"constancia",
    "format":"pos",
    "copies":1,
    "data":{
      "cliente":"Juan Perez",
      "documento":"CC 123456",
      "fecha":"2026-03-19",
      "detalle":"Se deja constancia de entrega del producto."
    }
  }'
```

Enviar remision:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:7719/jobs/print `
  -ContentType "application/json" `
  -Body '{
    "document_type":"remision",
    "format":"pos",
    "printer_name":"EPSON TM-T20II Receipt",
    "copies":1,
    "data":{
      "numero":"REM-10025",
      "fecha":"2026-03-19",
      "cliente":"Juan Perez",
      "items":[
        {
          "descripcion":"Lentes formulados",
          "cantidad":1,
          "valor_unitario":300000,
          "valor_total":300000
        },
        {
          "descripcion":"Estuche",
          "cantidad":1,
          "valor_unitario":50000,
          "valor_total":50000
        }
      ],
      "valor_venta":350000,
      "abonado":150000,
      "saldo":200000,
      "observaciones":"Entrega parcial"
    }
  }'
```

## Estado actual

Este MVP ya hace:

- detección de impresoras Windows
- configuración persistente en SQLite
- cola básica de trabajos
- impresión de `constancia`
- impresión de `remision` en formato texto

Pendiente para la siguiente etapa:

- PDFs reales para facturas
- reintentos asíncronos
- empaquetado con PyInstaller
- servicio Windows completo con WinSW incluido
