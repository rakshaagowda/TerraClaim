import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

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

export default function SearchBar({ onFlyTo }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const debounce  = useRef(null)
  const wrapRef   = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleInput(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounce.current)
    if (val.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    debounce.current = setTimeout(() => {
      axios.get(`${API}/api/fra/search?q=${encodeURIComponent(val)}`)
        .then(r => {
          setResults(r.data.results)
          setOpen(true)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }, 300)
  }

  function handleSelect(r) {
    setQuery(r.village + ' — ' + r.patta_id)
    setOpen(false)
    setResults([])
    onFlyTo(r)
  }

  return (
    <div ref={wrapRef} style={{ padding: '12px 14px', borderBottom: '1px solid #c8dcd0', position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#4a7c59' }}>🔍</span>
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search village, patta ID, claimant..."
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1px solid #c8dcd0',
            borderRadius: 6,
            color: '#2d4030',
            fontSize: 12,
            padding: '8px 10px 8px 30px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#4a7c59' }}>...</span>
        )}
        {query && !loading && (
          <span
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#718096', cursor: 'pointer' }}>✕</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 14,
          right: 14,
          background: '#ffffff',
          border: '1px solid #c8dcd0',
          borderRadius: 8,
          zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          maxHeight: 280,
          overflowY: 'auto'
        }}>
          {results.map(r => {
            const color = STATUS_COLOR[r.status] || '#aaa'
            const formCode = r.form_type.includes('A') ? 'IFR' : r.form_type.includes('B') ? 'CR' : 'CFR'
            return (
              <div
                key={r.patta_id}
                onClick={() => handleSelect(r)}
                style={{ padding: '8px 12px', borderBottom: '1px solid #edf5ed', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#edf5ed'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a7c59', fontWeight: 700 }}>{r.patta_id}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 2,
                      background: r.form_type.includes('A') ? '#dbeafe' : r.form_type.includes('B') ? '#ede9fe' : '#dcfce7',
                      color: r.form_type.includes('A') ? '#1e40af' : r.form_type.includes('B') ? '#5b21b6' : '#166534'
                    }}>{formCode}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 2, background: `${color}15`, color }}>{r.status === 'Title Granted' ? 'Granted' : r.status.split(' ')[0]}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#132a13' }}>{r.village}</div>
                <div style={{ fontSize: 9, color: '#718096', marginTop: 1 }}>{r.district} · {r.tribal_community} · {r.claim_area_acres} ac</div>
              </div>
            )
          })}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 14,
          right: 14,
          background: '#ffffff',
          border: '1px solid #c8dcd0',
          borderRadius: 8,
          zIndex: 9999,
          padding: '12px',
          fontSize: 11,
          color: '#718096',
          textAlign: 'center'
        }}>
          No records found for "{query}"
        </div>
      )}
    </div>
  )
}
