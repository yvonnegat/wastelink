// src/components/map/MapModule.jsx
// v8 — Fix: featureGroup bounds, auto-pan to nearest on location, better pins

import { useState, useEffect, useRef } from 'react';
import { useMapLocations } from '../../hooks/useMapLocations';

const PIN_COLORS = {
  recycling_centre: '#1a6b45',
  collection_point: '#c96a10',
  waste_generator:  '#1d4ed8',
};
const PIN_LABELS = {
  recycling_centre: 'Recycling Centre',
  collection_point: 'Collection Point',
  waste_generator:  'Waste Generator',
};
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
  'Textiles':   { bg: '#fce4ec', color: '#c2185b' },
  'Tyres':      { bg: '#efebe9', color: '#4e342e' },
  'Motor Oil':  { bg: '#fafafa', color: '#424242' },
  'Cooking Oil':{ bg: '#fff8e1', color: '#f9a825' },
  'Styrofoam':  { bg: '#e3f2fd', color: '#1565c0' },
  'Wood':       { bg: '#efebe9', color: '#5d4037' },
};
const ALL_WASTE_TYPES = [
  'Plastic','Metal','Paper','Cardboard','E-Waste','Batteries',
  'Glass','Organic','Textiles','Tyres','Scrap Iron','Aluminum',
  'Styrofoam','Wood','Motor Oil','Cooking Oil',
];

// ─── Icons ────────────────────────────────────────────────────
// Recycling centre: leaf/recycle symbol inside pin
// Lucide-style icon paths per location type
const LUCIDE_PATHS = {
  recycling_centre: `
    <g transform="translate(7, 7) scale(0.92)">
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="m14 16-3 3 3 3" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="m13.378 9.633 4.096 1.098 1.097-4.096" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`,

  collection_point: `
    <g transform="translate(7, 8) scale(0.92)">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`,

  waste_generator: `
    <g transform="translate(7, 7) scale(0.92)">
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 3v6" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </g>`,
};

function lighten(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 40);
  const g = Math.min(255, ((n >> 8) & 0xff) + 40);
  const b = Math.min(255, (n & 0xff) + 40);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function makeSvgIcon(locationType) {
  const color = PIN_COLORS[locationType] || '#1a4731';
  const id = color.replace('#', '') + locationType;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <defs>
      <filter id="sh${id}" x="-80%" y="-50%" width="260%" height="260%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.22)"/>
      </filter>
    </defs>
    <path d="M14 2 C8 2 3 7 3 13 C3 21 14 34 14 34 C14 34 25 21 25 13 C25 7 20 2 14 2 Z"
      fill="${color}" filter="url(#sh${id})"/>
    <circle cx="14" cy="13" r="4.5" fill="white" opacity="0.95"/>
    <circle cx="14" cy="13" r="2" fill="${color}"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeNumberedPin(number, color = '#f59e0b') {
  const id = color.replace('#','');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
    <defs><filter id="shn${id}${number}" x="-50%" y="-30%" width="200%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.28)"/>
    </filter></defs>
    <path d="M18 2 C10 2 4 8 4 16 C4 26 18 46 18 46 C18 46 32 26 32 16 C32 8 26 2 18 2 Z"
      fill="${color}" filter="url(#shn${id}${number})"/>
    <circle cx="18" cy="16" r="11" fill="rgba(255,255,255,0.2)"/>
    <text x="18" y="21" text-anchor="middle" font-size="14" font-weight="800"
      font-family="system-ui,sans-serif" fill="white">${number}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeUserDotIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="rgba(66,133,244,0.18)"/>
    <circle cx="12" cy="12" r="7" fill="#4285F4" stroke="white" stroke-width="2.5"/>
    <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.6)"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ─── Constants ────────────────────────────────────────────────
const DEFAULT_CENTER = [-1.2921, 36.8219];
const DEFAULT_ZOOM   = 11;
const MAX_TRIP_STOPS = 5;

function distKm(lat1, lng1, lat2, lng2) {
  const R=6371,dL=((lat2-lat1)*Math.PI)/180,dG=((lng2-lng1)*Math.PI)/180;
  const a=Math.sin(dL/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dG/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function fmtDur(s){const m=Math.round(s/60);return m<60?`${m} min`:`${Math.floor(m/60)}h ${m%60}min`;}
function fmtDist(m){return m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(1)} km`;}

async function searchPlaces(query) {
  if(!query||query.length<2) return [];
  try {
    const url=new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text',query);
    url.searchParams.set('apiKey',process.env.REACT_APP_GEOAPIFY_KEY);
    url.searchParams.set('filter','countrycode:ke');
    url.searchParams.set('limit','7');
    url.searchParams.set('lang','en');
    const data=await fetch(url.toString()).then(r=>r.json());
    return (data.features||[]).map(f=>{
      const p=f.properties;
      return {display_name:p.formatted,short_name:p.name||p.street||p.formatted,city:p.city||p.county||'',lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],osm_type:p.result_type||''};
    }).filter(r=>r.display_name?.length>2);
  } catch{return [];}
}

async function fetchRoute(fLat,fLng,tLat,tLng) {
  try {
    const url=new URL('https://api.geoapify.com/v1/routing');
    url.searchParams.set('waypoints',`${fLat},${fLng}|${tLat},${tLng}`);
    url.searchParams.set('mode','drive');
    url.searchParams.set('apiKey',process.env.REACT_APP_GEOAPIFY_KEY);
    const data=await fetch(url.toString()).then(r=>r.json());
    if(!data.features?.length) return null;
    const rt=data.features[0];
    const props=rt.properties;
    const leg=props.legs?.[0];
    return {
      duration:props.time,distance:props.distance,geometry:rt.geometry,
      steps:(leg?.steps||[]).map(s=>({instruction:s.instruction?.text||s.name||'',distance:s.distance||0,type:s.type||'',modifier:s.modifier||''})).filter(s=>s.instruction),
    };
  } catch{return null;}
}

// ─── Trip optimiser ────────────────────────────────────────────
async function optimiseTripRoute(userPos, stops) {
  const apiKey = process.env.REACT_APP_GEOAPIFY_KEY;

  // Try Geoapify Route Planner for optimal order
  let orderedStops = [...stops];
  try {
    const body = {
      mode: 'drive',
      agents: [{ start_location:[userPos[1],userPos[0]], end_location:[userPos[1],userPos[0]] }],
      shipments: stops.map((s,i)=>({ id:`stop-${i}`, delivery:{ location:[s.lng,s.lat], duration:300 } })),
    };
    const planRes = await fetch(
      `https://api.geoapify.com/v1/routeplanner?apiKey=${apiKey}`,
      { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }
    );
    const planData = await planRes.json();
    if (planData.features?.length) {
      const actions = planData.features[0]?.properties?.agent?.actions || [];
      const ordered = actions
        .filter(a=>a.type==='delivery'&&a.shipment_id)
        .map(a=>{ const idx=parseInt(a.shipment_id.replace('stop-','')); return stops[idx]; })
        .filter(Boolean);
      if (ordered.length===stops.length) orderedStops=ordered;
    }
  } catch(e) { console.warn('Route planner fallback to original order:', e); }

  // Get driving geometry for ordered route
  const waypoints = [
    `${userPos[0]},${userPos[1]}`,
    ...orderedStops.map(s=>`${s.lat},${s.lng}`),
    `${userPos[0]},${userPos[1]}`,
  ].join('|');

  const routeRes = await fetch(
    `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(waypoints)}&mode=drive&apiKey=${apiKey}`
  );
  const routeData = await routeRes.json();
  const rf = routeData.features?.[0];
  if (!rf) throw new Error('No route geometry returned');

  return { orderedStops, geometry:rf.geometry, distance:rf.properties.distance, duration:rf.properties.time };
}

