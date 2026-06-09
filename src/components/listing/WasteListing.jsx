import React, { useState, useRef, useMemo, useEffect } from 'react';
import { WASTE_TYPES } from '../../data/mockData';
import { Button, StepIndicator, Alert } from '../common';
import Icon from '../common/Icon';
import { listingsService } from '../../services/ListingService';
import { useVision } from '../../hooks/useVision';
import { getPrice } from '../../services/pricingService';



const STEPS = ['Details', 'Price', 'Verify', 'Done'];

const CONDITIONS = [
  { label: 'Clean / Sorted', value: 'clean' },
  { label: 'Mixed / Unsorted', value: 'mixed' },
  { label: 'Contaminated', value: 'contaminated' },
  { label: 'Baled / Compressed', value: 'baled' },
];

const COLLECTION_POINTS = [
  { value: 'commercial', label: '🏢 Commercial', desc: 'Business waste, regular pickup' },
  { value: 'industrial', label: '🏭 Industrial', desc: 'Factory/manufacturing waste, bulk volume' },
  { value: 'household', label: '🏠 Household', desc: 'Residential, small quantities' },
];

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Kiambu', 'Nakuru', 'Eldoret', 
  'Machakos', 'Kajiado', 'Tharaka Nithi', 'Meru', 'Nyeri', 'Kirinyaga'
];

