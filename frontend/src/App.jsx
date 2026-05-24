import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import axios from 'axios'
import Sidebar from './components/Sidebar.jsx'
import DetailDrawer from './components/DetailDrawer.jsx'
import Analytics from './components/Analytics.jsx'
import DSS from './components/DSS.jsx'

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

export default function App() {
  const mapContainer = useRef(null)
  const map          = useRef(null)
  const popup        = useRef(null)
  const geojsonRef   = useRef(null)

  const [stats,     setStats]     = useState(null)
  const [geojson,   setGeojson]   = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [filters,   setFilters]   = useState({ district:'', form_type:'', status:'', tribe:'' })
  const [satellite, setSatellite] = useState(false)
  const [mapReady,  setMapReady]  = useState(false)
  const [view,      setView]      = useState('map') // 'map' | 'analytics' | 'dss'

  // ── FETCH STATS ───────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/api/fra/stats`).then(r => setStats(r.data))
  }, [])

  // ── INIT MAP ──────────────────────────────────────────────
  useEffect(() => {
    if (map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [76.5, 12.5],
      zoom: 7.5,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-right')
    popup.current = new maplibregl.Popup({ closeButton: false, maxWidth: '280px' })
    map.current.on('load', () => setMapReady(true))
  }, [])

  // ── FETCH GEOJSON ─────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
    axios.get(`${API}/api/fra/geojson?${params}`).then(r => {
      setGeojson(r.data)
      geojsonRef.current = r.data
      if (map.current.isStyleLoaded()) {
        renderLayers(r.data)
      } else {
        map.current.once('styledata', () => renderLayers(r.data))
      }
    })
  }, [mapReady, filters])

  // ── SWITCH BACK TO MAP ────────────────────────────────────
  useEffect(() => {
    if (view === 'map' && map.current) {
      // Give the DOM time to show the map div again
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          map.current.resize()
          if (geojsonRef.current) {
            if (map.current.isStyleLoaded()) {
              renderLayers(geojsonRef.current)
            } else {
              map.current.once('styledata', () => renderLayers(geojsonRef.current))
            }
          }
        })
      })
    }
  }, [view])

  function renderLayers(data) {
    const m = map.current
    if (!m || !m.isStyleLoaded()) {
      m.once('styledata', () => renderLayers(data))
      return
    }
    ;['fra-points'].forEach(l => { if (m.getLayer(l)) m.removeLayer(l) })
    if (m.getSource('fra')) m.removeSource('fra')

    const colored = {
      ...data,
      features: data.features.map(f => ({
        ...f,
        properties: { ...f.properties, color: STATUS_COLOR[f.properties.status] || '#aaa' }
      }))
    }

    m.addSource('fra', { type:'geojson', data: colored })
    m.addLayer({
      id: 'fra-points',
      type: 'circle',
      source: 'fra',
      paint: {
        'circle-radius': ['case',
          ['==', ['get', 'form_type'], 'Form C (CFR)'], 10,
          ['==', ['get', 'form_type'], 'Form B (CR)'],  7,
          5
        ],
        'circle-color':        ['get', 'color'],
        'circle-opacity':      0.85,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255,255,255,0.5)',
      }
    })

    m.on('mouseenter', 'fra-points', e => {
      m.getCanvas().style.cursor = 'pointer'
      const p = e.features[0].properties
      popup.current
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(`
          <div style="font-family:monospace;font-size:10px;color:#e8c547">${p.patta_id}</div>
          <div style="font-size:13px;font-weight:600;margin:4px 0">${p.village}</div>
          <div style="font-size:11px;color:#4a8c60">${p.tribal_community} · ${p.district}</div>
          <div style="margin-top:6px;font-size:11px">
            <span style="color:${STATUS_COLOR[p.status]};font-weight:700">${p.status}</span>
            &nbsp;·&nbsp; ${p.claim_area_acres} ac
          </div>`)
        .addTo(m)
    })
    m.on('mouseleave', 'fra-points', () => {
      m.getCanvas().style.cursor = ''
      popup.current.remove()
    })
    m.on('click', 'fra-points', e => {
      const p = e.features[0].properties
      axios.get(`${API}/api/fra/record/${p.patta_id}`).then(r => setSelected(r.data))
    })
  }

  function toggleSatellite() {
    const m = map.current
    const newSat = !satellite
    setSatellite(newSat)
    const style = newSat
      ? { version:8, sources:{ sat:{ type:'raster', tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize:256 } }, layers:[{ id:'sat', type:'raster', source:'sat' }] }
      : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    m.setStyle(style)
    m.once('styledata', () => { if (geojsonRef.current) renderLayers(geojsonRef.current) })
  }

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden' }}>
      <Sidebar
        stats={stats}
        filters={filters}
        setFilters={setFilters}
        geojson={geojson}
        onSelectRecord={setSelected}
        satellite={satellite}
        onToggleSatellite={toggleSatellite}
        onShowAnalytics={() => setView('analytics')}
        onShowDSS={() => setView('dss')}
      />

      {/* MAP — always mounted, just hidden when not active */}
      <div
        ref={mapContainer}
        style={{
          flex: 1,
          height: '100vh',
          display: view === 'map' ? 'block' : 'none',
          position: 'relative',
        }}
      />

      {/* Detail drawer sits over the map */}
      {view === 'map' && selected && (
        <DetailDrawer record={selected} onClose={() => setSelected(null)} />
      )}

      {/* OTHER VIEWS */}
      {view === 'analytics' && (
        <Analytics onBack={() => setView('map')} />
      )}
      {view === 'dss' && (
        <DSS onBack={() => setView('map')} />
      )}
    </div>
  )
}