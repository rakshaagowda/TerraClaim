import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import axios from 'axios'
import { Map, Database, BarChart3, Scale, Leaf, UserCheck, Eye, BookOpen, Filter, Search, Award, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import PlotCard from './components/PlotCard.jsx'
import ClaimReviewModal from './components/ClaimReviewModal.jsx'
import PattaCertificate from './components/PattaCertificate.jsx'
import RecordsTable from './components/RecordsTable.jsx'
import Analytics from './components/Analytics.jsx'
import DSS from './components/DSS.jsx'
import Guide from './components/Guide.jsx'
import ClaimStepper from './components/ClaimStepper.jsx'
import LoginModal from './components/LoginModal.jsx'

// Helper to convert point coordinates into simulated boundary polygons & overlaps
function convertPointsToPolygons(pointsGeoJSON) {
  if (!pointsGeoJSON || !pointsGeoJSON.features) {
    return { 
      polygons: { type: 'FeatureCollection', features: [] }, 
      overlaps: { type: 'FeatureCollection', features: [] } 
    };
  }
  
  const polygonFeatures = [];
  const overlapFeatures = [];
  
  pointsGeoJSON.features.forEach(f => {
    if (!f.geometry || f.geometry.type !== 'Point') return;
    const coords = f.geometry.coordinates;
    const lng = coords[0];
    const lat = coords[1];
    const props = f.properties;
    const acres = parseFloat(props.claim_area_acres || 1.0);
    const pattaId = props.patta_id;
    const district = props.district;
    
    // Determine if it has conflict
    const isLarge = acres > 5;
    const isConflictDistrict = ['Kodagu', 'Chikkamagaluru'].includes(district);
    const hasConflict = isLarge && isConflictDistrict;
    
    // Area = acres * 4046.86 m2. Square side = sqrt(Area).
    const sideM = Math.sqrt(acres * 4046.86);
    const latDelta = (sideM / 2) / 111000;
    const lngDelta = (sideM / 2) / (111000 * Math.cos(lat * Math.PI / 180));
    
    const polyCoords = [
      [lng - lngDelta, lat - latDelta],
      [lng + lngDelta, lat - latDelta],
      [lng + lngDelta, lat + latDelta],
      [lng - lngDelta, lat + latDelta],
      [lng - lngDelta, lat - latDelta]
    ];
    
    polygonFeatures.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [polyCoords]
      },
      properties: {
        ...props,
        has_conflict: hasConflict,
        is_boundary: true
      }
    });
    
    if (hasConflict) {
      // Create offset polygon representing overlapping forest zone (45% offset overlap)
      const offsetLng = lngDelta * 0.45;
      const offsetLat = latDelta * 0.45;
      
      const overlapCoords = [
        [lng + offsetLng - lngDelta, lat + offsetLat - latDelta],
        [lng + offsetLng + lngDelta, lat + offsetLat - latDelta],
        [lng + offsetLng + lngDelta, lat + offsetLat + latDelta],
        [lng + offsetLng - lngDelta, lat + offsetLat + latDelta],
        [lng + offsetLng - lngDelta, lat + offsetLat - latDelta]
      ];
      
      overlapFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [overlapCoords]
        },
        properties: {
          patta_id: pattaId + '-overlap',
          is_overlap: true,
          conflict_type: 'Critical Forest Corridor',
          overlap_percentage: 12.5
        }
      });
    }
  });
  
  return {
    polygons: { type: 'FeatureCollection', features: polygonFeatures },
    overlaps: { type: 'FeatureCollection', features: overlapFeatures }
  };
}

