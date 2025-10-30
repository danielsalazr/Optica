const rawBackendUrl = process.env.BACKEND_BASE_URL;

if (!rawBackendUrl) {
  // eslint-disable-next-line no-console
  console.warn(
    "La variable de entorno BACKEND_BASE_URL no está configurada. Configúrala en el archivo .env.",
  );
}

export const BACKEND_BASE_URL = rawBackendUrl
  ? rawBackendUrl.replace(/\/+$/, "")
  : "";
