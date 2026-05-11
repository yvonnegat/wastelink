/**
 * apiClient.js — Centralised HTTP client for WasteLink backend
 * Base: REACT_APP_API_URL/api/v1
 * Handles: JWT injection, token refresh, standardised error extraction
 */

const BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/v1`;

// ── Token Storage ──────────────────────────────────────────────────
const TOKEN_KEY   = 'wl_access_token';
const REFRESH_KEY = 'wl_refresh_token';

export const tokenStore = {
  getAccess:      ()        => localStorage.getItem(TOKEN_KEY),
  getRefresh:     ()        => localStorage.getItem(REFRESH_KEY),
  setTokens:      (a, r)    => { localStorage.setItem(TOKEN_KEY, a); if (r) localStorage.setItem(REFRESH_KEY, r); },
  clearTokens:    ()        => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY); },
};

// ── Refresh lock (prevent parallel refresh) ────────────────────────
let refreshingPromise = null;

async function refreshTokens() {
  if (refreshingPromise) return refreshingPromise;
  refreshingPromise = (async () => {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) throw new Error('No refresh token');
    const res  = await fetch(`${BASE}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error('Refresh failed');
    tokenStore.setTokens(json.data.accessToken, json.data.refreshToken);
    return json.data.accessToken;
  })();
  refreshingPromise.finally(() => { refreshingPromise = null; });
  return refreshingPromise;
}

// ── Core request ──────────────────────────────────────────────────
async function request(path, options = {}, retry = true) {
  const { body, headers: extraHeaders = {}, ...rest } = options;

  const isFormData = body instanceof FormData;
  const headers    = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...extraHeaders,
  };

  const token = tokenStore.getAccess();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  // 401 → try refresh once
  if (res.status === 401 && retry) {
    try {
      await refreshTokens();
      return request(path, options, false);
    } catch {
      tokenStore.clearTokens();
      window.dispatchEvent(new Event('wl:logout'));
      throw new ApiError('Session expired. Please log in again.', 401);
    }
  }

  // 204 No Content
  if (res.status === 204) return null;

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || 'Something went wrong';
    throw new ApiError(msg, res.status, json?.error?.details);
  }

  return json.data ?? json;
}

// ── ApiError class ────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status  = status;
    this.details = details;
  }
}

// ── Public helpers ────────────────────────────────────────────────
export const api = {
  get:    (path, opts = {})       => request(path, { method: 'GET',    ...opts }),
  post:   (path, body, opts = {}) => request(path, { method: 'POST',   body, ...opts }),
  patch:  (path, body, opts = {}) => request(path, { method: 'PATCH',  body, ...opts }),
  put:    (path, body, opts = {}) => request(path, { method: 'PUT',    body, ...opts }),
  delete: (path, opts = {})       => request(path, { method: 'DELETE', ...opts }),
  upload: (path, formData, method = 'POST') =>
    request(path, { method, body: formData }),
};

export default api;
