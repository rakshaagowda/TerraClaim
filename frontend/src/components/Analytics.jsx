import { useEffect, useState } from 'react'
import axios from 'axios'
import { Info, BarChart3, PieChart, TrendingUp, Compass, Award, HelpCircle } from 'lucide-react'

const API = 'http://localhost:8000'

const STATUS_COLOR = {
  'Title Granted':       '#22c55e',
  'DLC Approved':        '#a855f7',
  'SDLC Approved':       '#3b82f6',
  'Under Verification':  '#f59e0b',
  'Claim Filed':         '#64748b',
  'Gram Sabha Resolved': '#06b6d4',
  'Rejected':            '#ef4444',
}

function BarChart({ data, labelKey, valueKey, color = '#166534' }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  const [hoveredItem, setHoveredItem] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(d => {
        const val = d[valueKey]
        const pct = (val / max) * 100
        const isHovered = hoveredItem === d[labelKey]
        return (
          <div 
            key={d[labelKey]} 
            style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}
            onMouseEnter={() => setHoveredItem(d[labelKey])}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div style={{ width: 110, fontSize: 11, color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d[labelKey]}
            </div>
            
            <div style={{ flex: 1, height: 18, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
              <div 
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: isHovered ? 'var(--accent)' : color,
                  borderRadius: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 8,
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)'
                }}
              >
                {pct > 12 && <span style={{ fontSize: 9.5, fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>{val}</span>}
              </div>
            </div>

            {/* Hover Tooltip */}
            {isHovered && (
              <div 
                className="glass"
                style={{
                  position: 'absolute',
                  left: 120,
                  top: -24,
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: 10
                }}
              >
                Count: {val} ({((val / max) * 100).toFixed(0)}% of Max)
              </div>
            )}

          </div>
        )
      })}
    </div>
  )
}

