import React, { useState, useEffect } from 'react';
import { Badge, Spinner, EmptyState, Button } from '../common';

import { transactionsService } from '../../services/index';
import { useAuth } from '../../context/AuthContext';

const STATUS_TRANSITIONS = {
  seller:   { initiated: ['cancelled'], confirmed: ['disputed'], completed: [], cancelled: [], disputed: [] },
  recycler: { initiated: ['confirmed', 'cancelled'], confirmed: ['completed'], completed: [], cancelled: [], disputed: ['completed'] },
};

const STATUS_COLOR = {
  initiated:  'warn',
  pending:    'warn',
  confirmed:  'blue',
  completed:  'olive',
  disputed:   'red',
  cancelled:  'gray',
};

function RatingModal({ tx, user, onClose, onDone }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const rateeId = user.id === tx.seller_id ? tx.recycler_id : tx.seller_id;

  async function submit() {
    setLoading(true);
    try {
      await transactionsService.rate(tx.id, { ratee_id: rateeId, score, comment });
      onDone();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 380, padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Rate this Transaction</div>
        <div className="form-group">
          <label className="form-label">Score (1–5)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setScore(n)} style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${score === n ? 'var(--olive)' : 'var(--border)'}`, background: score === n ? 'var(--olive-bg)' : 'var(--white)', cursor: 'pointer', fontWeight: 700, color: score === n ? 'var(--olive-deep)' : 'var(--text)' }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Comment</label>
          <textarea className="form-input" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional feedback…" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={submit}>Submit Rating</Button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { user } = useAuth();
  const role = user?.role || 'seller';

  const [transactions, setTxs]  = useState([]);
  const [stats, setStats]       = useState(null);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [ratingTx, setRatingTx] = useState(null);
  const [actionLoading, setAL]  = useState({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      transactionsService.getAll(),
      transactionsService.getStats(),
    ]).then(([txData, statsData]) => {
      setTxs(Array.isArray(txData) ? txData : txData?.data ?? []);
      setStats(statsData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.status === filter);

  async function handleTransition(txId, newStatus) {
    setAL(prev => ({ ...prev, [txId]: true }));
    try {
      const updated = await transactionsService.updateStatus(txId, { status: newStatus });
      setTxs(prev => prev.map(t => t.id === txId ? { ...t, ...updated } : t));
    } catch (e) { alert(e.message); } finally {
      setAL(prev => ({ ...prev, [txId]: false }));
    }
  }

  return (
    <div className="page">
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-heading">Transactions</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Your complete recycling &amp; payout history</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'initiated', 'confirmed', 'completed', 'disputed', 'cancelled'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total',        val: stats.total || 0 },
            { label: 'Completed',    val: stats.completed || 0 },
            { label: 'Pending',      val: stats.pending || 0 },
            { label: 'Total Value',  val: `KES ${(stats.totalValue || 0).toLocaleString()}` },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-val" style={{ fontSize: 20 }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="txn" title="No transactions" message="Transactions will appear here once you start trading." />
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  {['Waste Type', 'Qty', 'Amount', 'Counterparty', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const allowed = STATUS_TRANSITIONS[role]?.[tx.status] || [];
                  const counterparty = role === 'seller' ? tx.recycler : tx.seller;
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{tx.waste_type || tx.listing?.waste_type}</div>
                        {tx.listing?.subtype && <div style={{ color: 'var(--text3)', fontSize: 11 }}>{tx.listing.subtype}</div>}
                      </td>
                      <td style={{ padding: '12px' }}>{tx.quantity_kg} kg</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>KES {Number(tx.total_amount || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>{counterparty?.full_name || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <Badge color={STATUS_COLOR[tx.status] || 'gray'}>{tx.status}</Badge>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text3)' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {allowed.map(s => (
                            <button key={s} disabled={actionLoading[tx.id]}
                              onClick={() => handleTransition(tx.id, s)}
                              className={`btn btn-sm ${s === 'cancelled' || s === 'disputed' ? 'btn-secondary' : 'btn-primary'}`}>
                              {actionLoading[tx.id] ? '…' : s}
                            </button>
                          ))}
                          {tx.status === 'completed' && !tx.ratings?.find(r => r.rater_id === user?.id) && (
                            <button className="btn btn-sm btn-secondary" onClick={() => setRatingTx(tx)}>
                              Rate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ratingTx && (
        <RatingModal
          tx={ratingTx}
          user={user}
          onClose={() => setRatingTx(null)}
          onDone={() => { setRatingTx(null); }}
        />
      )}
    </div>
  );
}
