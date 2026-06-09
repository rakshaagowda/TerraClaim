import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, ShieldAlert, FileText, MapPin, ChevronLeft, ChevronRight, Info } from 'lucide-react';

const API = 'http://localhost:8000';

const STATUS_COLOR = {
  'Title Granted':       '#2e7d32',
  'DLC Approved':        '#7c4dff',
  'SDLC Approved':       '#1976d2',
  'Under Verification':  '#ef6c00',
  'Claim Filed':         '#78909c',
  'Gram Sabha Resolved': '#0097a7',
  'Rejected':            '#c62828',
};

const DISTRICTS = ['Mysuru', 'Chamarajanagara', 'Shivamogga', 'Chikkamagaluru', 'Kodagu', 'Hassan'];
const TRIBES = ['Soliga', 'Jenu Kuruba', 'Nayaka', 'Betta Kuruba', 'Paniyan', 'Koraga', 'Malekudiya', 'Hasala', 'Hakki-Pikki', 'Iruliga', 'Yerava', 'Adi Kurumba'];
const STATUSES = Object.keys(STATUS_COLOR);
const FORMS = ['Form A (IFR)', 'Form B (CR)', 'Form C (CFR)'];

export default function RecordsTable({ userMode, onReviewClaim, onPrintDeed, onLocateOnMap, filters, setFilters, jurisdiction, loggedInOfficer }) {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'inbox' (My Pipeline Inbox) vs 'all' (Master Ledger)
  const [activeTab, setActiveTab] = useState(userMode === 'official' ? 'inbox' : 'all');
  
  // Bulk upload states
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [ingestMode, setIngestMode] = useState('bulk');
  const [manualClaim, setManualClaim] = useState({
    claimant_name: '',
    village: '',
    taluk: '',
    tribal_community: 'Soliga',
    claim_area_acres: '',
    form_type: 'Form A (IFR)',
    lat: '',
    lng: ''
  });

  // Filters state
  const [search, setSearch] = useState('');

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('patta_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const recordsPerPage = 12;

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    axios.get(`${API}/api/fra/geojson`)
      .then(res => {
        const flat = res.data.features.map(f => ({
          ...f.properties,
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1]
        }));
        setRecords(flat);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleBulkUpload = (isDemo = false) => {
    if (!selectedUploadFile && !isDemo) return;
    setUploading(true);
    setUploadStatus('');
    
    // Ingest 3 mock claims representing newly collected land claims for this district
    const mockClaims = [
      { claimant_name: 'Devaiah Gowda', village: 'Birunani', taluk: 'Virajpet', district: jurisdiction || 'Kodagu', tribal_community: 'Jenu Kuruba', claim_area_acres: 3.2, form_type: 'Form A (IFR)', lat: 12.12, lng: 75.82, status: 'Gram Sabha Resolved' },
      { claimant_name: 'Somanna K.', village: 'Birunani', taluk: 'Virajpet', district: jurisdiction || 'Kodagu', tribal_community: 'Soliga', claim_area_acres: 1.8, form_type: 'Form A (IFR)', lat: 12.14, lng: 75.84, status: 'Gram Sabha Resolved' },
      { claimant_name: 'Neela Soliga', village: 'Kerehalli', taluk: 'Hunsur', district: jurisdiction || 'Kodagu', tribal_community: 'Soliga', claim_area_acres: 4.5, form_type: 'Form C (CFR)', lat: 12.38, lng: 76.22, status: 'Gram Sabha Resolved' }
    ];

    const promises = mockClaims.map(c => axios.post(`${API}/api/fra/claim/submit`, c));

    Promise.all(promises)
      .then(responses => {
        setUploading(false);
        setUploadStatus(`Successfully ingested and registered ${responses.length} new land claims into the spatial ledger under ${jurisdiction || 'your district'} with status Gram Sabha Resolved.`);
        setSelectedUploadFile(null);
        fetchRecords(); // Reload the table
      })
      .catch(err => {
        setUploading(false);
        setUploadStatus('Bulk ingestion failed. Please verify spreadsheet columns and API status.');
      });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualClaim.claimant_name || !manualClaim.village || !manualClaim.taluk || !manualClaim.claim_area_acres || !manualClaim.lat || !manualClaim.lng) {
      setUploadStatus('Please fill all required fields.');
      return;
    }
    setUploading(true);
    setUploadStatus('');

    const payload = {
      ...manualClaim,
      district: jurisdiction || 'Kodagu',
      claim_area_acres: parseFloat(manualClaim.claim_area_acres),
      lat: parseFloat(manualClaim.lat),
      lng: parseFloat(manualClaim.lng),
      status: 'Gram Sabha Resolved' // Automatically seed at Gram Sabha Resolved so it shows up in SDLC pending
    };

    axios.post(`${API}/api/fra/claim/submit`, payload)
      .then(res => {
        setUploading(false);
        setUploadStatus(`Successfully registered new land claim (Patta ID: ${res.data.patta_id}) for ${payload.claimant_name} under Gram Sabha Resolved status.`);
        setManualClaim({
          claimant_name: '',
          village: '',
          taluk: '',
          tribal_community: 'Soliga',
          claim_area_acres: '',
          form_type: 'Form A (IFR)',
          lat: '',
          lng: ''
        });
        fetchRecords(); // Reload list
      })
      .catch(err => {
        setUploading(false);
        setUploadStatus('Failed to submit manual claim. ' + (err.response?.data?.detail || ''));
      });
  };

  const handleAutofillCoords = () => {
    const district = jurisdiction || 'Kodagu';
    let minLat, maxLat, minLng, maxLng;
    if (district === 'Kodagu') {
      minLat = 12.10; maxLat = 12.40; minLng = 75.70; maxLng = 75.95;
    } else if (district === 'Mysuru') {
      minLat = 12.15; maxLat = 12.45; minLng = 76.15; maxLng = 76.45;
    } else if (district === 'Chikkamagaluru') {
      minLat = 13.10; maxLat = 13.40; minLng = 75.50; maxLng = 75.80;
    } else {
      minLat = 12.00; maxLat = 13.00; minLng = 75.50; maxLng = 76.50;
    }
    const lat = (Math.random() * (maxLat - minLat) + minLat).toFixed(4);
    const lng = (Math.random() * (maxLng - minLng) + minLng).toFixed(4);
    setManualClaim(prev => ({ ...prev, lat, lng }));
  };

  const handleAutofillSampleDetails = () => {
    const district = jurisdiction || 'Kodagu';
    
    // Choose appropriate names and regions
    const names = ['Kariappa Gowda', 'Shivappa Soliga', 'Devi Kuruba', 'Somanna Yerava', 'Putta Hasala'];
    const name = names[Math.floor(Math.random() * names.length)];
    
    let village = 'Birunani';
    let taluk = 'Virajpet';
    if (district === 'Mysuru') {
      village = 'Kerehalli';
      taluk = 'Hunsur';
    } else if (district === 'Chikkamagaluru') {
      village = 'Khandya';
      taluk = 'Mudigere';
    } else if (district === 'Chamarajanagara') {
      village = 'Kyathedevaragudi';
      taluk = 'Yelandur';
    } else if (district === 'Shivamogga') {
      village = 'Shettihalli';
      taluk = 'Sagar';
    }
    
    const randomTribe = TRIBES[Math.floor(Math.random() * TRIBES.length)];
    const randomForm = FORMS[Math.floor(Math.random() * FORMS.length)];
    const acres = (Math.random() * 4.5 + 0.5).toFixed(2);
    
    // Generate random coordinates in jurisdiction bounds
    let minLat, maxLat, minLng, maxLng;
    if (district === 'Kodagu') {
      minLat = 12.10; maxLat = 12.40; minLng = 75.70; maxLng = 75.95;
    } else if (district === 'Mysuru') {
      minLat = 12.15; maxLat = 12.45; minLng = 76.15; maxLng = 76.45;
    } else if (district === 'Chikkamagaluru') {
      minLat = 13.10; maxLat = 13.40; minLng = 75.50; maxLng = 75.80;
    } else {
      minLat = 12.00; maxLat = 13.00; minLng = 75.50; maxLng = 76.50;
    }
    const lat = (Math.random() * (maxLat - minLat) + minLat).toFixed(4);
    const lng = (Math.random() * (maxLng - minLng) + minLng).toFixed(4);

    setManualClaim({
      claimant_name: name,
      village,
      taluk,
      tribal_community: randomTribe,
      claim_area_acres: acres,
      form_type: randomForm,
      lat,
      lng
    });
  };

  // Trigger filtering
  useEffect(() => {
    let out = [...records];

    if (search) {
      const q = search.toLowerCase();
      out = out.filter(r =>
        (r.patta_id && r.patta_id.toLowerCase().includes(q)) ||
        (r.claimant_name && r.claimant_name.toLowerCase().includes(q)) ||
        (r.village && r.village.toLowerCase().includes(q)) ||
        (r.taluk && r.taluk.toLowerCase().includes(q))
      );
    }

    if (userMode === 'official' && jurisdiction) {
      out = out.filter(r => r.district === jurisdiction);
    } else if (filters?.district) {
      out = out.filter(r => r.district === filters.district);
    }

    // Pipeline Stage Filter for "My Pipeline Inbox"
    if (userMode === 'official' && activeTab === 'inbox') {
      const designation = loggedInOfficer?.designation || '';
      if (designation.includes('FRO') || designation.includes('Forest Rights')) {
        out = out.filter(r => ['Claim Filed', 'DLC Approved'].includes(r.status));
      } else if (designation.includes('SDLC') || designation.includes('Sub-Divisional')) {
        out = out.filter(r => ['Gram Sabha Resolved', 'Under Verification'].includes(r.status));
      } else if (designation.includes('DLC') || designation.includes('District Level')) {
        out = out.filter(r => ['SDLC Approved'].includes(r.status));
      }
    } else {
      if (filters?.status) {
        out = out.filter(r => r.status === filters.status);
      }
    }

    if (filters?.form_type) {
      out = out.filter(r => r.form_type === filters.form_type);
    }
    if (filters?.tribe) {
      out = out.filter(r => r.tribal_community === filters.tribe);
    }

    out.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'claim_area_acres') {
        valA = parseFloat(valA || 0);
        valB = parseFloat(valB || 0);
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFiltered(out);
    setCurrentPage(1);
  }, [records, search, filters, activeTab, userMode, loggedInOfficer, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / recordsPerPage);

  const selStyle = {
    background: 'white',
    border: '1px solid #c8dcd0',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    color: '#2d4030',
    fontFamily: 'inherit',
    outline: 'none',
    minWidth: 110
  };

  const badgeStyle = (form) => {
    const isA = form.includes('A');
    const isB = form.includes('B');
    return {
      fontSize: 9,
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: 3,
      background: isA ? '#dbeafe' : isB ? '#ede9fe' : '#dcfce7',
      color: isA ? '#1e40af' : isB ? '#5b21b6' : '#166534',
    };
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f4f9f4',
      padding: '20px 24px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* Page Title & Explanation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a301a', margin: 0 }}>Claims Digitization Ledger</h2>
          <p style={{ fontSize: 11, color: '#4a7c59', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
            Master Administrative Records Database
          </p>
        </div>
        <div style={{
          background: '#e8f2e8',
          border: '1px solid #cbdcce',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 460
        }}>
          <Info size={16} color="#2e7d32" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#2d4030', lineHeight: 1.3 }}>
            <strong>Self-Explanatory Guide</strong>: View coordinates, track validation stages, and locate points. Switch role to <strong>Official</strong> (top-right) to unlock the 10-Point Legal Audit panel.
          </span>
        </div>
      </div>

      {/* View Tabs (Only visible in Official mode) */}
      {userMode === 'official' && (
        <div style={{ display: 'flex', borderBottom: '2px solid #cbdcce', marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => { setActiveTab('inbox'); setUploadStatus(''); }}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'inbox' ? '3px solid #1976d2' : '3px solid transparent',
              color: activeTab === 'inbox' ? '#1976d2' : '#556a59',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            📥 My Pipeline Inbox ({
              records.filter(r => {
                if (jurisdiction && r.district !== jurisdiction) return false;
                const des = loggedInOfficer?.designation || '';
                if (des.includes('FRO') || des.includes('Forest Rights')) return ['Claim Filed', 'DLC Approved'].includes(r.status);
                if (des.includes('SDLC') || des.includes('Sub-Divisional')) return ['Gram Sabha Resolved', 'Under Verification'].includes(r.status);
                if (des.includes('DLC') || des.includes('District Level')) return ['SDLC Approved'].includes(r.status);
                return false;
              }).length
            } Pending)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'all' ? '3px solid #2e7d32' : '3px solid transparent',
              color: activeTab === 'all' ? '#2e7d32' : '#556a59',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            📋 Master Digital Ledger ({
              records.filter(r => {
                if (jurisdiction && r.district !== jurisdiction) return false;
                return true;
              }).length
            } Total)
          </button>
        </div>
      )}

      {/* Bulk Claim Ingestion Section (Visible for SDLC Officers in Pipeline Inbox) */}
      {/* Bulk & Manual Claim Ingestion Section (Visible for SDLC Officers in Pipeline Inbox) */}
      {userMode === 'official' && activeTab === 'inbox' && (loggedInOfficer?.designation?.includes('SDLC') || loggedInOfficer?.designation?.includes('Sub-Divisional')) && (
        <div style={{
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #bbf7d0', paddingBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📤</span> SDLC Administrative Ingestion Panel
            </h3>
            
            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => { setIngestMode('bulk'); setUploadStatus(''); }}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: '1px solid #166534',
                  background: ingestMode === 'bulk' ? '#166534' : 'white',
                  color: ingestMode === 'bulk' ? 'white' : '#166534',
                  transition: 'all 0.1s'
                }}
              >
                📂 Ingest Spreadsheet
              </button>
              <button
                type="button"
                onClick={() => { setIngestMode('manual'); setUploadStatus(''); }}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: '1px solid #166534',
                  background: ingestMode === 'manual' ? '#166534' : 'white',
                  color: ingestMode === 'manual' ? 'white' : '#166534',
                  transition: 'all 0.1s'
                }}
              >
                ✍️ Register Single Claim
              </button>
            </div>
          </div>

          {ingestMode === 'bulk' ? (
            <div>
              <p style={{ margin: '0 0 12px 0', fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
                As a Sub-Divisional Committee Officer, you have exclusive authority to ingest newly collected land claims from village survey teams. Attach a claim spreadsheet (CSV or Excel) below to automatically populate coordinates and claimant records into the spatial database.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="file"
                    id="sdlcBulkUpload"
                    style={{ display: 'none' }}
                    onChange={e => {
                      setSelectedUploadFile(e.target.files[0]);
                      setUploadStatus('');
                    }}
                  />
                  <label
                    htmlFor="sdlcBulkUpload"
                    style={{
                      display: 'block',
                      padding: '10px',
                      border: '1.5px dashed #166534',
                      borderRadius: 6,
                      textAlign: 'center',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: '#166534',
                      cursor: 'pointer',
                      background: 'white'
                    }}
                  >
                    {selectedUploadFile ? `📎 Selected: ${selectedUploadFile.name}` : '📂 Choose Land Claims Spreadsheet (Excel/CSV)'}
                  </label>
                </div>
                
                {selectedUploadFile ? (
                  <button
                    type="button"
                    onClick={() => handleBulkUpload(false)}
                    disabled={uploading}
                    style={{
                      padding: '10px 20px',
                      background: '#166534',
                      border: 'none',
                      color: 'white',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: uploading ? 0.6 : 1
                    }}
                  >
                    {uploading ? 'Ingesting...' : 'Ingest Claims Registry'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBulkUpload(true)}
                    disabled={uploading}
                    style={{
                      padding: '10px 20px',
                      background: '#1565c0',
                      border: 'none',
                      color: 'white',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: uploading ? 0.6 : 1
                    }}
                  >
                    ⚡ Load Demo Spreadsheet Data
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#475569' }}>
                  Register a single claim directly. Jurisdictional district is locked to <strong>{jurisdiction || 'Kodagu'}</strong>.
                </span>
                <button
                  type="button"
                  onClick={handleAutofillSampleDetails}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd'
                  }}
                >
                  🪄 Autofill Sample Details
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {/* Claimant Name */}
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Claimant Name</label>
                  <input
                    type="text"
                    required
                    style={{ ...selStyle, width: '100%', minWidth: 'auto', marginTop: 3 }}
                    placeholder="e.g. Kariappa Gowda"
                    value={manualClaim.claimant_name}
                    onChange={e => setManualClaim(prev => ({ ...prev, claimant_name: e.target.value }))}
                  />
                </div>

                {/* Village */}
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Village</label>
                  <input
                    type="text"
                    required
                    style={{ ...selStyle, width: '100%', minWidth: 'auto', marginTop: 3 }}
                    placeholder="e.g. Birunani"
                    value={manualClaim.village}
                    onChange={e => setManualClaim(prev => ({ ...prev, village: e.target.value }))}
                  />
                </div>

                {/* Taluk */}
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Taluk</label>
                  <input
                    type="text"
                    required
                    style={{ ...selStyle, width: '100%', minWidth: 'auto', marginTop: 3 }}
                    placeholder="e.g. Virajpet"
                    value={manualClaim.taluk}
                    onChange={e => setManualClaim(prev => ({ ...prev, taluk: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1.2fr', gap: 10 }}>
                {/* Tribe */}
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Tribal Community</label>
                  <select
                    style={{ ...selStyle, width: '100%', minWidth: 'auto', marginTop: 3 }}
                    value={manualClaim.tribal_community}
                    onChange={e => setManualClaim(prev => ({ ...prev, tribal_community: e.target.value }))}
                  >
                    {TRIBES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Area */}
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Area (Acres)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    style={{ ...selStyle, width: '100%', minWidth: 'auto', marginTop: 3 }}
                    placeholder="e.g. 2.50"
                    value={manualClaim.claim_area_acres}
                    onChange={e => setManualClaim(prev => ({ ...prev, claim_area_acres: e.target.value }))}
                  />
                </div>

                {/* Form Type */}
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Form Type</label>
                  <select
                    style={{ ...selStyle, width: '100%', minWidth: 'auto', marginTop: 3 }}
                    value={manualClaim.form_type}
                    onChange={e => setManualClaim(prev => ({ ...prev, form_type: e.target.value }))}
                  >
                    {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* GPS Coordinates Helper */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleAutofillCoords}
                    style={{
                      padding: '6px',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      height: 30,
                      marginBottom: 1
                    }}
                  >
                    📍 Generate Coords
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'flex-end' }}>
                {/* Latitude */}
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    style={{ ...selStyle, width: '100%', minWidth: 'auto', marginTop: 3 }}
                    placeholder="e.g. 12.1456"
                    value={manualClaim.lat}
                    onChange={e => setManualClaim(prev => ({ ...prev, lat: e.target.value }))}
                  />
                </div>

                {/* Longitude */}
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    style={{ ...selStyle, width: '100%', minWidth: 'auto', marginTop: 3 }}
                    placeholder="e.g. 75.8234"
                    value={manualClaim.lng}
                    onChange={e => setManualClaim(prev => ({ ...prev, lng: e.target.value }))}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: '8px 16px',
                    background: '#166534',
                    border: 'none',
                    color: 'white',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: uploading ? 0.6 : 1,
                    height: 30
                  }}
                >
                  {uploading ? 'Registering...' : 'Register Claim'}
                </button>
              </div>
            </form>
          )}

          {uploadStatus && (
            <div style={{
              marginTop: 10,
              background: uploadStatus.includes('Successfully') ? '#e8f5e9' : '#ffebee',
              border: `1.5px solid ${uploadStatus.includes('Successfully') ? '#a5d6a7' : '#ffcdd2'}`,
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              color: uploadStatus.includes('Successfully') ? '#2e7d32' : '#c62828'
            }}>
              {uploadStatus}
            </div>
          )}
        </div>
      )}

      {/* Database Filters Bar */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        padding: '12px 16px',
        border: '1px solid #c8dcd0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#2d5a27', textTransform: 'uppercase' }}>
          <Filter size={12}/> Filter Claims
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
          <input
            style={{ ...selStyle, width: '100%', paddingLeft: 30 }}
            placeholder="Search claimant, ID, village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Select Dropdowns */}
        <select 
          disabled={userMode === 'official' && !!jurisdiction}
          style={selStyle} 
          value={(userMode === 'official' && jurisdiction) ? jurisdiction : (filters?.district || '')} 
          onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
        >
          {userMode === 'official' && jurisdiction ? (
            <option value={jurisdiction}>{jurisdiction} (Locked)</option>
          ) : (
            <>
              <option value="">All Districts</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </>
          )}
        </select>

        <select style={selStyle} value={filters?.form_type || ''} onChange={e => setFilters(f => ({ ...f, form_type: e.target.value }))}>
          <option value="">All Forms</option>
          {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select style={selStyle} value={filters?.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select style={selStyle} value={filters?.tribe || ''} onChange={e => setFilters(f => ({ ...f, tribe: e.target.value }))}>
          <option value="">All Tribes</option>
          {TRIBES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {(search || filters?.district || filters?.form_type || filters?.status || filters?.tribe) && (
          <button
            onClick={() => { setSearch(''); setFilters({ district: '', form_type: '', status: '', tribe: '' }); }}
            style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
          >
            ✕ Reset
          </button>
        )}
      </div>

      {/* Main Table Grid (Fits page layout) */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        border: '1px solid #c8dcd0',
        boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#355e3b', color: '#ffffff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, position: 'sticky', top: 0, zIndex: 10 }}>
                {[
                  { field: 'patta_id', label: 'Patta ID' },
                  { field: 'claimant_name', label: 'Claimant Name' },
                  { field: 'form_type', label: 'Form' },
                  { field: 'village', label: 'Village' },
                  { field: 'district', label: 'District' },
                  { field: 'tribal_community', label: 'Tribe' },
                  { field: 'claim_area_acres', label: 'Area (Ac)' },
                  { field: 'status', label: 'Status' }
                ].map(h => (
                  <th
                    key={h.field}
                    onClick={() => handleSort(h.field)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderRight: '1px solid #4a7c59',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {h.label}
                      {sortField === h.field && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                ))}
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading records...</td></tr>
              ) : currentRecords.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No claims matched the active filters.</td></tr>
              ) : currentRecords.map((r, i) => {
                const color = STATUS_COLOR[r.status] || '#aaa';
                const isGranted = r.status === 'Title Granted';
                return (
                  <tr
                    key={r.patta_id}
                    style={{
                      background: i % 2 === 0 ? 'white' : '#fcfdfc',
                      borderBottom: '1px solid #edf5ed',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <td style={{ padding: '8px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#355e3b' }}>{r.patta_id}</td>
                    <td style={{ padding: '8px 16px', fontWeight: 700 }}>{r.claimant_name || 'Village Community'}</td>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={badgeStyle(r.form_type)}>
                        {r.form_type?.includes('A') ? 'IFR' : r.form_type?.includes('B') ? 'CR' : 'CFR'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px' }}>{r.village || 'N/A'}</td>
                    <td style={{ padding: '8px 16px', color: '#4a5568' }}>{r.district}</td>
                    <td style={{ padding: '8px 16px', color: '#4a5568' }}>{r.tribal_community || 'OTFD'}</td>
                    <td style={{ padding: '8px 16px', fontFamily: 'monospace', fontWeight: 700 }}>{parseFloat(r.claim_area_acres || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '6px 16px', display: 'flex', gap: 6, justifyContent: 'center' }}>
                      
                      {/* Show on Map */}
                      <button
                        onClick={() => onLocateOnMap(r)}
                        title="Locate on Map"
                        style={{
                          background: '#f1f8f1',
                          border: '1px solid #cbdcce',
                          borderRadius: 4,
                          padding: '4px',
                          cursor: 'pointer',
                          color: '#2d5a27',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MapPin size={12}/>
                      </button>

                      {/* Print Certificate */}
                      <button
                        onClick={() => onPrintDeed(r)}
                        disabled={!isGranted}
                        title={isGranted ? "Print Title Deed" : "Deed unavailable (Title not granted)"}
                        style={{
                          background: isGranted ? '#e8f5e9' : '#fcfdfc',
                          border: `1px solid ${isGranted ? '#a5d6a7' : '#edf5ed'}`,
                          borderRadius: 4,
                          padding: '4px',
                          cursor: isGranted ? 'pointer' : 'not-allowed',
                          color: isGranted ? '#2e7d32' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FileText size={12}/>
                      </button>

                      {/* Download JFI report */}
                      {(r.status === 'SDLC Approved' || r.status === 'DLC Approved' || r.status === 'Title Granted') && (
                        <a
                          href={`${API}/api/fra/record/${r.patta_id}/download-report`}
                          download
                          title="Download JFI Report"
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: 4,
                            padding: '4px',
                            cursor: 'pointer',
                            color: '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none'
                          }}
                        >
                          <FileText size={12}/>
                        </a>
                      )}

                      {/* Review Status (Guarded by User Mode) */}
                      {userMode === 'official' && (
                        <button
                          onClick={() => onReviewClaim(r)}
                          title="Evaluate Claim"
                          style={{
                            background: 'rgba(25, 118, 210, 0.08)',
                            border: '1px solid #90caf9',
                            borderRadius: 4,
                            padding: '3px 6px',
                            cursor: 'pointer',
                            color: '#1565c0',
                            fontSize: 10,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <ShieldAlert size={11}/>
                          Review
                        </button>
                      )}

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{
            background: '#edf5ed',
            borderTop: '1px solid #c8dcd0',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#4a7c59'
          }}>
            <div>
              Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} claims
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  background: 'white',
                  border: '1px solid #cbdcce',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft size={13}/> Prev
              </button>
              <span style={{ fontWeight: 800, color: '#355e3b' }}>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  background: 'white',
                  border: '1px solid #cbdcce',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Next <ChevronRight size={13}/>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
