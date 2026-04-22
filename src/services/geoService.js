/**
 * geoService.js
 * Handles geospatial queries: finding recyclers, calculating distance,
 * routing, and LBS-based matching.
 */

const BASE_URL = process.env.REACT_APP_GEO_API_URL || '';

/**
 * Find recyclers near a given location.
 * @param {Object} params
 * @param {number}   params.lat
 * @param {number}   params.lng
 * @param {number}   params.radiusKm  - search radius
 * @param {string[]} params.wasteTypes - filter by accepted waste types
 * @returns {Promise<Recycler[]>}
 */
export async function getNearbyRecyclers({ lat, lng, radiusKm = 10, wasteTypes = [] }) {
  if (!BASE_URL) {
    const { RECYCLERS } = await import('../data/mockData');
    return filterRecyclers(RECYCLERS, wasteTypes);
  }

  const params = new URLSearchParams({
    lat, lng,
    radius: radiusKm,
    ...(wasteTypes.length && { types: wasteTypes.join(',') }),
  });

  const response = await fetch(`${BASE_URL}/recyclers?${params}`);
  if (!response.ok) throw new Error(`Geo API error: ${response.status}`);
  return response.json();
}

/**
 * Get browser geolocation (prompts user permission).
 * @returns {Promise<{ lat: number, lng: number }>}
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000 }
    );
  });
}

/**
 * Calculate haversine distance between two coordinates.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in km
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Connect a seller to a specific recycler.
 * @param {Object} params
 * @param {number} params.recyclerId
 * @param {string} params.sellerId
 * @param {string} params.listingId
 * @returns {Promise<Connection>}
 */
export async function connectToRecycler({ recyclerId, sellerId, listingId }) {
  if (!BASE_URL) {
    return { success: true, connectionId: `CON-${Date.now()}`, message: 'Recycler notified.' };
  }

  const response = await fetch(`${BASE_URL}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recyclerId, sellerId, listingId }),
  });

  if (!response.ok) throw new Error(`Connection API error: ${response.status}`);
  return response.json();
}

// ── HELPERS ────────────────────────────────────────────────────────
function toRad(deg) { return deg * (Math.PI / 180); }

function filterRecyclers(recyclers, wasteTypes) {
  if (!wasteTypes.length) return recyclers;
  return recyclers.filter((r) =>
    r.types.includes('All Types') ||
    wasteTypes.some((t) => r.types.includes(t))
  );
}

/**
 * Return a colour hex for a recycler's primary waste type — used for map markers.
 * @param {string[]} types
 * @returns {string}
 */
export function markerColorForTypes(types) {
  if (types.includes('Metal'))   return '#C07030';
  if (types.includes('Plastic')) return '#4A8AC4';
  if (types.includes('Organic')) return '#5A9A3A';
  if (types.includes('Glass'))   return '#8A4A9A';
  if (types.includes('E-Waste')) return '#C04040';
  return '#6B7C45';
}
