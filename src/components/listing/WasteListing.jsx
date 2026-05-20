import React, { useState, useRef, useMemo } from 'react';
import { WASTE_TYPES } from '../../data/mockData';
import { Button, StepIndicator, Alert } from '../common';
import Icon from '../common/Icon';
import { listingsService } from '../../services/ListingService';

const STEPS = ['Details', 'Upload', 'Done'];
const CONDITIONS = [
  { label: 'Clean / Sorted',    value: 'clean'        },
  { label: 'Mixed / Unsorted',  value: 'mixed'        },
  { label: 'Contaminated',      value: 'contaminated' },
  { label: 'Baled / Compressed',value: 'baled'        },
];
// ── Convert WASTE_TYPES object → array ────────────────────────────
// mockData exports: { Plastic: ['PET Bottles', ...], Paper: [...] }
// We need:          [{ label: 'Plastic', subtypes: [...] }, ...]
function buildWasteTypeArray(wasteTypesData) {
  if (Array.isArray(wasteTypesData)) return wasteTypesData; // already an array
  if (typeof wasteTypesData === 'object' && wasteTypesData !== null) {
    return Object.entries(wasteTypesData).map(([label, subtypes]) => ({
      label,
      subtypes: Array.isArray(subtypes) ? subtypes : [],
    }));
  }
  return [];
}

const EMOJI_MAP = {
  Plastic:  '🧴', Paper: '📄', Metal: '⚙️', Glass: '🫙',
  Organic:  '🌿', 'E-Waste': '📱', Textile: '👕', Rubber: '🔧',
};

export default function WasteListing({ onNavigate }) {
  const wasteTypeArray = useMemo(() => buildWasteTypeArray(WASTE_TYPES), []);

  const [step, setStep]           = useState(1);
  const [wasteType, setWasteType] = useState('');
  const [subtype, setSubtype]     = useState('');
  const [qty, setQty]             = useState('');
const [condition, setCondition] = useState('clean');
  const [notes, setNotes]         = useState('');
  const [price, setPrice]         = useState('');
  const [files, setFiles]         = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [drag, setDrag]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [createdId, setCreatedId] = useState(null);
  const fileRef = useRef();

  // Selected type entry for subtypes
  const selectedType = wasteTypeArray.find(w => w.label === wasteType);

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

  async function handleStep1() {
    if (!wasteType) { setError('Please select a waste type'); return; }
    if (!qty || parseFloat(qty) <= 0) { setError('Please enter a valid quantity'); return; }
    setError('');
    setLoading(true);
    try {
      const listing = await listingsService.create({
        waste_type:  wasteType,
        subtype:     subtype || null,
        quantity_kg: parseFloat(qty),
        condition,
        notes:       notes || null,
        price_per_kg: price ? parseFloat(price) : null,
      });
      setCreatedId(listing.id);
      setStep(2);
    } catch (e) {
      setError(e.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    setError('');
    setLoading(true);
    try {
      if (files.length > 0) {
        await listingsService.uploadImages(createdId, files);
      }
      await listingsService.submit(createdId);
      setStep(3);
    } catch (e) {
      setError(e.message || 'Upload failed. Your listing was saved — you can skip images.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1); setWasteType(''); setSubtype(''); setQty('');
    setCondition('clean'); setNotes(''); setPrice('');
    setFiles([]); setPreviews([]); setCreatedId(null); setError('');
  }

  return (
    <div className="page">
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-heading">List Your Waste</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            Get verified, priced &amp; matched with recyclers
          </div>
        </div>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {error && <Alert type="warn" style={{ margin: '16px 0' }}>{error}</Alert>}

      {/* ── Step 1: Details ─────────────────────────────────────── */}
      {step === 1 && (
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
                    transition: 'all .18s',
                  }}>
                  <div style={{ fontSize: 20 }}>{EMOJI_MAP[wt.label] || '♻️'}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: wasteType === wt.label ? 'var(--olive-deep)' : 'var(--text)' }}>
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
                onChange={e => setQty(e.target.value)} placeholder="e.g. 50" />
            </div>
            <div className="form-group">
              <label className="form-label">Asking Price (KES/kg)</label>
              <input className="form-input" type="number" min="0" step="0.5" value={price}
                onChange={e => setPrice(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Condition</label>
            <select className="form-input" value={condition} onChange={e => setCondition(e.target.value)}>
              {CONDITIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={3} value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details about the waste…" />
          </div>

          <Button variant="primary" loading={loading} onClick={handleStep1}>
            Continue to Upload →
          </Button>
        </div>
      )}

      {/* ── Step 2: Upload ──────────────────────────────────────── */}
      {step === 2 && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Step 2 — Upload Photos</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
            Upload up to 5 photos. Clear images improve matching speed. You can skip this step.
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? 'var(--olive)' : 'var(--border)'}`,
              borderRadius: 'var(--r)', padding: '32px 20px',
              textAlign: 'center', cursor: 'pointer', marginBottom: 16,
              background: drag ? 'var(--olive-bg)' : 'var(--cream)',
              transition: 'all .2s',
            }}>
            <Icon name="camera" size={32} color="var(--olive)" style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>Drop images here or click to browse</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              PNG, JPG up to 10 MB each · Max 5 images
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files)} />
          </div>

          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                  <img src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--border)' }} />
                  <button onClick={() => removeFile(i)}
                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#E05050', border: 'none', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" loading={loading} onClick={handleStep2}>
              {files.length > 0 ? 'Upload & Submit' : 'Skip & Submit'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ────────────────────────────────────────── */}
      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E0F0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="check" size={32} color="#2A6A2A" strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Listing Submitted!</div>
          <div style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24 }}>
            Your listing is pending verification. We'll notify you once it's approved and visible to recyclers.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Button variant="primary" onClick={reset}>List Another</Button>
            <Button variant="secondary" onClick={() => onNavigate('dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      )}
    </div>
  );
}