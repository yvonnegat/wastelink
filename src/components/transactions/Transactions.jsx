import React, { useState, useEffect } from 'react';
import { Badge, Spinner, EmptyState, Button } from '../common';
import { transactionsService } from '../../services/index';
import { useAuth } from '../../context/AuthContext';

// ── Who pays whom ─────────────────────────────────────────────────
// Seller  = waste generator. Lists waste. RECEIVES cash from recycler.
// Recycler = waste collector. Responds to listing. PAYS the seller & takes the waste.
//
// Flow:
//   1. Recycler requests collection  (match created → initiated)
//   2. Recycler arrives, pays seller, confirms pickup  (initiated → confirmed)
//   3. Seller confirms they received payment & waste was taken  (confirmed → completed)
//   4. Seller can cancel before recycler confirms
//   5. Either party can dispute after confirmation

const STATUS_TRANSITIONS = {
  seller: {
    initiated:  ['cancelled'],              // seller can cancel before recycler confirms
    confirmed:  ['completed', 'disputed'],  // seller confirms received payment + waste collected
    completed:  [],
    cancelled:  [],
    disputed:   ['completed'],              // seller can resolve a dispute
  },
  recycler: {
    initiated:  ['confirmed', 'cancelled'], // recycler confirms pickup & payment
    confirmed:  ['disputed'],               // recycler can dispute if something is wrong
    completed:  [],
    cancelled:  [],
    disputed:   ['completed'],              // recycler can resolve a dispute
  },
};

const ACTION_LABELS = {
  confirmed:  'Confirm Pickup & Payment',   // recycler: I arrived, paid, and collected
  completed:  'Confirm Received & Done',    // seller: I received payment, waste is gone
  cancelled:  'Cancel',
  disputed:   'Raise Dispute',
};

const ACTION_CONFIRM = {
  confirmed:  'Confirm that you have arrived, paid the seller, and collected the waste?',
  completed:  'Confirm that you have received the cash payment and the waste has been collected by the recycler?',
  cancelled:  'Are you sure you want to cancel this transaction?',
  disputed:   'Are you sure you want to raise a dispute on this transaction?',
};

const STATUS_COLOR = {
  initiated:  'warn',
  pending:    'warn',
  confirmed:  'blue',
  completed:  'olive',
  disputed:   'red',
  cancelled:  'gray',
};

const STATUS_LABELS = {
  initiated:  'Initiated',
  confirmed:  'Pickup Confirmed',
  completed:  'Completed',
  disputed:   'Disputed',
  cancelled:  'Cancelled',
};

// ── Role context banners ──────────────────────────────────────────
const ROLE_INFO = {
  seller: (
    <>
      <strong>Your role:</strong>&nbsp;
      You listed the waste. The recycler will come to collect it and
      <strong> pay you cash on pickup</strong>. Once the recycler confirms they've
      collected the waste and paid you, click <strong>Confirm Received &amp; Done</strong>
      to complete the transaction. You can cancel before the recycler confirms pickup.
    </>
  ),
  recycler: (
    <>
      <strong>Your role:</strong>&nbsp;
      You requested to collect this waste. When you arrive at the seller's location,
      <strong> pay the seller the agreed amount in cash</strong>, collect the waste,
      then click <strong>Confirm Pickup &amp; Payment</strong>. The seller will then
      confirm receipt and close the transaction.
    </>
  ),
};

