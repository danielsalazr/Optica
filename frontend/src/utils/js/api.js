/* Utilidades para centralizar llamadas HTTP al backend */

const DEFAULT_API_BASE = 'http://localhost:8000/';

const resolveBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const url = new URL(`${protocol}//${hostname}`);
    url.port = '8000';
    return `${url.origin}/`;
  }

  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE.endsWith('/')
      ? process.env.NEXT_PUBLIC_API_BASE
      : `${process.env.NEXT_PUBLIC_API_BASE}/`;
  }

  return DEFAULT_API_BASE;
};

let cachedBaseUrl = resolveBaseUrl();

const ensureBaseUrl = () => {
  if (typeof window !== 'undefined') {
    cachedBaseUrl = resolveBaseUrl();
  }
  return cachedBaseUrl;
};

const buildUrl = (endPoint = '') => {
  const base = ensureBaseUrl();
  return `${base}${endPoint}`.replace(/([^:]\/)\/+/g, '$1');
};

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

const isUnsafeMethod = (method = 'GET') =>
  !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method.toUpperCase());

export const wl = typeof window !== 'undefined' ? window.location.href.split(/[:/]/) : [];
export const BASE_URL = ensureBaseUrl();

export function IP_URL() {
  return ensureBaseUrl();
}

async function fetchJson(endPoint, options = {}) {
  const url = buildUrl(endPoint);
  const method = options.method ?? 'GET';
  const headers = { ...(options.headers || {}) };

  if (isUnsafeMethod(method) && !headers['X-CSRFToken']) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }

  const config = {
    credentials: 'include',
    method,
    headers,
    ...options,
  };
  const response = await fetch(url, config);
  const data = await response.json();
  return { res: response, data };
}

export async function callApi(endPoint, options = {}) {
  return fetchJson(endPoint, options);
}

export async function callApiForm(endPoint, formData, options = {}) {
  const config = {
    method: options.method ?? 'POST',
    body: formData,
    ...options,
  };
  return fetchJson(endPoint, config);
}

export async function callApiFile(endPoint, options = {}) {
  return fetchJson(endPoint, options);
}

export async function callApiFile2(endPoint, options = {}) {
  return fetchJson(endPoint, options);
}
