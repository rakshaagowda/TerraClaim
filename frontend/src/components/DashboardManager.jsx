import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, MapPin, Eye, ShieldAlert, Award, Inbox, Clock, CheckCircle, Ban, ArrowUpRight } from 'lucide-react';

const API = 'http://localhost:8000';

export default function DashboardManager({ officer, darkMode, onReviewClaim, onLocateOnMap }) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'review', 'approved', 'rejected', 'escalated'
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, review: 0, approved: 0, rejected: 0, escalated: 0 });

  const designation = officer?.designation || '';
  const jurisdiction = officer?.jurisdiction || '';
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
        
        // 1. Filter by district jurisdiction (exempting state-wide roles)
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

  // Maps a claim to a dashboard category based on officer role and status
  const getClaimTabCategory = (c) => {
    if (c.status === 'Rejected') return 'rejected';
    
    // Check for escalation status
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

    return 'review'; // Fallback
  };

  const activeClaims = claims.filter(c => getClaimTabCategory(c) === activeTab);

  const getBadgeStyle = (form) => {
    const isA = form.includes('A');
    const isB = form.includes('B');
    return {
      fontSize: 9,
      fontWeight: 800,
      padding: '2px 6px',
      borderRadius: 4,
      background: isA ? '#eff6ff' : (isB ? '#faf5ff' : '#f0fdf4'),
      color: isA ? '#1d4ed8' : (isB ? '#7c3aed' : '#166534'),
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 24px', background: darkMode ? '#0f172a' : '#fafbfc', overflow: 'hidden', color: darkMode ? '#f8fafc' : '#1a1a1a' }}>
      
      {/* Top Welcome Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>
            Administrative Officer Dashboard
          </h2>
          <div style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#475569', marginTop: 3 }}>
            Role: <strong>{designation}</strong> &nbsp;|&nbsp; Jurisdiction: <strong>{jurisdiction}</strong>
          </div>
        </div>
        <button
          onClick={fetchClaims}
          style={{ padding: '6px 12px', background: darkMode ? '#1e293b' : '#e2e8f0', border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: darkMode ? '#f8fafc' : '#334155' }}
        >
          🔄 Refresh Ledger
        </button>
      </div>

      {/* Tabs list with counters */}
      <div style={{ display: 'flex', borderBottom: darkMode ? '2px solid #334155' : '2px solid #e2e8f0', marginBottom: 16, flexShrink: 0 }}>
        {[
          { id: 'pending', label: 'Pending Action', count: stats.pending, icon: <Inbox size={14} />, color: '#1d4ed8' },
          { id: 'review', label: 'Under Review', count: stats.review, icon: <Clock size={14} />, color: '#f59e0b' },
          { id: 'approved', label: 'Approved Claims', count: stats.approved, icon: <CheckCircle size={14} />, color: '#22c55e' },
          { id: 'rejected', label: 'Rejected Applications', count: stats.rejected, icon: <Ban size={14} />, color: '#ef4444' },
          { id: 'escalated', label: 'Escalated Cases', count: stats.escalated, icon: <ArrowUpRight size={14} />, color: '#a855f7' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 750,
                color: isActive ? tab.color : (darkMode ? '#94a3b8' : '#64748b'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderBottom: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              {tab.icon}
              {tab.label}
              <span style={{
                fontSize: 9.5,
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 10,
                background: isActive ? tab.color : (darkMode ? '#334155' : '#e2e8f0'),
                color: isActive ? 'white' : (darkMode ? '#cbd5e1' : '#475569')
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Claims List Grid */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: '#64748b' }}>
            Loading claim records...
          </div>
        ) : activeClaims.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            border: darkMode ? '2px dashed #334155' : '2px dashed #e2e8f0',
            borderRadius: 16,
            textAlign: 'center',
            color: '#64748b'
          }}>
            <span style={{ fontSize: 36, marginBottom: 10 }}>📋</span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: darkMode ? '#f8fafc' : '#1e293b' }}>No claims in this category</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: darkMode ? '#cbd5e1' : '#64748b' }}>
              There are no applications currently listed under "{activeTab}" for your level of review.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {activeClaims.map(c => (
              <div
                key={c.patta_id}
                style={{
                  background: darkMode ? '#1e293b' : 'white',
                  borderRadius: 12,
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                }}
                onClick={() => onReviewClaim(c)}
              >
                {/* Header ID & Form Type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 700 }}>
                    {c.patta_id}
                  </span>
                  <span style={getBadgeStyle(c.form_type)}>
                    {c.form_type}
                  </span>
                </div>

                {/* Claimant profile */}
                <div>
                  <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                    {c.claimant_name || 'Village Representative'}
                  </h4>
                  <div style={{ fontSize: 11, color: darkMode ? '#cbd5e1' : '#64748b', marginTop: 2 }}>
                    Tribe: <strong>{c.tribal_community || 'OTFD'}</strong>
                  </div>
                </div>

                {/* Location & Area details */}
                <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2, borderTop: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', paddingTop: 8, color: darkMode ? '#cbd5e1' : '#1a1a1a' }}>
                  <div>Village: <strong>{c.village}</strong></div>
                  <div>District: <strong>{c.district}</strong> · Taluk: <strong>{c.taluk}</strong></div>
                  <div>Area: <strong>{parseFloat(c.claim_area_acres || 0).toFixed(2)} Acres</strong></div>
                </div>

                {/* Conflict Warnings */}
                {c.has_conflict && (
                  <div style={{
                    background: '#fef2f2',
                    borderRadius: 6,
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#ef4444',
                    fontSize: 10,
                    fontWeight: 700
                  }}>
                    <ShieldAlert size={12} />
                    <span>Spatial Sanctuary Overlap Conflict</span>
                  </div>
                )}

                {/* Action Footer */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', borderTop: darkMode ? '1px solid #334155' : '1px solid #f1f5f9', paddingTop: 10 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLocateOnMap(c);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: darkMode ? '#334155' : '#f1f5f9',
                      border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      color: darkMode ? '#cbd5e1' : '#475569'
                    }}
                  >
                    <MapPin size={11} /> Locate Map
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReviewClaim(c);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: darkMode ? '#10b981' : '#355e3b',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      color: darkMode ? '#0f172a' : '#e8c547'
                    }}
                  >
                    <Eye size={11} /> Review Claim
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
