/**
 * MapModule.jsx — WasteFreeMap-style split layout
 * Left: sidebar with search + category icons + scrollable list
 * Right: full-height Leaflet map
 *
 * Place at: src/components/map/MapModule.jsx
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './MapModule.css';
import L from 'leaflet';

// ── Full recycler dataset ─────────────────────────────────────────
const RECYCLERS = [
  { id:1,  name:"Mr Green Africa HQ",                  lat:-1.33, lng:36.85, type:"exchange",            materials:["plastics"],                    dropoff:false, pickup:true,  verified:true  },
  { id:2,  name:"Pure Planet Recyclers (Komarock)",    lat:-1.29, lng:36.93, type:"special_facility",    materials:["plastics","organics"],          dropoff:true,  pickup:true,  verified:true  },
  { id:3,  name:"Pure Planet Recyclers (Membley)",     lat:-1.21, lng:36.96, type:"special_facility",    materials:["plastics"],                    dropoff:true,  pickup:true,  verified:true  },
  { id:4,  name:"GreenPlanet MRF Nairobi",             lat:-1.30, lng:36.80, type:"special_facility",    materials:["plastics","paper","organics"],  dropoff:true,  pickup:true,  verified:true  },
  { id:5,  name:"WEEE Centre Nairobi",                 lat:-1.26, lng:36.81, type:"special_facility",    materials:["e-waste"],                     dropoff:true,  pickup:true,  verified:true  },
  { id:6,  name:"Pura Terra Recycling Ltd",            lat:-1.32, lng:36.88, type:"special_facility",    materials:["plastics"],                    dropoff:true,  pickup:true,  verified:true  },
  { id:7,  name:"Eden Recyclers Nairobi",              lat:-1.29, lng:36.82, type:"special_facility",    materials:["paper","plastics"],            dropoff:true,  pickup:true,  verified:true  },
  { id:8,  name:"Dandora Buy Back Centre",             lat:-1.25, lng:36.90, type:"exchange",            materials:["plastics","metals"],           dropoff:true,  pickup:true,  verified:false },
  { id:9,  name:"Kariobangi Recycling Hub",            lat:-1.26, lng:36.89, type:"community_collection",materials:["plastics","metals"],           dropoff:true,  pickup:true,  verified:false },
  { id:10, name:"Korogocho Recycling Area",            lat:-1.25, lng:36.90, type:"community_collection",materials:["plastics","metals"],           dropoff:true,  pickup:true,  verified:false },
  { id:11, name:"Kibera Recycling Collection Zone",    lat:-1.31, lng:36.79, type:"community_collection",materials:["plastics","metals"],           dropoff:true,  pickup:true,  verified:false },
  { id:12, name:"Kawangware Collection Zone",          lat:-1.28, lng:36.75, type:"community_collection",materials:["plastics"],                    dropoff:true,  pickup:true,  verified:false },
  { id:13, name:"Mathare Recycling Area",              lat:-1.27, lng:36.87, type:"community_collection",materials:["plastics","metals"],           dropoff:true,  pickup:true,  verified:false },
  { id:14, name:"Sarit Centre Recycling Point",        lat:-1.26, lng:36.80, type:"dropoff",             materials:["plastics","paper"],            dropoff:true,  pickup:false, verified:true  },
  { id:15, name:"Westgate Mall Recycling Point",       lat:-1.27, lng:36.81, type:"dropoff",             materials:["plastics","glass"],            dropoff:true,  pickup:false, verified:true  },
  { id:16, name:"Two Rivers Mall Recycling",           lat:-1.21, lng:36.80, type:"dropoff",             materials:["plastics","e-waste"],          dropoff:true,  pickup:false, verified:true  },
  { id:17, name:"Garden City Mall Recycling",          lat:-1.23, lng:36.88, type:"dropoff",             materials:["plastics","paper"],            dropoff:true,  pickup:false, verified:true  },
  { id:18, name:"The Hub Karen Recycling",             lat:-1.32, lng:36.71, type:"dropoff",             materials:["plastics","glass"],            dropoff:true,  pickup:false, verified:true  },
  { id:19, name:"University of Nairobi Recycling",     lat:-1.28, lng:36.82, type:"dropoff",             materials:["plastics","paper"],            dropoff:true,  pickup:false, verified:false },
  { id:20, name:"Kenyatta University Recycling",       lat:-1.18, lng:36.93, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:false },
  { id:21, name:"Strathmore University Recycling",     lat:-1.31, lng:36.82, type:"dropoff",             materials:["plastics","e-waste"],          dropoff:true,  pickup:false, verified:false },
  { id:22, name:"Total Energies CBD",                  lat:-1.29, lng:36.82, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:false },
  { id:23, name:"Total Energies Westlands",            lat:-1.27, lng:36.81, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:false },
  { id:24, name:"Shell Karen Recycling Point",         lat:-1.32, lng:36.71, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:false },
  { id:25, name:"Rubis Thika Road Recycling",          lat:-1.23, lng:36.88, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:false },
  { id:26, name:"Mombasa Recycling Buy Back",          lat:-4.04, lng:39.67, type:"exchange",            materials:["plastics","metals"],           dropoff:true,  pickup:true,  verified:false },
  { id:27, name:"EcoWorld Recycling Watamu",           lat:-3.35, lng:40.02, type:"community_collection",materials:["plastics"],                    dropoff:true,  pickup:true,  verified:true  },
  { id:28, name:"Kwale Recycling Centre Diani",        lat:-4.28, lng:39.59, type:"community_collection",materials:["plastics","glass"],            dropoff:true,  pickup:false, verified:true  },
  { id:29, name:"Nyali Recycling Point",               lat:-4.05, lng:39.72, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:false },
  { id:30, name:"Kilifi Community Recycling",          lat:-3.63, lng:39.85, type:"community_collection",materials:["plastics"],                    dropoff:true,  pickup:true,  verified:false },
  { id:31, name:"Nakuru Recycling Buy Back",           lat:-0.30, lng:36.08, type:"exchange",            materials:["plastics","glass"],            dropoff:true,  pickup:true,  verified:false },
  { id:32, name:"Eldoret Recycling Collection",        lat:0.51,  lng:35.27, type:"community_collection",materials:["plastics"],                    dropoff:true,  pickup:true,  verified:false },
  { id:33, name:"Kisumu Recycling Collection",         lat:-0.09, lng:34.77, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:true,  verified:false },
  { id:34, name:"Thika Recycling Buy Back",            lat:-1.03, lng:37.07, type:"exchange",            materials:["plastics","metals"],           dropoff:true,  pickup:true,  verified:false },
  { id:35, name:"Total Energies Gigiri",               lat:-1.23, lng:36.81, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:36, name:"Total Energies Muthaiga",             lat:-1.25, lng:36.83, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:37, name:"Total Energies Limuru Road",          lat:-1.25, lng:36.82, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:38, name:"Total Energies Waiyaki Way",          lat:-1.27, lng:36.75, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:39, name:"Total Energies Mombasa Road",         lat:-1.33, lng:36.85, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:40, name:"Total Energies Airport View",         lat:-1.32, lng:36.90, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:41, name:"Total Energies Ngong Road",           lat:-1.30, lng:36.78, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:42, name:"Total Energies Dagoretti Corner",     lat:-1.30, lng:36.76, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:43, name:"Total Energies Donholm",              lat:-1.29, lng:36.90, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:44, name:"Total Energies Outer Ring Road",      lat:-1.29, lng:36.89, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:45, name:"Total Energies Thika Road",           lat:-1.23, lng:36.88, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:46, name:"Total Energies Ruaka",                lat:-1.21, lng:36.78, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:47, name:"Total Energies Komarock",             lat:-1.29, lng:36.93, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:48, name:"Total Energies Jogoo Road",           lat:-1.29, lng:36.86, type:"dropoff",             materials:["plastics"],                    dropoff:true,  pickup:false, verified:true  },
  { id:49, name:"TakaTaka Sarit Centre",               lat:-1.26, lng:36.80, type:"dropoff",             materials:["plastics","paper","metals"],   dropoff:true,  pickup:false, verified:true  },
  { id:50, name:"TakaTaka Westlands Station",          lat:-1.27, lng:36.81, type:"dropoff",             materials:["plastics","paper","metals"],   dropoff:true,  pickup:false, verified:false },
  { id:51, name:"TakaTaka Loresho Station",            lat:-1.25, lng:36.75, type:"dropoff",             materials:["plastics","paper"],            dropoff:true,  pickup:false, verified:false },
  { id:52, name:"TakaTaka Langata Station",            lat:-1.34, lng:36.76, type:"dropoff",             materials:["plastics","paper"],            dropoff:true,  pickup:false, verified:false },
  { id:53, name:"TakaTaka Kilimani Station",           lat:-1.29, lng:36.79, type:"dropoff",             materials:["plastics","paper"],            dropoff:true,  pickup:false, verified:false },
];

const CATEGORIES = [
  { key:'plastics',  label:'Plastic',   icon:'🧴' },
  { key:'paper',     label:'Paper',     icon:'📄' },
  { key:'glass',     label:'Glass',     icon:'🍾' },
  { key:'metals',    label:'Metal',     icon:'🔩' },
  { key:'e-waste',   label:'E-Waste',   icon:'💻' },
  { key:'organics',  label:'Organic',   icon:'🌿' },
  { key:'batteries', label:'Batteries', icon:'🔋' },
  { key:'other',     label:'Other',     icon:'♻️'  },
];

const TYPE_LABELS = {
  exchange:            'Buy Back Centre',
  special_facility:    'Recycling Facility',
  community_collection:'Community Collection',
  dropoff:             'Drop-off Point',
};

function markerColor(r) {
  if (r.materials.includes('e-waste'))  return '#E53E3E';
  if (r.materials.includes('metals'))   return '#DD6B20';
  if (r.materials.includes('glass'))    return '#805AD5';
  if (r.materials.includes('organics')) return '#38A169';
  if (r.materials.includes('paper'))    return '#D69E2E';
  return '#276749';
}

function buildSvgMarker(color, pulse = false) {
  return `<div style="position:relative;width:24px;height:24px">
    ${pulse ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:${color};opacity:0.2;animation:wl-pulse 1.5s ease-out infinite"></div>` : ''}
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2.5"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  </div>`;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, toR = d => d * Math.PI / 180;
  const a = Math.sin(toR(lat2-lat1)/2)**2 + Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(toR(lng2-lng1)/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function MapModule({ userRole = 'generator', onBack, onConnect }) {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markersRef      = useRef([]);
  const routeRef        = useRef(null);
  const userMarkerRef   = useRef(null);

  const [search,       setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [locBlocked,   setLocBlocked]   = useState(false);
  const [routeInfo,    setRouteInfo]    = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [filterDropoff, setFilterDropoff] = useState(false);
  const [filterPickup,  setFilterPickup]  = useState(false);

  const filtered = RECYCLERS.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory && !r.materials.includes(activeCategory)) return false;
    if (filterDropoff && !r.dropoff) return false;
    if (filterPickup  && !r.pickup)  return false;
    return true;
  }).map(r => ({
    ...r,
    distKm: userLocation ? haversine(userLocation.lat, userLocation.lng, r.lat, r.lng) : null,
  })).sort((a,b) => (a.distKm ?? 999) - (b.distKm ?? 999));

  // ── Init map ──────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

  const map = L.map(mapContainerRef.current, {
      center: [-1.2921, 36.8219],
      zoom: 11,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    setTimeout(() => {
      navigator.permissions?.query({ name:'geolocation' }).then(p => {
        if (p.state === 'granted') doGetLocation();
        else if (p.state === 'denied') setLocBlocked(true);
        else setShowModal(true);
      }).catch(() => setShowModal(true));
    }, 600);
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line
  }, []);

  // ── Markers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    const L = window.L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    filtered.forEach(r => {
      const color = markerColor(r);
      const isSelected = selected?.id === r.id;
      const icon = L.divIcon({
        html: buildSvgMarker(color, isSelected),
        iconSize: [24,24], iconAnchor:[12,12], className:'',
      });
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(mapRef.current);
      marker.bindTooltip(r.name, { direction:'top', offset:[0,-14], className:'wl-tooltip' });
      marker.on('click', () => {
        setSelected(r);
        mapRef.current.setView([r.lat, r.lng], 15, { animate:true });
      });
      markersRef.current.push(marker);
    });
  // eslint-disable-next-line
  }, [filtered.length, activeCategory, search, filterDropoff, filterPickup, selected?.id]);

  // ── Location ──────────────────────────────────────────────────
  const doGetLocation = useCallback(() => {
    setShowModal(false);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      if (!window.L || !mapRef.current) return;
      const L = window.L;
      if (userMarkerRef.current) userMarkerRef.current.remove();
      userMarkerRef.current = L.circleMarker([loc.lat, loc.lng], {
        radius:9, fillColor:'#4A90E2', color:'white', weight:3, fillOpacity:1,
      }).addTo(mapRef.current).bindTooltip('You are here');
      mapRef.current.setView([loc.lat, loc.lng], 13, { animate:true });
    }, () => { setLocBlocked(true); setShowModal(false); }, { enableHighAccuracy:true });
  }, []);

  // ── Directions ────────────────────────────────────────────────
  const getDirections = useCallback(async (r) => {
    if (!userLocation) { setShowModal(true); return; }
    setRouteLoading(true);
    if (routeRef.current) { routeRef.current.remove(); routeRef.current = null; }
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${r.lng},${r.lat}?overview=full&geometries=geojson`;
      const data = await (await fetch(url)).json();
      if (data.code === 'Ok') {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(([lng,lat]) => [lat,lng]);
        routeRef.current = window.L.polyline(coords, { color:'#276749', weight:5, opacity:0.85 }).addTo(mapRef.current);
        mapRef.current.fitBounds(routeRef.current.getBounds(), { padding:[60,60] });
        setRouteInfo({ dist:(route.distance/1000).toFixed(1), min:Math.round(route.duration/60), name:r.name });
      }
    } catch(e) { /* silent */ }
    setRouteLoading(false);
  }, [userLocation]);

  const distLabel = r => {
    if (r.distKm == null) return null;
    return r.distKm < 1 ? `${Math.round(r.distKm*1000)} m` : `${r.distKm.toFixed(1)} km`;
  };

  return (
    <div className="wl-root">

      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <aside className="wl-sidebar">

        {/* Search */}
        <div className="wl-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="wl-search-input"
            placeholder="Search by address or point name"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="wl-clear-btn" onClick={() => setSearch('')}>✕</button>}
        </div>

        {/* Category filter */}
        <p className="wl-section-label">What do you want to recycle?</p>
        <div className="wl-categories">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`wl-cat${activeCategory === c.key ? ' wl-cat--active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === c.key ? null : c.key)}
            >
              <span className="wl-cat-icon">{c.icon}</span>
              <span className="wl-cat-label">{c.label}</span>
            </button>
          ))}
        </div>

        {/* Availability filters */}
        <div className="wl-avail">
          <button
            className={`wl-avail-pill${filterDropoff ? ' active' : ''}`}
            onClick={() => setFilterDropoff(f => !f)}
          >Drop-off</button>
          <button
            className={`wl-avail-pill${filterPickup ? ' active' : ''}`}
            onClick={() => setFilterPickup(f => !f)}
          >Pickup</button>
          <button
            className={`wl-avail-pill${userLocation ? ' active' : ''}`}
            onClick={() => userLocation ? null : (locBlocked ? setShowModal(true) : doGetLocation())}
          >📍 Near me</button>
        </div>

        {/* Count */}
        <p className="wl-found-count">Found {filtered.length} points</p>

        {/* Results list */}
        <div className="wl-results">
          {filtered.map(r => (
            <button
              key={r.id}
              className={`wl-result-item${selected?.id === r.id ? ' wl-result-item--active' : ''}`}
              onClick={() => { setSelected(r); mapRef.current?.setView([r.lat, r.lng], 15, { animate:true }); }}
            >
              <div className="wl-result-badges">
                {r.materials.slice(0,4).map(m => (
                  <span key={m} className={`wl-mat wl-mat--${m.replace(/[^a-z]/g,'')}`}>{m}</span>
                ))}
              </div>
              <div className="wl-result-name">{r.name}</div>
              <div className="wl-result-sub">
                {r.verified
                  ? <span className="wl-open-tag">● Verified</span>
                  : <span className="wl-approx-tag">~ Approximate</span>
                }
                <span className="wl-type-tag">{TYPE_LABELS[r.type]}</span>
                {distLabel(r) && <span className="wl-dist-tag">{distLabel(r)}</span>}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="wl-empty">No recycling points found. Try a different filter.</div>
          )}
        </div>
      </aside>

      {/* ── MAP ───────────────────────────────────────────────── */}
      <div className="wl-map-wrap">
        <div ref={mapContainerRef} className="wl-map" />

        {/* Route info bar */}
        {routeInfo && (
          <div className="wl-route-bar">
            <span>🗺 <strong>{routeInfo.dist} km</strong> · ~{routeInfo.min} min to {routeInfo.name}</span>
            <button onClick={() => { routeRef.current?.remove(); routeRef.current=null; setRouteInfo(null); }}>✕</button>
          </div>
        )}

        {/* Selected detail popup */}
        {selected && (
          <div className="wl-popup">
            <button className="wl-popup-close" onClick={() => setSelected(null)}>✕</button>
            <div className="wl-popup-badges">
              {selected.materials.map(m => (
                <span key={m} className={`wl-mat wl-mat--${m.replace(/[^a-z]/g,'')}`}>{m}</span>
              ))}
            </div>
            <div className="wl-popup-name">{selected.name}</div>
            <div className="wl-popup-type">{TYPE_LABELS[selected.type]}</div>
            <div className="wl-popup-chips">
              {selected.dropoff && <span className="wl-chip">📥 Drop-off</span>}
              {selected.pickup  && <span className="wl-chip">🚚 Pickup</span>}
              {selected.verified && <span className="wl-chip wl-chip--verified">✓ Verified</span>}
              {distLabel(selected) && <span className="wl-chip">📍 {distLabel(selected)}</span>}
            </div>
            <div className="wl-popup-actions">
              <button
                className="wl-btn-dir"
                onClick={() => getDirections(selected)}
                disabled={routeLoading}
              >
                {routeLoading ? 'Routing…' : '↗ Get Directions'}
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="wl-btn-gmaps"
              >Google Maps</a>
            </div>
            {onConnect && (
              <button className="wl-btn-connect" onClick={() => onConnect(selected)}>
                {userRole === 'recycler' ? 'Request Pickup →' : 'Connect →'}
              </button>
            )}
          </div>
        )}

        {/* Locate me button */}
        <button className="wl-locate-btn" onClick={() => locBlocked ? setShowModal(true) : doGetLocation()} title="My location">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" opacity="0.2" fill="currentColor"/></svg>
        </button>
      </div>

      {/* ── LOCATION MODAL ────────────────────────────────────── */}
      {(showModal || locBlocked) && (
        <div className="wl-modal-bg" onClick={() => { setShowModal(false); }}>
          <div className="wl-modal" onClick={e => e.stopPropagation()}>
            <div className="wl-modal-ico">{locBlocked ? '🚫' : '📍'}</div>
            <h3 className="wl-modal-title">
              {locBlocked ? 'Location Blocked' : 'Allow Location Access'}
            </h3>
            <p className="wl-modal-body">
              {locBlocked
                ? 'Enable location in your browser settings then reload the page.'
                : 'WasteLink uses your location to show nearby recycling points and calculate distances.'}
            </p>
            {!locBlocked && (
              <div className="wl-modal-app-row">
                <span className="wl-modal-dot" />
                <span><strong>wastelink.app</strong> wants to know your location</span>
              </div>
            )}
            {!locBlocked && (
              <button className="wl-modal-allow" onClick={doGetLocation}>Allow Location</button>
            )}
            <button className="wl-modal-skip" onClick={() => { setShowModal(false); setLocBlocked(false); }}>
              {locBlocked ? 'Browse Anyway' : 'Not Now'}
            </button>
            {!locBlocked && <p className="wl-modal-hint">You can change this in your browser settings.</p>}
          </div>
        </div>
      )}
    </div>
  );
}