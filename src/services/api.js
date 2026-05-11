/**
 * WasteLink API Client
 * Connects to the Express/Supabase backend at /api/v1
 * Handles JWT tokens, auto-refresh, and all endpoint methods.
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  constructor() {
    this.baseUrl = BASE_URL;
    this._refreshPromise = null;
  }

  // ─── Token Management ──────────────────────────────────────────────────────

  getToken() {
    return localStorage.getItem('wl_access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('wl_refresh_token');
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('wl_access_token', accessToken);
    if (refreshToken) localStorage.setItem('wl_refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('wl_access_token');
    localStorage.removeItem('wl_refresh_token');
    localStorage.removeItem('wl_user');
  }

  // Deduplicated refresh — multiple parallel requests share one refresh call
  async _refreshTokens() {
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new ApiError('No refresh token', 401, null);

      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await res.json();
      if (!res.ok || !data?.data?.tokens) {
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('wl:session-expired'));
        throw new ApiError('Session expired. Please log in again.', 401, null);
      }

      this.setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
      return data.data.tokens.accessToken;
    })().finally(() => {
      this._refreshPromise = null;
    });

    return this._refreshPromise;
  }

  // ─── Core Request ──────────────────────────────────────────────────────────

  async request(endpoint, options = {}) {
    const token = this.getToken();

    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
      body:
        options.body && !isFormData && typeof options.body === 'object'
          ? JSON.stringify(options.body)
          : options.body,
    };

    let res = await fetch(`${this.baseUrl}${endpoint}`, config);

    // Auto-refresh on 401
    if (res.status === 401 && this.getRefreshToken()) {
      try {
        const newToken = await this._refreshTokens();
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(`${this.baseUrl}${endpoint}`, { ...config, headers });
      } catch {
        throw new ApiError('Session expired. Please log in again.', 401, null);
      }
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new ApiError(
        data?.message || `Request failed (${res.status})`,
        res.status,
        data
      );
    }

    return data;
  }

  get(endpoint, params) {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
          )
        )
      : '';
    return this.request(`${endpoint}${qs}`, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  upload(endpoint, formData) {
    return this.request(endpoint, { method: 'POST', body: formData });
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  auth = {
    register: (data) => this.post('/auth/register', data),
    login: ({ email, password }) =>
      this.post('/auth/login', { email, password }),
    refresh: () =>
      this.post('/auth/refresh', { refreshToken: this.getRefreshToken() }),
    logout: () => this.post('/auth/logout'),
    me: () => this.get('/auth/me'),
    changePassword: ({ currentPassword, newPassword }) =>
      this.post('/auth/change-password', { currentPassword, newPassword }),
    forgotPassword: (email) =>
      this.post('/auth/forgot-password', { email }),
  };

  // ─── Users ─────────────────────────────────────────────────────────────────

  users = {
    me: () => this.get('/users/me'),
    updateMe: (data) => this.patch('/users/me', data),
    uploadAvatar: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return this.upload('/users/me/avatar', fd);
    },
    getById: (id) => this.get(`/users/${id}`),
    getRecyclerProfile: () => this.get('/users/me/recycler-profile'),
    updateRecyclerProfile: (data) => this.put('/users/me/recycler-profile', data),
    uploadCertificate: (file) => {
      const fd = new FormData();
      fd.append('certificate', file);
      return this.upload('/users/me/recycler-profile/certificate', fd);
    },
  };

  // ─── Listings ──────────────────────────────────────────────────────────────

  listings = {
    /** Public feed. params: { waste_type, status, condition, page, limit } */
    list: (params) => this.get('/listings', params),
    mine: () => this.get('/listings/my'),
    getById: (id) => this.get(`/listings/${id}`),
    create: (data) => this.post('/listings', data),
    update: (id, data) => this.patch(`/listings/${id}`, data),
    delete: (id) => this.delete(`/listings/${id}`),
    uploadImages: (id, files) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      return this.upload(`/listings/${id}/images`, fd);
    },
    deleteImage: (id, imageId) =>
      this.delete(`/listings/${id}/images/${imageId}`),
    acceptPrice: (id) => this.post(`/listings/${id}/accept-price`),
    submit: (id) => this.post(`/listings/${id}/submit`),
  };

  // ─── Recyclers ─────────────────────────────────────────────────────────────

  recyclers = {
    /** params: { waste_type, certified, page, limit } */
    list: (params) => this.get('/recyclers', params),
    getById: (id) => this.get(`/recyclers/${id}`),
    requestMatch: (listingId) =>
      this.post(`/recyclers/listings/${listingId}/request-match`),
    incomingMatches: () => this.get('/recyclers/matches/incoming'),
    outgoingMatches: () => this.get('/recyclers/matches/outgoing'),
    respondToMatch: (matchId, action) =>
      this.patch(`/recyclers/matches/${matchId}/respond`, { action }),
  };

  // ─── Transactions ──────────────────────────────────────────────────────────

  transactions = {
    /** params: { status, page, limit } */
    list: (params) => this.get('/transactions', params),
    stats: () => this.get('/transactions/summary/stats'),
    getById: (id) => this.get(`/transactions/${id}`),
    updateStatus: (id, status) =>
      this.patch(`/transactions/${id}`, { status }),
    rate: (id, rating, comment) =>
      this.post(`/transactions/${id}/rate`, { rating, comment }),
  };

  // ─── Notifications ─────────────────────────────────────────────────────────

  notifications = {
    list: (params) => this.get('/notifications', params),
    unreadCount: () => this.get('/notifications/unread-count'),
    markRead: (id) => this.patch(`/notifications/${id}/read`),
    markAllRead: () => this.patch('/notifications/read-all'),
    delete: (id) => this.delete(`/notifications/${id}`),
  };

  // ─── Admin ─────────────────────────────────────────────────────────────────

  admin = {
    stats: () => this.get('/admin/stats'),
    users: (params) => this.get('/admin/users', params),
    updateUser: (id, data) => this.patch(`/admin/users/${id}`, data),
    deleteUser: (id) => this.delete(`/admin/users/${id}`),
    listings: () => this.get('/admin/listings'),
    verifyListing: (id, data) =>
      this.patch(`/admin/listings/${id}/verify`, data),
    deleteListing: (id) => this.delete(`/admin/listings/${id}`),
    transactions: () => this.get('/admin/transactions'),
    auditLogs: () => this.get('/admin/audit-logs'),
    notifyAll: (data) => this.post('/admin/notify-all', data),
  };
}

export const api = new ApiClient();
export default api;