function formatTime(t) {
  if(!t) return '';
  if(t.toLowerCase().includes('am')||t.toLowerCase().includes('pm')) return t.replace(':','.');
  const [h,m]=t.split(':'); let hr=parseInt(h); const ap=hr>=12?'pm':'am'; hr=hr%12||12;
  return `${hr}.${m}${ap}`;
}
function formatHours(oh) {
  if(!oh) return '';
  if(typeof oh==='string'&&!oh.trim().startsWith('{')) return oh;
  let h=oh;
  if(typeof oh==='string'){try{h=JSON.parse(oh);}catch{return oh;}}
  if(!h||typeof h!=='object') return '';
  const sd={Monday:'Mon',Tuesday:'Tue',Wednesday:'Wed',Thursday:'Thu',Friday:'Fri',Saturday:'Sat',Sunday:'Sun'};
  const do_={Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6,Sunday:7};
  let fd='';
  if(Array.isArray(h.days)){
    const s=[...h.days].filter(Boolean).sort((a,b)=>do_[a]-do_[b]);
    const sh=s.map(d=>sd[d]||d);
    fd=sh.length>1?`${sh[0]}-${sh[sh.length-1]}`:sh[0];
  } else if(typeof h.days==='string'){
    fd=['Mon-Fri','Mon-Sat','Daily'].includes(h.days)?h.days:h.days.split(', ').map(d=>sd[d]||d).join(', ');
  }
  return `${fd} ${formatTime(h.open)}-${formatTime(h.close)}`.trim();
}

const MOCK_LOCATIONS = [
  {id:'m1',location_type:'recycling_centre',name:'Nairobi E-Waste Hub',address:'Tom Mboya St, CBD',city:'Nairobi',lat:-1.2864,lng:36.8172,accepted_types:['E-Waste','Batteries','Cables'],operating_hours:'Mon–Fri 9am–5pm',is_verified:true,users:{rating:4.4,rating_count:28}},
  {id:'m2',location_type:'recycling_centre',name:'GreenCycle Kenya – Industrial Area',address:'Enterprise Rd, Industrial Area',city:'Nairobi',lat:-1.3055,lng:36.8267,accepted_types:['Plastic','Metal','Paper'],operating_hours:'Mon–Sat 7am–6pm',is_verified:true,users:{rating:4.8,rating_count:55}},
  {id:'m3',location_type:'collection_point',name:'PaperBack Recyclers Parklands',address:'3rd Parklands Ave',city:'Nairobi',lat:-1.2650,lng:36.8104,accepted_types:['Paper','Cardboard'],operating_hours:'Mon–Sat 6am–7pm',is_verified:false,users:{rating:4.9,rating_count:41}},
  {id:'m4',location_type:'collection_point',name:'MetalWorks South B',address:'South B Shopping Centre',city:'Nairobi',lat:-1.2950,lng:36.8350,accepted_types:['Metal','Scrap Iron','Aluminum'],operating_hours:'Mon–Fri 7am–4pm',is_verified:true,users:{rating:4.5,rating_count:33}},
  {id:'m5',location_type:'recycling_centre',name:'EcoReclaim Westlands',address:'Westlands Rd',city:'Nairobi',lat:-1.2631,lng:36.8034,accepted_types:['Plastic','Glass'],operating_hours:'Mon–Fri 8am–5pm',is_verified:true,users:{rating:4.6,rating_count:19}},
];

