import { useState, useEffect } from 'react';
import { validateClaim } from '../utils/ClaimValidator.js';
import { User, ShieldAlert, LineChart, Award, FileText, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

const STATUS_COLOR = {
  'Title Granted':       '#2e7d32',
  'DLC Approved':        '#7c4dff',
  'SDLC Approved':       '#1976d2',
  'Under Verification':  '#ef6c00',
  'Claim Filed':         '#78909c',
  'Gram Sabha Resolved': '#0097a7',
  'Rejected':            '#c62828',
};

export default function PlotCard({ record, onClose, onPrintDeed, userMode, onReviewClaim }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [audit, setAudit] = useState(null);

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
  const PVTG = ['Soliga','Jenu Kuruba','Koraga','Paniyan','Malekudiya','Nayaka','Hasala'];
  const isPVTG = PVTG.includes(record.tribal_community);

  const eligibleSchemes = [
    { name: 'PM-KISAN', icon: '🌾', check: isFormA && isGranted, desc: '₹6,000/year direct income support for farmers.' },
    { name: 'MGNREGA', icon: '🔨', check: true, desc: 'Universal 100 days guaranteed manual wage employment.' },
    { name: 'Jal Jeevan Mission', icon: '💧', check: isFormB || isFormC, desc: 'Priority functional tap water link for community villages.' },
    { name: 'PMAY-G (Housing)', icon: '🏠', check: isFormA && isGranted, desc: '₹1.3 Lakh housing assistance for rural title holders.' },
    { name: 'PMFBY (Crop Insurance)', icon: '🌿', check: isFormA && acres > 0, desc: 'Subsidized crop insurance for agricultural fields.' },
    { name: 'VDVK (Van Dhan Kendra)', icon: '🌲', check: isFormC, desc: 'Livelihood support & Minor Produce processing units.' },
    { name: 'NSTFDC Loan Support', icon: '💰', check: isPVTG, desc: 'Micro-enterprise and farm loans at subsidized interest (<4%).' },
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
        width: 440,
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
          { id: 'profile', label: 'Profile', icon: <User size={11}/> },
          { id: 'satellite', label: 'Satellite', icon: <LineChart size={11}/> },
          { id: 'legal', label: 'Audit', icon: <ShieldAlert size={11}/> },
          { id: 'welfare', label: 'Welfare', icon: <Award size={11}/> }
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
                  <FileText size={12}/>
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
            </div>
          </div>
        )}

        {/* Satellite Tab */}
        {activeTab === 'satellite' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, color: '#4a5568', lineHeight: 1.4 }}>
              Simulated **Sentinel-2 L2A** remote-sensing curves representing vegetation health (**NDVI**) and surface water (**NDWI**) for this plot:
            </div>

            {/* NDVI Chart */}
            <div style={{ border: '1px solid #c8dcd0', borderRadius: 6, padding: 8, background: '#fcfdfc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#2e7d32' }}>🌿 NDVI (Vegetation Index)</span>
                <span style={{ fontSize: 9, fontFamily: 'monospace', background: '#e8f5e9', color: '#2e7d32', padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>Mean: 0.68</span>
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
            <div style={{ border: '1px solid #c8dcd0', borderRadius: 6, padding: 8, background: '#fcfdfc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1976d2' }}>💧 NDWI (Water Index)</span>
                <span style={{ fontSize: 9, fontFamily: 'monospace', background: '#e3f2fd', color: '#1976d2', padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>Mean: 0.35</span>
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
          </div>
        )}

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
              {audit.checks.slice(0, 7).map(c => (
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
                    {c.status === 'Pass' ? <CheckCircle size={10} color="#2e7d32"/> : c.status === 'Fail' ? <AlertTriangle size={10} color="#c62828"/> : <HelpCircle size={10} color="#ef6c00"/>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#2d4030' }}>{c.label}</div>
                    <div style={{ color: '#556a59', fontSize: 9 }}>{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Welfare Tab */}
        {activeTab === 'welfare' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, color: '#4a5568', lineHeight: 1.4, borderBottom: '1px solid #edf5ed', paddingBottom: 6 }}>
              DSS Central Welfare Scheme Eligibility Recommendations:
            </div>

            {eligibleSchemes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#718096', fontSize: 11 }}>
                Welfare recommendations require "Title Granted" status. Currently Pending review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {eligibleSchemes.map(s => (
                  <div
                    key={s.name}
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: '8px 10px',
                      background: '#f1f8f1',
                      borderLeft: '3px solid #2e7d32',
                      borderRadius: '0 4px 4px 0'
                    }}
                  >
                    <div style={{ fontSize: 15 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a301a' }}>{s.name}</div>
                      <div style={{ fontSize: 9, color: '#4a5568', marginTop: 1 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  </div>
  );
}
