import React, { useState } from 'react';
import { MOCK_TRANSACTIONS } from '../../data/mockData';
import { Badge } from '../common';
import Icon from '../common/Icon';

export default function Transactions() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? MOCK_TRANSACTIONS
    : MOCK_TRANSACTIONS.filter((t) => t.status === filter);

  const totalCompleted = MOCK_TRANSACTIONS
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + parseInt(t.price.replace(/[^0-9]/g, ''), 10), 0);

  const totalPending = MOCK_TRANSACTIONS
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + parseInt(t.price.replace(/[^0-9]/g, ''), 10), 0);

  const totalVolume = '188 kg';

  return (
    <div className="page">
      {/* Header */}
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-heading">Transactions</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            Your complete recycling & payout history
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'completed', 'pending'].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Completed Value', val: `KES ${totalCompleted.toLocaleString()}` },
          { label: 'Pending Value',   val: `KES ${totalPending.toLocaleString()}` },
          { label: 'Total Volume',    val: totalVolume },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-val" style={{ fontSize: 20 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 14 }}>
            No transactions found.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                {['ID', 'Material', 'Quantity', 'Recycler', 'Date', 'Amount', 'Status'].map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--olive)', fontWeight: 600 }}>
                    {tx.id}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        className="tx-icon"
                        style={{
                          width: 30, height: 30,
                          background: tx.status === 'completed' ? '#E0F0E0' : '#FFF0C0',
                        }}
                      >
                        <Icon
                          name={tx.status === 'completed' ? 'check' : 'alert'}
                          size={14}
                          color={tx.status === 'completed' ? '#2A6A2A' : '#806010'}
                          strokeWidth={2}
                        />
                      </div>
                      {tx.type}
                    </div>
                  </td>
                  <td>{tx.qty}</td>
                  <td style={{ color: 'var(--text2)' }}>{tx.recycler}</td>
                  <td style={{ color: 'var(--text3)' }}>{tx.date}</td>
                  <td style={{ fontWeight: 600, color: 'var(--olive-deep)' }}>{tx.price}</td>
                  <td>
                    <Badge color={tx.status === 'completed' ? 'green' : 'yellow'} dot>
                      {tx.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
