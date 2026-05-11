import React, { useEffect, useState } from 'react';
import Icon from '../common/Icon';
import { Badge, Spinner } from '../common';
import { transactionsService } from '../../services/index';
import { listingsService } from '../../services/ListingService';

const QUICK_ACTIONS = [
  { label: 'List Waste',      icon: 'upload',  color: '#D4E8B0', page: 'listing' },
  { label: 'View Prices',     icon: 'dollar',  color: '#C8DFF0', page: 'pricing' },
  { label: 'Find Recyclers',  icon: 'map',     color: '#F0E0C8', page: 'map' },
  { label: 'Transactions',    icon: 'txn',     color: '#E8D0D0', page: 'transactions' },
];

const STATUS_COLOR = {
  completed: { bg: '#E0F0E0', color: '#2A6A2A' },
  initiated:  { bg: '#FFF0C0', color: '#806010' },
  confirmed:  { bg: '#D0E8FF', color: '#1050A0' },
  disputed:   { bg: '#FFE0D0', color: '#A03010' },
  cancelled:  { bg: '#EEE',   color: '#666' },
};

export default function SellerDashboard({ user, onNavigate }) {
  const [stats, setStats]           = useState(null);
  const [listings, setListings]     = useState([]);
  const [transactions, setTxs]      = useState([]);
  const [loading, setLoading]       = useState(true);

  const firstName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    Promise.all([
      transactionsService.getStats().catch(() => null),
      listingsService.getMyListings({ limit: 5 }).catch(() => null),
      transactionsService.getAll({ limit: 4 }).catch(() => null),
    ]).then(([s, l, t]) => {
      setStats(s);
      setListings(Array.isArray(l) ? l : l?.data ?? []);
      setTxs(Array.isArray(t) ? t : t?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero-strip">
        <div className="hero-title">Good morning, {firstName} 🌿</div>
        <div className="hero-sub">Your waste is someone's resource. Let's connect the dots.</div>
        <div className="hero-btns">
          <button className="hero-btn-solid" onClick={() => onNavigate('listing')}>+ List Waste</button>
          <button className="hero-btn-white" onClick={() => onNavigate('map')}>View Map</button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={28} /></div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Sold',     val: stats?.totalVolume ? `${stats.totalVolume} kg` : '0 kg', icon: 'recycle', accent: true },
            { label: 'Earnings',       val: `KES ${(stats?.totalValue || 0).toLocaleString()}`,       icon: 'dollar' },
            { label: 'Transactions',   val: stats?.total || 0,                                         icon: 'txn' },
            { label: 'Active Listings',val: listings.filter(l => !['completed','cancelled'].includes(l.status)).length, icon: 'list' },
          ].map((s, i) => (
            <div key={i} className={`stat-card${s.accent ? ' accent' : ''}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-val">{s.val}</div>
              <div className="stat-icon"><Icon name={s.icon} size={18} color="var(--olive)" strokeWidth={1.8} /></div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions + Recent activity */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-hd">
            <div className="section-title">Quick Actions</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK_ACTIONS.map((qa, i) => (
              <div key={i} className="quick-action" onClick={() => onNavigate(qa.page)}>
                <div className="qa-icon" style={{ background: qa.color }}>
                  <Icon name={qa.icon} size={20} color="var(--olive-deep)" strokeWidth={1.8} />
                </div>
                <div className="qa-label">{qa.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-hd">
            <div className="section-title">Recent Activity</div>
            <button className="link-btn" onClick={() => onNavigate('transactions')}>View all →</button>
          </div>
          {transactions.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No recent transactions</div>
          ) : transactions.map((tx, i) => {
            const sc = STATUS_COLOR[tx.status] || STATUS_COLOR.initiated;
            return (
              <div key={i} className="tx-item">
                <div className="tx-icon" style={{ background: sc.bg }}>
                  <Icon name={tx.status === 'completed' ? 'check' : 'txn'} size={16} color={sc.color} strokeWidth={2} />
                </div>
                <div className="tx-info">
                  <div className="tx-type">{tx.waste_type || tx.listing?.waste_type || 'Transaction'}</div>
                  <div className="tx-date">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="tx-amount">KES {Number(tx.total_amount || 0).toLocaleString()}</div>
                  <Badge color={tx.status === 'completed' ? 'olive' : 'warn'}>{tx.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Listings */}
      {listings.length > 0 && (
        <div className="card">
          <div className="section-hd">
            <div className="section-title">My Listings</div>
            <button className="link-btn" onClick={() => onNavigate('listing')}>Manage →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {listings.slice(0, 5).map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < listings.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--olive-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="recycle" size={18} color="var(--olive)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.waste_type} {l.subtype ? `— ${l.subtype}` : ''}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{l.quantity_kg} kg · {l.condition}</div>
                </div>
                <Badge color={l.status === 'verified' ? 'olive' : l.status === 'matched' ? 'blue' : 'warn'}>{l.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
