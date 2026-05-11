/**
 * RecyclerListView.jsx
 * ─────────────────────────────────────────────────────────────────
 * Place at: src/components/map/RecyclerListView.jsx
 *
 * List view for recyclers — shown when user taps "List" in the header.
 */

import React from 'react';
import { WASTE_COLORS } from '../../data/recyclers';
import './RecyclerListView.css';

export function RecyclerListView({ items, onSelect, loading }) {
  if (loading) {
    return (
      <div className="list-view">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="list-skeleton" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="list-empty">
        <div className="list-empty-icon">♻️</div>
        <div className="list-empty-title">No recyclers found</div>
        <div className="list-empty-sub">Try adjusting your filters or search</div>
      </div>
    );
  }

  return (
    <div className="list-view">
      {items.map((item) => {
        const name    = item.name || item.generatorName;
        const types   = item.types || [];
        const distStr = item.distanceKm !== null && item.distanceKm !== undefined
          ? item.distanceKm < 1
            ? `${Math.round(item.distanceKm * 1000)} m`
            : `${item.distanceKm.toFixed(1)} km`
          : null;

        return (
          <button key={item.id} className="list-item" onClick={() => onSelect(item)}>
            <div className="list-item-main">
              <div className="list-item-name-row">
                <span className="list-item-name">{name}</span>
                {item.verified && <span className="list-item-verified-dot" title="Verified" />}
              </div>

              <div className="list-item-types">
                {types.slice(0, 3).map((t) => (
                  <span key={t} className="list-item-type" style={{ color: WASTE_COLORS[t] || WASTE_COLORS.default }}>
                    {t}
                  </span>
                ))}
              </div>

              <div className="list-item-meta">
                {item.rating && (
                  <span className="list-item-rating">
                    ★ {item.rating} ({item.reviews})
                  </span>
                )}
                {item.hours && (
                  <span className="list-item-hours">· {item.hours}</span>
                )}
              </div>
            </div>

            <div className="list-item-right">
              {distStr && <span className="list-item-dist">{distStr}</span>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}