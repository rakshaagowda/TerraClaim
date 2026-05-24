import { useState } from 'react'
import { Filter, Map, BarChart2, Layers } from 'lucide-react'

const STATUS_COLOR = {
  'Title Granted':       '#22c55e',
  'DLC Approved':        '#8b5cf6',
  'SDLC Approved':       '#3b82f6',
  'Under Verification':  '#f59e0b',
  'Claim Filed':         '#94a3b8',
  'Gram Sabha Resolved': '#06b6d4',
  'Rejected':            '#ef4444',
}

const DISTRICTS = ['Mysuru','Chamarajanagara','Shivamogga','Chikkamagaluru','Kodagu','Hassan']
const TRIBES    = ['Soliga','Jenu Kuruba','Nayaka','Betta Kuruba','Paniyan','Koraga','Malekudiya','Hasala','Hakki-Pikki','Iruliga','Yerava','Adi Kurumba']
const STATUSES  = Object.keys(STATUS_COLOR)
const FORMS     = ['Form A (IFR)','Form B (CR)','Form C (CFR)']

const s = {
  sidebar:    { width:320, minWidth:320, background:'#1a3a2a', display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', borderRight:'2px solid #2d5a3d' },
  header:     { padding:'14px 16px 10px', borderBottom:'1px solid #2d5a3d' },
  logoRow:    { display:'flex', alignItems:'center', gap:10, marginBottom:4 },
  logoIcon:   { width:36, height:36, background:'#e8c547', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
  h1:         { fontSize:15, fontWeight:700, color:'#f5f0e8', fontFamily:'monospace', letterSpacing:0.5 },
  sub:        { fontSize:10, color:'#4a8c60', letterSpacing:1, textTransform:'uppercase' },
  statRow:    { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, padding:'10px 14px', borderBottom:'1px solid #2d5a3d' },
  statBox:    { background:'rgba(255,255,255,.04)', borderRadius:6, padding:'8px 6px', textAlign:'center', border:'1px solid #2d5a3d' },
  statVal:    { fontSize:20, fontWeight:700, color:'#e8c547', fontFamily:'monospace', lineHeight:1 },
  statLbl:    { fontSize:9, color:'#4a8c60', marginTop:2, textTransform:'uppercase', letterSpacing:0.5 },
  scroll:     { flex:1, overflowY:'auto', overflowX:'hidden' },
  section:    { padding:'12px 14px', borderBottom:'1px solid #2d5a3d' },
  secLabel:   { fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'#e8c547', marginBottom:8, display:'flex', alignItems:'center', gap:6 },
 select:     { width:'100%', background:'rgba(255,255,255,.06)', border:'1px solid #2d5a3d', borderRadius:4, color:'#f5f0e8', fontSize:12, padding:'7px 10px', fontFamily:'inherit', marginBottom:6, outline:'none', colorScheme:'dark' },
  filterRow:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 },
  legendGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 },
  legendItem: { display:'flex', alignItems:'center', gap:6, padding:'5px 8px', background:'rgba(255,255,255,.04)', borderRadius:4, fontSize:11, color:'#f5f0e8', border:'1px solid #2d5a3d' },
  dot:        { width:10, height:10, borderRadius:'50%', flexShrink:0 },
  satBtn:     { width:'100%', padding:'8px', background:'rgba(232,197,71,.1)', border:'1px solid #e8c547', borderRadius:4, color:'#e8c547', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:0.5 },
  recList:    { padding:'8px 14px' },
  recItem:    { background:'rgba(255,255,255,.04)', border:'1px solid #2d5a3d', borderRadius:6, padding:'9px 11px', marginBottom:5, cursor:'pointer' },
  recId:      { fontFamily:'monospace', fontSize:10, color:'#e8c547' },
  recName:    { fontSize:12, color:'#f5f0e8', fontWeight:500, margin:'3px 0 2px' },
  recMeta:    { fontSize:10, color:'#4a8c60' },
  badge:      { fontSize:9, fontWeight:600, padding:'2px 5px', borderRadius:3, textTransform:'uppercase', letterSpacing:0.4 },
}
export default function Sidebar({ stats, filters, setFilters, geojson, onSelectRecord, satellite, onToggleSatellite, onShowAnalytics, onShowDSS }) {
  const total    = geojson?.count ?? 0
  const granted  = stats?.granted ?? 0
  const records  = geojson?.features ?? []

  function setF(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  return (
    <div style={s.sidebar}>
      <div style={s.header}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>🌳</div>
          <div>
            <div style={s.h1}>FRA ATLAS</div>
            <div style={s.sub}>Karnataka WebGIS</div>
          </div>
        </div>
      </div>

      <div style={s.statRow}>
        <div style={s.statBox}><div style={s.statVal}>{stats?.total ?? '—'}</div><div style={s.statLbl}>Total</div></div>
        <div style={s.statBox}><div style={s.statVal}>{granted}</div><div style={s.statLbl}>Granted</div></div>
        <div style={s.statBox}><div style={s.statVal}>{total}</div><div style={s.statLbl}>Shown</div></div>
      </div>

      <div style={s.scroll}>
        <div style={s.section}>
          <div style={s.secLabel}><Filter size={12}/> Filters</div>
          <select style={s.select} value={filters.district} onChange={e => setF('district', e.target.value)}>
            <option value="">All Districts</option>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <div style={s.filterRow}>
            <select style={s.select} value={filters.form_type} onChange={e => setF('form_type', e.target.value)}>
              <option value="">All Forms</option>
              {FORMS.map(f => <option key={f}>{f}</option>)}
            </select>
            <select style={s.select} value={filters.status} onChange={e => setF('status', e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <select style={s.select} value={filters.tribe} onChange={e => setF('tribe', e.target.value)}>
            <option value="">All Tribes</option>
            {TRIBES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div style={s.section}>
          <div style={s.secLabel}><Layers size={12}/> Legend</div>
          <div style={s.legendGrid}>
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} style={s.legendItem}>
                <div style={{ ...s.dot, background: color }}/>
                <span style={{ fontSize:10 }}>{status.replace(' Approved','').replace(' Granted','✓')}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={s.section}>
          <button style={s.satBtn} onClick={onToggleSatellite}>
            {satellite ? '🗺 Street Map' : '🛰 Satellite View'}
          </button>
          <button style={{ ...s.satBtn, marginTop:6, background:'rgba(59,130,246,.1)', borderColor:'#3b82f6', color:'#3b82f6' }} onClick={onShowAnalytics}>
            📊 Analytics Dashboard
          </button>
          <button style={{ ...s.satBtn, marginTop:6, background:'rgba(34,197,94,.1)', borderColor:'#22c55e', color:'#166534' }} onClick={onShowDSS}>
            ⚖️ DSS Engine
          </button>
        </div>

        <div style={s.recList}>
          <div style={{ ...s.secLabel, marginBottom:8 }}><BarChart2 size={12}/> Records ({Math.min(records.length, 30)} of {records.length})</div>
          {records.slice(0, 30).map(f => {
            const p = f.properties
            const formCode = p.form_type.includes('A') ? 'IFR' : p.form_type.includes('B') ? 'CR' : 'CFR'
            const color = STATUS_COLOR[p.status] || '#aaa'
            return (
              <div key={p.patta_id} style={s.recItem} onClick={() => onSelectRecord(p)}>
                <div style={s.recId}>{p.patta_id}</div>
                <div style={s.recName}>{p.village} — {p.claimant_name?.split(' ')[0]}</div>
                <div style={s.recMeta}>{p.district} · {p.tribal_community} · {p.claim_area_acres} ac</div>
                <div style={{ display:'flex', gap:4, marginTop:5 }}>
                  <span style={{ ...s.badge, background:`${color}22`, color, border:`1px solid ${color}44` }}>{formCode}</span>
                  <span style={{ ...s.badge, background:`${color}22`, color, border:`1px solid ${color}44` }}>{p.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}