import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  { value: 'Plastic',     label: 'Plastic' },
  { value: 'Paper',       label: 'Paper' },
  { value: 'Cardboard',   label: 'Cardboard' },
  { value: 'Glass',       label: 'Glass' },
  { value: 'Metal',       label: 'Metal' },
  { value: 'E-Waste',     label: 'E-Waste' },
  { value: 'Organic',     label: 'Organic' },
  { value: 'Textiles',    label: 'Textiles' },
  { value: 'Tyres',       label: 'Tyres' },
  { value: 'Batteries',   label: 'Batteries' },
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

const selectStyles = {
  control: (b) => ({ ...b, borderColor:'#e2ebe5', borderRadius:8, fontSize:14, boxShadow:'none', minHeight:38, '&:hover':{ borderColor:'#1a7a4a' } }),
  option:  (b,s) => ({ ...b, fontSize:14, background:s.isSelected?'#1a7a4a':s.isFocused?'#e6f4ec':'white', color:s.isSelected?'white':'#0d1b12' }),
  multiValue:       (b) => ({ ...b, background:'#d0eddb', borderRadius:20 }),
  multiValueLabel:  (b) => ({ ...b, color:'#0d2b1f', fontWeight:600, fontSize:12 }),
  multiValueRemove: (b) => ({ ...b, color:'#1a7a4a', ':hover':{ background:'#b0d8be' } }),
};

function cacheUserProfile(updatedUser) {
  localStorage.setItem('wastelink_user_profile', JSON.stringify(updatedUser));
}

