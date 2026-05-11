// ── WASTE TYPES ────────────────────────────────────────────────────
export const WASTE_TYPES = {
  Plastic: [
    "PET Bottles",
    "HDPE",
    "PVC",
    "LDPE",
    "PP",
    "PS",
  ],

  Paper: [
    "Cardboard",
    "Newspaper",
    "Office Paper",
    "Magazines",
  ],

  Metal: [
    "Aluminium Cans",
    "Iron Scrap",
    "Copper Wire",
    "Steel",
  ],

  Glass: [
    "Clear Glass",
    "Brown Glass",
    "Green Glass",
  ],

  Organic: [
    "Food Waste",
    "Garden Waste",
    "Wood",
  ],

  "E-Waste": [
    "Phones",
    "Computers",
    "Batteries",
    "Cables",
  ],
};

// ── BASE PRICES ────────────────────────────────────────────────────
export const BASE_PRICES = {
  Plastic: 50,
  Paper: 20,
  Metal: 160,
  Glass: 50,
  Organic: 8,
  "E-Waste": 700,
};

// ── MAP DEFAULTS ───────────────────────────────────────────────────
export const MAP_DEFAULTS = {
  center: [-1.2921, 36.8219],
  zoom: 12,
  tileUrl:
    process.env.REACT_APP_MAP_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
};

// ── FILTER OPTIONS ─────────────────────────────────────────────────
export const WASTE_FILTERS = [
  "All Types",
  "Plastic",
  "Paper",
  "Metal",
  "Glass",
  "Organic",
  "E-Waste",
];

export const RECYCLERS = [
  {
    id: 1,
    name: "Green Cycle Ltd",
    type: "Recycler",
    location: "Nairobi",
    lat: -1.2921,
    lng: 36.8219,
  },
  {
    id: 2,
    name: "Eco Waste Solutions",
    type: "Recycler",
    location: "Kiambu",
    lat: -1.1700,
    lng: 36.8350,
  },
  {
    id: 3,
    name: "Recycle Hub Kenya",
    type: "Recycler",
    location: "Ruiru",
    lat: -1.1480,
    lng: 36.9630,
  },
];