import React, { useState } from 'react'
import { Search, Shield, User, Mail, Phone, MapPin } from 'lucide-react'

const ROSTER = [
  { id: '1', name: 'Dr. Ramachandra IAS', role: 'DLC Chairman / District Magistrate', dept: 'Revenue Department', district: 'Mysuru', email: 'dc-mysore-ka@nic.in', phone: '+91 82124 18000', status: 'Active' },
  { id: '2', name: 'Smt. Priyanka IFS', role: 'DLC Convenor / Deputy Conservator of Forests', dept: 'Karnataka Forest Department', district: 'Kodagu', email: 'dcf.kodagu@karnataka.gov.in', phone: '+91 82722 28400', status: 'Active' },
  { id: '3', name: 'Sri. Kempaiah KAS', role: 'SDLC Chairman / Sub-Divisional Magistrate', dept: 'Revenue Department', district: 'Hunsur', email: 'sdm.hunsur@nic.in', phone: '+91 82222 52200', status: 'Active' },
  { id: '4', name: 'Smt. Shashi Devi', role: 'Tribal Welfare Officer / SDLC Secretary', dept: 'Tribal Welfare Department', district: 'Chamarajanagara', email: 'two.chngr@karnataka.gov.in', phone: '+91 82262 24500', status: 'Active' },
  { id: '5', name: 'Sri. Rajesh Gowda', role: 'Forest Range Officer (FRO) / Inspector', dept: 'Karnataka Forest Department', district: 'Chikkamagaluru', email: 'fro.khandya@karnataka.gov.in', phone: '+91 82622 30450', status: 'On Field' },
  { id: '6', name: 'Kum. Anjali Soliga', role: 'Gram Sabha Secretary / Facilitator', dept: 'Gram Panchayat Services', district: 'Kodagu', email: 'gp.birunani@ka.gov.in', phone: '+91 94808 61040', status: 'Active' },
]

export default function UsersPanel() {
  const [search, setSearch] = useState('')

  const filtered = ROSTER.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.district.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 24px', overflowY: 'auto' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            Committee Directory & Users
          </h2>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
            Roster of active DLC, SDLC, Forest, and Tribal Welfare officers
          </div>
        </div>
        
        {/* Search */}
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            style={{
              width: '100%',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px 6px 30px',
              fontSize: 12.5,
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="Search officers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(u => (
          <div 
            key={u.id}
            className="glass-card"
            style={{
              padding: 20,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div 
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(22, 101, 52, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}
              >
                <User size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {u.name}
                </h4>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 650, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {u.role}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 10, fontWeight: 700 }}>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                {u.dept}
              </span>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={10} />
                {u.district}
              </span>
            </div>

            {/* Contact details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 11.5, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={12} />
                <span style={{ wordBreak: 'break-all' }}>{u.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={12} />
                <span>{u.phone}</span>
              </div>
            </div>

            {/* Footer status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>System Status</span>
              <span 
                style={{ 
                  fontSize: 10, 
                  fontWeight: 800, 
                  color: u.status === 'Active' ? 'var(--success)' : '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: u.status === 'Active' ? 'var(--success)' : '#d97706' }} />
                {u.status}
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
