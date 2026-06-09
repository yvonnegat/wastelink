import React, { useState, useEffect } from 'react';
import { Badge, Spinner, EmptyState, Button } from '../common';

import { transactionsService } from '../../services/index';
import { useAuth } from '../../context/AuthContext';

// Which status transitions each role can trigger from a given status
const STATUS_TRANSITIONS = {
  seller:   {
    initiated: ['cancelled'],
    confirmed: ['disputed'],
    completed: [],
    cancelled: [],
    disputed:  [],
  },
  recycler: {
    initiated: ['confirmed', 'cancelled'],
    confirmed: ['completed'],
    completed: [],
    cancelled: [],
    disputed:  ['completed'],
  },
};

// Human-readable labels for action buttons
const ACTION_LABELS = {
  confirmed:  'Confirm Pickup',
  completed:  'Mark as Paid & Collected',
  cancelled:  'Cancel',
  disputed:   'Raise Dispute',
};

// Confirmation prompts shown before sensitive transitions
const ACTION_CONFIRM = {
  completed: 'Confirm that cash payment has been made and waste has been collected?',
  cancelled: 'Are you sure you want to cancel this transaction?',
  disputed:  'Are you sure you want to raise a dispute on this transaction?',
};

const STATUS_COLOR = {
  initiated:  'warn',
  pending:    'warn',
  confirmed:  'blue',
  completed:  'olive',
  disputed:   'red',
  cancelled:  'gray',
};

// Human-readable status labels shown in the badge
const STATUS_LABELS = {
  initiated:  'Initiated',
  confirmed:  'Pickup Confirmed',
  completed:  'Paid & Collected',
  disputed:   'Disputed',
  cancelled:  'Cancelled',
};

// ─── Rating Modal ────────────────────────────────────────────────────────────

