/**
 * pricingService.js
 * Connects to WasteLink FastAPI v2  →  /predict/range
 */
import { BASE_PRICES } from '../data/mockData';

const BASE_URL = process.env.REACT_APP_PRICING_API_URL || '';

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------

const WASTE_TYPE_MAP = {
  Plastic:   'plastic',
  Metal:     'metal',
  Paper:     'paper',
  Glass:     'glass',
  'E-Waste': 'e_waste',
  Organic:   'organic',
  Rubber:    'rubber',
  Textile:   'textile',
};

// Maps display subtype labels → API sub_type strings
const SUBTYPE_MAP = {
  // Plastic
  'PET Bottles':   'PET',
  'HDPE':          'HDPE',
  'PVC':           'PVC',
  'LDPE':          'LDPE',
  'PP':            'PP',
  'PS':            'PS',
  // Paper
  'Cardboard':     'cardboard',
  'Newspaper':     'newspaper',
  'Office Paper':  'office_paper',
  'Magazines':     'magazines',
  // Metal
  'Aluminium Cans':'aluminium',
  'Iron Scrap':    'iron',
  'Copper Wire':   'copper',
  'Steel':         'steel',
  // Glass
  'Clear Glass':   'clear_glass',
  'Brown Glass':   'brown_glass',
  'Green Glass':   'green_glass',
  // Organic
  'Food Waste':    'food_waste',
  'Garden Waste':  'garden_waste',
  'Wood':          'wood',
  // E-Waste
  'Phones':        'phones',
  'Computers':     'computers',
  'Batteries':     'batteries',
  'Cables':        'cables',
};

const DEFAULT_SUB_TYPE = {
  plastic:  'PET',
  metal:    'steel',
  paper:    'cardboard',
  glass:    'clear_glass',
  e_waste:  'mixed_electronics',
  organic:  'food_waste',
  rubber:   'tyres',
  textile:  'mixed_clothing',
};

// ---------------------------------------------------------------------------
// Response shaping — maps FastAPI v2 response → frontend shape
// ---------------------------------------------------------------------------

function toFrontendShape(apiResp, quantity) {
  const pr = apiResp.price_range;        // lower_bound, recommended, upper_bound
  const tp = apiResp.total_payout_range; // lower, recommended, upper
  const mi = apiResp.market_info;

  return {
    baseRate:    pr.recommended,
    baseTotal:   Math.round(pr.recommended * quantity),
    adjustments: { quality: 0, volume: 0 },
    finalPrice:  Math.round(tp.recommended),
    currency:    pr.currency,
    confidence:  Math.max(0, 1 - (mi.range_width / pr.recommended) / 2),

    priceRange: {
      lower:       pr.lower_bound,
      recommended: pr.recommended,
      upper:       pr.upper_bound,
    },
    payoutRange: {
      lower: Math.round(tp.lower),
      upper: Math.round(tp.upper),
    },
    marketInfo: {
      tier:   mi.market_tier,
      signal: mi.market_signal,
      advice: mi.advice,
    },
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a dynamic price estimate from the ML pricing model.
 *
 * @param {Object} params
 * @param {string} params.wasteType  - e.g. "Plastic"
 * @param {string} [params.subtype]  - display label e.g. "PET Bottles" (optional)
 * @param {number} params.quantity   - weight in kg
 * @param {string} params.condition  - 'clean' | 'mixed' | 'contaminated'
 * @param {string} [params.county]   - defaults to 'Nairobi'
 * @returns {Promise<PricingResult>}
 */
export async function getPrice({ wasteType, subtype, quantity, condition, county = 'Nairobi' }) {
  const apiWasteType = WASTE_TYPE_MAP[wasteType] ?? wasteType.toLowerCase();

  // Map display label → API value, fall back to type default
  const apiSubType = (subtype && SUBTYPE_MAP[subtype])
    ? SUBTYPE_MAP[subtype]
    : DEFAULT_SUB_TYPE[apiWasteType] ?? 'mixed';

  const apiCondition = ['clean', 'mixed', 'contaminated'].includes(condition)
    ? condition
    : 'mixed';

  console.log('🔵 BASE_URL:', BASE_URL);

  if (!BASE_URL) {
    return mockPricing({ wasteType, quantity, condition: apiCondition });
  }

  console.log('🚀 Hitting API:', `${BASE_URL}/predict/range`, {
    waste_type: apiWasteType,
    sub_type:   apiSubType,
    weight_kg:  quantity,
    condition:  apiCondition,
  });

  const response = await fetch(`${BASE_URL}/predict/range`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      waste_type:       apiWasteType,
      sub_type:         apiSubType,
      weight_kg:        quantity,
      condition:        apiCondition,
      county,
      collection_point: 'commercial',
    }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Pricing API error: ${response.status}`);
  }

  const data = await response.json();
  return toFrontendShape(data, quantity);
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

// ---------------------------------------------------------------------------
// Mock implementations (used when REACT_APP_PRICING_API_URL is not set)
// ---------------------------------------------------------------------------

function mockPricing({ wasteType, quantity, condition }) {
  const conditionMultiplier = { clean: 1.1, mixed: 1.0, contaminated: 0.85 }[condition] ?? 1.0;
  const baseRate  = BASE_PRICES[wasteType] || 50;
  const baseTotal = Math.round(baseRate * quantity * conditionMultiplier);
  const spread    = Math.round(baseTotal * 0.15);

  const tier =
    quantity >= 100 && condition === 'clean' ? 'formal'
    : quantity >= 20 || condition === 'mixed' ? 'semi_formal'
    : 'informal';

  const signal =
    condition === 'contaminated' ? 'volatile'
    : quantity >= 100            ? 'stable'
    : 'moderate';

  return Promise.resolve({
    baseRate,
    baseTotal,
    adjustments: { quality: 0, volume: 0 },
    finalPrice:  baseTotal,
    currency:    'KES',
    confidence:  condition === 'clean' ? 0.92 : 0.80,
    priceRange: {
      lower:       parseFloat((baseRate * 0.85).toFixed(2)),
      recommended: baseRate,
      upper:       parseFloat((baseRate * 1.15).toFixed(2)),
    },
    payoutRange: {
      lower: baseTotal - spread,
      upper: baseTotal + spread,
    },
    marketInfo: {
      tier,
      signal,
      advice: `Negotiate between KES ${baseTotal - spread}–${baseTotal + spread}. Fair market rate is KES ${baseTotal}.`,
    },
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

function mockMarketRates() {
  return Promise.resolve(
    Object.entries(BASE_PRICES).map(([type, rate]) => ({
      wasteType:   type,
      ratePerKg:   rate,
      currency:    'KES',
      trend:       Math.random() > 0.5 ? 'up' : 'stable',
      lastUpdated: new Date().toISOString(),
    }))
  );
}

// ---------------------------------------------------------------------------
// Types (JSDoc)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} PricingResult
 * @property {number} baseRate
 * @property {number} baseTotal
 * @property {{ quality: number, volume: number }} adjustments
 * @property {number} finalPrice
 * @property {string} currency
 * @property {number} confidence
 * @property {{ lower: number, recommended: number, upper: number }} priceRange
 * @property {{ lower: number, upper: number }} payoutRange
 * @property {{ tier: string, signal: string, advice: string }} marketInfo
 * @property {string} validUntil
 */