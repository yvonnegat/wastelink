import api from './apiClient';

// ── Transactions ──────────────────────────────────────────────────
export const transactionsService = {
  getAll(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/transactions${q ? `?${q}` : ''}`);
  },
  getById(id)        { return api.get(`/transactions/${id}`); },
  updateStatus(id, payload) { return api.patch(`/transactions/${id}`, payload); },
  rate(id, payload)  { return api.post(`/transactions/${id}/rate`, payload); },
  getStats()         { return api.get('/transactions/summary/stats'); },
};

// ── Notifications ─────────────────────────────────────────────────
export const notificationsService = {
  getAll(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/notifications${q ? `?${q}` : ''}`);
  },
  getUnreadCount()   { return api.get('/notifications/unread-count'); },
  markRead(id)       { return api.patch(`/notifications/${id}/read`, {}); },
  markAllRead()      { return api.patch('/notifications/read-all', {}); },
  delete(id)         { return api.delete(`/notifications/${id}`); },
};

// ── Users ─────────────────────────────────────────────────────────
export const usersService = {
  getMe()            { return api.get('/users/me'); },
  updateMe(payload)  { return api.patch('/users/me', payload); },
  uploadAvatar(file) {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.upload('/users/me/avatar', fd);
  },
  getById(id)        { return api.get(`/users/${id}`); },
  getRecyclerProfile()   { return api.get('/users/me/recycler-profile'); },
  upsertRecyclerProfile(payload) { return api.put('/users/me/recycler-profile', payload); },
  uploadCertificate(file) {
    const fd = new FormData();
    fd.append('certificate', file);
    return api.upload('/users/me/recycler-profile/certificate', fd);
  },
};

// ── Recyclers ─────────────────────────────────────────────────────
export const recyclersService = {
  getAll(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/recyclers${q ? `?${q}` : ''}`);
  },
  getById(id)        { return api.get(`/recyclers/${id}`); },
  requestMatch(listingId, message) {
    return api.post(`/recyclers/listings/${listingId}/request-match`, { message });
  },
  getIncomingMatches(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/recyclers/matches/incoming${q ? `?${q}` : ''}`);
  },
  getOutgoingMatches(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/recyclers/matches/outgoing${q ? `?${q}` : ''}`);
  },
  respondToMatch(matchId, payload) {
    return api.patch(`/recyclers/matches/${matchId}/respond`, payload);
  },
};

// ── Admin ─────────────────────────────────────────────────────────
export const adminService = {
  getStats()   { return api.get('/admin/stats'); },

  getUsers(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/users${q ? `?${q}` : ''}`);
  },
  getUserById(id)      { return api.get(`/admin/users/${id}`); },
  updateUser(id, data) { return api.patch(`/admin/users/${id}`, data); },
  deleteUser(id)       { return api.delete(`/admin/users/${id}`); },

  getListings(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/listings${q ? `?${q}` : ''}`);
  },
  verifyListing(id, payload) { return api.patch(`/admin/listings/${id}/verify`, payload); },
  deleteListing(id)           { return api.delete(`/admin/listings/${id}`); },

  getTransactions(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/transactions${q ? `?${q}` : ''}`);
  },

  getAuditLogs(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/audit-logs${q ? `?${q}` : ''}`);
  },

  broadcastNotification(payload) {
    return api.post('/admin/notify-all', payload);
  },
};

// ── Map Locations ────────────────────────────────────────────────
export const locationService = {
  saveRecyclerLocation(payload) {
    return api.saveRecyclerLocation(payload);
  },

  getMyMapLocation() {
    return api.getMyMapLocation();
  },
};
