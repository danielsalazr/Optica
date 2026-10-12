# Cartera y abonos

La cartera se calcula como precio de venta menos suma de abonos, excluyendo
ventas anuladas y saldos no positivos. No depende de que exista un registro
en Saldos ni de los totales almacenados en Ventas. Las escrituras sincronizan
esos valores dentro de una transaccion, bloqueando primero la venta.

## Permisos y consulta

`GET /saldos/` y `GET /saldos/<venta_id>/` requieren view_saldos.
El endpoint de reportes requiere view_reportes; ver saldos no concede acceso
a todos los ingresos ni a todas las ventas. El detalle incluye solo la venta
consultada, sus articulos y abonos. Abrir editar venta requiere change_ventas.

El vencimiento corresponde a la fecha limite de la venta, no al atraso de
cada cuota. Se usa la fecha de la venta y, para datos antiguos sin ella, la
fecha del registro Saldos. La clasificacion utiliza el dia local del backend
para evitar diferencias de hidratacion o zona horaria del navegador.

## Edicion y trazabilidad

Crear/editar venta no confia en totalAbono ni saldo enviados por el navegador.
Cada abono existente conserva su ID y fecha de registro. Solo cambia su fecha
real si se modifica expresamente. Las eliminaciones se envian en la lista
abonos_eliminados; abonos agregados despues de abrir el formulario sobreviven.
Modificar o eliminar abonos existentes exige sus permisos correspondientes.
Los montos y la asociacion de un abono masivo no se pueden alterar desde un
abono individual, ni se puede eliminar un componente del pago masivo.

No se trasladan abonos entre ventas. Cero, negativos, fracciones de peso,
sobrepagos y pagos sobre ventas anuladas se rechazan. Django Admin se limita
a maestros: ventas, abonos, remisiones, jornadas, historicos y existencias
se ocultan del menu y no permiten altas, cambios ni eliminaciones, incluso
para superusuarios. Sus URLs existentes conservan consulta de solo lectura
para usuarios autorizados. Articulos, vendedores, clientes, empresas,
medios de pago, bodegas y usuarios siguen siendo gestionables.
Los datos historicos no se borran ni se reparan automaticamente.

## Despliegue y pruebas

El total de la venta y de cada articulo se contrasta con cantidad, precio
y descuento. Los descuentos porcentuales se redondean a pesos enteros.
Las ventas de contado remisionadas no se desbloquean cambiando su condicion
de pago. Sus pagos no permiten cambios financieros ni eliminaciones;
las fechas y descripciones pueden corregirse con los permisos habituales.
Antes de remisionar, una venta de contado tambien debe permanecer pagada.

Editar venta envia referencias firmadas de los abonos originales. Si uno
cambia antes del guardado, la actualizacion o eliminacion se rechaza para
evitar sobrescribir el trabajo de otro usuario. Es necesario recargar el
formulario; los abonos nuevos que no figuraban en el formulario se conservan.
La venta tambien envia una referencia de sus campos y articulos originales.
Una edicion antigua no puede sobrescribir otra venta guardada; los cambios
de pagos no invalidan por si solos esta referencia. El cliente debe existir
y las cantidades nunca pueden ser inferiores a las remisiones activas,
independientemente de si el articulo lleva control de inventario.
Las fechas de inicio/vencimiento del formulario se interpretan como dias
locales, no como instantes UTC. Jornadas y abonos masivos consultan la suma
real de abonos para mostrar sus saldos.
El valor cuota en remisiones es total de venta / cuotas; cuotas pagadas es
abonos reales * cuotas / total de venta (puede mostrar fracciones).
Quitar el vencimiento borra tambien la fecha almacenada en Saldos.

Actualizar backend y frontend juntos, reiniciar Django y reconstruir Next.
Estas correcciones no agregan migraciones. Recargar formularios de venta
abiertos antes del despliegue para enviar los identificadores de abonos.

Desde optica:

