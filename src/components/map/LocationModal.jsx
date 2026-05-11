/**
 * LocationModal.jsx
 * ─────────────────────────────────────────────────────────────────
 * Place at: src/components/map/LocationModal.jsx
 *
 * Uber-style permission modal. Two variants:
 *   1. "Allow Location Access" — first-time ask
 *   2. "Location Access Blocked" — after denial
 */

import React from 'react';
import './LocationModal.css';

export function LocationModal({ status, onAllow, onDismiss }) {
  if (status === 'blocked') {
    return (
      <div className="loc-modal-overlay" role="dialog" aria-modal="true">
        <div className="loc-modal">
          <div className="loc-modal-icon loc-modal-icon--blocked">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#2D6A4F"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
              <line x1="4" y1="4" x2="20" y2="20" stroke="#C04040" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="loc-modal-title">Location Access Blocked</h2>
          <p className="loc-modal-body">
            You've blocked location access. To find recyclers near you, please enable location
            in your browser or device settings, then reload the page.
          </p>
          <button className="loc-modal-btn loc-modal-btn--outline" onClick={onDismiss}>
            Browse Without Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loc-modal-overlay" role="dialog" aria-modal="true">
      <div className="loc-modal">
        <div className="loc-modal-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#2D6A4F"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        </div>
        <h2 className="loc-modal-title">Allow Location Access</h2>
        <p className="loc-modal-body">
          WasteLink needs your location to show nearby recyclers and help you find
          the fastest route. We never store or share your location.
        </p>
        <div className="loc-modal-badge">
          <span className="loc-modal-dot" />
          <span><strong>wastelink.app</strong> wants to know your location</span>
        </div>
        <button className="loc-modal-btn loc-modal-btn--primary" onClick={onAllow}>
          Allow Location
        </button>
        <button className="loc-modal-btn loc-modal-btn--outline" onClick={onDismiss}>
          Not Now
        </button>
        <p className="loc-modal-hint">You can change this later in your browser settings.</p>
      </div>
    </div>
  );
}