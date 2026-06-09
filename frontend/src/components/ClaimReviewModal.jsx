import { useState, useEffect } from 'react';
import axios from 'axios';
import { validateClaim, getConflictDetails } from '../utils/ClaimValidator.js';
import { CheckCircle, AlertTriangle, ShieldCheck, Save, X } from 'lucide-react';

const API = 'http://localhost:8000';

const STATUSES = [
  'Claim Filed',
  'Gram Sabha Resolved',
  'Under Verification',
  'SDLC Approved',
  'DLC Approved',
  'Title Granted',
  'Rejected'
];

export default function ClaimReviewModal({ record, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('gs');
  const [status, setStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [gramSabhaDate, setGramSabhaDate] = useState('');
  const [sdlcDate, setSdlcDate] = useState('');
  const [dlcDate, setDlcDate] = useState('');
  const [titleDate, setTitleDate] = useState('');
  
  const [gsReport, setGsReport] = useState('');
  const [gsDocName, setGsDocName] = useState('');
  
  const [sdlcReport, setSdlcReport] = useState('');
  const [sdlcDocName, setSdlcDocName] = useState('');
  
  const [dlcReport, setDlcReport] = useState('');
  const [dlcDocName, setDlcDocName] = useState('');
  
  const [titleReport, setTitleReport] = useState('');
  const [titleDocName, setTitleDocName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audit, setAudit] = useState(null);
  const [showConflictPopup, setShowConflictPopup] = useState(false);

  const acres = parseFloat(record?.claim_area_acres || 0);
  const ha = parseFloat(record?.claim_area_ha || (acres * 0.404686));
  const conflictDetails = getConflictDetails(record);

  useEffect(() => {
    if (record) {
      setStatus(record.status || 'Claim Filed');
      setRejectionReason(record.rejection_reason || '');
      setGramSabhaDate(record.gram_sabha_date || '');
      setSdlcDate(record.sdlc_date || '');
      setDlcDate(record.dlc_date || '');
      setTitleDate(record.title_date || '');
      
      setGsReport(record.gs_report || '');
      setGsDocName(record.gs_document || '');
      
      setSdlcReport(record.sdlc_report || '');
      setSdlcDocName(record.sdlc_document || record.uploaded_document || '');
      
      setDlcReport(record.dlc_report || '');
      setDlcDocName(record.dlc_document || '');
      
      setTitleReport(record.title_report || '');
      setTitleDocName(record.title_document || '');
      
      setAudit(validateClaim(record));
    }
  }, [record]);

  // Dynamically update the validator when dates change
  useEffect(() => {
    if (record) {
      const mockRecord = {
        ...record,
        status,
        gram_sabha_date: gramSabhaDate,
        sdlc_date: sdlcDate,
        dlc_date: dlcDate,
        title_date: titleDate
      };
      setAudit(validateClaim(mockRecord));
    }
  }, [status, gramSabhaDate, sdlcDate, dlcDate, titleDate]);

  if (!record) return null;

  const handleSave = () => {
    setLoading(true);
    setError('');

    const payload = {
      status,
      rejection_reason: status === 'Rejected' ? rejectionReason : null,
      gram_sabha_date: gramSabhaDate || null,
      sdlc_date: sdlcDate || null,
      dlc_date: dlcDate || null,
      title_date: status === 'Title Granted' ? (titleDate || new Date().toISOString().split('T')[0]) : (titleDate || null),
      
      gs_report: gsReport || null,
      gs_document: gsDocName || null,
      
      sdlc_report: sdlcReport || null,
      sdlc_document: sdlcDocName || null,
      uploaded_document: sdlcDocName || null,
      
      dlc_report: dlcReport || null,
      dlc_document: dlcDocName || null,
      
      title_report: titleReport || null,
      title_document: titleDocName || null
    };

    axios.post(`${API}/api/fra/record/${record.patta_id}/review`, payload)
      .then(res => {
        setLoading(false);
        onSave(res.data);
        onClose();
      })
      .catch(err => {
        setLoading(false);
        setError(err.response?.data?.detail || 'Failed to update record. Please try again.');
      });
  };

  const selStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#333',
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box'
  };

  const lblStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    display: 'block'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9998,
    }}>
      <div style={{
        background: 'white',
        width: 780,
        height: '90vh',
        borderRadius: 12,
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        overflow: 'hidden',
        border: '1px solid #2d5a3d'
      }}>

        {/* Left Side: Audit Checklist & Legal Details */}
        <div style={{
          background: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <ShieldCheck size={18} color="#1a3a2a" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1a3a2a' }}>10-Point Legal Audit</h3>
          </div>
          <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
            Checks are run dynamically as dates, tribes, and statuses are adjusted. All criteria must pass for "Title Granted" status.
          </p>

          {audit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {audit.checks.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontSize: 11,
                    padding: '8px',
                    background: c.status === 'Pass' ? '#f0fdf4' : c.status === 'Fail' ? '#fef2f2' : '#fffbeb',
                    borderLeft: `3px solid ${c.status === 'Pass' ? '#22c55e' : c.status === 'Fail' ? '#ef4444' : '#f59e0b'}`,
                    borderRadius: '0 4px 4px 0'
                  }}
                >
                  <div style={{ marginTop: 1 }}>
                    {c.status === 'Pass' ? <CheckCircle size={12} color="#22c55e" /> : <AlertTriangle size={12} color={c.status === 'Fail' ? '#ef4444' : '#f59e0b'} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#334155' }}>{c.label}</div>
                    <div style={{ color: '#64748b', marginTop: 1, fontSize: 10 }}>{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Form Controls */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
            <div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b' }}>{record.patta_id}</span>
              <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#1a3a2a' }}>Review Application</h3>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={lblStyle}>Applicant Name</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{record.claimant_name || 'Village Community'}</div>
              </div>
              <div>
                <a
                  href={`${API}/api/fra/record/${record.patta_id}/download-report`}
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: '#355e3b',
                    border: 'none',
                    color: '#e8c547',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: 'none',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(53, 94, 59, 0.15)'
                  }}
                >
                  📥 Audit Portfolio
                </a>
              </div>
            </div>

            <div>
              <span style={lblStyle}>Village & District</span>
              <div style={{ fontSize: 12, color: '#475569' }}>{record.village} · {record.district}</div>
            </div>

            <div style={{ height: 1, background: '#e2e8f0', margin: '2px 0' }} />

            {/* Status Select */}
            <div>
              <label style={lblStyle}>Application Status</label>
              <select style={selStyle} value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Rejection Reason */}
            {status === 'Rejected' && (
              <div>
                <label style={lblStyle}>Rejection Reason (Required)</label>
                <textarea
                  style={{ ...selStyle, height: 60, resize: 'none', fontFamily: 'inherit' }}
                  placeholder="State clear reasons for rejection (e.g. claim area exceeds limit, lack of occupancy evidence)..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            {/* Review Tabs Navigation */}
            <div>
              <span style={lblStyle}>Statutory Stage Checkpoints</span>
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 12 }}>
                {['gs', 'sdlc', 'dlc', 'title'].map(t => {
                  const isActive = activeTab === t;
                  const isCompleted = {
                    gs: !!gramSabhaDate,
                    sdlc: !!sdlcDate,
                    dlc: !!dlcDate,
                    title: !!titleDate
                  }[t];
                  const label = { 
                    gs: '1. Gram Sabha', 
                    sdlc: '2. SDLC', 
                    dlc: '3. DLC', 
                    title: '4. Title Deed' 
                  }[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActiveTab(t)}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        background: 'none',
                        border: 'none',
                        borderBottom: isActive ? '2px solid #1a3a2a' : '2px solid transparent',
                        color: isActive ? '#1a3a2a' : '#64748b',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      {isCompleted && <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 'bold' }}>✓ </span>}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Tab Panel */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeTab === 'gs' && (
                <>
                  <div>
                    <label style={lblStyle}>Gram Sabha Date</label>
                    <input type="date" style={selStyle} value={gramSabhaDate} onChange={e => setGramSabhaDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={lblStyle}>Gram Sabha Resolution Minutes Summary</label>
                    <textarea
                      style={{ ...selStyle, height: 60, resize: 'none', fontFamily: 'inherit' }}
                      placeholder="Enter resolution notes, attendance quorum count, or local community findings..."
                      value={gsReport}
                      onChange={e => setGsReport(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={lblStyle}>Attach Gram Sabha Resolution Document</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="file"
                        id="gsDocUpload"
                        style={{ display: 'none' }}
                        onChange={e => setGsDocName(e.target.files[0]?.name || '')}
                      />
                      <label
                        htmlFor="gsDocUpload"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          border: '1.5px dashed #cbdcce',
                          borderRadius: 6,
                          textAlign: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#355e3b',
                          cursor: 'pointer',
                          background: '#fff',
                          display: 'block'
                        }}
                      >
                        {gsDocName ? `📎 ${gsDocName}` : '📂 Choose Gram Sabha PDF'}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'sdlc' && (
                <>
                  <div>
                    <label style={lblStyle}>SDLC Approval Date</label>
                    <input type="date" style={selStyle} value={sdlcDate} onChange={e => setSdlcDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={lblStyle}>SDLC Joint Verification Report Details</label>
                    <textarea
                      style={{ ...selStyle, height: 60, resize: 'none', fontFamily: 'inherit' }}
                      placeholder="Enter SDLC inspection notes, boundary recommendation, or occupancy findings..."
                      value={sdlcReport}
                      onChange={e => setSdlcReport(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={lblStyle}>Attach SDLC Joint Field Inspection PDF</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="file"
                        id="sdlcDocUpload"
                        style={{ display: 'none' }}
                        onChange={e => setSdlcDocName(e.target.files[0]?.name || '')}
                      />
                      <label
                        htmlFor="sdlcDocUpload"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          border: '1.5px dashed #cbdcce',
                          borderRadius: 6,
                          textAlign: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#355e3b',
                          cursor: 'pointer',
                          background: '#fff',
                          display: 'block'
                        }}
                      >
                        {sdlcDocName ? `📎 ${sdlcDocName}` : '📂 Choose SDLC PDF'}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'dlc' && (
                <>
                  <div>
                    <label style={lblStyle}>DLC Approval Date</label>
                    <input type="date" style={selStyle} value={dlcDate} onChange={e => setDlcDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={lblStyle}>DLC Review/Resolution Summary</label>
                    <textarea
                      style={{ ...selStyle, height: 60, resize: 'none', fontFamily: 'inherit' }}
                      placeholder="Enter DLC meeting details, members consent, or final review notes..."
                      value={dlcReport}
                      onChange={e => setDlcReport(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={lblStyle}>Attach DLC Recommendation PDF</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="file"
                        id="dlcDocUpload"
                        style={{ display: 'none' }}
                        onChange={e => setDlcDocName(e.target.files[0]?.name || '')}
                      />
                      <label
                        htmlFor="dlcDocUpload"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          border: '1.5px dashed #cbdcce',
                          borderRadius: 6,
                          textAlign: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#355e3b',
                          cursor: 'pointer',
                          background: '#fff',
                          display: 'block'
                        }}
                      >
                        {dlcDocName ? `📎 ${dlcDocName}` : '📂 Choose DLC PDF'}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'title' && (
                <>
                  <div>
                    <label style={lblStyle}>Patta Title Date</label>
                    <input type="date" style={selStyle} value={titleDate} onChange={e => setTitleDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={lblStyle}>Title Deed Registration Details</label>
                    <textarea
                      style={{ ...selStyle, height: 60, resize: 'none', fontFamily: 'inherit' }}
                      placeholder="Enter registration book numbers, volume details, and surveyor signatures..."
                      value={titleReport}
                      onChange={e => setTitleReport(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={lblStyle}>Attach Registered Title Deed Certificate PDF</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="file"
                        id="titleDocUpload"
                        style={{ display: 'none' }}
                        onChange={e => setTitleDocName(e.target.files[0]?.name || '')}
                      />
                      <label
                        htmlFor="titleDocUpload"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          border: '1.5px dashed #cbdcce',
                          borderRadius: 6,
                          textAlign: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#355e3b',
                          cursor: 'pointer',
                          background: '#fff',
                          display: 'block'
                        }}
                      >
                        {titleDocName ? `📎 ${titleDocName}` : '📂 Choose Title Deed PDF'}
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Conflict Resolution Section */}
            {record.spatial_verify && !record.spatial_verify.boundary_valid && (
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color="#f59e0b" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>Spatial Conflict Detected</span>
                </div>
                <div style={{ fontSize: 10, color: '#b45309' }}>
                  This claim overlaps with a <strong>{record.spatial_verify.conflict_type}</strong> ({record.spatial_verify.overlap_percentage}%).
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setRejectionReason(`Spatial Conflict Resolved: ${record.spatial_verify.conflict_type} verified and within permissible limits. Site inspection completed on ${new Date().toLocaleDateString()}.`)}
                    style={{ background: 'white', border: '1px solid #f59e0b', color: '#92400e', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Flag as Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Rejected')}
                    style={{ background: '#f59e0b', border: 'none', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConflictPopup(true)}
                    style={{ background: '#1d4ed8', border: 'none', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Analyze Overlap
                  </button>
                </div>
              </div>
            )}


          </div>

          {/* Action Footer */}
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 20, paddingTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{ padding: '8px 16px', background: 'none', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || (status === 'Rejected' && !rejectionReason.trim())}
              style={{
                padding: '8px 16px',
                background: '#1a3a2a',
                border: 'none',
                color: '#e8c547',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: (loading || (status === 'Rejected' && !rejectionReason.trim())) ? 0.6 : 1
              }}
            >
              <Save size={13} />
              {loading ? 'Saving...' : 'Save Review'}
            </button>
          </div>

        </div>

      </div>

      {showConflictPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
        }}>
          <div style={{
            background: 'white',
            width: 680,
            borderRadius: 16,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: '#1e293b',
              padding: '16px 20px',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={18} color="#f59e0b" /> Spatial Boundary Conflict Report
              </h3>
              <button
                type="button"
                onClick={() => setShowConflictPopup(false)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                
                {/* Card 1: Claim Area Profile */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#166534', borderBottom: '1px solid #bbf7d0', paddingBottom: 6 }}>
                    📂 Claimed Plot Area Profile
                  </h4>
                  <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4, color: '#374151' }}>
                    <div><strong>Patta ID:</strong> {record.patta_id}</div>
                    <div><strong>Claimant:</strong> {record.claimant_name || 'Village Community'}</div>
                    <div><strong>Community:</strong> {record.tribal_community || 'OTFD'}</div>
                    <div><strong>Region:</strong> {record.village}, {record.district}</div>
                    <div><strong>Coordinates:</strong> {record.lat ? `${parseFloat(record.lat).toFixed(4)}, ${parseFloat(record.lng).toFixed(4)}` : 'N/A'}</div>
                    <div><strong>Total Area:</strong> {acres.toFixed(2)} Acres ({ha.toFixed(3)} Ha)</div>
                  </div>
                </div>

                {/* Card 2: Conflicting Overlap Zone */}
                <div style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#991b1b', borderBottom: '1px solid #fecaca', paddingBottom: 6 }}>
                    🚨 Conflicting Overlap Zone
                  </h4>
                  <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4, color: '#374151' }}>
                    <div><strong>Conflict Between:</strong></div>
                    <div style={{ paddingLeft: 6, color: '#991b1b', fontWeight: 700 }}>
                      • Claimant: {record.claimant_name || 'Village Community representative'}<br/>
                      • Forest Range: {conflictDetails?.division || 'Territorial Range Office'}<br/>
                      • Protected Zone: {conflictDetails?.sanctuary || 'National Sanctuary / Buffer Zone'}
                    </div>
                    <div><strong>Total Overlap:</strong> {record.spatial_verify?.overlap_percentage}% ({((acres * record.spatial_verify?.overlap_percentage) / 100).toFixed(2)} Acres)</div>
                    <div><strong>Eco Impact:</strong> {conflictDetails?.impact || 'Intersection with local reserved forests.'}</div>
                    <div><strong>Legal Rule:</strong> Section 4(2) Wild Life Protection & Conservation buffer limitations.</div>
                  </div>
                </div>

              </div>

              {/* Card 3: Recommended Action & Reasoning */}
              <div style={{
                background: '#fffbeb',
                border: '1.5px solid #fef3c7',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#92400e', borderBottom: '1px solid #fef3c7', paddingBottom: 6 }}>
                  ⚖️ Recommended Statutory Action & Reasoning
                </h4>
                <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.45 }}>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Required Decision Directive:</strong> {conflictDetails?.directive}
                  </div>
                  <div>
                    <strong>Legal Reasoning (under FRA 2006):</strong> {conflictDetails?.reasoning}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowConflictPopup(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#475569',
                    border: 'none',
                    borderRadius: 6,
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Acknowledge & Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
