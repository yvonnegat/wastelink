import React, { useState, useEffect } from 'react';
import { Badge, Spinner, EmptyState, Button } from '../common';
import Icon from '../common/Icon';
import { recyclersService } from '../../services/index';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLOR = { proposed: 'warn', accepted: 'olive', rejected: 'red' };

export default function MatchesPage({ onNavigate }) {
  const { user } = useAuth();
  const role = user?.role || 'seller';

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setAL] = useState({});
  const [error, setError]      = useState('');

  useEffect(() => {
    setLoading(true);
    const fn = role === 'recycler'
      ? recyclersService.getIncomingMatches()
      : recyclersService.getOutgoingMatches();
    fn.then(data => setMatches(Array.isArray(data) ? data : data?.data ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [role]);

  async function handleRespond(matchId, status) {
    setAL(prev => ({ ...prev, [matchId]: true }));
    try {
      const updated = await recyclersService.respondToMatch(matchId, { status });
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...updated } : m));
    } catch (e) { setError(e.message); }
    finally { setAL(prev => ({ ...prev, [matchId]: false })); }
  }

  return (
    <div className="page">
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-heading">{role === 'recycler' ? 'My Collection Requests' : 'Match Proposals'}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            {role === 'recycler' ? 'Listings you have requested to collect' : 'Recyclers interested in your listings'}
          </div>
        </div>
        {role === 'recycler' && (
          <Button variant="primary" onClick={() => onNavigate('listings')}>Browse Listings</Button>
        )}
      </div>

      {error && <div className="alert alert-warn" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={32} /></div>
      ) : matches.length === 0 ? (
        <EmptyState icon="link" title="No matches yet"
          message={role === 'recycler' ? 'Browse listings and send collection requests.' : 'Recyclers will appear here once they request your listings.'}
          action={role === 'recycler' ? <Button variant="primary" onClick={() => onNavigate('listings')}>Browse Listings</Button> : null} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matches.map(m => {
            const listing = m.listing || {};
            const party = role === 'recycler' ? m.seller : m.recycler;
            const primaryImg = listing.listing_images?.find(i => i.is_primary) || listing.listing_images?.[0];

            return (
              <div key={m.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Listing image thumbnail */}
                <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--olive-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {primaryImg ? <img src={primaryImg.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Icon name="recycle" size={28} color="var(--olive-muted)" />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{listing.waste_type} {listing.subtype ? `— ${listing.subtype}` : ''}</div>
                      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{listing.quantity_kg} kg</div>
                    </div>
                    <Badge color={STATUS_COLOR[m.status] || 'gray'}>{m.status}</Badge>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                    <span style={{ fontWeight: 500 }}>{role === 'recycler' ? 'Seller: ' : 'Recycler: '}</span>
                    {party?.full_name || '—'}
                    {party?.location && ` · ${party.location}`}
                  </div>

                  {m.message && (
                    <div style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 8 }}>"{m.message}"</div>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                    Requested {new Date(m.created_at).toLocaleDateString()}
                  </div>

                  {/* Seller responds to proposed matches */}
                  {role === 'seller' && m.status === 'proposed' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="primary" size="sm" loading={actionLoading[m.id]}
                        onClick={() => handleRespond(m.id, 'accepted')}>Accept</Button>
                      <Button variant="secondary" size="sm" loading={actionLoading[m.id]}
                        onClick={() => handleRespond(m.id, 'rejected')}>Decline</Button>
                    </div>
                  )}

                  {m.status === 'accepted' && (
                    <Button variant="secondary" size="sm" onClick={() => onNavigate('transactions')}>View Transaction →</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
