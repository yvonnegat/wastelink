// ── RECYCLING CENTRES ──────────────────────────────────────────────
export const RECYCLERS = [
  {
    id: 1, name: "EcoGreen Recyclers", lat: -1.2921, lng: 36.8219,
    types: ["Plastic", "Paper", "Metal"], verified: true, rating: 4.8,
    distance: "1.2 km", phone: "+254 700 123456", area: "Westlands, Nairobi",
  },
  {
    id: 2, name: "CleanEarth Kenya", lat: -1.3009, lng: 36.8290,
    types: ["Glass", "Plastic", "E-Waste"], verified: true, rating: 4.6,
    distance: "2.1 km", phone: "+254 722 456789", area: "Karen, Nairobi",
  },
  {
    id: 3, name: "GreenCycle Africa", lat: -1.2763, lng: 36.7978,
    types: ["Metal", "Organic", "Paper"], verified: true, rating: 4.5,
    distance: "3.4 km", phone: "+254 733 789012", area: "Parklands, Nairobi",
  },
  {
    id: 4, name: "Taka Taka Solutions", lat: -1.3142, lng: 36.8350,
    types: ["Organic", "Plastic"], verified: false, rating: 4.2,
    distance: "4.0 km", phone: "+254 711 234567", area: "Langata, Nairobi",
  },
  {
    id: 5, name: "Nairobi Waste Mgmt", lat: -1.2680, lng: 36.8150,
    types: ["All Types"], verified: true, rating: 4.9,
    distance: "0.8 km", phone: "+254 700 999888", area: "CBD, Nairobi",
  },
  {
    id: 6, name: "Recycleon Ltd", lat: -1.3220, lng: 36.8100,
    types: ["Metal", "E-Waste", "Glass"], verified: true, rating: 4.4,
    distance: "5.2 km", phone: "+254 723 445566", area: "Industrial Area, Nairobi",
  },
  {
    id: 7, name: "PET Collect Kenya", lat: -1.2850, lng: 36.7850,
    types: ["Plastic", "Paper"], verified: true, rating: 4.7,
    distance: "6.1 km", phone: "+254 720 112233", area: "Kikuyu, Kiambu",
  },
  {
    id: 8, name: "Mombasa Recycle Co.", lat: -4.0435, lng: 39.6682,
    types: ["Plastic", "Metal", "Paper"], verified: true, rating: 4.5,
    distance: "—", phone: "+254 742 778899", area: "Mombasa CBD",
  },
  {
    id: 9, name: "Kisumu Green Hub", lat: -0.0917, lng: 34.7679,
    types: ["Organic", "Paper", "Glass"], verified: true, rating: 4.3,
    distance: "—", phone: "+254 719 334455", area: "Kisumu Town",
  },
  {
    id: 10, name: "Western Recyclers", lat: 0.5167, lng: 35.2833,
    types: ["Metal", "Plastic"], verified: false, rating: 4.0,
    distance: "—", phone: "+254 715 556677", area: "Eldoret",
  },
];

// ── WASTE TYPES ────────────────────────────────────────────────────
export const WASTE_TYPES = {
  Plastic: ["PET Bottles", "HDPE", "PVC", "LDPE", "PP", "PS"],
  Paper:   ["Cardboard", "Newspaper", "Office Paper", "Magazines"],
  Metal:   ["Aluminium Cans", "Iron Scrap", "Copper Wire", "Steel"],
  Glass:   ["Clear Glass", "Brown Glass", "Green Glass"],
  Organic: ["Food Waste", "Garden Waste", "Wood"],
  "E-Waste": ["Phones", "Computers", "Batteries", "Cables"],
};

// ── BASE PRICES (KES per kg) ───────────────────────────────────────
export const BASE_PRICES = {
  Plastic:   50,
  Paper:     20,
  Metal:    160,
  Glass:     50,
  Organic:    8,
  "E-Waste": 700,
};

// ── MOCK TRANSACTIONS ──────────────────────────────────────────────
export const MOCK_TRANSACTIONS = [
  { id: "TX001", type: "Plastic Bottles", qty: "50 kg",  price: "KES 2,500", status: "completed", date: "2025-04-18", recycler: "EcoGreen Recyclers" },
  { id: "TX002", type: "Cardboard",       qty: "80 kg",  price: "KES 1,600", status: "completed", date: "2025-04-15", recycler: "GreenCycle Africa" },
  { id: "TX003", type: "Metal Scrap",     qty: "30 kg",  price: "KES 4,800", status: "pending",   date: "2025-04-20", recycler: "Recycleon Ltd" },
  { id: "TX004", type: "Glass Bottles",   qty: "25 kg",  price: "KES 1,250", status: "pending",   date: "2025-04-22", recycler: "CleanEarth Kenya" },
  { id: "TX005", type: "E-Waste",         qty: "5 kg",   price: "KES 3,500", status: "completed", date: "2025-04-10", recycler: "Nairobi Waste Mgmt" },
];

// ── MAP DEFAULTS ───────────────────────────────────────────────────
export const MAP_DEFAULTS = {
  center: [-1.2921, 36.8219],
  zoom: 12,
  tileUrl: process.env.REACT_APP_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
};

// ── FILTER OPTIONS ─────────────────────────────────────────────────
export const WASTE_FILTERS = ["All Types", "Plastic", "Paper", "Metal", "Glass", "Organic", "E-Waste"];
