import { useEffect, useState } from 'react'
import axios from 'axios'
import { FileSpreadsheet, Filter, CheckCircle, Scale, Info } from 'lucide-react'

const API = 'http://localhost:8000'

const SCHEMES = ['PM_KISAN','MGNREGA','JJM','PMAY_G','PMFBY','DAJGUA','NSTFDC']
const SCHEME_LABELS = {
  PM_KISAN: 'PM-KISAN',
  MGNREGA:  'MGNREGA',
  JJM:      'Jal Jeevan',
  PMAY_G:   'PMAY-G',
  PMFBY:    'PMFBY',
  DAJGUA:   'DAJGUA',
  NSTFDC:   'NSTFDC',
}
const SCHEME_ICONS = {
  PM_KISAN:'🌾', MGNREGA:'🔨', JJM:'💧', PMAY_G:'🏠', PMFBY:'🌿', DAJGUA:'🌲', NSTFDC:'💰'
}

const DISTRICTS = ['','Mysuru','Chamarajanagara','Shivamogga','Chikkamagaluru','Kodagu','Hassan']
const STATUSES  = ['','Title Granted','DLC Approved','SDLC Approved','Escalated to state','Under Verification','Claim Filed','Gram Sabha Resolved','Rejected']

function Chip({ val }) {
  const styles = {
    Yes:   { background:'#e8f5e9', color:'#2e7d32', border:'1px solid #c8e6c9' },
    No:    { background:'#f1f5f9', color:'#94a3b8', border:'1px solid #e2e8f0' },
    Check: { background:'#fffdeb', color:'#d84315', border:'1px solid #ffe082' },
  }
  const labels = { Yes:'✓ Yes', No:'—', Check:'Check' }
  return (
    <span style={{
      ...styles[val],
      fontSize:9, fontWeight:800, padding:'2px 6px',
      borderRadius:6, display:'inline-block'
    }}>
      {labels[val] || val}
    </span>
  )
}

