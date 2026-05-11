import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../common/Icon';
import { notificationsService } from '../../services/index';

const TYPE_ICON = {
  match_found:        { name: 'recycle', color: '#5A8A5A' },
  transaction_update: { name: 'txn',    color: '#6B7C45' },
  listing_verified:   { name: 'check',  color: '#2A6A2A' },
  system:             { name: 'info',   color: '#6B7C45' },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationPanel() {
  const [open, setOpen]         = useState(false);
  const [notifs, setNotifs]     = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const panelRef = useRef();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsService.getUnreadCount();
      setUnread(data?.count ?? 0);
    } catch { /* not fatal */ }
  }, []);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsService.getAll({ limit: 15 });
      setNotifs(Array.isArray(data) ? data : data?.data ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 60 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Load notifications when panel opens
  useEffect(() => {
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleMarkRead(id, e) {
    e.stopPropagation();
    try {
      await notificationsService.markRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsService.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    try {
      await notificationsService.delete(id);
      const deleted = notifs.find(n => n.id === id);
      setNotifs(prev => prev.filter(n => n.id !== id));
      if (deleted && !deleted.is_read) setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bell button */}
      <button
        className="notif-btn"
        onClick={() => setOpen(o => !o)}
        style={{ background: open ? 'var(--olive-bg)' : undefined }}
        title="Notifications"
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 16, height: 16, borderRadius: '50%',
            background: '#E05050', color: '#fff',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--cream)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 360, maxHeight: 480,
          background: 'var(--white)', borderRadius: 'var(--r)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
          zIndex: 200, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Notifications {unread > 0 && <span style={{ color: 'var(--olive)', fontSize: 12, fontWeight: 400 }}>({unread} unread)</span>}
            </div>
            {unread > 0 && (
              <button className="link-btn" style={{ fontSize: 12 }} onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading…</div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                <Icon name="bell" size={24} color="var(--border)" style={{ marginBottom: 8 }} />
                <div>No notifications yet</div>
              </div>
            ) : (
              notifs.map(n => {
                const ic = TYPE_ICON[n.type] || TYPE_ICON.system;
                return (
                  <div key={n.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: n.is_read ? 'transparent' : 'var(--olive-bg)',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--olive-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name={ic.name} size={15} color={ic.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{n.body}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      {!n.is_read && (
                        <button onClick={e => handleMarkRead(n.id, e)} title="Mark read" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--olive)', padding: 2 }}>
                          <Icon name="check" size={13} />
                        </button>
                      )}
                      <button onClick={e => handleDelete(n.id, e)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
                        <Icon name="x" size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
