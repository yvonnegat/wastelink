/**
 * useNotifications — polls unread count, fetches & manages notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export function useNotifications(pollIntervalMs = 30_000) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const intervalRef                       = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.notifications.unreadCount();
      setUnreadCount(res?.data?.count ?? 0);
    } catch { /* silent */ }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.notifications.list();
      setNotifications(res?.data?.notifications ?? []);
      setUnreadCount(
        (res?.data?.notifications ?? []).filter((n) => !n.is_read).length
      );
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    await api.notifications.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.notifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const remove = useCallback(async (id) => {
    const wasUnread = notifications.find((n) => n.id === id && !n.is_read);
    await api.notifications.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  }, [notifications]);

  // Start polling
  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, pollIntervalMs);
    return () => clearInterval(intervalRef.current);
  }, [fetchCount, pollIntervalMs]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchAll,
    markRead,
    markAllRead,
    remove,
  };
}

export default useNotifications;