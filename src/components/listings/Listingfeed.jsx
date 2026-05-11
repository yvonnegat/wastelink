import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Spinner, EmptyState, Button } from '../common';
import Icon from '../common/Icon';
import { listingsService } from '../../services/ListingService';
import { recyclersService } from '../../services/index';
import { useAuth } from '../../context/AuthContext';

const WASTE_TYPE_OPTIONS = ['Plastic', 'Paper', 'Metal', 'Glass', 'Organic', 'E-Waste', 'Textile', 'Rubber'];

function MatchModal({ listing, onClose, onDone }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  async function submit() {
    setLoading(true); setError('');
    try { await recyclersService.requestMatch(listing.id, message); onDone(); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Request Match</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>{listing.waste_type} · {listing.quantity_kg} kg · {listing.seller?.full_name}</div>
        {error && <div className="alert alert-warn" style={{ marginBottom: 12 }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Message to Seller (optional)</label>
          <textarea className="form-input" rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Introduce yourself or mention your capacity…" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={submit}>Send Request</Button>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing, userRole, onRequestMatch }) {
  const primaryImage = listing.listing_images?.find(i => i.is_primary) || listing.listing_images?.[0];
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      <div style={{ height: 160, background: 'var(--olive-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {primaryImage ? <img src={primaryImage.url} alt={listing.waste_type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Icon name="recycle" size={40} color="var(--olive-muted)" />}
      </div>
      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{listing.waste_type}</div>
            {listing.subtype && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{listing.subtype}</div>}
          </div>
          <Badge color={listing.status === 'verified' ? 'olive' : 'warn'}>{listing.status}</Badge>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text2)' }}>
          <span>{listing.quantity_kg} kg</span>
          {listing.price_per_kg && <span>KES {listing.price_per_kg}/kg</span>}
        </div>
        {listing.condition && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{listing.condition}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--olive-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
            {(listing.seller?.full_name || 'U')[0]}
          </div>
          <span>{listing.seller?.full_name}</span>
          {listing.seller?.location && <span>· {listing.seller.location}</span>}
        </div>
        {userRole === 'recycler' && listing.status === 'verified' && (
          <Button variant="primary" size="sm" full onClick={() => onRequestMatch(listing)} style={{ marginTop: 4 }}>Request Collection</Button>
        )}
      </div>
    </div>
  );
}

export default function ListingsFeed({ onNavigate }) {
  const { user } = useAuth();
  const userRole = user?.role || 'seller';
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [totalPages, setTP]     = useState(1);
  const [filters, setFilters]   = useState({ waste_type: '', status: 'verified' });
  const [matchListing, setML]   = useState(null);
  const [successMsg, setSuccess]= useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 12, ...filters };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    listingsService.getFeed(params)
      .then(data => { setListings(Array.isArray(data) ? data : data?.data ?? []); if (data?.meta) setTP(data.meta.pages || 1); })
      .catch(() => {}).finally(() => setLoading(false));
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
      <div className="card" style={{ marginBottom: 20, padding: '14px 16px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-input" style={{ width: 160 }} value={filters.waste_type} onChange={e => setFilters(f => ({ ...f, waste_type: e.target.value }))}>
          <option value="">All Types</option>
          {WASTE_TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="form-input" style={{ width: 160 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="matched">Matched</option>
          <option value="pending_verification">Pending</option>
        </select>
        <Button variant="secondary" size="sm" onClick={() => { setFilters({ waste_type: '', status: 'verified' }); setPage(1); }}>Clear</Button>
      </div>
      {successMsg && <div className="alert alert-info" style={{ marginBottom: 16 }}>{successMsg}</div>}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={32} /></div>
      ) : listings.length === 0 ? (
        <EmptyState icon="recycle" title="No listings found" message="Try adjusting the filters above." />
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {listings.map(l => <ListingCard key={l.id} listing={l} userRole={userRole} onRequestMatch={setML} />)}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text3)' }}>{page} / {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
      {matchListing && <MatchModal listing={matchListing} onClose={() => setML(null)} onDone={handleMatchDone} />}
    </div>
  );
}
