import { useState } from 'react'
import { Filter, Layers, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import SearchBar from './SearchBar.jsx'

const STATUS_COLOR = {
  'Title Granted':       '#2e7d32', // Pastel green
  'DLC Approved':        '#7c4dff',
  'SDLC Approved':       '#1976d2',
  'Under Verification':  '#ef6c00',
  'Claim Filed':         '#78909c',
  'Gram Sabha Resolved': '#0097a7',
  'Rejected':            '#c62828',
}

const DISTRICTS = ['Mysuru','Chamarajanagara','Shivamogga','Chikkamagaluru','Kodagu','Hassan']
const TRIBES    = ['Soliga','Jenu Kuruba','Nayaka','Betta Kuruba','Paniyan','Koraga','Malekudiya','Hasala','Hakki-Pikki','Iruliga','Yerava','Adi Kurumba']
const STATUSES  = Object.keys(STATUS_COLOR)
const FORMS     = ['Form A (IFR)','Form B (CR)','Form C (CFR)']

const s = {
  sidebar:    { width: 330, minWidth: 330, background: '#edf5ed', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderRight: '1px solid #c8dcd0' },
  header:     { padding: '12px 16px 10px', borderBottom: '1px solid #c8dcd0', background: '#e2ede2' },
  h1:         { fontSize: 13, fontWeight: 800, color: '#2d5a27', letterSpacing: 0.5 },
  sub:        { fontSize: 10, color: '#4a7c59', letterSpacing: 0.5, fontWeight: 700 },
  statRow:    { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, padding: '10px 14px', borderBottom: '1px solid #c8dcd0', background: '#edf5ed' },
  statBox:    { background: '#ffffff', borderRadius: 6, padding: '6px 4px', textAlign: 'center', border: '1px solid #cbdcce', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  statVal:    { fontSize: 18, fontWeight: 800, color: '#2e7d32', fontFamily: 'monospace', lineHeight: 1 },
  statLbl:    { fontSize: 9, color: '#4a7c59', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 },
  scroll:     { flex: 1, overflowY: 'auto', overflowX: 'hidden' },
  section:    { padding: '12px 14px', borderBottom: '1px solid #c8dcd0' },
  secLabel:   { fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: '#2d5a27', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 },
  select:     { width: '100%', background: '#ffffff', border: '1px solid #c8dcd0', borderRadius: 6, color: '#2d4030', fontSize: 12, padding: '7px 10px', marginBottom: 6, outline: 'none', cursor: 'pointer' },
  filterRow:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  legendGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: '#ffffff', borderRadius: 4, fontSize: 10, color: '#2d4030', border: '1px solid #cbdcce', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' },
  dot:        { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  satBtn:     { width: '100%', padding: '8px', background: '#ffffff', border: '1px solid #4a7c59', borderRadius: 6, color: '#4a7c59', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, transition: 'all 0.2s' },
  recList:    { padding: '10px 14px' },
  recItem:    { background: '#ffffff', border: '1px solid #cbdcce', borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.15s ease' },
  recId:      { fontFamily: 'monospace', fontSize: 10, color: '#4a7c59', fontWeight: 700 },
  recName:    { fontSize: 12, color: '#132a13', fontWeight: 700, margin: '2px 0 2px' },
  recMeta:    { fontSize: 10, color: '#556a59' },
  badge:      { fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
}

export default function Sidebar({ stats, filters, setFilters, geojson, onSelectRecord, satellite, onToggleSatellite, onShowAnalytics, onShowDSS, onFlyTo, userMode, jurisdiction }) {
  const total    = geojson?.count ?? 0
  const records  = geojson?.features ?? []
  const granted  = records.filter(f => f.properties.status === 'Title Granted').length

  function setF(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  return (
    <div style={s.sidebar}>
      
      {/* Title & Help Banner */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🗺️</span>
          <div>
            <div style={s.h1}>Interactive WebGIS Map</div>
            <div style={s.sub}>Visualizing 300 claims spatial bounds</div>
          </div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #cbdcce', borderRadius: 6, padding: '8px 10px', marginTop: 8, fontSize: 10, color: '#2d4030', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 800, color: '#2d5a27', marginBottom: 2 }}>⚡ Official WebGIS Tooltips:</div>
          • <strong>Point to Polygon</strong>: Zoom in (Zoom &gt; 10) to load exact computed land boundary polygons.<br/>
          • <strong>Conflict Warning</strong>: Red dashed zones represent critical reserve forest overlaps.<br/>
          • Click any plot to run the 10-point statutory legal checklist.
        </div>
      </div>

      {/* KPI stats */}
      <div style={s.statRow}>
        <div style={s.statBox}><div style={s.statVal}>{stats?.total ?? '—'}</div><div style={s.statLbl}>Registered</div></div>
        <div style={s.statBox}><div style={s.statVal}>{granted}</div><div style={s.statLbl}>Titles</div></div>
        <div style={s.statBox}><div style={s.statVal}>{total}</div><div style={s.statLbl}>Matching</div></div>
      </div>

      {/* Scrollable Filters and List */}
      <div style={s.scroll}>
        
        {/* Search */}
        <SearchBar onFlyTo={onFlyTo} />
        
        {/* Filters */}
        <div style={s.section}>
          <div style={s.secLabel}><Filter size={12}/> Filter Claims</div>
          
          {/* District Selector (Locked if official jurisdiction is set) */}
          <select 
            disabled={userMode === 'official' && !!jurisdiction} 
            style={s.select} 
            value={(userMode === 'official' && jurisdiction) ? jurisdiction : (filters?.district || '')} 
            onChange={e => setF('district', e.target.value)}
          >
            {userMode === 'official' && jurisdiction ? (
              <option value={jurisdiction}>{jurisdiction} (Locked)</option>
            ) : (
              <>
                <option value="">All Districts</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </>
            )}
          </select>

          <div style={s.filterRow}>
            <select style={s.select} value={filters?.form_type || ''} onChange={e => setF('form_type', e.target.value)}>
              <option value="">All Forms</option>
              {FORMS.map(f => (
                <option key={f} value={f}>
                  {f.includes('A') ? 'IFR' : f.includes('B') ? 'CR' : 'CFR'}
                </option>
              ))}
            </select>

            <select style={s.select} value={filters?.status || ''} onChange={e => setF('status', e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(st => (
                <option key={st} value={st}>
                  {st.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>

          <select style={s.select} value={filters?.tribe || ''} onChange={e => setF('tribe', e.target.value)}>
            <option value="">All Tribes</option>
            {TRIBES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {(filters?.district || filters?.form_type || filters?.status || filters?.tribe) && (
            <button
              onClick={() => {
                const defaultDistrict = (userMode === 'official' && jurisdiction) ? jurisdiction : '';
                setFilters({ district: defaultDistrict, form_type: '', status: '', tribe: '' });
              }}
              style={{
                width: '100%',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '6px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 700,
                marginTop: 2
              }}
            >
              ✕ Reset Filters
            </button>
          )}
        </div>
        


        {/* Legend */}
        <div style={s.section}>
          <div style={s.secLabel}><Layers size={12}/> Color Legend</div>
          <div style={s.legendGrid}>
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} style={s.legendItem}>
                <div style={{ ...s.dot, background: color }}/>
                <span style={{ fontSize: 10, fontWeight: 600 }}>
                  {status === 'Title Granted' ? '✓ Granted' : status.replace(' Approved', '').replace(' Resolved', '')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Sat Toggle */}
        <div style={s.section}>
          <button style={s.satBtn} onClick={onToggleSatellite}>
            {satellite ? '🗺️ Switch to Street Map' : '🛰️ Switch to Satellite View'}
          </button>
        </div>

        {/* Claims Records List (Capped size with inner scroll) */}
        <div style={s.recList}>
          <div style={{ ...s.secLabel, marginBottom: 8 }}><FileSpreadsheet size={12}/> Matching List ({Math.min(records.length, 30)} of {records.length})</div>
          {records.slice(0, 30).map(f => {
            const p = f.properties
            const formCode = p.form_type.includes('A') ? 'IFR' : p.form_type.includes('B') ? 'CR' : 'CFR'
            const color = STATUS_COLOR[p.status] || '#aaa'
            return (
              <div
                key={p.patta_id}
                style={s.recItem}
                onClick={() => onSelectRecord(p)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#4a7c59';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#cbdcce';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={s.recId}>{p.patta_id}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color }}>{p.status === 'Title Granted' ? 'Approved' : p.status.split(' ')[0]}</span>
                </div>
                <div style={s.recName}>{p.village} — {p.claimant_name?.split(' ')[0]}</div>
                <div style={s.recMeta}>{p.district} · {p.tribal_community} · {p.claim_area_acres} ac</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <span style={{ ...s.badge, background: p.form_type.includes('A') ? '#dbeafe' : p.form_type.includes('B') ? '#ede9fe' : '#dcfce7', color: p.form_type.includes('A') ? '#1e40af' : p.form_type.includes('B') ? '#5b21b6' : '#166534' }}>{formCode}</span>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
