import api from './apiClient';

export const listingsService = {
  // Public feed
  getFeed(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/listings${q ? `?${q}` : ''}`);
  },

  // Seller's own listings
  getMyListings(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api.get(`/listings/my${q ? `?${q}` : ''}`);
  },

  getById(id) {
    return api.get(`/listings/${id}`);
  },

  create(payload) {
    return api.post('/listings', payload);
  },

  update(id, payload) {
    return api.patch(`/listings/${id}`, payload);
  },

  delete(id) {
    return api.delete(`/listings/${id}`);
  },

  uploadImages(listingId, files) {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return api.upload(`/listings/${listingId}/images`, formData);
  },

  deleteImage(listingId, imageId) {
    return api.delete(`/listings/${listingId}/images/${imageId}`);
  },

  submit(id) {
    return api.post(`/listings/${id}/submit`, {});
  },

  acceptPrice(id, payload) {
    return api.post(`/listings/${id}/accept-price`, payload);
  },
};
