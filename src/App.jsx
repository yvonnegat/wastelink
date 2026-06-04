import React, { useState, useCallback, useEffect } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar     from './components/common/Sidebar';
import Topbar      from './components/common/Topbar';
import { Toast, Spinner } from './components/common';

import AuthPage      from './components/auth/AuthPage';
import Dashboard     from './components/dashboard/Dashboard';
import WasteListing  from './components/listing/WasteListing';
import ListingsFeed  from './components/listings/Listingfeed';
import MatchesPage   from './components/matches/MatchesPage';
import ProfilePage   from './components/profile/ProfilePage';
import AdminPanel    from './components/admin/AdminPanel';
import VisionModule  from './components/vision/VisionModule';
import PricingModule from './components/pricing/PricingModule';
import MapModule     from './components/map/MapModule';
import Transactions  from './components/transactions/Transactions';
import HowItWorks from "./components/HowItWorks";


import './styles/global.css';
import 'leaflet/dist/leaflet.css';

const PAGES = {
  dashboard:    Dashboard,
  listing:      WasteListing,
  listings:     ListingsFeed,
  matches:      MatchesPage,
  profile:      ProfilePage,
  admin:        AdminPanel,
  vision:       VisionModule,
  pricing:      PricingModule,
  map:          MapModule,
  transactions: Transactions,
};

// ── Inner app — rendered only when auth is resolved ───────────────
function AppShell() {
  const { user, loading } = useAuth();
  const [page, setPage]         = useState('dashboard');
  const [userRole, setUserRole] = useState('seller');
  const [toast, setToast]       = useState('');

  // Sync role from user when user loads/changes
  useEffect(() => {
    if (user?.role) setUserRole(user.role);
  }, [user?.role]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  function handleLogin(userData) {
    if (userData?.role) setUserRole(userData.role);
    const name = userData?.full_name?.split(' ')[0] || userData?.name?.split(' ')[0] || 'there';
    showToast(`Welcome back, ${name}! 🌿`);
    setPage('dashboard');
  }

  function handleRoleSwitch(role) {
    setUserRole(role);
    showToast(role === 'seller' ? 'Switched to Waste Seller view' : 'Switched to Recycler view');
  }

  function navigate(pg) {
    setPage(pg);
    window.scrollTo(0, 0);
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--olive-deep)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontSize: 28 }}>🌿</span>
          </div>
          <Spinner size={28} />
          <div style={{ marginTop: 12, color: 'var(--text3)', fontSize: 13 }}>Restoring session…</div>
        </div>
      </div>
    );
  }

  // ── Auth gate ─────────────────────────────────────────────────
  if (!user) {
    if (page === 'how-it-works') {
    return <HowItWorks onBack={() => setPage('login')} />;
  }
    return <AuthPage onLogin={handleLogin}onNavigate={setPage}/>;
  }

  // ── Guard: admins always see admin panel ──────────────────────
  const effectiveRole = user.role === 'admin' ? 'admin' : userRole;
  const effectivePage = user.role === 'admin' && page === 'dashboard' ? 'dashboard' : page;

  const PageComponent = PAGES[effectivePage] || Dashboard;

  return (
    <div className="app">
      <Toast message={toast} onClose={() => setToast('')} />

      <Sidebar
        activePage={effectivePage}
        onNavigate={navigate}
        user={{ ...user, role: effectiveRole }}
      />

      <div className="main">
        <Topbar
          activePage={effectivePage}
          userRole={effectiveRole}
          onRoleSwitch={handleRoleSwitch}
          onNavigate={navigate}
        />

        <div className="content">
          <PageComponent
            user={{ ...user, role: effectiveRole }}
            userRole={effectiveRole}
            onNavigate={navigate}
          />
        </div>
      </div>
    </div>
  );
}

// ── Root with AuthProvider ───────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
