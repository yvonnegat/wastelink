import React from 'react';
import Icon from '../common/Icon';

const NAV_SELLER = [
  { id: 'dashboard',    label: 'Dashboard',        icon: 'home' },
  { id: 'listing',      label: 'List Waste',        icon: 'list' },
  { id: 'listings',     label: 'Browse Feed',       icon: 'recycle' },
  { id: 'matches',      label: 'Match Proposals',   icon: 'link' },
  { id: 'vision',       label: 'AI Verification',   icon: 'eye' },
  { id: 'pricing',      label: 'Pricing',           icon: 'dollar' },
  { id: 'map',          label: 'Find Recyclers',    icon: 'map' },
  { id: 'transactions', label: 'Transactions',      icon: 'txn' },
  { id: 'profile',      label: 'My Profile',        icon: 'user' },
];

const NAV_RECYCLER = [
  { id: 'dashboard',    label: 'Dashboard',         icon: 'home' },
  { id: 'listings',     label: 'Browse Listings',   icon: 'recycle' },
  { id: 'matches',      label: 'My Requests',       icon: 'link' },
  { id: 'transactions', label: 'Transactions',      icon: 'txn' },
  { id: 'map',          label: 'Map View',          icon: 'map' },
  { id: 'profile',      label: 'My Profile',        icon: 'user' },
];

const NAV_ADMIN = [
  { id: 'dashboard',    label: 'Dashboard',         icon: 'home' },
  { id: 'admin',        label: 'Admin Panel',       icon: 'shield' },
  { id: 'transactions', label: 'Transactions',      icon: 'txn' },
  { id: 'profile',      label: 'My Profile',        icon: 'user' },
];

export default function Sidebar({ activePage, onNavigate, user }) {
  const role = user?.role || 'seller';
  const navItems = role === 'admin' ? NAV_ADMIN : role === 'recycler' ? NAV_RECYCLER : NAV_SELLER;

  const displayName = user?.full_name || user?.name || 'Guest';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div>
        <div className="logo-icon"><Icon name="leaf" size={20} /></div>
        <div className="logo-text">WasteLink</div>
        <div className="logo-sub">RECYCLING MARKETPLACE</div>
      </div>

      <nav className="nav">
        <div className="nav-section">Main Menu</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={displayName}
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div className="user-avatar">{initials}</div>
        )}
        <div>
          <div className="user-name">{displayName}</div>
          <span className={`role-badge ${role === 'recycler' ? 'role-recycler' : role === 'admin' ? 'role-admin' : 'role-seller'}`}>
            {role}
          </span>
        </div>
      </div>
    </aside>
  );
}
