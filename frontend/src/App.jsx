import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import axios from 'axios'
import { Map, Database, BarChart3, Scale, Leaf, UserCheck, Eye, BookOpen, Filter, Search } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import PlotCard from './components/PlotCard.jsx'
import ClaimReviewModal from './components/ClaimReviewModal.jsx'
import PattaCertificate from './components/PattaCertificate.jsx'
import RecordsTable from './components/RecordsTable.jsx'
import Analytics from './components/Analytics.jsx'
import DSS from './components/DSS.jsx'
import TribesInfo from './components/TribesInfo.jsx'
import Guide from './components/Guide.jsx'

const DISTRICTS = ['Mysuru','Chamarajanagara','Shivamogga','Chikkamagaluru','Kodagu','Hassan']
const TRIBES    = ['Soliga','Jenu Kuruba','Nayaka','Betta Kuruba','Paniyan','Koraga','Malekudiya','Hasala','Hakki-Pikki','Iruliga','Yerava','Adi Kurumba']
const FORMS     = ['Form A (IFR)','Form B (CR)','Form C (CFR)']
const STATUSES  = ['Claim Filed','Gram Sabha Resolved','Under Verification','SDLC Approved','DLC Approved','Title Granted','Rejected']

const navSelectStyle = {
  background: '#ffffff',
  border: '1px solid #cbdcce',
  borderRadius: '6px',
  padding: '2px 8px',
  fontSize: '11px',
  color: '#2d4030',
  fontWeight: '600',
  outline: 'none',
  cursor: 'pointer',
  height: '30px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  fontFamily: 'inherit'
}

const API = 'http://localhost:8000'

const STATUS_COLOR = {
  'Title Granted':       '#2e7d32', // Deep pastel green
  'DLC Approved':        '#7c4dff',
  'SDLC Approved':       '#1976d2',
  'Under Verification':  '#ef6c00',
  'Claim Filed':         '#78909c',
  'Gram Sabha Resolved': '#0097a7',
  'Rejected':            '#c62828', // Muted dark red
}

