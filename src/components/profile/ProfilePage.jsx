import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersService } from '../../services/index';
import { authService } from '../../services/authService';
import { Button, Spinner } from '../common';
import Icon from '../common/Icon';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab]         = useState('profile');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');
  const avatarRef             = useRef();

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone:     user?.phone     || '',
    location:  user?.location  || '',
  });

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });

  // Recycler profile fields
  const [rpForm, setRpForm] = useState({
    business_name:   user?.recycler_profiles?.business_name   || '',
    accepted_types:  user?.recycler_profiles?.accepted_types?.join(', ') || '',
    max_capacity_kg: user?.recycler_profiles?.max_capacity_kg || '',
    operating_hours: user?.recycler_profiles?.operating_hours || '',
  });
  const certRef = useRef();

  function setFormField(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function saveProfile() {
    setSaving(true); setMsg(''); setError('');
    try {
      const updated = await usersService.updateMe(form);
      updateUser(updated);
      setMsg('Profile updated successfully.');
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function changePassword() {
    if (!pwForm.current_password || !pwForm.new_password) { setError('All password fields required'); return; }
    if (pwForm.new_password !== pwForm.confirm) { setError('New passwords do not match'); return; }
    setSaving(true); setMsg(''); setError('');
    try {
      await authService.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setMsg('Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setSaving(true); setMsg(''); setError('');
    try {
      const data = await usersService.uploadAvatar(file);
      updateUser({ avatar_url: data.avatar_url });
      setMsg('Avatar updated!');
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function saveRecyclerProfile() {
    setSaving(true); setMsg(''); setError('');
    try {
      const payload = {
        business_name:   rpForm.business_name || null,
        accepted_types:  rpForm.accepted_types.split(',').map(s => s.trim()).filter(Boolean),
        max_capacity_kg: rpForm.max_capacity_kg ? parseFloat(rpForm.max_capacity_kg) : null,
        operating_hours: rpForm.operating_hours
  ? { general: rpForm.operating_hours }
  : null,
      };
      await usersService.upsertRecyclerProfile(payload);
      setMsg('Recycler profile saved!');
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function uploadCert(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setSaving(true); setMsg(''); setError('');
    try {
      await usersService.uploadCertificate(file);
      setMsg('Certificate uploaded successfully!');
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  const initials = (user?.full_name || 'WL').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page">
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div className="page-heading">My Profile</div>
      </div>

      {/* Avatar & name */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => avatarRef.current?.click()}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--olive-pale)' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--olive-bg)', border: '3px solid var(--olive-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--olive-deep)' }}>
              {initials}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera" size={12} color="white" />
          </div>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.full_name || 'User'}</div>
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>{user?.email}</div>
          <span className={`role-badge role-${user?.role || 'seller'}`}>{user?.role}</span>
        </div>
        {saving && <Spinner size={20} style={{ marginLeft: 'auto' }} />}
      </div>

      {msg   && <div className="alert alert-info"  style={{ marginBottom: 12 }}>{msg}</div>}
      {error && <div className="alert alert-warn"  style={{ marginBottom: 12 }}>{error}</div>}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['profile', 'password', ...(user?.role === 'recycler' ? ['recycler'] : [])].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setMsg(''); setError(''); }}>
            {t === 'recycler' ? 'Recycler Profile' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Personal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.full_name} onChange={e => setFormField('full_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setFormField('phone', e.target.value)} placeholder="+254 700 000 000" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={e => setFormField('location', e.target.value)} placeholder="e.g. Nairobi, Kenya" />
            </div>
          </div>
          <Button variant="primary" loading={saving} onClick={saveProfile}>Save Changes</Button>
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Change Password</div>
          <div style={{ maxWidth: 420 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>
            <Button variant="primary" loading={saving} onClick={changePassword}>Update Password</Button>
          </div>
        </div>
      )}

      {/* Recycler profile tab */}
      {tab === 'recycler' && (
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Recycler Business Profile</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" value={rpForm.business_name} onChange={e => setRpForm(f => ({ ...f, business_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Capacity (kg)</label>
              <input className="form-input" type="number" value={rpForm.max_capacity_kg} onChange={e => setRpForm(f => ({ ...f, max_capacity_kg: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Accepted Waste Types <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(comma-separated)</span></label>
              <input className="form-input" value={rpForm.accepted_types} onChange={e => setRpForm(f => ({ ...f, accepted_types: e.target.value }))} placeholder="Plastic, Paper, Metal" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Operating Hours</label>
              <input className="form-input" value={rpForm.operating_hours} onChange={e => setRpForm(f => ({ ...f, operating_hours: e.target.value }))} placeholder="Mon–Fri 8am–5pm" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
            <Button variant="primary" loading={saving} onClick={saveRecyclerProfile}>Save Profile</Button>
            <Button variant="secondary" onClick={() => certRef.current?.click()}>Upload Certificate</Button>
            <input ref={certRef} type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={uploadCert} />
          </div>
        </div>
      )}
    </div>
  );
}
