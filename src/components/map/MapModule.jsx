// src/components/map/MapModule.jsx
// v6 — getUser() session fix, direct listWaste navigation, role badge (no toggle),
//       OSRM route optimization, Photon autocomplete, blue user dot

import { useState, useEffect, useRef } from 'react';
import { useMapLocations } from '../../hooks/useMapLocations';

// ─── Pin colours ──────────────────────────────────────────────
const PIN_COLORS = {
  recycling_centre: '#1a4731',
  collection_point: '#e07b2a',
  waste_generator:  '#2563eb',
};
const PIN_LABELS = {
  recycling_centre: 'Recycling Centre',
  collection_point: 'Collection Point',
  waste_generator:  'Waste Generator',
};

// ─── Tag colours ──────────────────────────────────────────────
const TYPE_COLORS = {
  'E-Waste':    { bg: '#fce8e8', color: '#c0392b' },
  'Batteries':  { bg: '#fce8e8', color: '#c0392b' },
  'Cables':     { bg: '#fce8e8', color: '#c0392b' },
  'Plastic':    { bg: '#e8f4e8', color: '#276749' },
  'Metal':      { bg: '#e8f4e8', color: '#276749' },
  'Paper':      { bg: '#fff3e0', color: '#e07b2a' },
  'Cardboard':  { bg: '#fff3e0', color: '#e07b2a' },
  'Glass':      { bg: '#ede7f6', color: '#5e35b1' },
  'Organic':    { bg: '#e8f5e9', color: '#2e7d32' },
  'Scrap Iron': { bg: '#e8f4e8', color: '#276749' },
  'Aluminum':   { bg: '#e8f4e8', color: '#276749' },
};

