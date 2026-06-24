import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import axios from 'axios'
import { 
  Map, Database, BarChart3, Scale, Leaf, UserCheck, 
  Eye, Search, Award, FileText, CheckCircle2, ShieldAlert, 
  Sun, Moon, Bell, BellRing, Inbox, HelpCircle, User, 
  Lock, Settings, History, Sliders, FileDown
} from 'lucide-react'

// Imports of core sub-components
import Sidebar from './components/Sidebar.jsx'
import MapSidebar from './components/MapSidebar.jsx'
import PlotCard from './components/PlotCard.jsx'
import ClaimWorkspace from './components/ClaimWorkspace.jsx'
import PattaCertificate from './components/PattaCertificate.jsx'
import RecordsTable from './components/RecordsTable.jsx'
import Analytics from './components/Analytics.jsx'
import DSS from './components/DSS.jsx'
import Guide from './components/Guide.jsx'
import ClaimStepper from './components/ClaimStepper.jsx'
import LoginModal from './components/LoginModal.jsx'
import TribesInfo from './components/TribesInfo.jsx'
import DashboardManager from './components/DashboardManager.jsx'
import DetailDrawer from './components/DetailDrawer.jsx'

// Imports of new supporting components
import UsersPanel from './components/UsersPanel.jsx'
import AuditLogs from './components/AuditLogs.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import ReportsHub from './components/ReportsHub.jsx'

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

const API = 'http://localhost:8000'

