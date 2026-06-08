import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { WASTE_TYPES } from '../../data/mockData';
import { Button, StepIndicator, Alert } from '../common';
import Icon from '../common/Icon';
import { listingsService } from '../../services/ListingService';
import { useVision } from '../../hooks/useVision';
import { getPrice } from '../../services/pricingService';
import {
  Recycle, Newspaper, Cog, Wine, Sprout, MonitorSmartphone, Scissors, Disc3
} from 'lucide-react';



const STEPS = ['Details', 'Price', 'Verify', 'Done'];

const CONDITIONS = [
  { label: 'Clean / Sorted', value: 'clean' },
  { label: 'Mixed / Unsorted', value: 'mixed' },
  { label: 'Contaminated', value: 'contaminated' },
  { label: 'Baled / Compressed', value: 'baled' },
];

const COLLECTION_POINTS = [
  { value: 'commercial', label: 'Commercial', desc: 'Business waste, regular pickup' },
  { value: 'industrial', label: 'Industrial', desc: 'Factory/manufacturing waste, bulk volume' },
  { value: 'household', label: 'Household', desc: 'Residential, small quantities' },
];

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Kiambu', 'Nakuru', 'Eldoret',
  'Machakos', 'Kajiado', 'Tharaka Nithi', 'Meru', 'Nyeri', 'Kirinyaga'
];

const SUBTYPE_MAP = {
  'PET Bottles': 'PET', 'HDPE': 'HDPE', 'PVC': 'PVC', 'LDPE': 'LDPE',
  'PP': 'PP', 'PS': 'PS', 'Cardboard': 'cardboard', 'Newspaper': 'newspaper',
  'Office Paper': 'office_paper', 'Magazines': 'magazines', 'Aluminium Cans': 'aluminium',
  'Iron Scrap': 'iron', 'Copper Wire': 'copper', 'Steel': 'steel',
  'Clear Glass': 'clear_glass', 'Brown Glass': 'brown_glass', 'Green Glass': 'green_glass',
  'Food Waste': 'food_waste', 'Garden Waste': 'garden_waste', 'Wood': 'wood',
  'Phones': 'phones', 'Computers': 'computers', 'Batteries': 'batteries', 'Cables': 'cables',
};

function buildWasteTypeArray(wasteTypesData) {
  if (Array.isArray(wasteTypesData)) return wasteTypesData;
  if (typeof wasteTypesData === 'object' && wasteTypesData !== null) {
    return Object.entries(wasteTypesData).map(([label, subtypes]) => ({
      label,
      subtypes: Array.isArray(subtypes) ? subtypes : [],
    }));
  }
  return [];
}