function DonutChart({ data }) {
  const total = data.reduce((a, d) => a + d.count, 0)
  let start = -Math.PI / 2
  const cx = 60, cy = 60, R = 50, r = 32
  
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '10px 0' }}>
      <svg width={120} height={120} viewBox="0 0 120 120" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
        {slices.map(s => (
          <path 
            key={s.status} 
            d={s.path} 
            fill={STATUS_COLOR[s.status] || '#aaa'} 
            style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
            onMouseLeave={e => e.currentTarget.style.opacity = 1.0}
            title={`${s.status}: ${s.count}`}
          />
        ))}
        <circle cx={cx} cy={cy} r={r} fill="var(--card)" />
        {/* Centered Total Text */}
        <g style={{ transform: 'rotate(90deg)', transformOrigin: '60px 60px' }}>
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize={15} fontWeight={900} fill="var(--text-primary)" fontFamily="monospace">{total}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="var(--text-secondary)" fontWeight={700} letterSpacing="0.05em">TOTAL</text>
        </g>
      </svg>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.slice(0, 6).map(s => {
          const pct = total ? ((s.count / total) * 100).toFixed(0) : 0
          return (
            <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-primary)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[s.status] || '#aaa', flexShrink: 0 }} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                {s.status.replace(' Approved', '').replace(' Resolved', '')}
              </span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                {s.count} <span style={{ fontSize: 9.5, color: 'var(--text-secondary)', fontWeight: 500 }}>({pct}%)</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Pipeline({ stats }) {
  const stages = [
    { label: 'Filed', key: 'Claim Filed' },
    { label: 'Gram Sabha', key: 'Gram Sabha Resolved' },
    { label: 'SDLC Approved', key: 'SDLC Approved' },
    { label: 'DLC Approved', key: 'DLC Approved' },
    { label: 'Title Issued', key: 'Title Granted' },
  ]
  
  const byStatus = {}
  stats.by_status?.forEach(s => { byStatus[s.status] = s.count })
  const total = stats.total || 1

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {stages.map((st, i) => {
        const count = byStatus[st.key] || 0
        const isLast = i === stages.length - 1
        const pct = ((count / total) * 100).toFixed(0)
        
        return (
          <div key={st.key} style={{ flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div 
              style={{
                flex: 1,
                background: isLast ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' : 'var(--card)',
                border: `1.5px solid ${isLast ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: '10px 8px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
                color: isLast ? 'white' : 'var(--text-primary)'
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 800, color: isLast ? '#bbf7d0' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {st.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', margin: '4px 0', color: isLast ? 'white' : 'var(--text-primary)' }}>
                {count}
              </div>
              <div style={{ fontSize: 9.5, color: isLast ? '#bbf7d0' : 'var(--text-secondary)', fontWeight: 700 }}>
                {pct}% conversion
              </div>
            </div>
            
            {!isLast && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 800, padding: '0 2px' }}>
                →
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/fra/stats`).then(r => setStats(r.data))
  }, [])

  if (!stats) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--primary)', fontSize: 13, fontWeight: 700 }}>
      Loading analytics data...
    </div>
  )

  const tribeData = stats.by_tribe?.map(t => ({ label: t.tribal_community, count: t.count })) || []
  const distData  = stats.by_district?.map(d => ({ label: d.district, count: d.count, acres: d.acres })) || []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px', overflowY: 'auto' }} className="fade-in">
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            Geospatial Ledger Analytics
          </h2>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
            Statistical KPI Aggregations and Funnel Pipelines
          </p>
        </div>
        
        <div style={{ background: 'rgba(22, 101, 52, 0.05)', border: '1px solid rgba(22, 101, 52, 0.1)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 500 }}>
          <Info size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <strong>Operational Metrics</strong>: Monitor title conversion rates, district distributions, and tribal community coverage. Data is synced in real-time.
          </span>
        </div>
      </div>

      {/* Main Analytics Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* KPI metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { val: stats.total,       lbl: 'Registered Claims',   sub: '6 districts total', icon: <TrendingUp size={16} color="var(--primary)" /> },
            { val: stats.granted,     lbl: 'Titles Granted',   sub: `${((stats.granted / stats.total) * 100).toFixed(0)}% conversion rate`, icon: <Award size={16} color="var(--success)" /> },
            { val: stats.total_acres.toFixed(1), lbl: 'Claimed Acreage',     sub: 'Total geocoded forest land', icon: <Compass size={16} color="var(--accent)" /> },
            { val: `${stats.ifr}/${stats.cr}/${stats.cfr}`, lbl: 'IFR / CR / CFR Forms',  sub: 'Forms A / B / C breakdown', icon: <BarChart3 size={16} color="#7c4dff" /> },
          ].map(k => (
            <div key={k.lbl} className="glass-card" style={{ padding: 18, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{k.lbl}</div>
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: 1 }}>{k.val}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 6 }}>{k.sub}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                {k.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Funnel Pipeline */}
        <div className="glass-card" style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 14 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚖️ Administrative Conversion Funnel
            </h4>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Tracks status updates from Filed to Granted</span>
          </div>
          <Pipeline stats={stats} />
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          
          {/* Claims Count by District */}
          <div className="glass-card" style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={15} color="var(--primary)" /> Claims Registered by District
            </h4>
            <BarChart data={distData} labelKey="label" valueKey="count" color="var(--primary)" />
          </div>

          {/* Status Distribution */}
          <div className="glass-card" style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PieChart size={15} color="var(--accent)" /> Boundary Verification Statuses
            </h4>
            <DonutChart data={stats.by_status || []} />
          </div>

          {/* Tribal Community Coverage */}
          <div className="glass-card" style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={15} color="var(--success)" /> Tribal Community Distributions
            </h4>
            <BarChart data={tribeData} labelKey="label" valueKey="count" color="var(--success)" />
          </div>

          {/* Claimed Area by District */}
          <div className="glass-card" style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={15} color="#7c4dff" /> Total Area Claimed (Acres)
            </h4>
            <BarChart data={distData} labelKey="label" valueKey="acres" color="#7c4dff" />
          </div>

        </div>

      </div>

    </div>
  )
}