// ─── SVG pin ──────────────────────────────────────────────────
function makeSvgIcon(color, size = 32) {
  const id  = color.replace('#', '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size+10}" viewBox="0 0 32 42">
    <defs><filter id="sh${id}" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.30)"/>
    </filter></defs>
    <circle cx="16" cy="16" r="14" fill="${color}" filter="url(#sh${id})"/>
    <circle cx="16" cy="16" r="8" fill="rgba(255,255,255,0.18)"/>
    <polygon points="16,40 9,26 23,26" fill="${color}" filter="url(#sh${id})"/>
    <path d="M11 16 L15 20 L21 12" stroke="white" stroke-width="2.2"
      stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ─── Blue "you are here" dot ──────────────────────────────────
function makeUserDotIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <circle cx="11" cy="11" r="10" fill="rgba(66,133,244,0.22)"/>
    <circle cx="11" cy="11" r="6" fill="#4285F4" stroke="white" stroke-width="2.5"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ─── Helpers ──────────────────────────────────────────────────
const WASTE_TYPES    = ['All','Plastic','Metal','Paper','E-Waste','Glass','Organic'];
const DEFAULT_CENTER = [-1.2921, 36.8219];
const DEFAULT_ZOOM   = 11;

function distKm(lat1, lng1, lat2, lng2) {
  const R=6371, dL=((lat2-lat1)*Math.PI)/180, dG=((lng2-lng1)*Math.PI)/180;
  const a=Math.sin(dL/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dG/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function fmtDur(s) { const m=Math.round(s/60); return m<60?`${m} min`:`${Math.floor(m/60)}h ${m%60}min`; }
function fmtDist(m) { return m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(1)} km`; }

// ─── Photon geocoding ─────────────────────────────────────────
// ─── Geoapify geocoding (replaces Photon) ─────────────────────
async function searchPlaces(query) {
  if (!query || query.length < 2) return [];
  try {
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text', query);
    url.searchParams.set('apiKey', process.env.REACT_APP_GEOAPIFY_KEY);
    url.searchParams.set('filter', 'countrycode:ke');
    url.searchParams.set('limit', '7');
    url.searchParams.set('lang', 'en');

    const data = await fetch(url.toString()).then(r => r.json());

    return (data.features || []).map(f => {
      const p = f.properties;
      return {
        display_name: p.formatted,
        short_name:   p.name || p.street || p.formatted,
        city:         p.city || p.county || '',
        lat:          f.geometry.coordinates[1],
        lng:          f.geometry.coordinates[0],
        osm_type:     p.result_type || '',
      };
    }).filter(r => r.display_name?.length > 2);
  } catch { return []; }
}

// ─── OSRM route ───────────────────────────────────────────────
// ─── Geoapify routing (replaces OSRM) ─────────────────────────
async function fetchRoute(fLat, fLng, tLat, tLng) {
  try {
    const url = new URL('https://api.geoapify.com/v1/routing');
    url.searchParams.set('waypoints', `${fLat},${fLng}|${tLat},${tLng}`);
    url.searchParams.set('mode', 'drive');
    url.searchParams.set('apiKey', process.env.REACT_APP_GEOAPIFY_KEY);

    const data = await fetch(url.toString()).then(r => r.json());
    if (!data.features?.length) return null;

    const rt = data.features[0];
    const props = rt.properties;
    const leg = props.legs?.[0];

    return {
      duration: props.time,
      distance: props.distance,
      geometry: rt.geometry,      // GeoJSON — Leaflet draws this directly
      steps: (leg?.steps || []).map(s => ({
        instruction: s.instruction?.text || s.name || '',
        distance:    s.distance || 0,
        type:        s.type || '',
        modifier:    s.modifier || '',
      })).filter(s => s.instruction),
    };
  } catch { return null; }
}
function formatTime(time) {
  if (!time) return '';

  // Handles both "08:00" and "8:00am"
  if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
    return time.replace(':', '.');
  }

  const [hour, minute] = time.split(':');
  let h = parseInt(hour, 10);

  const ampm = h >= 12 ? 'pm' : 'am';

  h = h % 12;
  h = h ? h : 12;

  return `${h}.${minute}${ampm}`;
}

function formatHours(operatingHours) {
  if (!operatingHours) return '';

  // Already formatted string
  if (
    typeof operatingHours === 'string' &&
    !operatingHours.trim().startsWith('{')
  ) {
    return operatingHours;
  }

  let hours = operatingHours;

  // Parse JSON string from DB
  if (typeof operatingHours === 'string') {
    try {
      hours = JSON.parse(operatingHours);
    } catch {
      return operatingHours;
    }
  }

  if (!hours || typeof hours !== 'object') return '';

  const shortDays = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  };

  let formattedDays = '';

const dayOrder = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

if (Array.isArray(hours.days)) {
  const sortedDays = [...hours.days]
    .filter(Boolean)
    .sort((a, b) => dayOrder[a] - dayOrder[b]);

  const short = sortedDays.map(d => shortDays[d] || d);

  formattedDays =
    short.length > 1
      ? `${short[0]}-${short[short.length - 1]}`
      : short[0];
}

else if (typeof hours.days === 'string') {
  // Handles presets like Mon-Fri
  if (
    hours.days === 'Mon-Fri' ||
    hours.days === 'Mon-Sat' ||
    hours.days === 'Daily'
  ) {
    formattedDays = hours.days;
  }

  // Handles "Monday, Wednesday, Friday"
  else {
    formattedDays = hours.days
      .split(', ')
      .map(day => shortDays[day] || day)
      .join(', ');
  }
}
  return `${formattedDays} ${formatTime(hours.open)}-${formatTime(hours.close)}`.trim();
}


// ─── Mock data ────────────────────────────────────────────────
const MOCK_LOCATIONS = [
  { id:'m1', location_type:'recycling_centre', name:'Nairobi E-Waste Hub',
    address:'Tom Mboya St, CBD', city:'Nairobi', lat:-1.2864, lng:36.8172,
    accepted_types:['E-Waste','Batteries','Cables'], operating_hours:'Mon–Fri 9am–5pm',
    is_verified:true, users:{ rating:4.4, rating_count:28 } },
  { id:'m2', location_type:'recycling_centre', name:'GreenCycle Kenya – Industrial Area',
    address:'Enterprise Rd, Industrial Area', city:'Nairobi', lat:-1.3055, lng:36.8267,
    accepted_types:['Plastic','Metal','Paper'], operating_hours:'Mon–Sat 7am–6pm',
    is_verified:true, users:{ rating:4.8, rating_count:55 } },
  { id:'m3', location_type:'collection_point', name:'PaperBack Recyclers Parklands',
    address:'3rd Parklands Ave', city:'Nairobi', lat:-1.2650, lng:36.8104,
    accepted_types:['Paper','Cardboard'], operating_hours:'Mon–Sat 6am–7pm',
    is_verified:false, users:{ rating:4.9, rating_count:41 } },
  { id:'m4', location_type:'collection_point', name:'MetalWorks South B',
    address:'South B Shopping Centre', city:'Nairobi', lat:-1.2950, lng:36.8350,
    accepted_types:['Metal','Scrap Iron','Aluminum'], operating_hours:'Mon–Fri 7am–4pm',
    is_verified:true, users:{ rating:4.5, rating_count:33 } },
  { id:'m5', location_type:'recycling_centre', name:'EcoReclaim Westlands',
    address:'Westlands Rd', city:'Nairobi', lat:-1.2631, lng:36.8034,
    accepted_types:['Plastic','Glass'], operating_hours:'Mon–Fri 8am–5pm',
    is_verified:true, users:{ rating:4.6, rating_count:19 } },
  { id:'m6', location_type:'recycling_centre', name:'Mombasa Green Hub',
    address:'Nkrumah Rd, Old Town', city:'Mombasa', lat:-4.0435, lng:39.6682,
    accepted_types:['Plastic','Metal','Glass'], operating_hours:'Mon–Fri 8am–5pm',
    is_verified:true, users:{ rating:4.3, rating_count:12 } },
  { id:'m7', location_type:'collection_point', name:'Kisumu Eco Collectors',
    address:'Milimani Rd', city:'Kisumu', lat:-0.0917, lng:34.7679,
    accepted_types:['Paper','Cardboard','Plastic'], operating_hours:'Mon–Sat 7am–6pm',
    is_verified:false, users:{ rating:4.1, rating_count:8 } },
];

// ─── Hours picker ─────────────────────────────────────────────
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TIMES=['6:00am','6:30am','7:00am','7:30am','8:00am','8:30am','9:00am','9:30am',
  '10:00am','10:30am','11:00am','11:30am','12:00pm','12:30pm','1:00pm','1:30pm',
  '2:00pm','2:30pm','3:00pm','3:30pm','4:00pm','4:30pm','5:00pm','5:30pm',
  '6:00pm','6:30pm','7:00pm','7:30pm','8:00pm'];

function buildHours(days, open, close) {
  if (!days.length||!open||!close) return '';
  const sorted=DAYS.filter(d=>days.includes(d));
  let ranges=[],start=sorted[0],prev=sorted[0];
  for(let i=1;i<sorted.length;i++){
    if(DAYS.indexOf(sorted[i])===DAYS.indexOf(prev)+1){prev=sorted[i];}
    else{ranges.push(start===prev?start:`${start}–${prev}`);start=sorted[i];prev=sorted[i];}
  }
  ranges.push(start===prev?start:`${start}–${prev}`);
  return `${ranges.join(', ')} ${open}–${close}`;
}

function HoursPicker({ value, onChange }) {
  const [open,setOpen]=useState(false);
  const [days,setDays]=useState([]);
  const [from,setFrom]=useState('8:00am');
  const [to,setTo]=useState('5:00pm');
  const ref=useRef(null);
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',fn);
    return ()=>document.removeEventListener('mousedown',fn);
  },[]);
  const toggleDay=d=>setDays(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d]);
  const presets=[
    {label:'Mon–Fri',days:['Mon','Tue','Wed','Thu','Fri']},
    {label:'Mon–Sat',days:['Mon','Tue','Wed','Thu','Fri','Sat']},
    {label:'Daily',days:[...DAYS]},
    {label:'Weekends',days:['Sat','Sun']},
  ];
  return (
    <div style={{position:'relative'}} ref={ref}>
      <div style={{...S.inp,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}
        onClick={()=>setOpen(o=>!o)}>
        <span style={{color:value?'#1a1a1a':'#aaa',fontSize:13}}>{value||'Select operating hours…'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      {open&&(
        <div style={S.hoursPicker}>
          <p style={S.hoursLabel}>Quick select</p>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            {presets.map(p=>(
              <button key={p.label} style={{...S.presetBtn,
                ...(JSON.stringify([...days].sort())===JSON.stringify([...p.days].sort())?S.presetBtnActive:{})}}
                onClick={()=>setDays(p.days)}>{p.label}</button>
            ))}
          </div>
          <p style={S.hoursLabel}>Days</p>
          <div style={{display:'flex',gap:4,marginBottom:14}}>
            {DAYS.map(d=>(
              <button key={d} style={{...S.dayBtn,...(days.includes(d)?S.dayBtnActive:{})}}
                onClick={()=>toggleDay(d)}>{d}</button>
            ))}
          </div>
          <p style={S.hoursLabel}>Hours</p>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <select style={{...S.inp,flex:1,padding:'8px 10px'}} value={from} onChange={e=>setFrom(e.target.value)}>
              {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{color:'#888',fontSize:13,flexShrink:0}}>to</span>
            <select style={{...S.inp,flex:1,padding:'8px 10px'}} value={to} onChange={e=>setTo(e.target.value)}>
              {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {days.length>0&&(
            <p style={{fontSize:12,color:'#1a4731',fontWeight:600,margin:'0 0 12px',
              background:'#e8f4ee',borderRadius:6,padding:'6px 10px'}}>
              Preview: {buildHours(days,from,to)}
            </p>
          )}
          <button style={S.applyBtn} onClick={()=>{onChange(buildHours(days,from,to));setOpen(false);}}>
            ✓ Apply
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Address autocomplete ─────────────────────────────────────
function AddressAutocomplete({ value, onChange, onSelect }) {
  const [query,setQuery]=useState(value||'');
  const [results,setResults]=useState([]);
  const [show,setShow]=useState(false);
  const [busy,setBusy]=useState(false);
  const deb=useRef(null);
  const wrap=useRef(null);
  useEffect(()=>{
    const fn=e=>{if(wrap.current&&!wrap.current.contains(e.target))setShow(false);};
    document.addEventListener('mousedown',fn);
    return ()=>document.removeEventListener('mousedown',fn);
  },[]);
  const handleInput=val=>{
    setQuery(val);onChange(val);
    clearTimeout(deb.current);
    if(val.length<2){setResults([]);setShow(false);return;}
    setBusy(true);
    deb.current=setTimeout(async()=>{
      const r=await searchPlaces(val);
      setResults(r);setShow(r.length>0);setBusy(false);
    },350);
  };
  const pick=r=>{setQuery(r.display_name);setResults([]);setShow(false);onSelect(r);};
  const placeIcon=t=>{
    if(['street','road','avenue'].some(x=>t?.includes(x)))return'🛣️';
    if(['building','amenity','shop'].some(x=>t?.includes(x)))return'🏢';
    return'📍';
  };
  return(
    <div style={{position:'relative'}} ref={wrap}>
      <div style={{position:'relative'}}>
        <input style={{...S.inp,paddingLeft:36,paddingRight:query?32:12}}
          value={query} onChange={e=>handleInput(e.target.value)}
          placeholder="e.g. Westlands Rd, Westlands, Nairobi" autoComplete="off"/>
        <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',fontSize:14,pointerEvents:'none'}}>
          {busy?'⌛':'🔍'}
        </span>
        {query&&(
          <button style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
            background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:13}}
            onClick={()=>{setQuery('');onChange('');setResults([]);setShow(false);}}>✕</button>
        )}
      </div>
      {show&&results.length>0&&(
        <div style={S.autocomplete}>
          {results.map((r,i)=>(
            <div key={i} style={S.autocompleteItem} onMouseDown={e=>{e.preventDefault();pick(r);}}>
              <span style={{fontSize:14,flexShrink:0}}>{placeIcon(r.osm_type)}</span>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,color:'#1a1a1a',fontWeight:500,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.short_name}</div>
                <div style={{fontSize:11,color:'#999',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.display_name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Route Panel ──────────────────────────────────────────────
function RoutePanel({ route, destination, onClose }) {
  if (!route) return null;
  const stepIcon=(type,mod)=>{
    if(type==='turn'){
      if(mod==='left')return'↰';if(mod==='right')return'↱';
      if(mod==='slight left')return'↖';if(mod==='slight right')return'↗';
    }
    if(type==='depart')return'🔵';if(type==='arrive')return'🏁';
    if(type==='roundabout'||type==='rotary')return'🔄';
    return'↑';
  };
  return(
    <div style={S.routePanel}>
      <div style={S.routePanelHeader}>
        <div>
          <p style={{margin:'0 0 4px',fontSize:13,fontWeight:700,color:'#1a1a1a'}}>
            Route to {destination}
          </p>
          <div style={{display:'flex',gap:14}}>
            <span style={S.routeStat}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a4731" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {fmtDur(route.duration)}
            </span>
            <span style={S.routeStat}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a4731" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              {fmtDist(route.distance)}
            </span>
          </div>
        </div>
        <button style={S.routeCloseBtn} onClick={onClose}>✕</button>
      </div>
      <div style={S.routeSteps}>
        {route.steps.map((s,i)=>(
          <div key={i} style={S.routeStep}>
            <div style={S.routeStepIcon}>{stepIcon(s.type,s.modifier)}</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:12,color:'#1a1a1a',lineHeight:1.4}}>{s.instruction}</p>
              {s.distance>0&&<p style={{margin:'2px 0 0',fontSize:11,color:'#aaa'}}>{fmtDist(s.distance)}</p>}
            </div>
          </div>
        ))}
        {route.steps.length===0&&(
          <p style={{color:'#aaa',fontSize:12,textAlign:'center',padding:'16px 0'}}>
            Follow the blue line on the map.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────
function RoleBadge({ role }) {
  const isRecycler = role === 'recycler';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '7px 14px',
      borderRadius: 20,
      background: isRecycler ? '#e8f4ee' : '#f0faf5',
      border: `1.5px solid ${isRecycler ? '#1a4731' : '#4ade80'}`,
      fontSize: 13,
      fontWeight: 600,
      color: '#1a4731',
      userSelect: 'none',
    }}>
      {isRecycler ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a4731" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"/>
          <polyline points="23 20 23 14 17 14"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a4731" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      )}
      {isRecycler ? 'Recycler' : 'Waste Seller'}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
/**
 * Props:
 *   user        — { id, full_name, role, ... }  from your auth context
 *   onNavigate  — function(page) — called with 'listWaste' to switch page
 */
export default function MapModule({ user, onNavigate }) {
  const role = user?.role || 'seller';

  const { locations: dbLocations, loading } = useMapLocations(role);
  const [locations, setLocations]   = useState([]);
  const [mobileView, setMobileView] = useState('list');

  useEffect(() => {
    if (!loading) {
      if (dbLocations.length > 0) {
        setLocations(dbLocations);
      } else {
        setLocations(role !== 'recycler'
          ? MOCK_LOCATIONS.filter(l => l.location_type !== 'waste_generator')
          : MOCK_LOCATIONS.filter(l => l.location_type === 'waste_generator'));
      }
    }
  }, [dbLocations, loading, role]);

  const [activeType,     setActiveType]     = useState('All');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchSugs,     setSearchSugs]     = useState([]);
  const [showSearchSugs, setShowSearchSugs] = useState(false);
  const searchDeb = useRef(null);

  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const markersRef    = useRef([]);
  const userDotRef    = useRef(null);
  const routeLayerRef = useRef(null);

  const [selected,      setSelected]      = useState(null);
  const [userPos,       setUserPos]       = useState(null);
  const [mapReady,      setMapReady]      = useState(false);
  const [routeData,     setRouteData]     = useState(null);
  const [routeLoading,  setRouteLoading]  = useState(false);
  const [showRoutePanel,setShowRoutePanel]= useState(false);



  // ── Filtered + sorted ────────────────────────────────────────
  const filtered = locations.filter(loc => {
    const typeOk   = activeType==='All' || (loc.accepted_types||[]).some(t=>t.toLowerCase().includes(activeType.toLowerCase()));
    const searchOk = !searchQuery || [loc.name,loc.city,loc.address].some(f=>f?.toLowerCase().includes(searchQuery.toLowerCase()));
    return typeOk && searchOk;
  });
  const sorted = userPos
    ? [...filtered].sort((a,b)=>distKm(userPos[0],userPos[1],a.lat,a.lng)-distKm(userPos[0],userPos[1],b.lat,b.lng))
    : filtered;

  // ── Leaflet init ─────────────────────────────────────────────
  useEffect(()=>{
    if(mapInstance.current||!mapRef.current) return;
    if(!window.L){console.warn('Leaflet not loaded.');return;}
    const L=window.L;
    const map=L.map(mapRef.current,{center:DEFAULT_CENTER,zoom:DEFAULT_ZOOM,zoomControl:false});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
      attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains:'abcd',maxZoom:19,
    }).addTo(map);
    L.control.zoom({position:'topleft'}).addTo(map);
    mapInstance.current=map;
    setMapReady(true);
    return()=>{map.remove();mapInstance.current=null;};
  },[]);

  useEffect(()=>{
    if(mobileView==='map'&&mapInstance.current)
      setTimeout(()=>mapInstance.current.invalidateSize(),60);
  },[mobileView]);

  // ── Markers ──────────────────────────────────────────────────
  useEffect(()=>{
    if(!mapReady||!mapInstance.current||!window.L) return;
    const L=window.L,map=mapInstance.current;
    markersRef.current.forEach(m=>map.removeLayer(m));
    markersRef.current=[];
    sorted.forEach(loc=>{
      const color=PIN_COLORS[loc.location_type]||'#1a4731';
      const icon=L.icon({iconUrl:makeSvgIcon(color),iconSize:[32,42],iconAnchor:[16,42],popupAnchor:[0,-44]});
      const marker=L.marker([loc.lat,loc.lng],{icon})
        .on('click',()=>{setSelected(loc);if(mobileView!=='map')setMobileView('map');})
        .addTo(map);
      marker.bindTooltip(
        `<div style="font-weight:600;font-size:12px">${loc.name}</div><div style="font-size:11px;color:#bbb;margin-top:2px">${PIN_LABELS[loc.location_type]}</div>`,
        {direction:'top',offset:[0,-44],className:'wlm-tooltip'}
      );
      markersRef.current.push(marker);
    });
  },[sorted,mapReady]);

  // ── User dot ─────────────────────────────────────────────────
  useEffect(()=>{
    if(!mapReady||!mapInstance.current||!window.L||!userPos) return;
    const L=window.L,map=mapInstance.current;
    if(userDotRef.current){map.removeLayer(userDotRef.current);userDotRef.current=null;}
    const dotIcon=L.icon({iconUrl:makeUserDotIcon(),iconSize:[22,22],iconAnchor:[11,11]});
    userDotRef.current=L.marker(userPos,{icon:dotIcon,zIndexOffset:1000})
      .bindTooltip('You are here',{direction:'top',className:'wlm-tooltip'})
      .addTo(map);
  },[userPos,mapReady]);

  // ── Route ────────────────────────────────────────────────────
  const drawRoute=geojson=>{
    if(!mapInstance.current||!window.L) return;
    const L=window.L,map=mapInstance.current;
    if(routeLayerRef.current){map.removeLayer(routeLayerRef.current);routeLayerRef.current=null;}
    const layer=L.geoJSON(geojson,{
      style:{color:'#2563eb',weight:5,opacity:0.85,lineCap:'round',lineJoin:'round'}
    }).addTo(map);
    routeLayerRef.current=layer;
    map.fitBounds(layer.getBounds(),{padding:[50,50],animate:true});
  };
  const clearRoute=()=>{
    if(routeLayerRef.current&&mapInstance.current){mapInstance.current.removeLayer(routeLayerRef.current);routeLayerRef.current=null;}
    setRouteData(null);setShowRoutePanel(false);
  };

  const getRouteFrom=async(fLat,fLng,loc)=>{
    setRouteLoading(true);clearRoute();
    const rt=await fetchRoute(fLat,fLng,loc.lat,loc.lng);
    setRouteLoading(false);
    if(!rt){alert('Could not calculate route. Please try again.');return;}
    setRouteData({...rt,destinationName:loc.name});
    drawRoute(rt.geometry);
    setShowRoutePanel(true);
    setMobileView('map');
  };

  const handleGetDirections=async loc=>{
    if(!userPos){
      if(!navigator.geolocation){alert('Enable location access to get directions.');return;}
      navigator.geolocation.getCurrentPosition(
        async({coords:{latitude:lat,longitude:lng}})=>{
          setUserPos([lat,lng]);
          if(mapInstance.current)mapInstance.current.setView([lat,lng],13,{animate:true});
          await getRouteFrom(lat,lng,loc);
        },
        ()=>alert('Location access denied.'),
        {enableHighAccuracy:true}
      );
      return;
    }
    await getRouteFrom(userPos[0],userPos[1],loc);
  };

  // ── Search ───────────────────────────────────────────────────
  const handleSearchInput=val=>{
    setSearchQuery(val);
    clearTimeout(searchDeb.current);
    if(val.length<2){setSearchSugs([]);setShowSearchSugs(false);return;}
    searchDeb.current=setTimeout(()=>{
      const cities=[...new Set(locations.map(l=>l.city).filter(Boolean))];
      const names=locations.map(l=>l.name).filter(Boolean);
      const sugs=[...new Set([...cities,...names])].filter(s=>s.toLowerCase().includes(val.toLowerCase())).slice(0,6);
      setSearchSugs(sugs);setShowSearchSugs(sugs.length>0);
    },180);
  };
  const applySearchSug=val=>{
    setSearchQuery(val);setShowSearchSugs(false);
    const match=sorted.find(l=>l.name?.toLowerCase().includes(val.toLowerCase())||l.city?.toLowerCase().includes(val.toLowerCase()));
    if(match&&mapInstance.current)mapInstance.current.setView([match.lat,match.lng],14,{animate:true});
    if(match)setSelected(match);
  };

  const handleUseMyLocation=()=>{
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({coords:{latitude:lat,longitude:lng}})=>{
        setUserPos([lat,lng]);
        if(mapInstance.current)mapInstance.current.setView([lat,lng],14,{animate:true});
      },
      err=>console.warn('Geolocation error:',err),
      {enableHighAccuracy:true}
    );
  };

  const handleSidebarClick=loc=>{
    setSelected(loc);
    if(mapInstance.current)mapInstance.current.setView([loc.lat,loc.lng],15,{animate:true});
  };



  // ── Header button — role-aware ────────────────────────────────
  // Seller  → navigates directly to the List Waste page
  // Recycler → navigates to profile page (Recycler Profile tab) to set address
  const handleHeaderAction = () => {
    if (onNavigate) onNavigate(role === 'recycler' ? 'profile' : 'listWaste');
  };

  const pageTitle    = role==='recycler' ? 'Find Waste Generators' : 'Find Recyclers';
  const pageSubtitle = role==='recycler'
    ? 'Discover waste sellers with active listings near you'
    : 'Discover recycling centres and collection points across Kenya';
  const countLabel   = role==='recycler' ? 'Generators' : 'Recycling Centres';

  return (
    <div style={S.root}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>{pageTitle}</h1>
          <p style={S.pageSubtitle}>{pageSubtitle}</p>
        </div>

        <div style={S.headerRight}>
          <RoleBadge role={role} />

          <button style={S.addBtn} onClick={handleHeaderAction}>
            {role === 'recycler' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Add My Centre
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                List Waste
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile toggle ────────────────────────────────────── */}
      <div className="wlm-mobile-toggle" style={S.mobileToggleBar}>
        {['list','map'].map(v=>(
          <button key={v} style={{...S.mobileToggleBtn,...(mobileView===v?S.mobileToggleBtnActive:{})}}
            onClick={()=>setMobileView(v)}>
            {v==='list'
              ?<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>List</>
              :<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5}}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>Map</>
            }
          </button>
        ))}
      </div>

      <div style={S.body}>

        {/* ── Sidebar ────────────────────────────────────────── */}
        <div className={`wlm-sidebar${mobileView==='map'?' wlm-sidebar-hidden':''}`} style={S.sidebar}>

          <div style={S.sidebarMeta}>
            <span style={S.countText}>{sorted.length} {countLabel}</span>
            <button style={S.locBtn} onClick={handleUseMyLocation}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
              </svg>
              Use My Location
            </button>
          </div>

          {/* Search */}
          <div style={{position:'relative',margin:'0 14px 10px'}}>
            <svg style={S.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input style={S.searchInput} placeholder="Search by name or city..."
              value={searchQuery}
              onChange={e=>handleSearchInput(e.target.value)}
              onFocus={()=>searchSugs.length&&setShowSearchSugs(true)}
              onBlur={()=>setTimeout(()=>setShowSearchSugs(false),150)}
            />
            {searchQuery&&(
              <button style={S.clearBtn} onClick={()=>{setSearchQuery('');setShowSearchSugs(false);}}>✕</button>
            )}
            {showSearchSugs&&(
              <div style={S.autocomplete}>
                {searchSugs.map((s,i)=>(
                  <div key={i} style={S.autocompleteItem} onMouseDown={()=>applySearchSug(s)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filters (seller only) */}
          {role!=='recycler'&&(
            <div style={S.filterRow}>
              {WASTE_TYPES.map(t=>(
                <button key={t} style={{...S.chip,...(activeType===t?S.chipActive:{})}}
                  onClick={()=>setActiveType(t)}>{t}</button>
              ))}
            </div>
          )}

          {/* Legend (seller only) */}
          {role!=='recycler'&&(
            <div style={S.legend}>
              <span style={S.legendItem}><span style={{...S.legendDot,background:PIN_COLORS.recycling_centre}}/>Recycling Centre</span>
              <span style={S.legendItem}><span style={{...S.legendDot,background:PIN_COLORS.collection_point}}/>Collection Point</span>
            </div>
          )}

          {/* List */}
          <div style={S.list}>
            {loading?(
              <div style={S.empty}>
                <div style={{display:'flex',gap:5}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:8,height:8,borderRadius:'50%',background:'#c3e6d4',
                      animation:`wlm-dot 1.2s ease-in-out ${i*0.2}s infinite both`}}/>
                  ))}
                </div>
                <p style={{margin:0,color:'#aaa',fontSize:13}}>Loading locations…</p>
              </div>
            ):sorted.length===0?(
              <div style={S.empty}>
                <span style={{fontSize:32}}>🗺️</span>
                <p style={{margin:0,color:'#aaa',fontSize:13}}>No locations found.</p>
              </div>
            ):sorted.map(loc=>(
              <LocationCard key={loc.id} loc={loc} userPos={userPos}
                selected={selected?.id===loc.id}
                onClick={()=>handleSidebarClick(loc)}
                onDirections={()=>handleGetDirections(loc)}
              />
            ))}
          </div>
        </div>

        {/* ── Map ────────────────────────────────────────────── */}
        <div className={`wlm-map-wrap${mobileView==='list'?' wlm-map-hidden':''}`} style={S.mapWrap}>
          <div ref={mapRef} style={S.mapEl}/>

          {!mapReady&&(
            <div style={S.mapLoader}>
              <div style={S.spinnerRing}/>
              <span style={{color:'#1a4731',fontWeight:600,fontSize:13}}>Loading map…</span>
            </div>
          )}

          {routeLoading&&(
            <div style={S.routeLoadingBadge}>
              <div style={{width:14,height:14,border:'2px solid #c3e6d4',borderTop:'2px solid #1a4731',
                borderRadius:'50%',animation:'wlm-spin .7s linear infinite',flexShrink:0}}/>
              Calculating route…
            </div>
          )}

          {routeData&&!routeLoading&&(
            <button style={S.clearRouteBtn} onClick={clearRoute}>✕ Clear Route</button>
          )}

          {showRoutePanel&&routeData&&(
            <RoutePanel route={routeData} destination={routeData.destinationName}
              onClose={()=>setShowRoutePanel(false)}/>
          )}
            
          {selected&&!showRoutePanel&&(
            <div className="wlm-detail-card" style={S.detailCard}>
              <button style={S.detailClose} onClick={()=>setSelected(null)}>✕</button>
              <div style={S.detailBadges}>
                <span style={{...S.detailBadge,background:PIN_COLORS[selected.location_type]||'#1a4731',color:'#fff'}}>
                  {PIN_LABELS[selected.location_type]}
                </span>
                {selected.is_verified&&<span style={S.verifiedBadge}>✓ Verified</span>}
              </div>
              
              <p style={S.detailName}>{selected.name}</p>
              {selected.address&&<p style={S.detailSub}>📍 {selected.address}{selected.city?`, ${selected.city}`:''}</p>}
 {selected.operating_hours && (
  <p style={S.detailSub}>
    🕐 {formatHours(selected.operating_hours)}
  </p>
)}
              {selected.phone&&<p style={S.detailSub}>📞 {selected.phone}</p>}
              {selected.users?.rating&&(
                <p style={S.detailRating}>
                  <span style={{color:'#f59e0b'}}>★</span> {selected.users.rating.toFixed(1)}
                  <span style={{color:'#aaa'}}> ({selected.users.rating_count} reviews)</span>
                </p>
              )}
              {selected.accepted_types?.length>0&&(
                <div style={S.detailTags}>
                  {selected.accepted_types.map(t=>{
                    const c=TYPE_COLORS[t]||{bg:'#f0f0f0',color:'#555'};
                    return<span key={t} style={{...S.tag,background:c.bg,color:c.color}}>{t}</span>;
                  })}
                </div>
              )}
              <div style={S.detailActions}>
                <button style={S.dirBtn} onClick={()=>handleGetDirections(selected)} disabled={routeLoading}>
                  {routeLoading?'Loading…':'🗺️ Get Directions'}
                </button>
                <a style={S.mapsBtn}
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                  target="_blank" rel="noreferrer">
                  Google Maps ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>


      <style>{`
        .wlm-tooltip {
          background: rgba(20,20,20,0.92) !important; color: white !important;
          border: none !important; border-radius: 8px !important;
          padding: 6px 11px !important; font-size: 12px !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.25) !important; white-space: nowrap !important;
        }
        .wlm-tooltip::before { display: none !important; }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 10px rgba(0,0,0,0.15) !important; }
        .leaflet-control-zoom a {
          background: white !important; color: #333 !important; border: none !important;
          border-radius: 8px !important; width: 32px !important; height: 32px !important;
          line-height: 32px !important; font-size: 17px !important; margin-bottom: 3px !important;
        }
        .leaflet-control-zoom a:hover { background: #e8f4ee !important; color: #1a4731 !important; }
        .leaflet-attribution-flag { display: none !important; }
        @keyframes wlm-spin { to { transform: rotate(360deg); } }
        @keyframes wlm-slideup {
          from { transform: translateY(16px) translateX(-50%); opacity:0; }
          to   { transform: translateY(0) translateX(-50%); opacity:1; }
        }
        @keyframes wlm-panelup {
          from { transform: translateY(30px); opacity:0; }
          to   { transform: translateY(0); opacity:1; }
        }
        @keyframes wlm-dot {
          0%,80%,100% { transform:scale(0); opacity:.3; }
          40% { transform:scale(1); opacity:1; }
        }
        .wlm-mobile-toggle { display: none !important; }
        @media (max-width: 768px) {
          .wlm-mobile-toggle  { display: flex !important; }
          .wlm-sidebar-hidden { display: none !important; }
          .wlm-map-hidden     { display: none !important; }
          .wlm-sidebar        { width: 100% !important; max-width: 100% !important; }
          .wlm-map-wrap       { height: 100% !important; }
          .wlm-detail-card    { bottom:12px !important; left:10px !important; right:10px !important; width:auto !important; transform:none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Location Card ────────────────────────────────────────────
function LocationCard({ loc, userPos, selected, onClick, onDirections }) {
  const dist  = userPos ? distKm(userPos[0],userPos[1],loc.lat,loc.lng) : null;
  const rating= loc.users?.rating??null;
  const isCP  = loc.location_type==='collection_point';
  return(
    <div style={{borderBottom:'1px solid #f5f5f5'}}>
      <button onClick={onClick} style={{...S.card,...(selected?S.cardActive:{})}}>
        <div style={S.cardRow}>
          <div style={{...S.avatarCircle,background:isCP?'#fff3e0':'#e8f4ee'}}>
            {isCP
              ?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e07b2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12H19M12 5l7 7-7 7"/></svg>
              :<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={S.cardName}>{loc.name}</p>
            <p style={S.cardSub}>
  {loc.address || loc.city || ''}
  {loc.operating_hours
    ? ` · ${formatHours(loc.operating_hours)}`
    : ''}
</p>
            {rating!==null&&(
              <div style={{display:'flex',alignItems:'center',marginTop:3}}>
                <span style={{color:'#f59e0b',fontSize:12}}>★</span>
                <span style={{color:'#555',fontSize:12,marginLeft:2}}>
                  {rating.toFixed(1)}{loc.users?.rating_count?` · ${loc.users.rating_count} reviews`:''}
                </span>
              </div>
            )}
          </div>
          {dist!==null&&<span style={S.distBadge}>{dist.toFixed(1)} km</span>}
        </div>
        {loc.accepted_types?.length>0&&(
          <div style={S.tagRow}>
            {loc.accepted_types.slice(0,4).map(t=>{
              const c=TYPE_COLORS[t]||{bg:'#f0f0f0',color:'#555'};
              return<span key={t} style={{...S.tag,background:c.bg,color:c.color}}>{t}</span>;
            })}
            {loc.accepted_types.length>4&&<span style={{...S.tag,background:'#f0f0f0',color:'#888'}}>+{loc.accepted_types.length-4}</span>}
          </div>
        )}
      </button>
      {selected&&(
        <div style={{padding:'0 6px 10px 50px',display:'flex',gap:6}}>
          <button style={S.cardDirBtn} onClick={e=>{e.stopPropagation();onDirections();}}>
            🗺️ Directions
          </button>
          <a style={S.cardMapsBtn}
            href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
            target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>
            Google Maps ↗
          </a>
        </div>
      )}
    </div>
  );
}

function PField({ label, children }) {
  return(
    <div style={{marginBottom:16}}>
      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#1a4731',marginBottom:5}}>{label}</label>
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const S = {
  root: { display:'flex',flexDirection:'column',height:'100%',minHeight:0,background:'#f7f8f3',
    fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" },
  header: { display:'flex',alignItems:'center',justifyContent:'space-between',
    padding:'12px 20px',background:'white',borderBottom:'1px solid #eee',
    flexWrap:'wrap',gap:10,flexShrink:0 },
  headerRight: { display:'flex',alignItems:'center',gap:10 },
  pageTitle: { margin:0,fontSize:18,fontWeight:700,color:'#1a1a1a',lineHeight:1.2 },
  pageSubtitle: { margin:'2px 0 0',fontSize:12,color:'#888' },
  addBtn: { display:'flex',alignItems:'center',gap:7,background:'#1a4731',color:'white',
    border:'none',borderRadius:10,padding:'9px 16px',fontSize:13,fontWeight:600,
    cursor:'pointer',whiteSpace:'nowrap' },
  mobileToggleBar: { background:'white',borderBottom:'1px solid #eee',
    padding:'8px 16px',flexShrink:0,display:'none' },
  mobileToggleBtn: { flex:1,display:'flex',alignItems:'center',justifyContent:'center',
    padding:'8px',border:'1.5px solid #e0e0e0',borderRadius:8,background:'#fafafa',
    fontSize:13,fontWeight:500,color:'#555',cursor:'pointer',margin:'0 4px',transition:'all .15s' },
  mobileToggleBtnActive: { background:'#1a4731',borderColor:'#1a4731',color:'white' },
  body: { display:'flex',flex:1,minHeight:0,overflow:'hidden' },
  sidebar: { width:380,minWidth:280,display:'flex',flexDirection:'column',
    background:'white',borderRight:'1px solid #eee',overflow:'hidden',flexShrink:0 },
  sidebarMeta: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px 8px' },
  countText: { fontSize:14,fontWeight:600,color:'#1a1a1a' },
  locBtn: { display:'flex',alignItems:'center',gap:5,background:'none',
    border:'1.5px solid #1a4731',color:'#1a4731',borderRadius:20,
    padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer' },
  searchIcon: { position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' },
  searchInput: { width:'100%',padding:'10px 32px 10px 34px',border:'1.5px solid #e8e8e8',
    borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box',background:'#fafafa',color:'#1a1a1a' },
  clearBtn: { position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
    background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:12,padding:4 },
  autocomplete: { position:'absolute',top:'100%',left:0,right:0,background:'white',
    border:'1px solid #eee',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.10)',
    zIndex:9999,maxHeight:260,overflowY:'auto',marginTop:3 },
  autocompleteItem: { display:'flex',alignItems:'center',gap:8,padding:'9px 14px',
    fontSize:13,cursor:'pointer',borderBottom:'1px solid #f5f5f5',color:'#333' },
  filterRow: { display:'flex',flexWrap:'wrap',gap:6,padding:'0 14px 10px' },
  chip: { border:'1.5px solid #e0e0e0',borderRadius:20,padding:'5px 13px',
    fontSize:12,fontWeight:500,background:'white',color:'#555',cursor:'pointer',transition:'all .15s' },
  chipActive: { background:'#1a4731',color:'white',borderColor:'#1a4731' },
  legend: { display:'flex',gap:16,padding:'0 14px 10px',flexWrap:'wrap' },
  legendItem: { display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#666',fontWeight:500 },
  legendDot: { width:9,height:9,borderRadius:'50%',flexShrink:0 },
  list: { flex:1,overflowY:'auto',padding:'4px 10px 16px' },
  empty: { display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 16px',gap:10 },
  card: { width:'100%',textAlign:'left',background:'none',border:'none',
    padding:'13px 6px 8px',cursor:'pointer',transition:'background .12s',display:'block' },
  cardActive: { background:'#f0faf5' },
  cardRow: { display:'flex',alignItems:'flex-start',gap:10 },
  avatarCircle: { width:34,height:34,borderRadius:'50%',
    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 },
  cardName: { margin:0,fontSize:14,fontWeight:600,color:'#1a1a1a',
    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' },
  cardSub: { margin:'2px 0 0',fontSize:12,color:'#999',
    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' },
  distBadge: { background:'#f0faf5',color:'#1a4731',padding:'3px 9px',
    borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:'nowrap',marginLeft:4,flexShrink:0 },
  tagRow: { display:'flex',flexWrap:'wrap',gap:4,marginTop:8,paddingLeft:44 },
  tag: { padding:'3px 9px',borderRadius:12,fontSize:11,fontWeight:600 },
  cardDirBtn: { padding:'6px 12px',background:'#1a4731',color:'white',border:'none',
    borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer' },
  cardMapsBtn: { padding:'6px 12px',background:'#f0faf5',color:'#1a4731',
    border:'1.5px solid #c3e6d4',borderRadius:8,fontSize:12,fontWeight:600,
    textDecoration:'none',display:'inline-flex',alignItems:'center' },
  mapWrap: { flex:1,position:'relative',minHeight:0 },
  mapEl: { width:'100%',height:'100%',minHeight:400 },
  mapLoader: { position:'absolute',inset:0,display:'flex',flexDirection:'column',
    alignItems:'center',justifyContent:'center',background:'#f0faf5',gap:12 },
  spinnerRing: { width:32,height:32,border:'3px solid #c3e6d4',
    borderTop:'3px solid #1a4731',borderRadius:'50%',animation:'wlm-spin .8s linear infinite' },
  detailCard: { position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',
    background:'white',borderRadius:16,padding:'18px 20px 16px',
    width:'min(400px, calc(100% - 48px))',boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
    zIndex:600,animation:'wlm-slideup .25s cubic-bezier(.34,1.2,.64,1)' },
  detailClose: { position:'absolute',top:12,right:14,background:'#f5f5f5',
    border:'none',width:26,height:26,borderRadius:'50%',cursor:'pointer',
    fontSize:12,color:'#666',display:'flex',alignItems:'center',justifyContent:'center' },
  detailBadges: { display:'flex',flexWrap:'wrap',gap:5,marginBottom:8 },
  detailBadge: { padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600 },
  verifiedBadge: { padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,
    background:'#e8f4ee',color:'#1a4731' },
  detailName: { margin:'0 28px 4px 0',fontSize:16,fontWeight:700,color:'#1a1a1a' },
  detailSub: { margin:'0 0 3px',fontSize:12.5,color:'#888' },
  detailRating: { margin:'4px 0 8px',fontSize:13 },
  detailTags: { display:'flex',flexWrap:'wrap',gap:5,marginBottom:14 },
  detailActions: { display:'flex',gap:8 },
  dirBtn: { flex:2,padding:'11px',background:'#1a4731',color:'white',border:'none',
    borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer' },
  mapsBtn: { flex:1,padding:'11px',background:'#f0faf5',color:'#1a4731',
    border:'1.5px solid #c3e6d4',borderRadius:10,fontSize:13,fontWeight:600,
    textAlign:'center',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center' },
  routeLoadingBadge: { position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',
    background:'white',borderRadius:20,padding:'8px 16px',boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
    fontSize:13,fontWeight:500,color:'#1a4731',display:'flex',alignItems:'center',gap:8,zIndex:700 },
  clearRouteBtn: { position:'absolute',top:12,right:12,background:'white',
    border:'1.5px solid #e0e0e0',borderRadius:8,padding:'6px 12px',
    fontSize:12,fontWeight:600,color:'#555',cursor:'pointer',
    boxShadow:'0 2px 8px rgba(0,0,0,0.10)',zIndex:700 },
  routePanel: { position:'absolute',bottom:0,left:0,right:0,background:'white',
    borderRadius:'16px 16px 0 0',maxHeight:'55%',
    boxShadow:'0 -4px 24px rgba(0,0,0,0.12)',zIndex:650,
    display:'flex',flexDirection:'column',animation:'wlm-panelup .25s ease' },
  routePanelHeader: { display:'flex',alignItems:'center',justifyContent:'space-between',
    padding:'16px 18px 12px',borderBottom:'1px solid #f0f0f0',flexShrink:0 },
  routeStat: { display:'flex',alignItems:'center',gap:5,fontSize:13,fontWeight:600,color:'#1a4731' },
  routeCloseBtn: { background:'#f5f5f5',border:'none',width:28,height:28,borderRadius:'50%',
    cursor:'pointer',fontSize:13,color:'#666',display:'flex',alignItems:'center',justifyContent:'center' },
  routeSteps: { overflowY:'auto',padding:'8px 0 16px' },
  routeStep: { display:'flex',alignItems:'flex-start',gap:10,padding:'8px 18px' },
  routeStepIcon: { width:26,height:26,borderRadius:'50%',background:'#f0faf5',
    display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0 },
  overlay: { position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)',
    zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 },
  panel: { background:'white',borderRadius:18,width:'100%',maxWidth:480,maxHeight:'92vh',
    overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.22)',
    animation:'wlm-panelup .25s cubic-bezier(.34,1.4,.64,1)' },
  panelHeader: { display:'flex',alignItems:'center',justifyContent:'space-between',
    padding:'20px 24px 16px',borderBottom:'1px solid #eee',
    position:'sticky',top:0,background:'white',zIndex:1 },
  panelTitle: { margin:0,fontSize:17,fontWeight:700,color:'#1a1a1a' },
  panelClose: { background:'none',border:'none',fontSize:17,cursor:'pointer',color:'#888' },
  panelBody: { padding:'20px 24px 28px' },
  inp: { width:'100%',padding:'10px 12px',border:'1.5px solid #e8e8e8',
    borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box',
    background:'#fafafa',color:'#1a1a1a' },
  checkGrid: { display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:8 },
  checkLabel: { display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#333',cursor:'pointer' },
  saveBtn: { width:'100%',padding:'13px',background:'#1a4731',color:'white',
    border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',marginTop:8 },
  successBox: { display:'flex',flexDirection:'column',alignItems:'center',padding:'56px 24px',gap:4 },
  hoursPicker: { position:'absolute',top:'100%',left:0,right:0,background:'white',
    border:'1.5px solid #e8e8e8',borderRadius:14,boxShadow:'0 12px 36px rgba(0,0,0,0.14)',
    zIndex:9999,padding:'16px',marginTop:4 },
  hoursLabel: { margin:'0 0 8px',fontSize:11,fontWeight:700,color:'#1a4731',
    textTransform:'uppercase',letterSpacing:'.5px' },
  presetBtn: { padding:'5px 12px',borderRadius:20,border:'1.5px solid #e0e0e0',
    background:'white',fontSize:12,fontWeight:500,color:'#555',cursor:'pointer',transition:'all .12s' },
  presetBtnActive: { background:'#e8f4ee',borderColor:'#1a4731',color:'#1a4731',fontWeight:600 },
  dayBtn: { flex:1,padding:'6px 2px',borderRadius:8,border:'1.5px solid #e0e0e0',
    background:'white',fontSize:11,fontWeight:500,color:'#555',cursor:'pointer',
    textAlign:'center',transition:'all .12s' },
  dayBtnActive: { background:'#1a4731',borderColor:'#1a4731',color:'white',fontWeight:700 },
  applyBtn: { width:'100%',padding:'10px',background:'#1a4731',color:'white',
    border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer' },
};