// ══════════════════════════════════════════════════════════════
// MY WASTE FILTER PANEL
// ══════════════════════════════════════════════════════════════
function MyWasteFilterPanel({ selectedTypes, onChange, onClose }) {
  const toggle = t => onChange(selectedTypes.includes(t)?selectedTypes.filter(x=>x!==t):[...selectedTypes,t]);
  return (
    <div style={FP.overlay} onClick={onClose}>
      <div style={FP.panel} onClick={e=>e.stopPropagation()}>
        <div style={FP.header}>
          <div>
            <p style={FP.title}>What are you recycling?</p>
            <p style={FP.sub}>Tick everything you have — we'll rank centres by how many they accept</p>
          </div>
          <button style={FP.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={FP.grid}>
          {ALL_WASTE_TYPES.map(t=>{
            const c=TYPE_COLORS[t]||{bg:'#f0f0f0',color:'#555'};
            const active=selectedTypes.includes(t);
            return (
              <button key={t} onClick={()=>toggle(t)} style={{
                ...FP.typeBtn,
                background: active?c.color:c.bg,
                color:      active?'white':c.color,
                borderColor:active?c.color:'transparent',
                transform:  active?'scale(1.04)':'scale(1)',
              }}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',flexShrink:0}}/>
                {t}
                {active&&<span style={{marginLeft:'auto',fontSize:11}}>✓</span>}
              </button>
            );
          })}
        </div>
        <div style={FP.footer}>
          {selectedTypes.length>0&&<button style={FP.clearBtn} onClick={()=>onChange([])}>Clear all</button>}
          <button style={FP.applyBtn} onClick={onClose}>
            {selectedTypes.length===0?'Show all centres':`Find centres for ${selectedTypes.length} type${selectedTypes.length>1?'s':''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
const FP={
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)',zIndex:9100,display:'flex',alignItems:'flex-end',justifyContent:'center'},
  panel:{background:'white',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:560,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.18)',animation:'wlm-panelup .25s cubic-bezier(.34,1.2,.64,1)'},
  header:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'20px 20px 12px',borderBottom:'1px solid #f0f0f0',flexShrink:0},
  title:{margin:'0 0 3px',fontSize:16,fontWeight:700,color:'#1a1a1a'},
  sub:{margin:0,fontSize:12,color:'#888',lineHeight:1.4},
  closeBtn:{background:'#f5f5f5',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',color:'#666',fontSize:12,flexShrink:0},
  grid:{display:'flex',flexWrap:'wrap',gap:8,padding:'16px 20px',overflowY:'auto',flex:1},
  typeBtn:{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:20,border:'1.5px solid transparent',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all .15s',whiteSpace:'nowrap'},
  footer:{display:'flex',gap:8,padding:'14px 20px 20px',borderTop:'1px solid #f0f0f0',flexShrink:0},
  clearBtn:{padding:'11px 18px',background:'white',border:'1.5px solid #e0e0e0',borderRadius:10,fontSize:13,fontWeight:500,color:'#555',cursor:'pointer'},
  applyBtn:{flex:1,padding:'11px',background:'#1a4731',color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'},
};

// ══════════════════════════════════════════════════════════════
// TRIP PANEL
// ══════════════════════════════════════════════════════════════
function TripPanel({stops,tripRoute,optimising,onOptimise,onRemoveStop,onClear,onClose}) {
  return (
    <div style={TP.panel}>
      <div style={TP.header}>
        <div>
          <p style={TP.title}>
            🗺️ My Recycling Trip
            <span style={TP.stopCount}>{stops.length}/{MAX_TRIP_STOPS}</span>
          </p>
          {tripRoute&&(
            <div style={{display:'flex',gap:12,marginTop:4}}>
              <span style={TP.stat}>⏱ {fmtDur(tripRoute.duration)}</span>
              <span style={TP.stat}>📍 {fmtDist(tripRoute.distance)}</span>
            </div>
          )}
        </div>
        <button style={TP.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={TP.stopList}>
        {(tripRoute?.orderedStops||stops).map((stop,i)=>(
          <div key={stop.id} style={TP.stopRow}>
            <div style={{...TP.stopNum,background:tripRoute?'#f59e0b':'#1a4731'}}>{tripRoute?i+1:'·'}</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={TP.stopName}>{stop.name}</p>
              <p style={TP.stopCity}>{stop.city||stop.address||''}</p>
            </div>
            {!tripRoute&&<button style={TP.removeBtn} onClick={()=>onRemoveStop(stop.id)}>✕</button>}
          </div>
        ))}
      </div>
      <div style={TP.footer}>
        {!tripRoute?(
          <>
            <button style={TP.clearBtn} onClick={onClear}>Clear</button>
            <button style={{...TP.optimiseBtn,opacity:stops.length<2?0.5:1}} disabled={stops.length<2||optimising} onClick={onOptimise}>
              {optimising?<><span style={TP.spinner}/>Optimising…</>:<>✨ Optimise Route</>}
            </button>
          </>
        ):(
          <button style={TP.newTripBtn} onClick={onClear}>← Plan new trip</button>
        )}
      </div>
    </div>
  );
}
const TP={
  panel:{position:'absolute',bottom:0,left:0,right:0,background:'white',borderRadius:'16px 16px 0 0',boxShadow:'0 -4px 24px rgba(0,0,0,0.14)',zIndex:650,display:'flex',flexDirection:'column',maxHeight:'60%',animation:'wlm-panelup .25s ease'},
  header:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'16px 18px 10px',borderBottom:'1px solid #f0f0f0',flexShrink:0},
  title:{margin:0,fontSize:14,fontWeight:700,color:'#1a1a1a',display:'flex',alignItems:'center',gap:8},
  stopCount:{background:'#f0faf5',color:'#1a4731',padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:700},
  stat:{fontSize:12,fontWeight:600,color:'#1a4731'},
  closeBtn:{background:'#f5f5f5',border:'none',width:26,height:26,borderRadius:'50%',cursor:'pointer',fontSize:11,color:'#666',flexShrink:0},
  stopList:{overflowY:'auto',flex:1,padding:'8px 0'},
  stopRow:{display:'flex',alignItems:'center',gap:10,padding:'8px 18px',borderBottom:'1px solid #f9f9f9'},
  stopNum:{width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white',flexShrink:0},
  stopName:{margin:0,fontSize:13,fontWeight:600,color:'#1a1a1a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  stopCity:{margin:'1px 0 0',fontSize:11,color:'#aaa',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  removeBtn:{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:12,padding:'2px 6px',flexShrink:0},
  footer:{display:'flex',gap:8,padding:'12px 18px 16px',borderTop:'1px solid #f0f0f0',flexShrink:0},
  clearBtn:{padding:'10px 16px',background:'white',border:'1.5px solid #e0e0e0',borderRadius:10,fontSize:13,fontWeight:500,color:'#555',cursor:'pointer'},
  optimiseBtn:{flex:1,padding:'10px',background:'#f59e0b',color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6},
  newTripBtn:{flex:1,padding:'10px',background:'#f0faf5',color:'#1a4731',border:'1.5px solid #c3e6d4',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'},
  spinner:{width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid white',borderRadius:'50%',animation:'wlm-spin .7s linear infinite',flexShrink:0},
};

// ─── Route Panel ──────────────────────────────────────────────
function RoutePanel({route,destination,onClose}) {
  if(!route) return null;
  const stepIcon=(type,mod)=>{
    if(type==='turn'){if(mod==='left')return'↰';if(mod==='right')return'↱';if(mod==='slight left')return'↖';if(mod==='slight right')return'↗';}
    if(type==='depart')return'🔵';if(type==='arrive')return'🏁';
    if(type==='roundabout'||type==='rotary')return'🔄';return'↑';
  };
  return(
    <div style={S.routePanel}>
      <div style={S.routePanelHeader}>
        <div>
          <p style={{margin:'0 0 4px',fontSize:13,fontWeight:700,color:'#1a1a1a'}}>Route to {destination}</p>
          <div style={{display:'flex',gap:14}}>
            <span style={S.routeStat}>⏱ {fmtDur(route.duration)}</span>
            <span style={S.routeStat}>📍 {fmtDist(route.distance)}</span>
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
        {route.steps.length===0&&<p style={{color:'#aaa',fontSize:12,textAlign:'center',padding:'16px 0'}}>Follow the line on the map.</p>}
      </div>
    </div>
  );
}

function RoleBadge({role}) {
  const isR=role==='recycler';
  return(
    <div style={{display:'flex',alignItems:'center',gap:7,padding:'7px 14px',borderRadius:20,background:isR?'#e8f4ee':'#f0faf5',border:`1.5px solid ${isR?'#1a4731':'#4ade80'}`,fontSize:13,fontWeight:600,color:'#1a4731',userSelect:'none'}}>
      {isR
        ?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a4731" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
        :<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a4731" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
      }
      {isR?'Recycler':'Waste Seller'}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function MapModule({user,onNavigate}) {
  const role=user?.role||'seller';
  const {locations:dbLocations,loading}=useMapLocations(role);
  const [locations,setLocations]=useState([]);
  const [mobileView,setMobileView]=useState('list');

  useEffect(()=>{
    if(!loading){
      if(dbLocations.length>0) setLocations(dbLocations);
      else setLocations(role!=='recycler'
        ?MOCK_LOCATIONS.filter(l=>l.location_type!=='waste_generator')
        :MOCK_LOCATIONS.filter(l=>l.location_type==='waste_generator'));
    }
  },[dbLocations,loading,role]);

  const [selectedWasteTypes,setSelectedWasteTypes]=useState([]);
  const [showWastePanel,setShowWastePanel]=useState(false);
  const [searchQuery,setSearchQuery]=useState('');
  const [searchSugs,setSearchSugs]=useState([]);
  const [showSearchSugs,setShowSearchSugs]=useState(false);
  const searchDeb=useRef(null);

  const [tripStops,setTripStops]=useState([]);
  const [tripOptimising,setTripOptimising]=useState(false);
  const [tripRoute,setTripRoute]=useState(null);
  const [showTripPanel,setShowTripPanel]=useState(false);
  const tripLayerRef=useRef(null);

  const mapRef=useRef(null);
  const mapInstance=useRef(null);
  const markersRef=useRef([]);
  const userDotRef=useRef(null);
  const routeLayerRef=useRef(null);

  const [selected,setSelected]=useState(null);
  const [userPos,setUserPos]=useState(null);
  const [mapReady,setMapReady]=useState(false);
  const [routeData,setRouteData]=useState(null);
  const [routeLoading,setRouteLoading]=useState(false);
  const [showRoutePanel,setShowRoutePanel]=useState(false);

  // ── Filtered + scored ────────────────────────────────────────
  const filtered=locations
    .filter(loc=>{
      const lt=(loc.accepted_types||[]).map(t=>t.toLowerCase());
      const typeOk=selectedWasteTypes.length===0||selectedWasteTypes.some(t=>lt.includes(t.toLowerCase()));
      const searchOk=!searchQuery||[loc.name,loc.city,loc.address].some(f=>f?.toLowerCase().includes(searchQuery.toLowerCase()));
      return typeOk&&searchOk;
    })
    .map(loc=>{
      const lt=(loc.accepted_types||[]).map(t=>t.toLowerCase());
      const score=selectedWasteTypes.length===0?0:selectedWasteTypes.filter(t=>lt.includes(t.toLowerCase())).length;
      return {...loc,_matchScore:score,_matchTotal:selectedWasteTypes.length};
    });

  const sorted=(()=>{
    const arr=[...filtered];
    if(selectedWasteTypes.length>0){
      arr.sort((a,b)=>{
        const d=b._matchScore-a._matchScore;
        if(d!==0) return d;
        if(!userPos) return 0;
        return distKm(userPos[0],userPos[1],a.lat,a.lng)-distKm(userPos[0],userPos[1],b.lat,b.lng);
      });
    } else if(userPos){
      arr.sort((a,b)=>distKm(userPos[0],userPos[1],a.lat,a.lng)-distKm(userPos[0],userPos[1],b.lat,b.lng));
    }
    return arr;
  })();

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
    if(mobileView==='map'&&mapInstance.current) setTimeout(()=>mapInstance.current.invalidateSize(),60);
  },[mobileView]);

  // ── Markers ──────────────────────────────────────────────────
  useEffect(()=>{
    if(!mapReady||!mapInstance.current||!window.L) return;
    const L=window.L,map=mapInstance.current;
    markersRef.current.forEach(m=>map.removeLayer(m));
    markersRef.current=[];
    sorted.forEach(loc=>{
      const icon=L.icon({iconUrl:makeSvgIcon(loc.location_type),iconSize:[28,36], iconAnchor:[14,36], popupAnchor:[0,-38]});
      const marker=L.marker([loc.lat,loc.lng],{icon})
        .on('click',()=>{setSelected(loc);if(mobileView!=='map')setMobileView('map');})
        .addTo(map);
      marker.bindTooltip(
        `<div style="font-weight:600;font-size:12px">${loc.name}</div><div style="font-size:11px;color:#bbb;margin-top:2px">${PIN_LABELS[loc.location_type]||''}</div>`,
        {direction:'top',offset:[0,-50],className:'wlm-tooltip'}
      );
      markersRef.current.push(marker);
    });
  },[sorted,mapReady]);

  // ── User dot ─────────────────────────────────────────────────
  useEffect(()=>{
    if(!mapReady||!mapInstance.current||!window.L||!userPos) return;
    const L=window.L,map=mapInstance.current;
    if(userDotRef.current){map.removeLayer(userDotRef.current);userDotRef.current=null;}
    const dotIcon=L.icon({iconUrl:makeUserDotIcon(),iconSize:[24,24],iconAnchor:[12,12]});
    userDotRef.current=L.marker(userPos,{icon:dotIcon,zIndexOffset:1000})
      .bindTooltip('You are here',{direction:'top',className:'wlm-tooltip'})
      .addTo(map);
  },[userPos,mapReady]);

  // ── Single route ─────────────────────────────────────────────
  const drawRoute=geojson=>{
    if(!mapInstance.current||!window.L) return;
    const L=window.L,map=mapInstance.current;
    if(routeLayerRef.current){map.removeLayer(routeLayerRef.current);routeLayerRef.current=null;}
    const layer=L.geoJSON(geojson,{style:{color:'#2563eb',weight:5,opacity:0.85,lineCap:'round',lineJoin:'round'}}).addTo(map);
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
    if(!rt){alert('Could not calculate route.');return;}
    setRouteData({...rt,destinationName:loc.name});
    drawRoute(rt.geometry);
    setShowRoutePanel(true);setMobileView('map');
  };
  const handleGetDirections=async loc=>{
    if(!userPos){
      if(!navigator.geolocation){alert('Enable location access.');return;}
      navigator.geolocation.getCurrentPosition(
        async({coords:{latitude:lat,longitude:lng}})=>{
          setUserPos([lat,lng]);
          if(mapInstance.current)mapInstance.current.setView([lat,lng],13,{animate:true});
          await getRouteFrom(lat,lng,loc);
        },
        ()=>alert('Location access denied.'),{enableHighAccuracy:true}
      );return;
    }
    await getRouteFrom(userPos[0],userPos[1],loc);
  };

  // ── Trip ─────────────────────────────────────────────────────
  const addToTrip=loc=>{
    if(tripStops.find(s=>s.id===loc.id)) return;
    if(tripStops.length>=MAX_TRIP_STOPS){alert(`Maximum ${MAX_TRIP_STOPS} stops.`);return;}
    setTripStops(prev=>[...prev,loc]);
    setShowTripPanel(true);
    clearRoute();
  };
  const removeFromTrip=id=>setTripStops(prev=>prev.filter(s=>s.id!==id));
  const clearTrip=()=>{
    setTripStops([]);setTripRoute(null);setShowTripPanel(false);
    if(tripLayerRef.current&&mapInstance.current){mapInstance.current.removeLayer(tripLayerRef.current);tripLayerRef.current=null;}
  };

  // FIX: use L.featureGroup() not L.layerGroup() — featureGroup has getBounds()
  const drawTripRoute=(geojson,orderedStops)=>{
    if(!mapInstance.current||!window.L) return;
    const L=window.L,map=mapInstance.current;
    if(tripLayerRef.current){map.removeLayer(tripLayerRef.current);tripLayerRef.current=null;}
    const group=L.featureGroup(); // ← KEY FIX
    L.geoJSON(geojson,{
      style:{color:'#f59e0b',weight:5,opacity:0.9,lineCap:'round',lineJoin:'round',dashArray:'8 4'}
    }).addTo(group);
    orderedStops.forEach((stop,i)=>{
      const icon=L.icon({iconUrl:makeNumberedPin(i+1,'#f59e0b'),iconSize:[36,48],iconAnchor:[18,48]});
      L.marker([stop.lat,stop.lng],{icon})
        .bindTooltip(`Stop ${i+1}: ${stop.name}`,{direction:'top',className:'wlm-tooltip'})
        .addTo(group);
    });
    tripLayerRef.current=group.addTo(map);
    map.fitBounds(group.getBounds(),{padding:[50,50],animate:true}); // now works
  };

  const runOptimisation=async pos=>{
    setTripOptimising(true);
    try {
      const result=await optimiseTripRoute(pos,tripStops);
      setTripRoute(result);
      drawTripRoute(result.geometry,result.orderedStops);
      setMobileView('map');
    } catch(e){alert('Could not optimise route: '+e.message);}
    finally{setTripOptimising(false);}
  };
  const handleOptimiseTrip=async()=>{
    if(!userPos){
      navigator.geolocation?.getCurrentPosition(
        async({coords:{latitude:lat,longitude:lng}})=>{setUserPos([lat,lng]);await runOptimisation([lat,lng]);},
        ()=>alert('Enable location access to optimise route.')
      );return;
    }
    await runOptimisation(userPos);
  };

  // ── Use My Location — FIX: also pan map to nearest location ──
  const handleUseMyLocation=()=>{
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({coords:{latitude:lat,longitude:lng}})=>{
        setUserPos([lat,lng]);
        if(!mapInstance.current) return;

        // Pan to user first
        mapInstance.current.setView([lat,lng],13,{animate:true});

        // Then after sorted re-renders, fit map to show user + nearest 3 locations
        setTimeout(()=>{
          if(!mapInstance.current||!window.L) return;
          const nearby=locations
            .map(l=>({...l,d:distKm(lat,lng,l.lat,l.lng)}))
            .sort((a,b)=>a.d-b.d)
            .slice(0,3);
          if(nearby.length===0) return;
          const L=window.L;
          // FIX: use featureGroup to get bounds of user + nearby pins
          const fg=L.featureGroup([
            L.marker([lat,lng]),
            ...nearby.map(l=>L.marker([l.lat,l.lng])),
          ]);
          mapInstance.current.fitBounds(fg.getBounds(),{padding:[60,60],maxZoom:14,animate:true});
        },300);
      },
      err=>console.warn('Geolocation error:',err),
      {enableHighAccuracy:true}
    );
  };

  // ── Search ────────────────────────────────────────────────────
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
  const handleSidebarClick=loc=>{
    setSelected(loc);
    if(mapInstance.current)mapInstance.current.setView([loc.lat,loc.lng],15,{animate:true});
  };
  const handleHeaderAction=()=>{if(onNavigate)onNavigate(role==='recycler'?'profile':'listWaste');};

  const pageTitle=role==='recycler'?'Find Waste Generators':'Find Recyclers';
  const pageSubtitle=role==='recycler'?'Discover waste sellers with active listings near you':'Discover recycling centres and collection points across Kenya';
  const countLabel=role==='recycler'?'Generators':'Recycling Centres';

  return(
    <div style={S.root}>
      {showWastePanel&&<MyWasteFilterPanel selectedTypes={selectedWasteTypes} onChange={setSelectedWasteTypes} onClose={()=>setShowWastePanel(false)}/>}

      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>{pageTitle}</h1>
          <p style={S.pageSubtitle}>{pageSubtitle}</p>
        </div>
        <div style={S.headerRight}>
          <RoleBadge role={role}/>
          <button style={S.addBtn} onClick={handleHeaderAction}>
            {role==='recycler'
              ?<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>Add My Centre</>
              :<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>List Waste</>
            }
          </button>
        </div>
      </div>

      <div className="wlm-mobile-toggle" style={S.mobileToggleBar}>
        {['list','map'].map(v=>(
          <button key={v} style={{...S.mobileToggleBtn,...(mobileView===v?S.mobileToggleBtnActive:{})}} onClick={()=>setMobileView(v)}>
            {v==='list'
              ?<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>List</>
              :<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5}}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>Map</>
            }
          </button>
        ))}
      </div>

      <div style={S.body}>
        <div className={`wlm-sidebar${mobileView==='map'?' wlm-sidebar-hidden':''}`} style={S.sidebar}>
          <div style={S.sidebarMeta}>
            <span style={S.countText}>{sorted.length} {countLabel}</span>
            <button style={S.locBtn} onClick={handleUseMyLocation}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>
              Use My Location
            </button>
          </div>

          <div style={{position:'relative',margin:'0 14px 10px'}}>
            <svg style={S.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input style={S.searchInput} placeholder="Search by name or city..." value={searchQuery} onChange={e=>handleSearchInput(e.target.value)} onFocus={()=>searchSugs.length&&setShowSearchSugs(true)} onBlur={()=>setTimeout(()=>setShowSearchSugs(false),150)}/>
            {searchQuery&&<button style={S.clearBtn} onClick={()=>{setSearchQuery('');setShowSearchSugs(false);}}>✕</button>}
            {showSearchSugs&&(
              <div style={S.autocomplete}>
                {searchSugs.map((s,i)=>(
                  <div key={i} style={S.autocompleteItem} onMouseDown={()=>applySearchSug(s)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {role!=='recycler'&&(
            <div style={{padding:'0 14px 10px'}}>
              <button style={{...S.wasteFilterBtn,...(selectedWasteTypes.length>0?S.wasteFilterBtnActive:{})}} onClick={()=>setShowWastePanel(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                {selectedWasteTypes.length===0
                  ?'Filter by what I have to recycle'
                  :`${selectedWasteTypes.slice(0,2).join(', ')}${selectedWasteTypes.length>2?` +${selectedWasteTypes.length-2} more`:''}`
                }
                {selectedWasteTypes.length>0&&(
                  <span style={S.clearFilterX} onClick={e=>{e.stopPropagation();setSelectedWasteTypes([]);}}>✕</span>
                )}
              </button>
            </div>
          )}

          {role!=='recycler'&&(
            <div style={S.legend}>
              <span style={S.legendItem}><span style={{...S.legendDot,background:PIN_COLORS.recycling_centre}}/>Recycling Centre</span>
              <span style={S.legendItem}><span style={{...S.legendDot,background:PIN_COLORS.collection_point}}/>Collection Point</span>
            </div>
          )}

          {tripStops.length>0&&(
            <button style={S.tripBannerBtn} onClick={()=>setShowTripPanel(true)}>
              <span>🗺️ Trip: {tripStops.length} stop{tripStops.length>1?'s':''}</span>
              <span style={{fontSize:11,opacity:.8}}>tap to view →</span>
            </button>
          )}

          <div style={S.list}>
            {loading?(
              <div style={S.empty}>
                <div style={{display:'flex',gap:5}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:'#c3e6d4',animation:`wlm-dot 1.2s ease-in-out ${i*0.2}s infinite both`}}/>)}</div>
                <p style={{margin:0,color:'#aaa',fontSize:13}}>Loading locations…</p>
              </div>
            ):sorted.length===0?(
              <div style={S.empty}>
                <span style={{fontSize:32}}>🗺️</span>
                <p style={{margin:0,color:'#aaa',fontSize:13}}>
                  {selectedWasteTypes.length>0?'No centres accept your selected waste types.':'No locations found.'}
                </p>
                {selectedWasteTypes.length>0&&<button style={{...S.locBtn,marginTop:8}} onClick={()=>setSelectedWasteTypes([])}>Clear filter</button>}
              </div>
            ):sorted.map(loc=>(
              <LocationCard key={loc.id} loc={loc} userPos={userPos}
                selected={selected?.id===loc.id}
                inTrip={!!tripStops.find(s=>s.id===loc.id)}
                selectedWasteTypes={selectedWasteTypes}
                role={role}
                onClick={()=>handleSidebarClick(loc)}
                onDirections={()=>handleGetDirections(loc)}
                onAddToTrip={()=>addToTrip(loc)}
                onRemoveFromTrip={()=>removeFromTrip(loc.id)}
              />
            ))}
          </div>
        </div>

        <div className={`wlm-map-wrap${mobileView==='list'?' wlm-map-hidden':''}`} style={S.mapWrap}>
          <div ref={mapRef} style={S.mapEl}/>
          {!mapReady&&<div style={S.mapLoader}><div style={S.spinnerRing}/><span style={{color:'#1a4731',fontWeight:600,fontSize:13}}>Loading map…</span></div>}
          {routeLoading&&(
            <div style={S.routeLoadingBadge}>
              <div style={{width:14,height:14,border:'2px solid #c3e6d4',borderTop:'2px solid #1a4731',borderRadius:'50%',animation:'wlm-spin .7s linear infinite',flexShrink:0}}/>
              Calculating route…
            </div>
          )}
          {(routeData&&!routeLoading)||(tripRoute)?(
            <button style={S.clearRouteBtn} onClick={()=>{clearRoute();clearTrip();}}>✕ Clear Route</button>
          ):null}
          {showRoutePanel&&routeData&&<RoutePanel route={routeData} destination={routeData.destinationName} onClose={()=>setShowRoutePanel(false)}/>}
          {showTripPanel&&<TripPanel stops={tripStops} tripRoute={tripRoute} optimising={tripOptimising} onOptimise={handleOptimiseTrip} onRemoveStop={removeFromTrip} onClear={clearTrip} onClose={()=>setShowTripPanel(false)}/>}
          {selected&&!showRoutePanel&&!showTripPanel&&(
            <div className="wlm-detail-card" style={S.detailCard}>
              <button style={S.detailClose} onClick={()=>setSelected(null)}>✕</button>
              <div style={S.detailBadges}>
                <span style={{...S.detailBadge,background:PIN_COLORS[selected.location_type]||'#1a4731',color:'#fff'}}>{PIN_LABELS[selected.location_type]}</span>
                {selected.is_verified&&<span style={S.verifiedBadge}>✓ Verified</span>}
                {selected._matchScore>0&&<span style={S.matchBadge}>{selected._matchScore}/{selected._matchTotal} types matched</span>}
              </div>
              <p style={S.detailName}>{selected.name}</p>
              {selected.address&&<p style={S.detailSub}>📍 {selected.address}{selected.city?`, ${selected.city}`:''}</p>}
              {selected.operating_hours&&<p style={S.detailSub}>🕐 {formatHours(selected.operating_hours)}</p>}
              {selected.phone&&<p style={S.detailSub}>📞 {selected.phone}</p>}
              {selected.users?.rating&&<p style={S.detailRating}><span style={{color:'#f59e0b'}}>★</span> {selected.users.rating.toFixed(1)}<span style={{color:'#aaa'}}> ({selected.users.rating_count} reviews)</span></p>}
              {selected.accepted_types?.length>0&&(
                <div style={S.detailTags}>
                  {selected.accepted_types.map(t=>{
                    const c=TYPE_COLORS[t]||{bg:'#f0f0f0',color:'#555'};
                    const isMatch=selectedWasteTypes.map(x=>x.toLowerCase()).includes(t.toLowerCase());
                    return<span key={t} style={{...S.tag,background:isMatch?c.color:c.bg,color:isMatch?'white':c.color}}>{t}</span>;
                  })}
                </div>
              )}
              <div style={S.detailActions}>
                <button style={S.dirBtn} onClick={()=>handleGetDirections(selected)} disabled={routeLoading}>
                  {routeLoading?'Loading…':'🗺️ Directions'}
                </button>
                {role!=='recycler'&&(
                  tripStops.find(s=>s.id===selected.id)
                    ?<button style={S.tripRemoveBtn} onClick={()=>removeFromTrip(selected.id)}>✕ Remove</button>
                    :<button style={S.addTripBtn} onClick={()=>addToTrip(selected)} disabled={tripStops.length>=MAX_TRIP_STOPS}>
                      {tripStops.length>=MAX_TRIP_STOPS?'Trip full':'+ Trip'}
                    </button>
                )}
                <a style={S.mapsBtn} href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer">Maps ↗</a>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .wlm-tooltip{background:rgba(20,20,20,0.92)!important;color:white!important;border:none!important;border-radius:8px!important;padding:6px 11px!important;font-size:12px!important;box-shadow:0 2px 10px rgba(0,0,0,0.25)!important;white-space:nowrap!important;}
        .wlm-tooltip::before{display:none!important;}
        .leaflet-control-zoom{border:none!important;box-shadow:0 2px 10px rgba(0,0,0,0.15)!important;}
        .leaflet-control-zoom a{background:white!important;color:#333!important;border:none!important;border-radius:8px!important;width:32px!important;height:32px!important;line-height:32px!important;font-size:17px!important;margin-bottom:3px!important;}
        .leaflet-control-zoom a:hover{background:#e8f4ee!important;color:#1a4731!important;}
        .leaflet-attribution-flag{display:none!important;}
        @keyframes wlm-spin{to{transform:rotate(360deg);}}
        @keyframes wlm-slideup{from{transform:translateY(16px) translateX(-50%);opacity:0;}to{transform:translateY(0) translateX(-50%);opacity:1;}}
        @keyframes wlm-panelup{from{transform:translateY(30px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes wlm-dot{0%,80%,100%{transform:scale(0);opacity:.3;}40%{transform:scale(1);opacity:1;}}
        .wlm-mobile-toggle{display:none!important;}
        @media(max-width:768px){
          .wlm-mobile-toggle{display:flex!important;}
          .wlm-sidebar-hidden{display:none!important;}
          .wlm-map-hidden{display:none!important;}
          .wlm-sidebar{width:100%!important;max-width:100%!important;}
          .wlm-map-wrap{height:100%!important;}
          .wlm-detail-card{bottom:12px!important;left:10px!important;right:10px!important;width:auto!important;transform:none!important;}
        }
      `}</style>
    </div>
  );
}

function LocationCard({loc,userPos,selected,inTrip,selectedWasteTypes,role,onClick,onDirections,onAddToTrip,onRemoveFromTrip}) {
  const dist=userPos?distKm(userPos[0],userPos[1],loc.lat,loc.lng):null;
  const rating=loc.users?.rating??null;
  const isCP=loc.location_type==='collection_point';
  const showMatch=selectedWasteTypes.length>0&&loc._matchScore!==undefined;
  const matchPct=showMatch?loc._matchScore/loc._matchTotal:0;
  const matchColor=matchPct===1?'#1a4731':matchPct>=0.5?'#e07b2a':'#aaa';

  return(
    <div style={{borderBottom:'1px solid #f5f5f5'}}>
      <button onClick={onClick} style={{...S.card,...(selected?S.cardActive:{})}}>
        <div style={S.cardRow}>
          <div style={{...S.avatarCircle,background:isCP?'#fff3e0':'#e8f4ee'}}>
            {isCP
              ?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e07b2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12H19M12 5l7 7-7 7"/></svg>
              :<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <p style={S.cardName}>{loc.name}</p>
              {inTrip&&<span style={{color:'#f59e0b',fontSize:10,flexShrink:0}}>●</span>}
            </div>
            <p style={S.cardSub}>{loc.address||loc.city||''}{loc.operating_hours?` · ${formatHours(loc.operating_hours)}`:''}</p>
            {rating!==null&&(
              <div style={{display:'flex',alignItems:'center',marginTop:3}}>
                <span style={{color:'#f59e0b',fontSize:12}}>★</span>
                <span style={{color:'#555',fontSize:12,marginLeft:2}}>{rating.toFixed(1)}{loc.users?.rating_count?` · ${loc.users.rating_count} reviews`:''}</span>
              </div>
            )}
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
            {dist!==null&&<span style={S.distBadge}>{dist.toFixed(1)} km</span>}
            {showMatch&&<span style={{...S.matchBadge,color:matchColor,borderColor:matchColor+'33',background:matchColor+'11'}}>{loc._matchScore}/{loc._matchTotal}</span>}
          </div>
        </div>
        {loc.accepted_types?.length>0&&(
          <div style={S.tagRow}>
            {loc.accepted_types.slice(0,4).map(t=>{
              const c=TYPE_COLORS[t]||{bg:'#f0f0f0',color:'#555'};
              const isMatch=selectedWasteTypes.map(x=>x.toLowerCase()).includes(t.toLowerCase());
              return<span key={t} style={{...S.tag,background:isMatch?c.color:c.bg,color:isMatch?'white':c.color}}>{t}</span>;
            })}
            {loc.accepted_types.length>4&&<span style={{...S.tag,background:'#f0f0f0',color:'#888'}}>+{loc.accepted_types.length-4}</span>}
          </div>
        )}
      </button>
      {selected&&(
        <div style={{padding:'0 6px 10px 50px',display:'flex',gap:6,flexWrap:'wrap'}}>
          <button style={S.cardDirBtn} onClick={e=>{e.stopPropagation();onDirections();}}>🗺️ Directions</button>
          {role!=='recycler'&&(inTrip
            ?<button style={S.cardRemoveTripBtn} onClick={e=>{e.stopPropagation();onRemoveFromTrip();}}>✕ Remove from Trip</button>
            :<button style={S.cardAddTripBtn} onClick={e=>{e.stopPropagation();onAddToTrip();}}>+ Add to Trip</button>
          )}
          <a style={S.cardMapsBtn} href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>Google Maps ↗</a>
        </div>
      )}
    </div>
  );
}

const S={
  root:{display:'flex',flexDirection:'column',height:'100%',minHeight:0,background:'#f7f8f3',fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"},
  header:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',background:'white',borderBottom:'1px solid #eee',flexWrap:'wrap',gap:10,flexShrink:0},
  headerRight:{display:'flex',alignItems:'center',gap:10},
  pageTitle:{margin:0,fontSize:18,fontWeight:700,color:'#1a1a1a',lineHeight:1.2},
  pageSubtitle:{margin:'2px 0 0',fontSize:12,color:'#888'},
  addBtn:{display:'flex',alignItems:'center',gap:7,background:'#1a4731',color:'white',border:'none',borderRadius:10,padding:'9px 16px',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'},
  mobileToggleBar:{background:'white',borderBottom:'1px solid #eee',padding:'8px 16px',flexShrink:0,display:'none'},
  mobileToggleBtn:{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'8px',border:'1.5px solid #e0e0e0',borderRadius:8,background:'#fafafa',fontSize:13,fontWeight:500,color:'#555',cursor:'pointer',margin:'0 4px',transition:'all .15s'},
  mobileToggleBtnActive:{background:'#1a4731',borderColor:'#1a4731',color:'white'},
  body:{display:'flex',flex:1,minHeight:0,overflow:'hidden'},
  sidebar:{width:380,minWidth:280,display:'flex',flexDirection:'column',background:'white',borderRight:'1px solid #eee',overflow:'hidden',flexShrink:0},
  sidebarMeta:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px 8px'},
  countText:{fontSize:14,fontWeight:600,color:'#1a1a1a'},
  locBtn:{display:'flex',alignItems:'center',gap:5,background:'none',border:'1.5px solid #1a4731',color:'#1a4731',borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer'},
  searchIcon:{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'},
  searchInput:{width:'100%',padding:'10px 32px 10px 34px',border:'1.5px solid #e8e8e8',borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box',background:'#fafafa',color:'#1a1a1a'},
  clearBtn:{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:12,padding:4},
  autocomplete:{position:'absolute',top:'100%',left:0,right:0,background:'white',border:'1px solid #eee',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.10)',zIndex:9999,maxHeight:260,overflowY:'auto',marginTop:3},
  autocompleteItem:{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',fontSize:13,cursor:'pointer',borderBottom:'1px solid #f5f5f5',color:'#333'},
  wasteFilterBtn:{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#f7f8f3',border:'1.5px solid #e0e0e0',borderRadius:10,fontSize:13,color:'#555',cursor:'pointer',textAlign:'left',fontWeight:500,transition:'all .15s'},
  wasteFilterBtnActive:{background:'#e8f4ee',borderColor:'#1a4731',color:'#1a4731',fontWeight:600},
  clearFilterX:{marginLeft:'auto',fontSize:12,color:'#888',background:'none',border:'none',cursor:'pointer',padding:'0 2px'},
  legend:{display:'flex',gap:16,padding:'0 14px 10px',flexWrap:'wrap'},
  legendItem:{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#666',fontWeight:500},
  legendDot:{width:9,height:9,borderRadius:'50%',flexShrink:0},
  tripBannerBtn:{margin:'0 14px 8px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',background:'#fff8e1',border:'1.5px solid #f59e0b',borderRadius:10,fontSize:13,fontWeight:600,color:'#92400e',cursor:'pointer'},
  list:{flex:1,overflowY:'auto',padding:'4px 10px 16px'},
  empty:{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 16px',gap:10},
  card:{width:'100%',textAlign:'left',background:'none',border:'none',padding:'13px 6px 8px',cursor:'pointer',transition:'background .12s',display:'block'},
  cardActive:{background:'#f0faf5'},
  cardRow:{display:'flex',alignItems:'flex-start',gap:10},
  avatarCircle:{width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  cardName:{margin:0,fontSize:14,fontWeight:600,color:'#1a1a1a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  cardSub:{margin:'2px 0 0',fontSize:12,color:'#999',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  distBadge:{background:'#f0faf5',color:'#1a4731',padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:'nowrap'},
  matchBadge:{padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:700,border:'1.5px solid',whiteSpace:'nowrap'},
  tagRow:{display:'flex',flexWrap:'wrap',gap:4,marginTop:8,paddingLeft:44},
  tag:{padding:'3px 9px',borderRadius:12,fontSize:11,fontWeight:600,transition:'all .15s'},
  cardDirBtn:{padding:'6px 12px',background:'#1a4731',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'},
  cardAddTripBtn:{padding:'6px 12px',background:'#fff8e1',color:'#92400e',border:'1.5px solid #f59e0b',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'},
  cardRemoveTripBtn:{padding:'6px 12px',background:'#fce8e8',color:'#c0392b',border:'1.5px solid #e88',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'},
  cardMapsBtn:{padding:'6px 12px',background:'#f0faf5',color:'#1a4731',border:'1.5px solid #c3e6d4',borderRadius:8,fontSize:12,fontWeight:600,textDecoration:'none',display:'inline-flex',alignItems:'center'},
  mapWrap:{flex:1,position:'relative',minHeight:0},
  mapEl:{width:'100%',height:'100%',minHeight:400},
  mapLoader:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#f0faf5',gap:12},
  spinnerRing:{width:32,height:32,border:'3px solid #c3e6d4',borderTop:'3px solid #1a4731',borderRadius:'50%',animation:'wlm-spin .8s linear infinite'},
  detailCard:{position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',background:'white',borderRadius:16,padding:'18px 20px 16px',width:'min(420px, calc(100% - 48px))',boxShadow:'0 8px 32px rgba(0,0,0,0.18)',zIndex:600,animation:'wlm-slideup .25s cubic-bezier(.34,1.2,.64,1)'},
  detailClose:{position:'absolute',top:12,right:14,background:'#f5f5f5',border:'none',width:26,height:26,borderRadius:'50%',cursor:'pointer',fontSize:12,color:'#666',display:'flex',alignItems:'center',justifyContent:'center'},
  detailBadges:{display:'flex',flexWrap:'wrap',gap:5,marginBottom:8},
  detailBadge:{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600},
  verifiedBadge:{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:'#e8f4ee',color:'#1a4731'},
  detailName:{margin:'0 28px 4px 0',fontSize:16,fontWeight:700,color:'#1a1a1a'},
  detailSub:{margin:'0 0 3px',fontSize:12.5,color:'#888'},
  detailRating:{margin:'4px 0 8px',fontSize:13},
  detailTags:{display:'flex',flexWrap:'wrap',gap:5,marginBottom:14},
  detailActions:{display:'flex',gap:8,flexWrap:'wrap'},
  dirBtn:{flex:2,padding:'11px',background:'#1a4731',color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',minWidth:0},
  addTripBtn:{flex:1,padding:'11px',background:'#fff8e1',color:'#92400e',border:'1.5px solid #f59e0b',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'},
  tripRemoveBtn:{flex:1,padding:'11px',background:'#fce8e8',color:'#c0392b',border:'1.5px solid #e88',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'},
  mapsBtn:{flex:1,padding:'11px',background:'#f0faf5',color:'#1a4731',border:'1.5px solid #c3e6d4',borderRadius:10,fontSize:13,fontWeight:600,textAlign:'center',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',minWidth:0},
  routeLoadingBadge:{position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',background:'white',borderRadius:20,padding:'8px 16px',boxShadow:'0 4px 16px rgba(0,0,0,0.12)',fontSize:13,fontWeight:500,color:'#1a4731',display:'flex',alignItems:'center',gap:8,zIndex:700},
  clearRouteBtn:{position:'absolute',top:12,right:12,background:'white',border:'1.5px solid #e0e0e0',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,color:'#555',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',zIndex:700},
  routePanel:{position:'absolute',bottom:0,left:0,right:0,background:'white',borderRadius:'16px 16px 0 0',maxHeight:'55%',boxShadow:'0 -4px 24px rgba(0,0,0,0.12)',zIndex:650,display:'flex',flexDirection:'column',animation:'wlm-panelup .25s ease'},
  routePanelHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px 12px',borderBottom:'1px solid #f0f0f0',flexShrink:0},
  routeStat:{display:'flex',alignItems:'center',gap:5,fontSize:13,fontWeight:600,color:'#1a4731'},
  routeCloseBtn:{background:'#f5f5f5',border:'none',width:28,height:28,borderRadius:'50%',cursor:'pointer',fontSize:13,color:'#666',display:'flex',alignItems:'center',justifyContent:'center'},
  routeSteps:{overflowY:'auto',padding:'8px 0 16px'},
  routeStep:{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 18px'},
  routeStepIcon:{width:26,height:26,borderRadius:'50%',background:'#f0faf5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0},
};