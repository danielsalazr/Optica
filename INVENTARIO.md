# Inventario: primera version

El modulo usa multiples bodegas y el catalogo de articulos existente. No lleva
costos, compras, lotes, series ni traslados entre bodegas en esta version.
Los servicios no pueden activar control de inventario.

## Despliegue

Desde `optica/`, con el entorno virtual activo:

```powershell
python manage.py migrate
python manage.py inicializar_inventario
```

Desde `frontend/`, generar el build y reiniciar el proceso Next de produccion:

```powershell
npm run build
```

El comando crea la bodega y agrega los cuatro permisos de inventario al grupo
`Administrador`, si existe. No modifica cantidades ni pedidos anteriores.
Para otros usuarios asignar permisos desde Django Admin: consultar inventario,
crear inventario (items, entradas y devoluciones), modificar inventario (items,
configuracion y ajustes) y eliminar inventario (items sin uso). Cada accion
requiere tambien consultar. Los vendedores no
obtienen estos permisos automaticamente. Los superusuarios tienen acceso.

## Activacion y saldo inicial

1. Abrir Inventario > Items. Por defecto los articulos no llevan control.
2. Crear o editar el item; activar el control y asignar SKU y stock minimo.
3. En Inventario > Existencias, registrar una entrada por las unidades disponibles contadas fisicamente,
   incluyendo un motivo como `Saldo inicial verificado`.
4. Crear nuevas ventas: sus unidades quedan reservadas hasta la remision.

Realizar la activacion y el conteo durante una pausa operativa: mientras un articulo
controlado no tenga existencias, las ventas nuevas que lo incluyan seran rechazadas.
No se permite desactivar un articulo mientras tenga existencias o reservas.

## Subsecciones y maestro de items

- Items administra el mismo modelo `Articulos` usado por Django Admin y ventas:
  nombre, descripcion, precio, tipo y fotos, junto con control, SKU y stock minimo.
  El guardado del maestro y su configuracion se hace en una misma transaccion.
- Existencias consulta stock fisico, reservado, disponible y alertas de minimo;
  registra entradas, ajustes y muestra movimientos de un item.
- Movimientos muestra el historial general, con paginacion en servidor y filtros
  por item, tipo y nombre/motivo. El mismo componente muestra el historial individual.

No se duplican catalogos ni configuraciones. Django Admin conserva su maestro
de articulos y sus tablas de inventario de solo lectura. El tipo de un articulo
controlado queda bloqueado en ambas interfaces; desactivar primero si no tiene stock
ni reservas. Los SKU son unicos. Cambiar el precio del maestro no modifica precios
ya registrados en ventas. Eliminar solo se permite si no hay ventas, pedidos, stock,
reservas ni movimientos relacionados; nunca se borra el historial para permitirlo.
Las fotos actuales se conservan al editar, salvo las que se quiten expresamente.

El acceso anterior `/inventario` redirige a `/inventario/existencias`.

## Bodegas

Django Admin > Inventario > Bodegas permite crear, consultar, renombrar, activar,
desactivar y eliminar bodegas sin registros relacionados. Usa los permisos normales
de Django para Bodega; `inicializar_inventario` los agrega al grupo Administrador.
La bodega principal (ID 1) no se puede eliminar ni desactivar: mantiene la
compatibilidad con ventas e inventario anteriores. No hay eliminacion masiva.
Las demas bodegas no se pueden eliminar si tienen ventas o existencias relacionadas,
aunque sus cantidades sean cero. No se pueden desactivar con unidades reservadas.

Crear y editar venta incluye Bodega de origen. Cada venta reserva y despacha desde
una sola bodega; no toma unidades disponibles de otras bodegas automaticamente.
Se puede cambiar antes del primer despacho: se liberan las reservas anteriores y se
reservan las nuevas en una sola transaccion. Si falta stock, todo se revierte.
Despues de una salida registrada, el origen queda bloqueado, aunque la remision
sea anulada posteriormente. La migracion asigna ventas anteriores a la principal,
sin alterar cantidades, reservas ni movimientos.

Existencias tiene un selector de bodega: stock fisico, reservado, disponible y
alertas se calculan para esa ubicacion. Entradas y ajustes incluyen su bodega.
Movimientos incluye filtro de bodega y muestra el origen en cada fila. El historial
individual se limita al item y a la bodega seleccionados.