const DISTRICTS = ['Mysuru', 'Chamarajanagara', 'Shivamogga', 'Chikkamagaluru', 'Kodagu', 'Hassan']
const TRIBES = ['Soliga', 'Jenu Kuruba', 'Nayaka', 'Betta Kuruba', 'Paniyan', 'Koraga', 'Malekudiya', 'Hasala', 'Hakki-Pikki', 'Iruliga', 'Yerava', 'Adi Kurumba']
const FORMS = ['Form A (IFR)', 'Form B (CR)', 'Form C (CFR)']
const STATUSES = ['Claim Filed', 'Gram Sabha Resolved', 'Under Verification', 'SDLC Approved', 'DLC Approved', 'Title Granted', 'Rejected']

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
  'Title Granted': '#2e7d32', // Deep pastel green
  'DLC Approved': '#7c4dff',
  'SDLC Approved': '#1976d2',
  'Under Verification': '#ef6c00',
  'Claim Filed': '#78909c',
  'Gram Sabha Resolved': '#0097a7',
  'Rejected': '#c62828', // Muted dark red
}

export default function App() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const popup = useRef(null)
  const geojsonRef = useRef(null)

  const [stats, setStats] = useState(null)
  const [geojson, setGeojson] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ district: '', form_type: '', status: '', tribe: '' })
  const [satellite, setSatellite] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Navigation Routing states
  const [view, setView] = useState('track') // 'track', 'map', 'database', 'analytics', 'dss', 'tribes'
  const [userMode, setUserMode] = useState('public') // 'public', 'official'
  const [showDeed, setShowDeed] = useState(null)
  const [showReview, setShowReview] = useState(null)

  // Public Mode Tracking States (Dual-Factor Search)
  const [trackQuery, setTrackQuery] = useState('') // Claimant Name
  const [trackVillage, setTrackVillage] = useState('') // Village / Region
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackError, setTrackError] = useState('')
  const [trackedRecord, setTrackedRecord] = useState(null)

  // Public Sub-Mode toggle
  const [publicSubMode, setPublicSubMode] = useState('track') // 'track', 'submit'

  // Submit Claim States
  const [newClaimant, setNewClaimant] = useState('')
  const [newTribe, setNewTribe] = useState(TRIBES[0])
  const [newFormType, setNewFormType] = useState(FORMS[0])
  const [newDistrict, setNewDistrict] = useState(DISTRICTS[0])
  const [newTaluk, setNewTaluk] = useState('')
  const [newVillage, setNewVillage] = useState('')
  const [newAcres, setNewAcres] = useState('2.5')
  const [newLat, setNewLat] = useState('12.35')
  const [newLng, setNewLng] = useState('76.15')
  const [newDocName, setNewDocName] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(null)
  const [submitError, setSubmitError] = useState('')

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    if (!newClaimant.trim() || !newTaluk.trim() || !newVillage.trim()) {
      setSubmitError('Please fill out all required fields.');
      return;
    }
    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess(null);

    const payload = {
      claimant_name: newClaimant,
      village: newVillage,
      taluk: newTaluk,
      district: newDistrict,
      tribal_community: newTribe,
      claim_area_acres: parseFloat(newAcres) || 1.0,
      form_type: newFormType,
      lat: parseFloat(newLat) || 12.35,
      lng: parseFloat(newLng) || 76.15
    };

    axios.post(`${API}/api/fra/claim/submit`, payload)
      .then(res => {
        setSubmitLoading(false);
        setSubmitSuccess(res.data);
        // Reset form fields
        setNewClaimant('');
        setNewTaluk('');
        setNewVillage('');
        setNewAcres('2.5');
        // Pre-populate tracking fields
        setTrackQuery(res.data.claimant_name);
        setTrackVillage(res.data.village);
      })
      .catch(err => {
        setSubmitLoading(false);
        setSubmitError(err.response?.data?.detail || 'Failed to submit claim. Please check your inputs.');
      });
  };

  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loggedInOfficer, setLoggedInOfficer] = useState(null)

  // Load persisted session
  useEffect(() => {
    const savedToken = localStorage.getItem('officer_token')
    const savedOfficer = localStorage.getItem('officer_details')
    if (savedToken && savedOfficer) {
      const details = JSON.parse(savedOfficer)
      setIsAuthenticated(true)
      setLoggedInOfficer(details)
      setUserMode('official')
    }
  }, [])

  // Dual-factor Public Track Submit Handler
  const handlePublicTrack = () => {
    if (!trackQuery.trim() || !trackVillage.trim()) return
    setTrackLoading(true)
    setTrackError('')
    setTrackedRecord(null)

    axios.post(`${API}/api/fra/public/track`, {
      claimant_name: trackQuery,
      village: trackVillage
    })
      .then(res => {
        setTrackedRecord(res.data)
        setTrackLoading(false)
      })
      .catch(err => {
        setTrackLoading(false)
        setTrackError(err.response?.data?.detail || 'Verification failed. No matching claim found.')
      })
  }

  // Handle Login Success callback
  const handleLoginSuccess = (data) => {
    localStorage.setItem('officer_token', data.token)
    localStorage.setItem('officer_details', JSON.stringify({
      officer_id: data.officer_id,
      designation: data.designation,
      jurisdiction: data.jurisdiction
    }))
    setIsAuthenticated(true)
    setLoggedInOfficer(data)
    setUserMode('official')
    setShowLoginModal(false)
  }

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('officer_token')
    localStorage.removeItem('officer_details')
    setIsAuthenticated(false)
    setLoggedInOfficer(null)
    setUserMode('public')
    setView('track')
  }

  // Toggle default view when changing user role
  useEffect(() => {
    if (userMode === 'public') {
      setView('track')
      setTrackedRecord(null)
      setTrackQuery('')
      setTrackVillage('')
      setTrackError('')
      setFilters({ district: '', form_type: '', status: '', tribe: '' })
    } else {
      setView('map')
      if (loggedInOfficer?.jurisdiction) {
        setFilters(f => ({ ...f, district: loggedInOfficer.jurisdiction }))
      }
    }
  }, [userMode, loggedInOfficer])

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
    const activeFilters = { ...filters }
    if (userMode === 'official' && loggedInOfficer?.jurisdiction) {
      activeFilters.district = loggedInOfficer.jurisdiction
    }
    Object.entries(activeFilters).forEach(([k, v]) => { if (v) params.append(k, v) })
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

  // ── INIT DRAW TOOL ─────────────────────────────────────────
  const drawControl = useRef(null)
  useEffect(() => {
    if (!mapReady || !map.current) return
    if (drawControl.current) return

    // Safety check for CDN-loaded library
    if (!window.MapLibreGLDraw) {
      console.warn("MapLibreGLDraw not loaded yet, retrying...");
      const timer = setTimeout(() => fetchGeojson(), 1000); // Trigger a re-render or just wait
      return () => clearTimeout(timer);
    }

    // @ts-ignore
    drawControl.current = new window.MapLibreGLDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'simple_select'
    })

    map.current.addControl(drawControl.current, 'top-left')

    const updateArea = () => {
      const data = drawControl.current.getAll()
      if (data.features.length > 0) {
        console.log('Polygon updated:', data.features[0])
      }
    }

    map.current.on('draw.create', updateArea)
    map.current.on('draw.delete', updateArea)
    map.current.on('draw.update', updateArea)
  }, [mapReady])


  useEffect(() => {
    fetchGeojson()
  }, [mapReady, filters, userMode, loggedInOfficer])

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

    // Clean up existing layers and sources
    const layers = ['fra-points', 'fra-boundaries', 'fra-boundaries-outline', 'fra-overlaps', 'fra-overlaps-outline']
    layers.forEach(l => { if (m.getLayer(l)) m.removeLayer(l) })
    
    const sources = ['fra', 'fra-poly', 'fra-overlap']
    sources.forEach(s => { if (m.getSource(s)) m.removeSource(s) })

    // Add color properties to features
    const coloredFeatures = data.features.map(f => ({
      ...f,
      properties: { ...f.properties, color: STATUS_COLOR[f.properties.status] || '#aaa' }
    }))
    
    const coloredPoints = { ...data, features: coloredFeatures }
    const { polygons, overlaps } = convertPointsToPolygons(coloredPoints)

    // Add sources
    m.addSource('fra', { type: 'geojson', data: coloredPoints })
    m.addSource('fra-poly', { type: 'geojson', data: polygons })
    m.addSource('fra-overlap', { type: 'geojson', data: overlaps })

    // Add polygon boundaries layer (fill)
    m.addLayer({
      id: 'fra-boundaries',
      type: 'fill',
      source: 'fra-poly',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          9.5, 0.0,
          11.5, 0.35
        ]
      }
    })

    // Add polygon outline layer
    m.addLayer({
      id: 'fra-boundaries-outline',
      type: 'line',
      source: 'fra-poly',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          9.5, 0.0,
          11.0, 1.0
        ]
      }
    })

    // Add overlaps layer (fill)
    m.addLayer({
      id: 'fra-overlaps',
      type: 'fill',
      source: 'fra-overlap',
      paint: {
        'fill-color': '#d32f2f',
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10.0, 0.0,
          12.0, 0.45
        ]
      }
    })

    // Add overlaps outline layer (dashed)
    m.addLayer({
      id: 'fra-overlaps-outline',
      type: 'line',
      source: 'fra-overlap',
      paint: {
        'line-color': '#b71c1c',
        'line-width': 2,
        'line-dasharray': [3, 3],
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10.0, 0.0,
          11.5, 1.0
        ]
      }
    })

    // Add points layer (always visible but fades out at high zoom)
    m.addLayer({
      id: 'fra-points',
      type: 'circle',
      source: 'fra',
      paint: {
        'circle-radius': ['case',
          ['==', ['get', 'form_type'], 'Form C (CFR)'], 10,
          ['==', ['get', 'form_type'], 'Form B (CR)'], 7,
          5
        ],
        'circle-color': ['get', 'color'],
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          11.0, 0.85,
          13.0, 0.05
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255,255,255,0.5)',
        'circle-stroke-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          11.0, 0.85,
          13.0, 0.05
        ]
      }
    })

    // Mouse events on points & boundaries
    const interactiveLayers = ['fra-points', 'fra-boundaries']
    
    interactiveLayers.forEach(layerId => {
      m.on('mouseenter', layerId, e => {
        m.getCanvas().style.cursor = 'pointer'
        const p = e.features[0].properties
        if (p.is_overlap) return
        
        popup.current
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:monospace;font-size:10px;color:#2e7d32;font-weight:700">${p.patta_id}</div>
            <div style="font-size:13px;font-weight:700;margin:4px 0;color:#111">${p.village}</div>
            <div style="font-size:11px;color:#4a7c59">${p.tribal_community} · ${p.district}</div>
            <div style="margin-top:6px;font-size:11px">
              <span style="color:${STATUS_COLOR[p.status]};font-weight:700">${p.status}</span>
              &nbsp;·&nbsp; ${p.claim_area_acres} ac
              ${p.has_conflict ? '<br/><span style="color:#d32f2f;font-weight:700;display:inline-flex;align-items:center;gap:3px;margin-top:4px">⚠️ Boundary Overlap Conflict</span>' : ''}
            </div>`)
          .addTo(m)
      })

      m.on('mouseleave', layerId, () => {
        m.getCanvas().style.cursor = ''
        popup.current.remove()
      })

      m.on('click', layerId, e => {
        const p = e.features[0].properties
        if (p.is_overlap) return
        axios.get(`${API}/api/fra/record/${p.patta_id}`).then(r => setSelected(r.data))
      })
    })
  }

  // ── SATELLITE TOGGLE ──────────────────────────────────────
  function toggleSatellite() {
    const m = map.current
    const newSat = !satellite
    setSatellite(newSat)

    const style = newSat
      ? {
        version: 8,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Esri, Maxar'
          }
        },
        layers: [{ id: 'satellite-layer', type: 'raster', source: 'satellite' }]
      }
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

    m.setStyle(style)
    m.once('styledata', () => {
      if (geojsonRef.current) renderLayers(geojsonRef.current)
    })
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

      {/* ── TOP HORIZONTAL NAVIGATION BAR ── */}
      <div
        className="glass"
        style={{
          padding: '0 24px',
          height: '80px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(203, 220, 206, 0.5)',
          color: '#2d4030',
          zIndex: 999
        }}
      >

        {/* Title logo block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 26, display: 'flex', alignItems: 'center' }}>🌱</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0.5, color: '#132a13' }}>TerraClaim</div>
            <div style={{ fontSize: 9.5, color: '#4a7c59', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Forest Land Spatial Ledger</div>
          </div>
        </div>

        {/* Center Tabs with Lucide Icons (Restricted to Official mode) */}
        <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
          {userMode === 'official' ? (
            [
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
            ))
          ) : (
            <button
              style={{
                background: 'none',
                border: 'none',
                height: '100%',
                color: '#2e7d32',
                padding: '0 16px',
                fontSize: 13.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderBottom: '4px solid #2e7d32',
              }}
            >
              <Eye size={15} />
              <span>Track Application Status</span>
            </button>
          )}
        </div>

        {/* User Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {isAuthenticated && loggedInOfficer && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: 10.5, color: '#334155' }}>
              <span style={{ fontWeight: 800, color: '#1e3a8a' }}>{loggedInOfficer.designation.split(' ')[0]} Locked</span>
              <span style={{ fontSize: 9.5, color: '#475569', fontWeight: 600 }}>Jurisdiction: <strong>{loggedInOfficer.jurisdiction}</strong></span>
            </div>
          )}
          
          <div style={{
            background: '#f4f9f4',
            borderRadius: 8,
            padding: '3px',
            border: '1px solid #cbdcce',
            display: 'flex',
            alignItems: 'center'
          }}>
            <button
              onClick={() => {
                if (userMode === 'official') {
                  handleLogout();
                } else {
                  setUserMode('public');
                }
              }}
              style={{
                background: userMode === 'public' ? '#2e7d32' : 'none',
                border: 'none',
                color: userMode === 'public' ? '#ffffff' : '#556a59',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Eye size={10} />
              Public Portal
            </button>
            
            <button
              onClick={() => {
                if (isAuthenticated) {
                  setUserMode('official');
                } else {
                  setShowLoginModal(true);
                }
              }}
              style={{
                background: userMode === 'official' ? '#1976d2' : 'none',
                border: 'none',
                color: userMode === 'official' ? '#ffffff' : '#556a59',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <UserCheck size={10} />
              Official Portal
            </button>
          </div>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              style={{
                padding: '5px 12px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: 6,
                color: '#991b1b',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* ── VIEWPORT CONTAINER (Avoids outer scrollbar) ──────── */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', height: 'calc(100vh - 80px)' }}>

        {/* VIEW: Public Claim Status Tracker */}
        {view === 'track' && (
          <div style={{ flex: 1, padding: '24px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            
            {/* Header / Intro Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #132a13 0%, #355e3b 100%)',
              padding: '30px 40px',
              borderRadius: 16,
              color: 'white',
              boxShadow: '0 8px 32px rgba(19, 42, 19, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: '#e8c547' }}>
                DIRECTORATE OF TRIBAL WELFARE · GOVERNMENT OF KARNATAKA
              </div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
                Forest Rights Act (FRA) Claim Tracking Portal
              </h1>
              <p style={{ margin: 0, fontSize: 13.5, color: '#cbdcce', maxWidth: 650, lineHeight: 1.5 }}>
                Welcome to the official public portal. Enter your **Claimant Name** and nearby **Village/Region** below to verify and track the status of your forest land rights application.
              </p>
              {/* Decorative background icon */}
              <div style={{ position: 'absolute', right: 40, bottom: -10, opacity: 0.08, fontSize: 120, userSelect: 'none' }}>🌲</div>
            </div>

            {/* Sub-Mode Toggle Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: -8 }}>
              <button
                type="button"
                onClick={() => { setPublicSubMode('track'); setSubmitSuccess(null); }}
                style={{
                  padding: '9px 18px',
                  background: publicSubMode === 'track' ? '#355e3b' : 'white',
                  border: '1.5px solid #cbdcce',
                  color: publicSubMode === 'track' ? 'white' : '#355e3b',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
              >
                <span>🔍</span> Track Application Status
              </button>
              <button
                type="button"
                onClick={() => { setPublicSubMode('submit'); setTrackedRecord(null); }}
                style={{
                  padding: '9px 18px',
                  background: publicSubMode === 'submit' ? '#355e3b' : 'white',
                  border: '1.5px solid #cbdcce',
                  color: publicSubMode === 'submit' ? 'white' : '#355e3b',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
              >
                <span>📝</span> File New Land Claim
              </button>
            </div>

            {/* Sub-Mode 1: Track existing claim */}
            {publicSubMode === 'track' && (
              <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 14,
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                border: '1px solid #c8dcd0',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={16} color="#355e3b" />
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#355e3b', letterSpacing: 0.5 }}>
                    Secure Claimant Verification (Dual-Factor Lookup)
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 14, alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Claimant Name
                    </label>
                    <input
                      type="text"
                      disabled={trackLoading}
                      value={trackQuery}
                      onChange={e => setTrackQuery(e.target.value)}
                      placeholder="Enter claimant name (e.g. Basava)"
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1.5px solid #c8dcd0',
                        borderRadius: 10,
                        color: '#0f172a',
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '10px 12px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Village / Nearby Region
                    </label>
                    <input
                      type="text"
                      disabled={trackLoading}
                      value={trackVillage}
                      onChange={e => setTrackVillage(e.target.value)}
                      placeholder="Enter village or district"
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1.5px solid #c8dcd0',
                        borderRadius: 10,
                        color: '#0f172a',
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '10px 12px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    onClick={handlePublicTrack}
                    disabled={trackLoading || !trackQuery.trim() || !trackVillage.trim()}
                    style={{
                      padding: '11px 24px',
                      background: '#355e3b',
                      border: 'none',
                      color: 'white',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      height: '40px',
                      boxShadow: '0 4px 12px rgba(53, 94, 59, 0.15)',
                      opacity: (trackLoading || !trackQuery.trim() || !trackVillage.trim()) ? 0.6 : 1
                    }}
                  >
                    {trackLoading ? 'Verifying...' : 'Verify & Track'}
                  </button>
                </div>

                {trackError && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#991b1b',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 6
                  }}>
                    <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                    <span>{trackError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Mode 2: File new claim form */}
            {publicSubMode === 'submit' && (
              <form onSubmit={handleClaimSubmit} style={{
                background: 'white',
                padding: 24,
                borderRadius: 14,
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                border: '1px solid #c8dcd0',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📝</span>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#355e3b', letterSpacing: 0.5 }}>
                    New Forest Rights Act (FRA) Land Claim Registration
                  </span>
                </div>

                {submitError && (
                  <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 8, padding: '10px 12px', color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
                    ⚠️ {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '16px', color: '#166534', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>✓ Application Registered Successfully!</div>
                    <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                      Your claim has been cataloged in the spatial database. An automatic audit point was geocoded.<br/>
                      • <strong>Assigned Patta ID</strong>: <strong style={{ fontFamily: 'monospace' }}>{submitSuccess.patta_id}</strong><br/>
                      • <strong>Claimant Name</strong>: {submitSuccess.claimant_name}<br/>
                      • <strong>Village & District</strong>: {submitSuccess.village} ({submitSuccess.district})<br/>
                      • <strong>Initial Status</strong>: Claim Filed (Gram Sabha Review pending)
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPublicSubMode('track'); handlePublicTrack(); }}
                      style={{ alignSelf: 'flex-start', marginTop: 10, background: '#166534', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Track Now
                    </button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Claimant Full Name *</label>
                    <input required type="text" placeholder="e.g. Basava Gowda" style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #c8dcd0', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={newClaimant} onChange={e => setNewClaimant(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tribal Community Category *</label>
                    <select style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #c8dcd0', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={newTribe} onChange={e => setNewTribe(e.target.value)}>
                      {TRIBES.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="Other Traditional Forest Dweller (OTFD)">Other Traditional Forest Dweller (OTFD)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Claim Form Category *</label>
                    <select style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #c8dcd0', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={newFormType} onChange={e => setNewFormType(e.target.value)}>
                      {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>District Jurisdiction *</label>
                    <select style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #c8dcd0', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={newDistrict} onChange={e => setNewDistrict(e.target.value)}>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Claimed Land Area (Acres) *</label>
                    <input required type="number" step="0.01" style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #c8dcd0', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={newAcres} onChange={e => setNewAcres(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Taluk / Sub-Division *</label>
                    <input required type="text" placeholder="e.g. Hunsur" style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #c8dcd0', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={newTaluk} onChange={e => setNewTaluk(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Village / Gram Panchayat *</label>
                    <input required type="text" placeholder="e.g. Kerehalli" style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #c8dcd0', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={newVillage} onChange={e => setNewVillage(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Geocoded Latitude *</label>
                    <input required type="number" step="0.000001" style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #c8dcd0', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={newLat} onChange={e => setNewLat(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Geocoded Longitude *</label>
                    <input required type="number" step="0.000001" style={{ width: '100%', background: '#f8fafc', border: '1.5px solid #c8dcd0', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} value={newLng} onChange={e => setNewLng(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Attach Supporting Document Form A/B/C *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="file"
                        id="newClaimDoc"
                        style={{ display: 'none' }}
                        onChange={e => setNewDocName(e.target.files[0]?.name || '')}
                      />
                      <label
                        htmlFor="newClaimDoc"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '1.5px dashed #c8dcd0',
                          borderRadius: 10,
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#4a7c59',
                          cursor: 'pointer',
                          background: '#f8fafc'
                        }}
                      >
                        {newDocName ? `📎 ${newDocName}` : '📂 Choose Scanned PDF'}
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  style={{
                    alignSelf: 'flex-end',
                    padding: '12px 30px',
                    background: '#355e3b',
                    border: 'none',
                    color: 'white',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(53, 94, 59, 0.15)',
                    opacity: submitLoading ? 0.6 : 1,
                    marginTop: 10
                  }}
                >
                  {submitLoading ? 'Registering Claim...' : 'Register Claim Form'}
                </button>
              </form>
            )}

            {/* Tracking Record Details Panel */}
            {trackedRecord ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 30, alignItems: 'flex-start' }} className="fade-in">
                
                {/* Left Column: Claimant Profile & Pre-eligible Welfare */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Profile Card */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #c8dcd0',
                    borderRadius: 14,
                    padding: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #edf5ed', paddingBottom: 12, marginBottom: 16 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#132a13' }}>Claimant Profile</h3>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#4a7c59', fontWeight: 700 }}>
                        {trackedRecord.patta_id}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                      <div>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>Claimant Name</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{trackedRecord.claimant_name || 'Community Representative'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>Tribe Community</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{trackedRecord.tribal_community || 'General Forest Dwellers'}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>Form Type</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{trackedRecord.form_type}</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>District</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{trackedRecord.district}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>Taluk & Village</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{trackedRecord.taluk} · {trackedRecord.village}</span>
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>Claimed Area</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>
                          {parseFloat(trackedRecord.claim_area_acres || 0).toFixed(2)} Acres ({parseFloat(trackedRecord.claim_area_ha || (trackedRecord.claim_area_acres * 0.404686)).toFixed(3)} Hectares)
                        </span>
                      </div>
                    </div>

                    {/* Certificate Print Button if Title Granted */}
                    {trackedRecord.status === 'Title Granted' && (
                      <button
                        onClick={() => setShowDeed(trackedRecord)}
                        style={{
                          width: '100%',
                          marginTop: 20,
                          background: '#355e3b',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: 8,
                          padding: '11px 16px',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(53, 94, 59, 0.2)'
                        }}
                      >
                        <FileText size={15} />
                        Download Digital Patta Title
                      </button>
                    )}
                  </div>

                  {/* Welfare Eligibility Card */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #c8dcd0',
                    borderRadius: 14,
                    padding: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 800, color: '#132a13' }}>
                      Pre-Qualified Welfare Schemes
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: 11.5, color: '#64748b', lineHeight: 1.4 }}>
                      Upon successful grant of the land title deed, the claimant qualifies for the following central and state integration schemes:
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { name: 'PM-KISAN', check: trackedRecord.form_type?.includes('A') && trackedRecord.status === 'Title Granted', desc: '₹6,000 annual direct income support for individual title holders.' },
                        { name: 'MGNREGA', check: true, desc: '100 days wage employment guarantee card linked to forest plot.' },
                        { name: 'PMAY-G (Housing)', check: trackedRecord.form_type?.includes('A') && trackedRecord.status === 'Title Granted', desc: 'Financial support for pucca house building.' },
                        { name: 'Jal Jeevan Mission', check: trackedRecord.form_type?.includes('B') || trackedRecord.form_type?.includes('C'), desc: 'Piped drinking water link for community rights areas.' }
                      ].map(s => (
                        <div key={s.name} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '8px 12px',
                          background: s.check ? '#f0fdf4' : '#f8fafc',
                          borderLeft: `3px solid ${s.check ? '#22c55e' : '#cbd5e1'}`,
                          borderRadius: '0 6px 6px 0'
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: s.check ? '#166534' : '#64748b' }}>{s.name}</span>
                          <p style={{ margin: 0, fontSize: 10, color: '#475569', lineHeight: 1.3 }}>{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Dynamic Progress Stepper */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #c8dcd0',
                  borderRadius: 14,
                  padding: 30,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ borderBottom: '1.5px solid #edf5ed', paddingBottom: 12, marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Application Stepper Timeline</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: 11.5, color: '#64748b' }}>
                      Enlarged workflow steps representing verification checkpoints.
                    </p>
                  </div>
                  <ClaimStepper record={trackedRecord} />
                </div>

              </div>
            ) : (
              trackQuery.length < 2 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  background: 'rgba(255,255,255,0.4)',
                  border: '1px dashed #cbdcce',
                  borderRadius: 16,
                  textAlign: 'center',
                  color: '#4a7c59'
                }}>
                  <span style={{ fontSize: 48, marginBottom: 12 }}>🔍</span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Search for your application status</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748b' }}>
                    Type your claimant name or Patta ID in the search box above to get started.
                  </p>
                </div>
              )
            )}
          </div>
        )}

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
            userMode={userMode}
            jurisdiction={loggedInOfficer?.jurisdiction}
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
            jurisdiction={loggedInOfficer?.jurisdiction}
            loggedInOfficer={loggedInOfficer}
          />
        )}

        {/* VIEW: Analytics Dashboard */}
        {view === 'analytics' && (
          <Analytics onBack={() => setView('map')} />
        )}

        {/* VIEW: Decision Support System */}
        {view === 'dss' && (
          <DSS onBack={() => setView('map')} jurisdiction={loggedInOfficer?.jurisdiction} />
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

      {/* ── LOGIN MODAL ────────────────────────────────────── */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </div>
  )
}