```powershell
..\venv\Scripts\python.exe manage.py test contabilidad.test_saldos contabilidad.test_abonos_masivos usuarios.test_auth --settings=optica.auth_test_settings
```

Desde frontend:

```powershell
node --test tests/balances.test.cjs tests/massPayment.test.cjs
```

Las pruebas de concurrencia contabilidad.test_saldos_concurrency requieren
MySQL local y el runner seguro optica.inventory_mysql_test_settings.

## Protecciones adicionales

- Editar y eliminar un abono individual requiere `snapshot`, devuelto por
  `GET /abono/` y `GET /abono/<venta>`. Una edicion exitosa devuelve la nueva
  referencia. Una referencia ausente o desactualizada responde 400.
- Las ventas anuladas no admiten cambios de estado ni alteraciones de abonos.
- Los cambios de estado bloquean la venta y guardan el historico en la misma
  transaccion. Un fallo del historico revierte tambien el estado.
- La remision relee y bloquea sus articulos despues de bloquear la venta,
  evitando validar cantidades antiguas durante una edicion concurrente.
- Las cuotas deben ser positivas. El vencimiento no puede preceder al inicio
  de pagos; contado conserva su vencimiento igual al inicio.
- Editar una venta permite conservar su jornada cerrada, pero no asociar una
  jornada cerrada nueva. Una venta inexistente responde 404 al actualizar.

Las regresiones estan en `contabilidad.test_financial_regressions`.
Desplegar backend y frontend juntos y recargar la vista de abonos para obtener
las referencias de edicion. Estas protecciones no requieren migraciones.

## Empresas y regresiones adicionales

La asociacion estable entre venta y empresa SI requiere la migracion
`contabilidad.0037_ventas_empresa`. Respaldar la base y ejecutar
`python manage.py migrate` antes de desplegar backend y frontend juntos.
La migracion asocia ventas antiguas cuando el nombre de empresa es unico.
Los nombres duplicados o inexistentes quedan sin asociacion: deben revisarse
y asignarse explicitamente antes de incluirlos en un abono masivo por empresa.
No se elige una empresa arbitrariamente.

- Agregar unidades pendientes a una venta entregada la devuelve a listo para
  entrega, registrando el cambio de estado.
- Cambiar empresa valida tambien la jornada conservada, aunque no venga en PUT.
- Las jornadas rechazan cuotas negativas y vencimientos anteriores al inicio.
- Las remisiones masivas rechazan filas y cantidades malformadas con 400.
- Venta y jornada comparten el calculo de vencimiento: la primera cuota cuenta
  desde el inicio; mensual conserva el dia, ajustandolo al final del mes.

Validacion: 205 pruebas MySQL, 16 pruebas frontend, build de Next y prueba
aislada del DDL y la asociacion de la migracion 0037. Tambien se volvieron a
ejecutar las 23 regresiones despues del ultimo ajuste de asociacion.

## Remisiones historicas y jornadas

Esta actualizacion requiere tambien `contabilidad.0038_remision_item_importes_originales`.
Respaldar la base, detener operaciones y ejecutar `python manage.py migrate`
antes de arrancar el backend actualizado. Desplegar tambien el frontend.

- Cada detalle de remision conserva precio, descuento, tipo, total y cantidad
  de referencia de la venta al emitirlo. Las ediciones posteriores no cambian
  esos importes en su visualizacion o reimpresion.
- Para remisiones antiguas la migracion conserva los valores disponibles al
  ejecutarse: no puede reconstruir precios sobrescritos anteriormente.
- Las jornadas validan transiciones incluso al enviar otros campos. Editar y
  eliminar bloquea la jornada; asociar una venta tambien bloquea esa jornada.
- La empresa de una jornada con ventas no puede cambiarse, aunque sea planificada.
- Los totales de jornadas excluyen ventas anuladas; estas siguen en el detalle
  historico. El contador de ventas sigue contando todos los registros.