Una devolucion fisica y una reversion retornan siempre a la bodega de la salida
original. Se permite devolver mercancia a una bodega inactiva, pero esta no admite
nuevas ventas, entradas ni ajustes. Si anular una remision requiere reservar otra
vez una venta en una bodega inactiva, reactivarla primero.

SKU, control y minimo pertenecen al item y se comparten entre bodegas. Para
desactivar el control del item deben estar en cero las existencias y reservas de
todas sus bodegas. Cambiar el nombre de una bodega no altera su historial.

**Corte historico:** solo participan ventas registradas despues de activar el
control del articulo (se compara `fechaCreacion`, no la fecha comercial de venta).
Las ventas anteriores no se reservan ni descuentan retroactivamente, aunque sean
editadas o remisionadas despues. Para el saldo inicial, separar fisicamente las
unidades destinadas a esos pedidos antiguos; el inventario controlado debe reflejar
las unidades disponibles para pedidos nuevos. Esta version no migra pedidos abiertos
antiguos al nuevo control.

## Cantidades

- Existencia: unidades fisicas en la bodega.
- Reservado: unidades comprometidas por ventas pendientes de remision.
- Disponible: existencia menos reservado.
- Stock bajo: disponible menor o igual al minimo configurado.

Ejemplo: entrada de 10 monturas, venta de 3 y remision parcial de 1:
existencia 9, reservado 2, disponible 7. Crear o editar una venta sin stock
suficiente devuelve un error de validacion y revierte sus cambios en base de datos.

Un ajuste usa la cantidad total del conteo, no la diferencia. Si hay 10 unidades
y el conteo indica 8, ingresar 8 registra un ajuste de -2. No puede dejar la
existencia por debajo de lo reservado. Cantidades enteras; motivo obligatorio.

## Anulaciones y devoluciones

- Anular la venta libera lo pendiente, pero **no retorna mercancia entregada**.
  Las remisiones se anulan documentalmente y las salidas permanecen en el historial.
- Anular directamente una remision es una reversion administrativa: reintegra sus
  unidades despachadas y vuelve a reservarlas si la venta sigue activa. Usar solo
  cuando la entrega no ocurrio o la mercancia ya regreso. La confirmacion advierte
  este efecto. No usar para borrar evidencia de una entrega real.
- Una devolucion fisica se registra desde la salida original en el historial,
  mediante Devolver. No anula la venta ni genera saldos o reembolsos financieros.
  No permite retornar mas unidades que las pendientes de devolver de esa salida.
- Una devolucion previa no se contabiliza de nuevo al revertir la remision.

## Auditoria y seguridad

Los movimientos registran articulo, unidades, existencia posterior, motivo,
fecha efectiva, fecha de registro, usuario y referencias de venta/remision.
Los reintentos con la misma clave y los mismos datos no duplican entradas.
Un reintento con datos diferentes se rechaza.

El historial no ofrece edicion ni borrado. Django Admin permite consultarlo,
pero las ventas, items y remisiones con articulos controlados deben gestionarse
desde la aplicacion para no omitir la logica transaccional. No modificar estas
tablas directamente por SQL ni crear documentos operativos por fuera de la API.

## Verificacion

Pruebas aisladas sin tocar datos de negocio:

```powershell
python manage.py test inventario contabilidad.test_abonos_masivos usuarios.test_auth --settings=optica.auth_test_settings
```

Incluyen reserva, falta de stock, venta nueva y edicion, entrega parcial,
anulacion, devoluciones, reintentos, fallos inyectados y permisos. SQLite omite
las pruebas de concurrencia porque no ofrece el bloqueo de filas requerido.

Para probar tambien concurrencia en MySQL/MariaDB local, usar un nombre unico:

```powershell
$env:INVENTORY_TEST_DB = 'test_optica_inventory_' + [guid]::NewGuid().ToString('N')
python manage.py test inventario contabilidad.test_abonos_masivos usuarios.test_auth --settings=optica.inventory_mysql_test_settings --noinput
```

El runner crea y elimina solamente esa base de pruebas. Rechaza produccion,
servidores remotos y nombres de bases existentes; requiere permisos para crear
y eliminar la base temporal. Crea el esquema desde los modelos actuales, no
recorre las migraciones historicas del proyecto. No usar `--keepdb` con este runner.
Ver casos y resultados en `INVENTARIO_PRUEBAS.md`.
