import { useEffect, useState } from 'react'
import axios from 'axios'
import { Info, HelpCircle } from 'lucide-react'

const API = 'http://localhost:8000'

const STATUS_COLOR = {
  'Title Granted':       '#2e7d32',
  'DLC Approved':        '#7c4dff',
  'SDLC Approved':       '#1976d2',
  'Under Verification':  '#ef6c00',
  'Claim Filed':         '#78909c',
  'Gram Sabha Resolved': '#0097a7',
  'Rejected':            '#c62828',
}

function BarChart({ data, labelKey, valueKey, color = '#4a7c59' }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map(d => (
        <div key={d[labelKey]} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 100, fontSize: 10, color: '#2d4030', fontWeight: 700, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d[labelKey]}
          </div>
          <div style={{ flex: 1, height: 16, background: '#e8f2e8', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${(d[valueKey] / max) * 100}%`,
              height: '100%',
              background: color,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 6,
              transition: 'width 0.4s ease'
            }}>
              {d[valueKey] > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: 'white' }}>{d[valueKey]}</span>}
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
  const cx = 60, cy = 60, R = 50, r = 28
  const slices = data.map(d => {
    const angle = (d.count / (total || 1)) * 2 * Math.PI
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width={120} height={120} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        {slices.map(s => (
          <path key={s.status} d={s.path} fill={STATUS_COLOR[s.status] || '#aaa'} />
        ))}
        <circle cx={cx} cy={cy} r={r} fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={16} fontWeight={800} fill="#1a301a">{total}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize={8} fill="#718096" fontWeight={700}>total</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {slices.slice(0, 5).map(s => (
          <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#2d4030' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLOR[s.status] || '#aaa', flexShrink: 0 }} />
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.status.replace(' Approved', '')}</span>
            <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pipeline({ stats }) {
  const stages = [
    { label: 'Filed', key: 'Claim Filed' },
    { label: 'Gram Sabha', key: 'Gram Sabha Resolved' },
    { label: 'SDLC', key: 'SDLC Approved' },
    { label: 'DLC', key: 'DLC Approved' },
    { label: 'Granted', key: 'Title Granted' },
  ]
  const byStatus = {}
  stats.by_status?.forEach(s => { byStatus[s.status] = s.count })
  const total = stats.total || 1
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {stages.map((st, i) => {
        const count = byStatus[st.key] || 0
        const isLast = i === stages.length - 1
        return (
          <div key={st.key} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{
              flex: 1,
              background: isLast ? '#355e3b' : '#ffffff',
              border: `1.5px solid ${isLast ? '#355e3b' : '#c8dcd0'}`,
              borderRadius: 6,
              padding: '6px 4px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: isLast ? '#e8f5e9' : '#355e3b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{st.label}</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace', color: isLast ? '#ffffff' : '#2d4030', margin: '2px 0' }}>{count}</div>
              <div style={{ fontSize: 8, color: isLast ? '#c8e6c9' : '#718096', fontWeight: 700 }}>{((count / total) * 100).toFixed(0)}%</div>
            </div>
            {!isLast && <span style={{ fontSize: 10, color: '#c8dcd0', padding: '0 1px' }}>▶</span>}
          </div>
        )
      })}
    </div>
  )
}

const card = { background: 'white', borderRadius: 8, padding: 14, border: '1px solid #c8dcd0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }
const cardTitle = { fontSize: 11, fontWeight: 800, color: '#1a301a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }

export default function Analytics() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/fra/stats`).then(r => setStats(r.data))
  }, [])

  if (!stats) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f9f4', color: '#355e3b', fontSize: 14, fontWeight: 700 }}>
      Loading analytics data...
    </div>
  )

  const tribeData = stats.by_tribe?.map(t => ({ label: t.tribal_community, count: t.count })) || []
  const distData  = stats.by_district?.map(d => ({ label: d.district, count: d.count, acres: d.acres })) || []

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
      
      {/* Title & Banner Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a301a', margin: 0 }}>Analytics Dashboard</h2>
          <p style={{ fontSize: 11, color: '#4a7c59', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
            Statistical KPI Aggregations and Funnel Pipelines
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
          maxWidth: 480
        }}>
          <Info size={16} color="#2e7d32" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#2d4030', lineHeight: 1.3 }}>
            <strong>Dashboard Guide</strong>: Monitor title conversion rates, district distributions, and tribal coverage percentages. Visual metrics are synced live with backend claims.
          </span>
        </div>
      </div>

      {/* Main Scroll Container (fits layout) */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
        
        {/* KPI metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { val: stats.total,       lbl: 'Registered Claims',   sub: '6 districts total' },
            { val: stats.granted,     lbl: 'Titles Approved',   sub: `${((stats.granted / stats.total) * 100).toFixed(0)}% conversion rate` },
            { val: stats.total_acres, lbl: 'Acreage Covered',     sub: 'Total claimed forest land' },
            { val: stats.ifr,         lbl: 'IFR / CR / CFR',  sub: `${stats.cr} CR / ${stats.cfr} CFR` },
          ].map(k => (
            <div key={k.lbl} style={{ ...card, textAlign: 'center', padding: '12px 10px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#2e7d32', lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontSize: 9, color: '#355e3b', fontWeight: 800, margin: '4px 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.lbl}</div>
              <div style={{ fontSize: 9, color: '#556a59', fontWeight: 700 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Funnel Pipeline */}
        <div style={card}>
          <div style={cardTitle}>
            <span>⚖️ Administrative Approval Funnel</span>
            <span style={{ fontSize: 9, textTransform: 'none', color: '#718096', fontWeight: 600 }}>Tracks claims through Gram Sabha, SDLC, DLC, and final title generation</span>
          </div>
          <Pipeline stats={stats} />
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          
          <div style={card}>
            <div style={cardTitle}>
              <span>📈 Claims Count by District</span>
              <HelpCircle size={12} style={{ color: '#718096' }} title="Number of claims registered in each administrative district" />
            </div>
            <BarChart data={distData} labelKey="label" valueKey="count" color="#4a7c59" />
          </div>

          <div style={card}>
            <div style={cardTitle}>
              <span>🍩 Status Distribution</span>
              <HelpCircle size={12} style={{ color: '#718096' }} title="Percentages of claims at each validation stage" />
            </div>
            <DonutChart data={stats.by_status || []} />
          </div>

          <div style={card}>
            <div style={cardTitle}>
              <span>🌳 Tribal Community Coverage</span>
              <HelpCircle size={12} style={{ color: '#718096' }} title="Claims distribution across different Scheduled Tribes" />
            </div>
            <BarChart data={tribeData} labelKey="label" valueKey="count" color="#2e7d32" />
          </div>

          <div style={card}>
            <div style={cardTitle}>
              <span>🗺️ Claimed Area by District (acres)</span>
              <HelpCircle size={12} style={{ color: '#718096' }} title="Total forest land acres claimed in each district" />
            </div>
            <BarChart data={distData} labelKey="label" valueKey="acres" color="#1976d2" />
          </div>

        </div>

      </div>
    </div>
  )
}