const SUBTYPE_MAP = {
  'PET Bottles': 'PET',
  'HDPE': 'HDPE',
  'PVC': 'PVC',
  'LDPE': 'LDPE',
  'PP': 'PP',
  'PS': 'PS',
  'Cardboard': 'cardboard',
  'Newspaper': 'newspaper',
  'Office Paper': 'office_paper',
  'Magazines': 'magazines',
  'Aluminium Cans': 'aluminium',
  'Iron Scrap': 'iron',
  'Copper Wire': 'copper',
  'Steel': 'steel',
  'Clear Glass': 'clear_glass',
  'Brown Glass': 'brown_glass',
  'Green Glass': 'green_glass',
  'Food Waste': 'food_waste',
  'Garden Waste': 'garden_waste',
  'Wood': 'wood',
  'Phones': 'phones',
  'Computers': 'computers',
  'Batteries': 'batteries',
  'Cables': 'cables',
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

const EMOJI_MAP = {
  Plastic: '🧴', Paper: '📄', Metal: '⚙️', Glass: '🫙',
  Organic: '🌿', 'E-Waste': '📱', Textile: '👕', Rubber: '🔧',
};

export default function WasteListing({ onNavigate }) {
  const wasteTypeArray = useMemo(() => buildWasteTypeArray(WASTE_TYPES), []);

  // Step 1 state
  const [step, setStep] = useState(1);
  const [wasteType, setWasteType] = useState('');
  const [subtype, setSubtype] = useState('');
  const [qty, setQty] = useState('');
  const [condition, setCondition] = useState('clean');
  const [collectionPoint, setCollectionPoint] = useState('commercial');
  const [county, setCounty] = useState('Nairobi');
  const [notes, setNotes] = useState('');
  
  // Location state
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // AI Pricing state
  const [aiPricing, setAiPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [selectedPricePerKg, setSelectedPricePerKg] = useState(null);
  const [priceSource, setPriceSource] = useState('ai');
  const [manualPricePerKg, setManualPricePerKg] = useState('');
  
  // Listing state
  const [createdListing, setCreatedListing] = useState(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
  result: visionResult,
  loading: visionLoading,
  error: visionError,
  analyse,
  clear: clearVision,
} = useVision();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [distanceKm, setDistanceKm] = useState(5);
  const fileRef = useRef();

 
  const selectedType = wasteTypeArray.find(w => w.label === wasteType);
  const quantityNum = parseFloat(qty) || 0;

  

  const GEOAPIFY_KEY = process.env?.REACT_APP_GEOAPIFY_KEY;
  
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
  // Add these two lines:
const [suggestions, setSuggestions] = useState([]);
const [loadingSuggestions, setLoadingSuggestions] = useState(false);
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
      alert('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        
        // Reverse geocode to get address
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setLocation(data.display_name);
          } else {
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enter manually.');
        setIsLocating(false);
      }
    );
  };

  // Fetch AI price when inputs change
  useEffect(() => {
    const fetchAiPrice = async () => {
      if (!wasteType || !qty || quantityNum <= 0) return;
      
      setPricingLoading(true);
      try {
        const result = await getPrice({
          wasteType,
          subtype,
          quantity: quantityNum,
          condition,
          county,
          collectionPoint,
        });
        
        setAiPricing(result);
        const recommendedPerKg = result.perKgRange?.recommended || result.priceRange?.recommended;
        
        if (priceSource === 'ai' && !selectedPricePerKg) {
          setSelectedPricePerKg(recommendedPerKg);
        }
      } catch (err) {
        console.error('AI pricing failed:', err);
        setAiPricing(null);
      } finally {
        setPricingLoading(false);
      }
    };
    
    const timeout = setTimeout(fetchAiPrice, 500);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasteType, subtype, qty, condition, county, collectionPoint]);

  function handleFile(newFiles) {
    const valid = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...valid].slice(0, 5));
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target.result].slice(0, 5));
      reader.readAsDataURL(f);
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files);
  }

  function removeFile(i) {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  // STEP 1: Create listing with all details including location
  // STEP 1: Create listing with all details including location
async function handleCreateListing() {
  if (!wasteType) { setError('Please select a waste type'); return; }
  if (!qty || quantityNum <= 0) { setError('Please enter a valid quantity'); return; }
  if (!location && !lat) { setError('Please enter your pickup location'); return; }
  
  const mappedSubtype = subtype ? (SUBTYPE_MAP[subtype] || subtype) : 'Mixed';
  
  setError('');
  setLoading(true);
  
  try {
    const listingPayload = {
      waste_type: wasteType,
      subtype: mappedSubtype,
      quantity_kg: quantityNum,
      condition: condition,
      collection_point: collectionPoint,  // ✅ ADD THIS - it was missing!
      county: county,
      location: location || `${county}, Kenya`,
      // Only include lat/lng if they have values
      ...(lat && { lat: lat }),
      ...(lng && { lng: lng }),
    };
    
    console.log('📦 Creating listing with payload:', listingPayload);
    const listing = await listingsService.create(listingPayload);
    console.log('✅ Listing created:', listing);
    
    setCreatedListing(listing);
    setStep(2);
  } catch (e) {
    console.error('❌ Failed to create listing:', e);
    setError(e.message || 'Failed to create listing. Please try again.');
  } finally {
    setLoading(false);
  }
}

  // STEP 2: Accept price
  async function handleAcceptPrice() {
    if (!createdListing) {
      setError('Listing not found. Please go back and recreate.');
      return;
    }
    
    let finalPricePerKg = null;
    if (priceSource === 'ai' && selectedPricePerKg) {
      finalPricePerKg = selectedPricePerKg;
    } else if (priceSource === 'manual' && manualPricePerKg) {
      finalPricePerKg = parseFloat(manualPricePerKg);
    }
    
    if (!finalPricePerKg || finalPricePerKg <= 0) {
      setError('Please select or enter a valid price');
      return;
    }
    
    const finalPriceTotal = finalPricePerKg * quantityNum;
    
    setError('');
    setLoading(true);
    try {
      const pricePayload = {
        price_per_kg: finalPricePerKg,
        final_price: finalPriceTotal,
        base_price: aiPricing?.baseRate || finalPricePerKg,
        quality_adjustment: aiPricing?.adjustments?.quality || 0,
        volume_adjustment: aiPricing?.adjustments?.volume || 0,
      };
      
      console.log('💰 Accepting price:', pricePayload);
      const updatedListing = await listingsService.acceptPrice(createdListing.id, pricePayload);
      console.log('✅ Price accepted:', updatedListing);
      
      setCreatedListing(updatedListing);
      setStep(3);
    } catch (e) {
      console.error('❌ Failed to accept price:', e);
      setError(e.message || 'Failed to save price. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // STEP 3: Upload images
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
  setNotes(''); setSelectedPricePerKg(null); 
  setManualPricePerKg(''); setPriceSource('ai'); setAiPricing(null);
  setLocation(''); setLat(null); setLng(null);
  setFiles([]); setPreviews([]); setCreatedListing(null); setError('');
  clearVision(); // ✅ moved here from handleConfirmSubmit
}

  const formatKES = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  // Step 1: Details with Location
  const renderDetailsStep = () => (
    <div className="card">
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Step 1 — Waste Details</div>

      <div className="form-group">
        <label className="form-label">Waste Type *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
          {wasteTypeArray.map((wt) => (
            <div key={wt.label}
              onClick={() => { setWasteType(wt.label); setSubtype(''); }}
              style={{
                padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${wasteType === wt.label ? 'var(--olive)' : 'var(--border)'}`,
                borderRadius: 'var(--r2)',
                background: wasteType === wt.label ? 'var(--olive-bg)' : 'var(--white)',
              }}>
              <div style={{ fontSize: 20 }}>{EMOJI_MAP[wt.label] || '♻️'}</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                {wt.label}
              </div>
            </div>
          ))}
        </div>
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
          <input className="form-input" type="number" min="0.1" step="0.1" value={qty}
            onChange={e => setQty(e.target.value)} placeholder="e.g., 50" />
        </div>
        <div className="form-group">
          <label className="form-label">Condition *</label>
          <select className="form-input" value={condition} onChange={e => setCondition(e.target.value)}>
            {CONDITIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Location Section */}
      <div className="form-group">
        <label className="form-label">Pickup Location *</label>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLocating}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '12px',
            background: '#f0f5ec',
            border: '1px solid #2A6A2A',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#2A6A2A',
          }}
        >
          {isLocating ? '📍 Getting your location...' : '📍 Use My Current Location'}
        </button>
        
        <input
          className="form-input"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter your pickup address (e.g., Westlands, Nairobi)"
        />
        
        {lat && lng && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            📍 Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">County</label>
        <select className="form-input" value={county} onChange={e => setCounty(e.target.value)}>
          {COUNTIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Collection Point Type *</label>
        <select 
          className="form-input" 
          value={collectionPoint} 
          onChange={e => setCollectionPoint(e.target.value)}
        >
          {COLLECTION_POINTS.map(cp => (
            <option key={cp.value} value={cp.value}>
              {cp.label} - {cp.desc}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
          💡 Industrial and commercial waste gets better rates
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

  // Step 2: Pricing
  const renderPricingStep = () => (
    <div className="card">
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
        Step 2 — Confirm Your Price
        {pricingLoading && <span style={{ marginLeft: 10, fontSize: 12, color: '#666' }}>🤖 AI analyzing market...</span>}
      </div>

      {aiPricing && !pricingLoading ? (
        <>
          {aiPricing.marketInfo && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: aiPricing.marketInfo.tier === 'formal' ? '#E8F5E9' : 
                           aiPricing.marketInfo.tier === 'semi_formal' ? '#FFF8E1' : '#FFF3E0',
                color: aiPricing.marketInfo.tier === 'formal' ? '#2A6A2A' : 
                       aiPricing.marketInfo.tier === 'semi_formal' ? '#7A5A00' : '#8A4000',
              }}>
                {aiPricing.marketInfo.tier?.replace('_', ' ')} tier
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, background: '#F5F5F5',
                color: aiPricing.marketInfo.signal === 'stable' ? '#2A6A2A' : 
                       aiPricing.marketInfo.signal === 'moderate' ? '#7A5A00' : '#8A2020',
              }}>
                {aiPricing.marketInfo.signal} market
              </span>
            </div>
          )}

          <div style={{
            background: '#f0f5ec',
            padding: 16, borderRadius: 12, marginBottom: 16,
            border: '1px solid #c8e0c8'
          }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              🤖 AI Market Recommendation
            </div>
            <div style={{ fontSize: 14, color: '#444', marginBottom: 4 }}>
              Rate per kilogram
            </div>
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
              💡 {aiPricing.marketInfo.advice}
            </Alert>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <input
                type="radio"
                checked={priceSource === 'ai'}
                onChange={() => {
                  setPriceSource('ai');
                  setSelectedPricePerKg(aiPricing.perKgRange?.recommended || aiPricing.priceRange?.recommended);
                }}
              />
              <span>
                Use AI recommended price <strong>{formatKES(aiPricing.perKgRange?.recommended || aiPricing.priceRange?.recommended)}/kg</strong>
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="radio"
                checked={priceSource === 'manual'}
                onChange={() => {
                  setPriceSource('manual');
                  setSelectedPricePerKg(null);
                }}
              />
              <span>Set my own price (KES/kg)</span>
            </label>
          </div>

          {priceSource === 'manual' && (
            <div className="form-group">
              <label className="form-label">Your Price (KES per kg)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.5"
                value={manualPricePerKg}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setManualPricePerKg(e.target.value);
                  setSelectedPricePerKg(isNaN(val) ? null : val);
                }}
                placeholder={`e.g., ${Math.round((aiPricing.perKgRange?.recommended || 13) * 0.9)}`}
              />
            </div>
          )}

          {selectedPricePerKg && (
          <div style={{
            marginTop: 16, padding: 12, borderRadius: 8,
            background: '#f5f5f5', fontSize: 13
          }}>
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
          <div style={{ marginTop: 12, color: '#666' }}>
            Fetching real-time market rates...
          </div>
        </div>
      ) : (
        <div>
          <Alert type="warn" style={{ marginBottom: 16 }}>
            AI pricing temporarily unavailable. Please enter price manually.
          </Alert>
          <div className="form-group">
            <label className="form-label">Your Price (KES per kg)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.5"
              value={manualPricePerKg}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setManualPricePerKg(e.target.value);
                setSelectedPricePerKg(isNaN(val) ? null : val);
              }}
              placeholder="e.g., 45"
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Button variant="secondary" onClick={() => setStep(1)}>
          ← Back to Details
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAcceptPrice}
          loading={loading}
          disabled={!selectedPricePerKg && priceSource === 'manual' && !manualPricePerKg}
        >
          Accept Price & Continue →
        </Button>
      </div>
    </div>
  );
  const handleConfirmSubmit = async () => {
  if (!createdListing) {
    setError('Listing not found');
    return;
  }
  
  setLoading(true);
  try {
    // If you have vision results, you might want to verify again
    if (visionResult?.verdict === 'verified') {
      await listingsService.submit(createdListing.id);
    } else {
      // For low confidence or rejected, still submit but flag for review
      await listingsService.submitForReview(createdListing.id);
    }
    setStep(4);
  } catch (err) {
    console.error('Submission failed:', err);
    setError(err.message || 'Submission failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
  // Step 3: Upload
  const renderUploadStep = () => {
  const verdictConfig = {
    verified:       { color: '#2A6A2A', bg: '#E8F5E9', label: 'Verified ✓',              canSubmit: true  },
    low_confidence: { color: '#7A5A00', bg: '#FFF8E1', label: 'Low Confidence — Add more images', canSubmit: false },
    rejected:       { color: '#8A2020', bg: '#FFEBEE', label: 'Manual Review Required',  canSubmit: false },
  };
  const vc = visionResult ? verdictConfig[visionResult.verdict] : null;
 
  return (
    <div className="card">
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
        Step 3 — Photo Verification
      </div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Upload photos of your waste. Our AI will verify the material type before submission.
        This step is required and cannot be skipped.
      </div>
 
      {/* Photo guidelines */}
      {!visionResult && (
        <div style={{
          background: '#f0f5ec',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 12,
          color: '#555',
        }}>
          📸 <strong>Photo tips for best verification results:</strong>
          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
            <li>Place material on a dark contrasting background</li>
            <li>Fill at least 70% of the frame with the material</li>
            <li>Upload 3–5 photos from different angles</li>
            <li>Avoid backlighting and flash glare</li>
          </ul>
        </div>
      )}
 
      {/* Upload zone — shown until verification is run */}
      {!visionResult && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? '#2A6A2A' : '#ddd'}`,
              borderRadius: 8,
              padding: '32px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 16,
              background: drag ? '#f0f5ec' : '#fafaf8',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Drop images here or click to browse
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              PNG, JPG · Upload 3–5 photos from different angles
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files)}
            />
          </div>
 
          {/* Thumbnails */}
          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                  <img
                    src={src}
                    alt=""
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); removeFile(i); }}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#E05050', border: 'none',
                      color: '#fff', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div style={{ fontSize: 12, color: '#666', alignSelf: 'center' }}>
                {files.length} image{files.length > 1 ? 's' : ''} selected
              </div>
            </div>
          )}
        </>
      )}
 
      {/* CV Verification loading */}
      {visionLoading && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px', width: 32, height: 32 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2A6A2A' }}>
            Running AI Verification…
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
            Analysing {files.length} image{files.length > 1 ? 's' : ''} across SM1 → SM2 → SM3 → SM4
          </div>
        </div>
      )}
 
      {/* CV Error */}
      {visionError && !visionLoading && (
        <div style={{
          background: '#FFEBEE', borderRadius: 8, padding: 14, marginBottom: 14,
          fontSize: 13, color: '#8A2020',
        }}>
          ⚠️ Verification failed: {visionError}
          <br />
          <button
            onClick={() => { clearVision(); }}
            style={{ marginTop: 8, fontSize: 12, color: '#2A6A2A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Try again
          </button>
        </div>
      )}
 
      {/* CV Result */}
      {visionResult && !visionLoading && (
        <div style={{ marginBottom: 16 }}>
 
          {/* Verdict banner */}
          <div style={{
            background: vc.bg,
            border: `1px solid ${vc.color}`,
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: vc.color }}>
                {vc.label}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                Detected: <strong>{visionResult.detectedType}</strong>
                {visionResult.detectedSubtype && ` — ${visionResult.detectedSubtype}`}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: vc.color }}>
              {visionResult.confidence}%
            </div>
          </div>
 
          {/* Confidence bars */}
          {[
            { label: 'Detection Confidence', value: visionResult.confidence },
            { label: 'Quality Score',         value: visionResult.qualityScore },
            { label: 'Batch Consistency',     value: visionResult.consistencyScore },
          ].map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#666' }}>{label}</span>
                <span style={{ fontWeight: 600, color: value < 65 ? '#C06010' : '#2A6A2A' }}>
                  {value}%
                </span>
              </div>
              <div style={{ height: 6, background: '#eee', borderRadius: 3 }}>
                <div style={{
                  height: 6, borderRadius: 3,
                  width: `${value}%`,
                  background: value < 65 ? '#F59E0B' : '#2A6A2A',
                }} />
              </div>
            </div>
          ))}
 
          {/* Notes from API */}
          <div style={{
            background: '#f5f5f5', borderRadius: 8, padding: '10px 12px',
            fontSize: 12, color: '#555', marginTop: 10,
          }}>
            {visionResult.notes}
          </div>
 
          {/* Rejected guidance */}
          {visionResult.verdict === 'rejected' && (
            <div style={{
              background: '#FFEBEE', borderRadius: 8, padding: '10px 12px',
              fontSize: 12, color: '#8A2020', marginTop: 10,
            }}>
              This listing has been flagged for manual administrator review.
              You can still submit — an admin will review the images before approval.
            </div>
          )}
 
          {/* Low confidence guidance */}
          {visionResult.verdict === 'low_confidence' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: '#7A5A00', marginBottom: 8 }}>
                Add more photos from different angles to improve your confidence score.
              </div>
              <button
                onClick={() => { clearVision(); }}
                style={{
                  fontSize: 12, color: '#2A6A2A', background: '#f0f5ec',
                  border: '1px solid #2A6A2A', borderRadius: 6,
                  padding: '6px 12px', cursor: 'pointer',
                }}
              >
                ← Add more photos
              </button>
            </div>
          )}
        </div>
      )}
 
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Button variant="secondary" onClick={() => setStep(2)}>
          ← Back to Price
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

}

  // Step 4: Done
  const renderDoneStep = () => {
  const wasAutoApproved = visionResult?.verdict === 'verified';

  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: wasAutoApproved ? '#E0F0E0' : '#FFF8E1',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Icon
          name="check"
          size={32}
          color={wasAutoApproved ? '#2A6A2A' : '#7A5A00'}
          strokeWidth={2.5}
        />
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        {wasAutoApproved ? 'Listing Auto-Approved! ✓' : 'Listing Submitted!'}
      </div>

      <div style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
        {wasAutoApproved
          ? 'Your listing passed AI verification and is now live on the marketplace.'
          : visionResult?.verdict === 'low_confidence'
            ? 'Your listing has been submitted for administrator review. You may be asked to provide additional images.'
            : 'Your listing has been flagged for manual review. An administrator will verify it shortly.'}
      </div>

      {/* Show CV score summary */}
      {visionResult && (
        <div style={{
          background: wasAutoApproved ? '#E8F5E9' : '#FFF8E1',
          border: `1px solid ${wasAutoApproved ? '#2A6A2A' : '#7A5A00'}`,
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8 }}>
            CV Verification Summary
          </div>
          {[
            { label: 'Detection Confidence', value: visionResult.confidence },
            { label: 'Quality Score',         value: visionResult.qualityScore },
            { label: 'Batch Consistency',     value: visionResult.consistencyScore },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#666' }}>{label}</span>
              <span style={{ fontWeight: 600, color: value >= 85 ? '#2A6A2A' : '#7A5A00' }}>
                {value}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Button variant="primary" onClick={reset}>List Another</Button>
        <Button variant="secondary" onClick={() => onNavigate('dashboard')}>Dashboard</Button>
      </div>
    </div>
  );
  };
  return (
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

      {error && <Alert type="warn" style={{ margin: '16px 0' }}>{error}</Alert>}

      {step === 1 && renderDetailsStep()}
      {step === 2 && renderPricingStep()}
      {step === 3 && renderUploadStep()}
      {step === 4 && renderDoneStep()}
    </div>
  )
  
}
