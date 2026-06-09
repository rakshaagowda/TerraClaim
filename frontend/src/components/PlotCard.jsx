import { useState, useEffect } from 'react';
import { validateClaim, getConflictDetails } from '../utils/ClaimValidator.js';
import { User, ShieldAlert, LineChart, Award, FileText, CheckCircle, AlertTriangle, HelpCircle, Activity } from 'lucide-react';
import ClaimStepper from './ClaimStepper.jsx';

const STATUS_COLOR = {
  'Title Granted': '#2e7d32',
  'DLC Approved': '#7c4dff',
  'SDLC Approved': '#1976d2',
  'Under Verification': '#ef6c00',
  'Claim Filed': '#78909c',
  'Gram Sabha Resolved': '#0097a7',
  'Rejected': '#c62828',
};

export default function PlotCard({ record, onClose, onPrintDeed, userMode, onReviewClaim }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [audit, setAudit] = useState(null);
  const [showConflictPopup, setShowConflictPopup] = useState(false);

  useEffect(() => {
    if (record) {
      setAudit(validateClaim(record));
    }
  }, [record]);

  if (!record) return null;

  const color = STATUS_COLOR[record.status] || '#aaa';
  const acres = parseFloat(record.claim_area_acres || 0);
  const ha = parseFloat(record.claim_area_ha || (acres * 0.404686));

  const isGranted = record.status === 'Title Granted';
  const isFormA = record.form_type?.includes('A');
  const isFormB = record.form_type?.includes('B');
  const isFormC = record.form_type?.includes('C');
  const isIFR = isFormA;
  const isCR = isFormB;
  const isCFR = isFormC;
  const PVTG = ['Soliga', 'Jenu Kuruba', 'Koraga', 'Paniyan', 'Malekudiya', 'Nayaka', 'Hasala'];
  const isPVTG = PVTG.includes(record.tribal_community);
  
  // Shared Satellite & GIS metrics
  const hashNum = parseInt(record.patta_id.replace(/\D/g, '') || '1');
  const ndviVal = 0.38 + ((hashNum * 17) % 45) / 100;
  const ndwiVal = 0.15 + ((hashNum * 31) % 40) / 100;
  const hasConflict = record.spatial_verify && !record.spatial_verify.boundary_valid;
  const conflictDetails = getConflictDetails(record);
  const isCultivationValid = isFormA ? ndviVal >= 0.42 : true;
  const isCanopyValid = (isFormC || isFormB) ? ndviVal >= 0.60 : true;

  const eligibleSchemes = [
    { name: 'PM-KISAN', icon: '🌾', check: isFormA && isGranted, desc: '₹6,000/year direct income support for individual title holder.' },
    { name: 'MGNREGA Special FRA Quota', icon: '🔨', check: true, desc: 'Legally guarantees 150 days of manual wage employment (versus 100 days for standard cards) linked directly to the forest plot.' },
    { name: 'Jal Jeevan Mission', icon: '💧', check: isFormB || isFormC, desc: 'Priority piped water link for Community Forest Rights village blocks.' },
    { name: 'PMAY-G (Housing Support)', icon: '🏠', check: isFormA && isGranted, desc: '₹1.3 Lakh financial assistance for building a permanent pucca house.' },
    { name: 'PMFBY (Crop Insurance)', icon: '🌿', check: isFormA && acres > 0, desc: 'Subsidized crop insurance for cultivation fields.' },
    { name: 'VDVK (Van Dhan Kendra)', icon: '🌲', check: isFormC, desc: 'Livelihood processing and minor forest produce cooperative support.' },
    { name: 'NSTFDC PVTG Micro-Loans', icon: '💰', check: isPVTG, desc: 'Subsidized enterprise loans under 4% interest rate for Soliga, Koraga, and Jenu Kuruba communities.' },
  ].filter(s => s.check);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        width: 520,
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
        border: '1px solid #c8dcd0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '85vh',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: '#355e3b',
          padding: '12px 18px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #a5d6a7'
        }}>
          <div>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#c8e6c9', fontWeight: 700 }}>{record.patta_id}</span>
            <h4 style={{ margin: '1px 0 0', fontSize: 15, fontWeight: 800 }}>{record.village} Plot</h4>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#c8dcd0', cursor: 'pointer', fontSize: 16, padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #cbdcce',
          background: '#edf5ed',
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          {[
            { id: 'profile', label: 'Profile', icon: <User size={11} /> },
            { id: 'status', label: 'Status', icon: <Activity size={11} /> },
            { id: 'satellite', label: 'Satellite', icon: <LineChart size={11} /> },
            { id: 'legal', label: 'Audit', icon: <ShieldAlert size={11} /> },
            { id: 'welfare', label: 'Welfare', icon: <Award size={11} /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                padding: '9px 2px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === t.id ? '#355e3b' : '#556a59',
                borderBottom: activeTab === t.id ? '2.5px solid #355e3b' : '2.5px solid transparent',
                fontWeight: activeTab === t.id ? 800 : 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                transition: 'all 0.1s'
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: 16, overflowY: 'auto', flex: 1, background: '#ffffff' }}>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: '#4a7c59', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Claimant</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#132a13' }}>{record.claimant_name || 'Community Representative'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#4a7c59', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Tribe Community</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#132a13' }}>{record.tribal_community || 'General Forest Dwellers'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#4a7c59', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Form Type</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#132a13' }}>{record.form_type}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#4a7c59', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>District & Taluk</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#132a13' }}>{record.district} · {record.taluk}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#4a7c59', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Claim Area</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#132a13' }}>{acres.toFixed(2)} ac ({ha.toFixed(3)} ha)</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#4a7c59', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Approval Status</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color }}>{record.status}</div>
                </div>
              </div>

              {record.rejection_reason && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 8, color: '#c62828', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Rejection Remarks</div>
                  <div style={{ fontSize: 10, color: '#b71c1c' }}>{record.rejection_reason}</div>
                </div>
              )}

              {record.digital_signature && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>🔒</span> CRYPTOGRAPHIC E-SIGN CERTIFIED
                  </div>
                  <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: 2 }}>
                    <strong>Signature Hash:</strong><br/>
                    {record.digital_signature}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 9, color: '#475569', marginTop: 2 }}>
                    <div><strong>Signed By:</strong> {record.signed_by}</div>
                    <div><strong>Signed On:</strong> {record.signature_date ? new Date(record.signature_date).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid #edf5ed', paddingTop: 10, display: 'flex', gap: 6 }}>
                {isGranted && (
                  <button
                    onClick={onPrintDeed}
                    style={{
                      flex: 1,
                      background: '#355e3b',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: 6,
                      padding: '8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    <FileText size={12} />
                    Print Title Deed
                  </button>
                )}
                 {userMode === 'official' && (
                  <button
                    onClick={() => onReviewClaim(record)}
                    style={{
                      flex: 1,
                      background: 'rgba(25, 118, 210, 0.08)',
                      border: '1px solid #1976d2',
                      color: '#1976d2',
                      borderRadius: 6,
                      padding: '8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Evaluate Status
                  </button>
                )}
                {(record.status === 'SDLC Approved' || record.status === 'DLC Approved' || record.status === 'Title Granted') && (
                  <a
                    href={`http://localhost:8000/api/fra/record/${record.patta_id}/download-report`}
                    download
                    style={{
                      flex: 1,
                      background: '#1e3a8a',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: 6,
                      padding: '8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      textDecoration: 'none',
                      boxShadow: '0 2px 4px rgba(30, 58, 138, 0.1)'
                    }}
                  >
                    <FileText size={12} />
                    Download JFI Report
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Status Tab (Enlarged progress stepper) */}
          {activeTab === 'status' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, color: '#4a5568', lineHeight: 1.4, marginBottom: 8 }}>
                Official statutory workflow timeline. Tracks administrative checkpoints under the **Forest Rights Rules, 2008**:
              </div>
              <ClaimStepper record={record} />
            </div>
          )}

          {/* Satellite Tab */}
          {activeTab === 'satellite' && (() => {
            let satScore = 98;
            if (hasConflict) satScore -= 30;
            if (!isCultivationValid) satScore -= 15;
            if (!isCanopyValid) satScore -= 15;
            satScore = Math.max(35, satScore);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Score Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: hasConflict ? '#fef2f2' : '#f0fdf4',
                  border: `1.5px solid ${hasConflict ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: 10,
                  padding: '12px 14px'
                }}>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: hasConflict ? '#991b1b' : '#166534', letterSpacing: 0.5 }}>
                      Satellite Verification Index
                    </span>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: hasConflict ? '#991b1b' : '#166534' }}>
                      {hasConflict ? '⚠️ Overlap Warning Flagged' : '✓ Sentinel-2 Signatures Validated'}
                    </h4>
                  </div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: hasConflict || !isCultivationValid ? '#ef4444' : '#10b981',
                    fontFamily: 'monospace'
                  }}>
                    {satScore}%
                  </div>
                </div>

                <div style={{ fontSize: 10.5, color: '#4a5568', lineHeight: 1.45 }}>
                  Simulated **Sentinel-2 L2A** remote-sensing curves representing vegetation health (**NDVI**) and surface water moisture (**NDWI**) for this plot bounds:
                </div>

                {/* NDVI Chart */}
                <div style={{ border: '1px solid #c8dcd0', borderRadius: 8, padding: 10, background: '#fcfdfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#2e7d32' }}>🌿 NDVI (Vegetation Index)</span>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', background: '#e8f5e9', color: '#2e7d32', padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>Mean: {ndviVal.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 60, position: 'relative' }}>
                    <svg width="100%" height="100%" viewBox="0 0 320 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#81c784" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#81c784" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="20" x2="320" y2="20" stroke="#edf5ed" strokeDasharray="3,3" />
                      <line x1="0" y1="50" x2="320" y2="50" stroke="#edf5ed" strokeDasharray="3,3" />
                      <path d="M 0 80 Q 40 10, 80 50 T 160 20 T 240 60 T 320 15 L 320 80 Z" fill="url(#ndviGrad)" />
                      <path d="M 0 80 Q 40 10, 80 50 T 160 20 T 240 60 T 320 15" fill="none" stroke="#2e7d32" strokeWidth="2" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#718096', fontFamily: 'monospace', marginTop: 2 }}>
                    <span>2020</span>
                    <span>2023</span>
                    <span>2026 (Live)</span>
                  </div>
                </div>

                {/* NDWI Chart */}
                <div style={{ border: '1px solid #c8dcd0', borderRadius: 8, padding: 10, background: '#fcfdfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#1976d2' }}>💧 NDWI (Water Index)</span>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', background: '#e3f2fd', color: '#1976d2', padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>Mean: {ndwiVal.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 60, position: 'relative' }}>
                    <svg width="100%" height="100%" viewBox="0 0 320 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="ndwiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#64b5f6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#64b5f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="30" x2="320" y2="30" stroke="#edf5ed" strokeDasharray="3,3" />
                      <line x1="0" y1="60" x2="320" y2="60" stroke="#edf5ed" strokeDasharray="3,3" />
                      <path d="M 0 60 Q 40 40, 80 70 T 160 30 T 240 50 T 320 40 L 320 80 Z" fill="url(#ndwiGrad)" />
                      <path d="M 0 60 Q 40 40, 80 70 T 160 30 T 240 50 T 320 40" fill="none" stroke="#1976d2" strokeWidth="2" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#718096', fontFamily: 'monospace', marginTop: 2 }}>
                    <span>2020</span>
                    <span>2023</span>
                    <span>2026 (Live)</span>
                  </div>
                </div>

                {/* Audit Checklist */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                  <div style={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', fontSize: 9.5, letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 4 }}>
                    Satellite-Eligibility Audit Checks
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>• Active self-cultivation signature (IFR NDVI &gt; 0.42):</span>
                    <span style={{ fontWeight: 800, color: isCultivationValid ? '#166534' : '#c62828' }}>
                      {isIFR ? (isCultivationValid ? `CONFIRMED (${ndviVal.toFixed(2)})` : `NOT DETECTED (${ndviVal.toFixed(2)})`) : `N/A (CFR Claim)`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>• Canopy thickness validation (CFR NDVI &gt; 0.60):</span>
                    <span style={{ fontWeight: 800, color: isCanopyValid ? '#166534' : '#ef6c00' }}>
                      {(isCFR || isCR) ? (isCanopyValid ? `CONFIRMED (${ndviVal.toFixed(2)})` : `MARGINAL (${ndviVal.toFixed(2)})`) : `N/A (IFR Claim)`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>• Overlap with wildlife reserves / protected forests:</span>
                    <span style={{ fontWeight: 800, color: hasConflict ? '#c62828' : '#166534' }}>
                      {hasConflict ? '⚠️ CONFLICT FOUND' : 'CLEAR (0.0%)'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* Legal Audit Tab */}
          {activeTab === 'legal' && audit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf5ed', paddingBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#355e3b' }}>FRA Legal Audit Compliance</span>
                <span style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: audit.score >= 80 ? '#2e7d32' : audit.score >= 50 ? '#ef6c00' : '#c62828',
                  fontFamily: 'monospace'
                }}>{audit.score}%</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {audit.checks.map(c => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                      fontSize: 10,
                      padding: '5px 7px',
                      background: c.status === 'Pass' ? '#f1f8f1' : c.status === 'Fail' ? '#fff5f5' : '#fffdf5',
                      borderLeft: `3px solid ${c.status === 'Pass' ? '#2e7d32' : c.status === 'Fail' ? '#c62828' : '#ef6c00'}`,
                      borderRadius: '0 4px 4px 0'
                    }}
                  >
                    <div style={{ marginTop: 1 }}>
                      {c.status === 'Pass' ? <CheckCircle size={10} color="#2e7d32" /> : c.status === 'Fail' ? <AlertTriangle size={10} color="#c62828" /> : <HelpCircle size={10} color="#ef6c00" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#2d4030' }}>{c.label}</div>
                      <div style={{ color: '#556a59', fontSize: 9 }}>{c.detail}</div>
                    </div>
                  </div>
                ))}

                {/* Spatial Boundary Overlay */}
                {record.spatial_verify && (
                  <div style={{ marginTop: 10, borderTop: '1px solid #edf5ed', paddingTop: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#1a301a', textTransform: 'uppercase', marginBottom: 6 }}>Boundary Conflict Audit</div>
                    <div style={{
                      padding: 10,
                      borderRadius: 8,
                      background: record.spatial_verify.boundary_valid ? '#f0fdf4' : '#fffbeb',
                      border: `1px solid ${record.spatial_verify.boundary_valid ? '#dcfce7' : '#fef3c7'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#374151' }}>Overlap: {record.spatial_verify.overlap_percentage}%</span>
                        <span style={{ fontSize: 9, fontWeight: 800, color: record.spatial_verify.boundary_valid ? '#166534' : '#92400e' }}>
                          {record.spatial_verify.resolution_status}
                        </span>
                      </div>
                      <div style={{ fontSize: 9, color: '#4b5563' }}>
                        Conflict Type: <strong>{record.spatial_verify.conflict_type}</strong>
                      </div>
                      {!record.spatial_verify.boundary_valid && (
                        <button
                          type="button"
                          onClick={() => setShowConflictPopup(true)}
                          style={{
                            marginTop: 8,
                            width: '100%',
                            padding: '6px',
                            background: '#d97706',
                            border: 'none',
                            borderRadius: 6,
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🔍 Analyze Spatial Overlap Report
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Welfare Tab */}
          {activeTab === 'welfare' && (() => {
            let dssScore = 0;
            if (record.tribal_community) dssScore += 20;
            if (ha <= 4.0) dssScore += 20;
            if (record.gram_sabha_date) dssScore += 15;
            if (record.sdlc_date) dssScore += 15;
            if (!hasConflict) dssScore += 15;
            if (isCultivationValid && isCanopyValid) dssScore += 15;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Score Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '12px 14px'
                }}>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                      DSS Eligibility Scorecard
                    </span>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                      Welfare Integration Readiness
                    </h4>
                  </div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: dssScore >= 80 ? '#10b981' : dssScore >= 50 ? '#f59e0b' : '#ef4444',
                    fontFamily: 'monospace'
                  }}>
                    {dssScore}/100
                  </div>
                </div>

                {/* Criteria Satisfied Checklist */}
                <div style={{ background: '#fcfdfc', border: '1.5px solid #cbdcce', borderRadius: 8, padding: 12, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 800, color: '#2d5a27', textTransform: 'uppercase', fontSize: 9.5, letterSpacing: 0.5, borderBottom: '1px dashed #cbdcce', paddingBottom: 4, marginBottom: 4 }}>
                    Satisfied Criteria Checklist
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>1. Scheduled Tribe (ST) Category:</span>
                    <span style={{ fontWeight: 800, color: record.tribal_community ? '#166534' : '#92400e' }}>
                      {record.tribal_community ? 'Pass (ST)' : 'Info (OTFD)'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>2. Ceiling Limit ({"<= 4"} Hectares):</span>
                    <span style={{ fontWeight: 800, color: ha <= 4.0 ? '#166534' : '#c62828' }}>
                      {ha <= 4.0 ? 'Pass' : 'Failed'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>3. Local Gram Sabha Resolution:</span>
                    <span style={{ fontWeight: 800, color: record.gram_sabha_date ? '#166534' : '#64748b' }}>
                      {record.gram_sabha_date ? 'Pass' : 'Pending'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>4. SDLC Recommendations:</span>
                    <span style={{ fontWeight: 800, color: record.sdlc_date ? '#166534' : '#64748b' }}>
                      {record.sdlc_date ? 'Pass' : 'Pending'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>5. Clear GIS Boundaries (No Overlaps):</span>
                    <span style={{ fontWeight: 800, color: !hasConflict ? '#166534' : '#c62828' }}>
                      {!hasConflict ? 'Pass' : 'Failed (Overlap)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>6. Satellite Signature Match (NDVI):</span>
                    <span style={{ fontWeight: 800, color: (isCultivationValid && isCanopyValid) ? '#166534' : '#ef6c00' }}>
                      {(isCultivationValid && isCanopyValid) ? 'Pass' : 'Marginal'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 10, color: '#4a5568', lineHeight: 1.4, borderBottom: '1px solid #edf5ed', paddingBottom: 4, marginTop: 4 }}>
                  DSS Central Welfare Scheme Eligibility Recommendations:
                </div>

                {eligibleSchemes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: '#718096', fontSize: 11 }}>
                    Welfare recommendations require "Title Granted" status. Currently Pending review.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {eligibleSchemes.map(s => (
                      <div
                        key={s.name}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: '10px 12px',
                          background: '#f1f8f1',
                          borderLeft: '3px solid #2e7d32',
                          borderRadius: '0 6px 6px 0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                        }}
                      >
                        <div style={{ fontSize: 16 }}>{s.icon}</div>
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 850, color: '#1a301a' }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: '#475569', marginTop: 2, lineHeight: 1.35 }}>{s.desc}</div>
                          <div style={{ fontSize: 9, color: '#2e7d32', fontWeight: 700, marginTop: 4 }}>
                            ✓ Trigger: Title is granted and constraints are satisfied.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

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
