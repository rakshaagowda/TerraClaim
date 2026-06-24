import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, ShieldAlert, FileText, MapPin, ChevronLeft, ChevronRight, 
  Info, FileSpreadsheet, PlusCircle, CheckCircle, HelpCircle, ArrowUpDown, Download
} from 'lucide-react';

const API = 'http://localhost:8000';

const STATUS_COLOR = {
  'Title Granted':       '#22c55e',
  'DLC Approved':        '#a855f7',
  'SDLC Approved':       '#3b82f6',
  'Under Verification':  '#f59e0b',
  'Claim Filed':         '#64748b',
  'Gram Sabha Resolved': '#06b6d4',
  'Rejected':            '#ef4444',
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
    
    const mockClaims = [
      { claimant_name: 'Devaiah Gowda', village: 'Birunani', taluk: 'Virajpet', district: jurisdiction || 'Kodagu', tribal_community: 'Jenu Kuruba', claim_area_acres: 3.2, form_type: 'Form A (IFR)', lat: 12.12, lng: 75.82, status: 'Gram Sabha Resolved' },
      { claimant_name: 'Somanna K.', village: 'Birunani', taluk: 'Virajpet', district: jurisdiction || 'Kodagu', tribal_community: 'Soliga', claim_area_acres: 1.8, form_type: 'Form A (IFR)', lat: 12.14, lng: 75.84, status: 'Gram Sabha Resolved' },
      { claimant_name: 'Neela Soliga', village: 'Kerehalli', taluk: 'Hunsur', district: jurisdiction || 'Kodagu', tribal_community: 'Soliga', claim_area_acres: 4.5, form_type: 'Form C (CFR)', lat: 12.38, lng: 76.22, status: 'Gram Sabha Resolved' }
    ];

    const promises = mockClaims.map(c => axios.post(`${API}/api/fra/claim/submit`, c));

    Promise.all(promises)
      .then(responses => {
        setUploading(false);
        setUploadStatus(`Successfully ingested ${responses.length} land claims into ledger under ${jurisdiction || 'your district'}.`);
        setSelectedUploadFile(null);
        fetchRecords();
      })
      .catch(() => {
        setUploading(false);
        setUploadStatus('Bulk ingestion failed. Please verify API status.');
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
      status: 'Gram Sabha Resolved'
    };

    axios.post(`${API}/api/fra/claim/submit`, payload)
      .then(res => {
        setUploading(false);
        setUploadStatus(`Successfully registered claim (ID: ${res.data.patta_id}) for ${payload.claimant_name}.`);
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
        fetchRecords();
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

  const exportCSV = (recordsToExport) => {
    const headers = ['Patta ID', 'Claimant Name', 'Form Category', 'Village', 'Taluk', 'District', 'Tribe Community', 'Area (Acres)', 'Status'];
    const rows = recordsToExport.map(r => [
      r.patta_id, r.claimant_name || 'Village Community', r.form_type, r.village, r.taluk, r.district, r.tribal_community, r.claim_area_acres, r.status
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fra_claims_ledger_${activeTab}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / recordsPerPage);

  const selStyle = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12.5,
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    outline: 'none',
    minWidth: 110,
    cursor: 'pointer'
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 24px', overflow: 'hidden' }} className="fade-in">
      
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Claims Spatial Ledger</h2>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
            Master Administrative Records Database
          </p>
        </div>
        
        <div style={{ background: 'rgba(22, 101, 52, 0.05)', border: '1px solid rgba(22, 101, 52, 0.1)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 500 }}>
          <Info size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
            <strong>Ledger Guide</strong>: Audit coordinates, validation stages, and locate bounds. Switch role to <strong>Official</strong> to unlock checklist approvals.
          </span>
        </div>
      </div>

      {/* Tabs */}
      {userMode === 'official' && (
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 12, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => { setActiveTab('inbox'); setUploadStatus(''); }}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'inbox' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'inbox' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            📥 Pipeline Inbox ({
              records.filter(r => {
                if (jurisdiction && r.district !== jurisdiction) return false;
                const des = loggedInOfficer?.designation || '';
                if (des.includes('FRO')) return ['Claim Filed', 'DLC Approved'].includes(r.status);
                if (des.includes('SDLC')) return ['Gram Sabha Resolved', 'Under Verification'].includes(r.status);
                if (des.includes('DLC')) return ['SDLC Approved'].includes(r.status);
                return false;
              }).length
            } Actionable)
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'all' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            📋 Master Spatial Ledger ({
              records.filter(r => {
                if (jurisdiction && r.district !== jurisdiction) return false;
                return true;
              }).length
            } Total)
          </button>
        </div>
      )}

      {/* Ingestion Panel */}
      {userMode === 'official' && activeTab === 'inbox' && (loggedInOfficer?.designation?.includes('SDLC') || loggedInOfficer?.designation?.includes('Sub-Divisional')) && (
        <div 
          className="glass-card"
          style={{
            background: 'rgba(22, 101, 52, 0.03)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            boxShadow: 'var(--shadow-sm)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📤</span> SDLC Administrative Ingestion Panel
            </h3>
            
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => { setIngestMode('bulk'); setUploadStatus(''); }}
                style={{
                  padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                  border: '1px solid var(--primary)',
                  background: ingestMode === 'bulk' ? 'var(--primary)' : 'var(--card)',
                  color: ingestMode === 'bulk' ? 'white' : 'var(--primary)'
                }}
              >
                📂 Ingest Spreadsheet
              </button>
              <button
                type="button"
                onClick={() => { setIngestMode('manual'); setUploadStatus(''); }}
                style={{
                  padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                  border: '1px solid var(--primary)',
                  background: ingestMode === 'manual' ? 'var(--primary)' : 'var(--card)',
                  color: ingestMode === 'manual' ? 'white' : 'var(--primary)'
                }}
              >
                ✍️ Register Single Claim
              </button>
            </div>
          </div>

          {ingestMode === 'bulk' ? (
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                As an SDLC Officer, attach a claim spreadsheet to batch geocode coordinates and register claimant records.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input type="file" id="sdlcBulkUpload" style={{ display: 'none' }} onChange={e => { setSelectedUploadFile(e.target.files[0]); setUploadStatus(''); }} />
                  <label htmlFor="sdlcBulkUpload" style={{ display: 'block', padding: '10px', border: '1.5px dashed var(--primary)', borderRadius: 8, textAlign: 'center', fontSize: 11.5, fontWeight: 750, color: 'var(--primary)', cursor: 'pointer', background: 'var(--card)' }}>
                    {selectedUploadFile ? `📎 Selected: ${selectedUploadFile.name}` : '📂 Choose Land Claims Spreadsheet (Excel/CSV)'}
                  </label>
                </div>
                
                {selectedUploadFile ? (
                  <button type="button" onClick={() => handleBulkUpload(false)} disabled={uploading} style={{ padding: '10px 20px', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                    Ingest Ledger
                  </button>
                ) : (
                  <button type="button" onClick={() => handleBulkUpload(true)} disabled={uploading} style={{ padding: '10px 20px', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                    ⚡ Load Demo Spreadsheet
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Register single claim. District locked to <strong>{jurisdiction || 'Kodagu'}</strong>.
                </span>
                <button type="button" onClick={handleAutofillSampleDetails} style={{ padding: '4px 8px', fontSize: 10.5, fontWeight: 700, borderRadius: 4, cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  🪄 Autofill Sample Details
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <input type="text" required style={{ ...selStyle, width: '100%' }} placeholder="Claimant Name" value={manualClaim.claimant_name} onChange={e => setManualClaim(prev => ({ ...prev, claimant_name: e.target.value }))} />
                </div>
                <div>
                  <input type="text" required style={{ ...selStyle, width: '100%' }} placeholder="Village" value={manualClaim.village} onChange={e => setManualClaim(prev => ({ ...prev, village: e.target.value }))} />
                </div>
                <div>
                  <input type="text" required style={{ ...selStyle, width: '100%' }} placeholder="Taluk" value={manualClaim.taluk} onChange={e => setManualClaim(prev => ({ ...prev, taluk: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr auto', gap: 10, alignItems: 'center' }}>
                <select style={{ ...selStyle, width: '100%' }} value={manualClaim.tribal_community} onChange={e => setManualClaim(prev => ({ ...prev, tribal_community: e.target.value }))}>
                  {TRIBES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" step="0.01" required style={{ ...selStyle, width: '100%' }} placeholder="Acres" value={manualClaim.claim_area_acres} onChange={e => setManualClaim(prev => ({ ...prev, claim_area_acres: e.target.value }))} />
                <select style={{ ...selStyle, width: '100%' }} value={manualClaim.form_type} onChange={e => setManualClaim(prev => ({ ...prev, form_type: e.target.value }))}>
                  {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <button type="button" onClick={handleAutofillCoords} style={{ padding: '7px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer', background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  📍 Generate GPS
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <input type="number" step="0.0001" required style={{ ...selStyle, width: '100%' }} placeholder="Latitude" value={manualClaim.lat} onChange={e => setManualClaim(prev => ({ ...prev, lat: e.target.value }))} />
                <input type="number" step="0.0001" required style={{ ...selStyle, width: '100%' }} placeholder="Longitude" value={manualClaim.lng} onChange={e => setManualClaim(prev => ({ ...prev, lng: e.target.value }))} />
                <button type="submit" disabled={uploading} style={{ padding: '8px 16px', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? 'Registering...' : 'Register Claim Form'}
                </button>
              </div>
            </form>
          )}

          {uploadStatus && (
            <div style={{ marginTop: 10, background: uploadStatus.includes('Successfully') ? 'rgba(22, 101, 52, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${uploadStatus.includes('Successfully') ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: uploadStatus.includes('Successfully') ? 'var(--success)' : 'var(--danger)' }}>
              {uploadStatus}
            </div>
          )}
        </div>
      )}

      {/* Filters Bar */}
      <div 
        className="glass-card"
        style={{
          borderRadius: 12,
          padding: '10px 14px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          <Filter size={12}/> Filters
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
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

        {activeTab !== 'inbox' && (
          <select style={selStyle} value={filters?.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        <select style={selStyle} value={filters?.tribe || ''} onChange={e => setFilters(f => ({ ...f, tribe: e.target.value }))}>
          <option value="">All Tribes</option>
          {TRIBES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {(search || filters?.district || filters?.form_type || filters?.status || filters?.tribe) && (
          <button
            onClick={() => { setSearch(''); setFilters({ district: jurisdiction || '', form_type: '', status: '', tribe: '' }); }}
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
          >
            ✕ Clear
          </button>
        )}
        
        <button
          onClick={() => exportCSV(filtered)}
          style={{
            background: 'var(--primary)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 11.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginLeft: 'auto',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <FileSpreadsheet size={13}/>
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Ledger Table grid */}
      <div 
        className="glass"
        style={{
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
      >
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
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
                      borderRight: '1px solid var(--border)',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {h.label}
                      <ArrowUpDown size={11} color="var(--text-secondary)" />
                    </div>
                  </th>
                ))}
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading ledger records...</td></tr>
              ) : currentRecords.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>No claims match active search filters.</td></tr>
              ) : currentRecords.map((r, i) => {
                const color = STATUS_COLOR[r.status] || '#aaa';
                const isGranted = r.status === 'Title Granted';
                return (
                  <tr
                    key={r.patta_id}
                    style={{
                      background: i % 2 === 0 ? 'var(--card)' : 'rgba(0,0,0,0.01)',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background-color 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'var(--card)' : 'rgba(0,0,0,0.01)'}
                  >
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{r.patta_id}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>{r.claimant_name || 'Village Community'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span 
                        style={{
                          fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                          background: r.form_type?.includes('A') ? 'rgba(59, 130, 246, 0.1)' : r.form_type?.includes('B') ? 'rgba(139, 92, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: r.form_type?.includes('A') ? '#3b82f6' : r.form_type?.includes('B') ? '#8b5cf6' : '#22c55e',
                          border: `1px solid ${r.form_type?.includes('A') ? 'rgba(59, 130, 246, 0.2)' : r.form_type?.includes('B') ? 'rgba(139, 92, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                        }}
                      >
                        {r.form_type?.includes('A') ? 'IFR' : r.form_type?.includes('B') ? 'CR' : 'CFR'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 650 }}>{r.village || 'N/A'}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{r.district}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{r.tribal_community || 'OTFD'}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700 }}>{parseFloat(r.claim_area_acres || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px', display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                      
                      <button
                        onClick={() => onLocateOnMap(r)}
                        title="Locate on Map"
                        style={{
                          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28,
                          cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <MapPin size={13}/>
                      </button>

                      <button
                        onClick={() => onPrintDeed(r)}
                        disabled={!isGranted}
                        title={isGranted ? "Print Title Deed" : "Deed unavailable"}
                        style={{
                          background: isGranted ? 'rgba(34, 197, 94, 0.08)' : 'var(--card)',
                          border: `1px solid ${isGranted ? 'rgba(34, 197, 94, 0.2)' : 'var(--border)'}`,
                          borderRadius: 6, width: 28, height: 28,
                          cursor: isGranted ? 'pointer' : 'not-allowed',
                          color: isGranted ? 'var(--success)' : 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <FileText size={13}/>
                      </button>

                      {(r.status === 'SDLC Approved' || r.status === 'DLC Approved' || r.status === 'Title Granted') && (
                        <a
                          href={`${API}/api/fra/record/${r.patta_id}/download-report`}
                          download
                          title="Download JFI Report"
                          style={{
                            background: 'rgba(59, 130, 246, 0.08)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: 6, width: 28, height: 28,
                            cursor: 'pointer', color: '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            textDecoration: 'none', boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <Download size={13}/>
                        </a>
                      )}

                      {userMode === 'official' && (
                        <button
                          onClick={() => onReviewClaim(r)}
                          title="Evaluate Claim"
                          style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: 6, padding: '4px 10px',
                            cursor: 'pointer', color: 'var(--accent)',
                            fontSize: 10.5, fontWeight: 750,
                            display: 'flex', alignItems: 'center', gap: 4,
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <ShieldAlert size={12}/>
                          Evaluate
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
          <div 
            style={{
              background: 'rgba(0,0,0,0.02)',
              borderTop: '1px solid var(--border)',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-secondary)',
              flexShrink: 0
            }}
          >
            <div>
              Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} claims
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)'
                }}
              >
                <ChevronLeft size={13}/> Prev
              </button>
              <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)'
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
