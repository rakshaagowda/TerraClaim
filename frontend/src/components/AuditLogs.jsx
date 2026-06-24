import React, { useState } from 'react'
import { Search, ShieldAlert, CheckCircle, Database, Lock, Eye, ArrowUpRight } from 'lucide-react'

const LOGS = [
  { id: '1', timestamp: '2026-06-24 17:48:12', type: 'Workflow', event: 'Patta MY-A-102 approved by Gram Sabha', officer: 'Kum. Anjali Soliga', division: 'Mysuru Division', block: '#4910a', hash: '8e4f1a...23d9' },
  { id: '2', timestamp: '2026-06-24 16:32:05', type: 'GIS Scan', event: 'Satellite bounds check completed for CO-A-301 (NDVI 0.72)', officer: 'System Engine (Sentinel-2)', division: 'Kodagu Buffer', block: '#4909f', hash: '5b8a91...cf02' },
  { id: '3', timestamp: '2026-06-24 15:10:44', type: 'Ingestion', event: 'Bulk spreadsheet upload: registered 3 claims', officer: 'Sri. Kempaiah KAS', division: 'Hunsur Sub-Division', block: '#4908e', hash: 'fc7a20...bd09' },
  { id: '4', timestamp: '2026-06-24 13:05:11', type: 'Security', event: 'Officer authenticated via secure token validation', officer: 'Smt. Shashi Devi', division: 'Chamarajanagara SDLC', block: '#4907d', hash: 'a1e940...fe71' },
  { id: '5', timestamp: '2026-06-24 11:22:18', type: 'Spatial Buffer', event: 'Sanctuary boundary intersection warnings evaluated', officer: 'Spatial Validator Core', division: 'Karnataka State Level', block: '#4906c', hash: '3e412a...7c81' },
  { id: '6', timestamp: '2026-06-24 09:40:02', type: 'Title Deed', event: 'Cryptographic signature generated for Patta CO-A-201', officer: 'DLC Approver Convenor', division: 'Kodagu Division', block: '#4905b', hash: 'de901f...ff01' },
  { id: '7', timestamp: '2026-06-23 16:15:30', type: 'Welfare Router', event: 'DSS recommendation pushed: PM-KISAN triggered', officer: 'Welfare Decision Router', division: 'Directorate Welfare', block: '#4904a', hash: '7c8e90...bc2e' },
]

export default function AuditLogs() {
  const [search, setSearch] = useState('')
  const [logType, setLogType] = useState('All')

  const filtered = LOGS.filter(l => {
    const matchesSearch = 
      l.event.toLowerCase().includes(search.toLowerCase()) ||
      l.officer.toLowerCase().includes(search.toLowerCase()) ||
      l.hash.toLowerCase().includes(search.toLowerCase())
    
    if (logType === 'All') return matchesSearch
    return matchesSearch && l.type === logType
  })

  const getBadgeColor = (type) => {
    switch (type) {
      case 'Workflow': return { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', border: 'rgba(34, 197, 94, 0.2)' }
      case 'GIS Scan': return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', border: 'rgba(16, 185, 129, 0.2)' }
      case 'Security': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'rgba(239, 68, 68, 0.2)' }
      case 'Title Deed': return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)' }
      default: return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 24px', overflowY: 'auto' }} className="fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            Audit & Spatial Ledger Logs
          </h2>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
            Immutable, block-anchored activity log for compliance verification
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {['All', 'Workflow', 'GIS Scan', 'Security', 'Title Deed'].map(t => (
            <button
              key={t}
              onClick={() => setLogType(t)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: logType === t ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: logType === t ? 'var(--primary)' : 'var(--card)',
                color: logType === t ? 'white' : 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Search and block count */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              fontSize: 12.5,
              color: 'var(--text-primary)',
              outline: 'none',
              paddingLeft: 24
            }}
            placeholder="Search audit trail by event description, officer, block hash..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 650, borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
          <Lock size={12} color="var(--accent)" />
          <span>Chain Length: <strong>4,910 blocks</strong></span>
        </div>
      </div>

      {/* Ledger Table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 16px' }}>Timestamp</th>
                <th style={{ padding: '14px 16px' }}>Category</th>
                <th style={{ padding: '14px 16px' }}>Event Log</th>
                <th style={{ padding: '14px 16px' }}>Actor</th>
                <th style={{ padding: '14px 16px' }}>Ledger Block</th>
                <th style={{ padding: '14px 16px' }}>Block Hash</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>No audit logs matched search query.</td></tr>
              ) : (
                filtered.map(l => {
                  const bColor = getBadgeColor(l.type)
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.1s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: bColor.bg, color: bColor.color, border: `1px solid ${bColor.border}`, textTransform: 'uppercase' }}>
                          {l.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 650, color: 'var(--text-primary)' }}>{l.event}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{l.officer}</span>
                          <span style={{ fontSize: 9.5 }}>{l.division}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>{l.block}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Lock size={10} color="var(--accent)" />
                          {l.hash}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
