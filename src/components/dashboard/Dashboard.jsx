import React from 'react';
import Icon from '../common/Icon';
import { Badge } from '../common';
import { MOCK_TRANSACTIONS } from '../../data/mockData';

const STATS = [
  { label: 'Total Sold',       val: '320 kg',      change: '↑ 12% this month', icon: 'recycle', accent: true },
  { label: 'Earnings',         val: 'KES 18,400',  change: '↑ 8% this month',  icon: 'dollar' },
  { label: 'Transactions',     val: '24',          change: '5 this week',       icon: 'txn' },
  { label: 'Recyclers Nearby', val: '6',           change: 'Within 10 km',      icon: 'map' },
];

const QUICK_ACTIONS = [
  { label: 'List Waste',       icon: 'upload',  color: '#D4E8B0', page: 'listing' },
  { label: 'View Prices',      icon: 'dollar',  color: '#C8DFF0', page: 'pricing' },
  { label: 'Find Recyclers',   icon: 'map',     color: '#F0E0C8', page: 'map' },
  { label: 'My Transactions',  icon: 'txn',     color: '#E8D0D0', page: 'transactions' },
];

export default function Dashboard({ user, onNavigate }) {
  const firstName = user?.name?.split(' ')[0] || 'there';

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
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {STATS.map((s, i) => (
          <div key={i} className={`stat-card${s.accent ? ' accent' : ''}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-change">{s.change}</div>
            <div className="stat-icon">
              <Icon name={s.icon} size={18} color="var(--olive)" strokeWidth={1.8} />
            </div>
          </div>
        ))}
      </div>

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
          {MOCK_TRANSACTIONS.slice(0, 4).map((tx, i) => (
            <div key={i} className="tx-item">
              <div className="tx-icon" style={{ background: tx.status === 'completed' ? '#E0F0E0' : '#FFF0C0' }}>
                <Icon
                  name={tx.status === 'completed' ? 'check' : 'alert'}
                  size={16}
                  color={tx.status === 'completed' ? '#2A6A2A' : '#806010'}
                  strokeWidth={2}
                />
              </div>
              <div className="tx-info">
                <div className="tx-title">{tx.type}</div>
                <div className="tx-sub">{tx.date} · {tx.recycler}</div>
              </div>
              <div>
                <div className="tx-amount">{tx.price}</div>
                <Badge color={tx.status === 'completed' ? 'green' : 'yellow'} dot>
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert */}
      <div className="alert alert-info">
        <Icon name="info" size={16} style={{ flexShrink: 0 }} />
        <span>
          3 recyclers near you are currently accepting plastic.{' '}
          <span style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate('map')}>
            Connect now →
          </span>
        </span>
      </div>
    </div>
  );
}
