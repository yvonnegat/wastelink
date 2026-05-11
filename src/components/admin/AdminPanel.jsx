import React, { useState, useEffect } from 'react';
import { Badge, Spinner, EmptyState, Button } from '../common';

import { adminService } from '../../services/index';

const TABS = ['Users', 'Listings', 'Transactions', 'Audit Logs'];

export default function AdminPanel() {
  const [tab, setTab]         = useState('Users');
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
  const [filters, setFilters] = useState({});
  const [actionLoading, setAL]= useState({});

  async function load() {
    setLoading(true);
    try {
      let res;
      const params = { page, limit: 20, ...filters, ...(search ? { search } : {}) };
      if (tab === 'Users')        res = await adminService.getUsers(params);
      else if (tab === 'Listings') res = await adminService.getListings(params);
      else if (tab === 'Transactions') res = await adminService.getTransactions(params);
      else if (tab === 'Audit Logs')   res = await adminService.getAuditLogs(params);
      setData(Array.isArray(res) ? res : res?.data ?? []);
      if (res?.meta) setTotal(res.meta.total || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [tab, page, filters, search]);

  function switchTab(t) { setTab(t); setPage(1); setSearch(''); setFilters({}); setData([]); }

  async function handleVerify(id) {
    setAL(prev => ({ ...prev, [id]: 'verify' }));
    try { await adminService.verifyListing(id, { vision_verdict: 'verified' }); await load(); }
    catch (e) { alert(e.message); } finally { setAL(prev => ({ ...prev, [id]: false })); }
  }

  async function handleDeleteListing(id) {
    if (!window.confirm('Delete this listing?')) return;
    setAL(prev => ({ ...prev, [id]: 'delete' }));
    try { await adminService.deleteListing(id); await load(); }
    catch (e) { alert(e.message); } finally { setAL(prev => ({ ...prev, [id]: false })); }
  }

  async function handleToggleUser(user) {
    setAL(prev => ({ ...prev, [user.id]: 'toggle' }));
    try { await adminService.updateUser(user.id, { is_active: !user.is_active }); await load(); }
    catch (e) { alert(e.message); } finally { setAL(prev => ({ ...prev, [user.id]: false })); }
  }

  return (
    <div className="page">
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div className="page-heading">Admin Panel</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Total records: {total}</div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => switchTab(t)}>{t}</button>)}
      </div>

      {/* Filters bar */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" style={{ width: 220 }} placeholder={`Search ${tab}…`} value={search} onChange={e => setSearch(e.target.value)} />
        {tab === 'Users' && (
          <select className="form-input" style={{ width: 140 }} value={filters.role || ''} onChange={e => setFilters(f => ({ ...f, role: e.target.value || undefined }))}>
            <option value="">All Roles</option>
            <option value="seller">Seller</option>
            <option value="recycler">Recycler</option>
            <option value="admin">Admin</option>
          </select>
        )}
        {tab === 'Listings' && (
          <select className="form-input" style={{ width: 180 }} value={filters.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined }))}>
            <option value="">All Statuses</option>
            <option value="pending_verification">Pending</option>
            <option value="verified">Verified</option>
            <option value="matched">Matched</option>
            <option value="completed">Completed</option>
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={32} /></div>
      ) : data.length === 0 ? (
        <EmptyState icon="search" title="No records found" message="Try adjusting filters." />
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            {/* ── USERS table ── */}
            {tab === 'Users' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--cream)' }}>
                  {['Name', 'Email', 'Role', 'Active', 'Verified', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{u.full_name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{u.email}</td>
                      <td style={{ padding: '10px 14px' }}><Badge color={u.role === 'admin' ? 'red' : u.role === 'recycler' ? 'blue' : 'olive'}>{u.role}</Badge></td>
                      <td style={{ padding: '10px 14px' }}>{u.is_active ? '✓' : '✗'}</td>
                      <td style={{ padding: '10px 14px' }}>{u.is_verified ? '✓' : '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Button size="sm" variant={u.is_active ? 'secondary' : 'primary'} loading={actionLoading[u.id] === 'toggle'} onClick={() => handleToggleUser(u)}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── LISTINGS table ── */}
            {tab === 'Listings' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--cream)' }}>
                  {['Waste Type', 'Qty', 'Seller', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text3)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{l.waste_type}</td>
                      <td style={{ padding: '10px 14px' }}>{l.quantity_kg} kg</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{l.seller?.full_name}</td>
                      <td style={{ padding: '10px 14px' }}><Badge color={l.status === 'verified' ? 'olive' : 'warn'}>{l.status}</Badge></td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {l.status === 'pending_verification' && (
                            <Button size="sm" variant="primary" loading={actionLoading[l.id] === 'verify'} onClick={() => handleVerify(l.id)}>Verify</Button>
                          )}
                          <Button size="sm" variant="secondary" loading={actionLoading[l.id] === 'delete'} onClick={() => handleDeleteListing(l.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── TRANSACTIONS table ── */}
            {tab === 'Transactions' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--cream)' }}>
                  {['Waste Type', 'Amount', 'Seller', 'Recycler', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text3)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{t.waste_type}</td>
                      <td style={{ padding: '10px 14px' }}>KES {Number(t.total_amount || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{t.seller?.full_name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{t.recycler?.full_name}</td>
                      <td style={{ padding: '10px 14px' }}><Badge color={t.status === 'completed' ? 'olive' : 'warn'}>{t.status}</Badge></td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── AUDIT LOGS table ── */}
            {tab === 'Audit Logs' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--cream)' }}>
                  {['Action', 'Actor', 'Table', 'Record', 'Time'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text3)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px' }}><Badge color="blue">{log.action}</Badge></td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{log.actor?.full_name || log.actor_id}</td>
                      <td style={{ padding: '10px 14px' }}>{log.table_name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)', fontFamily: 'monospace', fontSize: 11 }}>{log.record_id?.slice(0, 8)}…</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)' }}>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>Page {page}</span>
            <Button variant="secondary" size="sm" disabled={data.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
