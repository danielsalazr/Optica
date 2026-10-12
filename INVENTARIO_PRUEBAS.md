# Validacion intensiva de inventario

## Entorno y alcance

Validado en MariaDB 10.4.20 local, con tablas InnoDB y conexiones independientes
por hilo. Se usaron bases temporales con nombre unico, nunca la base de negocio.
El runner impide sobrescribir una base existente y rechaza configuraciones de
produccion o servidores remotos.

La suite conjunta tiene 134 casos: 31 pruebas iniciales de inventario, 21 pruebas
adicionales de integridad, 18 pruebas del maestro de items/configuracion,
15 pruebas de bodegas, 14 escenarios concurrentes y 35 pruebas de regresion de autenticacion y abonos
masivos. Los 134 pasaron en MariaDB. SQLite omite los 14 concurrentes
expresamente porque requiere bloqueo de filas.

Las pruebas del maestro incluyen CRUD, fotos multiples, conservacion de archivos,
rechazo de imagenes invalidas, permisos de eliminacion y consulta, eliminacion
bloqueada por documentos/stock/historial y filtros/paginacion del historial general.
Tambien comprueban guardado conjunto de configuracion, preservacion del control
si no se envia en multipart, SKU duplicado con rollback completo, servicios sin
inventario y desactivacion rechazada cuando hay stock.

La comprobacion en navegador valida CRUD y configuracion desde Items, error de SKU
duplicado, stock, historial individual y general paginado. Las tres subsecciones
se comprobaron a 320, 390, 768 y 1440 px sin desbordamiento horizontal.

Las pruebas de bodegas incluyen CRUD en Django Admin, proteccion de la principal,
desactivacion con reservas, stock y movimientos separados, no consumir otra bodega,
cambio de origen y rollback cuando falta stock, bloqueo despues del despacho,
devoluciones a su origen e inactivas y control del stock en todas las ubicaciones.
La concurrencia incluye ventas compitiendo en dos bodegas y desactivacion desde
admin simultanea con una venta: nunca quedan reservas en una bodega inactiva.
En navegador se verificaron selectores, entrada Norte, historiales por bodega,
layout responsive y selector de origen en el formulario compartido de venta.

Adicionalmente se repitieron los 12 escenarios concurrentes en cinco rondas
completas, todas exitosas. Al finalizar no quedaron bases temporales de auditoria.

## Integridad y fallos

- Simulacion reproducible: 300 pasos con semillas 17, 83 y 2026, combinando
  entradas, ventas, ediciones, ajustes, entregas, devoluciones y anulaciones.
  Tras cada paso se comprueba que la existencia coincida con el saldo inicial
  mas el historial, y que las reservas coincidan con las unidades pendientes.
- Fallos inyectados al escribir el historial despues de modificar cantidades:
  entradas, entregas y reversiones deben revertir tambien sus documentos y reservas.
- Entrega parcial seguida de edicion; rechazo al reducir por debajo de lo entregado.
- Devolucion parcial, anulacion y nueva entrega sin duplicar el reingreso.
- Devolucion fisica despues de anular la venta, sin recrear reservas.
- Anulacion rechazada si reintegrar y reservar excederia el stock disponible
  porque una devolucion anterior ya se comprometio en otra venta.
- Remision masiva con una venta fallida y otra exitosa: solo la exitosa persiste.
- Historial de 65 movimientos consultado en cuatro paginas, sin perder ni repetir filas.
- Cantidades negativas, fraccionarias, nulas o fuera de rango; motivos vacios,
  UUID invalidos, fechas imposibles y devoluciones de otro articulo.
- Permisos de consulta obligatorios y restricciones individuales por encima
  de permisos otorgados; fechas locales con USE_TZ activado y desactivado.

## Concurrencia

Cada solicitud usa su propia conexion y transaccion. Los escenarios incluyen:

| Escenario | Resultado esperado |
| --- | --- |
| 8 ventas de 2 unidades compiten por 10 | 5 aceptadas; 3 rechazadas; reserva total 10 |
| 8 remisiones de 1 unidad para una venta de 2 | 2 aceptadas; 6 rechazadas |
| 8 reintentos de la misma entrada | 1 movimiento; 7 respuestas de reintento |
| 8 devoluciones de 1 unidad tras entregar 2 | 2 aceptadas; 6 rechazadas |
| 8 anulaciones de la misma remision | 1 reversion; las restantes rechazadas |
| 2 ventas intercambian articulos simultaneamente | Ambas guardadas sin interbloqueo |
| Misma clave UUID usada a la vez en articulos distintos | 1 aceptada; 1 validacion 400, nunca doble entrada |
| Mismo SKU asignado a la vez a articulos distintos | 1 aceptado; 1 validacion 400 |
| Anulacion de venta compite con una entrega | Sin reservas activas de la venta anulada; ledger consistente |
| Reduccion de cantidad compite con una entrega | Una operacion rechazada; nunca entrega superior a lo vendido |
| Conteo fisico compite con una reserva | Se rechaza la operacion incompatible; existencia >= reservado |
| Dos lotes de remisiones recorren ventas en orden opuesto | Ambos procesados sin interbloqueo ni entrega duplicada |

## Correcciones detectadas

La prueba de intercambio de articulos reprodujo un interbloqueo real de InnoDB.
Ahora se bloquean ventas y configuraciones en orden consistente, incluyendo
los articulos anteriores y los nuevos antes de liberar reservas. Los lotes
bloquean primero todas sus ventas y despues todas sus configuraciones.

Una clave repetida simultaneamente en articulos distintos podia provocar un
error 500 de unicidad. Ahora el conflicto se captura dentro de un savepoint y
se rechaza como validacion, revirtiendo el stock del intento fallido. Se aplica
la misma proteccion a codigos SKU concurrentes.

Tambien se agregaron el limite portable de existencia de 2.147.483.647 unidades
y protecciones para no despachar una remision anulada ni revertir una activa.

## Limites de esta verificacion

Estas pruebas verifican integridad y conflictos concurrentes, no son un benchmark
de rendimiento ni garantizan ausencia de todo interbloqueo posible bajo cualquier
carga. No prueban una migracion desde todas las versiones historicas ni una
infraestructura distribuida con varios servidores. El esquema de pruebas se
crea desde los modelos actuales. Los cambios de esta revision son del backend;
no se modifico el frontend.
