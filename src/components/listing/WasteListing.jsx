import React, { useState, useRef } from 'react';
import { WASTE_TYPES } from '../../data/mockData';
import { Button, StepIndicator, Alert } from '../common';
import Icon from '../common/Icon';

const STEPS = ['Details', 'Upload', 'Done'];

export default function WasteListing({ onNavigate }) {
  const [step, setStep]         = useState(1);
  const [wasteType, setWasteType] = useState('');
  const [subtype, setSubtype]   = useState('');
  const [qty, setQty]           = useState('');
  const [condition, setCondition] = useState('Clean / Sorted');
  const [notes, setNotes]       = useState('');
  const [img, setImg]           = useState(null);
  const [drag, setDrag]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const fileRef = useRef();

  function handleFile(f) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => setImg(e.target.result);
    reader.readAsDataURL(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function submitListing() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(3); }, 1800);
  }

  function reset() {
    setStep(1); setWasteType(''); setSubtype(''); setQty('');
    setNotes(''); setImg(null);
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

      {/* ── Step 1: Details ── */}
      {step === 1 && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Step 1 — Waste Details</div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Waste Type *</label>
              <select
                className="form-select"
                value={wasteType}
                onChange={(e) => { setWasteType(e.target.value); setSubtype(''); }}
              >
                <option value="">Select type…</option>
                {Object.keys(WASTE_TYPES).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Subtype</label>
              <select
                className="form-select"
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                disabled={!wasteType}
              >
                <option value="">Select subtype…</option>
                {(WASTE_TYPES[wasteType] || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Quantity (kg) *</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Condition</label>
              <select className="form-select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option>Clean / Sorted</option>
                <option>Mixed</option>
                <option>Contaminated</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Additional Notes</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the material, packaging, storage, etc."
            />
          </div>

          <Button
            variant="primary"
            disabled={!wasteType || !qty}
            onClick={() => setStep(2)}
          >
            Continue to Upload →
          </Button>
        </div>
      )}

      {/* ── Step 2: Upload ── */}
      {step === 2 && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Step 2 — Upload Photos</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
            Photos help verify quality and improve pricing accuracy. Upload 1–3 clear images.
          </div>

          <div
            className={`upload-zone${drag ? ' drag' : ''}`}
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {img ? (
              <div>
                <img src={img} alt="preview" className="img-preview" />
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--olive)', fontWeight: 500 }}>
                  ✓ Image uploaded — click to replace
                </div>
              </div>
            ) : (
              <>
                <div className="upload-icon">
                  <Icon name="camera" size={22} color="var(--olive-deep)" strokeWidth={1.8} />
                </div>
                <div className="upload-text">Drag &amp; drop or click to upload</div>
                <div className="upload-sub">JPEG, PNG up to 10MB</div>
              </>
            )}
          </div>

          <Alert type="info" style={{ marginTop: 12 }}>
            Tip: Place waste on a clean flat surface with good lighting for the best AI detection results.
          </Alert>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" loading={loading} onClick={submitListing}>
              {loading ? 'Submitting…' : 'Submit for Verification →'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Success ── */}
      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 64, height: 64, background: '#E0F0E0', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Icon name="check" size={28} color="#2A6A2A" strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Listing Submitted!</div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
            Your waste is being verified by our AI system. You'll be notified
            once matched with a nearby recycler.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Button variant="primary" onClick={reset}>List Another</Button>
            <Button variant="secondary" onClick={() => onNavigate('transactions')}>View Transactions</Button>
          </div>
        </div>
      )}
    </div>
  );
}
