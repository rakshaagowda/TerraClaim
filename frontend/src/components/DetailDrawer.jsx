const STATUS_COLOR = {
  'Title Granted':       '#22c55e',
  'DLC Approved':        '#8b5cf6',
  'SDLC Approved':       '#3b82f6',
  'Under Verification':  '#f59e0b',
  'Claim Filed':         '#94a3b8',
  'Gram Sabha Resolved': '#06b6d4',
  'Rejected':            '#ef4444',
}

const SCHEMES = [
  { name:'PM-KISAN',       icon:'🌾', check: p => p.form_type?.includes('A') && p.status === 'Title Granted',    why:'IFR patta holder — ₹6000/yr farm income support' },
  { name:'MGNREGA',        icon:'🔨', check: () => true,                                                         why:'All FRA members — 100 days guaranteed employment' },
  { name:'Jal Jeevan',     icon:'💧', check: p => p.form_type?.includes('C') || p.form_type?.includes('B'),      why:'CR/CFR villages prioritized for tap water' },
  { name:'PMAY-G',         icon:'🏠', check: p => p.form_type?.includes('A') && p.status === 'Title Granted',    why:'IFR title holders eligible for rural housing' },
  { name:'PMFBY',          icon:'🌿', check: p => p.form_type?.includes('A'),                                    why:'Crop insurance for IFR agricultural land' },
  { name:'DAJGUA/VDVK',   icon:'🌲', check: p => p.form_type?.includes('C'),                                    why:'CFR communities — Van Dhan Vikas Kendra' },
]

const s = {
  drawer:   { position:'absolute', bottom:0, right:0, width:360, background:'#f5f0e8', borderRadius:'12px 12px 0 0', boxShadow:'0 -8px 40px rgba(0,0,0,.5)', maxHeight:'75vh', overflowY:'auto', zIndex:100 },
  header:   { padding:'14px 16px 10px', background:'#1a3a2a', borderRadius:'12px 12px 0 0', display:'flex', alignItems:'center', justifyContent:'space-between' },
  title:    { fontSize:12, fontWeight:700, color:'#f5f0e8', fontFamily:'monospace' },
  close:    { background:'none', border:'none', color:'#4a8c60', cursor:'pointer', fontSize:18, lineHeight:1 },
  body:     { padding:'14px 16px' },
  grid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 },
  field:    { },
  flabel:   { fontSize:10, fontWeight:600, color:'#2d5a3d', letterSpacing:0.8, textTransform:'uppercase', marginBottom:2 },
  fvalue:   { fontSize:13, color:'#1a1a1a', fontWeight:500 },
  full:     { gridColumn:'1/-1' },
  sHeader:  { fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#2d5a3d', marginBottom:8, marginTop:4 },
  scheme:   { display:'flex', gap:10, padding:'9px 11px', background:'#edf2ed', borderRadius:6, marginBottom:6, borderLeft:'3px solid #4a8c60' },
  sIcon:    { fontSize:18, flexShrink:0 },
  sName:    { fontSize:12, fontWeight:700, color:'#1a3a2a' },
  sWhy:     { fontSize:11, color:'#555', marginTop:2 },
  eligible: { fontSize:10, fontWeight:700, color:'#166534', marginTop:3 },
  maybe:    { fontSize:10, fontWeight:700, color:'#92400e', marginTop:3 },
}

export default function DetailDrawer({ record: r, onClose }) {
  if (!r) return null
  const eligible = SCHEMES.filter(sc => sc.check(r))
  const color = STATUS_COLOR[r.status] || '#aaa'

  return (
    <div style={s.drawer}>
      <div style={s.header}>
        <div style={s.title}>{r.patta_id}</div>
        <button style={s.close} onClick={onClose}>✕</button>
      </div>
      <div style={s.body}>
        <div style={s.grid}>
          <div style={{ ...s.field, ...s.full }}>
            <div style={s.flabel}>Claimant</div>
            <div style={s.fvalue}>{r.claimant_name}</div>
          </div>
          <div style={s.field}>
            <div style={s.flabel}>Village</div>
            <div style={s.fvalue}>{r.village}</div>
          </div>
          <div style={s.field}>
            <div style={s.flabel}>District</div>
            <div style={s.fvalue}>{r.district}</div>
          </div>
          <div style={s.field}>
            <div style={s.flabel}>Form Type</div>
            <div style={s.fvalue}>{r.form_type}</div>
          </div>
          <div style={s.field}>
            <div style={s.flabel}>Tribe</div>
            <div style={s.fvalue}>{r.tribal_community}</div>
          </div>
          <div style={s.field}>
            <div style={s.flabel}>Area</div>
            <div style={s.fvalue}>{r.claim_area_acres} ac ({r.claim_area_ha} ha)</div>
          </div>
          <div style={s.field}>
            <div style={s.flabel}>Status</div>
            <div style={{ ...s.fvalue, color, fontWeight:700 }}>{r.status}</div>
          </div>
          {r.title_date && (
            <div style={s.field}>
              <div style={s.flabel}>Title Date</div>
              <div style={s.fvalue}>{r.title_date}</div>
            </div>
          )}
        </div>

        <div style={s.sHeader}>⚖️ Eligible CSS Schemes</div>
        {eligible.map(sc => (
          <div key={sc.name} style={s.scheme}>
            <div style={s.sIcon}>{sc.icon}</div>
            <div>
              <div style={s.sName}>{sc.name}</div>
              <div style={s.sWhy}>{sc.why}</div>
              <div style={s.eligible}>✓ Eligible</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}