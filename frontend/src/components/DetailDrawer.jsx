import React from 'react'
import { Calendar, User, MapPin, Layers, Scale, FileText, CheckCircle2, ShieldAlert, X, ChevronRight, HelpCircle } from 'lucide-react'

const STATUS_COLOR = {
  'Title Granted':       '#22c55e',
  'DLC Approved':        '#a855f7',
  'SDLC Approved':       '#3b82f6',
  'Under Verification':  '#f59e0b',
  'Claim Filed':         '#64748b',
  'Gram Sabha Resolved': '#06b6d4',
  'Rejected':            '#ef4444',
}

const SCHEMES = [
  { name: 'PM-KISAN', icon: '🌾', check: r => r.form_type?.includes('A') && r.status === 'Title Granted', why: 'IFR patta holder — ₹6,000/yr farm income support' },
  { name: 'MGNREGA Special', icon: '🔨', check: () => true, why: 'FRA members — 150 days guaranteed wage employment' },
  { name: 'Jal Jeevan', icon: '💧', check: r => r.form_type?.includes('B') || r.form_type?.includes('C'), why: 'CR/CFR villages — Prioritized piped drinking water' },
  { name: 'PMAY-G Housing', icon: '🏠', check: r => r.form_type?.includes('A') && r.status === 'Title Granted', why: 'IFR title holder — Pucca house build assistance' },
  { name: 'VDVK Cooperative', icon: '🌲', check: r => r.form_type?.includes('C'), why: 'CFR communities — Minor forest produce processing' },
]

export default function DetailDrawer({ record: r, onClose, onPrintDeed, onReviewClaim, userMode }) {
  if (!r) return null
  
  const eligible = SCHEMES.filter(sc => sc.check(r))
  const color = STATUS_COLOR[r.status] || '#aaa'
  const acres = parseFloat(r.claim_area_acres || 0)
  const ha = parseFloat(r.claim_area_ha || (acres * 0.404686))

  // Timeline checkpoints
  const stages = [
    { label: 'Gram Sabha', date: r.gram_sabha_date, active: !!r.gram_sabha_date || ['Gram Sabha Resolved', 'SDLC Approved', 'DLC Approved', 'Title Granted'].includes(r.status) },
    { label: 'SDLC Review', date: r.sdlc_date, active: !!r.sdlc_date || ['SDLC Approved', 'DLC Approved', 'Title Granted'].includes(r.status) },
    { label: 'DLC Approval', date: r.dlc_date, active: !!r.dlc_date || ['DLC Approved', 'Title Granted'].includes(r.status) },
    { label: 'Title Issued', date: r.title_date, active: r.status === 'Title Granted' }
  ]

  return (
    <div 
      className="glass slide-in-right"
      style={{ 
        position: 'absolute', 
        top: 0, 
        right: 0, 
        width: 360, 
        background: 'var(--glass-bg)', 
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--border)',
        height: '100%', 
        overflowY: 'auto', 
        zIndex: 100,
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          padding: '16px 20px', 
          background: 'rgba(22,101,52,0.03)', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: 700 }}>{r.patta_id}</span>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Claim Bounds Inspector</h3>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'var(--card)', border: '1px solid var(--border)', width: 28, height: 28, borderRadius: '50%', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body Scroll */}
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Profile Card */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: r.form_type?.includes('A') ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)', color: r.form_type?.includes('A') ? '#3b82f6' : '#8b5cf6', border: `1px solid ${r.form_type?.includes('A') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)'}` }}>
              {r.form_type}
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, color }}>● {r.status}</span>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Claimant Name</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{r.claimant_name || 'Community Representative'}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', fontWeight: 650 }}>Tribe Category</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 1 }}>{r.tribal_community || 'OTFD'}</div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', fontWeight: 650 }}>Claimed Area</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 1 }}>{acres.toFixed(1)} Ac ({ha.toFixed(2)} Ha)</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={12} color="var(--primary)" /> {r.village}, {r.taluk}, {r.district}</div>
            {r.title_date && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={12} /> Registered Title: {r.title_date}</div>}
          </div>
        </div>

        {/* Timeline Stepper Component */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Scale size={12} /> Statutory Timeline
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '2px solid var(--border)', paddingLeft: 16, marginLeft: 8 }}>
            {stages.map((st, i) => (
              <div key={st.label} style={{ position: 'relative' }}>
                {/* Dot */}
                <div 
                  style={{
                    position: 'absolute',
                    left: -22,
                    top: 2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: st.active ? 'var(--success)' : 'var(--border)',
                    border: '2px solid var(--card)'
                  }}
                />
                <div style={{ fontSize: 11 }}>
                  <div style={{ fontWeight: 700, color: st.active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', marginTop: 1 }}>
                    {st.active ? (st.date ? `Approved on ${st.date}` : 'Passed Review') : 'Pending Committee Action'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Welfare Schemes Integration */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
            ⚖️ CSS Pre-Qualifications
          </h4>
          {eligible.length === 0 ? (
            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }}>
              Pending "Title Granted" status to trigger scheme eligibility.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eligible.slice(0, 3).map(sc => (
                <div key={sc.name} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: 'rgba(22,101,52,0.03)', borderLeft: '3px solid var(--primary)', borderRadius: '0 6px 6px 0', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14 }}>{sc.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)' }}>{sc.name}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', marginTop: 1, lineHeight: 1.3 }}>{sc.why}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Button */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          {userMode === 'official' ? (
            <button
              onClick={() => onReviewClaim(r)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <ShieldAlert size={13} />
              Evaluate Status
            </button>
          ) : (
            r.status === 'Title Granted' && (
              <button
                onClick={() => onPrintDeed(r)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <FileText size={13} />
                Download Deed
              </button>
            )
          )}
        </div>

      </div>
    </div>
  )
}