function exportCSV(records) {
  const headers = ['Patta ID','Form','District','Village','Claimant','Tribe','Acres','Status',...SCHEMES.map(s=>SCHEME_LABELS[s]),'Eligible Count']
  const rows = records.map(r => [
    r.patta_id, r.form_type, r.district, r.village,
    r.claimant_name, r.tribal_community, r.claim_area_acres, r.status,
    ...SCHEMES.map(s => r[s]),
    r.eligible_count
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type:'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = 'fra_dss_eligibility.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function DSS({ onBack, jurisdiction }) {
  const [records,  setRecords]  = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [district, setDistrict] = useState('')
  const [status,   setStatus]   = useState('')
  const [search,   setSearch]   = useState('')
  const [schemeFilter, setSchemeFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    const activeDistrict = jurisdiction || district
    if (activeDistrict) params.append('district', activeDistrict)
    if (status)   params.append('status', status)
    setLoading(true)
    axios.get(`${API}/api/fra/dss?${params}`).then(r => {
      setRecords(r.data.records)
      setLoading(false)
    })
  }, [district, status, jurisdiction])

  useEffect(() => {
    let out = [...records]
    if (search) {
      const q = search.toLowerCase()
      out = out.filter(r =>
        r.patta_id.toLowerCase().includes(q) ||
        r.village.toLowerCase().includes(q) ||
        r.claimant_name.toLowerCase().includes(q)
      )
    }
    if (schemeFilter) {
      out = out.filter(r => r[schemeFilter] === 'Yes')
    }
    setFiltered(out)
  }, [records, search, schemeFilter])

  const summary = SCHEMES.map(s => ({
    key: s,
    label: SCHEME_LABELS[s],
    icon: SCHEME_ICONS[s],
    count: records.filter(r => r[s] === 'Yes').length
  }))

  const sel = {
    background: 'white',
    border: '1px solid #c8dcd0',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    color: '#2d4030',
    fontFamily: 'inherit',
    outline: 'none'
  }

  return (
    <div style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f4f9f4',
      padding: '20px 24px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>

      {/* Header Banner & Explanation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#132a13', margin: 0 }}>Decision Support System (DSS)</h2>
            <p style={{ fontSize: 11, color: '#4a7c59', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
              Central Sector Scheme (CSS) Integration Matrix & Welfare Router
            </p>
          </div>
          <div style={{
            background: '#e8f2e8',
            border: '1px solid #cbdcce',
            borderRadius: 6,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            maxWidth: 600
          }}>
            <Info size={16} color="#2e7d32" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#2d4030', lineHeight: 1.35 }}>
              <strong>Statutory Linkage Guide</strong>: Under FRA Section 3(1), land title-deeds trigger auto-eligibility for rural welfare. Individual Forest Rights (IFR) qualify for landholder schemes, while Community Forest Rights (CFR) qualify for development infrastructure.
            </span>
          </div>
        </div>
        
        {/* Welfare Rules Legend */}
        <div style={{
          background: 'white',
          border: '1px solid #c8dcd0',
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 10.5,
          color: '#475569',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          lineHeight: 1.4
        }}>
          <div>
            <strong style={{ color: '#2e7d32' }}>🌾 PM-KISAN</strong>: IFR title holders qualify for ₹6,000/year direct cash support as verified land-holding cultivators.
          </div>
          <div>
            <strong style={{ color: '#0ea5e9' }}>🔨 MGNREGA</strong>: FRA title holders are legally entitled to **150 days** (vs 100) of rural manual labor employment.
          </div>
          <div>
            <strong style={{ color: '#7c4dff' }}>🏠 PMAY-G</strong>: Super-priority routing for ₹1.3 Lakh housing assistance to replacement families holding granted titles.
          </div>
          <div>
            <strong style={{ color: '#d97706' }}>💰 NSTFDC (PVTG)</strong>: Subsidized business and micro-loans (under 4% interest) for Soliga, Koraga, and Jenu Kuruba communities.
          </div>
        </div>
      </div>

      {/* Scheme summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10, marginBottom: 12 }}>
        {summary.map(s => {
          const isActive = schemeFilter === s.key;
          return (
            <div
              key={s.key}
              onClick={() => setSchemeFilter(isActive ? '' : s.key)}
              style={{
                background: isActive ? '#355e3b' : 'white',
                border: `1.5px solid ${isActive ? '#2e7d32' : '#c8dcd0'}`,
                color: isActive ? '#ffffff' : '#2d4030',
                borderRadius: 8,
                padding: '10px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.borderColor = '#2e7d32';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.borderColor = '#c8dcd0';
              }}
            >
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: isActive ? '#e8f5e9' : '#2e7d32', margin: '2px 0' }}>{s.count}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: isActive ? '#c8e6c9' : '#556a59', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        padding: '12px 16px',
        border: '1px solid #c8dcd0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        marginBottom: 12,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#2d5a27', textTransform: 'uppercase' }}>
          <Filter size={12}/> Filter Matrix
        </div>
        <select 
          disabled={!!jurisdiction}
          style={sel} 
          value={jurisdiction || district} 
          onChange={e => setDistrict(e.target.value)}
        >
          {jurisdiction ? (
            <option value={jurisdiction}>{jurisdiction} (Locked)</option>
          ) : (
            DISTRICTS.map(d => <option key={d} value={d}>{d || 'All Districts'}</option>)
          )}
        </select>
        <select style={sel} value={status} onChange={e => setStatus(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <input
          style={{ ...sel, flex: 1, minWidth: 160 }}
          placeholder="Search patta ID, village, claimant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {(district || status || search || schemeFilter) && (
          <button onClick={() => { setDistrict(''); setStatus(''); setSearch(''); setSchemeFilter('') }}
            style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
            ✕ Clear
          </button>
        )}
        
        <button
          onClick={() => exportCSV(filtered)}
          style={{
            background: '#355e3b',
            border: 'none',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <FileSpreadsheet size={13}/>
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Grid Table Container (Fits page height) */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        border: '1px solid #c8dcd0',
        boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#355e3b', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                {['Patta ID','Village','District','Form','Tribe','Acres','Status',
                  ...SCHEMES.map(s => SCHEME_ICONS[s]+' '+SCHEME_LABELS[s]),
                  '# Schemes'
                ].map(h => (
                  <th key={h} style={{ padding:'12px 10px', textAlign:'left', fontSize:9, fontWeight:800, letterSpacing:0.5, textTransform:'uppercase', borderRight:'1px solid #4a7c59', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={15} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={15} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No records found.</td></tr>
              ) : filtered.slice(0, 100).map((r, i) => (
                <tr key={r.patta_id} style={{ background: i % 2 === 0 ? 'white' : '#fcfdfc', borderBottom:'1px solid #edf5ed' }}>
                  <td style={{ padding:'8px 10px', fontFamily:'monospace', fontSize:10, color:'#355e3b', fontWeight:700, whiteSpace:'nowrap' }}>{r.patta_id}</td>
                  <td style={{ padding:'8px 10px', fontWeight:700 }}>{r.village}</td>
                  <td style={{ padding:'8px 10px', color:'#4a5568' }}>{r.district}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{
                      fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:3,
                      background: r.form_type.includes('A') ? '#dbeafe' : r.form_type.includes('B') ? '#ede9fe' : '#dcfce7',
                      color:      r.form_type.includes('A') ? '#1e40af' : r.form_type.includes('B') ? '#5b21b6' : '#166534',
                    }}>
                      {r.form_type.includes('A') ? 'IFR' : r.form_type.includes('B') ? 'CR' : 'CFR'}
                    </span>
                  </td>
                  <td style={{ padding:'8px 10px', color:'#4a5568', fontSize:11 }}>{r.tribal_community}</td>
                  <td style={{ padding:'8px 10px', fontFamily:'monospace', fontWeight:700 }}>{parseFloat(r.claim_area_acres || 0).toFixed(2)}</td>
                  <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}>
                    <span style={{ fontSize:10, fontWeight:800, color: r.status === 'Title Granted' ? '#2e7d32' : r.status === 'Rejected' ? '#c62828' : '#ef6c00' }}>
                      {r.status === 'Title Granted' ? 'Granted' : r.status.split(' ')[0]}
                    </span>
                  </td>
                  {SCHEMES.map(s => (
                    <td key={s} style={{ padding:'8px 10px', textAlign:'center', borderLeft: '1px solid #edf5ed' }}>
                      <Chip val={r[s]} />
                    </td>
                  ))}
                  <td style={{ padding:'8px 10px', textAlign:'center', fontWeight:800, fontFamily:'monospace', color:'#2e7d32', borderLeft: '1px solid #edf5ed' }}>
                    {r.eligible_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div style={{ padding:'8px 16px', background:'#edf5ed', borderTop:'1px solid #cbdcce', fontSize:11, color:'#4a7c59', textAlign:'center', fontWeight:700 }}>
            Showing first 100 of {filtered.length} claims. Filter or export CSV to review full database records.
          </div>
        )}
      </div>
    </div>
  )
}
