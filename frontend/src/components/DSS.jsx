import { useEffect, useState } from 'react'
import axios from 'axios'

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
const STATUSES  = ['','Title Granted','DLC Approved','SDLC Approved','Under Verification','Claim Filed','Gram Sabha Resolved','Rejected']

function Chip({ val }) {
  const styles = {
    Yes:   { background:'#dcfce7', color:'#166534', border:'1px solid #bbf7d0' },
    No:    { background:'#f1f5f9', color:'#94a3b8', border:'1px solid #e2e8f0' },
    Check: { background:'#fef9c3', color:'#92400e', border:'1px solid #fde68a' },
  }
  const labels = { Yes:'✓', No:'—', Check:'~' }
  return (
    <span style={{
      ...styles[val],
      fontSize:10, fontWeight:700, padding:'2px 7px',
      borderRadius:10, display:'inline-block'
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

export default function DSS({ onBack }) {
  const [records,  setRecords]  = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [district, setDistrict] = useState('')
  const [status,   setStatus]   = useState('')
  const [search,   setSearch]   = useState('')
  const [schemeFilter, setSchemeFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (district) params.append('district', district)
    if (status)   params.append('status', status)
    setLoading(true)
    axios.get(`${API}/api/fra/dss?${params}`).then(r => {
      setRecords(r.data.records)
      setLoading(false)
    })
  }, [district, status])

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

  const sel = { background:'white', border:'1px solid #e5e7eb', borderRadius:4, padding:'6px 10px', fontSize:12, color:'#333', fontFamily:'inherit', outline:'none' }

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#f5f0e8', padding:24 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'#1a3a2a', border:'none', color:'#e8c547', padding:'6px 14px', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:600 }}>
          ← Map
        </button>
        <h2 style={{ fontSize:20, fontWeight:700, color:'#1a3a2a' }}>Decision Support System</h2>
        <span style={{ fontSize:12, color:'#888' }}>CSS Scheme Eligibility Matrix</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button
            onClick={() => exportCSV(filtered)}
            style={{ background:'#1a3a2a', border:'none', color:'#e8c547', padding:'6px 14px', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:600 }}
          >
            ⬇ Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Scheme summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10, marginBottom:20 }}>
        {summary.map(s => (
          <div
            key={s.key}
            onClick={() => setSchemeFilter(schemeFilter === s.key ? '' : s.key)}
            style={{
              background: schemeFilter === s.key ? '#1a3a2a' : 'white',
              border: `2px solid ${schemeFilter === s.key ? '#e8c547' : '#e5e7eb'}`,
              borderRadius:10, padding:'12px 8px', textAlign:'center',
              cursor:'pointer', transition:'all .2s'
            }}
          >
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontSize:18, fontWeight:700, fontFamily:'monospace', color: schemeFilter === s.key ? '#e8c547' : '#1a3a2a', lineHeight:1, margin:'4px 0' }}>{s.count}</div>
            <div style={{ fontSize:9, color: schemeFilter === s.key ? '#4a8c60' : '#888', textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background:'white', borderRadius:10, padding:'14px 16px', border:'1px solid #e5e7eb', marginBottom:16, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#1a3a2a', textTransform:'uppercase', letterSpacing:0.5 }}>🔍 Filter</span>
        <select style={sel} value={district} onChange={e => setDistrict(e.target.value)}>
          {DISTRICTS.map(d => <option key={d} value={d}>{d || 'All Districts'}</option>)}
        </select>
        <select style={sel} value={status} onChange={e => setStatus(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <input
          style={{ ...sel, flex:1, minWidth:200 }}
          placeholder="Search patta ID, village, claimant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {(district || status || search || schemeFilter) && (
          <button onClick={() => { setDistrict(''); setStatus(''); setSearch(''); setSchemeFilter('') }}
            style={{ background:'#fee2e2', border:'1px solid #fecaca', color:'#991b1b', padding:'6px 12px', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:600 }}>
            ✕ Clear
          </button>
        )}
        <span style={{ fontSize:11, color:'#888', marginLeft:'auto' }}>
          {loading ? 'Loading...' : `${filtered.length} of ${records.length} records`}
        </span>
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:10, border:'1px solid #e5e7eb', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#1a3a2a' }}>
                {['Patta ID','Village','District','Form','Tribe','Acres','Status',
                  ...SCHEMES.map(s => SCHEME_ICONS[s]+' '+SCHEME_LABELS[s]),
                  '# Eligible'
                ].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:'#f5f0e8', whiteSpace:'nowrap', borderRight:'1px solid #2d5a3d' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={15} style={{ padding:24, textAlign:'center', color:'#888' }}>Loading records...</td></tr>
              ) : filtered.slice(0, 100).map((r, i) => (
                <tr key={r.patta_id} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb', borderBottom:'1px solid #f0f0f0' }}>
                  <td style={{ padding:'8px 12px', fontFamily:'monospace', fontSize:10, color:'#1a3a2a', whiteSpace:'nowrap' }}>{r.patta_id}</td>
                  <td style={{ padding:'8px 12px', fontWeight:500 }}>{r.village}</td>
                  <td style={{ padding:'8px 12px', color:'#555' }}>{r.district}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{
                      fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3,
                      background: r.form_type.includes('A') ? '#dbeafe' : r.form_type.includes('B') ? '#ede9fe' : '#dcfce7',
                      color:      r.form_type.includes('A') ? '#1e40af' : r.form_type.includes('B') ? '#5b21b6' : '#166534',
                    }}>
                      {r.form_type.includes('A') ? 'IFR' : r.form_type.includes('B') ? 'CR' : 'CFR'}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px', color:'#555', fontSize:11 }}>{r.tribal_community}</td>
                  <td style={{ padding:'8px 12px', fontFamily:'monospace' }}>{r.claim_area_acres}</td>
                  <td style={{ padding:'8px 12px', whiteSpace:'nowrap' }}>
                    <span style={{ fontSize:10, fontWeight:700, color: r.status === 'Title Granted' ? '#166534' : r.status === 'Rejected' ? '#991b1b' : '#92400e' }}>
                      {r.status}
                    </span>
                  </td>
                  {SCHEMES.map(s => (
                    <td key={s} style={{ padding:'8px 12px', textAlign:'center' }}>
                      <Chip val={r[s]} />
                    </td>
                  ))}
                  <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:700, fontFamily:'monospace', color:'#1a3a2a' }}>
                    {r.eligible_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div style={{ padding:'12px 16px', background:'#f9fafb', borderTop:'1px solid #e5e7eb', fontSize:12, color:'#888', textAlign:'center' }}>
            Showing first 100 of {filtered.length} records. Use filters or export CSV for full data.
          </div>
        )}
      </div>
    </div>
  )
}