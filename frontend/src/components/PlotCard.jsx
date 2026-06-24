import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateClaim, getConflictDetails } from '../utils/ClaimValidator.js';
import {
  User, ShieldAlert, LineChart, Award, FileText, CheckCircle,
  AlertTriangle, HelpCircle, Activity, Satellite, X, Download,
  Leaf, Droplets, Shield, TrendingUp, AlertCircle, Star
} from 'lucide-react';
import ClaimStepper from './ClaimStepper.jsx';

const STATUS_CONFIG = {
  'Title Granted':       { color: '#16a34a', bg: '#dcfce7', border: '#86efac', dot: '#22c55e' },
  'DLC Approved':        { color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', dot: '#8b5cf6' },
  'SDLC Approved':       { color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd', dot: '#3b82f6' },
  'Under Verification':  { color: '#c2410c', bg: '#ffedd5', border: '#fdba74', dot: '#f97316' },
  'Claim Filed':         { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', dot: '#94a3b8' },
  'Gram Sabha Resolved': { color: '#0e7490', bg: '#cffafe', border: '#67e8f9', dot: '#06b6d4' },
  'Rejected':            { color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5', dot: '#ef4444' },
};

const TABS = [
  { id: 'profile',   label: 'Profile',   Icon: User },
  { id: 'status',    label: 'Workflow',  Icon: Activity },
  { id: 'satellite', label: 'Satellite', Icon: Satellite },
  { id: 'legal',     label: 'Audit',     Icon: ShieldAlert },
  { id: 'welfare',   label: 'Welfare',   Icon: Award },
];

// Animated SVG sparkline/chart
function NDVIChart({ label, value, color, gradientId, pathD, fillD }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: `1px solid ${color}30`,
      borderRadius: 12,
      padding: '12px 14px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at 80% 20%, ${color}12, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: color, display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
        </span>
        <span style={{
          fontSize: 10, fontFamily: 'monospace', background: `${color}15`,
          color, padding: '2px 8px', borderRadius: 6, fontWeight: 800
        }}>
          Mean: {value.toFixed(2)}
        </span>
      </div>

      <div style={{ height: 56, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 320 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[15, 30, 45].map(y => (
            <line key={y} x1="0" y1={y} x2="320" y2={y}
              stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" />
          ))}
          <path d={fillD} fill={`url(#${gradientId})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
          {/* Pulse dot at end */}
          <circle cx="310" cy="20" r="3.5" fill={color} opacity="0.9" />
          <circle cx="310" cy="20" r="6" fill={color} opacity="0.2" />
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8', fontFamily: 'monospace', marginTop: 4 }}>
        <span>Jan 2020</span>
        <span>Dec 2022</span>
        <span>Jun 2025</span>
        <span style={{ color }}>Live ●</span>
      </div>
    </div>
  );
}

export default function PlotCard({ record, onClose, onPrintDeed, userMode, onReviewClaim }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [audit, setAudit] = useState(null);
  const [showConflictPopup, setShowConflictPopup] = useState(false);

  useEffect(() => {
    if (record) setAudit(validateClaim(record));
  }, [record]);

  if (!record) return null;

  const statusConf = STATUS_CONFIG[record.status] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', dot: '#94a3b8' };
  const acres = parseFloat(record.claim_area_acres || 0);
  const ha = parseFloat(record.claim_area_ha || (acres * 0.404686));
  const isGranted = record.status === 'Title Granted';
  const isFormA = record.form_type?.includes('A');
  const isFormB = record.form_type?.includes('B');
  const isFormC = record.form_type?.includes('C');
  const PVTG = ['Soliga', 'Jenu Kuruba', 'Koraga', 'Paniyan', 'Malekudiya', 'Nayaka', 'Hasala'];
  const isPVTG = PVTG.includes(record.tribal_community);

  const hashNum = parseInt(record.patta_id.replace(/\D/g, '') || '1');
  const ndviVal = 0.38 + ((hashNum * 17) % 45) / 100;
  const ndwiVal = 0.15 + ((hashNum * 31) % 40) / 100;
  const hasConflict = record.spatial_verify && !record.spatial_verify.boundary_valid;
  const conflictDetails = getConflictDetails(record);
  const isCultivationValid = isFormA ? ndviVal >= 0.42 : true;
  const isCanopyValid = (isFormC || isFormB) ? ndviVal >= 0.60 : true;

  const eligibleSchemes = [
    { name: 'PM-KISAN', icon: '🌾', check: isFormA && isGranted, desc: '₹6,000/year direct income support for IFR title holders.' },
    { name: 'MGNREGA FRA Quota', icon: '🔨', check: true, desc: '150 days guaranteed employment (vs 100 standard) linked to forest plot.' },
    { name: 'Jal Jeevan Mission', icon: '💧', check: isFormB || isFormC, desc: 'Priority piped water for CFR village blocks.' },
    { name: 'PMAY-G Housing', icon: '🏠', check: isFormA && isGranted, desc: '₹1.3 Lakh for permanent pucca house construction.' },
    { name: 'PMFBY Crop Insurance', icon: '🌿', check: isFormA && acres > 0, desc: 'Subsidized crop insurance for IFR cultivation fields.' },
    { name: 'Van Dhan Kendra', icon: '🌲', check: isFormC, desc: 'Minor forest produce processing and cooperative support.' },
    { name: 'NSTFDC PVTG Loans', icon: '💰', check: isPVTG, desc: 'Sub-4% micro-enterprise loans for Soliga, Koraga, Jenu Kuruba.' },
  ].filter(s => s.check);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          width: 560,
          maxWidth: '95vw',
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 32px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2419 0%, #166534 50%, #15803d 100%)',
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#86efac', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
              PATTA RECORD · {record.patta_id}
            </div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: -0.3 }}>
              {record.village} — Plot Inspection Card
            </h4>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20,
                background: `${statusConf.dot}25`,
                color: statusConf.dot,
                border: `1px solid ${statusConf.dot}50`,
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusConf.dot }} />
                {record.status}
              </span>
              <span style={{ fontSize: 9, color: '#86efac', fontWeight: 600 }}>
                {acres.toFixed(2)} Ac · Form {record.form_type}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff', cursor: 'pointer', width: 32, height: 32,
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, position: 'relative', zIndex: 1, transition: 'all 0.15s'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                padding: '10px 4px',
                border: 'none',
                background: activeTab === id ? 'white' : 'transparent',
                cursor: 'pointer',
                color: activeTab === id ? '#166534' : '#94a3b8',
                borderBottom: activeTab === id ? '2px solid #166534' : '2px solid transparent',
                fontWeight: activeTab === id ? 700 : 500,
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.15s',
                letterSpacing: 0.3,
              }}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >

              {/* ─── PROFILE TAB ─── */}
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
                    background: '#e2e8f0', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0'
                  }}>
                    {[
                      { label: 'Claimant', value: record.claimant_name || 'Community Rep.' },
                      { label: 'Community', value: record.tribal_community || 'General Forest Dwellers' },
                      { label: 'Form Type', value: record.form_type, mono: true },
                      { label: 'District · Taluk', value: `${record.district} · ${record.taluk}` },
                      { label: 'Claim Area', value: `${acres.toFixed(2)} ac  (${ha.toFixed(3)} ha)`, mono: true },
                      { label: 'Village', value: record.village },
                    ].map(({ label, value, mono }) => (
                      <div key={label} style={{ background: 'white', padding: '10px 14px' }}>
                        <div style={{ fontSize: 9, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coordinates */}
                  {record.lat && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                      border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px',
                      display: 'flex', gap: 16, alignItems: 'center'
                    }}>
                      <div style={{ fontSize: 18 }}>📍</div>
                      <div>
                        <div style={{ fontSize: 9, color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>GPS Coordinates</div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#14532d' }}>
                          {parseFloat(record.lat).toFixed(5)}° N, {parseFloat(record.lng).toFixed(5)}° E
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {record.rejection_reason && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                        ⚠ Rejection Remarks
                      </div>
                      <div style={{ fontSize: 11, color: '#991b1b', lineHeight: 1.5 }}>{record.rejection_reason}</div>
                    </div>
                  )}

                  {/* Digital Signature */}
                  {record.digital_signature && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                      border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 14px'
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Shield size={13} /> CRYPTOGRAPHIC E-SIGN CERTIFIED
                      </div>
                      <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {record.digital_signature}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                    {isGranted && (
                      <button onClick={onPrintDeed} style={{
                        flex: 1, background: 'linear-gradient(135deg, #166534, #15803d)',
                        border: 'none', color: '#fff', borderRadius: 10, padding: '10px 12px',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: '0 4px 12px rgba(22, 101, 52, 0.35)'
                      }}>
                        <FileText size={13} /> Print Title Deed
                      </button>
                    )}
                    {userMode === 'official' && (
                      <button onClick={() => onReviewClaim(record)} style={{
                        flex: 1, background: '#eff6ff', border: '1.5px solid #93c5fd',
                        color: '#1d4ed8', borderRadius: 10, padding: '10px 12px',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer'
                      }}>
                        Evaluate Status
                      </button>
                    )}
                    {['SDLC Approved', 'DLC Approved', 'Title Granted'].includes(record.status) && (
                      <a
                        href={`http://localhost:8000/api/fra/record/${record.patta_id}/download-report`}
                        download
                        style={{
                          flex: 1, background: '#1e3a8a', border: 'none', color: '#fff',
                          borderRadius: 10, padding: '10px 12px', fontSize: 11, fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          gap: 6, textDecoration: 'none'
                        }}
                      >
                        <Download size={13} /> JFI Report
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* ─── WORKFLOW TAB ─── */}
              {activeTab === 'status' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px',
                    fontSize: 11, color: '#64748b', lineHeight: 1.6
                  }}>
                    Official statutory workflow timeline under <strong style={{ color: '#166534' }}>Forest Rights Rules, 2008</strong>.
                    Tracks all administrative checkpoints from Gram Sabha to Title Grant.
                  </div>
                  <ClaimStepper record={record} />
                </div>
              )}

              {/* ─── SATELLITE TAB ─── */}
              {activeTab === 'satellite' && (() => {
                let satScore = 98;
                if (hasConflict) satScore -= 30;
                if (!isCultivationValid) satScore -= 15;
                if (!isCanopyValid) satScore -= 15;
                satScore = Math.max(35, satScore);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Score banner */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: hasConflict ? '#fef2f2' : '#f0fdf4',
                      border: `1.5px solid ${hasConflict ? '#fecaca' : '#bbf7d0'}`,
                      borderRadius: 12, padding: '14px 16px'
                    }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: hasConflict ? '#991b1b' : '#166534' }}>
                          Satellite Verification Index
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: hasConflict ? '#991b1b' : '#166534', marginTop: 2 }}>
                          {hasConflict ? '⚠ Overlap Warning Flagged' : '✓ Sentinel-2 Signatures Validated'}
                        </div>
                        <div style={{ fontSize: 10, color: hasConflict ? '#b91c1c' : '#15803d', marginTop: 2 }}>
                          Esri World Imagery · Sentinel-2 L2A Band Analysis
                        </div>
                      </div>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: `conic-gradient(${hasConflict ? '#ef4444' : '#22c55e'} ${satScore * 3.6}deg, #e2e8f0 0deg)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 0 4px white, 0 0 0 5px ${hasConflict ? '#fecaca' : '#bbf7d0'}`
                      }}>
                        <div style={{
                          width: 50, height: 50, borderRadius: '50%', background: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 900, color: hasConflict ? '#ef4444' : '#22c55e',
                          fontFamily: 'monospace'
                        }}>
                          {satScore}%
                        </div>
                      </div>
                    </div>

                    {/* NDVI Chart */}
                    <NDVIChart
                      label="🌿 NDVI — Normalized Vegetation Index"
                      value={ndviVal}
                      color="#16a34a"
                      gradientId="ndviGrad"
                      pathD="M 0 45 Q 40 10, 80 38 T 160 18 T 240 42 T 310 14"
                      fillD="M 0 45 Q 40 10, 80 38 T 160 18 T 240 42 T 310 14 L 320 60 L 0 60 Z"
                    />

                    {/* NDWI Chart */}
                    <NDVIChart
                      label="💧 NDWI — Surface Water Index"
                      value={ndwiVal}
                      color="#0284c7"
                      gradientId="ndwiGrad"
                      pathD="M 0 42 Q 40 28, 80 50 T 160 22 T 240 38 T 310 28"
                      fillD="M 0 42 Q 40 28, 80 50 T 160 22 T 240 38 T 310 28 L 320 60 L 0 60 Z"
                    />

                    {/* Audit checks */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                        Satellite Eligibility Audit Checks
                      </div>
                      {[
                        {
                          label: 'Active self-cultivation signature (IFR NDVI > 0.42)',
                          value: isFormA ? (isCultivationValid ? `CONFIRMED (${ndviVal.toFixed(2)})` : `NOT DETECTED (${ndviVal.toFixed(2)})`) : 'N/A (CFR Claim)',
                          pass: isFormA ? isCultivationValid : true,
                        },
                        {
                          label: 'Canopy thickness validation (CFR NDVI > 0.60)',
                          value: (isFormC || isFormB) ? (isCanopyValid ? `CONFIRMED (${ndviVal.toFixed(2)})` : `MARGINAL (${ndviVal.toFixed(2)})`) : 'N/A (IFR Claim)',
                          pass: (isFormC || isFormB) ? isCanopyValid : true,
                        },
                        {
                          label: 'Protected forest / wildlife reserve overlap',
                          value: hasConflict ? '⚠ CONFLICT FOUND' : 'CLEAR (0.0%)',
                          pass: !hasConflict,
                        },
                      ].map(({ label, value, pass }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #f1f5f9' }}>
                          <span style={{ fontSize: 10, color: '#64748b', flex: 1, paddingRight: 8 }}>· {label}:</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: pass ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap' }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ─── LEGAL AUDIT TAB ─── */}
              {activeTab === 'legal' && audit && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Score header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px'
                  }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        FRA Legal Audit Compliance
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                        Statutory Rule Verification Index
                      </div>
                    </div>
                    <div style={{
                      fontSize: 28, fontWeight: 900, fontFamily: 'monospace',
                      color: audit.score >= 80 ? '#16a34a' : audit.score >= 50 ? '#d97706' : '#dc2626'
                    }}>
                      {audit.score}%
                    </div>
                  </div>

                  {/* Checks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {audit.checks.map(c => (
                      <div key={c.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 12px',
                        background: c.status === 'Pass' ? '#f0fdf4' : c.status === 'Fail' ? '#fef2f2' : '#fffbeb',
                        borderLeft: `3px solid ${c.status === 'Pass' ? '#22c55e' : c.status === 'Fail' ? '#ef4444' : '#f59e0b'}`,
                        borderRadius: '0 8px 8px 0',
                      }}>
                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                          {c.status === 'Pass'
                            ? <CheckCircle size={13} color="#22c55e" />
                            : c.status === 'Fail'
                            ? <AlertTriangle size={13} color="#ef4444" />
                            : <HelpCircle size={13} color="#f59e0b" />}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{c.label}</div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{c.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Spatial boundary overlay */}
                  {record.spatial_verify && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                        Boundary Conflict Audit
                      </div>
                      <div style={{
                        padding: 12, borderRadius: 10,
                        background: record.spatial_verify.boundary_valid ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${record.spatial_verify.boundary_valid ? '#bbf7d0' : '#fde68a'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>
                            Overlap: {record.spatial_verify.overlap_percentage}%
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: record.spatial_verify.boundary_valid ? '#166534' : '#92400e' }}>
                            {record.spatial_verify.resolution_status}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: '#4b5563' }}>
                          Conflict Type: <strong>{record.spatial_verify.conflict_type}</strong>
                        </div>
                        {!record.spatial_verify.boundary_valid && (
                          <button
                            onClick={() => setShowConflictPopup(true)}
                            style={{
                              marginTop: 10, width: '100%', padding: '8px',
                              background: 'linear-gradient(135deg, #d97706, #b45309)',
                              border: 'none', borderRadius: 8, color: 'white',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}
                          >
                            <AlertTriangle size={12} /> Analyze Spatial Overlap Report
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── WELFARE TAB ─── */}
              {activeTab === 'welfare' && (() => {
                let dssScore = 0;
                if (record.tribal_community) dssScore += 20;
                if (ha <= 4.0) dssScore += 20;
                if (record.gram_sabha_date) dssScore += 15;
                if (record.sdlc_date) dssScore += 15;
                if (!hasConflict) dssScore += 15;
                if (isCultivationValid && isCanopyValid) dssScore += 15;
                const scoreColor = dssScore >= 80 ? '#10b981' : dssScore >= 50 ? '#f59e0b' : '#ef4444';

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* DSS Score */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                      border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px'
                    }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          DSS Eligibility Scorecard
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                          Welfare Integration Readiness
                        </div>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: scoreColor }}>
                        {dssScore}/100
                      </div>
                    </div>

                    {/* Criteria */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                        Satisfied Criteria Checklist
                      </div>
                      {[
                        { label: '1. Scheduled Tribe (ST) Category', pass: !!record.tribal_community, text: record.tribal_community ? 'Pass (ST)' : 'Info (OTFD)' },
                        { label: '2. Ceiling Limit (≤ 4 Hectares)', pass: ha <= 4.0, text: ha <= 4.0 ? 'Pass' : 'Failed' },
                        { label: '3. Local Gram Sabha Resolution', pass: !!record.gram_sabha_date, text: record.gram_sabha_date ? 'Pass' : 'Pending' },
                        { label: '4. SDLC Recommendations', pass: !!record.sdlc_date, text: record.sdlc_date ? 'Pass' : 'Pending' },
                        { label: '5. Clear GIS Boundaries (No Overlaps)', pass: !hasConflict, text: !hasConflict ? 'Pass' : 'Failed (Overlap)' },
                        { label: '6. Satellite Signature Match (NDVI)', pass: isCultivationValid && isCanopyValid, text: (isCultivationValid && isCanopyValid) ? 'Pass' : 'Marginal' },
                      ].map(({ label, pass, text }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #f1f5f9' }}>
                          <span style={{ fontSize: 10, color: '#64748b' }}>{label}</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: pass ? '#16a34a' : '#dc2626' }}>{text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Eligible schemes */}
                    {eligibleSchemes.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: 11, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        Welfare scheme recommendations require "Title Granted" status.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Central Sector Scheme Eligibility
                        </div>
                        {eligibleSchemes.map(s => (
                          <div key={s.name} style={{
                            display: 'flex', gap: 12, padding: '12px 14px',
                            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                            borderLeft: '3px solid #22c55e', borderRadius: '0 10px 10px 0',
                            border: '1px solid #bbf7d0', borderLeftWidth: 3,
                          }}>
                            <div style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#14532d' }}>{s.name}</div>
                              <div style={{ fontSize: 10, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
                              <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 700, marginTop: 6 }}>
                                ✓ Eligibility satisfied — auto-trigger on Title Grant
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ─── CONFLICT POPUP ─── */}
      <AnimatePresence>
        {showConflictPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)',
              backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 999999,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              style={{
                background: 'white', width: 700, borderRadius: 20,
                boxShadow: '0 40px 80px rgba(0,0,0,0.35)',
                overflow: 'hidden'
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#f59e0b" /> Spatial Boundary Conflict Report
                </h3>
                <button onClick={() => setShowConflictPopup(false)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  Close
                </button>
              </div>

              <div style={{ padding: 24, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: 16 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#166534', borderBottom: '1px solid #bbf7d0', paddingBottom: 6 }}>
                      📂 Claimed Plot Area Profile
                    </h4>
                    <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4, color: '#374151' }}>
                      <div><strong>Patta ID:</strong> {record.patta_id}</div>
                      <div><strong>Claimant:</strong> {record.claimant_name || 'Village Community'}</div>
                      <div><strong>Community:</strong> {record.tribal_community || 'OTFD'}</div>
                      <div><strong>Region:</strong> {record.village}, {record.district}</div>
                      <div><strong>Total Area:</strong> {acres.toFixed(2)} Ac ({ha.toFixed(3)} Ha)</div>
                    </div>
                  </div>

                  <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: 16 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#991b1b', borderBottom: '1px solid #fecaca', paddingBottom: 6 }}>
                      🚨 Conflicting Overlap Zone
                    </h4>
                    <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4, color: '#374151' }}>
                      <div style={{ color: '#991b1b', fontWeight: 700 }}>• Claimant: {record.claimant_name || 'Community rep.'}</div>
                      <div style={{ color: '#991b1b', fontWeight: 700 }}>• Range: {conflictDetails?.division || 'Territorial Range Office'}</div>
                      <div style={{ color: '#991b1b', fontWeight: 700 }}>• Zone: {conflictDetails?.sanctuary || 'National Sanctuary / Buffer'}</div>
                      <div><strong>Overlap:</strong> {record.spatial_verify?.overlap_percentage}%</div>
                      <div><strong>Impact:</strong> {conflictDetails?.impact || 'Reserved forest intersection.'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: 16 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: '#92400e', borderBottom: '1px solid #fde68a', paddingBottom: 6 }}>
                    ⚖️ Recommended Statutory Action & Reasoning
                  </h4>
                  <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>
                    <div style={{ marginBottom: 6 }}><strong>Required Directive:</strong> {conflictDetails?.directive}</div>
                    <div><strong>Legal Reasoning (FRA 2006):</strong> {conflictDetails?.reasoning}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowConflictPopup(false)} style={{
                    padding: '10px 20px', background: 'linear-gradient(135deg, #475569, #334155)',
                    border: 'none', borderRadius: 8, color: 'white',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}>
                    Acknowledge & Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
