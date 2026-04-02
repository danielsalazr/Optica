/* Utilidades para centralizar llamadas HTTP al backend */

import { BACKEND_BASE_URL, buildBackendUrl } from "./env";

const DEFAULT_API_BASE = `${BACKEND_BASE_URL || "http://localhost:8000"}/`;

const resolveBaseUrl = () => {
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const url = new URL(`${protocol}//${hostname}`);
    url.port = "8000";
    return `${url.origin}/`;
  }

  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE.endsWith("/")
      ? process.env.NEXT_PUBLIC_API_BASE
      : `${process.env.NEXT_PUBLIC_API_BASE}/`;
  }

  if (BACKEND_BASE_URL) {
    return `${BACKEND_BASE_URL}/`;
  }

  return DEFAULT_API_BASE;
};

let cachedBaseUrl = resolveBaseUrl();

const ensureBaseUrl = () => {
  if (typeof window !== "undefined") {
    cachedBaseUrl = resolveBaseUrl();
  }
  return cachedBaseUrl;
};

const buildUrl = (endPoint = "") => buildBackendUrl(endPoint).replace(/([^:]\/)\/+/g, "$1");

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return null;
};

const isUnsafeMethod = (method = "GET") => !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());

export const wl = typeof window !== "undefined" ? window.location.href.split(/[:/]/) : [];
export const BASE_URL = ensureBaseUrl();

export function IP_URL() {
  return ensureBaseUrl();
}

async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (_error) {
      return {};
    }
  }

  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { detail: text };
  }
}

async function fetchJson(endPoint, options = {}) {
  const url = buildUrl(endPoint);
  const method = options.method || "GET";
  const headers = { ...(options.headers || {}) };

  if (isUnsafeMethod(method) && !headers["X-CSRFToken"]) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  const config = {
    ...options,
    credentials: "include",
    method,
    headers,
  };

  const response = await fetch(url, config);
  const data = await parseResponseBody(response);
  return { res: response, data };
}

export async function callApi(endPoint, options = {}) {
  return fetchJson(endPoint, options);
}

export async function callApiForm(endPoint, formData, options = {}) {
  const config = {
    method: options.method || "POST",
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
