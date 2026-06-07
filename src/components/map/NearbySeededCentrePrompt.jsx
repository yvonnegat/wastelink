/**
 * NearbySeededCentrePrompt.jsx
 * src/components/map/NearbySeededCentrePrompt.jsx
 *
 * Shown when a recycler is registering their centre and we detect
 * a seeded centre within 200m.
 * Gives them two choices:
 *   A) Claim the existing seeded centre (recommended)
 *   B) Register a new separate listing anyway
 */

import { useState } from 'react';
import { claimSeededCentre } from '../../services/locationService';

export function NearbySeededCentrePrompt({ nearby, userId, onClaimed, onRegisterAnyway, onDismiss }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const claimed = await claimSeededCentre(nearby.id, userId);
      onClaimed(claimed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        {/* Header */}
        <div style={S.header}>
          <span style={S.icon}>📍</span>
          <div>
            <p style={S.title}>We found a nearby centre</p>
            <p style={S.sub}>Is this your recycling centre?</p>
          </div>
          <button style={S.closeBtn} onClick={onDismiss}>✕</button>
        </div>

        {/* The seeded centre details */}
        <div style={S.centreBox}>
          <p style={S.centreName}>{nearby.name}</p>
          {nearby.address && <p style={S.centreAddr}>📍 {nearby.address}{nearby.city ? `, ${nearby.city}` : ''}</p>}
          <p style={S.centreAddr}>
            {nearby.dist < 0.1
              ? `${Math.round(nearby.dist * 1000)} m from your entered location`
              : `${nearby.dist.toFixed(2)} km from your entered location`}
          </p>
          {nearby.claimed_by_user_id && (
            <span style={S.claimedBadge}>Already claimed by another recycler</span>
          )}
        </div>

        {error && <p style={S.error}>{error}</p>}

        {/* Actions */}
        <div style={S.actions}>
          {!nearby.claimed_by_user_id ? (
            <button style={S.claimBtn} onClick={handleClaim} disabled={loading}>
              {loading ? 'Claiming…' : '✓ Yes, this is my centre'}
            </button>
          ) : (
            <p style={{ fontSize: 13, color: '#888', textAlign: 'center', margin: 0 }}>
              This centre is already claimed. You can still register a separate listing below.
            </p>
          )}
          <button style={S.separateBtn} onClick={onRegisterAnyway}>
            No, register a separate listing
          </button>
        </div>

        {/* What "claim" means */}
        {!nearby.claimed_by_user_id && (
          <p style={S.hint}>
            Claiming links your account to the existing pin. You'll be able to update its hours, phone, and accepted types. Your centre appears as verified on the map.
          </p>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 9100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card:         { background: 'white', borderRadius: 18, padding: '24px 22px', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 16 },
  header:       { display: 'flex', alignItems: 'flex-start', gap: 12 },
  icon:         { fontSize: 28, flexShrink: 0 },
  title:        { margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' },
  sub:          { margin: '2px 0 0', fontSize: 13, color: '#888' },
  closeBtn:     { marginLeft: 'auto', background: '#f5f5f5', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, color: '#666', fontSize: 12 },
  centreBox:    { background: '#f0faf5', border: '1.5px solid #c3e6d4', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  centreName:   { margin: 0, fontSize: 15, fontWeight: 700, color: '#1a4731' },
  centreAddr:   { margin: 0, fontSize: 13, color: '#555' },
  claimedBadge: { marginTop: 6, display: 'inline-block', background: '#fff3cd', color: '#856404', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 },
  actions:      { display: 'flex', flexDirection: 'column', gap: 8 },
  claimBtn:     { padding: '13px', background: '#1a4731', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  separateBtn:  { padding: '11px', background: 'white', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  hint:         { margin: 0, fontSize: 12, color: '#aaa', lineHeight: 1.5, textAlign: 'center' },
  error:        { margin: 0, fontSize: 13, color: '#c0392b', background: '#fce8e8', borderRadius: 8, padding: '8px 12px', textAlign: 'center' },
};