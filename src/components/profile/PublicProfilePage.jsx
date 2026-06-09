/**
 * PublicProfilePage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Place at: src/components/profile/PublicProfilePage.jsx
 *
 * Read-only public profile shown when you tap "View Full Profile"
 * from the map detail sheet. Fetches user by :userId param.
 *
 * Route: /profile/:userId
 * Add to your router:
 *   <Route path="/profile/:userId" element={<PublicProfilePage />} />
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, Clock, Recycle,
  Package, Building2, BadgeCheck, Calendar, Scale,
  AlertCircle, User, ChevronRight, Navigation2
} from 'lucide-react';
import { usersService } from '../../services';
import './PublicProfilePage.css';

const DAY_ABBR = {
  Monday:'Mo', Tuesday:'Tu', Wednesday:'We',
  Thursday:'Th', Friday:'Fr', Saturday:'Sa', Sunday:'Su',
};

function parseDays(daysStr) {
  if (!daysStr) return [];
  if (daysStr === 'Mon-Fri')
    return ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  if (daysStr === 'Mon-Sat')
    return ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return daysStr.split(', ').filter(Boolean);
}

export default function PublicProfilePage() {
  const { userId } = useParams();
  const navigate   = useNavigate();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    usersService.getById(userId)
      .then(setProfile)
      .catch(err => setError(err.message || 'Could not load profile.'))
      .finally(() => setLoading(false));
  }, [userId]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="pub-profile-loading">
        <div className="pub-profile-spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !profile) {
    return (
      <div className="pub-profile-error">
        <AlertCircle size={32} color="#dc2626" />
        <p>{error || 'Profile not found.'}</p>
        <button className="pub-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Go Back
        </button>
      </div>
    );
  }

  const isRecycler  = profile.role === 'recycler';
  const rp          = profile.recycler_profiles || {};
  const ml          = profile.map_locations     || {};
  const opHours     = rp.operating_hours        || {};
  const displayDays = parseDays(opHours.days);

  const wasteTypes  = isRecycler
    ? (rp.accepted_types   || [])
    : (ml.accepted_types   || []);

  const address     = isRecycler ? (rp.address || '—') : (ml.address || '—');
  const city        = isRecycler ? (rp.city    || '—') : (ml.city    || '—');
  const phone       = isRecycler ? (rp.phone   || profile.phone) : profile.phone;

  const initials    = (profile.full_name || 'WL')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const joinedDate  = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month:'long', year:'numeric' })
    : 'recently';

  return (
    <div className="pub-profile-page">

      {/* ── Top bar ── */}
      <div className="pub-profile-topbar">
        <button className="pub-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back to Map
        </button>
      </div>

      {/* ── Hero card ── */}
      <div className="pub-hero-card">
        <div className="pub-avatar">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.full_name} className="pub-avatar-img" />
            : <div className="pub-avatar-initials">{initials}</div>
          }
        </div>
        <div className="pub-hero-text">
          <div className="pub-hero-name">
            {isRecycler ? (rp.business_name || profile.full_name) : profile.full_name}
            {profile.is_verified && (
              <span className="pub-verified-badge">
                <BadgeCheck size={14} /> Verified
              </span>
            )}
          </div>
          <div className="pub-hero-email">{profile.email}</div>
          <div className="pub-hero-meta">
            <span className={`pub-role-badge ${isRecycler ? 'recycler' : 'seller'}`}>
              {isRecycler
                ? <><Recycle size={11} /> Recycler</>
                : <><Package size={11} /> Waste Seller</>
              }
            </span>
            <span className="pub-joined">Joined {joinedDate}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="pub-profile-body">

        {/* ── Contact info ── */}
        <div className="pub-section-card">
          <div className="pub-section-hd">
            <span className="pub-section-title">
              {isRecycler ? 'Business Details' : 'Contact Details'}
            </span>
            <div className="pub-section-icon"><User size={15} /></div>
          </div>

          <div className="pub-info-list">
            {phone && (
              <a href={`tel:${phone}`} className="pub-info-row pub-info-row--link">
                <span className="pub-info-icon pub-info-icon--phone"><Phone size={14} /></span>
                <span>{phone}</span>
                <ChevronRight size={13} className="pub-info-chevron" />
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="pub-info-row pub-info-row--link">
                <span className="pub-info-icon pub-info-icon--mail"><Mail size={14} /></span>
                <span>{profile.email}</span>
                <ChevronRight size={13} className="pub-info-chevron" />
              </a>
            )}
            {isRecycler && rp.website && (
              <a href={rp.website} target="_blank" rel="noreferrer" className="pub-info-row pub-info-row--link">
                <span className="pub-info-icon pub-info-icon--globe"><Globe size={14} /></span>
                <span>{rp.website}</span>
                <ChevronRight size={13} className="pub-info-chevron" />
              </a>
            )}
          </div>

          {/* Description */}
          {(isRecycler ? rp.description : ml.description) && (
            <p className="pub-description">
              {isRecycler ? rp.description : ml.description}
            </p>
          )}

          {/* Max capacity (recycler) */}
          {isRecycler && rp.max_capacity_kg && (
            <div className="pub-capacity-row">
              <Scale size={14} color="#7c3aed" />
              <span>Max capacity: <strong>{rp.max_capacity_kg} kg</strong></span>
            </div>
          )}
        </div>

        {/* ── Location ── */}
        <div className="pub-section-card">
          <div className="pub-section-hd">
            <span className="pub-section-title">Location</span>
            <div className="pub-section-icon"><MapPin size={15} /></div>
          </div>
          <div className="pub-info-list">
            <div className="pub-info-row">
              <span className="pub-info-icon pub-info-icon--pin"><MapPin size={14} /></span>
              <span>{address}{city !== '—' ? `, ${city}` : ''}</span>
            </div>
          </div>
          {/* Directions shortcut */}
          {(isRecycler ? rp.lat : ml.lat) && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${isRecycler ? rp.lat : ml.lat},${isRecycler ? rp.lng : ml.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pub-directions-btn"
            >
              <Navigation2 size={14} />
              Get Directions
            </a>
          )}
        </div>

        {/* ── Waste types ── */}
        <div className="pub-section-card">
          <div className="pub-section-hd">
            <span className="pub-section-title">
              {isRecycler ? 'What We Recycle' : 'Waste I Generate'}
            </span>
            <div className="pub-section-icon"><Recycle size={15} /></div>
          </div>
          <div className="pub-waste-tags">
            {wasteTypes.length > 0
              ? wasteTypes.map(t => (
                  <div className="pub-waste-tag" key={t}>
                    <Recycle size={11} />{t}
                  </div>
                ))
              : <span className="pub-muted">No waste types listed.</span>
            }
          </div>
        </div>

        {/* ── Operating hours (recycler only) ── */}
        {isRecycler && (
          <div className="pub-section-card">
            <div className="pub-section-hd">
              <span className="pub-section-title">Working Hours</span>
              <div className="pub-section-icon"><Clock size={15} /></div>
            </div>
            {displayDays.length > 0
              ? (
                <div className="pub-hours-list">
                  {displayDays.map(day => (
                    <div className="pub-hours-row" key={day}>
                      <div className="pub-day-abbr">{DAY_ABBR[day]}</div>
                      <div className="pub-day-name">{day}</div>
                      <div className="pub-hours-time">
                        {opHours.open || '08:00'} – {opHours.close || '17:00'}
                      </div>
                      <div className="pub-dot-open" />
                    </div>
                  ))}
                </div>
              )
              : <p className="pub-muted">No hours listed.</p>
            }
          </div>
        )}

        {/* ── Stats row (recycler) ── */}
        {isRecycler && (
          <div className="pub-stats-row">
            <div className="pub-stat">
              <div className="pub-stat-val">{wasteTypes.length}</div>
              <div className="pub-stat-label">Waste Types</div>
            </div>
            <div className="pub-stat">
              <div className="pub-stat-val">{displayDays.length}</div>
              <div className="pub-stat-label">Days Open</div>
            </div>
            {rp.max_capacity_kg && (
              <div className="pub-stat">
                <div className="pub-stat-val">{rp.max_capacity_kg}<span style={{fontSize:12}}>kg</span></div>
                <div className="pub-stat-label">Capacity</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}