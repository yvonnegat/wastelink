import React from 'react';
import { useAuth } from '../../context/AuthContext';
import SellerDashboard from './SellerDashboard';
import RecyclerDashboard from './RecyclerDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard({ user, onNavigate }) {
  const { user: authUser } = useAuth();
  const currentUser = authUser || user;
  const role = currentUser?.role || 'seller';

  if (role === 'admin')    return <AdminDashboard user={currentUser} onNavigate={onNavigate} />;
  if (role === 'recycler') return <RecyclerDashboard user={currentUser} onNavigate={onNavigate} />;
  return <SellerDashboard user={currentUser} onNavigate={onNavigate} />;
}