// ─── SVG Icon Components ───────────────────────────────────────────────────────
const SvgIcon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.75, viewBox = '0 0 24 24', style = {} }) => (
  <svg
    width={size} height={size} viewBox={viewBox} fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const Icons = {
  // UI icons only — waste type icons use Lucide (imported above)
  MapPin:     () => <SvgIcon size={16} d={["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z","M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"]} />,
  Crosshair:  () => <SvgIcon size={16} d={["M12 2v4","M12 18v4","M2 12h4","M18 12h4","M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"]} />,
  ChevronRight: () => <SvgIcon size={16} d="M9 18l6-6-6-6" />,
  ChevronLeft:  () => <SvgIcon size={16} d="M15 18l-6-6 6-6" />,
  CheckCircle:  () => <SvgIcon size={20} d={["M22 11.08V12a10 10 0 1 1-5.93-9.14","M22 4L12 14.01l-3-3"]} color="#22a855" />,
  XCircle:      () => <SvgIcon size={20} d={["M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0","M15 9l-6 6","M9 9l6 6"]} color="#e05050" />,
  AlertTriangle: () => <SvgIcon size={20} d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"]} color="#f59e0b" />,
  Info:         () => <SvgIcon size={20} d={["M12 22A10 10 0 1 0 12 2a10 10 0 0 0 0 20z","M12 16v-4","M12 8h.01"]} color="#3b82f6" />,
  X:            () => <SvgIcon size={14} d="M18 6L6 18M6 6l12 12" strokeWidth={2.5} />,
  Camera:       () => <SvgIcon size={28} d={["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z","M12 17A4 4 0 1 0 12 9a4 4 0 0 0 0 8z"]} color="#2A6A2A" />,
  Building2:    () => <SvgIcon size={18} d={["M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z","M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2","M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2","M10 6h4","M10 10h4","M10 14h4","M10 18h4"]} />,
  Factory:      () => <SvgIcon size={18} d={["M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16z","M17 18h1","M12 18h1","M7 18h1"]} />,
  Home:         () => <SvgIcon size={18} d={["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"]} />,
  TrendingUp:   () => <SvgIcon size={16} d="M23 6l-9.5 9.5-5-5L1 18" />,
  Loader:       () => <SvgIcon size={16} d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />,
  Sparkles:     () => <SvgIcon size={14} d={["M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z","M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"]} />,
};

const CollectionIcons = { commercial: Icons.Building2, industrial: Icons.Factory, household: Icons.Home };

const WASTE_TILE_CONFIG = {
  Plastic:   { LucideIcon: Recycle,           color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', selectedBg: '#e0f2fe', selectedBorder: '#0ea5e9' },
  Paper:     { LucideIcon: Newspaper,          color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', selectedBg: '#fef3c7', selectedBorder: '#f59e0b' },
  Metal:     { LucideIcon: Cog,                color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', selectedBg: '#f3f4f6', selectedBorder: '#6b7280' },
  Glass:     { LucideIcon: Wine,               color: '#14b8a6', bg: '#f0fdfa', border: '#99f6e4', selectedBg: '#ccfbf1', selectedBorder: '#14b8a6' },
  Organic:   { LucideIcon: Sprout,             color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', selectedBg: '#dcfce7', selectedBorder: '#22c55e' },
  'E-Waste': { LucideIcon: MonitorSmartphone,  color: '#8b5cf6', bg: '#faf5ff', border: '#ddd6fe', selectedBg: '#ede9fe', selectedBorder: '#8b5cf6' },
  Textile:   { LucideIcon: Scissors,           color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', selectedBg: '#fce7f3', selectedBorder: '#ec4899' },
  Rubber:    { LucideIcon: Disc3,              color: '#374151', bg: '#f9fafb', border: '#e5e7eb', selectedBg: '#f3f4f6', selectedBorder: '#374151' },
};

// ─── Toast Notification System ────────────────────────────────────────────────
let toastId = 0;
const toastListeners = [];
const addToast = (toast) => { toastListeners.forEach(fn => fn({ id: ++toastId, ...toast })); };

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration || 4000);
    };
    toastListeners.push(handler);
    return () => { const i = toastListeners.indexOf(handler); if (i > -1) toastListeners.splice(i, 1); };
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const typeStyles = {
    success: { bg: '#f0fdf4', border: '#86efac', icon: <Icons.CheckCircle />, titleColor: '#15803d' },
    error:   { bg: '#fef2f2', border: '#fca5a5', icon: <Icons.XCircle />,     titleColor: '#b91c1c' },
    warning: { bg: '#fffbeb', border: '#fcd34d', icon: <Icons.AlertTriangle />, titleColor: '#92400e' },
    info:    { bg: '#eff6ff', border: '#93c5fd', icon: <Icons.Info />,         titleColor: '#1e40af' },
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
      display: 'flex', flexDirection: 'column', gap: 10,
      maxWidth: 360, width: 'calc(100vw - 48px)',
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => {
        const s = typeStyles[toast.type] || typeStyles.info;
        return (
          <div key={toast.id} style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            pointerEvents: 'all',
            animation: 'toastIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div style={{ fontWeight: 600, fontSize: 13.5, color: s.titleColor, marginBottom: toast.message ? 3 : 0 }}>
                  {toast.title}
                </div>
              )}
              {toast.message && (
                <div style={{ fontSize: 13, color: '#444', lineHeight: 1.4 }}>{toast.message}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#888', flexShrink: 0, marginTop: 1 }}
            >
              <Icons.X />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Inline Field Error ───────────────────────────────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      color: '#b91c1c', fontSize: 12, marginTop: 5, fontWeight: 500,
      animation: 'fadeIn 0.15s ease',
    }}>
      <SvgIcon size={12} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" color="#b91c1c" strokeWidth={2} />
      {message}
      <style>{`@keyframes fadeIn { from { opacity:0; transform: translateY(-4px);} to { opacity:1; transform:translateY(0);} }`}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WasteListing({ onNavigate }) {
  const wasteTypeArray = useMemo(() => buildWasteTypeArray(WASTE_TYPES), []);

  const [step, setStep] = useState(1);
  const [wasteType, setWasteType] = useState('');
  const [subtype, setSubtype] = useState('');
  const [qty, setQty] = useState('');
  const [condition, setCondition] = useState('clean');
  const [collectionPoint, setCollectionPoint] = useState('commercial');
  const [county, setCounty] = useState('Nairobi');
  const [notes, setNotes] = useState('');

  const [location, setLocation] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [aiPricing, setAiPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [selectedPricePerKg, setSelectedPricePerKg] = useState(null);
  const [priceSource, setPriceSource] = useState('ai');
  const [manualPricePerKg, setManualPricePerKg] = useState('');

  const [createdListing, setCreatedListing] = useState(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const selectedType = wasteTypeArray.find(w => w.label === wasteType);
  const quantityNum = parseFloat(qty) || 0;

  const GEOAPIFY_KEY = process.env?.REACT_APP_GEOAPIFY_KEY;
  const fileRef = useRef();

  // ── Validation helpers ────────────────────────────────────────────────
  const setFieldError = (field, msg) =>
    setFieldErrors(prev => msg ? { ...prev, [field]: msg } : (() => { const e = { ...prev }; delete e[field]; return e; })());

  const clearFieldError = (field) => setFieldErrors(prev => { const e = { ...prev }; delete e[field]; return e; });

  // Live validation on blur / change
  const validateQty = (val) => {
    const n = parseFloat(val);
    if (!val) return 'Quantity is required';
    if (isNaN(n) || n <= 0) return 'Enter a valid quantity greater than 0';
    return null;
  };

  const validateLocation = (loc) => {
    if (!loc && !lat) return 'Pickup location is required';
    return null;
  };

  // ── Suggestions ───────────────────────────────────────────────────────
  const fetchSuggestions = async (text) => {
    if (!text || text.length < 3) { setSuggestions([]); return; }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&limit=5&apiKey=${GEOAPIFY_KEY}`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.error('Geoapify autocomplete error:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(location), 400);
    return () => clearTimeout(timer);
  }, [location]);

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      addToast({ type: 'error', title: 'Not Supported', message: 'Geolocation is not supported by your browser.' });
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude); setLng(longitude);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const addr = data?.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocation(addr);
          clearFieldError('location');
          addToast({ type: 'success', title: 'Location Found', message: 'Your current location has been set.' });
        } catch {
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          addToast({ type: 'info', title: 'Location Set', message: 'Coordinates saved. Address lookup failed.' });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        addToast({ type: 'error', title: 'Location Denied', message: 'Unable to get your location. Please enter it manually.' });
        setIsLocating(false);
      }
    );
  };

  // ── AI Pricing ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAiPrice = async () => {
      if (!wasteType || !qty || quantityNum <= 0) return;
      setPricingLoading(true);
      try {
        const result = await getPrice({ wasteType, subtype, quantity: quantityNum, condition, county, collectionPoint });
        setAiPricing(result);
        const recommended = result.perKgRange?.recommended || result.priceRange?.recommended;
        if (priceSource === 'ai' && !selectedPricePerKg) setSelectedPricePerKg(recommended);
      } catch (err) {
        console.error('AI pricing failed:', err);
        setAiPricing(null);
      } finally {
        setPricingLoading(false);
      }
    };
    
    const timeout = setTimeout(fetchAiPrice, 500);
    return () => clearTimeout(timeout);
  }, [wasteType, subtype, qty, condition, county, collectionPoint]);

  // ── File handling ─────────────────────────────────────────────────────
  function handleFile(newFiles) {
    const valid = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...valid].slice(0, 5));
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target.result].slice(0, 5));
      reader.readAsDataURL(f);
    });
  }

  function handleDrop(e) { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files); }
  function removeFile(i) {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  // ── Step handlers ─────────────────────────────────────────────────────
  async function handleCreateListing() {
    const errors = {};
    if (!wasteType) errors.wasteType = 'Please select a waste type';
    const qtyErr = validateQty(qty);
    if (qtyErr) errors.qty = qtyErr;
    const locErr = validateLocation(location);
    if (locErr) errors.location = locErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast({
        type: 'warning',
        title: 'Missing Information',
        message: `Please fill in the required fields: ${Object.values(errors).join(', ')}`,
        duration: 5000,
      });
      return;
    }

    const mappedSubtype = subtype ? (SUBTYPE_MAP[subtype] || subtype) : 'Mixed';
    setLoading(true);
    try {
      const listingPayload = {
        waste_type: wasteType,
        subtype: mappedSubtype,
        quantity_kg: quantityNum,
        condition,
        collection_point: collectionPoint,
        county,
        location: location || `${county}, Kenya`,
        ...(lat && { lat }),
        ...(lng && { lng }),
      };
      const listing = await listingsService.create(listingPayload);
      setCreatedListing(listing);
      addToast({ type: 'success', title: 'Details Saved', message: 'Waste details saved. Now set your price.' });
      setStep(2);
    } catch (e) {
      console.error('Failed to create listing:', e);
      addToast({ type: 'error', title: 'Failed to Save', message: e.message || 'Could not save your listing. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptPrice() {
    if (!createdListing) {
      addToast({ type: 'error', title: 'Listing Not Found', message: 'Please go back and recreate your listing.' });
      return;
    }
    let finalPricePerKg = priceSource === 'ai' ? selectedPricePerKg : parseFloat(manualPricePerKg);
    if (!finalPricePerKg || finalPricePerKg <= 0) {
      addToast({ type: 'warning', title: 'Price Required', message: 'Please select or enter a valid price per kg.' });
      return;
    }
    setLoading(true);
    try {
      const updatedListing = await listingsService.acceptPrice(createdListing.id, {
        price_per_kg: finalPricePerKg,
        final_price: finalPricePerKg * quantityNum,
        base_price: aiPricing?.baseRate || finalPricePerKg,
        quality_adjustment: aiPricing?.adjustments?.quality || 0,
        volume_adjustment: aiPricing?.adjustments?.volume || 0,
      });
      setCreatedListing(updatedListing);
      addToast({ type: 'success', title: 'Price Confirmed', message: `${formatKES(finalPricePerKg)}/kg locked in. Add photos next.` });
      setStep(3);
    } catch (e) {
      addToast({ type: 'error', title: 'Failed to Save Price', message: e.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadImages() {
    if (!createdListing) {
      setError('Listing not found. Please go back and recreate.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      if (files.length > 0) {
        console.log('📸 Uploading images...', files.length);
        await listingsService.uploadImages(createdListing.id, files);
        console.log('✅ Images uploaded');
      }
      
      if (files.length === 0) {
        console.log('📤 No images, submitting listing...');
        await listingsService.submit(createdListing.id);
      }
      
      setStep(4);
    } catch (e) {
      console.error('❌ Upload failed:', e);
      setError(e.message || 'Upload failed. Your listing was saved — you can skip images.');
      setStep(4);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1); setWasteType(''); setSubtype(''); setQty('');
    setCondition('clean'); setCollectionPoint('commercial'); setCounty('Nairobi');
    setDistanceKm(5); setNotes(''); setSelectedPricePerKg(null); 
    setManualPricePerKg(''); setPriceSource('ai'); setAiPricing(null);
    setLocation(''); setLat(null); setLng(null);
    setFiles([]); setPreviews([]); setCreatedListing(null); setFieldErrors({});
  }

  const formatKES = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  const inputStyle = (fieldName) => ({
    ...(fieldErrors[fieldName] ? {
      borderColor: '#fca5a5',
      background: '#fff8f8',
      boxShadow: '0 0 0 3px rgba(239,68,68,0.08)',
    } : {}),
  });

  // ── Render Steps ──────────────────────────────────────────────────────

  const renderDetailsStep = () => (
    <div className="card">
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Step 1 — Waste Details</div>

      {/* Waste Type */}
      <div className="form-group">
        <label className="form-label">Waste Type *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
          {wasteTypeArray.map((wt) => {
            const cfg = WASTE_TILE_CONFIG[wt.label];
            const LIcon = cfg?.LucideIcon;
            const selected = wasteType === wt.label;
            const iconColor = selected ? cfg?.color : '#9ca3af';
            const tileBg = selected ? cfg?.selectedBg : (fieldErrors.wasteType ? '#fff8f8' : '#fff');
            const tileBorder = selected ? cfg?.selectedBorder : (fieldErrors.wasteType ? '#fca5a5' : '#e5e7eb');
            return (
              <div key={wt.label}
                onClick={() => { setWasteType(wt.label); setSubtype(''); clearFieldError('wasteType'); }}
                style={{
                  padding: '14px 8px 10px', cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${tileBorder}`,
                  borderRadius: 12,
                  background: tileBg,
                  transition: 'border-color 0.15s, background 0.15s, transform 0.1s',
                  transform: selected ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: selected ? `0 4px 12px ${cfg?.color}30` : '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                  {LIcon
                    ? <LIcon size={32} color={iconColor} strokeWidth={1.5} />
                    : <SvgIcon size={32} d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 7h16" color={iconColor} />
                  }
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: selected ? cfg?.color : '#374151', letterSpacing: '0.01em' }}>{wt.label}</div>
              </div>
            );
          })}
        </div>
        <FieldError message={fieldErrors.wasteType} />
      </div>

      {selectedType?.subtypes?.length > 0 && (
        <div className="form-group">
          <label className="form-label">Subtype</label>
          <select className="form-input" value={subtype} onChange={e => setSubtype(e.target.value)}>
            <option value="">Select subtype…</option>
            {selectedType.subtypes.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Quantity (kg) *</label>
          <input
            className="form-input"
            type="number" min="0.1" step="0.1" value={qty}
            onChange={e => { setQty(e.target.value); clearFieldError('qty'); }}
            onBlur={e => { const err = validateQty(e.target.value); if (err) setFieldError('qty', err); }}
            placeholder="e.g., 50"
            style={inputStyle('qty')}
          />
          <FieldError message={fieldErrors.qty} />
        </div>
        <div className="form-group">
          <label className="form-label">Condition *</label>
          <select className="form-input" value={condition} onChange={e => setCondition(e.target.value)}>
            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Location */}
      <div className="form-group">
        <label className="form-label">Pickup Location *</label>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLocating}
          style={{
            width: '100%', padding: '10px', marginBottom: '12px',
            background: '#f0f5ec', border: '1px solid #2A6A2A', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#2A6A2A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: isLocating ? 0.7 : 1, transition: 'opacity 0.2s',
          }}
        >
          {isLocating ? (
            <><Icons.Loader /><span>Getting your location…</span></>
          ) : (
            <><Icons.Crosshair /><span>Use My Current Location</span></>
          )}
        </button>

        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <input
            className="form-input"
            type="text"
            value={location}
            onChange={e => { setLocation(e.target.value); setShowSuggestions(true); clearFieldError('location'); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => { const err = validateLocation(location); if (err) setFieldError('location', err); }}
            placeholder="Enter your pickup address (e.g., Westlands, Nairobi)"
            style={inputStyle('location')}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#fff', border: '1px solid #ddd', borderRadius: 8,
              zIndex: 9999, maxHeight: 240, overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}>
              {suggestions.map(item => {
                const p = item.properties;
                return (
                  <div key={p.place_id}
                    onClick={() => { setLocation(p.formatted); setLat(p.lat); setLng(p.lon); setSuggestions([]); setShowSuggestions(false); clearFieldError('location'); }}
                    style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Icons.MapPin /><span>{p.formatted}</span>
                  </div>
                );
              })}
            </div>
          )}
          {loadingSuggestions && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Loader />Searching locations…
            </div>
          )}
        </div>

        {lat && lng && (
          <div style={{ fontSize: 11, color: '#2A6A2A', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
            <Icons.MapPin />
            Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
          </div>
        )}
        <FieldError message={fieldErrors.location} />
      </div>

      <div className="form-group">
        <label className="form-label">County</label>
        <select className="form-input" value={county} onChange={e => setCounty(e.target.value)}>
          {COUNTIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Collection Point */}
      <div className="form-group">
        <label className="form-label">Collection Point Type *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {COLLECTION_POINTS.map(cp => {
            const CIcon = CollectionIcons[cp.value];
            const selected = collectionPoint === cp.value;
            return (
              <div key={cp.value}
                onClick={() => setCollectionPoint(cp.value)}
                style={{
                  padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${selected ? 'var(--olive)' : 'var(--border)'}`,
                  borderRadius: 'var(--r2)',
                  background: selected ? 'var(--olive-bg)' : 'var(--white)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'center', color: selected ? '#2A6A2A' : '#666', marginBottom: 4 }}>
                  {CIcon && <CIcon />}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: selected ? '#2A6A2A' : '#444' }}>{cp.label}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2, lineHeight: 1.3 }}>{cp.desc}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: '#666', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icons.TrendingUp />
          Industrial and commercial waste gets better rates
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <textarea className="form-input" rows={3} value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any additional details about the waste…" />
      </div>

      <Button variant="primary" loading={loading} onClick={handleCreateListing}>
        Continue to Pricing →
      </Button>
    </div>
  );

  const renderPricingStep = () => (
    <div className="card">
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        Step 2 — Confirm Your Price
        {pricingLoading && (
          <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 400 }}>
            <Icons.Loader />Analyzing market…
          </span>
        )}
      </div>

      {aiPricing && !pricingLoading ? (
        <>
          {aiPricing.marketInfo && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: aiPricing.marketInfo.tier === 'formal' ? '#E8F5E9' : aiPricing.marketInfo.tier === 'semi_formal' ? '#FFF8E1' : '#FFF3E0',
                color: aiPricing.marketInfo.tier === 'formal' ? '#2A6A2A' : aiPricing.marketInfo.tier === 'semi_formal' ? '#7A5A00' : '#8A4000',
              }}>
                {aiPricing.marketInfo.tier?.replace('_', ' ')} tier
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, background: '#F5F5F5',
                color: aiPricing.marketInfo.signal === 'stable' ? '#2A6A2A' : aiPricing.marketInfo.signal === 'moderate' ? '#7A5A00' : '#8A2020',
              }}>
                {aiPricing.marketInfo.signal} market
              </span>
            </div>
          )}

          <div style={{ background: '#f0f5ec', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid #c8e0c8' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Sparkles />AI Market Recommendation
            </div>
            <div style={{ fontSize: 14, color: '#444', marginBottom: 4 }}>Rate per kilogram</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#2A6A2A' }}>
              {formatKES(aiPricing.perKgRange?.recommended || aiPricing.priceRange?.recommended)}/kg
            </div>
            {quantityNum > 1 && (
              <div style={{ fontSize: 13, color: '#444', marginTop: 8 }}>
                Total for {quantityNum} kg: <strong>{formatKES((aiPricing.perKgRange?.recommended || aiPricing.priceRange?.recommended) * quantityNum)}</strong>
              </div>
            )}
            {aiPricing.priceRange && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                Market range: KES {aiPricing.priceRange.lower} – {aiPricing.priceRange.upper}/kg
              </div>
            )}
          </div>

          {aiPricing.marketInfo?.advice && (
            <Alert type="info" style={{ marginBottom: 16, fontSize: 12 }}>
              {aiPricing.marketInfo.advice}
            </Alert>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, cursor: 'pointer' }}>
              <input type="radio" checked={priceSource === 'ai'} onChange={() => { setPriceSource('ai'); setSelectedPricePerKg(aiPricing.perKgRange?.recommended || aiPricing.priceRange?.recommended); }} />
              <span>Use AI recommended price <strong>{formatKES(aiPricing.perKgRange?.recommended || aiPricing.priceRange?.recommended)}/kg</strong></span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input type="radio" checked={priceSource === 'manual'} onChange={() => { setPriceSource('manual'); setSelectedPricePerKg(null); }} />
              <span>Set my own price (KES/kg)</span>
            </label>
          </div>

          {priceSource === 'manual' && (
            <div className="form-group">
              <label className="form-label">Your Price (KES per kg)</label>
              <input
                className="form-input" type="number" min="0" step="0.5" value={manualPricePerKg}
                onChange={e => { const v = parseFloat(e.target.value); setManualPricePerKg(e.target.value); setSelectedPricePerKg(isNaN(v) ? null : v); }}
                placeholder={`e.g., ${Math.round((aiPricing.perKgRange?.recommended || 13) * 0.9)}`}
              />
            </div>
          )}

          {selectedPricePerKg && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#f5f5f5', fontSize: 13 }}>
              <strong>Your selected price:</strong><br />
              {formatKES(selectedPricePerKg)}/kg × {quantityNum} kg = <strong>{formatKES(selectedPricePerKg * quantityNum)} total</strong>
            </div>
          )}

          <div style={{ marginTop: 16, marginBottom: 24, fontSize: 12, color: '#666' }}>
            Model confidence: {Math.round((aiPricing.confidence || 0.85) * 100)}%
          </div>
        </>
      ) : pricingLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
          <div style={{ marginTop: 12, color: '#666' }}>Fetching real-time market rates…</div>
        </div>
      ) : (
        <div>
          <Alert type="warn" style={{ marginBottom: 16 }}>AI pricing temporarily unavailable. Please enter price manually.</Alert>
          <div className="form-group">
            <label className="form-label">Your Price (KES per kg)</label>
            <input className="form-input" type="number" min="0" step="0.5" value={manualPricePerKg}
              onChange={e => { const v = parseFloat(e.target.value); setManualPricePerKg(e.target.value); setSelectedPricePerKg(isNaN(v) ? null : v); }}
              placeholder="e.g., 45"
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Button variant="secondary" onClick={() => setStep(1)}>← Back to Details</Button>
        <Button variant="primary" onClick={handleAcceptPrice} loading={loading}
          disabled={!selectedPricePerKg && priceSource === 'manual' && !manualPricePerKg}>
          Accept Price & Continue →
        </Button>
      </div>
    </div>
  );

  // Step 3: Upload
  const renderUploadStep = () => (
    <div className="card">
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Step 3 — Upload Photos</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Upload up to 5 photos. Clear images improve matching speed.
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? '#2A6A2A' : '#ddd'}`,
          borderRadius: '8px', padding: '32px 20px',
          textAlign: 'center', cursor: 'pointer', marginBottom: 16,
          background: drag ? '#f0f5ec' : '#fafaf8',
        }}>
        <Icon name="camera" size={32} color="#2A6A2A" style={{ marginBottom: 8 }} />
        <div style={{ fontWeight: 600, fontSize: 14 }}>Drop images here or click to browse</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          PNG, JPG up to 10 MB each · Max 5 images
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files)} />
      </div>

      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {previews.map((src, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
              <img src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              <button onClick={() => removeFile(i)}
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#E05050', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer' }}>×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={() => setStep(2)}>← Back to Price</Button>
        <Button variant="primary" loading={loading} onClick={handleUploadImages}>
          {files.length > 0 ? 'Upload & Submit' : 'Skip & Submit'}
        </Button>
 
        {/* Run verification — shown when images uploaded but not yet verified */}
        {!visionResult && !visionLoading && (
          <Button
            variant="primary"
            loading={visionLoading}
            disabled={files.length === 0 || visionLoading}
            onClick={handleUploadImages}
          >
            {files.length === 0
              ? 'Upload images to verify'
              : `Verify ${files.length} Image${files.length > 1 ? 's' : ''} with AI`}
          </Button>
        )}
 
        {/* Submit — only shown after successful verification */}
        {visionResult && !visionLoading && (
          <Button
            variant="primary"
            loading={loading}
            onClick={handleConfirmSubmit}
          >
            {visionResult.verdict === 'verified'
              ? 'Confirm & Submit Listing →'
              : 'Submit for Manual Review →'}
          </Button>
        )}
      </div>
    </div>
  );
};

  const renderDoneStep = () => (
    <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E0F0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Icons.CheckCircle />
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Listing Submitted!</div>
      <div style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
        Your listing is pending verification. We'll notify you once it's approved.
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Button variant="primary" onClick={reset}>List Another</Button>
        <Button variant="secondary" onClick={() => onNavigate('dashboard')}>Dashboard</Button>
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer />
      <div className="page">
        <div className="section-hd" style={{ marginBottom: 20 }}>
          <div>
            <div className="page-heading">List Your Waste</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              Get AI-powered pricing &amp; matched with recyclers
            </div>
          </div>
        </div>

        <StepIndicator steps={STEPS} current={step} />

        {step === 1 && renderDetailsStep()}
        {step === 2 && renderPricingStep()}
        {step === 3 && renderUploadStep()}
        {step === 4 && renderDoneStep()}
      </div>
    </>
  );
