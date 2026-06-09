// services/ListingService.js
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
    console.log('📦 Creating listing via API client:', payload);
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
    console.log('💰 Accepting price via API client:', payload);
    return api.post(`/listings/${id}/accept-price`, payload);
  },

  autoApprove(id, visionData) {
  return api.post(`/listings/${id}/approve`, {
    vision_confidence:  visionData.confidence,
    vision_quality:     visionData.qualityScore,
    vision_consistency: visionData.consistencyScore,
    vision_verdict:     visionData.verdict,
    vision_notes:       visionData.notes,
  });
},

requestMoreImages(id, visionData) {
  return api.post(`/listings/${id}/request-more`, {
    vision_confidence:  visionData.confidence,
    vision_quality:     visionData.qualityScore,
    vision_consistency: visionData.consistencyScore,
    vision_verdict:     visionData.verdict,
    vision_notes:       visionData.notes,
  });
},


};