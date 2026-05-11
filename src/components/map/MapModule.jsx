import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUserLocation, getNearbyRecyclers, markerColorForTypes } from '../../services/geoService';
import { WASTE_FILTERS, MAP_DEFAULTS, RECYCLERS } from '../../data/mockData';
import { Button, Alert, Badge } from '../common';

// Fix Leaflet default marker icon (broken with webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function buildMarkerSvg(color) {
  return `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="${color}" opacity="0.92"/>
    <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
    <path d="M11 16l3 3 7-7" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
}

function buildPopupHtml(r) {
  const tags = (r.types || []).map(t => `<span style="display:inline-block;padding:2px 8px;background:#EEF2E0;color:#4A5830;border-radius:10px;font-size:11px;font-weight:500;margin:2px 2px 0 0">${t}</span>`).join('');
  const dist = r.distance && r.distance !== '—' ? `<p style="margin-top:6px;font-weight:600;color:#4A5830">📍 ${r.distance}</p>` : '';
  return `<div style="font-family:DM Sans,sans-serif;min-width:180px">
    <h4 style="font-size:14px;font-weight:700;color:#4A5830;margin:0 0 4px">${r.name}${r.verified ? ' ✓' : ''}</h4>
    <p style="color:#8A8E72;font-size:12px;margin:0 0 6px">${r.area}</p>
    <p style="font-size:12px;margin:0 0 6px">📞 ${r.phone}</p>
    <div>${tags}</div>${dist}
  </div>`;
}

export default function MapModule({ userRole }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markersRef      = useRef([]);

  const [recyclers, setRecyclers]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [activeFilter, setActiveFilter]   = useState('All Types');
  const [search, setSearch]               = useState('');
  const [selectedRecycler, setSelected]   = useState(null);
  const [location, setLocation]           = useState({ lat: MAP_DEFAULTS.center[0], lng: MAP_DEFAULTS.center[1] });

  // Load recyclers (mock data via geoService)
  const loadRecyclers = useCallback(async (loc, wasteTypes = []) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNearbyRecyclers({ lat: loc.lat, lng: loc.lng, radiusKm: 50, wasteTypes });
      setRecyclers(Array.isArray(data) ? data : RECYCLERS);
    } catch {
      setRecyclers(RECYCLERS); // fallback to raw mock data
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount — initialise map and load data
  useEffect(() => {
    loadRecyclers(location, []);
  }, []); // eslint-disable-line

  // Initialise Leaflet map once container is ready
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MAP_DEFAULTS.center,
      zoom:   MAP_DEFAULTS.zoom,
    });

    L.tileLayer(MAP_DEFAULTS.tileUrl, {
      attribution: MAP_DEFAULTS.attribution,
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // eslint-disable-line

  // Re-render markers whenever recyclers / search changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = recyclers.filter(r => {
      if (!search) return true;
      return (
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.area.toLowerCase().includes(search.toLowerCase())
      );
    });

    filtered.forEach(r => {
      const color = markerColorForTypes(r.types || []);
      const icon = L.divIcon({
        html:      buildMarkerSvg(color),
        iconSize:  [32, 40],
        iconAnchor:[16, 40],
        className: '',
      });
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(mapInstanceRef.current);
      marker.bindPopup(buildPopupHtml(r), { maxWidth: 260 });
      marker.on('click', () => setSelected(r));
      markersRef.current.push(marker);
    });

    // Fit bounds if markers exist
    if (filtered.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(filtered.map(r => [r.lat, r.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [recyclers, search]);

  // Filtered list for sidebar
  const filteredForList = recyclers.filter(r => {
    if (!search) return true;
    return (
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.area.toLowerCase().includes(search.toLowerCase())
    );
  });

  async function requestLocation() {
    setLoading(true);
    try {
      const loc = await getUserLocation();
      setLocation(loc);
      if (mapInstanceRef.current) mapInstanceRef.current.setView([loc.lat, loc.lng], 13);
      await loadRecyclers(loc, activeFilter === 'All Types' ? [] : [activeFilter]);
    } catch {
      setError('Location access denied. Showing all Kenya recyclers.');
    } finally {
      setLoading(false);
    }
  }

  function filterByType(type) {
    setActiveFilter(type);
    loadRecyclers(location, type === 'All Types' ? [] : [type]);
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="section-hd" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-heading">
            {userRole === 'recycler' ? 'Waste Generators Near You' : 'Find Recyclers Near You'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            Verified recycling centres across Kenya — click any pin for details
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge color="olive">{filteredForList.length} centres</Badge>
          <Button variant="secondary" size="sm" onClick={requestLocation} loading={loading}>
            📍 Use My Location
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="Search by name or area…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, maxWidth: 280 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WASTE_FILTERS.map(f => (
            <button key={f}
              className={`filter-pill${activeFilter === f ? ' active' : ''}`}
              onClick={() => filterByType(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert type="warn" style={{ marginBottom: 12 }}>{error}</Alert>}

      {/* Map */}
      <div ref={mapContainerRef} style={{ height: 440, borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--border)', zIndex: 0 }} />

      {/* Legend */}
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {[['#4A8AC4','Plastic'],['#C07030','Metal'],['#5A9A3A','Organic'],['#8A4A9A','Glass'],['#C04040','E-Waste'],['#6B7C45','Other']].map(([color, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {/* Selected recycler detail card */}
      {selectedRecycler && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-hd">
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {selectedRecycler.name}
              {selectedRecycler.verified && <Badge color="olive" style={{ marginLeft: 8 }}>Verified ✓</Badge>}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>Dismiss</Button>
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
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Accepted Waste Types</div>
            {(selectedRecycler.types || []).map(t => (
              <span key={t} className="badge badge-olive" style={{ marginRight: 6 }}>{t}</span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>📞 {selectedRecycler.phone}</div>
          <Button variant="primary">Connect to Recycler →</Button>
        </div>
      )}
    </div>
  );
}