import React from 'react';
import Icon from '../common/Icon';
import NotificationPanel from '../notifications/NotificationsPanel';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  dashboard:    'Dashboard',
  listing:      'List Waste',
  listings:     'Browse Listings',
  vision:       'AI Verification',
  pricing:      'Dynamic Pricing',
  map:          'Recycler Map',
  transactions: 'Transactions',
  matches:      'Match Proposals',
  profile:      'My Profile',
  admin:        'Admin Panel',
};

export default function Topbar({ activePage, userRole, onRoleSwitch, onNavigate }) {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="topbar">
      <div className="page-title">{PAGE_TITLES[activePage] || 'WasteLink'}</div>

      <div className="topbar-right">
        {/* Role switch — only for non-admins */}
        {user?.role !== 'admin' && (
          <div className="role-switcher">
            <button className={`role-btn ${userRole === 'seller' ? 'active' : ''}`} onClick={() => onRoleSwitch('seller')}>
              🌿 Seller
            </button>
            <button className={`role-btn ${userRole === 'recycler' ? 'active' : ''}`} onClick={() => onRoleSwitch('recycler')}>
              ♻️ Recycler
            </button>
          </div>
        )}

        {/* Notifications */}
        <NotificationPanel />

        {/* Profile & Logout */}
        <button className="notif-btn" onClick={() => onNavigate('profile')} title="My Profile">
          <Icon name="user" size={18} />
        </button>
        <button className="notif-btn" onClick={handleLogout} title="Logout" style={{ color: 'var(--text3)' }}>
          <Icon name="logout" size={18} />
        </button>
      </div>
    </header>
  );
}
