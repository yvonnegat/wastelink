import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Spinner, EmptyState, Button } from '../common';
import Icon from '../common/Icon';
import { listingsService } from '../../services/ListingService';
import { recyclersService } from '../../services/index';
import { useAuth } from '../../context/AuthContext';

const WASTE_TYPE_OPTIONS = ['Plastic', 'Paper', 'Metal', 'Glass', 'Organic', 'E-Waste', 'Textile', 'Rubber'];

// ─── Star Rating ──────────────────────────────────────────────────
function StarRating({ value, max = 5 }) {
  const rating = parseFloat(value) || 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half   = !filled && i < rating;
        return (
          <svg key={i} width={13} height={13} viewBox="0 0 24 24" fill="none">
            {half ? (
              <>
                <defs>
                  <linearGradient id={`half-${i}`}>
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#e5e7eb" />
                  </linearGradient>
                </defs>
                <polygon
                  points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                  fill={`url(#half-${i})`}
                  stroke="#f59e0b" strokeWidth={1.5}
                />
              </>
            ) : (
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={filled ? '#f59e0b' : '#e5e7eb'}
                stroke={filled ? '#f59e0b' : '#d1d5db'} strokeWidth={1.5}
              />
            )}
          </svg>
        );
      })}
      {rating > 0 && (
        <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 2, fontWeight: 500 }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ─── Match Modal ──────────────────────────────────────────────────
function MatchModal({ listing, onClose, onDone }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function submit() {
    setLoading(true); setError('');
    try { await recyclersService.requestMatch(listing.id, message); onDone(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const phone = listing.seller?.phone;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 1000, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 16,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Request Collection</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>
          {listing.waste_type} · {listing.quantity_kg} kg · {listing.seller?.full_name}
        </div>

        {phone && (
          <a href={`tel:${phone}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: '#2A6A2A',
            textDecoration: 'none', marginBottom: 16,
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
              stroke="#2A6A2A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
            </svg>
            {phone}
          </a>
        )}

        {error && <div className="alert alert-warn" style={{ marginBottom: 12 }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Message to Seller (optional)</label>
          <textarea className="form-input" rows={3} value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Introduce yourself or mention your capacity…" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={submit}>Send Request</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────
function ListingCard({ listing, userRole, onRequestMatch }) {
  const primaryImage = listing.listing_images?.find(i => i.is_primary) || listing.listing_images?.[0];
  const phone        = listing.seller?.phone;
  const rating       = listing.seller?.rating;

  // Normalise status — backend uses 'active' for verified listings
  const isVerified = listing.status === 'verified';
  const badgeText  = isVerified ? 'verified' : listing.status;
  const badgeColor = isVerified ? 'olive' : 'warn';

  return (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', padding: 0,
    }}>

      {/* Image */}
      <div style={{
        height: 160, background: 'var(--olive-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {primaryImage
          ? <img src={primaryImage.url} alt={listing.waste_type}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Icon name="recycle" size={40} color="var(--olive-muted)" />
        }
      </div>

      {/* Body */}
      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Title + badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{listing.waste_type}</div>
            {listing.subtype && (
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{listing.subtype}</div>
            )}
          </div>
          <Badge color={badgeColor}>{badgeText}</Badge>
        </div>

        {/* Qty + price */}
        <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text2)' }}>
          <span>{listing.quantity_kg} kg</span>
          {listing.price_per_kg && <span>KES {listing.price_per_kg}/kg</span>}
        </div>

        {/* Condition */}
        {listing.condition && (
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{listing.condition}</div>
        )}

        {/* ── AI Verification Scores ── */}
        {listing.vision_confidence && (
          <div style={{
            background: '#f0f5ec',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 11,
          }}>
            {/* Section label */}
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--olive-deep)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 6,
            }}>
              AI Verification Scores
            </div>

            {/* Confidence bar */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ color: 'var(--text3)' }}>Confidence</span>
                <span style={{
                  fontWeight: 700,
                  color: listing.vision_confidence >= 85 ? '#2A6A2A' : '#C06010',
                }}>
                  {listing.vision_confidence}%
                </span>
              </div>
              <div style={{ height: 4, background: '#ddd', borderRadius: 2 }}>
                <div style={{
                  height: 4, borderRadius: 2,
                  width: `${listing.vision_confidence}%`,
                  background: listing.vision_confidence >= 85 ? '#2A6A2A' : '#C06010',
                }} />
              </div>
            </div>

            {/* Quality + Consistency inline */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              {listing.vision_quality && (
                <span style={{ color: 'var(--text3)' }}>
                  📸 Quality:&nbsp;
                  <strong style={{ color: 'var(--olive-deep)' }}>
                    {listing.vision_quality}%
                  </strong>
                </span>
              )}
              {listing.vision_consistency && (
                <span style={{ color: 'var(--text3)' }}>
                  🔄 Consistency:&nbsp;
                  <strong style={{ color: 'var(--olive-deep)' }}>
                    {listing.vision_consistency}%
                  </strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Seller row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', background: 'var(--olive-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, flexShrink: 0,
          }}>
            {(listing.seller?.full_name || 'U')[0]}
          </div>
          <span style={{ fontWeight: 500 }}>{listing.seller?.full_name}</span>
          {listing.seller?.location && <span>· {listing.seller.location}</span>}
        </div>

        {/* Star rating */}
        {rating != null && <StarRating value={rating} />}

        {/* Phone — tap to call */}
        {phone && (
          <a href={`tel:${phone}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: '#2A6A2A',
            textDecoration: 'none', padding: '4px 0',
          }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
              stroke="#2A6A2A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
            </svg>
            {phone}
          </a>
        )}

        {/* Request Collection button */}
        {userRole === 'recycler' && isVerified && (
          <Button
            variant="primary" size="sm" full
            onClick={() => onRequestMatch(listing)}
            style={{ marginTop: 4 }}
          >
            Request Collection
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Feed Page ────────────────────────────────────────────────────
export default function ListingsFeed({ onNavigate }) {
  const { user } = useAuth();
  const userRole = user?.role || 'seller';

  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [totalPages, setTP]     = useState(1);
  const [filters, setFilters] = useState({ waste_type: '', status: 'verified' });
  const [matchListing, setML]   = useState(null);
  const [successMsg, setSuccess]= useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 12, ...filters };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    listingsService.getFeed(params)
      .then(data => {
        setListings(Array.isArray(data) ? data : data?.data ?? []);
        if (data?.meta) setTP(data.meta.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  function handleMatchDone() {
    setML(null);
    setSuccess('Match request sent! The seller will be notified.');
    setTimeout(() => setSuccess(''), 4000);
  }

  return (
    <div className="page">
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-heading">Browse Listings</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            {userRole === 'recycler' ? 'Find materials to collect' : 'See what others are listing'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{
        marginBottom: 20, padding: '14px 16px',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <select className="form-input" style={{ width: 160 }}
          value={filters.waste_type}
          onChange={e => setFilters(f => ({ ...f, waste_type: e.target.value }))}>
          <option value="">All Types</option>
          {WASTE_TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="form-input" style={{ width: 160 }}
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="matched">Matched</option>
          <option value="pending_verification">Pending</option>
        </select>
        <Button variant="secondary" size="sm"
          onClick={() => { setFilters({ waste_type: '', status: 'verified' }); setPage(1); }}>
          Clear
        </Button>
      </div>

      {successMsg && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>{successMsg}</div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size={32} />
        </div>
      ) : listings.length === 0 ? (
        <EmptyState icon="recycle" title="No listings found" message="Try adjusting the filters above." />
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {listings.map(l => (
              <ListingCard
                key={l.id}
                listing={l}
                userRole={userRole}
                onRequestMatch={setML}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <Button variant="secondary" size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}>
                Prev
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text3)' }}>
                {page} / {totalPages}
              </span>
              <Button variant="secondary" size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {matchListing && (
        <MatchModal
          listing={matchListing}
          onClose={() => setML(null)}
          onDone={handleMatchDone}
        />
      )}
    </div>
  );
}