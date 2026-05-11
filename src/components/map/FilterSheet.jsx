/**
 * FilterSheet.jsx
 * ─────────────────────────────────────────────────────────────────
 * Place at: src/components/map/FilterSheet.jsx
 *
 * Bottom-sheet filter panel — mobile-friendly slide-up style.
 */

import React from 'react';
import { WASTE_FILTERS, WASTE_COLORS } from '../../data/recyclers';
import './FilterSheet.css';

export function FilterSheet({
  activeFilters,
  verifiedOnly,
  onToggleFilter,
  onSetVerified,
  onClear,
  onApply,
  resultCount,
  hasLocation,
}) {
  return (
    <>
      <div className="filter-overlay" onClick={onApply} />
      <div className="filter-sheet" role="dialog" aria-label="Filter recyclers">
        <div className="filter-sheet-handle" />
        <div className="filter-sheet-header">
          <h3 className="filter-sheet-title">Filter Recyclers</h3>
          <button className="filter-sheet-close" onClick={onApply} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Waste type pills */}
        <div className="filter-section">
          <div className="filter-section-label">ACCEPTS WASTE TYPE</div>
          <div className="filter-pills">
            {WASTE_FILTERS.slice(1).map((type) => {
              const active = activeFilters.includes(type);
              const color  = WASTE_COLORS[type] || WASTE_COLORS.default;
              return (
                <button
                  key={type}
                  className={`filter-pill-chip ${active ? 'active' : ''}`}
                  style={active ? { background: color, borderColor: color, color: '#fff' } : {}}
                  onClick={() => onToggleFilter(type)}
                >
                  {active && (
                    <span className="filter-pill-check">✓</span>
                  )}
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Distance notice */}
        {!hasLocation && (
          <div className="filter-location-notice">
            <span>📍</span>
            <span>Enable location to filter by distance</span>
          </div>
        )}

        {/* Verified toggle */}
        <div className="filter-section filter-verified-row">
          <div>
            <div className="filter-verified-title">Verified centres only</div>
            <div className="filter-verified-sub">Show only government-verified recyclers</div>
          </div>
          <button
            className={`filter-toggle ${verifiedOnly ? 'on' : 'off'}`}
            onClick={() => onSetVerified(!verifiedOnly)}
            role="switch"
            aria-checked={verifiedOnly}
          >
            <span className="filter-toggle-thumb" />
          </button>
        </div>

        {/* Actions */}
        <div className="filter-actions">
          <button className="filter-btn filter-btn--reset" onClick={onClear}>
            Reset all
          </button>
          <button className="filter-btn filter-btn--apply" onClick={onApply}>
            Show {resultCount} result{resultCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </>
  );
}