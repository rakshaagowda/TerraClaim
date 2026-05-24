import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const STATUS_COLOR = {
  'Title Granted':       '#22c55e',
  'DLC Approved':        '#8b5cf6',
  'SDLC Approved':       '#3b82f6',
  'Under Verification':  '#f59e0b',
  'Claim Filed':         '#94a3b8',
  'Gram Sabha Resolved': '#06b6d4',
  'Rejected':            '#ef4444',
}

const DIST_COLOR = '#4a8c60'

function BarChart({ data, labelKey, valueKey, color = DIST_COLOR, maxWidth = 200 }) {
  const max = Math.max(...data.map(d => d[valueKey]))
  return (
    <div>
      {data.map(d => (
        <div key={d[labelKey]} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:130, fontSize:11, color:'#555', textAlign:'right', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {d[labelKey]}
          </div>
          <div style={{ flex:1, height:20, background:'#f0f0f0', borderRadius:4, overflow:'hidden' }}>
            <div style={{
              width: `${(d[valueKey] / max) * 100}%`,
              height:'100%',
              background: color,
              borderRadius:4,
              display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:6,
              transition:'width .6s ease'
            }}>
              <span style={{ fontSize:10, fontWeight:700, color:'white' }}>{d[valueKey]}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data }) {
  const total = data.reduce((a, d) => a + d.count, 0)
  let start = -Math.PI / 2
  const cx = 80, cy = 80, R = 65, r = 35
  const slices = data.map(d => {
    const angle = (d.count / total) * 2 * Math.PI
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start)
    const x2 = cx + R * Math.cos(start + angle), y2 = cy + R * Math.sin(start + angle)
    const x3 = cx + r * Math.cos(start + angle), y3 = cy + r * Math.sin(start + angle)
    const x4 = cx + r * Math.cos(start), y4 = cy + r * Math.sin(start)
    const large = angle > Math.PI ? 1 : 0
    const path = `M${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} L${x3},${y3} A${r},${r},0,${large},0,${x4},${y4} Z`
    start += angle
    return { ...d, path }
  })
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {slices.map(s => (
          <path key={s.status} d={s.path} fill={STATUS_COLOR[s.status] || '#aaa'} opacity={0.85} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={700} fill="#1a3a2a">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#888">records</text>
      </svg>
      <div style={{ flex:1 }}>
        {slices.map(s => (
          <div key={s.status} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, fontSize:11, color:'#333' }}>
            <div style={{ width:10, height:10, borderRadius:2, background: STATUS_COLOR[s.status] || '#aaa', flexShrink:0 }} />
            <span style={{ flex:1 }}>{s.status}</span>
            <span style={{ fontWeight:700, fontFamily:'monospace' }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pipeline({ stats }) {
  const stages = [
    { label:'Claim Filed',    key:'Claim Filed' },
    { label:'Gram Sabha',     key:'Gram Sabha Resolved' },
    { label:'SDLC',           key:'SDLC Approved' },
    { label:'DLC',            key:'DLC Approved' },
    { label:'Granted',        key:'Title Granted' },
  ]
  const byStatus = {}
  stats.by_status?.forEach(s => { byStatus[s.status] = s.count })
  const total = stats.total || 1
  return (
    <div style={{ display:'flex', alignItems:'stretch', gap:4 }}>
      {stages.map((st, i) => {
        const count = byStatus[st.key] || 0
        const isLast = i === stages.length - 1
        return (
          <div key={st.key} style={{ flex:1, display:'flex', alignItems:'center' }}>
            <div style={{
              flex:1, background: isLast ? '#1a3a2a' : '#f5f0e8',
              border: `2px solid ${isLast ? '#1a3a2a' : '#e5e7eb'}`,
              borderRadius:8, padding:'12px 8px', textAlign:'center'
            }}>
              <div style={{ fontSize:10, fontWeight:700, color: isLast ? '#e8c547' : '#2d5a3d', textTransform:'uppercase', letterSpacing:0.5 }}>{st.label}</div>
              <div style={{ fontSize:24, fontWeight:700, fontFamily:'monospace', color: isLast ? '#e8c547' : '#1a3a2a', lineHeight:1, margin:'4px 0' }}>{count}</div>
              <div style={{ fontSize:10, color: isLast ? '#4a8c60' : '#888' }}>{((count/total)*100).toFixed(0)}%</div>
            </div>
            {!isLast && <div style={{ fontSize:16, color:'#ccc', padding:'0 2px' }}>▶</div>}
          </div>
        )
      })}
    </div>
  )
}

const card = { background:'white', borderRadius:10, padding:18, border:'1px solid #e5e7eb', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }
const cardTitle = { fontSize:13, fontWeight:700, color:'#1a3a2a', marginBottom:14 }

export default function Analytics({ onBack }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/fra/stats`).then(r => setStats(r.data))
  }, [])

  if (!stats) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f0e8', color:'#2d5a3d', fontSize:14 }}>
      Loading analytics...
    </div>
  )

  const tribeData = stats.by_tribe?.map(t => ({ label: t.tribal_community, count: t.count })) || []
  const distData  = stats.by_district?.map(d => ({ label: d.district, count: d.count, acres: d.acres })) || []

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#f5f0e8', padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'#1a3a2a', border:'none', color:'#e8c547', padding:'6px 14px', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:600 }}>
          ← Map
        </button>
        <h2 style={{ fontSize:20, fontWeight:700, color:'#1a3a2a' }}>Analytics Dashboard</h2>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { val: stats.total,       lbl:'Total Records',   sub:'6 districts' },
          { val: stats.granted,     lbl:'Title Granted',   sub:`${((stats.granted/stats.total)*100).toFixed(0)}% success` },
          { val: stats.total_acres, lbl:'Total Acres',     sub:'claimed area' },
          { val: stats.ifr,         lbl:'IFR / CR / CFR',  sub:`${stats.cr} / ${stats.cfr}` },
        ].map(k => (
          <div key={k.lbl} style={{ ...card, textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:700, fontFamily:'monospace', color:'#1a3a2a', lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:11, color:'#888', margin:'4px 0 2px', textTransform:'uppercase', letterSpacing:0.5 }}>{k.lbl}</div>
            <div style={{ fontSize:11, color:'#4a8c60', fontWeight:600 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={cardTitle}>FRA Approval Pipeline</div>
        <Pipeline stats={stats} />
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={card}>
          <div style={cardTitle}>Claims by District</div>
          <BarChart data={distData} labelKey="label" valueKey="count" color="#2d5a3d" />
        </div>
        <div style={card}>
          <div style={cardTitle}>Status Distribution</div>
          <DonutChart data={stats.by_status || []} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={card}>
          <div style={cardTitle}>Tribal Community Coverage</div>
          <BarChart data={tribeData} labelKey="label" valueKey="count" color="#4a8c60" />
        </div>
        <div style={card}>
          <div style={cardTitle}>Claimed Area by District (acres)</div>
          <BarChart data={distData} labelKey="label" valueKey="acres" color="#8b5cf6" />
        </div>
      </div>
    </div>
  )
}