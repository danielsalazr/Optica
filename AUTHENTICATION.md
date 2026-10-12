# Login y permisos de la aplicacion

## Instalacion y despliegue

En el entorno virtual del backend, instalar `djangorestframework-simplejwt==5.5.1`.
Desde la carpeta que contiene `manage.py`:

```powershell
python manage.py migrate
python manage.py configurar_roles
```

Antes de desplegar con `PRODUCCION=True`, definir `JWT_SIGNING_KEY` en el `.env`
del backend. Debe ser un secreto aleatorio nuevo, distinto del codigo del proyecto.
Se puede generar con:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

No guardar ese valor en Git ni compartirlo. Si falta en produccion, Django no
arranca para evitar firmar sesiones con la clave de desarrollo.

En el frontend, `BACKEND_SSR_URL` debe apuntar a Django desde el servidor de Next.
Las llamadas de los navegadores pasan por `/api/backend` del mismo dominio.
Las URL de media/static y del agente de impresion conservan su configuracion.

```powershell
npm ci
npm run build
```

Reiniciar Gunicorn y Next/PM2 tras el despliegue. `npm ci` es importante: la
version instalada localmente de Next puede no coincidir con el lockfile.
El repositorio requiere Next 15.5.14 o posterior compatible, no 15.1.6.

En produccion, el dominio del frontend debe usar HTTPS; las cookies son Secure.
`AUTH_COOKIE_SECURE=false` sirve exclusivamente para probar un build de
produccion en HTTP local. No usarlo en un despliegue publico.
Nginx debe conservar `Host` y `X-Forwarded-Proto` para que Next valide el Origin.

## Usuarios y perfiles

El login utiliza **usuarios de Django**, no registros de Clientes ni Vendedor.
No existe registro publico de cuentas ni se crean contrasenas predeterminadas.
Usar Django Admin > Usuarios para crear cuentas, activar/desactivar usuarios,
asignar grupos y otorgar permisos individuales.

- Superusuario: acceso completo, incluso con restricciones individuales.
- Administrador: grupo inicial con todos los permisos de los modulos Next.
- Vendedor: consultar, crear y modificar ventas; consultar y crear remisiones.
  No puede anular/eliminar ventas o remisiones, ni acceder por defecto a jornadas,
  abonos globales, saldos, reportes, impresoras o resumen financiero.

Los vendedores pueden registrar abonos desde una venta y consultar su historico,
sin obtener acceso al modulo global de abonos. Los catalogos necesarios para
crear una venta siguen disponibles con permisos de ventas.

En Django Admin > Grupos se pueden cambiar los permisos de cada perfil. El
comando `configurar_roles` solo configura grupos nuevos y **no sobrescribe**
permisos que se hayan personalizado en grupos existentes.

Para restringir a una persona sin cambiar su grupo, crear una entrada en
Django Admin > Restricciones de acceso y seleccionar permisos denegados.
Estas restricciones tienen prioridad sobre los permisos del grupo y los
permisos individuales. Denegar "Consultar" un modulo tambien bloquea sus
acciones de crear, modificar y eliminar.

Los permisos se validan en el backend en cada peticion; los cambios afectan
sesiones existentes. Recargar el frontend para actualizar sus menus y botones.
Este esquema controla modulos y acciones, **no limita filas por vendedor**:
un usuario con acceso a ventas puede consultar las ventas del sistema.

`is_staff` habilita entrar a Django Admin, pero no concede acceso completo a
Next. Django Admin mantiene sus permisos nativos y su login de sesion; el login
JWT de Next no abre automaticamente una sesion de Django Admin.
El grupo Administrador de Next no concede por si solo gestion de usuarios del
admin. Usar un superusuario o asignar los permisos nativos correspondientes.

## Sesiones y seguridad

- JWT access: 5 minutos; refresh y su cookie: 3 dias desde el login, sin prolongar indefinidamente la sesion.
- Tokens en cookies HttpOnly, SameSite=Lax; no se entregan a JavaScript ni se
  guardan en localStorage.
- Renovacion automatica desde Next para peticiones del navegador y SSR.
- Logout revoca refresh y access asociados a esa sesion. Cambiar la contrasena
  o desactivar la cuenta tambien invalida los tokens.
- Las mutaciones de las rutas Next exigen Origin del mismo dominio.
- Login limitado a 10 intentos por minuto por nombre de usuario. En despliegues
  con varios workers configurar un cache compartido de Django y limitar tambien
  trafico por IP en Nginx; el cache en memoria no es un limitador global.
- Tracking y citas de la pagina publica permanecen sin login.
- El agente local de impresion conserva su propia configuracion y seguridad;
  estas credenciales JWT protegen Django y Next, no sustituyen las del agente.
- Los archivos `/media/` servidos directamente por Nginx y las URL de imagenes
  existentes no se vuelven privados por incorporar JWT. Para archivos sensibles
  se necesita una descarga autorizada o URL firmada y dejar de servirlos con un
  alias publico; eso requiere un cambio independiente en el despliegue.

Programar diariamente `python manage.py flushexpiredtokens` para limpiar tokens
vencidos de la blacklist.

## Pruebas

```powershell
python manage.py test usuarios.test_auth --settings=optica.auth_test_settings
```

Las pruebas usan SQLite aislado y no modifican datos de negocio. El archivo
`auth_test_settings` es exclusivo de pruebas; no usarlo en produccion.

## Referencias

- [Autenticacion en Next.js](https://nextjs.org/docs/app/guides/authentication)
- [Blacklist de Simple JWT](https://django-rest-framework-simplejwt.readthedocs.io/en/stable/blacklist_app.html)
