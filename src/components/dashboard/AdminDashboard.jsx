import React, { useEffect, useState } from 'react';
import Icon from '../common/Icon';
import { Spinner, Badge, Button } from '../common';
import { adminService } from '../../services/index';

export default function AdminDashboard({ user, onNavigate }) {
  const [stats, setStats]       = useState(null);
  const [listings, setListings] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [broadcastForm, setBF]  = useState({ title: '', body: '', role: '' });
  const [sending, setSending]   = useState(false);
  const [sentMsg, setSentMsg]   = useState('');

  useEffect(() => {
    Promise.all([
      adminService.getStats().catch(() => null),
      adminService.getListings({ limit: 20 }).catch(() => null),
      adminService.getUsers({ limit: 5 }).catch(() => null),
    ]).then(([s, l, u]) => {
      setStats(s);
      setListings(Array.isArray(l) ? l : l?.data ?? []);
      setUsers(Array.isArray(u) ? u : u?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleVerify(listingId) {
    try {
      await adminService.verifyListing(listingId, { vision_verdict: 'verified' });
      setListings(prev => prev.filter(l => l.id !== listingId));
    } catch (e) { alert(e.message); }
  }

  async function handleBroadcast() {
    if (!broadcastForm.title || !broadcastForm.body) return;
    setSending(true);
    try {
      const res = await adminService.broadcastNotification(broadcastForm);
      setSentMsg(`Notification sent to ${res?.sent || 0} users.`);
      setBF({ title: '', body: '', role: '' });
    } catch (e) { alert(e.message); } finally { setSending(false); }
  }

  return (
    <div className="page">
      <div className="hero-strip" style={{ background: 'linear-gradient(135deg, var(--olive-deep) 0%, var(--olive) 100%)' }}>
        <div className="hero-title">Admin Dashboard 🛡️</div>
        <div className="hero-sub">Platform oversight, verification, and management</div>
        <div className="hero-btns">
          <button className="hero-btn-solid" onClick={() => onNavigate('admin')}>Open Admin Panel</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={28} /></div>
      ) : stats && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Users',    val: stats.users?.total || 0,        icon: 'user',    accent: true },
            { label: 'Total Listings', val: stats.listings?.total || 0,     icon: 'recycle' },
            { label: 'Transactions',   val: stats.transactions?.total || 0, icon: 'txn' },
            { label: 'Revenue (KES)',  val: `${(stats.revenue?.total || 0).toLocaleString()}`, icon: 'dollar' },
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
        {/* Listings awaiting verification */}
        <div className="card">
          <div className="section-hd">
            <div className="section-title">Listings Queue</div>
            <button className="link-btn" onClick={() => onNavigate('admin')}>View all →</button>
          </div>

          {/* Auto-approved by CV */}
<div className="card" style={{ marginTop: 16 }}>
  <div className="section-hd">
    <div className="section-title">Auto-Approved by AI ✓</div>
  </div>
  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
    These listings passed CV verification automatically and are live on the marketplace.
  </div>
  {listings
    .filter(l => l.status === 'active' && l.vision_verdict === 'verified')
    .length === 0 ? (
    <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
      No auto-approved listings yet
    </div>
  ) : listings
    .filter(l => l.status === 'active' && l.vision_verdict === 'verified')
    .map((l, i, arr) => (
      <div key={i} style={{
        padding: '12px 0',
        borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {l.waste_type} — {l.quantity_kg} kg
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {l.seller?.full_name} · {new Date(l.created_at).toLocaleDateString()}
            </div>
          </div>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 12,
            background: '#E8F5E9', color: '#2A6A2A', fontWeight: 600,
          }}>
            AI Verified ✓
          </span>
        </div>
        {l.vision_confidence && (
          <div style={{
            background: '#f5f5f5', borderRadius: 6,
            padding: '6px 10px', fontSize: 11,
            display: 'flex', gap: 16,
          }}>
            <span>🎯 Confidence: <strong style={{ color: '#2A6A2A' }}>{l.vision_confidence}%</strong></span>
            {l.vision_quality && <span>📸 Quality: <strong>{l.vision_quality}%</strong></span>}
            {l.vision_consistency && <span>🔄 Consistency: <strong>{l.vision_consistency}%</strong></span>}
          </div>
        )}
      </div>
    ))
  }
</div>
          {listings.length === 0 ? (
  <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
    All listings verified ✓
  </div>
) : listings.map((l, i) => (
  <div key={i} style={{
    padding: '12px 0',
    borderBottom: i < listings.length - 1 ? '1px solid var(--border)' : 'none',
  }}>
    {/* Header row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>
          {l.waste_type} — {l.quantity_kg} kg
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          {l.seller?.full_name} · {new Date(l.created_at).toLocaleDateString()}
        </div>
      </div>
      {/* CV verdict badge */}
      {l.vision_verdict && (
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 12,
          fontWeight: 600,
          background: l.vision_verdict === 'verified'       ? '#E8F5E9'
                    : l.vision_verdict === 'low_confidence' ? '#FFF8E1'
                    : '#FFEBEE',
          color:       l.vision_verdict === 'verified'       ? '#2A6A2A'
                    : l.vision_verdict === 'low_confidence' ? '#7A5A00'
                    : '#8A2020',
        }}>
          {l.vision_verdict === 'verified'       ? 'AI Verified'
         : l.vision_verdict === 'low_confidence' ? 'Low Confidence'
         : 'Flagged'}
        </span>
      )}
      <Button variant="primary" size="sm" onClick={() => handleVerify(l.id)}>
        Approve
      </Button>
    </div>

    {/* CV scores — shown when available */}
    {l.vision_confidence && (
      <div style={{
        background: '#f5f5f5',
        borderRadius: 6,
        padding: '8px 10px',
        fontSize: 11,
      }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>
            🎯 Confidence:&nbsp;
            <strong style={{ color: l.vision_confidence >= 85 ? '#2A6A2A' : '#C06010' }}>
              {l.vision_confidence}%
            </strong>
          </span>
          {l.vision_quality && (
            <span>
              📸 Quality:&nbsp;
              <strong>{l.vision_quality}%</strong>
            </span>
          )}
          {l.vision_consistency && (
            <span>
              🔄 Consistency:&nbsp;
              <strong>{l.vision_consistency}%</strong>
            </span>
          )}
        </div>
        {l.vision_notes && (
          <div style={{ marginTop: 4, color: '#666', fontStyle: 'italic' }}>
            {l.vision_notes}
          </div>
        )}
      </div>
    )}
  </div>
))}
        </div>

        {/* Recent users */}
        <div className="card">
          <div className="section-hd">
            <div className="section-title">Recent Users</div>
            <button className="link-btn" onClick={() => onNavigate('admin')}>View all →</button>
          </div>
          {users.map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--olive-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--olive-deep)', flexShrink: 0 }}>
                {(u.full_name || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{u.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
              </div>
              <Badge color={u.role === 'admin' ? 'red' : u.role === 'recycler' ? 'blue' : 'olive'}>{u.role}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Broadcast notification */}
      <div className="card">
        <div className="section-hd" style={{ marginBottom: 16 }}>
          <div className="section-title">Broadcast Notification</div>
        </div>
        {sentMsg && <div className="alert alert-info" style={{ marginBottom: 12 }}>{sentMsg}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Title</label>
            <input className="form-input" value={broadcastForm.title} onChange={e => setBF(f => ({ ...f, title: e.target.value }))} placeholder="Notification title" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Message</label>
            <input className="form-input" value={broadcastForm.body} onChange={e => setBF(f => ({ ...f, body: e.target.value }))} placeholder="Message body" />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="form-input" style={{ width: 120 }} value={broadcastForm.role} onChange={e => setBF(f => ({ ...f, role: e.target.value }))}>
              <option value="">All Users</option>
              <option value="seller">Sellers</option>
              <option value="recycler">Recyclers</option>
            </select>
            <Button variant="primary" loading={sending} onClick={handleBroadcast}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );



}