// ─── Rating Modal ─────────────────────────────────────────────────
function RatingModal({ tx, user, onClose, onDone }) {
  const [score, setScore]     = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Seller rates the recycler; recycler rates the seller
  const isSeller  = user.id === tx.seller_id;
  const rateeId   = isSeller ? tx.recycler_id : tx.seller_id;
  const rateeName = isSeller
    ? (tx.recycler?.full_name || 'the recycler')
    : (tx.seller?.full_name   || 'the seller');

  // Safety guard — should never happen, but prevents self-rating
  if (rateeId === user.id) return null;

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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="card" style={{ width: 400, padding: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
          Rate this Transaction
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          How was your experience with {rateeName}?
        </div>

        <div className="form-group">
          <label className="form-label">Score</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setScore(n)}
                title={['Poor', 'Fair', 'Good', 'Great', 'Excellent'][n - 1]}
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  border: `2px solid ${score === n ? 'var(--olive)' : 'var(--border)'}`,
                  background: score === n ? 'var(--olive-bg)' : 'var(--white)',
                  cursor: 'pointer', fontWeight: 700, fontSize: 16,
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

        <div className="form-group">
          <label className="form-label">
            Comment&nbsp;
            <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(optional)</span>
          </label>
          <textarea
            className="form-input" rows={3} value={comment}
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

// ─── Status Timeline ──────────────────────────────────────────────
function StatusTimeline({ status }) {
  const steps       = ['initiated', 'confirmed', 'completed'];
  const terminalNeg = status === 'cancelled' || status === 'disputed';
  const currentIdx  = steps.indexOf(status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 11 }}>
      {steps.map((step, i) => {
        const done   = !terminalNeg && currentIdx >= i;
        const active = !terminalNeg && currentIdx === i;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
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

// ─── Next Action hint ─────────────────────────────────────────────
function NextActionHint({ status, role }) {
  const hints = {
    seller: {
      initiated:  '⏳ Waiting for recycler to arrive, pay you, and confirm pickup',
      confirmed:  '👆 Your turn — confirm you received payment and waste was collected',
      completed:  '✅ Transaction complete',
      cancelled:  '❌ Cancelled',
      disputed:   '⚠️ Under dispute — you can resolve or wait for admin review',
    },
    recycler: {
      initiated:  '👆 Your turn — go to the seller, pay them, collect the waste, then confirm pickup',
      confirmed:  '⏳ Waiting for seller to confirm they received payment',
      completed:  '✅ Transaction complete',
      cancelled:  '❌ Cancelled',
      disputed:   '⚠️ Under dispute — you can resolve or wait for admin review',
    },
  };
  const hint = hints[role]?.[status];
  if (!hint) return null;
  return (
    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
      {hint}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
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
    ])
      .then(([txData, statsData]) => {
        setTxs(Array.isArray(txData) ? txData : txData?.data ?? []);
        setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(t => t.status === filter);

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

  function handleRatingDone(txId) {
    setRatingTx(null);
    setTxs(prev => prev.map(t =>
      t.id === txId
        ? { ...t, ratings: [...(t.ratings || []), { rater_id: user?.id }] }
        : t
    ));
  }

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

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total',       val: stats.total      || 0 },
            { label: 'Completed',   val: stats.completed  || 0 },
            { label: 'Pending',     val: stats.pending    || 0 },
            { label: 'Total Value', val: `KES ${(stats.totalValue || 0).toLocaleString()}` },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-val" style={{ fontSize: 20 }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Role info banner */}
      <div style={{
        background: 'var(--olive-bg)', border: '1px solid var(--olive-pale)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
        fontSize: 13, color: 'var(--olive-deep)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <span>{ROLE_INFO[role]}</span>
      </div>

      {/* Flow explainer */}
      <div style={{
        background: '#f9f9f7', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--text2)',
      }}>
        <strong style={{ fontSize: 13 }}>How the flow works:</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { step: '1', label: 'Seller lists waste on marketplace',          who: 'seller'   },
            { step: '→' },
            { step: '2', label: 'Recycler arrives, pays seller & confirms',   who: 'recycler' },
            { step: '→' },
            { step: '3', label: 'Seller confirms payment received & done',    who: 'seller'   },
          ].map((item, i) => (
            item.step === '→'
              ? <span key={i} style={{ color: 'var(--text3)', fontSize: 16 }}>→</span>
              : (
                <div key={i} style={{
                  background: item.who === 'seller' ? '#e8f5e9' : '#e3f2fd',
                  border: `1px solid ${item.who === 'seller' ? '#c8e0c8' : '#b3d4f5'}`,
                  borderRadius: 6, padding: '5px 10px', fontSize: 11,
                }}>
                  <strong>Step {item.step}</strong> — {item.label}
                  <span style={{
                    marginLeft: 6, fontSize: 10, fontWeight: 600,
                    color: item.who === 'seller' ? '#2A6A2A' : '#1565c0',
                  }}>
                    [{item.who}]
                  </span>
                </div>
              )
          ))}
        </div>
      </div>

      {/* Transactions table */}
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
                    <th key={h} style={{ padding: '8px 12px', color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const allowed      = STATUS_TRANSITIONS[role]?.[tx.status] || [];
                  const counterparty = role === 'seller' ? tx.recycler : tx.seller;
                  // Only recycler rates — they received a service (waste collection + payment)
                  const canRate = tx.status === 'completed' && role === 'recycler' && !hasRated(tx); 

                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>

                      {/* Waste type */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>
                          {tx.waste_type || tx.listing?.waste_type}
                        </div>
                        {tx.listing?.subtype && (
                          <div style={{ color: 'var(--text3)', fontSize: 11 }}>{tx.listing.subtype}</div>
                        )}
                      </td>

                      {/* Qty */}
                      <td style={{ padding: '12px' }}>{tx.quantity_kg} kg</td>

                      {/* Amount — seller receives, recycler pays */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>
                          KES {Number(tx.total_amount || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {role === 'seller' ? '↓ you receive' : '↑ you pay'}
                        </div>
                      </td>

                      {/* Counterparty */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 500 }}>{counterparty?.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {role === 'seller' ? 'Recycler' : 'Seller'}
                        </div>
                        {counterparty?.phone && (
                          <a href={`tel:${counterparty.phone}`} style={{
                            fontSize: 11, color: '#2A6A2A', textDecoration: 'none', display: 'block',
                          }}>
                            📞 {counterparty.phone}
                          </a>
                        )}
                      </td>

                      {/* Status + timeline + hint */}
                      <td style={{ padding: '12px' }}>
                        <Badge color={STATUS_COLOR[tx.status] || 'gray'}>
                          {STATUS_LABELS[tx.status] || tx.status}
                        </Badge>
                        <div style={{ marginTop: 8 }}>
                          <StatusTimeline status={tx.status} />
                        </div>
                        <NextActionHint status={tx.status} role={role} />
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
                            <button className="btn btn-sm btn-secondary" onClick={() => setRatingTx(tx)}>
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