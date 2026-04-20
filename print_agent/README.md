# Optica Print Agent

Agente local para Windows que expone una API REST en `127.0.0.1:7719`, detecta impresoras, guarda configuraciÃ³n local y procesa trabajos de impresiÃ³n.

## Swagger / OpenAPI

Cuando el servicio estÃ¡ arriba, FastAPI publica automÃ¡ticamente:

- Swagger UI: `https://127.0.0.1:7719/docs`
- ReDoc: `https://127.0.0.1:7719/redoc`
- OpenAPI JSON: `https://127.0.0.1:7719/openapi.json`

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
- `PUT /config/company`
- `POST /jobs/print`
- `GET /jobs`
- `GET /jobs/{id}`

## InstalaciÃ³n de dependencias

Si tu Python no trae `pip`, primero:

```powershell
python -m ensurepip --upgrade
python -m pip install -r print_agent\requirements.txt
```

## EjecuciÃ³n en desarrollo

```powershell
cd print_agent
python run.py
```

TambiÃ©n puedes usar:

```powershell
cd print_agent
uvicorn app.main:app --host 127.0.0.1 --port 7719 --ssl-certfile runtime/certs/localhost.crt --ssl-keyfile runtime/certs/localhost.key
```

## Certificado local HTTPS

El agente local ahora expone la API por `https://127.0.0.1:7719`.

Cuando ejecutas:

```powershell
python run.py
```

el servicio genera un certificado local autofirmado para `localhost` y `127.0.0.1`.

Si ejecutas el agente manualmente, el navegador puede mostrar:

- `ERR_CERT_AUTHORITY_INVALID`
- `Failed to fetch`

Eso no significa que el agente no haya arrancado. Significa que Windows o el navegador todavia no confian en el certificado local.

Si instalas el agente con el instalador, esa confianza se configura automaticamente. Si lo ejecutas manualmente en desarrollo, debes importar el certificado al almacen de certificados de Windows como administrador:

```powershell
certutil -f -addstore Root "C:\ProgramData\OpticaPrintAgent\certs\localhost.crt"
```

Despues de ejecutar ese comando:

1. cierra el navegador
2. vuelve a abrirlo
3. prueba de nuevo `https://127.0.0.1:7719/health`

Si usas una ruta de runtime distinta mediante `OPTICA_PRINT_AGENT_HOME`, debes importar el `.crt` generado en esa ubicacion en lugar de `C:\ProgramData\OpticaPrintAgent\certs\localhost.crt`.

## Prueba rÃ¡pida

Listar impresoras:

```powershell
Invoke-RestMethod https://127.0.0.1:7719/printers
```

Consultar estado de impresoras:

```powershell
Invoke-RestMethod https://127.0.0.1:7719/printers/status
```

Consultar una impresora puntual:

```powershell
Invoke-RestMethod "https://127.0.0.1:7719/printers/status/EPSON%20TM-T20II%20Receipt"
```

Guardar impresora por defecto para constancias:

```powershell
Invoke-RestMethod `
  -Method Put `
  -Uri https://127.0.0.1:7719/config/printers `
  -ContentType "application/json" `
  -Body '{"document_type":"constancia","printer_name":"EPSON TM-T20II Receipt"}'
```

Guardar informacion de la empresa para el encabezado:

```powershell
Invoke-RestMethod `
  -Method Put `
  -Uri https://127.0.0.1:7719/config/company `
  -ContentType "application/json" `
  -Body '{
    "name":"Bienestar Optica",
    "document":"NIT 900123456-7",
    "phone":"3001234567",
    "address":"Calle 10 # 20-30",
    "footer":"Gracias por su compra"
  }'
```

Enviar constancia:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri https://127.0.0.1:7719/jobs/print `
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
  -Uri https://127.0.0.1:7719/jobs/print `
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
          "descripcion":"Estuche premium",
          "cantidad":1,
          "valor_unitario":50000,
          "valor_total":50000
        }
      ],
      "valor_venta":350000,
      "abonado":150000,
      "saldo":200000,
      "abonos":[
        {
          "medio_pago":"Efectivo",
          "fecha":"2026-03-18",
          "valor":100000
        },
        {
          "medio_pago":"Transferencia",
          "fecha":"2026-03-19",
          "valor":50000
        }
      ],
      "observaciones":"Entrega parcial"
    }
  }'
```

## Build automatizado

Puedes generar el ejecutable y el instalador con un solo script:

```powershell
cd print_agent
.\build-release.ps1 -InstallBuildDeps -WinSWPath "C:\ruta\a\WinSW-x64.exe"
```

El script hace esto:

- limpia `build/`, `dist/` y el `.spec` previo
- genera `dist\OpticaPrintAgent.exe` con PyInstaller
- copia `WinSW-x64.exe` como `dist\OpticaPrintAgentService.exe`
- copia `installer\OpticaPrintAgent.xml` como `dist\OpticaPrintAgentService.xml`
- compila `installer\setup.iss` con Inno Setup

Requisitos para usarlo:

- Python disponible en PATH
- PyInstaller instalado, o usar `-InstallBuildDeps`
- Inno Setup 6 instalado
- `WinSW-x64.exe` descargado

Opciones utiles:

```powershell
# Solo generar ejecutables, sin instalador
.\build-release.ps1 -SkipInstaller -WinSWPath "C:\ruta\a\WinSW-x64.exe"

# Indicar ruta explicita de Inno Setup
.\build-release.ps1 -WinSWPath "C:\ruta\a\WinSW-x64.exe" -InnoSetupExe "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
```

Ubicaciones esperadas al finalizar:

- ejecutable: `print_agent\dist\OpticaPrintAgent.exe`
- wrapper de servicio: `print_agent\dist\OpticaPrintAgentService.exe`
- xml del servicio: `print_agent\dist\OpticaPrintAgentService.xml`
- instalador: `print_agent\installer\output\optica-print-agent-setup.exe`

## Estado actual

Este MVP ya hace:

- detecciÃ³n de impresoras Windows
- configuraciÃ³n persistente en SQLite
- cola bÃ¡sica de trabajos
- impresiÃ³n de `constancia`
- impresiÃ³n de `remision` en formato texto

Pendiente para la siguiente etapa:

- PDFs reales para facturas
- reintentos asÃ­ncronos
- empaquetado con PyInstaller
- servicio Windows completo con WinSW incluido


Notas del ticket de remision:

- La fecha de impresion se genera automaticamente.
- El total ahora se imprime como `Abonos` en lugar de `Abonado`.
- El encabezado usa la configuracion guardada en `PUT /config/company`.
