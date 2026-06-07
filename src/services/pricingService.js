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

const SUBTYPE_MAP = {
  'PET Bottles':   'PET',
  'HDPE':          'HDPE',
  'PVC':           'PVC',
  'LDPE':          'LDPE',
  'PP':            'PP',
  'PS':            'PS',
  'Cardboard':     'cardboard',
  'Newspaper':     'newspaper',
  'Office Paper':  'office_paper',
  'Magazines':     'magazines',
  'Aluminium Cans':'aluminium',
  'Iron Scrap':    'iron',
  'Copper Wire':   'copper',
  'Steel':         'steel',
  'Clear Glass':   'clear_glass',
  'Brown Glass':   'brown_glass',
  'Green Glass':   'green_glass',
  'Food Waste':    'food_waste',
  'Garden Waste':  'garden_waste',
  'Wood':          'wood',
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

// pricingService.js - UPDATED toFrontendShape function

function toFrontendShape(apiResp, quantity) {
  const pr = apiResp.price_range;
  const tp = apiResp.total_payout_range;
  const mi = apiResp.market_info;

  // NO ROUNDING - preserve exact values from API
  const exactPerKg = pr.recommended;
  const exactTotal = tp.recommended;

  console.log('📊 API Exact values:', {
    perKg: exactPerKg,
    total: exactTotal
  });

  return {
    // Store exact values - no Math.round() anywhere
    baseRate: exactPerKg,
    baseTotal: exactTotal,
    adjustments: { quality: 0, volume: 0 },
    finalPrice: exactTotal,
    currency: pr.currency,
    confidence: Math.max(0, 1 - (mi.range_width / exactPerKg) / 2),

    // Keep exact values for ranges too
    priceRange: {
      lower: pr.lower_bound,
      recommended: exactPerKg,
      upper: pr.upper_bound,
    },
    payoutRange: {
      lower: tp.lower,
      upper: tp.upper,
    },
    marketInfo: {
      tier: mi.market_tier,
      signal: mi.market_signal,
      advice: mi.advice,
    },
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getPrice({ wasteType, subtype, quantity, condition, county = 'Nairobi', collectionPoint = 'commercial' }) {
  const apiWasteType = WASTE_TYPE_MAP[wasteType] ?? wasteType.toLowerCase();
  const apiSubType = (subtype && SUBTYPE_MAP[subtype]) ? SUBTYPE_MAP[subtype] : DEFAULT_SUB_TYPE[apiWasteType] ?? 'mixed';
  const apiCondition = ['clean', 'mixed', 'contaminated'].includes(condition) ? condition : 'mixed';

  console.log('🚀 Pricing request:', {
    waste_type: apiWasteType,
    sub_type: apiSubType,
    weight_kg: quantity,
    condition: apiCondition,
    county,
    collection_point: collectionPoint
  });

  if (!BASE_URL) {
    console.log('⚠️ Using mock pricing (BASE_URL not set)');
    return mockPricing({ wasteType, quantity, condition: apiCondition });
  }

  const response = await fetch(`${BASE_URL}/predict/range`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      waste_type: apiWasteType,
      sub_type: apiSubType,
      weight_kg: quantity,
      condition: apiCondition,
      county,
      collection_point: collectionPoint,
    }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Pricing API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('📡 API Response:', data);
  
  return toFrontendShape(data, quantity);
}

export async function getMarketRates() {
  if (!BASE_URL) return mockMarketRates();
  const response = await fetch(`${BASE_URL}/rates`);
  if (!response.ok) throw new Error(`Rates API error: ${response.status}`);
  return response.json();
}

// ---------------------------------------------------------------------------
// Mock implementations
// ---------------------------------------------------------------------------

function mockPricing({ wasteType, quantity, condition }) {
  const conditionMultiplier = { clean: 1.1, mixed: 1.0, contaminated: 0.85 }[condition] ?? 1.0;
  const baseRate = BASE_PRICES[wasteType] || 50;
  const baseTotal = baseRate * quantity * conditionMultiplier;

  const tier = quantity >= 100 && condition === 'clean' ? 'formal'
    : quantity >= 20 || condition === 'mixed' ? 'semi_formal'
    : 'informal';

  const signal = condition === 'contaminated' ? 'volatile'
    : quantity >= 100 ? 'stable'
    : 'moderate';

  return Promise.resolve({
    baseRate,
    baseTotal,
    adjustments: { quality: 0, volume: 0 },
    finalPrice: baseTotal,
    currency: 'KES',
    confidence: condition === 'clean' ? 0.92 : 0.80,
    priceRange: {
      lower: parseFloat((baseRate * 0.85).toFixed(2)),
      recommended: baseRate,
      upper: parseFloat((baseRate * 1.15).toFixed(2)),
    },
    payoutRange: {
      lower: baseTotal * 0.85,
      upper: baseTotal * 1.15,
    },
    marketInfo: {
      tier,
      signal,
      advice: `Negotiate between KES ${Math.round(baseTotal * 0.85)}–${Math.round(baseTotal * 1.15)}. Fair market rate is KES ${Math.round(baseTotal)}.`,
    },
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