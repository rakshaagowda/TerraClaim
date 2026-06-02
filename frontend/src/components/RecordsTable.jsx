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

export default function RecordsTable({ userMode, onReviewClaim, onPrintDeed, onLocateOnMap, filters, setFilters }) {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('patta_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const recordsPerPage = 12; // Adjusted to fit screen height

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
    if (filters?.district) {
      out = out.filter(r => r.district === filters.district);
    }
    if (filters?.form_type) {
      out = out.filter(r => r.form_type === filters.form_type);
    }
    if (filters?.status) {
      out = out.filter(r => r.status === filters.status);
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
  }, [records, search, filters, sortField, sortOrder]);

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
        <select style={selStyle} value={filters?.district || ''} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}>
          <option value="">All Districts</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
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
