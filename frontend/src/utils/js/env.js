const normalizeBaseUrl = (value, fallback = "") => {
  const resolved = (value || fallback || "").trim();
  if (!resolved) return "";
  return resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
};

const DEFAULT_BACKEND_URL = "http://localhost:8000";
const DEFAULT_FRONTEND_URL = "http://localhost:3000";
const DEFAULT_PRINT_AGENT_URL = "http://127.0.0.1:7719";

export const BACKEND_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_BACKEND_URL,
  DEFAULT_BACKEND_URL
);

export const SSR_BACKEND_BASE_URL = normalizeBaseUrl(
  process.env.BACKEND_SSR_URL,
  BACKEND_BASE_URL
);

export const FRONTEND_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  DEFAULT_FRONTEND_URL
);

export const ADMIN_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_ADMIN_BASE_URL,
  BACKEND_BASE_URL
);

export const MEDIA_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
  BACKEND_BASE_URL
);

export const PRINT_AGENT_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_PRINT_AGENT_URL,
  DEFAULT_PRINT_AGENT_URL
);

const buildUrl = (baseUrl, path = "") => {
  const base = normalizeBaseUrl(baseUrl);
  const suffix = String(path || "").replace(/^\/+/, "");
  return suffix ? `${base}/${suffix}` : base;
};

export const buildBackendUrl = (path = "") => buildUrl(BACKEND_BASE_URL, path);
export const buildServerBackendUrl = (path = "") => buildUrl(SSR_BACKEND_BASE_URL, path);
export const buildFrontendUrl = (path = "") => buildUrl(FRONTEND_BASE_URL, path);
export const buildAdminUrl = (path = "") => buildUrl(ADMIN_BASE_URL, path);
export const buildMediaUrl = (path = "") => buildUrl(MEDIA_BASE_URL, path);
export const buildPrintAgentUrl = (path = "") => buildUrl(PRINT_AGENT_BASE_URL, path);
