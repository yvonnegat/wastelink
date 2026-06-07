import React, { useState, useEffect } from 'react';
import { usePricing } from '../../hooks/usePricing';
import { BASE_PRICES, WASTE_TYPES } from '../../data/mockData';
import { Button, Alert } from '../common';

const CONDITIONS = [
  { value: 'clean',        label: 'Clean',       desc: 'Sorted, dry, uncontaminated' },
  { value: 'mixed',        label: 'Mixed',        desc: 'Some sorting needed' },
  { value: 'contaminated', label: 'Contaminated', desc: 'Wet, unsorted, or dirty' },
];

const SIGNAL_COLORS = {
  stable:   '#2A6A2A',
  moderate: '#7A5A00',
  volatile: '#8A2020',
};

function PriceRow({ label, value, highlight, positive, sub }) {
  return (
    <div className={`price-row${highlight ? ' total' : ''}`}>
      <div>
        <span style={{ fontSize: highlight ? 15 : 14, color: highlight ? 'var(--text)' : 'var(--text2)' }}>
          {label}
        </span>
        {sub && (
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>
        )}
      </div>
      <span style={{
        fontSize: highlight ? 17 : 14,
        fontWeight: highlight ? 700 : 500,
        color: positive === true  ? '#2A6A2A'
             : positive === false ? '#8A2020'
             : 'var(--olive-deep)',
      }}>
        {value}
      </span>
    </div>
  );
}

function TierBadge({ tier, signal }) {
  const tierColors = {
    formal:      { bg: '#E8F5E9', text: '#2A6A2A' },
    semi_formal: { bg: '#FFF8E1', text: '#7A5A00' },
    informal:    { bg: '#FFF3E0', text: '#8A4000' },
  };
  const c = tierColors[tier] ?? tierColors.informal;
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <span style={{
        padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
        background: c.bg, color: c.text, textTransform: 'capitalize',
      }}>
        {tier?.replace('_', ' ')} tier
      </span>
      {signal && (
        <span style={{
          padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
          background: '#F5F5F5', color: SIGNAL_COLORS[signal] ?? 'var(--text2)',
          textTransform: 'capitalize',
        }}>
          {signal} market
        </span>
      )}
    </div>
  );
}

export default function PricingModule() {
  const [wasteType, setWasteType] = useState('Plastic');
  const [subtype,   setSubtype]   = useState('');
  const [qty,       setQty]       = useState(50);
  const [condition, setCondition] = useState('mixed');

  const { pricing, loading, error, accepted, fetchPrice, acceptPrice } = usePricing();

  // Reset subtype when waste type changes
  function handleWasteTypeChange(newType) {
    setWasteType(newType);
    setSubtype('');
  }

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPrice({ wasteType, subtype, quantity: qty, condition });
    }, 400);
    return () => clearTimeout(t);
  }, [wasteType, subtype, qty, condition]); // eslint-disable-line

  const fmt = (n) => `KES ${Number(n).toLocaleString()}`;

  const subtypes = WASTE_TYPES[wasteType] ?? [];

  return (
    <div className="page">
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-heading">Dynamic Pricing</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            ML-powered real-time pricing — updated daily from Nairobi market data
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* ── Input panel ── */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Configure Your Listing</div>

          {/* Waste type */}
          <div className="form-group">
            <label className="form-label">Waste Type</label>
            <select
              className="form-select"
              value={wasteType}
              onChange={(e) => handleWasteTypeChange(e.target.value)}
            >
              {Object.keys(BASE_PRICES).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Subtype — shown only when subtypes exist for this waste type */}
          {subtypes.length > 0 && (
            <div className="form-group">
              <label className="form-label">
                Subtype
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>
                  (affects model pricing)
                </span>
              </label>
              <select
                className="form-select"
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
              >
                <option value="">Any / Mixed</option>
                {subtypes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div className="form-group">
            <label className="form-label">
              Quantity: <strong>{qty} kg</strong>
            </label>
            <input
              type="range" min={1} max={500} value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--olive)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              <span>1 kg</span><span>500 kg</span>
            </div>
          </div>

          {/* Condition */}
          <div className="form-group">
            <label className="form-label">Condition</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {CONDITIONS.map((c) => (
                <label
                  key={c.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${condition === c.value ? 'var(--olive)' : 'var(--border)'}`,
                    background: condition === c.value ? 'var(--olive-light, #f4f7ee)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={c.value}
                    checked={condition === c.value}
                    onChange={() => setCondition(c.value)}
                    style={{ accentColor: 'var(--olive)' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Alert type="info">
            Base rate for {wasteType}{subtype ? ` (${subtype})` : ''}: KES {BASE_PRICES[wasteType]}/kg.
            Larger, cleaner loads unlock formal-tier rates.
          </Alert>
        </div>

        {/* ── Price panel ── */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Price Breakdown</div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
          )}

          {error && <Alert type="warn">{error}</Alert>}

          {pricing && !loading && (
            <>
              {/* Tier + signal badges */}
              {pricing.marketInfo && (
                <TierBadge
                  tier={pricing.marketInfo.tier}
                  signal={pricing.marketInfo.signal}
                />
              )}

              {/* Big recommended payout */}
              <div className="price-highlight">
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recommended Payout
                </div>
                <div className="price-big">{fmt(pricing.finalPrice)}</div>
                <div className="price-unit">
                  for {qty} kg of {wasteType}{subtype ? ` · ${subtype}` : ''}
                </div>
              </div>

              {/* Range breakdown */}
              <div style={{ padding: '0 4px' }}>
                <PriceRow
                  label="Floor Price"
                  value={fmt(pricing.payoutRange?.lower ?? pricing.finalPrice)}
                  sub="Don't accept less than this"
                />
                <PriceRow
                  label="Fair Market Rate"
                  value={fmt(pricing.finalPrice)}
                  highlight
                />
                <PriceRow
                  label="Best Case"
                  value={fmt(pricing.payoutRange?.upper ?? pricing.finalPrice)}
                  sub="Best case in current market"
                  positive
                />
              </div>

              {/* Per-kg rates */}
              {pricing.priceRange && (
                <div style={{
                  marginTop: 12, padding: '10px 12px', borderRadius: 8,
                  background: 'var(--surface2, #f8f8f6)', fontSize: 12, color: 'var(--text3)',
                }}>
                  Per kg: KES {pricing.priceRange.lower} – {pricing.priceRange.upper} &nbsp;|&nbsp;
                  Recommended: KES {pricing.priceRange.recommended}
                </div>
              )}

              {/* Advice from model */}
              {pricing.marketInfo?.advice && (
                <Alert type="info" style={{ marginTop: 12, fontSize: 12 }}>
                  {pricing.marketInfo.advice}
                </Alert>
              )}

              {/* Confidence */}
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12, textAlign: 'right' }}>
                Model confidence: {Math.round((pricing.confidence ?? 0.92) * 100)}%
              </div>

              {accepted ? (
                <Alert type="success" style={{ marginTop: 16 }}>
                  Price accepted! Connecting you with nearby recyclers…
                </Alert>
              ) : (
                <Button variant="primary" size="lg" full onClick={acceptPrice} style={{ marginTop: 16 }}>
                  Accept Price — {fmt(pricing.finalPrice)}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}