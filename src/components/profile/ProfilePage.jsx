import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Select from 'react-select';
import {
  Building2, Phone, Mail, User, MapPin, Clock, Star,
  Camera, Edit2, Lock, Bell, Trash2, Calendar, Check, X,
  Recycle, Package, FileText, Globe, ChevronDown, AlertCircle,
  LogOut
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { usersService, locationService } from '../../services';
import LocationAutocomplete from '../map/LocationAutocomplete';
import { NearbySeededCentrePrompt } from '../map/NearbySeededCentrePrompt';
import { useToast } from '../common/Toast';

import './ProfilePage.css';

// ─── Options ──────────────────────────────────────────────────
const wasteOptions = [
  { value: 'Plastic',   label: 'Plastic' },
  { value: 'Paper',     label: 'Paper' },
  { value: 'Cardboard', label: 'Cardboard' },
  { value: 'Glass',     label: 'Glass' },
  { value: 'Metal',     label: 'Metal' },
  { value: 'E-Waste',   label: 'E-Waste' },
  { value: 'Organic',   label: 'Organic' },
  { value: 'Textiles',  label: 'Textiles' },
  { value: 'Tyres',     label: 'Tyres' },
  { value: 'Batteries', label: 'Batteries' },
];

const dayOptions = [
  { value: 'Monday',    label: 'Monday' },
  { value: 'Tuesday',   label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday',  label: 'Thursday' },
  { value: 'Friday',    label: 'Friday' },
  { value: 'Saturday',  label: 'Saturday' },
  { value: 'Sunday',    label: 'Sunday' },
];

const DAY_ABBR = {
  Monday:'Mo', Tuesday:'Tu', Wednesday:'We',
  Thursday:'Th', Friday:'Fr', Saturday:'Sa', Sunday:'Su',
};

// Defined outside component so it's never recreated
const selectStyles = {
  control: (b) => ({ ...b, borderColor:'#e2ebe5', borderRadius:8, fontSize:14, boxShadow:'none', minHeight:38, '&:hover':{ borderColor:'#1a7a4a' } }),
  option:  (b,s) => ({ ...b, fontSize:14, background:s.isSelected?'#1a7a4a':s.isFocused?'#e6f4ec':'white', color:s.isSelected?'white':'#0d1b12' }),
  multiValue:       (b) => ({ ...b, background:'#d0eddb', borderRadius:20 }),
  multiValueLabel:  (b) => ({ ...b, color:'#0d2b1f', fontWeight:600, fontSize:12 }),
  multiValueRemove: (b) => ({ ...b, color:'#1a7a4a', ':hover':{ background:'#b0d8be' } }),
};

// ─── Helpers (outside component — never recreated) ─────────────
function formatDays(days) {
  if (!days?.length) return 'Mon-Fri';
  const d = [...days].sort();
  const mf = d.length === 5 && ['Monday','Tuesday','Wednesday','Thursday','Friday'].every(x => d.includes(x));
  const ms = d.length === 6 && mf && d.includes('Saturday');
  if (ms) return 'Mon-Sat';
  if (mf) return 'Mon-Fri';
  return d.join(', ');
}

function cacheUserProfile(updatedUser) {
  localStorage.setItem('wastelink_user_profile', JSON.stringify(updatedUser));
}

// ─── Default form states (outside component — stable references) ──
const DEFAULT_RP_FORM = {
  business_name:'', accepted_types:[], max_capacity_kg:'',
  phone:'', description:'', website:'',
  operating_days:[], opening_time:'08:00', closing_time:'17:00',
  location_query:'', lat:null, lng:null, address:'', city:'',
};

const DEFAULT_SELLER_FORM = {
  business_name:'', phone:'', description:'',
  waste_types:[],
  location_query:'', lat:null, lng:null, address:'', city:'',
};


// ══════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const avatarRef = useRef();

  const [editingSection, setEditingSection] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [error,   setError]   = useState('');

  // Nearby seeded centre prompt (recyclers only)
  const [nearbySeeded,   setNearbySeeded]   = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);

  // ── Form states ───────────────────────────────────────────────
  const [rpForm,     setRpForm]     = useState(DEFAULT_RP_FORM);
  const [sellerForm, setSellerForm] = useState(DEFAULT_SELLER_FORM);
  const [form,       setForm]       = useState({ full_name:'', phone:'' });

  const { showToast } = useToast();

  // ── Stable derived booleans ───────────────────────────────────
  const isRecycler = user?.role === 'recycler';
  const isSeller   = !!user && !isRecycler;

  // ── Load form data once when user id or role changes ─────────
  useEffect(() => {
    if (!user) return;
    console.log('USER:', JSON.stringify(user, null, 2));
    setForm({ full_name: user.full_name || '', phone: user.phone || '' });

    if (user.role === 'recycler') {
      const rp = user.recycler_profiles || {};
      const operatingHours = rp.operating_hours || {};

      let operating_days = [];
      if (operatingHours.days === 'Mon-Fri') {
        operating_days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
      } else if (operatingHours.days === 'Mon-Sat') {
        operating_days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      } else if (operatingHours.days) {
        operating_days = operatingHours.days.split(', ');
      }

      setRpForm({
        business_name:   rp.business_name   || user.full_name || '',
        accepted_types:  rp.accepted_types  || [],
        max_capacity_kg: rp.max_capacity_kg || '',
        phone:           rp.phone           || user.phone || '',
        description:     rp.description     || '',
        website:         rp.website         || '',
        operating_days,
        opening_time:    operatingHours.open  || '08:00',
        closing_time:    operatingHours.close || '17:00',
        location_query:  rp.address || user.address || '',
        lat:             rp.lat     || user.lat      || null,
        lng:             rp.lng     || user.lng      || null,
        address:         rp.address || user.address  || '',
        city:            rp.city    || user.city     || '',
      });
    } else {
      const ml = user.map_locations || {};
      setSellerForm({
        business_name:  user.full_name || '',
        phone:          user.phone     || '',
        description:    ml.description || '',
        waste_types:    ml.accepted_types || [],
        location_query: ml.address || '',
        lat:            ml.lat  || null,
        lng:            ml.lng  || null,
        address:        ml.address || '',
        city:           ml.city    || '',
      });
    }
  }, [user?.id, user?.role]); // stable primitives only — no object references

  // ── Memoised derived display values ──────────────────────────
  const recyclerProfile      = useMemo(() => user?.recycler_profiles || {}, [user?.recycler_profiles]);
  const recyclerOperatingHours = useMemo(() => recyclerProfile.operating_hours || {}, [recyclerProfile]);

  const recyclerBusinessName = recyclerProfile.business_name || user?.full_name || '—';
  const recyclerPhone        = recyclerProfile.phone         || user?.phone     || '—';
  const recyclerWebsite      = recyclerProfile.website;
  const recyclerDescription  = recyclerProfile.description;
  const recyclerAddress      = recyclerProfile.address || user?.address || '—';
  const recyclerCity         = recyclerProfile.city    || user?.city    || '—';
  const recyclerLat          = recyclerProfile.lat     || user?.lat;
  const recyclerLng          = recyclerProfile.lng     || user?.lng;
  const recyclerAcceptedTypes = useMemo(() => recyclerProfile.accepted_types || [], [recyclerProfile]);

  const sellerLoc            = useMemo(() => user?.map_locations || {}, [user?.map_locations]);
  const sellerLocAddress     = sellerLoc.address || '—';
  const sellerLocCity        = sellerLoc.city    || '—';
  const sellerLocLat         = sellerLoc.lat;
  const sellerLocLng         = sellerLoc.lng;
  const sellerLocAcceptedTypes = useMemo(() => sellerLoc.accepted_types || [], [sellerLoc]);
  const sellerLocDescription = sellerLoc.description;
  const hasSellerLocation    = !!(sellerLocLat && sellerLocLng);

  const initials = useMemo(() =>
    (user?.full_name || 'WL').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  [user?.full_name]);

  // Memoised so it doesn't recreate an array every render
  const displayDays = useMemo(() => {
    if (rpForm.operating_days.length) return rpForm.operating_days;
    if (recyclerOperatingHours.days === 'Mon-Fri')
      return ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    if (recyclerOperatingHours.days === 'Mon-Sat')
      return ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return [];
  }, [rpForm.operating_days, recyclerOperatingHours.days]);

  // ── Callbacks ─────────────────────────────────────────────────
  const toggleEdit = useCallback((section) => {
    setEditingSection(prev => prev === section ? null : section);
    setMsg('');
    setError('');
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const uploadAvatar = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const data = await usersService.uploadAvatar(file);
      updateUser({ avatar_url: data.avatar_url });
      setMsg('Photo updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [updateUser]);

  // ── Save basic profile ────────────────────────────────────────
  const saveProfile = useCallback(async () => {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const updated = await usersService.updateMe(form);
      updateUser(updated);
      cacheUserProfile(updated);
      setMsg('Profile updated.');
      setEditingSection(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [form, updateUser]);

  // ── Save seller profile ───────────────────────────────────────
  const saveSellerProfile = useCallback(async () => {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      if (!sellerForm.business_name) {
        showToast('Please enter your name or business name.', 'error');
        return;
      }
      if (!sellerForm.lat || !sellerForm.lng) {
        document.querySelector('.location-section')?.scrollIntoView({ behavior:'smooth', block:'center' });
        showToast('Please select your location so recyclers can find you.', 'error');
        return;
      }
      if (!sellerForm.waste_types.length) {
        setError('Please select at least one type of waste you generate.');
        return;
      }

      await usersService.updateMe({
        full_name: sellerForm.business_name,
        phone:     sellerForm.phone,
      });

      await locationService.saveWasteGeneratorLocation({
        userId:     user.id,
        listingId:  null,
        name:       sellerForm.business_name,
        lat:        sellerForm.lat,
        lng:        sellerForm.lng,
        address:    sellerForm.address,
        city:       sellerForm.city,
        description:sellerForm.description,
        phone:      sellerForm.phone,
        wasteTypes: sellerForm.waste_types,
      });

      const freshUserData = await usersService.getMe();
      updateUser(freshUserData);
      cacheUserProfile(freshUserData);

      showToast('Profile saved! You are now visible to recyclers on the map.', 'success');
      setEditingSection(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [sellerForm, user?.id, showToast, updateUser]);

  // ── Save recycler profile ─────────────────────────────────────
  const saveRecyclerProfile = useCallback(async () => {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      if (!rpForm.business_name) {
        setError('Business name is required.');
        return;
      }
      if (!rpForm.location_query || !rpForm.lat || !rpForm.lng) {
        showToast('Please select a valid location address.', 'error');
        return;
      }

      const operating_hours = {
        days:  formatDays(rpForm.operating_days),
        open:  rpForm.opening_time,
        close: rpForm.closing_time,
      };

      await usersService.upsertRecyclerProfile({
        business_name:   rpForm.business_name,
        accepted_types:  rpForm.accepted_types,
        max_capacity_kg: rpForm.max_capacity_kg ? parseFloat(rpForm.max_capacity_kg) : null,
        operating_hours,
        phone:           rpForm.phone,
        address:         rpForm.address,
        city:            rpForm.city,
        lat:             rpForm.lat,
        lng:             rpForm.lng,
        description:     rpForm.description,
        website:         rpForm.website,
      });

      const locationPayload = {
        name:           rpForm.business_name,
        lat:            rpForm.lat,
        lng:            rpForm.lng,
        address:        rpForm.address,
        city:           rpForm.city,
        acceptedTypes:  rpForm.accepted_types,
        operatingHours: operating_hours,
        description:    rpForm.description,
        phone:          rpForm.phone,
      };

      const nearby = await locationService.findNearbySeededCentre(rpForm.lat, rpForm.lng, 0.2);
      if (nearby) {
        setPendingPayload(locationPayload);
        setNearbySeeded(nearby);
        setSaving(false);
        return;
      }

      await locationService.saveRecyclerLocation({ userId: user.id, ...locationPayload });

      const freshUserData = await usersService.getMe();
      updateUser(freshUserData);
      cacheUserProfile(freshUserData);

      showToast('Recycler profile saved. Your centre is visible on the map.', 'success');
      setEditingSection(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [rpForm, user?.id, showToast, updateUser]);

  const handleClaimSeeded = useCallback(async (centre) => {
    try {
      await locationService.claimSeededCentre(centre.id, user.id);
      const freshUserData = await usersService.getMe();
      updateUser(freshUserData);
      cacheUserProfile(freshUserData);
      showToast('Centre claimed successfully!', 'success');
      setEditingSection(null);
      setNearbySeeded(null);
      setPendingPayload(null);
    } catch (err) {
      setError(err.message);
      setNearbySeeded(null);
    }
  }, [user?.id, updateUser, showToast]);

  const handleRegisterSeparately = useCallback(async () => {
    try {
      setNearbySeeded(null);
      await locationService.saveRecyclerLocation({ userId: user.id, ...pendingPayload });
      const freshUserData = await usersService.getMe();
      updateUser(freshUserData);
      cacheUserProfile(freshUserData);
      showToast('Centre registered successfully!', 'success');
      setEditingSection(null);
      setPendingPayload(null);
    } catch (err) {
      setError(err.message);
    }
  }, [user?.id, pendingPayload, updateUser, showToast]);

  // ── Guard: don't render until user is loaded ──────────────────
  if (!user) return null;

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="profile-page">
      {nearbySeeded && (
        <NearbySeededCentrePrompt
          nearby={nearbySeeded}
          userId={user?.id}
          onClaimed={handleClaimSeeded}
          onRegisterAnyway={handleRegisterSeparately}
          onDismiss={() => {
            setNearbySeeded(null);
            setPendingPayload(null);
          }}
        />
      )}

      <div className="profile-page-hd">
        <div className="profile-page-hd-left">
          <div className="page-heading">My Profile</div>
          <div className="page-subheading">
            {isRecycler
              ? 'Manage your recycling centre details'
              : 'Not visible to recyclers yet. Add your location and waste types below'}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Log out">
          <LogOut size={15}/>
          <span>Log out</span>
        </button>
      </div>

      {msg   && <div className="alert alert-info"><Check size={14}/> {msg}</div>}
      {error && <div className="alert alert-warn"><AlertCircle size={14}/> {error}</div>}

      <div className="profile-hero-card">
        <div className="profile-hero-inner">
          <div className="avatar-wrap" onClick={() => avatarRef.current?.click()}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="avatar-img"/>
              : <div className="avatar-initials">{initials}</div>
            }
            <div className="avatar-cam-btn"><Camera size={12}/></div>
            <input ref={avatarRef} type="file" accept="image/*" style={{display:'none'}} onChange={uploadAvatar}/>
          </div>
          <div className="hero-text">
            <div className="hero-biz-name">
              {isRecycler ? recyclerBusinessName : (user?.full_name || '—')}
            </div>
            <div className="hero-user-name">{user?.email}</div>
            <div className="hero-meta">
              <span className={`badge-role ${isRecycler ? 'recycler' : 'seller'}`}>
                {isRecycler ? <><Recycle size={11}/> Recycler</> : <><Package size={11}/> Waste Seller</>}
              </span>
              <span className="hero-joined">
                Joined {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { month:'long', year:'numeric' })
                  : 'recently'}
              </span>
            </div>
          </div>
          <button
            className={`btn-edit-profile${
              (editingSection === 'profile' || editingSection === 'recycler' || editingSection === 'seller') ? ' active' : ''
            }`}
            onClick={() => toggleEdit(isRecycler ? 'recycler' : 'seller')}
          >
            {(editingSection === 'profile' || editingSection === 'recycler' || editingSection === 'seller')
              ? <><X size={13}/> Cancel</>
              : <><Edit2 size={13}/> Edit Profile</>
            }
          </button>
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-left">

          {/* ── SELLER SECTION ── */}
          {isSeller && (
            <>
              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Your Details</span>
                  <div className="section-icon-btn"><User size={15}/></div>
                </div>
                <div className="field-grid">
                  <div className="field-item">
                    <label>Name / Business Name</label>
                    {editingSection === 'seller'
                      ? <input className="form-input" value={sellerForm.business_name}
                          onChange={e => setSellerForm(prev => ({ ...prev, business_name: e.target.value }))}
                          placeholder="e.g. Hannah Wanjiku or ABC Hotel"/>
                      : <div className="field-value">{user?.full_name || '—'}</div>}
                  </div>
                  <div className="field-item">
                    <label>Email</label>
                    <div className="field-value">{user?.email || '—'}</div>
                  </div>
                  <div className="field-item">
                    <label>Phone Number</label>
                    {editingSection === 'seller'
                      ? <input className="form-input" value={sellerForm.phone}
                          onChange={e => setSellerForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+254 7XX XXX XXX"/>
                      : <div className="field-value">{user?.phone || '—'}</div>}
                  </div>
                  <div className="field-item full-col">
                    <label>About You / Your Business</label>
                    {editingSection === 'seller'
                      ? <textarea className="form-input" rows={3} value={sellerForm.description}
                          onChange={e => setSellerForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="e.g. Small hotel producing glass bottles, cardboard and plastic waste weekly."/>
                      : <div className="field-value">
                          {sellerLocDescription || <span style={{color:'#9aab9e'}}>No description yet.</span>}
                        </div>}
                  </div>
                </div>
              </div>

              <div className="section-card location-section">
                <div className="section-card-hd">
                  <span className="section-card-title">Your Location</span>
                  <div className="section-icon-btn"><MapPin size={15}/></div>
                </div>
                <p className="section-hint">
                  <MapPin size={12}/> This is where recyclers will come to collect your waste.
                </p>
                <div className="field-grid">
                  <div className="field-item">
                    <label>Street Address</label>
                    {editingSection === 'seller'
                      ? <LocationAutocomplete
                          value={sellerForm.location_query}
                          onSelect={(loc, text) => {
                            if (!loc) {
                              setSellerForm(prev => ({ ...prev, location_query: text }));
                              return;
                            }
                            setSellerForm(prev => ({
                              ...prev,
                              location_query: text,
                              lat: loc.lat, lng: loc.lng,
                              address: loc.address, city: loc.city,
                            }));
                          }}/>
                      : <div className="field-value">{sellerLocAddress}</div>}
                  </div>
                  <div className="field-item">
                    <label>City / Town</label>
                    {editingSection === 'seller'
                      ? <input className="form-input" value={sellerForm.city}
                          onChange={e => setSellerForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="e.g. Nairobi"/>
                      : <div className="field-value">{sellerLocCity}</div>}
                  </div>
                </div>
                {(sellerLocLat || sellerForm.lat) && (
                  <div className="coords-row">
                    <div className="coords-icon"><MapPin size={16}/></div>
                    <div className="coords-text">
                      <small>Coordinates saved</small>
                      <span>
                        {Number(sellerLocLat || sellerForm.lat).toFixed(4)},{' '}
                        {Number(sellerLocLng || sellerForm.lng).toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Waste I Generate</span>
                  <div className="section-icon-btn"><Recycle size={15}/></div>
                </div>
                <p className="section-hint">
                  <Package size={12}/> Recyclers use this to decide if they can collect from you.
                </p>
                {editingSection === 'seller'
                  ? <Select isMulti options={wasteOptions} styles={selectStyles}
                      value={wasteOptions.filter(o => sellerForm.waste_types.includes(o.value))}
                      onChange={vals => setSellerForm(prev => ({ ...prev, waste_types: vals.map(v => v.value) }))}
                      placeholder="Select all waste types you produce…"/>
                  : (
                    <div className="recycle-tags">
                      {sellerLocAcceptedTypes.length > 0
                        ? sellerLocAcceptedTypes.map(t => (
                            <div className="recycle-tag" key={t}><Recycle size={12}/>{t}</div>
                          ))
                        : <span style={{fontSize:13, color:'#9aab9e'}}>No waste types added yet.</span>}
                    </div>
                  )}
              </div>

              {editingSection === 'seller' && (
                <div className="section-card">
                  <div className="btn-row">
                    <button className="btn btn-ghost" onClick={() => setEditingSection(null)}>Cancel</button>
                    <button className="btn btn-primary" disabled={saving} onClick={saveSellerProfile}>
                      {saving
                        ? <><span className="spinner"/> Saving…</>
                        : <><Check size={14}/> Save &amp; Go Live on Map</>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── RECYCLER SECTION ── */}
          {isRecycler && (
            <>
              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Business Details</span>
                  <div className="section-icon-btn"><Building2 size={15}/></div>
                </div>
                <div className="field-grid">
                  <div className="field-item">
                    <label>Business Name</label>
                    {editingSection === 'recycler'
                      ? <input className="form-input" value={rpForm.business_name}
                          onChange={e => setRpForm(prev => ({ ...prev, business_name: e.target.value }))}/>
                      : <div className="field-value">{recyclerBusinessName}</div>}
                  </div>
                  <div className="field-item">
                    <label>Contact Person</label>
                    <div className="field-value">{user?.full_name || '—'}</div>
                  </div>
                  <div className="field-item">
                    <label>Email</label>
                    <div className="field-value">{user?.email || '—'}</div>
                  </div>
                  <div className="field-item">
                    <label>Phone</label>
                    {editingSection === 'recycler'
                      ? <input className="form-input" value={rpForm.phone}
                          onChange={e => setRpForm(prev => ({ ...prev, phone: e.target.value }))}/>
                      : <div className="field-value">{recyclerPhone}</div>}
                  </div>
                  <div className="field-item full-col">
                    <label>Website <span style={{fontWeight:400, textTransform:'none'}}>(optional)</span></label>
                    {editingSection === 'recycler'
                      ? <input className="form-input" placeholder="https://" value={rpForm.website}
                          onChange={e => setRpForm(prev => ({ ...prev, website: e.target.value }))}/>
                      : <div className="field-value">
                          {recyclerWebsite
                            ? <a href={recyclerWebsite} target="_blank" rel="noreferrer">{recyclerWebsite}</a>
                            : '—'}
                        </div>}
                  </div>
                </div>
                <div className="field-bio">
                  <label>About Your Centre</label>
                  {editingSection === 'recycler'
                    ? <textarea className="form-input" rows={4}
                        placeholder="Tell sellers about your recycling centre…"
                        value={rpForm.description}
                        onChange={e => setRpForm(prev => ({ ...prev, description: e.target.value }))}/>
                    : <p>{recyclerDescription || <span style={{color:'#9aab9e'}}>No description yet.</span>}</p>}
                </div>
                {editingSection === 'recycler' && (
                  <>
                    <div className="form-group" style={{marginTop:16}}>
                      <label className="form-label">Accepted Waste Types</label>
                      <Select isMulti options={wasteOptions} styles={selectStyles}
                        value={wasteOptions.filter(o => rpForm.accepted_types.includes(o.value))}
                        onChange={vals => setRpForm(prev => ({ ...prev, accepted_types: vals.map(v => v.value) }))}/>
                    </div>
                    <div className="form-group" style={{marginTop:12}}>
                      <label className="form-label">Max Capacity (kg)</label>
                      <input type="number" className="form-input" value={rpForm.max_capacity_kg}
                        onChange={e => setRpForm(prev => ({ ...prev, max_capacity_kg: e.target.value }))}/>
                    </div>
                  </>
                )}
              </div>

              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Centre Location</span>
                  <div className="section-icon-btn"><MapPin size={15}/></div>
                </div>
                <div className="field-grid">
                  <div className="field-item">
                    <label>Street Address</label>
                    {editingSection === 'recycler'
                      ? <LocationAutocomplete
                          value={rpForm.location_query}
                          onSelect={(loc, text) => {
                            if (!loc) {
                              setRpForm(prev => ({ ...prev, location_query: text }));
                              return;
                            }
                            setRpForm(prev => ({
                              ...prev,
                              location_query: text,
                              lat: loc.lat, lng: loc.lng,
                              address: loc.address, city: loc.city,
                            }));
                          }}/>
                      : <div className="field-value">{recyclerAddress}</div>}
                  </div>
                  <div className="field-item">
                    <label>City / Town</label>
                    {editingSection === 'recycler'
                      ? <input className="form-input" value={rpForm.city}
                          onChange={e => setRpForm(prev => ({ ...prev, city: e.target.value }))}/>
                      : <div className="field-value">{recyclerCity}</div>}
                  </div>
                </div>
                {(recyclerLat || rpForm.lat) && (
                  <div className="coords-row">
                    <div className="coords-icon"><MapPin size={16}/></div>
                    <div className="coords-text">
                      <small>Coordinates</small>
                      <span>
                        {Number(recyclerLat || rpForm.lat).toFixed(4)},{' '}
                        {Number(recyclerLng || rpForm.lng).toFixed(4)}
                      </span>
                    </div>
                    {editingSection !== 'recycler' && (
                      <button className="btn-update-map" onClick={() => toggleEdit('recycler')}>Update</button>
                    )}
                  </div>
                )}
              </div>

              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Working Hours</span>
                  <div className="section-icon-btn"><Clock size={15}/></div>
                </div>
                {editingSection === 'recycler' ? (
                  <>
                    <div className="day-presets">
                      <button type="button" className="day-preset-btn"
                        onClick={() => setRpForm(prev => ({ ...prev, operating_days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] }))}>
                        Mon–Fri
                      </button>
                      <button type="button" className="day-preset-btn"
                        onClick={() => setRpForm(prev => ({ ...prev, operating_days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] }))}>
                        Mon–Sat
                      </button>
                    </div>
                    <Select isMulti options={dayOptions} styles={selectStyles} placeholder="Select working days…"
                      value={dayOptions.filter(o => rpForm.operating_days.includes(o.value))}
                      onChange={vals => setRpForm(prev => ({ ...prev, operating_days: vals.map(v => v.value) }))}/>
                    <div className="field-grid" style={{marginTop:14}}>
                      <div className="field-item">
                        <label>Opening Time</label>
                        <input type="time" className="form-input" value={rpForm.opening_time}
                          onChange={e => setRpForm(prev => ({ ...prev, opening_time: e.target.value }))}/>
                      </div>
                      <div className="field-item">
                        <label>Closing Time</label>
                        <input type="time" className="form-input" value={rpForm.closing_time}
                          onChange={e => setRpForm(prev => ({ ...prev, closing_time: e.target.value }))}/>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="hours-list">
                    {displayDays.length > 0
                      ? displayDays.map(day => (
                          <div className="hours-row" key={day}>
                            <div className="day-abbr">{DAY_ABBR[day]}</div>
                            <div className="day-name">{day}</div>
                            <div className="hours-time">
                              {recyclerOperatingHours.open  || rpForm.opening_time || '08:00'}{' – '}
                              {recyclerOperatingHours.close || rpForm.closing_time || '17:00'}
                            </div>
                            <div className="dot-open"/>
                          </div>
                        ))
                      : <p style={{color:'#9aab9e', fontSize:14, margin:0}}>No hours set yet.</p>}
                  </div>
                )}
              </div>

              {editingSection === 'recycler' && (
                <div className="section-card">
                  <div className="btn-row">
                    <button className="btn btn-ghost" onClick={() => setEditingSection(null)}>Cancel</button>
                    <button className="btn btn-primary" disabled={saving} onClick={saveRecyclerProfile}>
                      {saving
                        ? <><span className="spinner"/> Saving…</>
                        : <><Check size={14}/> Save Changes</>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="profile-right">
          {isSeller && (
            <>
              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Waste I Generate</span>
                  <div className="section-icon-btn"><Package size={15}/></div>
                </div>
                <div className="recycle-tags">
                  {sellerLocAcceptedTypes.length > 0
                    ? sellerLocAcceptedTypes.map(t => (
                        <div className="recycle-tag" key={t}><Recycle size={12}/>{t}</div>
                      ))
                    : <span style={{fontSize:13, color:'#9aab9e'}}>No waste types added yet.</span>}
                </div>
              </div>

              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Map Visibility</span>
                  <div className="section-icon-btn"><MapPin size={15}/></div>
                </div>
                <ul className="quick-stats">
                  <li className="quick-stat">
                    <div className={`quick-stat-icon ${hasSellerLocation ? 'green' : ''}`}><MapPin size={14}/></div>
                    <span className="quick-stat-label">Location</span>
                    <span className="quick-stat-value">{sellerLocCity || 'Not set'}</span>
                  </li>
                  <li className="quick-stat">
                    <div className={`quick-stat-icon ${sellerLocAcceptedTypes.length > 0 ? 'green' : ''}`}><Recycle size={14}/></div>
                    <span className="quick-stat-label">Waste Types</span>
                    <span className="quick-stat-value">{sellerLocAcceptedTypes.length} selected</span>
                  </li>
                  <li className="quick-stat">
                    <div className={`quick-stat-icon ${hasSellerLocation ? 'green' : 'amber'}`}>
                      {hasSellerLocation ? <Check size={14}/> : <AlertCircle size={14}/>}
                    </div>
                    <span className="quick-stat-label">Visible to recyclers</span>
                    <span className="quick-stat-value" style={{color: hasSellerLocation ? '#1a4731' : '#e07b2a'}}>
                      {hasSellerLocation ? 'Yes ✓' : 'Not yet'}
                    </span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {isRecycler && (
            <>
              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">What We Recycle</span>
                  <div className="section-icon-btn"><Recycle size={15}/></div>
                </div>
                <div className="recycle-tags">
                  {recyclerAcceptedTypes.length > 0
                    ? recyclerAcceptedTypes.map(t => (
                        <div className="recycle-tag" key={t}><Recycle size={12}/>{t}</div>
                      ))
                    : <span style={{fontSize:13, color:'#9aab9e'}}>No waste types added yet.</span>}
                </div>
              </div>

              <div className="section-card">
                <div className="section-card-hd"><span className="section-card-title">Quick Stats</span></div>
                <ul className="quick-stats">
                  <li className="quick-stat">
                    <div className="quick-stat-icon"><Recycle size={14}/></div>
                    <span className="quick-stat-label">Waste Types</span>
                    <span className="quick-stat-value">{recyclerAcceptedTypes.length}</span>
                  </li>
                  <li className="quick-stat">
                    <div className="quick-stat-icon"><MapPin size={14}/></div>
                    <span className="quick-stat-label">Location</span>
                    <span className="quick-stat-value">{recyclerCity || rpForm.city || '—'}</span>
                  </li>
                  <li className="quick-stat">
                    <div className="quick-stat-icon"><Calendar size={14}/></div>
                    <span className="quick-stat-label">Days Open</span>
                    <span className="quick-stat-value">{displayDays.length} / 7</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          <div className="section-card">
            <div className="section-card-hd"><span className="section-card-title">Account</span></div>
            <ul className="account-list">
              <li className="account-item"><span className="account-item-icon"><Lock size={15}/></span>Change Password</li>
              <li className="account-item"><span className="account-item-icon"><Bell size={15}/></span>Notification Settings</li>
              <li className="account-item danger"><span className="account-item-icon"><Trash2 size={15}/></span>Delete Account</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}