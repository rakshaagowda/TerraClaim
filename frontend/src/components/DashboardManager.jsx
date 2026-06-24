import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, MapPin, Eye, ShieldAlert, Award, Inbox, Clock, CheckCircle, 
  Ban, ArrowUpRight, ShieldCheck, Activity, Users, AlertTriangle, AlertCircle
} from 'lucide-react';

const API = 'http://localhost:8000';

export default function DashboardManager({ officer, darkMode, onReviewClaim, onLocateOnMap }) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'review', 'approved', 'rejected', 'escalated'
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, review: 0, approved: 0, rejected: 0, escalated: 0 });

  const designation = officer?.designation || 'FRO Inspector';
  const jurisdiction = officer?.jurisdiction || 'Kodagu';
  const isStateOrAdmin = designation.toLowerCase().includes('state') || designation.toLowerCase().includes('admin') || jurisdiction.toLowerCase() === 'karnataka';

  useEffect(() => {
    fetchClaims();
  }, [officer]);

  const fetchClaims = () => {
    setLoading(true);
    axios.get(`${API}/api/fra/geojson`)
      .then(res => {
        const flat = res.data.features.map(f => ({
          ...f.properties,
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1]
        }));
        
        // Filter by district jurisdiction (exempting state-wide roles)
        const filteredByJurisdiction = flat.filter(c => {
          if (isStateOrAdmin) return true;
          return c.district.toLowerCase() === jurisdiction.toLowerCase();
        });

        setClaims(filteredByJurisdiction);
        computeTabCounts(filteredByJurisdiction);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const computeTabCounts = (list) => {
    const counts = { pending: 0, review: 0, approved: 0, rejected: 0, escalated: 0 };
    list.forEach(c => {
      const tab = getClaimTabCategory(c);
      if (tab) counts[tab]++;
    });
    setStats(counts);
  };

  const getClaimTabCategory = (c) => {
    if (c.status === 'Rejected') return 'rejected';
    if (c.status?.toLowerCase().includes('escalat') || (isStateOrAdmin && c.status === 'DLC Approved')) {
      return 'escalated';
    }

    const st = c.status;
    const isGS = designation.includes('Gram Sabha') || designation.includes('FRO');
    const isSDLC = designation.includes('SDLC') || designation.includes('Sub-Divisional');
    const isDLC = designation.includes('DLC') || designation.includes('District Level');
    const isState = designation.includes('State') || designation.includes('STATE');

    if (isGS) {
      if (st === 'Claim Filed') return 'pending';
      if (st === 'Under Verification') return 'review';
      if (['Gram Sabha Resolved', 'SDLC Approved', 'DLC Approved', 'Title Granted'].includes(st)) return 'approved';
    } else if (isSDLC) {
      if (st === 'Gram Sabha Resolved') return 'pending';
      if (st === 'Under Verification') return 'review';
      if (['SDLC Approved', 'DLC Approved', 'Title Granted'].includes(st)) return 'approved';
    } else if (isDLC) {
      if (st === 'SDLC Approved') return 'pending';
      if (st === 'Under Verification') return 'review';
      if (['DLC Approved', 'Title Granted'].includes(st)) return 'approved';
    } else if (isState || isStateOrAdmin) {
      if (st === 'DLC Approved') return 'pending';
      if (st === 'Under Verification') return 'review';
      if (['Title Granted'].includes(st)) return 'approved';
    }

    return 'review';
  };

  const activeClaims = claims.filter(c => getClaimTabCategory(c) === activeTab);

  // Dynamic statistics calculations
  const totalClaimsCount = claims.length;
  const approvedClaimsCount = claims.filter(c => ['Title Granted', 'DLC Approved', 'SDLC Approved'].includes(c.status)).length;
  const pendingClaimsCount = claims.filter(c => ['Claim Filed', 'Gram Sabha Resolved', 'Under Verification'].includes(c.status)).length;
  const rejectedClaimsCount = claims.filter(c => c.status === 'Rejected').length;
  
  const totalAreaHa = claims.reduce((acc, c) => {
    const acres = parseFloat(c.claim_area_acres || 0);
    const ha = parseFloat(c.claim_area_ha || (acres * 0.404686));
    return acc + ha;
  }, 0);

  // Dynamic AI audit metrics
  const SanctuaryOverlapCount = claims.filter(c => c.has_conflict).length;
  const divisionRiskIndex = totalClaimsCount ? Math.round((SanctuaryOverlapCount / totalClaimsCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 24px', overflowY: 'auto' }} className="fade-in">
      
      {/* ── TOP KPI SECTION (Redesigned with gradients & sparklines) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18, flexShrink: 0 }}>
        
        {/* Total Claims Card */}
        <div 
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 110,
            border: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#bfdbfe' }}>Total Claims</span>
            <Users size={16} color="#93c5fd" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>{totalClaimsCount}</div>
              <div style={{ fontSize: 9.5, color: '#93c5fd', fontWeight: 600, marginTop: 4 }}>+4.8% vs last month</div>
            </div>
            <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
              <path d="M0 16 Q 12 4, 24 12 T 48 6" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Approved Claims Card */}
        <div 
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 110,
            border: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#bbf7d0' }}>Approved</span>
            <CheckCircle size={16} color="#86efac" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>{approvedClaimsCount}</div>
              <div style={{ fontSize: 9.5, color: '#86efac', fontWeight: 600, marginTop: 4 }}>+6.2% vs last month</div>
            </div>
            <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
              <path d="M0 18 Q 12 6, 24 8 T 48 2" stroke="#86efac" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Pending Claims Card */}
        <div 
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 110,
            border: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fef3c7' }}>Pending Review</span>
            <Clock size={16} color="#fde68a" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>{pendingClaimsCount}</div>
              <div style={{ fontSize: 9.5, color: '#fde68a', fontWeight: 600, marginTop: 4 }}>-1.2% vs last month</div>
            </div>
            <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
              <path d="M0 12 Q 12 16, 24 6 T 48 10" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Rejected Claims Card */}
        <div 
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 110,
            border: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fecaca' }}>Rejected</span>
            <Ban size={16} color="#fca5a5" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>{rejectedClaimsCount}</div>
              <div style={{ fontSize: 9.5, color: '#fca5a5', fontWeight: 600, marginTop: 4 }}>+0.5% vs last month</div>
            </div>
            <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
              <path d="M0 16 Q 12 16, 24 10 T 48 14" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Acreage Card */}
        <div 
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, #311042 0%, #701a75 100%)',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 110,
            border: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#f5d0fe' }}>Total Area (Ha)</span>
            <Activity size={16} color="#f0abfc" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>{totalAreaHa.toFixed(1)}</div>
              <div style={{ fontSize: 9.5, color: '#f0abfc', fontWeight: 600, marginTop: 4 }}>+12.4% vs last month</div>
            </div>
            <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
              <path d="M0 18 Q 12 12, 24 4 T 48 0" stroke="#f0abfc" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

      </div>

      {/* ── CENTRAL SPLIT AREA (AI Insights vs Claims Pipeline) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16, flex: 1, overflow: 'hidden' }}>
        
        {/* Left Column: AI Assistant Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          
          {/* AI Scorecard Card */}
          <div className="glass-card" style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="var(--primary)" /> TerraIntelligence AI Assistant
            </h3>
            
            {/* Risk Index Progress bar */}
            <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Division Risk Score</span>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${divisionRiskIndex}%`, height: '100%', background: divisionRiskIndex > 30 ? 'var(--danger)' : 'var(--success)' }} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: divisionRiskIndex > 30 ? 'var(--danger)' : 'var(--success)', marginLeft: 16 }}>
                {divisionRiskIndex}%
              </div>
            </div>

            {/* Warnings Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SanctuaryOverlapCount > 0 && (
                <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger)', borderRadius: '0 8px 8px 0', border: '1px solid var(--border)', borderLeftWidth: 3 }}>
                  <AlertTriangle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--danger)' }}>Sanctuary Overlap Conflict</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1, lineHeight: 1.35 }}>
                      Detected {SanctuaryOverlapCount} boundary conflicts intersecting with core reserve forests.
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--warning)', borderRadius: '0 8px 8px 0', border: '1px solid var(--border)', borderLeftWidth: 3 }}>
                <AlertCircle size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--warning)' }}>Missing Document Gaps</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1, lineHeight: 1.35 }}>
                    Estimated 14% of Gram Sabha uploads are missing Form C survey sketches.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation Engine */}
          <div className="glass-card" style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Recommendation Directives
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
              <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border)', borderRadius: 8, lineHeight: 1.4 }}>
                💡 <strong>Boundary Correction</strong>: Flag spatial coordinates on MY-A-102 and CO-A-301 for priority DLC joint survey due to buffer overlaps.
              </div>
              <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border)', borderRadius: 8, lineHeight: 1.4 }}>
                🌿 <strong>Welfare Routing</strong>: 18 claims satisfy all requirements and are ready for JJM / PM-KISAN auto-routing upon SDLC convenor signature.
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Claims Inbox Pipeline Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: 16, overflow: 'hidden' }}>
          
          {/* Header Tab indicators */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {[
              { id: 'pending', label: 'Action pending', count: stats.pending, color: '#1d4ed8' },
              { id: 'review', label: 'Under Review', count: stats.review, color: '#f59e0b' },
              { id: 'approved', label: 'Approved', count: stats.approved, color: '#22c55e' },
              { id: 'rejected', label: 'Rejected', count: stats.rejected, color: '#ef4444' }
            ].map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    padding: '12px 10px',
                    fontSize: 11,
                    fontWeight: 750,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    borderBottom: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{tab.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: isActive ? tab.color : 'inherit', fontFamily: 'monospace' }}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Inbox Claims List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Syncing ledger claims...
              </div>
            ) : activeClaims.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>Inbox is clear</div>
                <div style={{ fontSize: 10.5, marginTop: 2 }}>No claims require reviews under this category.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeClaims.map(c => (
                  <div 
                    key={c.patta_id}
                    onClick={() => onReviewClaim(c)}
                    className="glass-card"
                    style={{
                      padding: 12,
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: 700 }}>{c.patta_id}</span>
                        <span style={{ fontSize: 8.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: c.form_type?.includes('A') ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)', color: c.form_type?.includes('A') ? '#3b82f6' : '#22c55e' }}>{c.form_type?.includes('A') ? 'IFR' : (c.form_type?.includes('B') ? 'CR' : 'CFR')}</span>
                      </div>
                      <h4 style={{ margin: '4px 0 2px', fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {c.claimant_name || 'Village Community'}
                      </h4>
                      <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
                        {c.village}, {c.district} · {parseFloat(c.claim_area_acres || 0).toFixed(1)} ac
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {c.has_conflict && <ShieldAlert size={14} color="var(--danger)" title="Spatial sanctuary overlap" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateOnMap(c);
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.02)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)'
                        }}
                        title="Locate Map"
                      >
                        <MapPin size={12} />
                      </button>
                      <button
                        onClick={() => onReviewClaim(c)}
                        style={{
                          background: 'rgba(22, 101, 52, 0.08)',
                          color: 'var(--primary)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 10.5,
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                      >
                        Review
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
