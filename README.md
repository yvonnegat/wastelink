# 🌿 WasteLink — Kenya's Recycling Marketplace

A production-ready React frontend for a waste recycling marketplace connecting waste sellers with nearby recyclers across Kenya.

---

## 📁 Project Structure

```
wastelink/
├── public/
│   └── index.html              # Root HTML (loads Leaflet CDN)
├── src/
│   ├── App.jsx                 # Root component & routing
│   ├── index.js                # React entry point
│   │
│   ├── styles/
│   │   └── global.css          # Design system (pastel olive green tokens)
│   │
│   ├── data/
│   │   └── mockData.js         # Mock recyclers, prices, transactions
│   │
│   ├── services/               # API service layer
│   │   ├── supabaseClient.js   # Supabase initialisation
│   │   ├── pricingService.js   # ML pricing API calls
│   │   ├── visionService.js    # Computer vision API calls
│   │   └── geoService.js       # Geospatial / LBS API calls
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js          # Supabase auth + session
│   │   ├── usePricing.js       # Pricing state & API
│   │   ├── useVision.js        # Vision analysis state
│   │   └── useGeolocation.js   # Location + recycler matching
│   │
│   └── components/
│       ├── common/
│       │   ├── Icon.jsx        # SVG icon component
│       │   ├── index.jsx       # Button, Badge, Toast, Alert, Card…
│       │   ├── Sidebar.jsx     # Navigation sidebar
│       │   └── Topbar.jsx      # Top bar with role switcher
│       │
│       ├── auth/
│       │   └── AuthPage.jsx    # Login / Signup
│       ├── dashboard/
│       │   └── Dashboard.jsx   # Overview & quick actions
│       ├── listing/
│       │   └── WasteListing.jsx # 3-step waste listing wizard
│       ├── vision/
│       │   └── VisionModule.jsx # AI image verification UI
│       ├── pricing/
│       │   └── PricingModule.jsx # Dynamic ML pricing
│       ├── map/
│       │   └── MapModule.jsx    # Leaflet map + recycler matching
│       └── transactions/
│           └── Transactions.jsx # Transaction history table
│
├── .env.example                # Environment variable template
└── package.json
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your real API keys:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_PRICING_API_URL=https://your-pricing-api.com/api/v1
REACT_APP_VISION_API_URL=https://your-vision-api.com/api/v1
REACT_APP_GEO_API_URL=https://your-geo-api.com/api/v1
```

> **Without env vars:** The app runs in mock mode — all API calls return realistic fake data. No setup required to demo.

### 3. Start development server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). Login with any email/password — mock auth accepts anything.

---

## 🔌 Connecting Real APIs

### Supabase (Auth + Database)

1. Create a project at [supabase.com](https://supabase.com)
2. Add URL and anon key to `.env`
3. The `useAuth` hook will automatically use real Supabase sessions

### ML Pricing API

Edit `src/services/pricingService.js`:
- `getPrice()` — POST `/price` with `{ wasteType, subtype, quantity, quality }`
- `getMarketRates()` — GET `/rates`

Remove the `if (!BASE_URL)` mock fallback once your endpoint is live.

### Computer Vision API

Edit `src/services/visionService.js`:
- `analyseImage(file)` — POST `/analyse` with `multipart/form-data`
- Expected response: `{ detectedType, confidence, qualityScore, consistencyScore, verdict, notes }`

### Geospatial API

Edit `src/services/geoService.js`:
- `getNearbyRecyclers({ lat, lng, radiusKm, wasteTypes })` — GET `/recyclers?lat=&lng=&radius=&types=`
- `connectToRecycler({ recyclerId, sellerId, listingId })` — POST `/connect`

---

## 🎨 Design System

All design tokens are in `src/styles/global.css` as CSS variables:

| Token | Value | Usage |
|---|---|---|
| `--olive` | `#6B7C45` | Primary brand colour |
| `--olive-deep` | `#4A5830` | Sidebar, headings |
| `--olive-pale` | `#B5C48A` | Accents, highlights |
| `--olive-bg` | `#EEF2E0` | Backgrounds, cards |
| `--cream` | `#F7F5EE` | Page background |

---

## 🧩 Key Features

| Module | Description |
|---|---|
| **Auth** | Supabase login/signup with Seller / Recycler role selection |
| **Dashboard** | Stats, quick actions, recent activity feed |
| **Waste Listing** | 3-step wizard: type → image upload → verification |
| **AI Verification** | Image upload → confidence score → quality score |
| **Dynamic Pricing** | Live sliders → ML price breakdown with adjustments |
| **Recycler Map** | Leaflet map, 10 Kenya centres, waste-type filters, LBS |
| **Transactions** | Full history table with status filters |

---

## 📦 Production Build

```bash
npm run build
```

Output in `build/` — deploy to Vercel, Netlify, or any static host.

---

## 🛠 Tech Stack

- **React 18** — functional components + hooks
- **Leaflet.js** — interactive map (no Google Maps billing)
- **Supabase** — auth + PostgreSQL database
- **CSS Custom Properties** — zero external CSS framework
- **React Router** — (optional, currently state-based routing)
