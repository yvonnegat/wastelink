import React, { useState, useEffect } from 'react';
import { usePricing } from '../../hooks/usePricing';
import { BASE_PRICES } from '../../data/mockData';
import { Button, Alert } from '../common';

function PriceRow({ label, value, highlight, positive }) {
  return (
    <div className={`price-row${highlight ? ' total' : ''}`}>
      <span style={{ fontSize: highlight ? 15 : 14, color: highlight ? 'var(--text)' : 'var(--text2)' }}>
        {label}
      </span>
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

export default function PricingModule() {
  const [wasteType, setWasteType] = useState('Plastic');
  const [qty, setQty]             = useState(50);
  const [quality, setQuality]     = useState(80);

  const { pricing, loading, error, accepted, fetchPrice, acceptPrice } = usePricing();

  // Fetch price whenever inputs change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchPrice({ wasteType, quantity: qty, quality });
    }, 400);
    return () => clearTimeout(t);
  }, [wasteType, qty, quality]); // eslint-disable-line

  const fmt = (n) => `KES ${Number(n).toLocaleString()}`;

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
        {/* Input panel */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Configure Your Listing</div>

          <div className="form-group">
            <label className="form-label">Waste Type</label>
            <select
              className="form-select"
              value={wasteType}
              onChange={(e) => setWasteType(e.target.value)}
            >
              {Object.keys(BASE_PRICES).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

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

          <div className="form-group">
            <label className="form-label">
              Quality Score: <strong>{quality}%</strong>
            </label>
            <input
              type="range" min={0} max={100} value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--olive)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              <span>Poor (0%)</span><span>Excellent (100%)</span>
            </div>
          </div>

          <Alert type="info">
            Base rate for {wasteType}: KES {BASE_PRICES[wasteType]}/kg.
            Volume bonus applies at 100 kg+.
          </Alert>
        </div>

        {/* Price breakdown panel */}
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
              {/* Big price */}
              <div className="price-highlight">
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Estimated Payout
                </div>
                <div className="price-big">{fmt(pricing.finalPrice)}</div>
                <div className="price-unit">for {qty} kg of {wasteType}</div>
              </div>

              {/* Breakdown rows */}
              <div style={{ padding: '0 4px' }}>
                <PriceRow label="Base Price" value={fmt(pricing.baseTotal)} />
                <PriceRow
                  label={`Quality Adjustment (${quality}%)`}
                  value={`${pricing.adjustments.quality >= 0 ? '+' : ''}${fmt(pricing.adjustments.quality)}`}
                  positive={pricing.adjustments.quality >= 0}
                />
                <PriceRow
                  label="Volume Adjustment"
                  value={`${pricing.adjustments.volume >= 0 ? '+' : ''}${fmt(pricing.adjustments.volume)}`}
                  positive={pricing.adjustments.volume >= 0}
                />
                <PriceRow
                  label="Final Payout"
                  value={fmt(pricing.finalPrice)}
                  highlight
                />
              </div>

              {/* Confidence */}
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12, textAlign: 'right' }}>
                Model confidence: {Math.round(pricing.confidence * 100)}%
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
