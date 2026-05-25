import React, { useEffect, useRef, useState } from 'react';
import Select from 'react-select';

import { useAuth } from '../../context/AuthContext';
import { usersService, locationService } from '../../services';
import { Spinner } from '../common';
import LocationAutocomplete from '../map/LocationAutocomplete';

import './ProfilePage.css';

// ── Inline SVG icons ─────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    building: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>,
    recycle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/></svg>,
    map: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
    pin: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    camera: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    lock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    bell: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[name] || null;
};

const wasteIconName = (t) =>
  ({ Plastic: 'recycle', Metal: 'recycle', Paper: 'recycle', Glass: 'recycle', Electronics: 'recycle', Organic: 'recycle', Textiles: 'recycle' }[t] || 'recycle');

const wasteOptions = [
  { value: 'Plastic', label: 'Plastic' },
  { value: 'Paper', label: 'Paper' },
  { value: 'Glass', label: 'Glass' },
  { value: 'Metal', label: 'Metal' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Organic', label: 'Organic' },
  { value: 'Textiles', label: 'Textiles' },
];

const dayOptions = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

const DAY_ABBR = { Monday:'Mo', Tuesday:'Tu', Wednesday:'We', Thursday:'Th', Friday:'Fr', Saturday:'Sa', Sunday:'Su' };

const selectStyles = {
  control: (b) => ({ ...b, borderColor: '#e2ebe5', borderRadius: 8, fontSize: 14, boxShadow: 'none', minHeight: 38, '&:hover': { borderColor: '#1a7a4a' } }),
  option: (b, s) => ({ ...b, fontSize: 14, background: s.isSelected ? '#1a7a4a' : s.isFocused ? '#e6f4ec' : 'white', color: s.isSelected ? 'white' : '#0d1b12' }),
  multiValue: (b) => ({ ...b, background: '#d0eddb', borderRadius: 20 }),
  multiValueLabel: (b) => ({ ...b, color: '#0d2b1f', fontWeight: 600, fontSize: 12 }),
  multiValueRemove: (b) => ({ ...b, color: '#1a7a4a', ':hover': { background: '#b0d8be' } }),
};

// ── A small helper: display value OR input in place ──────────────
function InlineField({ label, value, editing, inputProps, inputType = 'text', fullWidth = false }) {
  return (
    <div className={`field-item${fullWidth ? ' full-col' : ''}`}>
      <label>{label}</label>
      {editing
        ? <input type={inputType} className="form-input" {...inputProps} />
        : <div className="field-value">{value || '—'}</div>
      }
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const avatarRef = useRef();

  // which section is being edited
  const [editingSection, setEditingSection] = useState(null); // 'profile' | 'recycler' | null

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // ── Forms ────────────────────────────────────────────────────
  const [form, setForm] = useState({ full_name: '', phone: '' });

  const [rpForm, setRpForm] = useState({
    business_name: '',
    accepted_types: [],
    max_capacity_kg: '',
    phone: '',
    description: '',
    website: '',
    operating_days: [],
    opening_time: '08:00',
    closing_time: '17:00',
    location_query: '',
    lat: null,
    lng: null,
    address: '',
    city: '',
  });

  // ── Load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setForm({ full_name: user?.full_name || '', phone: user?.phone || '' });

    const r = { ...user?.map_locations, ...user?.recycler_profiles } || {};
    setRpForm({
      business_name: r?.business_name || '',
      accepted_types: r?.accepted_types || [],
      max_capacity_kg: r?.max_capacity_kg || '',
      phone: r?.phone || user?.phone || '',
      description: r?.description || '',
      website: r?.website || '',
      operating_days: r?.operating_hours?.days
        ? r.operating_hours.days === 'Mon-Fri'
          ? ['Monday','Tuesday','Wednesday','Thursday','Friday']
          : r.operating_hours.days === 'Mon-Sat'
          ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
          : r.operating_hours.days.split(', ')
        : [],
      opening_time: r?.opening_time || r?.operating_hours?.open || '08:00',
      closing_time: r?.closing_time || r?.operating_hours?.close || '17:00',
      location_query: r?.address || '',
      lat: r?.lat || null,
      lng: r?.lng || null,
      address: r?.address || '',
      city: r?.city || '',
    });
  }, [user]);

  // ── Save profile ─────────────────────────────────────────────
  async function saveProfile() {
    setSaving(true); setMsg(''); setError('');
    try {
      const updated = await usersService.updateMe(form);
      updateUser(updated);
      setMsg('Profile updated successfully.');
      setEditingSection(null);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  // ── Save recycler ────────────────────────────────────────────
  async function saveRecyclerProfile() {
    setSaving(true); setMsg(''); setError('');
    try {
      if (!rpForm.business_name) { setError('Business name is required.'); return; }
      if (!rpForm.location_query || !rpForm.lat || !rpForm.lng) {
        setError('Please select a valid recycling centre location.'); return;
      }

      const formatDays = (days) => {
        if (!days?.length) return 'Mon-Fri';
        const d = [...days].sort();
        const mf = d.length === 5 && ['Monday','Tuesday','Wednesday','Thursday','Friday'].every(x => d.includes(x));
        const ms = d.length === 6 && mf && d.includes('Saturday');
        if (ms) return 'Mon-Sat';
        if (mf) return 'Mon-Fri';
        return d.join(', ');
      };

      const operating_hours = { days: formatDays(rpForm.operating_days), open: rpForm.opening_time, close: rpForm.closing_time };

      await usersService.upsertRecyclerProfile({
        business_name: rpForm.business_name,
        accepted_types: rpForm.accepted_types,
        max_capacity_kg: rpForm.max_capacity_kg ? parseFloat(rpForm.max_capacity_kg) : null,
        operating_hours,
        phone: rpForm.phone,
        address: rpForm.address,
        city: rpForm.city,
        lat: rpForm.lat,
        lng: rpForm.lng,
        description: rpForm.description,
        website: rpForm.website,
      });

      await locationService.saveRecyclerLocation({
        name: rpForm.business_name, lat: rpForm.lat, lng: rpForm.lng,
        address: rpForm.address, city: rpForm.city,
        accepted_types: rpForm.accepted_types, operating_hours,
        description: rpForm.description, phone: rpForm.phone,
      });

      updateUser({ 
  recycler_profiles: { ...user?.recycler_profiles, ...rpForm, operating_hours },
  map_locations: { 
    ...user?.map_locations,
    address: rpForm.address,
    city: rpForm.city,
    lat: rpForm.lat,
    lng: rpForm.lng,
    phone: rpForm.phone,
    description: rpForm.description,
    name: rpForm.business_name,
  }
});
      setMsg('Recycler profile saved. Your centre will appear on the map.');
      setEditingSection(null);
    } catch (e) { console.error(e); setError(e.message); }
    finally { setSaving(false); }
  }

  // ── Avatar ───────────────────────────────────────────────────
  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const data = await usersService.uploadAvatar(file);
      updateUser({ avatar_url: data.avatar_url });
      setMsg('Profile photo updated.');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const initials = (user?.full_name || 'WL').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  
const recycler = { ...user?.map_locations, ...user?.recycler_profiles } || {};
  const isRecycler = user?.role === 'recycler';

  const displayDays = rpForm.operating_days.length ? rpForm.operating_days
    : recycler?.operating_hours?.days === 'Mon-Fri' ? ['Monday','Tuesday','Wednesday','Thursday','Friday']
    : recycler?.operating_hours?.days === 'Mon-Sat' ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    : [];

  const isEditingProfile = editingSection === 'profile';
  const isEditingRp = editingSection === 'recycler';

  function toggleEdit(section) {
    setEditingSection(prev => prev === section ? null : section);
    setMsg(''); setError('');
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="profile-page">

      {/* Page heading — zero top gap, sits right at the top of the content area */}
      <div className="profile-page-hd">
        <div className="page-heading">My Profile</div>
        <div className="page-subheading">Manage your business details and preferences</div>
      </div>

      {/* Alerts */}
      {msg   && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-warn">{error}</div>}

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="profile-hero-card">
        <div className="profile-hero-inner">
          {/* Avatar */}
          <div className="avatar-wrap" onClick={() => avatarRef.current?.click()}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="avatar-img" />
              : <div className="avatar-initials">{initials}</div>
            }
            <div className="avatar-cam-btn"><Icon name="camera" size={12} /></div>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadAvatar} />
          </div>

          {/* Name block */}
          <div className="hero-text">
            <div className="hero-biz-name">{recycler?.business_name || user?.full_name || '—'}</div>
            <div className="hero-user-name">{user?.full_name}</div>
            <div className="hero-meta">
              <span className="badge-active">Active</span>
              <span className="hero-joined">
                Joined {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { month:'long', year:'numeric' })
                  : 'January 2024'}
              </span>
            </div>
          </div>

          {/* Edit button — top right */}
          <button
            className={`btn-edit-profile${isEditingProfile || isEditingRp ? ' active' : ''}`}
            onClick={() => toggleEdit(isRecycler ? 'recycler' : 'profile')}
          >
            {isEditingProfile || isEditingRp
              ? <><Icon name="x" size={13} /> Cancel</>
              : <><Icon name="edit" size={13} /> Edit Profile</>
            }
          </button>
        </div>
      </div>

      {/* ── Main two-column body ─────────────────────────────── */}
      <div className="profile-body">

        {/* ── LEFT ── */}
        <div className="profile-left">

          {/* BUSINESS DETAILS */}
          <div className="section-card">
            <div className="section-card-hd">
              <span className="section-card-title">Business Details</span>
              <div className="section-icon-btn"><Icon name="building" size={15} /></div>
            </div>

            <div className="field-grid">
              {/* Business Name */}
              <div className="field-item">
                <label>Business Name</label>
                {isEditingRp
                  ? <input className="form-input" value={rpForm.business_name} onChange={e => setRpForm({...rpForm, business_name: e.target.value})} />
                  : <div className="field-value">{recycler?.business_name || '—'}</div>}
              </div>

              {/* Contact Person — never editable, it's the user's name */}
              <div className="field-item">
                <label>Contact Person</label>
                <div className="field-value">{user?.full_name || '—'}</div>
              </div>

              {/* Email — never editable */}
              <div className="field-item">
                <label>Email Address</label>
                <div className="field-value">{user?.email || '—'}</div>
              </div>

              {/* Phone */}
              <div className="field-item">
                <label>Phone Number</label>
                {isEditingRp
                  ? <input className="form-input" value={rpForm.phone} onChange={e => setRpForm({...rpForm, phone: e.target.value})} />
                  : isEditingProfile
                  ? <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  : <div className="field-value">{recycler?.phone || user?.phone || '—'}</div>}
              </div>

              {/* Website */}
              <div className="field-item full-col">
                <label>Website <span style={{fontWeight:400,textTransform:'none'}}>(optional)</span></label>
                {isEditingRp
                  ? <input className="form-input" placeholder="https://" value={rpForm.website} onChange={e => setRpForm({...rpForm, website: e.target.value})} />
                  : <div className="field-value">{recycler?.website ? <a href={recycler.website} target="_blank" rel="noreferrer">{recycler.website}</a> : '—'}</div>}
              </div>
            </div>

            {/* Name edit (non-recycler profile) */}
            {isEditingProfile && !isRecycler && (
              <div className="field-grid" style={{marginTop: 12}}>
                <div className="field-item">
                  <label>Full Name</label>
                  <input className="form-input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
                </div>
              </div>
            )}

            {/* Bio */}
            <div className="field-bio">
              <label>Business Bio</label>
              {isEditingRp
                ? <textarea className="form-input" rows={4} placeholder="Tell users about your recycling centre…"
                    value={rpForm.description} onChange={e => setRpForm({...rpForm, description: e.target.value})} />
                : <p>{recycler?.description || <span style={{color:'#9aab9e'}}>No description added yet.</span>}</p>}
            </div>

            {/* Accepted waste types (editable) */}
            {isEditingRp && (
              <div className="form-group" style={{marginTop: 16}}>
                <label className="form-label">Accepted Waste Types</label>
                <Select isMulti options={wasteOptions} styles={selectStyles}
                  value={wasteOptions.filter(o => rpForm.accepted_types.includes(o.value))}
                  onChange={vals => setRpForm({...rpForm, accepted_types: vals.map(v => v.value)})} />
              </div>
            )}

            {/* Max capacity (editable) */}
            {isEditingRp && (
              <div className="form-group" style={{marginTop: 12}}>
                <label className="form-label">Max Capacity (kg)</label>
                <input type="number" className="form-input" value={rpForm.max_capacity_kg}
                  onChange={e => setRpForm({...rpForm, max_capacity_kg: e.target.value})} />
              </div>
            )}

            {/* Save row */}
            {(isEditingProfile || isEditingRp) && (
              <div className="btn-row">
                <button className="btn btn-ghost" onClick={() => setEditingSection(null)}>Cancel</button>
                <button className="btn btn-primary" disabled={saving}
                  onClick={isEditingRp ? saveRecyclerProfile : saveProfile}>
                  {saving ? <><span className="spinner" /> Saving…</> : <><Icon name="check" size={14} /> Save Changes</>}
                </button>
              </div>
            )}
          </div>

          {/* RECYCLING LOCATION */}
          {isRecycler && (
            <div className="section-card">
              <div className="section-card-hd">
                <span className="section-card-title">Recycling Location</span>
                <div className="section-icon-btn"><Icon name="pin" size={15} /></div>
              </div>
              <div className="field-grid">
                <div className="field-item">
                  <label>Street Address</label>
                  {isEditingRp
                    ? <LocationAutocomplete value={rpForm.location_query}
                        onSelect={(location, text) => {
                          if (!location) { setRpForm({...rpForm, location_query: text}); return; }
                          setRpForm({...rpForm, location_query: text, lat: location.lat, lng: location.lng, address: location.address, city: location.city});
                        }} />
                    : <div className="field-value">{recycler?.address || '—'}</div>}
                </div>
                <div className="field-item">
                  <label>City / Town</label>
                  {isEditingRp
                    ? <input className="form-input" value={rpForm.city} onChange={e => setRpForm({...rpForm, city: e.target.value})} />
                    : <div className="field-value">{recycler?.city || '—'}</div>}
                </div>
              </div>
              {(recycler?.lat || rpForm.lat) && (
                <div className="coords-row">
                  <div className="coords-icon"><Icon name="map" size={16} /></div>
                  <div className="coords-text">
                    <small>Coordinates</small>
                    <span>{Number(recycler?.lat || rpForm.lat).toFixed(4)}, {Number(recycler?.lng || rpForm.lng).toFixed(4)}</span>
                  </div>
                  {!isEditingRp && (
                    <button className="btn-update-map" onClick={() => toggleEdit('recycler')}>Update on Map</button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WORKING HOURS */}
          {isRecycler && (
            <div className="section-card">
              <div className="section-card-hd">
                <span className="section-card-title">Working Hours</span>
                <div className="section-icon-btn"><Icon name="clock" size={15} /></div>
              </div>

              {isEditingRp ? (
                <>
                  <div className="day-presets">
                    <button type="button" className="day-preset-btn"
                      onClick={() => setRpForm({...rpForm, operating_days:['Monday','Tuesday','Wednesday','Thursday','Friday']})}>Mon–Fri</button>
                    <button type="button" className="day-preset-btn"
                      onClick={() => setRpForm({...rpForm, operating_days:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']})}>Mon–Sat</button>
                  </div>
                  <Select isMulti options={dayOptions} styles={selectStyles} placeholder="Select working days…"
                    value={dayOptions.filter(o => rpForm.operating_days.includes(o.value))}
                    onChange={vals => setRpForm({...rpForm, operating_days: vals.map(v => v.value)})} />
                  <div className="field-grid" style={{marginTop:14}}>
                    <div className="field-item">
                      <label>Opening Time</label>
                      <input type="time" className="form-input" value={rpForm.opening_time}
                        onChange={e => setRpForm({...rpForm, opening_time: e.target.value})} />
                    </div>
                    <div className="field-item">
                      <label>Closing Time</label>
                      <input type="time" className="form-input" value={rpForm.closing_time}
                        onChange={e => setRpForm({...rpForm, closing_time: e.target.value})} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="hours-list">
                  {displayDays.length > 0 ? displayDays.map(day => (
                    <div className="hours-row" key={day}>
                      <div className="day-abbr">{DAY_ABBR[day]}</div>
                      <div className="day-name">{day}</div>
                      <div className="hours-time">
                        {recycler?.operating_hours?.open || rpForm.opening_time || '08:00'} – {recycler?.operating_hours?.close || rpForm.closing_time || '17:00'}
                      </div>
                      <div className="dot-open" />
                    </div>
                  )) : <p style={{color:'#9aab9e', fontSize:14, margin:0}}>No working hours set yet.</p>}
                </div>
              )}
            </div>
          )}

        </div>{/* end LEFT */}

        {/* ── RIGHT ── */}
        <div className="profile-right">

          {/* WHAT WE RECYCLE */}
          {isRecycler && (
            <div className="section-card">
              <div className="section-card-hd">
                <span className="section-card-title">What We Recycle</span>
                <div className="section-icon-btn"><Icon name="recycle" size={15} /></div>
              </div>
              <div className="recycle-tags">
                {(recycler?.accepted_types || rpForm.accepted_types || []).map(t => (
                  <div className="recycle-tag" key={t}>
                    <Icon name={wasteIconName(t)} size={13} />
                    {t}
                  </div>
                ))}
                {!(recycler?.accepted_types || rpForm.accepted_types || []).length && (
                  <span style={{fontSize:13, color:'#9aab9e'}}>No waste types added yet.</span>
                )}
              </div>
            </div>
          )}

          {/* QUICK STATS */}
          {isRecycler && (
            <div className="section-card">
              <div className="section-card-hd">
                <span className="section-card-title">Quick Stats</span>
              </div>
              <ul className="quick-stats">
                <li className="quick-stat">
                  <div className="quick-stat-icon"><Icon name="recycle" size={14} /></div>
                  <span className="quick-stat-label">Waste Types</span>
                  <span className="quick-stat-value">{(recycler?.accepted_types || rpForm.accepted_types || []).length}</span>
                </li>
                <li className="quick-stat">
                  <div className="quick-stat-icon"><Icon name="pin" size={14} /></div>
                  <span className="quick-stat-label">Location</span>
                  <span className="quick-stat-value">{recycler?.city || rpForm.city || '—'}</span>
                </li>
                <li className="quick-stat">
                  <div className="quick-stat-icon"><Icon name="calendar" size={14} /></div>
                  <span className="quick-stat-label">Days Open</span>
                  <span className="quick-stat-value">{displayDays.length} / 7</span>
                </li>
                {recycler?.rating && (
                  <li className="quick-stat">
                    <div className="quick-stat-icon" style={{color:'#e6a817', background:'#fef9e7'}}><Icon name="star" size={14} /></div>
                    <span className="quick-stat-label">Rating</span>
                    <span className="quick-stat-value" style={{color:'#e6a817'}}>{recycler.rating} / 5.0</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* ACCOUNT */}
          <div className="section-card">
            <div className="section-card-hd">
              <span className="section-card-title">Account</span>
            </div>
            <ul className="account-list">
              <li className="account-item">
                <span className="account-item-icon"><Icon name="lock" size={15} /></span>
                Change Password
              </li>
              <li className="account-item">
                <span className="account-item-icon"><Icon name="bell" size={15} /></span>
                Notification Settings
              </li>
              <li className="account-item danger">
                <span className="account-item-icon"><Icon name="trash" size={15} /></span>
                Delete Account
              </li>
            </ul>
          </div>

        </div>{/* end RIGHT */}
      </div>
    </div>
  );
}