export default function App() {
  const mapContainer = useRef(null)
  const map          = useRef(null)
  const popup        = useRef(null)
  const geojsonRef   = useRef(null)

  const [stats,       setStats]     = useState(null)
  const [geojson,   setGeojson]   = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [filters,   setFilters]   = useState({ district:'', form_type:'', status:'', tribe:'' })
  const [satellite, setSatellite] = useState(false)
  const [mapReady,  setMapReady]  = useState(false)
  
  // Navigation Routing states
  const [view,       setView]       = useState('map') // 'map', 'database', 'analytics', 'dss', 'tribes'
  const [userMode,   setUserMode]   = useState('public') // 'public', 'official'
  const [showDeed,   setShowDeed]   = useState(null)
  const [showReview, setShowReview] = useState(null)

  // ── FETCH STATS ───────────────────────────────────────────
  const fetchStats = () => {
    axios.get(`${API}/api/fra/stats`).then(r => setStats(r.data))
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // ── INIT MAP ──────────────────────────────────────────────
  useEffect(() => {
    if (map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [76.5, 12.5],
      zoom: 7.5,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-right')
    popup.current = new maplibregl.Popup({ closeButton: false, maxWidth: '280px' })
    map.current.on('load', () => setMapReady(true))
  }, [])

  // ── FETCH GEOJSON ─────────────────────────────────────────
  const fetchGeojson = () => {
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
  }

  useEffect(() => {
    fetchGeojson()
  }, [mapReady, filters])

  // ── RESIZE MAP ON TAB SWITCH ──────────────────────────────
  useEffect(() => {
    if (view === 'map' && map.current) {
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

  // ── RENDER LAYERS ─────────────────────────────────────────
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

    m.addSource('fra', { type: 'geojson', data: colored })
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
          <div style="font-family:monospace;font-size:10px;color:#2e7d32;font-weight:700">${p.patta_id}</div>
          <div style="font-size:13px;font-weight:700;margin:4px 0;color:#111">${p.village}</div>
          <div style="font-size:11px;color:#4a7c59">${p.tribal_community} · ${p.district}</div>
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

  // ── SATELLITE TOGGLE ──────────────────────────────────────
  function toggleSatellite() {
    const m = map.current
    const newSat = !satellite
    setSatellite(newSat)
    const style = newSat
      ? { version:8, sources:{ sat:{ type:'raster', tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize:256 } }, layers:[{ id:'sat', type:'raster', source:'sat' }] }
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
    m.setStyle(style)
    m.once('styledata', () => { if (geojsonRef.current) renderLayers(geojsonRef.current) })
  }

  // ── FLY TO SEARCH RESULT ──────────────────────────────────
  function flyTo(record) {
    if (!map.current) return
    setView('map')
    setTimeout(() => {
      map.current.flyTo({
        center: [record.lng, record.lat],
        zoom: 13,
        speed: 1.4,
        curve: 1.2,
      })
      axios.get(`${API}/api/fra/record/${record.patta_id}`).then(r => setSelected(r.data))
    }, 100)
  }

  // ── LOCATE RECORD FROM DATABASE TABLE ─────────────────────
  function locateOnMap(record) {
    setView('map')
    setTimeout(() => {
      if (map.current) {
        map.current.flyTo({
          center: [record.lng, record.lat],
          zoom: 13,
          speed: 1.4,
          curve: 1.2,
        })
        axios.get(`${API}/api/fra/record/${record.patta_id}`).then(r => setSelected(r.data))
      }
    }, 150)
  }

  // ── HANDLE SAVED REVIEW UPDATES ──────────────────────────
  function handleReviewSave(updatedRecord) {
    if (selected && selected.patta_id === updatedRecord.patta_id) {
      setSelected(updatedRecord)
    }
    fetchStats()
    fetchGeojson()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f4f9f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── TOP HORIZONTAL NAVIGATION BAR (TerraClaim Light Sage theme) ── */}
      <div style={{
        background: '#edf5ed', // Light pastel green background
        padding: '0 24px',
        height: '80px', // Increased vertical length (height)
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #cbdcce',
        color: '#2d4030',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        zIndex: 999
      }}>
        {/* Title logo block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 26, display: 'flex', alignItems: 'center' }}>🌱</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0.5, color: '#132a13' }}>TerraClaim</div>
            <div style={{ fontSize: 9.5, color: '#4a7c59', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Forest Land Spatial Ledger</div>
          </div>
        </div>

        {/* Center Tabs with Lucide Icons */}
        <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
          {[
            { id: 'map', label: 'WebGIS Map', icon: <Map size={15} /> },
            { id: 'database', label: 'Search Plots', icon: <Search size={15} /> },
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
            { id: 'dss', label: 'DSS Welfare', icon: <Scale size={15} /> },
            { id: 'tribes', label: 'Tribes Info', icon: <Leaf size={15} /> },
            { id: 'guide', label: 'User Guide', icon: <BookOpen size={15} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                height: '100%',
                color: view === tab.id ? '#2e7d32' : '#556a59',
                padding: '0 16px',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderBottom: view === tab.id ? '4px solid #2e7d32' : '4px solid transparent',
                opacity: view === tab.id ? 1 : 0.85
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* User Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#f4f9f4',
            borderRadius: 8,
            padding: '3px',
            border: '1px solid #cbdcce',
            display: 'flex',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setUserMode('public')}
              style={{
                background: userMode === 'public' ? '#2e7d32' : 'none',
                border: 'none',
                color: userMode === 'public' ? '#ffffff' : '#556a59',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Eye size={10}/>
              Public
            </button>
            <button
              onClick={() => setUserMode('official')}
              style={{
                background: userMode === 'official' ? '#1976d2' : 'none',
                border: 'none',
                color: userMode === 'official' ? '#ffffff' : '#556a59',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <UserCheck size={10}/>
              Official
            </button>
          </div>
        </div>
      </div>

      {/* ── VIEWPORT CONTAINER (Avoids outer scrollbar) ──────── */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', height: 'calc(100vh - 80px)' }}>
        
        {/* VIEW: Map WebGIS (splits Sidebar & MapLibre) */}
        <div style={{ display: view === 'map' ? 'flex' : 'none', width: '100%', height: '100%' }}>
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
            onFlyTo={flyTo}
          />
          <div
            ref={mapContainer}
            style={{
              flex: 1,
              height: '100%',
              position: 'relative'
            }}
          />
          {selected && (
            <PlotCard
              record={selected}
              onClose={() => setSelected(null)}
              onPrintDeed={() => setShowDeed(selected)}
              userMode={userMode}
              onReviewClaim={(r) => setShowReview(r)}
            />
          )}
        </div>

        {/* VIEW: Claims Database Table */}
        {view === 'database' && (
          <RecordsTable
            userMode={userMode}
            onReviewClaim={(r) => setShowReview(r)}
            onPrintDeed={(r) => setShowDeed(r)}
            onLocateOnMap={locateOnMap}
            filters={filters}
            setFilters={setFilters}
          />
        )}

        {/* VIEW: Analytics Dashboard */}
        {view === 'analytics' && (
          <Analytics onBack={() => setView('map')} />
        )}

        {/* VIEW: Decision Support System */}
        {view === 'dss' && (
          <DSS onBack={() => setView('map')} />
        )}

        {/* VIEW: Tribes Info Section */}
        {view === 'tribes' && (
          <TribesInfo />
        )}

        {/* VIEW: User Guide Section */}
        {view === 'guide' && (
          <Guide />
        )}

      </div>

      {/* ── DEED CERTIFICATE MODAL ─────────────────────────── */}
      {showDeed && (
        <PattaCertificate record={showDeed} onClose={() => setShowDeed(null)} />
      )}

      {/* ── REVIEW DIALOG MODAL ─────────────────────────────── */}
      {showReview && (
        <ClaimReviewModal
          record={showReview}
          onClose={() => setShowReview(null)}
          onSave={handleReviewSave}
        />
      )}

    </div>
  )
}
