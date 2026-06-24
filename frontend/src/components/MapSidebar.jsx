import { useState } from 'react'
import { Filter, Layers, FileText, CheckCircle2, FileSpreadsheet, Map } from 'lucide-react'
import SearchBar from './SearchBar.jsx'

const STATUS_COLOR = {
  'Title Granted':       '#22c55e', // Emerald Success
  'DLC Approved':        '#a855f7', // Purple
  'SDLC Approved':       '#3b82f6', // Blue
  'Under Verification':  '#f59e0b', // Amber Warning
  'Claim Filed':         '#64748b', // Slate
  'Gram Sabha Resolved': '#06b6d4', // Teal Accent
  'Rejected':            '#ef4444', // Danger Red
}

const DISTRICTS = ['Mysuru','Chamarajanagara','Shivamogga','Chikkamagaluru','Kodagu','Hassan']
const TRIBES    = ['Soliga','Jenu Kuruba','Nayaka','Betta Kuruba','Paniyan','Koraga','Malekudiya','Hasala','Hakki-Pikki','Iruliga','Yerava','Adi Kurumba']
const STATUSES  = Object.keys(STATUS_COLOR)
const FORMS     = ['Form A (IFR)','Form B (CR)','Form C (CFR)']

export default function MapSidebar({ stats, filters, setFilters, geojson, onSelectRecord, satellite, onToggleSatellite, onShowAnalytics, onShowDSS, onFlyTo, userMode, jurisdiction }) {
  const total    = geojson?.count ?? 0
  const records  = geojson?.features ?? []
  const granted  = records.filter(f => f.properties.status === 'Title Granted').length
  const [isOpen, setIsOpen] = useState(true);

  function setF(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="glass"
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 99,
          width: 44,
          height: 44,
          borderRadius: 12,
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <Map size={20} />
      </button>
    )
  }

  return (
    <div 
      className="glass slide-in-left"
      style={{ 
        width: 320, 
        background: 'var(--glass-bg)', 
        backdropFilter: 'blur(16px)',
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        borderRight: '1px solid var(--border)',
        zIndex: 99,
        position: 'relative'
      }}
    >
      {/* Title block */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(22, 101, 52, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <Map size={18} color="#166534" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>WebGIS Map Panel</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>Ledger Bounds Visualizer</div>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
        >
          ✕
        </button>
      </div>

      {/* KPI mini row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 20px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '8px 4px', textAlign: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>{stats?.total ?? '—'}</div>
          <div style={{ fontSize: 8, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Total</div>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '8px 4px', textAlign: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace' }}>{granted}</div>
          <div style={{ fontSize: 8, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Titles</div>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 10, padding: '8px 4px', textAlign: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>{total}</div>
          <div style={{ fontSize: 8, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Filtered</div>
        </div>
      </div>

      {/* Scrollable Filters and List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Search */}
        <div style={{ padding: '12px 20px 6px' }}>
          <SearchBar onFlyTo={onFlyTo} />
        </div>
        
        {/* Filters */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={11}/> Filter Boundaries
          </div>
          
          {/* District Selector (Locked if official jurisdiction is set) */}
          <select 
            disabled={userMode === 'official' && !!jurisdiction} 
            style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, padding: '8px 10px', marginBottom: 8, outline: 'none', cursor: 'pointer' }}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <select style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, padding: '8px 10px', outline: 'none', cursor: 'pointer' }} value={filters?.form_type || ''} onChange={e => setF('form_type', e.target.value)}>
              <option value="">All Forms</option>
              {FORMS.map(f => (
                <option key={f} value={f}>
                  {f.includes('A') ? 'IFR' : f.includes('B') ? 'CR' : 'CFR'}
                </option>
              ))}
            </select>

            <select style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, padding: '8px 10px', outline: 'none', cursor: 'pointer' }} value={filters?.status || ''} onChange={e => setF('status', e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(st => (
                <option key={st} value={st}>
                  {st.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>

          <select style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, padding: '8px 10px', marginBottom: 8, outline: 'none', cursor: 'pointer' }} value={filters?.tribe || ''} onChange={e => setF('tribe', e.target.value)}>
            <option value="">All Communities</option>
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
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--danger)',
                padding: '7px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 10.5,
                fontWeight: 700,
                marginTop: 2,
                transition: 'all 0.2s'
              }}
            >
              ✕ Reset Active Filters
            </button>
          )}
        </div>

        {/* Legend */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={11}/> Color Legend
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--card)', borderRadius: 6, fontSize: 10, color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}/>
                <span style={{ fontSize: 9.5, fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {status === 'Title Granted' ? '✓ Granted' : status.replace(' Approved', '').replace(' Resolved', '')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Satellite Toggle */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={onToggleSatellite}
            style={{ 
              width: '100%', 
              padding: '10px', 
              background: satellite ? 'rgba(16, 185, 129, 0.1)' : 'var(--card)', 
              border: `1.5px solid ${satellite ? 'var(--accent)' : 'var(--border)'}`, 
              borderRadius: 8, 
              color: satellite ? 'var(--accent)' : 'var(--text-secondary)', 
              fontSize: 11, 
              fontWeight: 700, 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            {satellite ? '🛰️ Satellite Active (Esri)' : '🗺️ Vector Terrain Active'}
          </button>
        </div>

        {/* Records list */}
        <div style={{ padding: '16px 20px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={11}/> Matching Records ({Math.min(records.length, 30)} of {records.length})
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {records.slice(0, 30).map(f => {
              const p = f.properties
              const formCode = p.form_type.includes('A') ? 'IFR' : p.form_type.includes('B') ? 'CR' : 'CFR'
              const color = STATUS_COLOR[p.status] || '#aaa'
              return (
                <div
                  key={p.patta_id}
                  onClick={() => onSelectRecord(p)}
                  className="glass-card"
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: 12, 
                    border: '1px solid var(--border)',
                    cursor: 'pointer', 
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>{p.patta_id}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                      {p.status === 'Title Granted' ? 'Granted' : p.status.split(' ')[0]}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>
                    {p.village} — {p.claimant_name?.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {p.district} · {p.tribal_community} · {p.claim_area_acres} ac
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span 
                      style={{ 
                        fontSize: 8.5, 
                        fontWeight: 800, 
                        padding: '2px 6px', 
                        borderRadius: 4,
                        background: p.form_type.includes('A') ? 'rgba(59, 130, 246, 0.1)' : p.form_type.includes('B') ? 'rgba(139, 92, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: p.form_type.includes('A') ? '#3b82f6' : p.form_type.includes('B') ? '#8b5cf6' : '#22c55e',
                        border: `1px solid ${p.form_type.includes('A') ? 'rgba(59, 130, 246, 0.2)' : p.form_type.includes('B') ? 'rgba(139, 92, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                      }}
                    >
                      {formCode}
                    </span>
                    {p.has_conflict && (
                      <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        ⚠️ Overlap Conflict
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
