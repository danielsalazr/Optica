# Abonos masivos

## Consulta y propuestas

Consultar obligaciones solo requiere empresa, jornada o cliente, sin monto ni
medio de pago. El detalle desplegable incluye articulos, fechas de venta e inicio
de pago, vencimiento, condicion y abonos con su fecha real.

Seleccionar ventas permite proponer una cuota por venta o saldar las seleccionadas.
Estas propuestas calculan su propio monto y no guardan abonos. La cuota nominal no
representa cuotas vencidas. Tambien se puede introducir un monto recibido y usar
el reparto igualitario, o editar cada abono y usar el total asignado como monto.

Cambiar el monto conserva la distribucion. Cambiar la seleccion conserva los
abonos de las ventas que siguen seleccionadas y borra solo los de las retiradas.
Consultar de nuevo pide confirmacion si hay una distribucion preparada.
Antes de guardar se confirma el total, fecha y medio de pago en un modal.

Los montos se registran en pesos enteros, igual que los modelos de ventas y abonos.
La distribucion igualitaria conserva el total y reparte los pesos sobrantes sin
superar los saldos. El valor cuota sigue siendo total de venta / cuotas; al aplicar
una cuota se redondea al peso mas cercano y se limita al saldo y dinero disponible.

El backend valida todas las ventas antes de guardar: objetivo, anulacion, cliente,
saldo actualizado, fecha, medio de pago y total distribuido. Si un item falla se
revierte todo el lote. Un saldo distinto al previsualizado exige actualizarlo.

Cada previsualizacion obtiene una clave UUID de operacion. Los reintentos con la
misma clave y datos no crean otro pago. Reutilizarla con datos distintos se rechaza.
Esto no impide registrar un segundo pago legitimo con una nueva previsualizacion.
Tras el exito se limpia la distribucion. Ante una respuesta de red incierta, se
debe reintentar la misma operacion, no generar otra previsualizacion sin verificar
primero el historial de abonos.

El catalogo propio incluye jornadas cerradas para poder cobrar su cartera y no
requiere permisos del modulo de ventas.

## Despliegue

Actualizar backend y frontend juntos. Con las migraciones anteriores hasta
`0034_remision_anulacion_fields` presentes, ejecutar desde `optica/`:

```powershell
python manage.py migrate
```

La migracion `0035_abonomasivo_idempotencia` agrega campos sin alterar abonos
existentes. Reiniciar Django, reconstruir Next y recargar los navegadores: el
contrato nuevo exige clave de operacion, monto total y saldo esperado por venta.
No se ejecutaron migraciones sobre la base de negocio durante esta correccion.

## Pruebas

```powershell
# Desde optica/, con una base SQLite temporal y aislada:
..\venv\Scripts\python.exe manage.py test contabilidad.test_abonos_masivos usuarios.test_auth --settings=optica.auth_test_settings
# Desde frontend/:
node --test tests/massPayment.test.cjs
```

Las pruebas SQLite no comprueban bloqueos concurrentes de MySQL. El flujo masivo
bloquea las ventas en orden de ID y usa una clave unica para serializar reintentos;
los otros flujos que modifican ventas o abonos deben participar del mismo bloqueo
para garantizar exclusividad entre modulos.