// ─── Helpers ──────────────────────────────────────────────────
function formatDays(days) {
  if (!days?.length) return 'Mon-Fri';
  const d = [...days].sort();
  const mf = d.length===5 && ['Monday','Tuesday','Wednesday','Thursday','Friday'].every(x=>d.includes(x));
  const ms = d.length===6 && mf && d.includes('Saturday');
  if (ms) return 'Mon-Sat';
  if (mf) return 'Mon-Fri';
  return d.join(', ');
}

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

  // ── Recycler form ────────────────────────────────────────────
  const [rpForm, setRpForm] = useState({
    business_name:'', accepted_types:[], max_capacity_kg:'',
    phone:'', description:'', website:'',
    operating_days:[], opening_time:'08:00', closing_time:'17:00',
    location_query:'', lat:null, lng:null, address:'', city:'',
  });
    const { showToast } = useToast();

  // ── Seller form ──────────────────────────────────────────────
  const [sellerForm, setSellerForm] = useState({
    business_name:'', phone:'', description:'',
    waste_types:[],
    location_query:'', lat:null, lng:null, address:'', city:'',
  });

  // ── Basic profile form ────────────────────────────────────────
  const [form, setForm] = useState({ full_name:'', phone:'' });

  const isRecycler = user?.role === 'recycler';
  const isSeller   = user?.role === 'seller' || user?.role === 'waste_generator' || (!isRecycler);

  // ── Derive sellerLoc reactively from user so it updates after save ──
  // This fixes the "not saved" display bug — previously a stale snapshot
  const sellerLoc = useMemo(() => user?.map_locations || {}, [user]);
  const recycler  = useMemo(() => ({ ...user?.map_locations, ...user?.recycler_profiles }) || {}, [user]);
  useEffect(() => {
  console.log('USER:', user);
  console.log('MAP LOCATIONS:', user?.map_locations);
  console.log('RECYCLER PROFILES:', user?.recycler_profiles);
}, [user]);
  // ── Load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setForm({ full_name: user.full_name||'', phone: user.phone||'' });

    if (isRecycler) {
      const r = { ...user.map_locations, ...user.recycler_profiles } || {};
      setRpForm({
        business_name:  r.business_name || '',
        accepted_types: r.accepted_types || [],
        max_capacity_kg:r.max_capacity_kg || '',
        phone:          r.phone || user.phone || '',
        description:    r.description || '',
        website:        r.website || '',
        operating_days: r.operating_hours?.days
          ? r.operating_hours.days==='Mon-Fri'
            ? ['Monday','Tuesday','Wednesday','Thursday','Friday']
            : r.operating_hours.days==='Mon-Sat'
            ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
            : r.operating_hours.days.split(', ')
          : [],
        opening_time: r.operating_hours?.open  || '08:00',
        closing_time: r.operating_hours?.close || '17:00',
        location_query: r.address || '',
        lat: r.lat || null, lng: r.lng || null,
        address: r.address || '', city: r.city || '',
      });
    } else {
      const ml = user.map_locations || {};
      setSellerForm({
        business_name:  user.full_name || '',
        phone:          user.phone || '',
        description:    ml.description || '',
        waste_types:    ml.accepted_types || [],
        location_query: ml.address || '',
        lat:  ml.lat  || null,
        lng:  ml.lng  || null,
        address: ml.address || '',
        city:    ml.city    || '',
      });
    }
  }, [user, isRecycler]);

  // ── Save basic profile ────────────────────────────────────────
  async function saveProfile() {
    setSaving(true); setMsg(''); setError('');
    try {
      const updated = await usersService.updateMe(form);
      updateUser(updated);
      cacheUserProfile(updated);
      setMsg('Profile updated.');
      setEditingSection(null);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  // ── Save seller profile → create waste_generator pin ─────────
  async function saveSellerProfile() {
    setSaving(true); setMsg(''); setError('');
    try {
      
     if (!sellerForm.business_name) {
  showToast(
    'Please enter your name or business name.',
    'error'
  );

  return;
}
     if (!sellerForm.lat || !sellerForm.lng) {
  document
    .querySelector('.location-section')
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

  showToast(
    'Please select your location so recyclers can find you.',
    'error'
  );

  return;
}
      if (!sellerForm.waste_types.length) { setError('Please select at least one type of waste you generate.'); return; }

      await usersService.updateMe({
        full_name: sellerForm.business_name,
        phone:     sellerForm.phone,
      });

      await locationService.saveWasteGeneratorLocation({
        userId:      user.id,
        listingId:   null,
        name:        sellerForm.business_name,
        lat:         sellerForm.lat,
        lng:         sellerForm.lng,
        address:     sellerForm.address,
        city:        sellerForm.city,
        description: sellerForm.description,
        phone:       sellerForm.phone,
        wasteTypes:  sellerForm.waste_types,
      });

      // ── FIXED: updateUser now includes all fields so the display
      //    re-reads them correctly without requiring a page refresh ──
      const updatedUser = {
      ...user,
      full_name: sellerForm.business_name,
      phone: sellerForm.phone,
      map_locations: {
        ...user.map_locations,
        address: sellerForm.address,
        city: sellerForm.city,
        lat: sellerForm.lat,
        lng: sellerForm.lng,
        accepted_types: sellerForm.waste_types,
        description: sellerForm.description,
        phone: sellerForm.phone,
      },
    };

    updateUser(updatedUser);
    localStorage.setItem('wastelink_user_profile', JSON.stringify(updatedUser));

      showToast(
        'Profile saved! You are now visible to recyclers on the map.',
        'success'
      );
      setEditingSection(null);
    } catch(e) { console.error(e); setError(e.message); }
    finally { setSaving(false); }
  }

  // ── Save recycler profile ─────────────────────────────────────
  async function saveRecyclerProfile() {
    setSaving(true); setMsg(''); setError('');
    try {
      if (!rpForm.business_name)             { setError('Business name is required.'); return; }
      if (!rpForm.location_query || !rpForm.lat || !rpForm.lng) {
        
        showToast(
          'Please select at least one type of waste you generate.',
          'error'
        ); return;
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
        operating_hours, phone: rpForm.phone,
        address: rpForm.address, city: rpForm.city,
        lat: rpForm.lat, lng: rpForm.lng,
        description: rpForm.description, website: rpForm.website,
      });

      const locationPayload = {
        name: rpForm.business_name, lat: rpForm.lat, lng: rpForm.lng,
        address: rpForm.address, city: rpForm.city,
        acceptedTypes: rpForm.accepted_types,
        operatingHours: operating_hours,
        description: rpForm.description, phone: rpForm.phone,
      };

      const nearby = await locationService.findNearbySeededCentre(rpForm.lat, rpForm.lng, 0.2);
      if (nearby) {
        setPendingPayload(locationPayload);
        setNearbySeeded(nearby);
        return;
      }

      await locationService.saveRecyclerLocation({ userId: user.id, ...locationPayload });
      finishRecyclerSave(operating_hours);
    } catch(e) { console.error(e); setError(e.message); }
    finally { setSaving(false); }
  }

  function finishRecyclerSave(operating_hours) {
    updateUser({
      recycler_profiles: { ...user?.recycler_profiles, ...rpForm, operating_hours },
      map_locations: {
        ...user?.map_locations,
        address: rpForm.address, city: rpForm.city,
        lat: rpForm.lat, lng: rpForm.lng,
        phone: rpForm.phone, description: rpForm.description,
        name: rpForm.business_name,
      },
    });
    setMsg('Recycler profile saved. Your centre is visible on the map.');
    setEditingSection(null);
    setNearbySeeded(null);
    setPendingPayload(null);
  }

  async function handleClaimSeeded(centre) {
    try {
      await locationService.claimSeededCentre(centre.id, user.id);
      finishRecyclerSave({ days: formatDays(rpForm.operating_days), open: rpForm.opening_time, close: rpForm.closing_time });
    } catch(e) { setError(e.message); setNearbySeeded(null); }
  }

  async function handleRegisterSeparately() {
    try {
      setNearbySeeded(null);
      await locationService.saveRecyclerLocation({ userId: user.id, ...pendingPayload });
      finishRecyclerSave(pendingPayload.operatingHours);
    } catch(e) { setError(e.message); }
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const data = await usersService.uploadAvatar(file);
      updateUser({ avatar_url: data.avatar_url });
      setMsg('Photo updated.');
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    await logout();
  }

  const initials = (user?.full_name||'WL').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  const displayDays = rpForm.operating_days.length ? rpForm.operating_days
    : recycler?.operating_hours?.days==='Mon-Fri'  ? ['Monday','Tuesday','Wednesday','Thursday','Friday']
    : recycler?.operating_hours?.days==='Mon-Sat'  ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    : [];

  const isEditingProfile  = editingSection === 'profile';
  const isEditingRp       = editingSection === 'recycler';
  const isEditingSeller   = editingSection === 'seller';

  function toggleEdit(section) {
    setEditingSection(prev => prev===section ? null : section);
    setMsg(''); setError('');
  }

  const hasSellerLocation = !!(sellerLoc.lat && sellerLoc.lng);

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="profile-page">

      {nearbySeeded && (
        <NearbySeededCentrePrompt
          nearby={nearbySeeded} userId={user.id}
          onClaimed={handleClaimSeeded}
          onRegisterAnyway={handleRegisterSeparately}
          onDismiss={() => { setNearbySeeded(null); setPendingPayload(null); }}
        />
      )}

      {/* ── Page header with logout ──────────────────────────── */}
      <div className="profile-page-hd">
        <div className="profile-page-hd-left">
          <div className="page-heading">My Profile</div>
          <div className="page-subheading">
            {isRecycler ? 'Manage your recycling centre details' : 'Not visible to recyclers yet. Add your location and waste types below'}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Log out">
          <LogOut size={15} />
          <span>Log out</span>
        </button>
      </div>

      {msg   && <div className="alert alert-info"><Check size={14}/> {msg}</div>}
      {error && <div className="alert alert-warn"><AlertCircle size={14}/> {error}</div>}


      {/* ── Hero ─────────────────────────────────────────────── */}
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
              {isRecycler ? (recycler?.business_name || user?.full_name || '—') : (user?.full_name || '—')}
            </div>
            <div className="hero-user-name">{user?.email}</div>
            <div className="hero-meta">
              <span className={`badge-role ${isRecycler ? 'recycler' : 'seller'}`}>
                {isRecycler ? <><Recycle size={11}/> Recycler</> : <><Package size={11}/> Waste Seller</>}
              </span>
              <span className="hero-joined">
                Joined {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'})
                  : 'recently'}
              </span>
            </div>
          </div>
          <button
            className={`btn-edit-profile${(isEditingProfile||isEditingRp||isEditingSeller)?' active':''}`}
            onClick={() => toggleEdit(isRecycler ? 'recycler' : 'seller')}
          >
            {(isEditingProfile||isEditingRp||isEditingSeller)
              ? <><X size={13}/> Cancel</>
              : <><Edit2 size={13}/> Edit Profile</>
            }
          </button>
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-left">

          {/* ══ SELLER PROFILE SECTION ══════════════════════════ */}
          {isSeller && (
            <>
              {/* Basic info */}
              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Your Details</span>
                  <div className="section-icon-btn"><User size={15}/></div>
                </div>
                <div className="field-grid">
                  <div className="field-item">
                    <label>Name / Business Name</label>
                    {isEditingSeller
                      ? <input className="form-input" value={sellerForm.business_name} onChange={e=>setSellerForm({...sellerForm,business_name:e.target.value})} placeholder="e.g. Hannah Wanjiku or ABC Hotel"/>
                      : <div className="field-value">{user?.full_name || '—'}</div>}
                  </div>
                  <div className="field-item">
                    <label>Email</label>
                    <div className="field-value">{user?.email || '—'}</div>
                  </div>
                  <div className="field-item">
                    <label>Phone Number</label>
                    {isEditingSeller
                      ? <input className="form-input" value={sellerForm.phone} onChange={e=>setSellerForm({...sellerForm,phone:e.target.value})} placeholder="+254 7XX XXX XXX"/>
                      : <div className="field-value">{user?.phone || '—'}</div>}
                  </div>
                  <div className="field-item full-col">
                    <label>About You / Your Business</label>
                    {isEditingSeller
                      ? <textarea className="form-input" rows={3} value={sellerForm.description} onChange={e=>setSellerForm({...sellerForm,description:e.target.value})} placeholder="e.g. Small hotel producing glass bottles, cardboard and plastic waste weekly."/>
                      : <div className="field-value">{sellerLoc.description || <span style={{color:'#9aab9e'}}>No description yet.</span>}</div>}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Your Location</span>
                  <div className="section-icon-btn"><MapPin size={15}/></div>
                </div>
                <p className="section-hint">
                  <MapPin size={12}/> This is where recyclers will come to collect your waste. Be as specific as possible.
                </p>
                <div className="field-grid">
                  <div className="field-item">
                    <label>Street Address</label>
                    {isEditingSeller
                      ? <LocationAutocomplete value={sellerForm.location_query}
                          onSelect={(loc, text) => {
                            if (!loc) { setSellerForm({...sellerForm, location_query:text}); return; }
                            setSellerForm({...sellerForm, location_query:text, lat:loc.lat, lng:loc.lng, address:loc.address, city:loc.city});
                          }}/>
                      : <div className="field-value">{sellerLoc.address || '—'}</div>}
                  </div>
                  <div className="field-item">
                    <label>City / Town</label>
                    {isEditingSeller
                      ? <input className="form-input" value={sellerForm.city} onChange={e=>setSellerForm({...sellerForm,city:e.target.value})} placeholder="e.g. Nairobi"/>
                      : <div className="field-value">{sellerLoc.city || '—'}</div>}
                  </div>
                </div>
                {(sellerLoc.lat || sellerForm.lat) && (
                  <div className="coords-row">
                    <div className="coords-icon"><MapPin size={16}/></div>
                    <div className="coords-text">
                      <small>Coordinates saved</small>
                      <span>{Number(sellerLoc.lat||sellerForm.lat).toFixed(4)}, {Number(sellerLoc.lng||sellerForm.lng).toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Waste types */}
              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Waste I Generate</span>
                  <div className="section-icon-btn"><Recycle size={15}/></div>
                </div>
                <p className="section-hint">
                  <Package size={12}/> Recyclers use this to decide if they can collect from you.
                </p>
                {isEditingSeller
                  ? <Select isMulti options={wasteOptions} styles={selectStyles}
                      value={wasteOptions.filter(o=>sellerForm.waste_types.includes(o.value))}
                      onChange={vals=>setSellerForm({...sellerForm,waste_types:vals.map(v=>v.value)})}
                      placeholder="Select all waste types you produce…"/>
                  : (
                    <div className="recycle-tags">
                      {(sellerLoc.accepted_types||[]).length>0
                        ? (sellerLoc.accepted_types||[]).map(t=>(
                            <div className="recycle-tag" key={t}><Recycle size={12}/>{t}</div>
                          ))
                        : <span style={{fontSize:13,color:'#9aab9e'}}>No waste types added yet.</span>
                      }
                    </div>
                  )
                }
              </div>

              {/* Save button */}
              {isEditingSeller && (
                <div className="section-card">
                  <div className="btn-row">
                    <button className="btn btn-ghost" onClick={()=>setEditingSection(null)}>Cancel</button>
                    <button className="btn btn-primary" disabled={saving} onClick={saveSellerProfile}>
                      {saving ? <><span className="spinner"/> Saving…</> : <><Check size={14}/> Save & Go Live on Map</>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ RECYCLER PROFILE SECTION ════════════════════════ */}
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
                    {isEditingRp
                      ? <input className="form-input" value={rpForm.business_name} onChange={e=>setRpForm({...rpForm,business_name:e.target.value})}/>
                      : <div className="field-value">{recycler?.business_name||'—'}</div>}
                  </div>
                  <div className="field-item">
                    <label>Contact Person</label>
                    <div className="field-value">{user?.full_name||'—'}</div>
                  </div>
                  <div className="field-item">
                    <label>Email</label>
                    <div className="field-value">{user?.email||'—'}</div>
                  </div>
                  <div className="field-item">
                    <label>Phone</label>
                    {isEditingRp
                      ? <input className="form-input" value={rpForm.phone} onChange={e=>setRpForm({...rpForm,phone:e.target.value})}/>
                      : <div className="field-value">{recycler?.phone||user?.phone||'—'}</div>}
                  </div>
                  <div className="field-item full-col">
                    <label>Website <span style={{fontWeight:400,textTransform:'none'}}>(optional)</span></label>
                    {isEditingRp
                      ? <input className="form-input" placeholder="https://" value={rpForm.website} onChange={e=>setRpForm({...rpForm,website:e.target.value})}/>
                      : <div className="field-value">{recycler?.website?<a href={recycler.website} target="_blank" rel="noreferrer">{recycler.website}</a>:'—'}</div>}
                  </div>
                </div>
                <div className="field-bio">
                  <label>About Your Centre</label>
                  {isEditingRp
                    ? <textarea className="form-input" rows={4} placeholder="Tell sellers about your recycling centre…" value={rpForm.description} onChange={e=>setRpForm({...rpForm,description:e.target.value})}/>
                    : <p>{recycler?.description||<span style={{color:'#9aab9e'}}>No description yet.</span>}</p>}
                </div>
                {isEditingRp && (
                  <>
                    <div className="form-group" style={{marginTop:16}}>
                      <label className="form-label">Accepted Waste Types</label>
                      <Select isMulti options={wasteOptions} styles={selectStyles}
                        value={wasteOptions.filter(o=>rpForm.accepted_types.includes(o.value))}
                        onChange={vals=>setRpForm({...rpForm,accepted_types:vals.map(v=>v.value)})}/>
                    </div>
                    <div className="form-group" style={{marginTop:12}}>
                      <label className="form-label">Max Capacity (kg)</label>
                      <input type="number" className="form-input" value={rpForm.max_capacity_kg} onChange={e=>setRpForm({...rpForm,max_capacity_kg:e.target.value})}/>
                    </div>
                  </>
                )}
                {isEditingRp && (
                  <div className="btn-row">
                    <button className="btn btn-ghost" onClick={()=>setEditingSection(null)}>Cancel</button>
                    <button className="btn btn-primary" disabled={saving} onClick={saveRecyclerProfile}>
                      {saving?<><span className="spinner"/> Saving…</>:<><Check size={14}/> Save Changes</>}
                    </button>
                  </div>
                )}
              </div>

              {/* Recycler Location */}
              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Centre Location</span>
                  <div className="section-icon-btn"><MapPin size={15}/></div>
                </div>
                <div className="field-grid">
                  <div className="field-item">
                    <label>Street Address</label>
                    {isEditingRp
                      ? <LocationAutocomplete value={rpForm.location_query}
                          onSelect={(loc,text)=>{
                            if(!loc){setRpForm({...rpForm,location_query:text});return;}
                            setRpForm({...rpForm,location_query:text,lat:loc.lat,lng:loc.lng,address:loc.address,city:loc.city});
                          }}/>
                      : <div className="field-value">{recycler?.address||'—'}</div>}
                  </div>
                  <div className="field-item">
                    <label>City / Town</label>
                    {isEditingRp
                      ? <input className="form-input" value={rpForm.city} onChange={e=>setRpForm({...rpForm,city:e.target.value})}/>
                      : <div className="field-value">{recycler?.city||'—'}</div>}
                  </div>
                </div>
                {(recycler?.lat||rpForm.lat)&&(
                  <div className="coords-row">
                    <div className="coords-icon"><MapPin size={16}/></div>
                    <div className="coords-text">
                      <small>Coordinates</small>
                      <span>{Number(recycler?.lat||rpForm.lat).toFixed(4)}, {Number(recycler?.lng||rpForm.lng).toFixed(4)}</span>
                    </div>
                    {!isEditingRp&&<button className="btn-update-map" onClick={()=>toggleEdit('recycler')}>Update</button>}
                  </div>
                )}
              </div>

              {/* Working Hours */}
              <div className="section-card">
                <div className="section-card-hd">
                  <span className="section-card-title">Working Hours</span>
                  <div className="section-icon-btn"><Clock size={15}/></div>
                </div>
                {isEditingRp?(
                  <>
                    <div className="day-presets">
                      <button type="button" className="day-preset-btn" onClick={()=>setRpForm({...rpForm,operating_days:['Monday','Tuesday','Wednesday','Thursday','Friday']})}>Mon–Fri</button>
                      <button type="button" className="day-preset-btn" onClick={()=>setRpForm({...rpForm,operating_days:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']})}>Mon–Sat</button>
                    </div>
                    <Select isMulti options={dayOptions} styles={selectStyles} placeholder="Select working days…"
                      value={dayOptions.filter(o=>rpForm.operating_days.includes(o.value))}
                      onChange={vals=>setRpForm({...rpForm,operating_days:vals.map(v=>v.value)})}/>
                    <div className="field-grid" style={{marginTop:14}}>
                      <div className="field-item">
                        <label>Opening Time</label>
                        <input type="time" className="form-input" value={rpForm.opening_time} onChange={e=>setRpForm({...rpForm,opening_time:e.target.value})}/>
                      </div>
                      <div className="field-item">
                        <label>Closing Time</label>
                        <input type="time" className="form-input" value={rpForm.closing_time} onChange={e=>setRpForm({...rpForm,closing_time:e.target.value})}/>
                      </div>
                    </div>
                  </>
                ):(
                  <div className="hours-list">
                    {displayDays.length>0?displayDays.map(day=>(
                      <div className="hours-row" key={day}>
                        <div className="day-abbr">{DAY_ABBR[day]}</div>
                        <div className="day-name">{day}</div>
                        <div className="hours-time">{recycler?.operating_hours?.open||rpForm.opening_time||'08:00'} – {recycler?.operating_hours?.close||rpForm.closing_time||'17:00'}</div>
                        <div className="dot-open"/>
                      </div>
                    )):<p style={{color:'#9aab9e',fontSize:14,margin:0}}>No hours set yet.</p>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
        <div className="profile-right">

          {/* Seller quick stats */}
          {isSeller && (
            <div className="section-card">
              <div className="section-card-hd">
                <span className="section-card-title">Waste I Generate</span>
                <div className="section-icon-btn"><Package size={15}/></div>
              </div>
              <div className="recycle-tags">
                {(sellerLoc.accepted_types||[]).length>0
                  ?(sellerLoc.accepted_types||[]).map(t=>(<div className="recycle-tag" key={t}><Recycle size={12}/>{t}</div>))
                  :<span style={{fontSize:13,color:'#9aab9e'}}>No waste types added yet.</span>}
              </div>
            </div>
          )}

          {/* Seller map visibility status */}
          {isSeller && (
            <div className="section-card">
              <div className="section-card-hd">
                <span className="section-card-title">Map Visibility</span>
                <div className="section-icon-btn"><MapPin size={15}/></div>
              </div>
              <ul className="quick-stats">
                <li className="quick-stat">
                  <div className={`quick-stat-icon ${hasSellerLocation?'green':''}`}><MapPin size={14}/></div>
                  <span className="quick-stat-label">Location</span>
                  <span className="quick-stat-value">{sellerLoc.city||'Not set'}</span>
                </li>
                <li className="quick-stat">
                  <div className={`quick-stat-icon ${(sellerLoc.accepted_types||[]).length>0?'green':''}`}><Recycle size={14}/></div>
                  <span className="quick-stat-label">Waste Types</span>
                  <span className="quick-stat-value">{(sellerLoc.accepted_types||[]).length} selected</span>
                </li>
                <li className="quick-stat">
                  <div className={`quick-stat-icon ${hasSellerLocation?'green':'amber'}`}>
                    {hasSellerLocation?<Check size={14}/>:<AlertCircle size={14}/>}
                  </div>
                  <span className="quick-stat-label">Visible to recyclers</span>
                  <span className="quick-stat-value" style={{color:hasSellerLocation?'#1a4731':'#e07b2a'}}>
                    {hasSellerLocation?'Yes ✓':'Not yet'}
                  </span>
                </li>
              </ul>
            </div>
          )}

          {/* Recycler waste types */}
          {isRecycler && (
            <div className="section-card">
              <div className="section-card-hd">
                <span className="section-card-title">What We Recycle</span>
                <div className="section-icon-btn"><Recycle size={15}/></div>
              </div>
              <div className="recycle-tags">
                {(recycler?.accepted_types||rpForm.accepted_types||[]).map(t=>(
                  <div className="recycle-tag" key={t}><Recycle size={12}/>{t}</div>
                ))}
                {!(recycler?.accepted_types||rpForm.accepted_types||[]).length&&(
                  <span style={{fontSize:13,color:'#9aab9e'}}>No waste types added yet.</span>
                )}
              </div>
            </div>
          )}

          {/* Recycler quick stats */}
          {isRecycler && (
            <div className="section-card">
              <div className="section-card-hd"><span className="section-card-title">Quick Stats</span></div>
              <ul className="quick-stats">
                <li className="quick-stat">
                  <div className="quick-stat-icon"><Recycle size={14}/></div>
                  <span className="quick-stat-label">Waste Types</span>
                  <span className="quick-stat-value">{(recycler?.accepted_types||rpForm.accepted_types||[]).length}</span>
                </li>
                <li className="quick-stat">
                  <div className="quick-stat-icon"><MapPin size={14}/></div>
                  <span className="quick-stat-label">Location</span>
                  <span className="quick-stat-value">{recycler?.city||rpForm.city||'—'}</span>
                </li>
                <li className="quick-stat">
                  <div className="quick-stat-icon"><Calendar size={14}/></div>
                  <span className="quick-stat-label">Days Open</span>
                  <span className="quick-stat-value">{displayDays.length} / 7</span>
                </li>
                {recycler?.rating&&(
                  <li className="quick-stat">
                    <div className="quick-stat-icon" style={{color:'#e6a817',background:'#fef9e7'}}><Star size={14}/></div>
                    <span className="quick-stat-label">Rating</span>
                    <span className="quick-stat-value" style={{color:'#e6a817'}}>{recycler.rating} / 5.0</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Account */}
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