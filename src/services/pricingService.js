/**
 * pricingService.js
 * Handles all calls to the ML pricing API.
 * Replace BASE_URL with your real endpoint.
 */
import { BASE_PRICES } from '../data/mockData';

const BASE_URL = process.env.REACT_APP_PRICING_API_URL || '';

/**
 * Get a dynamic price estimate from the ML pricing model.
 * @param {Object} params
 * @param {string} params.wasteType  - e.g. "Plastic"
 * @param {string} params.subtype    - e.g. "PET Bottles"
 * @param {number} params.quantity   - kg
 * @param {number} params.quality    - 0–100 score from vision module
 * @returns {Promise<PricingResult>}
 */
export async function getPrice({ wasteType, subtype, quantity, quality }) {
  if (!BASE_URL) {
    // ── MOCK FALLBACK ─────────────────────────────────────────────
    return mockPricing({ wasteType, quantity, quality });
  }

  const response = await fetch(`${BASE_URL}/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wasteType, subtype, quantity, quality }),
  });

  if (!response.ok) {
    throw new Error(`Pricing API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get current market rates for all waste types.
 * @returns {Promise<MarketRates>}
 */
export async function getMarketRates() {
  if (!BASE_URL) return mockMarketRates();

  const response = await fetch(`${BASE_URL}/rates`);
  if (!response.ok) throw new Error(`Rates API error: ${response.status}`);
  return response.json();
}

// ── MOCK IMPLEMENTATIONS ────────────────────────────────────────────

function mockPricing({ wasteType, quantity, quality }) {
  const baseRate  = BASE_PRICES[wasteType] || 50;
  const baseTotal = baseRate * quantity;
  const qualityAdj = Math.round(baseTotal * ((quality - 70) / 100) * 0.5);
  const volumeAdj  = quantity >= 100
    ? Math.round(baseTotal * 0.05)
    : quantity < 10
      ? Math.round(-baseTotal * 0.1)
      : 0;
  const finalPrice = baseTotal + qualityAdj + volumeAdj;

  return Promise.resolve({
    baseRate,
    baseTotal,
    adjustments: {
      quality: qualityAdj,
      volume:  volumeAdj,
    },
    finalPrice,
    currency: 'KES',
    confidence: 0.92,
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

function mockMarketRates() {
  return Promise.resolve(
    Object.entries(BASE_PRICES).map(([type, rate]) => ({
      wasteType: type,
      ratePerKg: rate,
      currency: 'KES',
      trend: Math.random() > 0.5 ? 'up' : 'stable',
      lastUpdated: new Date().toISOString(),
    }))
  );
}

/**
 * @typedef {Object} PricingResult
 * @property {number} baseRate
 * @property {number} baseTotal
 * @property {{ quality: number, volume: number }} adjustments
 * @property {number} finalPrice
 * @property {string} currency
 * @property {number} confidence
 * @property {string} validUntil
 */
