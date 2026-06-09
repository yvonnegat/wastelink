/**
 * RecyclerDetailSheet.jsx
 * ─────────────────────────────────────────────────────────────────
 * Place at: src/components/map/RecyclerDetailSheet.jsx
 *
 * Swipeable bottom sheet that appears when a recycler is selected.
 * Shows key details + CTA buttons. "View Full Profile" navigates
 * to the public profile page of the selected user.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Phone, Clock, Scale, DollarSign, Navigation2,
  Map, Star, BadgeCheck, X, ChevronRight, Recycle,
  Navigation, ExternalLink, User
} from 'lucide-react';
import { WASTE_COLORS } from '../../data/recyclers';
import './RecyclerDetailSheet.css';

export function RecyclerDetailSheet({
  item,
  onClose,
  onGetDirections,
  onConnect,
  routeLoading,
  userRole,
}) {
  const navigate = useNavigate();

  if (!item) return null;

  const isListing    = !!item.generatorName;
  const name         = item.name || item.generatorName;
  const types        = item.types || [];
  const profileUserId = item.userId || item.user_id;

  function StarRating({ rating }) {
    if (!rating) return null;
    const full = Math.floor(rating);
    return (
      <span className="detail-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={13}
            fill={i < full ? '#f59e0b' : 'none'}
            stroke={i < full ? '#f59e0b' : '#d1d5db'}
          />
        ))}
        <span className="detail-rating-num">
          {rating} ({item.reviews || 0})
        </span>
      </span>
    );
  }

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-sheet" role="dialog">

        {/* Drag handle */}
        <div className="detail-handle" />

        {/* Header row */}
        <div className="detail-header">
          <div style={{ flex: 1 }}>
            <h2 className="detail-name">{name}</h2>
            <StarRating rating={item.rating} />
          </div>
          <div className="detail-header-right">
            {item.verified && (
              <span className="detail-verified">
                <BadgeCheck size={13} strokeWidth={2.5} />
                Verified
              </span>
            )}
            <button className="detail-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Waste type badges */}
        {types.length > 0 && (
          <div className="detail-types">
            <div className="detail-types-label">ACCEPTS</div>
            <div className="detail-types-row">
              {types.map((t) => (
                <span
                  key={t}
                  className="detail-type-badge"
                  style={{ background: WASTE_COLORS[t] || WASTE_COLORS.default }}
                >
                  <Recycle size={10} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Info rows — Lucide icons instead of emoji */}
        <div className="detail-info">
          {item.address && (
            <div className="detail-info-row">
              <span className="detail-info-icon detail-info-icon--pin">
                <MapPin size={14} />
              </span>
              <span>{item.address}</span>
            </div>
          )}
          {item.hours && (
            <div className="detail-info-row">
              <span className="detail-info-icon detail-info-icon--clock">
                <Clock size={14} />
              </span>
              <span>{item.hours}</span>
            </div>
          )}
          {item.phone && (
            <div className="detail-info-row">
              <span className="detail-info-icon detail-info-icon--phone">
                <Phone size={14} />
              </span>
              <a href={`tel:${item.phone}`} className="detail-phone">
                {item.phone}
              </a>
            </div>
          )}
          {item.qty && (
            <div className="detail-info-row">
              <span className="detail-info-icon detail-info-icon--scale">
                <Scale size={14} />
              </span>
              <span>{item.qty} available</span>
            </div>
          )}
          {item.price && (
            <div className="detail-info-row">
              <span className="detail-info-icon detail-info-icon--price">
                <DollarSign size={14} />
              </span>
              <span>{item.price}</span>
            </div>
          )}
          {item.distanceKm != null && (
            <div className="detail-info-row">
              <span className="detail-info-icon detail-info-icon--nav">
                <Navigation size={14} />
              </span>
              <span>
                {item.distanceKm < 1
                  ? `${Math.round(item.distanceKm * 1000)} m away`
                  : `${item.distanceKm.toFixed(1)} km away`}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="detail-description">{item.description}</p>
        )}

        {/* ── Primary actions ── */}
        <div className="detail-actions">
          <button
            className="detail-btn detail-btn--primary"
            onClick={() => onGetDirections(item)}
            disabled={routeLoading}
          >
            {routeLoading ? (
              <span className="detail-spinner" />
            ) : (
              <Navigation2 size={15} />
            )}
            Get Directions
          </button>

          {item.phone && (
            <a href={`tel:${item.phone}`} className="detail-btn detail-btn--call">
              <Phone size={15} />
              Call
            </a>
          )}
        </div>

        {/* ── View Full Profile ── */}
        {profileUserId && (
          <button
            className="detail-btn-profile"
            onClick={() => {
              onClose();
              navigate(`/profile/${profileUserId}`);
            }}
          >
            <User size={15} />
            View Full Profile
            <ChevronRight size={15} className="detail-btn-profile-arrow" />
          </button>
        )}

        {/* ── Connect CTA ── */}
        {onConnect && (
          <button
            className="detail-btn-connect"
            onClick={() => onConnect(item)}
          >
            {userRole === 'recycler' ? 'Request Pickup →' : 'Connect to Recycler →'}
          </button>
        )}

        {/* Google Maps fallback */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="detail-gmaps-link"
        >
          <ExternalLink size={12} />
          Open in Google Maps
        </a>
      </div>
    </>
  );
}