import { useState, useEffect, useRef } from 'react'
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
    <div ref={wrapRef} style={{ padding:'10px 14px', borderBottom:'1px solid #2d5a3d', position:'relative' }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#4a8c60' }}>🔍</span>
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search village, patta ID, claimant..."
          style={{
            width:'100%', background:'rgba(255,255,255,.07)',
            border:'1px solid #2d5a3d', borderRadius:6,
            color:'#f5f0e8', fontSize:12, padding:'8px 10px 8px 32px',
            fontFamily:'inherit', outline:'none', boxSizing:'border-box',
          }}
        />
        {loading && (
          <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#4a8c60' }}>...</span>
        )}
        {query && !loading && (
          <span
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#4a8c60', cursor:'pointer' }}>✕</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:14, right:14,
          background:'#1a3a2a', border:'1px solid #2d5a3d',
          borderRadius:6, zIndex:9999, boxShadow:'0 8px 32px rgba(0,0,0,.5)',
          maxHeight:320, overflowY:'auto'
        }}>
          {results.map(r => {
            const color = STATUS_COLOR[r.status] || '#aaa'
            const formCode = r.form_type.includes('A') ? 'IFR' : r.form_type.includes('B') ? 'CR' : 'CFR'
            return (
              <div
                key={r.patta_id}
                onClick={() => handleSelect(r)}
                style={{ padding:'10px 12px', borderBottom:'1px solid #2d5a3d', cursor:'pointer', transition:'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#2d5a3d'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                  <span style={{ fontFamily:'monospace', fontSize:10, color:'#e8c547' }}>{r.patta_id}</span>
                  <div style={{ display:'flex', gap:4 }}>
                    <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3,
                      background: r.form_type.includes('A') ? '#1e40af33' : r.form_type.includes('B') ? '#5b21b633' : '#16653433',
                      color: r.form_type.includes('A') ? '#93c5fd' : r.form_type.includes('B') ? '#c4b5fd' : '#86efac'
                    }}>{formCode}</span>
                    <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, background:`${color}22`, color }}>{r.status}</span>
                  </div>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:'#f5f0e8' }}>{r.village}</div>
                <div style={{ fontSize:10, color:'#4a8c60', marginTop:2 }}>{r.district} · {r.tribal_community} · {r.claim_area_acres} ac</div>
              </div>
            )
          })}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div style={{
          position:'absolute', top:'100%', left:14, right:14,
          background:'#1a3a2a', border:'1px solid #2d5a3d',
          borderRadius:6, zIndex:9999, padding:'12px',
          fontSize:12, color:'#4a8c60', textAlign:'center'
        }}>
          No records found for "{query}"
        </div>
      )}
    </div>
  )
}