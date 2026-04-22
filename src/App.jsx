import React, { useState, useCallback } from 'react';

import Sidebar    from './components/common/Sidebar';
import Topbar     from './components/common/Topbar';
import { Toast }  from './components/common';

import AuthPage      from './components/auth/AuthPage';
import Dashboard     from './components/dashboard/Dashboard';
import WasteListing  from './components/listing/WasteListing';
import VisionModule  from './components/vision/VisionModule';
import PricingModule from './components/pricing/PricingModule';
import MapModule     from './components/map/MapModule';
import Transactions  from './components/transactions/Transactions';

import './styles/global.css';
import 'leaflet/dist/leaflet.css';

const PAGES = {
  dashboard:    Dashboard,
  listing:      WasteListing,
  vision:       VisionModule,
  pricing:      PricingModule,
  map:          MapModule,
  transactions: Transactions,
};

export default function App() {
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState('dashboard');
  const [userRole, setUserRole] = useState('seller');
  const [toast, setToast]       = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  function handleLogin(userData) {
    setUser(userData);
    setUserRole(userData.role || 'seller');
    showToast(`Welcome back, ${userData.name?.split(' ')[0] || 'there'}! 🌿`);
  }

  function handleRoleSwitch(role) {
    setUserRole(role);
    showToast(role === 'seller' ? 'Switched to Waste Seller view' : 'Switched to Recycler view');
  }

  function navigate(pg) {
    setPage(pg);
  }

  // Render auth screen if not logged in
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="app">
      <Toast message={toast} onClose={() => setToast('')} />

      <Sidebar
        activePage={page}
        onNavigate={navigate}
        user={{ ...user, role: userRole }}
      />

      <div className="main">
        <Topbar
          activePage={page}
          userRole={userRole}
          onRoleSwitch={handleRoleSwitch}
        />

        <div className="content">
          <PageComponent
            user={user}
            userRole={userRole}
            onNavigate={navigate}
          />
        </div>
      </div>
    </div>
  );
}
