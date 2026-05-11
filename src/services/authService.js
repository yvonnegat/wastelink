import api, { tokenStore } from './apiClient';

export const authService = {
  async login({ email, password }) {
    const data = await api.post('/auth/login', { email, password });
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async register({ email, password, full_name, phone, role, location }) {
    const data = await api.post('/auth/register', {
      email, password, full_name, phone, role, location,
    });
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async logout() {
    try { await api.post('/auth/logout', {}); } catch { /* ignore */ }
    tokenStore.clearTokens();
  },

  async me() {
    return api.get('/auth/me');
  },

  async changePassword({ current_password, new_password }) {
    return api.post('/auth/change-password', { current_password, new_password });
  },

  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },
};
