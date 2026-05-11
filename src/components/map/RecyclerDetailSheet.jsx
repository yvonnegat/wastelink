/**
 * RecyclerDetailSheet.jsx
 * ─────────────────────────────────────────────────────────────────
 * Place at: src/components/map/RecyclerDetailSheet.jsx
 *
 * Swipeable bottom sheet that appears when a recycler is selected.
 * Shows full details, CTA buttons for call/directions/connect.
 */

import React from 'react';
import { WASTE_COLORS } from '../../data/recyclers';
import './RecyclerDetailSheet.css';

export function RecyclerDetailSheet({ item, onClose, onGetDirections, onConnect, routeLoading, userRole }) {
  if (!item) return null;

  const isListing = !!item.generatorName; // waste listing vs recycler
  const name      = item.name || item.generatorName;
  const types     = item.types || [];

  function StarRating({ rating }) {
    if (!rating) return null;
    const full = Math.floor(rating);
    return (
      <span className="detail-stars">
        {'★'.repeat(full)}{'☆'.repeat(5 - full)}
        <span className="detail-rating-num">{rating} ({item.reviews || 0})</span>
      </span>
    );
  }

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-sheet" role="dialog">
        {/* Drag handle */}
        <div className="detail-handle" />

        {/* Slide indicators (dots) */}
        <div className="detail-dots">
          <span /><span /><span className="active" />
        </div>

        {/* Header row */}
        <div className="detail-header">
          <div style={{ flex: 1 }}>
            <h2 className="detail-name">{name}</h2>
            <StarRating rating={item.rating} />
          </div>
          <div className="detail-header-right">
            {item.verified && (
              <span className="detail-verified">✓ Verified</span>
            )}
            <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Type badges */}
        <div className="detail-types">
          <div className="detail-types-label">ACCEPTS</div>
          <div className="detail-types-row">
            {types.map((t) => (
              <span key={t} className="detail-type-badge" style={{ background: WASTE_COLORS[t] || WASTE_COLORS.default }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Info rows */}
        <div className="detail-info">
          {item.address && (
            <div className="detail-info-row">
              <span className="detail-info-icon">📍</span>
              <span>{item.address}</span>
            </div>
          )}
          {item.hours && (
            <div className="detail-info-row">
              <span className="detail-info-icon">🕐</span>
              <span>{item.hours}</span>
            </div>
          )}
          {item.phone && (
            <div className="detail-info-row">
              <span className="detail-info-icon">📞</span>
              <a href={`tel:${item.phone}`} className="detail-phone">{item.phone}</a>
            </div>
          )}
          {item.qty && (
            <div className="detail-info-row">
              <span className="detail-info-icon">⚖️</span>
              <span>{item.qty} available</span>
            </div>
          )}
          {item.price && (
            <div className="detail-info-row">
              <span className="detail-info-icon">💰</span>
              <span>{item.price}</span>
            </div>
          )}
          {item.distanceKm !== null && item.distanceKm !== undefined && (
            <div className="detail-info-row">
              <span className="detail-info-icon">🗺️</span>
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

        {/* Actions */}
        <div className="detail-actions">
          <button
            className="detail-btn detail-btn--primary"
            onClick={() => onGetDirections(item)}
            disabled={routeLoading}
          >
            {routeLoading ? (
              <span className="detail-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
            )}
            Get Directions
          </button>
          {item.phone && (
            <a href={`tel:${item.phone}`} className="detail-btn detail-btn--call">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.07 2.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Call
            </a>
          )}
        </div>

        {/* Connect CTA */}
        {onConnect && (
          <button className="detail-btn-connect" onClick={() => onConnect(item)}>
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
          Open in Google Maps ↗
        </a>
      </div>
    </>
  );
}