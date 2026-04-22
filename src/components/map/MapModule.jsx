import React, { useEffect, useRef, useState } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { markerColorForTypes } from '../../services/geoService';
import { WASTE_FILTERS, MAP_DEFAULTS } from '../../data/mockData';
import { Button, Alert, Badge } from '../common';
import Icon from '../common/Icon';

/* Leaflet is loaded via <script> tag in public/index.html
   — import it from window.L to avoid SSR issues */
const L = () => window.L;

function buildMarkerSvg(color) {
  return `
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z"
            fill="${color}" opacity="0.92"/>
      <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
      <path d="M11 16l3 3 7-7" stroke="${color}" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`;
}

function buildPopupHtml(r) {
  const tags = r.types.map((t) => `<span class="popup-tag">${t}</span>`).join('');
  const dist = r.distance && r.distance !== '—' ? `<p style="margin-top:6px;font-weight:600;color:#4A5830">📍 ${r.distance}</p>` : '';
  const verified = r.verified ? ' ✓' : '';
  return `
    <div class="recycler-popup">
      <h4>${r.name}${verified}</h4>
      <p style="color:#8A8E72;font-size:12px;margin-bottom:6px">${r.area}</p>
      <p>📞 ${r.phone}</p>
      <div style="margin-top:6px">${tags}</div>
      ${dist}
    </div>`;
}

export default function MapModule({ userRole }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markersRef      = useRef([]);

  const { recyclers, loading, error, activeFilter, requestLocation, filterByType } = useGeolocation();
  const [selectedRecycler, setSelectedRecycler] = useState(null);
  const [search, setSearch] = useState('');

  // Initialise map once
  useEffect(() => {
    if (!window.L || mapInstanceRef.current) return;
    const Leaflet = window.L;
    const map = Leaflet.map(mapContainerRef.current, {
      center: MAP_DEFAULTS.center,
      zoom: MAP_DEFAULTS.zoom,
      zoomControl: true,
    });
    Leaflet.tileLayer(MAP_DEFAULTS.tileUrl, {
      attribution: MAP_DEFAULTS.attribution,
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  // Re-render markers whenever recyclers or search changes
  useEffect(() => {
    if (!window.L || !mapInstanceRef.current) return;
    const Leaflet = window.L;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = recyclers.filter((r) => {
      if (!search) return true;
      return (
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.area.toLowerCase().includes(search.toLowerCase())
      );
    });

    filtered.forEach((r) => {
      const color = markerColorForTypes(r.types);
      const icon = Leaflet.divIcon({
        html: buildMarkerSvg(color),
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        className: '',
      });
      const marker = Leaflet.marker([r.lat, r.lng], { icon }).addTo(mapInstanceRef.current);
      marker.bindPopup(buildPopupHtml(r), { maxWidth: 240 });
      marker.on('click', () => setSelectedRecycler(r));
      markersRef.current.push(marker);
    });
  }, [recyclers, search]);

  const filteredForList = recyclers.filter((r) => {
    if (!search) return true;
    return r.name.toLowerCase().includes(search.toLowerCase()) || r.area.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="page">
      {/* Header */}
      <div className="section-hd" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-heading">
            {userRole === 'recycler' ? 'Waste Generators Near You' : 'Find Recyclers Near You'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            {userRole === 'recycler'
              ? 'View active waste listings in your area'
              : 'Verified recycling centres across Kenya — click any pin for details'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-olive">{filteredForList.length} centres</span>
          <Button variant="secondary" size="sm" icon="location" onClick={requestLocation}>
            Use My Location
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="Search by name or area…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, maxWidth: 280 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WASTE_FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-pill${activeFilter === f ? ' active' : ''}`}
              onClick={() => filterByType(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert type="warn" style={{ marginBottom: 12 }}>{error}</Alert>}

      {/* Map */}
      <div
        ref={mapContainerRef}
        className="map-container"
        style={{ height: 440 }}
      />

      {/* Legend */}
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {[
          ['#4A8AC4', 'Plastic'],
          ['#C07030', 'Metal'],
          ['#5A9A3A', 'Organic'],
          ['#8A4A9A', 'Glass'],
          ['#C04040', 'E-Waste'],
          ['#6B7C45', 'Other'],
        ].map(([color, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {/* Selected recycler card */}
      {selectedRecycler && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-hd">
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {selectedRecycler.name}
              {selectedRecycler.verified && (
                <span style={{ marginLeft: 6 }}>
                  <Badge color="green">Verified ✓</Badge>
                </span>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelectedRecycler(null)}>Dismiss</Button>
          </div>

          <div className="grid-3" style={{ marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Location</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{selectedRecycler.area}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Rating</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>⭐ {selectedRecycler.rating}/5.0</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Distance</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{selectedRecycler.distance}</div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Accepted Waste Types</div>
            {selectedRecycler.types.map((t) => (
              <span key={t} className="badge badge-olive" style={{ marginRight: 6 }}>{t}</span>
            ))}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
            📞 {selectedRecycler.phone}
          </div>

          <Button variant="primary">Connect to Recycler →</Button>
        </div>
      )}
    </div>
  );
}