function RatingModal({ tx, user, onClose, onDone }) {
  const [score, setScore]     = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const rateeId = user.id === tx.seller_id ? tx.recycler_id : tx.seller_id;
  const rateeName = user.id === tx.seller_id
    ? (tx.recycler?.full_name || 'the recycler')
    : (tx.seller?.full_name   || 'the seller');

  async function submit() {
    setLoading(true);
    try {
      await transactionsService.rate(tx.id, { ratee_id: rateeId, score, comment });
      onDone(tx.id);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="card" style={{ width: 400, padding: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
          Rate this Transaction
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          How was your experience with {rateeName}?
        </div>

        {/* Score selector */}
        <div className="form-group">
          <label className="form-label">Score</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setScore(n)}
                title={['Poor', 'Fair', 'Good', 'Great', 'Excellent'][n - 1]}
                style={{
                  width: 44, height: 44,
                  borderRadius: 10,
                  border: `2px solid ${score === n ? 'var(--olive)' : 'var(--border)'}`,
                  background: score === n ? 'var(--olive-bg)' : 'var(--white)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 16,
                  color: score === n ? 'var(--olive-deep)' : 'var(--text)',
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][score]}
          </div>
        </div>

        {/* Comment */}
        <div className="form-group">
          <label className="form-label">Comment <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(optional)</span></label>
          <textarea
            className="form-input"
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share any feedback about this transaction…"
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={submit}>Submit Rating</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Status Timeline ─────────────────────────────────────────────

function StatusTimeline({ status }) {
  const steps = ['initiated', 'confirmed', 'completed'];
  const terminalNeg = status === 'cancelled' || status === 'disputed';
  const currentIdx = steps.indexOf(status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 11 }}>
      {steps.map((step, i) => {
        const done    = !terminalNeg && currentIdx >= i;
        const active  = !terminalNeg && currentIdx === i;
        return (
          <React.Fragment key={step}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: done ? 'var(--olive)' : 'var(--border)',
                border: active ? '2px solid var(--olive-deep)' : 'none',
                flexShrink: 0,
              }} />
              <span style={{
                color: done ? 'var(--olive-deep)' : 'var(--text3)',
                fontWeight: active ? 700 : 400,
                whiteSpace: 'nowrap',
              }}>
                {step === 'confirmed' ? 'Pickup' : step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: 1, width: 24, flexShrink: 0, marginBottom: 14,
                background: !terminalNeg && currentIdx > i ? 'var(--olive)' : 'var(--border)',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(t => t.status === filter);

  // Handle status transition with optional confirmation prompt
  async function handleTransition(txId, newStatus) {
    const confirmMsg = ACTION_CONFIRM[newStatus];
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setAL(prev => ({ ...prev, [txId]: true }));
    try {
      const updated = await transactionsService.updateStatus(txId, { status: newStatus });
      setTxs(prev => prev.map(t => t.id === txId ? { ...t, ...updated } : t));
    } catch (e) {
      alert(e.message);
    } finally {
      setAL(prev => ({ ...prev, [txId]: false }));
    }
  }

  // Called when a rating is submitted — patch local state so Rate button disappears
  function handleRatingDone(txId) {
    setRatingTx(null);
    setTxs(prev => prev.map(t =>
      t.id === txId
        ? { ...t, ratings: [...(t.ratings || []), { rater_id: user?.id }] }
        : t
    ));
  }

  // Check if current user has already rated a transaction
  function hasRated(tx) {
    return !!(tx.ratings || []).find(r => r.rater_id === user?.id);
  }

  const filterLabels = ['all', 'initiated', 'confirmed', 'completed', 'disputed', 'cancelled'];

  return (
    <div className="page">

      {/* Header */}
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-heading">Transactions</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            Your complete recycling &amp; payout history
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filterLabels.map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : (STATUS_LABELS[f] || f.charAt(0).toUpperCase() + f.slice(1))}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total',       val: stats.total     || 0 },
            { label: 'Completed',   val: stats.completed || 0 },
            { label: 'Pending',     val: stats.pending   || 0 },
            { label: 'Total Value', val: `KES ${(stats.totalValue || 0).toLocaleString()}` },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-val" style={{ fontSize: 20 }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* How it works — cash flow explainer */}
      <div style={{
        background: 'var(--olive-bg)',
        border: '1px solid var(--olive-pale)',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 20,
        fontSize: 13,
        color: 'var(--olive-deep)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <span>
          <strong>Cash-on-pickup flow:</strong>&nbsp;
          {role === 'seller'
            ? 'Recyclers confirm pickup and mark transactions complete once cash is paid and waste collected. You can raise a dispute if something goes wrong.'
            : 'Confirm pickup when agreed, then mark complete once you\'ve paid cash and collected the waste.'
          }
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="txn"
          title="No transactions"
          message={
            filter === 'all'
              ? 'Transactions will appear here once you start trading.'
              : `No ${STATUS_LABELS[filter] || filter} transactions.`
          }
        />
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  {['Waste Type', 'Qty', 'Amount', 'Counterparty', 'Status', 'Date', 'Actions'].map(h => (
                    <th
                      key={h}
                      style={{ padding: '8px 12px', color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const allowed      = STATUS_TRANSITIONS[role]?.[tx.status] || [];
                  const counterparty = role === 'seller' ? tx.recycler : tx.seller;
                  const canRate      = tx.status === 'completed' && !hasRated(tx);

                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>

                      {/* Waste type */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>
                          {tx.waste_type || tx.listing?.waste_type}
                        </div>
                        {tx.listing?.subtype && (
                          <div style={{ color: 'var(--text3)', fontSize: 11 }}>
                            {tx.listing.subtype}
                          </div>
                        )}
                      </td>

                      {/* Qty */}
                      <td style={{ padding: '12px' }}>{tx.quantity_kg} kg</td>

                      {/* Amount */}
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        KES {Number(tx.total_amount || 0).toLocaleString()}
                      </td>

                      {/* Counterparty */}
                      <td style={{ padding: '12px' }}>
                        {counterparty?.full_name || '—'}
                      </td>

                      {/* Status + timeline */}
                      <td style={{ padding: '12px' }}>
                        <Badge color={STATUS_COLOR[tx.status] || 'gray'}>
                          {STATUS_LABELS[tx.status] || tx.status}
                        </Badge>
                        <div style={{ marginTop: 8 }}>
                          <StatusTimeline status={tx.status} />
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                        {new Date(tx.created_at).toLocaleDateString('en-KE', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {allowed.map(s => (
                            <button
                              key={s}
                              disabled={actionLoading[tx.id]}
                              onClick={() => handleTransition(tx.id, s)}
                              className={`btn btn-sm ${
                                s === 'cancelled' || s === 'disputed'
                                  ? 'btn-secondary'
                                  : 'btn-primary'
                              }`}
                              style={s === 'disputed' ? { color: 'var(--red)' } : {}}
                            >
                              {actionLoading[tx.id] ? '…' : (ACTION_LABELS[s] || s)}
                            </button>
                          ))}

                          {canRate && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => setRatingTx(tx)}
                            >
                              ⭐ Rate
                            </button>
                          )}

                          {tx.status === 'completed' && hasRated(tx) && (
                            <span style={{ fontSize: 12, color: 'var(--text3)', padding: '4px 0' }}>
                              ✓ Rated
                            </span>
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

      {/* Rating modal */}
      {ratingTx && (
        <RatingModal
          tx={ratingTx}
          user={user}
          onClose={() => setRatingTx(null)}
          onDone={handleRatingDone}
        />
      )}
    </div>
  );
}