// Configure global Axios request interceptor
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('officer_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const STATUS_COLOR = {
  'Title Granted': '#22c55e',
  'DLC Approved': '#a855f7',
  'SDLC Approved': '#3b82f6',
  'Under Verification': '#f59e0b',
  'Claim Filed': '#64748b',
  'Gram Sabha Resolved': '#06b6d4',
  'Rejected': '#ef4444',
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
  const [view, setView] = useState('applications') // Default public view is applications portal
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Theme states
  const [darkMode, setDarkMode] = useState(false)

  // Global Search states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [globalSearchResults, setGlobalSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Notifications states
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState('All')

  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loggedInOfficer, setLoggedInOfficer] = useState(null)

  const [userMode, setUserMode] = useState('public') // 'public', 'official'
  const [showDeed, setShowDeed] = useState(null)
  const [showReview, setShowReview] = useState(null)

  // Public Mode Tracking States (Dual-Factor Search)
  const [trackQuery, setTrackQuery] = useState('')
  const [trackVillage, setTrackVillage] = useState('')
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

  const fetchNotifications = () => {
    if (userMode !== 'official' || !loggedInOfficer) return
    const params = new URLSearchParams()
    params.append('role', loggedInOfficer.designation)
    params.append('jurisdiction', loggedInOfficer.jurisdiction)
    params.append('officer_id', loggedInOfficer.officer_id)
    
    axios.get(`${API}/api/fra/notifications?${params}`)
      .then(res => {
        setNotifications(res.data)
        setUnreadCount(res.data.filter(n => !n.is_read).length)
      })
      .catch(err => console.error(err))
  }

  const handleMarkRead = (id) => {
    axios.post(`${API}/api/fra/notifications/${id}/read`)
      .then(() => fetchNotifications())
      .catch(err => console.error(err))
  }

  const handleMarkAllRead = () => {
    if (!loggedInOfficer) return;
    const params = new URLSearchParams()
    params.append('role', loggedInOfficer.designation)
    params.append('jurisdiction', loggedInOfficer.jurisdiction)
    params.append('officer_id', loggedInOfficer.officer_id)
    
    axios.post(`${API}/api/fra/notifications/mark-all-read?${params}`)
      .then(() => fetchNotifications())
      .catch(err => console.error(err))
  }

  useEffect(() => {
    fetchNotifications()
    let interval
    if (userMode === 'official' && loggedInOfficer) {
      interval = setInterval(fetchNotifications, 10000)
    }
    return () => clearInterval(interval)
  }, [userMode, loggedInOfficer])

  // Apply dark mode styling to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

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
        setNewClaimant('');
        setNewTaluk('');
        setNewVillage('');
        setNewAcres('2.5');
        setTrackQuery(res.data.claimant_name);
        setTrackVillage(res.data.village);
      })
      .catch(err => {
        setSubmitLoading(false);
        setSubmitError(err.response?.data?.detail || 'Failed to submit claim. Please check your inputs.');
      });
  };

  // Load persisted session
  useEffect(() => {
    const savedToken = localStorage.getItem('officer_token')
    const savedOfficer = localStorage.getItem('officer_details')
    if (savedToken && savedOfficer) {
      const details = JSON.parse(savedOfficer)
      setIsAuthenticated(true)
      setLoggedInOfficer(details)
      setUserMode('official')
      setView('dashboard')
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
      officer_name: data.officer_name || 'Officer',
      designation: data.designation,
      jurisdiction: data.jurisdiction
    }))
    setIsAuthenticated(true)
    setLoggedInOfficer(data)
    setUserMode('official')
    setView('dashboard')
    setShowLoginModal(false)
  }

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('officer_token')
    localStorage.removeItem('officer_details')
    setIsAuthenticated(false)
    setLoggedInOfficer(null)
    setUserMode('public')
    setView('applications')
  }

  // Toggle default view when changing user role
  useEffect(() => {
    if (userMode === 'public') {
      setView('applications')
      setTrackedRecord(null)
      setTrackQuery('')
      setTrackVillage('')
      setTrackError('')
      setFilters({ district: '', form_type: '', status: '', tribe: '' })
    } else {
      setView('dashboard')
      if (loggedInOfficer?.jurisdiction) {
        setFilters(f => ({ ...f, district: loggedInOfficer.jurisdiction }))
      }
    }
  }, [userMode, loggedInOfficer])

  // Fetch stats
  const fetchStats = () => {
    axios.get(`${API}/api/fra/stats`).then(r => setStats(r.data))
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Init map
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

  // Fetch GeoJSON boundaries
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

  // Init Map Draw Tool
  const drawControl = useRef(null)
  useEffect(() => {
    if (!mapReady || !map.current) return
    if (drawControl.current) return

    if (!window.MapLibreGLDraw) {
      console.warn("MapLibreGLDraw not loaded yet, retrying...");
      const timer = setTimeout(() => fetchGeojson(), 1000);
      return () => clearTimeout(timer);
    }

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
        console.log('Polygon drawing completed:', data.features[0])
      }
    }

    map.current.on('draw.create', updateArea)
    map.current.on('draw.delete', updateArea)
    map.current.on('draw.update', updateArea)
  }, [mapReady])

  useEffect(() => {
    fetchGeojson()
  }, [mapReady, filters, userMode, loggedInOfficer])

  // Resize map
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

  // Render map boundary overlays
  function renderLayers(data) {
    const m = map.current
    if (!m || !m.isStyleLoaded()) {
      m.once('styledata', () => renderLayers(data))
      return
    }

    const layers = ['fra-points', 'fra-boundaries', 'fra-boundaries-outline', 'fra-overlaps', 'fra-overlaps-outline']
    layers.forEach(l => { if (m.getLayer(l)) m.removeLayer(l) })
    
    const sources = ['fra', 'fra-poly', 'fra-overlap']
    sources.forEach(s => { if (m.getSource(s)) m.removeSource(s) })

    const coloredFeatures = data.features.map(f => ({
      ...f,
      properties: { ...f.properties, color: STATUS_COLOR[f.properties.status] || '#aaa' }
    }))
    
    const coloredPoints = { ...data, features: coloredFeatures }
    const { polygons, overlaps } = convertPointsToPolygons(coloredPoints)

    m.addSource('fra', { type: 'geojson', data: coloredPoints })
    m.addSource('fra-poly', { type: 'geojson', data: polygons })
    m.addSource('fra-overlap', { type: 'geojson', data: overlaps })

    // Polygons
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
          11.5, 0.4
        ]
      }
    })

    m.addLayer({
      id: 'fra-boundaries-outline',
      type: 'line',
      source: 'fra-poly',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2.5,
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          9.5, 0.0,
          11.0, 1.0
        ]
      }
    })

    // Overlaps
    m.addLayer({
      id: 'fra-overlaps',
      type: 'fill',
      source: 'fra-overlap',
      paint: {
        'fill-color': '#ef4444',
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10.0, 0.0,
          12.0, 0.45
        ]
      }
    })

    m.addLayer({
      id: 'fra-overlaps-outline',
      type: 'line',
      source: 'fra-overlap',
      paint: {
        'line-color': '#dc2626',
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

    // Points
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
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          11.0, 0.85,
          13.0, 0.05
        ]
      }
    })

    const interactiveLayers = ['fra-points', 'fra-boundaries']
    interactiveLayers.forEach(layerId => {
      m.on('mouseenter', layerId, e => {
        m.getCanvas().style.cursor = 'pointer'
        const p = e.features[0].properties
        if (p.is_overlap) return
        
        popup.current
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:monospace;font-size:10px;color:#166534;font-weight:700">${p.patta_id}</div>
            <div style="font-size:13px;font-weight:700;margin:4px 0;color:var(--text-primary)">${p.village}</div>
            <div style="font-size:11px;color:var(--text-secondary)">${p.tribal_community} · ${p.district}</div>
            <div style="margin-top:6px;font-size:11px">
              <span style="color:${STATUS_COLOR[p.status]};font-weight:700">${p.status}</span>
              &nbsp;·&nbsp; ${p.claim_area_acres} ac
              ${p.has_conflict ? '<br/><span style="color:#ef4444;font-weight:700;display:inline-flex;align-items:center;gap:3px;margin-top:4px">⚠️ Boundary Overlap Conflict</span>' : ''}
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

  // Toggle base layers
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

  // Fly to claim location on map
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

  // Handle updates from claim review workflow
  function handleReviewSave(updatedRecord) {
    if (selected && selected.patta_id === updatedRecord.patta_id) {
      setSelected(updatedRecord)
    }
    fetchStats()
    fetchGeojson()
  }

  // Global search input key press
  useEffect(() => {
    if (!globalSearchQuery.trim() || !geojson) {
      setGlobalSearchResults([])
      return
    }
    const q = globalSearchQuery.toLowerCase()
    const matches = geojson.features.filter(f => 
      f.properties.patta_id.toLowerCase().includes(q) ||
      (f.properties.claimant_name && f.properties.claimant_name.toLowerCase().includes(q)) ||
      f.properties.village.toLowerCase().includes(q)
    )
    setGlobalSearchResults(matches.slice(0, 5))
  }, [globalSearchQuery, geojson])

  // Get Breadcrumb text depending on active view
  const getBreadcrumb = () => {
    switch (view) {
      case 'dashboard': return 'TerraClaim / Dashboard / Overview'
      case 'map': return 'TerraClaim / Spatial Map / Explorer'
      case 'database': return 'TerraClaim / Ledger Database / Records'
      case 'applications': return 'TerraClaim / Applications Portal / Submission'
      case 'verification': return 'TerraClaim / Verification Workspace / DSS matrix'
      case 'approvals': return 'TerraClaim / Audited Claims / Approved'
      case 'rejections': return 'TerraClaim / Audited Claims / Rejected'
      case 'reports': return 'TerraClaim / Reports Hub / Exporter'
      case 'analytics': return 'TerraClaim / Statistical Insights / Charts'
      case 'users': return 'TerraClaim / Committee Directory / Roster'
      case 'audit': return 'TerraClaim / Ledger Security / Cryptographic Audit'
      case 'settings': return 'TerraClaim / System Parameters / Configurations'
      default: return 'TerraClaim'
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      
      {/* LEFT SIDEBAR (Main navigation controller) */}
      <Sidebar 
        view={view}
        setView={setView}
        userMode={userMode}
        setUserMode={setUserMode}
        isAuthenticated={isAuthenticated}
        loggedInOfficer={loggedInOfficer}
        onLogout={handleLogout}
        onLogin={() => setShowLoginModal(true)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* RIGHT WORKSPACE COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* TOPnavbar HEADER */}
        <div 
          className="glass"
          style={{
            height: 'var(--navbar-height)',
            padding: '0 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            zIndex: 99
          }}
        >
          {/* Breadcrumbs */}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
            {getBreadcrumb()}
          </div>

          {/* Center search / Action tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            
            {/* Global Search Bar */}
            <div style={{ position: 'relative' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  background: 'var(--card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 10, 
                  padding: '6px 12px',
                  width: 280,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Search size={14} color="var(--text-secondary)" />
                <input 
                  type="text"
                  placeholder="Search by Patta ID, Claimant, Village..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    width: '100%'
                  }}
                  value={globalSearchQuery}
                  onChange={e => {
                    setGlobalSearchQuery(e.target.value)
                    setShowSearchResults(true)
                  }}
                  onFocus={() => setShowSearchResults(true)}
                />
              </div>

              {/* Dropdown search results */}
              {showSearchResults && globalSearchResults.length > 0 && (
                <div 
                  className="glass"
                  style={{
                    position: 'absolute',
                    top: 40,
                    left: 0,
                    width: '100%',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    background: 'var(--glass-bg)',
                    overflow: 'hidden'
                  }}
                >
                  {globalSearchResults.map(f => (
                    <div 
                      key={f.properties.patta_id}
                      onClick={() => {
                        flyTo({
                          patta_id: f.properties.patta_id,
                          lat: f.geometry.coordinates[1],
                          lng: f.geometry.coordinates[0]
                        })
                        setShowSearchResults(false)
                        setGlobalSearchQuery('')
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                        <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{f.properties.patta_id}</span>
                        <span style={{ color: STATUS_COLOR[f.properties.status] || '#aaa' }}>{f.properties.status.split(' ')[0]}</span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{f.properties.claimant_name || 'Village Community'}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{f.properties.village}, {f.properties.district} · {f.properties.claim_area_acres} ac</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications panel Bell */}
            {userMode === 'official' && loggedInOfficer && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    width: 34,
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {unreadCount > 0 ? <BellRing size={16} color="var(--warning)" style={{ animation: 'pulse 1s infinite' }} /> : <Bell size={16} />}
                </button>

                {showNotifications && (
                  <div 
                    className="glass"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 42,
                      width: 320,
                      maxHeight: 400,
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-xl)',
                      display: 'flex',
                      flexDirection: 'column',
                      zIndex: 10000,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
                      {['All', 'High', 'Medium', 'Low'].map(p => (
                        <button
                          key={p}
                          onClick={() => setNotificationFilter(p)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 800,
                            border: 'none',
                            cursor: 'pointer',
                            background: notificationFilter === p ? 'var(--primary)' : 'rgba(0,0,0,0.03)',
                            color: notificationFilter === p ? 'white' : 'var(--text-secondary)'
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 120 }}>
                      {notifications
                        .filter(n => notificationFilter === 'All' || n.priority === notificationFilter)
                        .length === 0 ? (
                        <div style={{ padding: '24px', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
                          No notifications found.
                        </div>
                      ) : (
                        notifications
                          .filter(n => notificationFilter === 'All' || n.priority === notificationFilter)
                          .map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                handleMarkRead(notif.id);
                                setShowNotifications(false);
                                if (notif.patta_id) {
                                  axios.get(`${API}/api/fra/record/${notif.patta_id}`).then(res => {
                                    setSelected(res.data);
                                    setShowReview(res.data);
                                  });
                                }
                              }}
                              style={{
                                padding: '10px 16px',
                                borderBottom: '1px solid var(--border)',
                                background: !notif.is_read ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                gap: 8,
                                alignItems: 'flex-start'
                              }}
                            >
                              <div style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: notif.priority === 'High' ? 'var(--danger)' : (notif.priority === 'Medium' ? 'var(--warning)' : 'var(--accent)'),
                                marginTop: 5,
                                flexShrink: 0
                              }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{notif.title}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>{notif.message}</div>
                                <div style={{ fontSize: 8.5, color: 'var(--text-secondary)', marginTop: 4 }}>{notif.created_at}</div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {darkMode ? <Sun size={16} color="var(--warning)" /> : <Moon size={16} />}
            </button>

            {/* Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
              <div 
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: 'rgba(22, 101, 52, 0.08)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  border: '1px solid var(--border)'
                }}
              >
                <User size={15} />
              </div>
            </div>

          </div>
        </div>

        {/* ACTIVE ROUTED VIEW AREA */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex' }}>
          
          {/* VIEW: Public / Submit Ingestion Portal */}
          {view === 'applications' && (
            <div style={{ flex: 1, padding: '24px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
              
              {/* Header Banner */}
              <div 
                className="glass-card"
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                  padding: '24px 32px',
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.7)' }}>
                  DIRECTORATE OF TRIBAL WELFARE · GOVERNMENT OF KARNATAKA
                </div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>
                  Forest Rights Act (FRA) Spatial Ledger
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: '#e8f5e9', maxWidth: 650, lineHeight: 1.45 }}>
                  Filing, tracking, and compliance verification node. Enter your claimant details below to trace verify local rights deeds.
                </p>
                <div style={{ position: 'absolute', right: 30, bottom: -20, opacity: 0.08, fontSize: 100, userSelect: 'none' }}>🌲</div>
              </div>

              {/* public Toggle Sub-Modes */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => { setPublicSubMode('track'); setSubmitSuccess(null); }}
                  style={{
                    padding: '8px 16px',
                    background: publicSubMode === 'track' ? 'var(--primary)' : 'var(--card)',
                    border: '1px solid var(--border)',
                    color: publicSubMode === 'track' ? 'white' : 'var(--text-secondary)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s'
                  }}
                >
                  🔍 Track Application Status
                </button>
                <button
                  type="button"
                  onClick={() => { setPublicSubMode('submit'); setTrackedRecord(null); }}
                  style={{
                    padding: '8px 16px',
                    background: publicSubMode === 'submit' ? 'var(--primary)' : 'var(--card)',
                    border: '1px solid var(--border)',
                    color: publicSubMode === 'submit' ? 'white' : 'var(--text-secondary)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s'
                  }}
                >
                  📝 File New Land Claim
                </button>
              </div>

              {/* Submode 1: Track */}
              {publicSubMode === 'track' && (
                <div 
                  className="glass-card"
                  style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={15} color="var(--primary)" />
                    <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: 0.5 }}>
                      Claimant Dual-Factor Verification
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 14, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Claimant Name</label>
                      <input
                        type="text"
                        disabled={trackLoading}
                        value={trackQuery}
                        onChange={e => setTrackQuery(e.target.value)}
                        placeholder="e.g. Basava"
                        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Village / Region</label>
                      <input
                        type="text"
                        disabled={trackLoading}
                        value={trackVillage}
                        onChange={e => setTrackVillage(e.target.value)}
                        placeholder="e.g. Birunani"
                        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none' }}
                      />
                    </div>

                    <button
                      onClick={handlePublicTrack}
                      disabled={trackLoading || !trackQuery.trim() || !trackVillage.trim()}
                      style={{
                        padding: '9px 20px',
                        background: 'var(--primary)',
                        border: 'none',
                        color: 'white',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        height: 38,
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {trackLoading ? 'Verifying...' : 'Verify & Track'}
                    </button>
                  </div>

                  {trackError && (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px', color: 'var(--danger)', fontSize: 11.5, fontWeight: 650 }}>
                      ⚠️ {trackError}
                    </div>
                  )}
                </div>
              )}

              {/* Submode 2: Submit */}
              {publicSubMode === 'submit' && (
                <form 
                  onSubmit={handleClaimSubmit} 
                  className="glass-card"
                  style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📝</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: 0.5 }}>
                      New Forest Rights Act (FRA) Registration
                    </span>
                  </div>

                  {submitError && (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px', color: 'var(--danger)', fontSize: 11.5, fontWeight: 650 }}>
                      ⚠️ {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div style={{ background: 'rgba(22, 101, 52, 0.06)', border: '1px solid rgba(22, 101, 52, 0.2)', borderRadius: 8, padding: 14, color: 'var(--success)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>✓ Application Registered Successfully!</div>
                      <div style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                        Assigned Patta ID: <strong style={{ fontFamily: 'monospace' }}>{submitSuccess.patta_id}</strong><br/>
                        • Claimant: {submitSuccess.claimant_name}<br/>
                        • Division: {submitSuccess.village} ({submitSuccess.district})
                      </div>
                      <button
                        type="button"
                        onClick={() => { setPublicSubMode('track'); handlePublicTrack(); }}
                        style={{ alignSelf: 'flex-start', marginTop: 6, background: 'var(--primary)', color: 'white', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Track Progress Now
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Claimant Full Name *</label>
                      <input required type="text" placeholder="e.g. Basava Gowda" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none' }} value={newClaimant} onChange={e => setNewClaimant(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tribe Community Category *</label>
                      <select style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none', cursor: 'pointer' }} value={newTribe} onChange={e => setNewTribe(e.target.value)}>
                        {TRIBES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Claim Category *</label>
                      <select style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none', cursor: 'pointer' }} value={newFormType} onChange={e => setNewFormType(e.target.value)}>
                        {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>District *</label>
                      <select style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none', cursor: 'pointer' }} value={newDistrict} onChange={e => setNewDistrict(e.target.value)}>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Claimed Area (Acres) *</label>
                      <input required type="number" step="0.01" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none' }} value={newAcres} onChange={e => setNewAcres(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Taluk / Division *</label>
                      <input required type="text" placeholder="e.g. Hunsur" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none' }} value={newTaluk} onChange={e => setNewTaluk(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Village / Panchayat *</label>
                      <input required type="text" placeholder="e.g. Kerehalli" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none' }} value={newVillage} onChange={e => setNewVillage(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Latitude *</label>
                      <input required type="number" step="0.000001" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none' }} value={newLat} onChange={e => setNewLat(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Longitude *</label>
                      <input required type="number" step="0.000001" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, padding: '9px 12px', outline: 'none' }} value={newLng} onChange={e => setNewLng(e.target.value)} />
                    </div>
                    <div>
                      <input type="file" id="newClaimDoc" style={{ display: 'none' }} onChange={e => setNewDocName(e.target.files[0]?.name || '')} />
                      <label htmlFor="newClaimDoc" style={{ display: 'block', padding: '9px', border: '1.5px dashed var(--primary)', borderRadius: 8, textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', background: 'var(--card)' }}>
                        {newDocName ? `📎 ${newDocName}` : '📂 Scanned PDF'}
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading}
                    style={{
                      alignSelf: 'flex-end',
                      padding: '10px 24px',
                      background: 'var(--primary)',
                      border: 'none',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      opacity: submitLoading ? 0.6 : 1,
                      marginTop: 4
                    }}
                  >
                    {submitLoading ? 'Registering...' : 'Register Claim'}
                  </button>
                </form>
              )}

              {/* Tracked details Stepper block */}
              {trackedRecord && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, alignItems: 'flex-start' }} className="fade-in">
                  
                  {/* Left block */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="glass-card" style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Claimant Profile</h3>
                        <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>{trackedRecord.patta_id}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                        <div>
                          <span style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Claimant</span>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{trackedRecord.claimant_name || 'Community Rep'}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <span style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Community</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{trackedRecord.tribal_community || 'ST'}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Form</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{trackedRecord.form_type}</span>
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Area</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{parseFloat(trackedRecord.claim_area_acres || 0).toFixed(1)} Acres</span>
                        </div>
                      </div>

                      {trackedRecord.status === 'Title Granted' && (
                        <button
                          onClick={() => setShowDeed(trackedRecord)}
                          style={{ width: '100%', marginTop: 16, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: 'var(--shadow-sm)' }}
                        >
                          <FileText size={13} /> Download Patta Title Deed
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right stepper */}
                  <div className="glass-card" style={{ padding: 24, background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Workflow Verification Timeline</h3>
                    <ClaimStepper record={trackedRecord} />
                  </div>

                </div>
              )}

            </div>
          )}

          {/* VIEW: WebGIS Map explorer */}
          <div style={{ display: view === 'map' ? 'flex' : 'none', width: '100%', height: '100%' }}>
            <MapSidebar
              stats={stats}
              filters={filters}
              setFilters={setFilters}
              geojson={geojson}
              onSelectRecord={setSelected}
              satellite={satellite}
              onToggleSatellite={toggleSatellite}
              onShowAnalytics={() => setView('analytics')}
              onShowDSS={() => setView('verification')}
              onFlyTo={flyTo}
              userMode={userMode}
              jurisdiction={loggedInOfficer?.jurisdiction}
            />
            <div ref={mapContainer} style={{ flex: 1, height: '100%', position: 'relative' }} />
            
            {/* Slide-out details drawer */}
            {selected && (
              <DetailDrawer
                record={selected}
                onClose={() => setSelected(null)}
                onPrintDeed={() => setShowDeed(selected)}
                onReviewClaim={(r) => setShowReview(r)}
                userMode={userMode}
              />
            )}
          </div>

          {/* VIEW: Dashboard Manager */}
          {view === 'dashboard' && (
            <DashboardManager
              officer={loggedInOfficer}
              darkMode={darkMode}
              onReviewClaim={(r) => {
                setSelected(r);
                setShowReview(r);
              }}
              onLocateOnMap={locateOnMap}
            />
          )}

          {/* VIEW: Claims Ledger Database */}
          {view === 'database' && (
            <RecordsTable
              userMode={userMode}
              onReviewClaim={(r) => {
                setSelected(r);
                setShowReview(r);
              }}
              onPrintDeed={(r) => setShowDeed(r)}
              onLocateOnMap={locateOnMap}
              filters={filters}
              setFilters={setFilters}
              jurisdiction={loggedInOfficer?.jurisdiction}
              loggedInOfficer={loggedInOfficer}
            />
          )}

          {/* VIEW: Approvals Ledger (Pre-filtered) */}
          {view === 'approvals' && (
            <RecordsTable
              userMode={userMode}
              onReviewClaim={(r) => {
                setSelected(r);
                setShowReview(r);
              }}
              onPrintDeed={(r) => setShowDeed(r)}
              onLocateOnMap={locateOnMap}
              filters={{ ...filters, status: 'Title Granted' }}
              setFilters={setFilters}
              jurisdiction={loggedInOfficer?.jurisdiction}
              loggedInOfficer={loggedInOfficer}
            />
          )}

          {/* VIEW: Rejections Ledger (Pre-filtered) */}
          {view === 'rejections' && (
            <RecordsTable
              userMode={userMode}
              onReviewClaim={(r) => {
                setSelected(r);
                setShowReview(r);
              }}
              onPrintDeed={(r) => setShowDeed(r)}
              onLocateOnMap={locateOnMap}
              filters={{ ...filters, status: 'Rejected' }}
              setFilters={setFilters}
              jurisdiction={loggedInOfficer?.jurisdiction}
              loggedInOfficer={loggedInOfficer}
            />
          )}

          {/* VIEW: Verification (Decision Support System Welfare Matrix) */}
          {view === 'verification' && (
            <DSS onBack={() => setView('dashboard')} jurisdiction={loggedInOfficer?.jurisdiction} />
          )}

          {/* VIEW: Analytics Panel */}
          {view === 'analytics' && (
            <Analytics />
          )}

          {/* VIEW: Users Directory */}
          {view === 'users' && (
            <UsersPanel />
          )}

          {/* VIEW: Cryptographic Audit Logs */}
          {view === 'audit' && (
            <AuditLogs />
          )}

          {/* VIEW: System Parameter Settings */}
          {view === 'settings' && (
            <SettingsPanel />
          )}

          {/* VIEW: Reports Hub */}
          {view === 'reports' && (
            <ReportsHub />
          )}

        </div>

      </div>

      {/* Deed Patta Certificate Modal */}
      {showDeed && (
        <PattaCertificate record={showDeed} onClose={() => setShowDeed(null)} />
      )}

      {/* Claim Workspace Review Modal */}
      {showReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(9, 13, 22, 0.45)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
          <div style={{ background: 'var(--card)', width: '95vw', height: '92vh', borderRadius: 20, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <ClaimWorkspace
              record={showReview}
              officer={loggedInOfficer}
              darkMode={darkMode}
              onClose={() => setShowReview(null)}
              onSave={handleReviewSave}
            />
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </div>
  )
}