- Una fecha de cambio de estado invalida responde 400 sin cambiar el pedido.
- Abrir editar venta conserva el vencimiento guardado, incluso si es nulo.
  Solo cambiar inicio, cuotas o condicion de pago recalcula el vencimiento.

Validacion de esta actualizacion: 213 pruebas MySQL, 16 pruebas frontend,
build de Next, DDL y datos de 0038 en MySQL temporal y navegador real verificando
conservacion del vencimiento al abrir/recargar y recalculo al cambiar cuotas
o seleccionar contado.

Pendiente detectado, aun sin modificar:
- La instalacion desde una base MySQL vacia falla antes de 0037, en la migracion
  0020 al crear la relacion de remision con venta. La prueba aislada de 0037
  pasa, pero no certifica la cadena historica completa de una instalacion nueva.

## Catalogo unico de estados del pedido

`contabilidad.0039_normalizar_estados_pedido` conserva exclusivamente:
7 Pedido tomado, 8 Para enviar a Fabricar, 9 Enviado a Fabricar,
10 Listo Para Entrega y 11 Entregado.

Reasigna 1->7, 2->8, 3->9, 4->10, 5->11 y 6->8 en ventas, pedidos y ambas
referencias del historico antes de eliminar los duplicados. No altera fechas,
motivos ni agrega eventos. El admin permite consultar el catalogo pero no
crearlo, editarlo ni eliminarlo; los valores predeterminados usan los nuevos IDs.

Respaldar la base y detener operaciones antes de aplicar
`python manage.py migrate contabilidad 0039 --noinput`, desplegando el backend
actualizado en la misma ventana de mantenimiento. No ejecutar el backend viejo
despues de migrar: su inicializacion recrearia los IDs 1 a 5.
La consolidacion no tiene reversa automatica; para restaurar las referencias
anteriores se requiere la copia de seguridad. Estados fuera de 1 a 11 detienen
la migracion para revisarlos, sin borrarlos arbitrariamente.

Validacion: 216 pruebas MySQL. Aplicada tambien en la base local con respaldo
previo: 202 referencias reasignadas, 71 ventas conservadas y fechas sin cambios.

## Anulacion historica y validaciones

Esta actualizacion requiere `contabilidad.0040_normalizar_anulado_ventas`.
Con respaldo y operaciones detenidas, ejecutar `python manage.py migrate`
antes de arrancar el backend actualizado. No se ha aplicado en produccion.

- Las ventas con `anulado=NULL` se consideran anuladas si tienen estado de
  pago 4, usuario de anulacion o motivo no vacio. Las demas quedan activas,
  visibles en saldos y abonos masivos. No cambia importes ni fechas.
- La columna queda NOT NULL. MySQL ejecuta este cambio fuera de una transaccion;
  la normalizacion de datos si es transaccional. No hay reversa automatica:
  conservar el respaldo para recuperar los valores originales.
- La consulta de clientes utiliza su cedula, no un campo id inexistente.
- Anular una venta y remisionar masivamente valida entradas malformadas con
  respuestas 400/404, sin exponer errores internos ni modificar registros.
- Venta y jornada aceptan como maximo 360 cuotas. El frontend limita el calculo
  de vencimiento y avanza las quincenas por meses, evitando recorridos enormes.
- Next.js y eslint-config-next quedan alineados en 15.5.14. Ejecutar `npm ci`,
  reconstruir el frontend y reiniciar su proceso al desplegar; reiniciar tambien
  cualquier servidor de desarrollo que siga usando dependencias anteriores.

Validacion: 221 pruebas MySQL, 18 pruebas frontend y build de Next exitosos.
Tras ajustar la transaccion del DDL se repitieron las 39 regresiones, incluyendo
la ejecucion completa de 0040. Aplicada localmente con respaldo previo: 35 ventas
recuperaron su marca activa y 2 conservaron la anulacion segun sus antecedentes.
