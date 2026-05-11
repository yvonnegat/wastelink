import React, { useEffect, useState } from 'react';
import Icon from '../common/Icon';
import { Badge, Spinner } from '../common';
import { transactionsService, recyclersService } from '../../services/index';

export default function RecyclerDashboard({ user, onNavigate }) {
  const [stats, setStats]     = useState(null);
  const [matches, setMatches] = useState([]);
  
  const [loading, setLoading] = useState(true);

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    Promise.all([
      transactionsService.getStats().catch(() => null),
      recyclersService.getIncomingMatches({ limit: 5 }).catch(() => null),
      null,
    ]).then(([s, m]) => {
      setStats(s);
      setMatches(Array.isArray(m) ? m : m?.data ?? []);
      
    }).finally(() => setLoading(false));
  }, []);

  const pendingMatches = matches.filter(m => m.status === 'proposed').length;

  return (
    <div className="page">
      <div className="hero-strip">
        <div className="hero-title">Welcome back, {firstName} ♻️</div>
        <div className="hero-sub">Find and collect recyclable materials from sellers near you.</div>
        <div className="hero-btns">
          <button className="hero-btn-solid" onClick={() => onNavigate('listings')}>Browse Listings</button>
          <button className="hero-btn-white" onClick={() => onNavigate('matches')}>My Requests</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={28} /></div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Materials Collected', val: stats?.totalVolume ? `${stats.totalVolume} kg` : '0 kg', icon: 'recycle', accent: true },
            { label: 'Total Paid',          val: `KES ${(stats?.totalValue || 0).toLocaleString()}`,      icon: 'dollar' },
            { label: 'Completed',           val: stats?.completed || 0,                                    icon: 'check' },
            { label: 'Active Requests',     val: pendingMatches,                                           icon: 'link' },
          ].map((s, i) => (
            <div key={i} className={`stat-card${s.accent ? ' accent' : ''}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-val">{s.val}</div>
              <div className="stat-icon"><Icon name={s.icon} size={18} color="var(--olive)" strokeWidth={1.8} /></div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Quick actions */}
        <div className="card">
          <div className="section-hd"><div className="section-title">Quick Actions</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Browse Listings', icon: 'recycle', color: '#D4E8B0', page: 'listings' },
              { label: 'My Requests',     icon: 'link',    color: '#C8DFF0', page: 'matches' },
              { label: 'Transactions',    icon: 'txn',     color: '#F0E0C8', page: 'transactions' },
              { label: 'My Profile',      icon: 'user',    color: '#E8D0D0', page: 'profile' },
            ].map((qa, i) => (
              <div key={i} className="quick-action" onClick={() => onNavigate(qa.page)}>
                <div className="qa-icon" style={{ background: qa.color }}>
                  <Icon name={qa.icon} size={20} color="var(--olive-deep)" strokeWidth={1.8} />
                </div>
                <div className="qa-label">{qa.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending match requests */}
        <div className="card">
          <div className="section-hd">
            <div className="section-title">My Requests</div>
            <button className="link-btn" onClick={() => onNavigate('matches')}>View all →</button>
          </div>
          {matches.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No requests yet</div>
          ) : matches.slice(0, 4).map((m, i) => (
            <div key={i} className="tx-item">
              <div className="tx-icon" style={{ background: 'var(--olive-bg)' }}>
                <Icon name="recycle" size={16} color="var(--olive)" strokeWidth={2} />
              </div>
              <div className="tx-info">
                <div className="tx-type">{m.listing?.waste_type || 'Listing'}</div>
                <div className="tx-date">{m.listing?.quantity_kg} kg · {m.seller?.full_name}</div>
              </div>
              <Badge color={m.status === 'accepted' ? 'olive' : m.status === 'rejected' ? 'red' : 'warn'}>{m.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
