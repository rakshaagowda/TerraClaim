import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  FileText, Map, ShieldAlert, Award, CheckCircle, AlertTriangle,
  HelpCircle, MessageSquare, PlusCircle, ArrowUpRight, Ban, Send,
  ThumbsUp, Download, RefreshCw, X, Satellite, Clock, Upload,
  Activity, BookOpen, GitBranch, Zap, Eye, Lock
} from 'lucide-react';
import DocUploadField from './DocUploadField.jsx';

const API = 'http://localhost:8000';

const STATUS_CONFIG = {
  'Title Granted':       { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  'DLC Approved':        { color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', dot: '#8b5cf6' },
  'SDLC Approved':       { color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd', dot: '#3b82f6' },
  'Under Verification':  { color: '#c2410c', bg: '#ffedd5', border: '#fdba74', dot: '#f97316' },
  'Claim Filed':         { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', dot: '#94a3b8' },
  'Gram Sabha Resolved': { color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', dot: '#06b6d4' },
  'Rejected':            { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
};

const TABS = [
  { id: 'explanation', label: 'AI Analysis',    Icon: Zap },
  { id: 'docs',        label: 'Documents',       Icon: FileText },
  { id: 'gis',         label: 'GIS / Satellite', Icon: Satellite },
  { id: 'timeline',    label: 'Timeline',         Icon: Clock },
];

const ACTION_CONFIG = {
  comment:       { label: 'Add Observation',      color: '#64748b', bg: '#f8fafc',   border: '#e2e8f0',  icon: <PlusCircle size={14} /> },
  clarification: { label: 'Clarification Request', color: '#d97706', bg: '#fffbeb',  border: '#fde68a',  icon: <HelpCircle size={14} /> },
  approve:       { label: 'Approve & Forward',     color: '#16a34a', bg: '#f0fdf4',  border: '#bbf7d0',  icon: <ThumbsUp size={14} /> },
  escalate:      { label: 'Escalate to State',     color: '#1d4ed8', bg: '#dbeafe',  border: '#93c5fd',  icon: <ArrowUpRight size={14} /> },
  reject:        { label: 'Reject Claim',          color: '#dc2626', bg: '#fef2f2',  border: '#fecaca',  icon: <Ban size={14} /> },
};

export default function ClaimWorkspace({ record, officer, darkMode, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('explanation');
  const [comments, setComments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [syncingDocs, setSyncingDocs] = useState(false);

  const [actionType, setActionType] = useState('comment');
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('Official Remark');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [satToggle, setSatToggle] = useState(false);

  const intelligence = record.intelligence || {
    eligibility_score: 50,
    duplicate_claims: [],
    missing_documents: [],
    compliance_checks: [],
    risk_score: 50,
    recommendation: 'Review Required',
    recommendation_reason: 'Analysis loading...',
    ai_assessment: 'AI Claim Assessment loading...'
  };

  const statusConf = STATUS_CONFIG[record.status] || STATUS_CONFIG['Claim Filed'];

  useEffect(() => {
    if (record?.patta_id) {
      fetchComments();
      fetchDocuments();
      fetchAuditTrail();
    }
  }, [record]);

  const fetchComments = () => {
    axios.get(`${API}/api/fra/claim/${record.patta_id}/comments`)
      .then(res => setComments(res.data))
      .catch(() => {});
  };

  const fetchDocuments = () => {
    axios.get(`${API}/api/fra/claim/${record.patta_id}/documents`)
      .then(res => setDocuments(res.data))
      .catch(() => {});
  };

  const fetchAuditTrail = () => {
    axios.get(`${API}/api/fra/claim/${record.patta_id}/audit-trail`)
      .then(res => setAuditTrail(res.data))
      .catch(() => {});
  };

  const handleSyncPreviousDocs = () => {
    setSyncingDocs(true);
    axios.post(`${API}/api/fra/claim/${record.patta_id}/fetch-previous-docs`)
      .then(res => { setDocuments(res.data); setSyncingDocs(false); fetchAuditTrail(); })
      .catch(() => setSyncingDocs(false));
  };

  const handleActionSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() && actionType !== 'reject') {
      setErrorMsg('Please enter your remarks or comments.');
      return;
    }
    if (actionType === 'reject' && !rejectionReason.trim()) {
      setErrorMsg('Rejection reason is required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    let nextStatus = record.status;
    let commentActionType = 'Commented';
    let localCommentType = commentType;

    const desg = officer.designation || '';
    const isGS = desg.includes('Gram Sabha');
    const isSDLC = desg.includes('Sub-Divisional');
    const isDLC = desg.includes('District Level');
    const isState = desg.includes('State Review') || desg.includes('STATE');

    if (actionType === 'approve') {
      commentActionType = 'Recommended';
      localCommentType = 'Recommendation Note';
      if (isGS || desg.includes('FRO')) nextStatus = 'Gram Sabha Resolved';
      else if (isSDLC) nextStatus = 'SDLC Approved';
      else if (isDLC) nextStatus = 'DLC Approved';
      else if (isState) nextStatus = 'Title Granted';
    } else if (actionType === 'reject') {
      commentActionType = 'Rejected';
      localCommentType = 'Official Remark';
      nextStatus = 'Rejected';
    } else if (actionType === 'escalate') {
      commentActionType = 'Forwarded';
      localCommentType = 'Official Remark';
      nextStatus = 'Under Verification';
    } else if (actionType === 'clarification') {
      commentActionType = 'Requested Clarification';
      localCommentType = 'Clarification Request';
      nextStatus = 'Under Verification';
    }

    const commentPayload = {
      officer_id: officer.officer_id,
      officer_name: officer.officer_name || 'Officer',
      designation: officer.designation,
      comment_type: localCommentType,
      comment: actionType === 'reject' ? rejectionReason : commentText,
      action_taken: commentActionType
    };

    axios.post(`${API}/api/fra/claim/${record.patta_id}/comments`, commentPayload)
      .then(() => {
        const reviewPayload = {
          status: nextStatus,
          rejection_reason: actionType === 'reject' ? rejectionReason : null,
          gram_sabha_date: nextStatus === 'Gram Sabha Resolved' ? new Date().toISOString().split('T')[0] : record.gram_sabha_date,
          sdlc_date: nextStatus === 'SDLC Approved' ? new Date().toISOString().split('T')[0] : record.sdlc_date,
          dlc_date: nextStatus === 'DLC Approved' ? new Date().toISOString().split('T')[0] : record.dlc_date,
          title_date: nextStatus === 'Title Granted' ? new Date().toISOString().split('T')[0] : record.title_date,
          gs_report: isGS ? (commentText || record.gs_report) : record.gs_report,
          sdlc_report: isSDLC ? (commentText || record.sdlc_report) : record.sdlc_report,
          dlc_report: isDLC ? (commentText || record.dlc_report) : record.dlc_report,
          title_report: isState ? (commentText || record.title_report) : record.title_report
        };
        return axios.post(`${API}/api/fra/record/${record.patta_id}/review`, reviewPayload);
      })
      .then(res => {
        setLoading(false);
        setSuccessMsg(`Successfully processed: ${actionType.toUpperCase()}`);
        setCommentText('');
        setRejectionReason('');
        fetchComments();
        fetchAuditTrail();
        if (onSave) onSave(res.data);
      })
      .catch(err => {
        setLoading(false);
        setErrorMsg(err.response?.data?.detail || 'An error occurred during workflow transition.');
      });
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const dm = darkMode;
  const bg = dm ? '#090d16' : '#f8fafc';
  const cardBg = dm ? '#111827' : '#ffffff';
  const cardBorder = dm ? '#1f2937' : '#e2e8f0';
  const textPrimary = dm ? '#f8fafc' : '#0f172a';
  const textSecondary = dm ? '#94a3b8' : '#64748b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: bg }}>

      {/* ── HEADER ── */}
      <div style={{
        background: dm
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #0f2419 0%, #166534 50%, #15803d 100%)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: dm ? '#34d399' : '#86efac', fontWeight: 700, letterSpacing: 1, marginBottom: 5 }}>
            PATTA CLAIM · {record.patta_id}
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: -0.3 }}>
            Verification Workspace — {record.claimant_name || 'Village Community'}
          </h2>
          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: `${statusConf.dot}25`, color: statusConf.dot,
              border: `1px solid ${statusConf.dot}50`,
              display: 'flex', alignItems: 'center', gap: 5
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusConf.dot }} />
              {record.status}
            </span>
            <span style={{ fontSize: 9, color: dm ? '#94a3b8' : '#a7f3d0', fontWeight: 600 }}>
              {record.district} · {record.village} · {parseFloat(record.claim_area_acres || 0).toFixed(2)} Acres
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff', cursor: 'pointer', padding: '8px 16px',
            borderRadius: 8, fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            position: 'relative', zIndex: 1, transition: 'all 0.15s'
          }}
        >
          <X size={13} /> Close Workspace
        </button>
      </div>

      {/* ── MAIN SPLIT PANEL ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', flex: 1, overflow: 'hidden' }}>

        {/* LEFT: Info Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${cardBorder}`, overflow: 'hidden' }}>

          {/* Tab Bar */}
          <div style={{ display: 'flex', background: dm ? '#1e293b' : '#f1f5f9', borderBottom: `1px solid ${cardBorder}`, flexShrink: 0 }}>
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  flex: 1,
                  background: activeTab === id ? cardBg : 'transparent',
                  border: 'none',
                  borderRight: `1px solid ${cardBorder}`,
                  padding: '12px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: activeTab === id ? (dm ? '#34d399' : '#166534') : textSecondary,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  borderBottom: activeTab === id ? `2px solid ${dm ? '#34d399' : '#166534'}` : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: dm ? '#0a0f1c' : '#fafbfc', color: textPrimary }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}
              >

                {/* ── AI Analysis Tab ── */}
                {activeTab === 'explanation' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* AI Assessment */}
                    <div style={{
                      background: dm ? 'rgba(4, 78, 59, 0.4)' : 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                      border: `1.5px solid ${dm ? '#047857' : '#86efac'}`,
                      borderRadius: 14, padding: '14px 16px',
                    }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 900, color: dm ? '#34d399' : '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={16} /> AI-Generated Claim Assessment
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: dm ? '#a7f3d0' : '#14532d', lineHeight: 1.6 }}>
                        {intelligence.ai_assessment}
                      </p>
                    </div>

                    {/* Score cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        {
                          label: 'Eligibility Index',
                          value: intelligence.eligibility_score,
                          sub: 'Rules, document completeness & spatial verify weight',
                          color: intelligence.eligibility_score >= 75 ? '#22c55e' : intelligence.eligibility_score >= 50 ? '#f59e0b' : '#ef4444',
                        },
                        {
                          label: 'Risk Exposure',
                          value: intelligence.risk_score,
                          sub: 'Overlap conflicts, duplicate alerts & document gaps',
                          color: intelligence.risk_score >= 50 ? '#ef4444' : intelligence.risk_score >= 25 ? '#f59e0b' : '#22c55e',
                        },
                      ].map(({ label, value, sub, color }) => (
                        <div key={label} style={{
                          background: cardBg, border: `1px solid ${cardBorder}`,
                          borderRadius: 14, padding: '16px', textAlign: 'center',
                          position: 'relative', overflow: 'hidden'
                        }}>
                          <div style={{
                            position: 'absolute', top: 0, right: 0, width: 60, height: 60,
                            background: `radial-gradient(circle at 80% 20%, ${color}15, transparent 70%)`
                          }} />
                          <div style={{ fontSize: 10, fontWeight: 800, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {label}
                          </div>
                          <div style={{ fontSize: 32, fontWeight: 900, color, margin: '10px 0', fontFamily: 'monospace' }}>
                            {value}%
                          </div>
                          <div style={{ fontSize: 10, color: textSecondary, lineHeight: 1.4 }}>{sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Duplicate alerts */}
                    {intelligence.duplicate_claims?.length > 0 && (
                      <div style={{
                        background: dm ? 'rgba(120, 53, 15, 0.5)' : '#fffbeb',
                        border: `1.5px solid ${dm ? '#b45309' : '#fde68a'}`,
                        borderRadius: 14, padding: '14px 16px'
                      }}>
                        <h5 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 900, color: dm ? '#fef3c7' : '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={14} /> Potential Duplicate Claims Detected
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {intelligence.duplicate_claims.map((d, i) => (
                            <div key={i} style={{
                              fontSize: 11, color: dm ? '#fef3c7' : '#78350f',
                              background: dm ? 'rgba(146, 64, 14, 0.4)' : 'white',
                              padding: '8px 12px', borderRadius: 8,
                              border: dm ? '1px solid #b45309' : '1px solid #fde68a'
                            }}>
                              · Similar claimant <strong>{d.claimant_name}</strong> in village <strong>{d.village}</strong> — Patta: <code>{d.patta_id}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance checklist */}
                    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16 }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: textPrimary }}>
                        Statutory Legal Audit Checks
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {intelligence.compliance_checks.map((c, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            fontSize: 11.5, padding: '10px 12px',
                            background: c.status === 'Pass' ? (dm ? 'rgba(4,78,59,0.3)' : '#f0fdf4') : (c.status === 'Fail' ? (dm ? 'rgba(127,29,29,0.3)' : '#fef2f2') : (dm ? 'rgba(120,53,15,0.3)' : '#fffbeb')),
                            borderLeft: `3px solid ${c.status === 'Pass' ? '#22c55e' : (c.status === 'Fail' ? '#ef4444' : '#f59e0b')}`,
                            borderRadius: '0 8px 8px 0',
                          }}>
                            <div style={{ marginTop: 2, flexShrink: 0 }}>
                              {c.status === 'Pass' ? <CheckCircle size={13} color="#22c55e" /> : <AlertTriangle size={13} color={c.status === 'Fail' ? '#ef4444' : '#f59e0b'} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: textPrimary }}>{c.rule}</div>
                              <div style={{ color: textSecondary, fontSize: 10, marginTop: 2 }}>{c.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Documents Tab ── */}
                {activeTab === 'docs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Document Ledger */}
                    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: textPrimary }}>
                          Uploaded Document Ledger
                        </h4>
                        <button
                          onClick={handleSyncPreviousDocs}
                          disabled={syncingDocs}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: dm ? '#064e3b' : '#f0fdf4',
                            color: dm ? '#34d399' : '#166534',
                            border: `1px solid ${dm ? '#047857' : '#86efac'}`,
                            padding: '6px 12px', borderRadius: 8,
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            opacity: syncingDocs ? 0.6 : 1,
                          }}
                        >
                          <RefreshCw size={11} style={{ animation: syncingDocs ? 'spin 1s linear infinite' : 'none' }} />
                          {syncingDocs ? 'Syncing...' : 'Sync Stage Docs'}
                        </button>
                      </div>

                      {documents.length === 0 ? (
                        <div style={{
                          fontSize: 12, color: textSecondary, textAlign: 'center',
                          padding: '28px 0', background: dm ? '#0f172a' : '#f8fafc',
                          borderRadius: 10, border: `1px dashed ${cardBorder}`
                        }}>
                          <Upload size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                          No documents uploaded yet for this stage.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {documents.map(doc => (
                            <div key={doc.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 14px', background: dm ? '#0f172a' : '#f8fafc',
                              borderRadius: 10, border: `1px solid ${cardBorder}`
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                  background: dm ? '#1e293b' : '#f0fdf4',
                                  border: `1px solid ${dm ? '#334155' : '#bbf7d0'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <FileText size={16} color="#166534" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {doc.file_name}
                                  </div>
                                  <div style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>
                                    Stage: <strong style={{ textTransform: 'capitalize' }}>{doc.stage?.replace('_', ' ')}</strong>
                                    &nbsp;·&nbsp;{formatSize(doc.file_size)}
                                    &nbsp;·&nbsp;By: {doc.uploaded_by}
                                  </div>
                                </div>
                              </div>
                              <a
                                href={`${API}/api/fra/claim/document/${doc.id}/download?officer_id=${officer.officer_id}&officer_name=${encodeURIComponent(officer.officer_name || 'Officer')}`}
                                download
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  background: dm ? '#1e293b' : 'white',
                                  border: `1px solid ${cardBorder}`,
                                  padding: '6px 12px', borderRadius: 8,
                                  fontSize: 10, fontWeight: 700,
                                  textDecoration: 'none', color: textPrimary, flexShrink: 0
                                }}
                              >
                                <Download size={11} /> Download
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Upload Widget */}
                    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16 }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: textPrimary }}>
                        Upload New Document / Verification Scan
                      </h4>
                      <DocUploadField
                        pattaId={record.patta_id}
                        stage={officer.designation?.includes('Gram Sabha') ? 'gram_sabha' : (officer.designation?.includes('Sub-Divisional') ? 'sdlc' : 'dlc')}
                        uploadedBy={officer.officer_id}
                        darkMode={dm}
                        onUploadSuccess={() => { fetchDocuments(); fetchAuditTrail(); }}
                      />
                    </div>
                  </div>
                )}

                {/* ── GIS Tab ── */}
                {activeTab === 'gis' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: textPrimary }}>
                            Spatial Verification & Overlaps
                          </h4>
                          <p style={{ margin: '4px 0 0', fontSize: 10, color: textSecondary }}>
                            Lat {parseFloat(record.lat || 12).toFixed(5)}, Lng {parseFloat(record.lng || 76).toFixed(5)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSatToggle(!satToggle)}
                          style={{
                            padding: '8px 14px',
                            background: satToggle ? (dm ? '#1e3a8a' : '#1d4ed8') : (dm ? '#1e293b' : '#f1f5f9'),
                            color: satToggle ? 'white' : textSecondary,
                            border: `1px solid ${satToggle ? '#3b82f6' : cardBorder}`,
                            borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                        >
                          {satToggle ? <><Satellite size={12}/> Satellite View</> : <><Map size={12}/> Vector Map</>}
                        </button>
                      </div>

                      {/* Map container */}
                      <div style={{
                        height: 220, borderRadius: 10,
                        background: satToggle
                          ? 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 50%, #1a4a2a 100%)'
                          : (dm ? '#0f172a' : '#e8f5e9'),
                        position: 'relative', border: `1px solid ${cardBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {satToggle && (
                          <div style={{ position: 'absolute', inset: 0, opacity: 0.3,
                            backgroundImage: 'radial-gradient(ellipse at 40% 60%, #4ade80 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, #16a34a 0%, transparent 40%)'
                          }} />
                        )}

                        {/* Claim boundary box */}
                        <div style={{
                          width: 110, height: 90, border: '2.5px solid #22c55e',
                          background: 'rgba(34, 197, 94, 0.18)', borderRadius: 6,
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                          boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: satToggle ? 'white' : '#166534', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                            Claim Bounds
                          </span>
                          <span style={{ fontSize: 9, color: satToggle ? '#86efac' : '#15803d', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                            {parseFloat(record.claim_area_acres || 0).toFixed(1)} Ac
                          </span>
                        </div>

                        {!record.spatial_verify?.boundary_valid && (
                          <div style={{
                            width: 72, height: 64, border: '2.5px dashed #ef4444',
                            background: 'rgba(239, 68, 68, 0.2)', borderRadius: 6,
                            position: 'absolute', top: 35, left: '60%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                            boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)'
                          }}>
                            <span style={{ fontSize: 8, fontWeight: 800, color: '#fecaca', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Overlap</span>
                            <span style={{ fontSize: 7, color: '#fca5a5', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{record.spatial_verify?.overlap_percentage}%</span>
                          </div>
                        )}

                        <div style={{
                          position: 'absolute', bottom: 8, right: 8,
                          background: 'rgba(15, 23, 42, 0.8)', color: '#94a3b8',
                          padding: '3px 8px', borderRadius: 4, fontSize: 9, fontFamily: 'monospace'
                        }}>
                          {satToggle ? '🛰 Sentinel-2 L2A' : '🗺 Vector Base Map'} · TerraClaim GIS
                        </div>
                      </div>

                      {/* Remote Sensing indicators */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                        {[
                          { label: 'NDVI Cultivation Index', value: '0.78 — Cultivation Detected', valueColor: '#16a34a', sub: 'Agricultural activity confirmed pre-2005 cutoff.' },
                          { label: 'NDWI Soil Moisture', value: '0.45 — Normal Levels', valueColor: '#0284c7', sub: 'Matches agro-climatic conditions for secondary crop.' },
                        ].map(({ label, value, valueColor, sub }) => (
                          <div key={label} style={{
                            background: dm ? '#0f172a' : '#f8fafc', padding: 12,
                            borderRadius: 10, border: `1px solid ${cardBorder}`, fontSize: 11
                          }}>
                            <div style={{ fontWeight: 700, color: textPrimary, marginBottom: 4 }}>{label}</div>
                            <div style={{ color: valueColor, fontWeight: 800 }}>{value}</div>
                            <div style={{ color: textSecondary, fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Timeline Tab ── */}
                {activeTab === 'timeline' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Timeline */}
                    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16 }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 800, color: textPrimary }}>
                        Administrative Audit Timeline
                      </h4>
                      {auditTrail.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: textSecondary, fontSize: 11 }}>
                          No timeline events recorded yet.
                        </div>
                      ) : (
                        <div style={{ borderLeft: `2px solid ${cardBorder}`, paddingLeft: 18, marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {auditTrail.map((trail) => (
                            <div key={trail.id} style={{ position: 'relative' }}>
                              <div style={{
                                position: 'absolute', left: -25, top: 3,
                                width: 12, height: 12, borderRadius: '50%',
                                background: trail.action?.includes('Upload') ? '#3b82f6' : trail.action?.includes('Status') ? '#10b981' : '#f59e0b',
                                border: `2px solid ${cardBg}`,
                                boxShadow: `0 0 0 2px ${cardBorder}`
                              }} />
                              <div style={{ fontSize: 11 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: textSecondary, marginBottom: 3 }}>
                                  <span><strong style={{ color: textPrimary }}>{trail.action}</strong> by {trail.officer_name} ({trail.designation})</span>
                                  <span style={{ fontSize: 10, flexShrink: 0 }}>{trail.created_at}</span>
                                </div>
                                <p style={{ margin: 0, color: textPrimary, fontSize: 11, lineHeight: 1.5 }}>{trail.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remarks history */}
                    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16 }}>
                      <h4 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 800, color: textPrimary }}>
                        Official Remarks History
                      </h4>
                      {comments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: textSecondary, fontSize: 11 }}>
                          No official remarks recorded yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {comments.map(c => (
                            <div key={c.id} style={{
                              background: dm ? '#0f172a' : '#f8fafc', padding: '12px 14px',
                              borderRadius: 10, border: `1px solid ${cardBorder}`
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: textPrimary }}>
                                  {c.officer_name} <span style={{ color: textSecondary, fontWeight: 500 }}>({c.designation})</span>
                                </span>
                                <span style={{ fontSize: 10, color: textSecondary }}>{c.created_at}</span>
                              </div>
                              <div style={{
                                fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3,
                                color: c.comment_type?.includes('Recommendation') ? '#16a34a' : c.comment_type?.includes('Clarification') ? '#d97706' : textSecondary,
                                marginBottom: 6
                              }}>
                                {c.comment_type} · {c.action_taken}
                              </div>
                              <p style={{ margin: 0, color: textPrimary, fontSize: 11.5, lineHeight: 1.5, fontStyle: 'italic' }}>
                                "{c.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: Officer Decision Dashboard */}
        <div style={{
          padding: '24px 20px', display: 'flex', flexDirection: 'column',
          overflowY: 'auto', background: dm ? '#0f172a' : '#ffffff',
          borderLeft: `1px solid ${cardBorder}`
        }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={15} color="#166534" /> Officer Decision Dashboard
          </h3>
          <div style={{ fontSize: 10, color: textSecondary, marginBottom: 18 }}>
            Logged as: <strong style={{ color: textPrimary }}>{officer.officer_name}</strong> · {officer.designation}
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, marginBottom: 14 }}
              >
                ⚠ {errorMsg}
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, marginBottom: 14 }}
              >
                ✓ {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 18 }}>
            {Object.entries(ACTION_CONFIG).map(([id, cfg]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setActionType(id); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  padding: '10px 10px',
                  borderRadius: 10, fontSize: 10.5, fontWeight: 700,
                  cursor: 'pointer',
                  border: `1.5px solid ${actionType === id ? cfg.color : cardBorder}`,
                  background: actionType === id ? cfg.bg : (dm ? '#1e293b' : 'white'),
                  color: actionType === id ? cfg.color : textSecondary,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>

          {/* Active Action Form */}
          <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

            {/* Context banner */}
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 11,
              background: ACTION_CONFIG[actionType].bg,
              border: `1px solid ${ACTION_CONFIG[actionType].border}`,
              color: ACTION_CONFIG[actionType].color,
              lineHeight: 1.5
            }}>
              {actionType === 'comment' && <><strong>Add Observation:</strong> Log an internal note or official remark about this claim's field verification.</>}
              {actionType === 'clarification' && <><strong>Clarification Request:</strong> Flags the application and prompts the applicant or prior authority for additional evidence.</>}
              {actionType === 'approve' && <><strong>Approval Recommendation:</strong> Certifies this claim is legally compliant and forwards to the next authority committee.</>}
              {actionType === 'escalate' && <><strong>Escalate to State:</strong> Moves the claim to State Review Authority. Use for complex disputes or wildlife reserve overlaps.</>}
              {actionType === 'reject' && <><strong>Warning:</strong> Rejection halts all verification stages. The claimant will be notified. Legally required rejection reason must be provided.</>}
            </div>

            {/* Comment category dropdown for 'comment' */}
            {actionType === 'comment' && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: textSecondary, textTransform: 'uppercase', display: 'block', marginBottom: 6, letterSpacing: 0.4 }}>
                  Comment Category
                </label>
                <select
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: `1.5px solid ${cardBorder}`, background: dm ? '#0f172a' : 'white',
                    color: textPrimary, fontSize: 12.5, outline: 'none', fontFamily: 'inherit'
                  }}
                  value={commentType}
                  onChange={e => setCommentType(e.target.value)}
                >
                  <option value="Internal Comment">Internal Observation (Private to officers)</option>
                  <option value="Official Remark">Official Remark (Logged in reports)</option>
                  <option value="Recommendation Note">Recommendation Note</option>
                </select>
              </div>
            )}

            {/* Textarea */}
            {actionType !== 'reject' ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 10, fontWeight: 800, color: textSecondary, textTransform: 'uppercase', display: 'block', marginBottom: 6, letterSpacing: 0.4 }}>
                  {actionType === 'approve' ? 'Committee Recommendation Remarks' :
                   actionType === 'clarification' ? 'Clarification Request Details' :
                   actionType === 'escalate' ? 'Escalation Reason' :
                   'Comment Text'}
                </label>
                <textarea
                  style={{
                    flex: 1, minHeight: 120, padding: '12px', borderRadius: 10,
                    border: `1.5px solid ${cardBorder}`, background: dm ? '#0f172a' : 'white',
                    color: textPrimary, outline: 'none', resize: 'none',
                    fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.6
                  }}
                  placeholder={
                    actionType === 'approve' ? 'Write a brief recommendation summary supporting this approval...' :
                    actionType === 'clarification' ? 'Specify exactly what proof is missing (e.g. missing survey boundaries, ST community card scan)...' :
                    actionType === 'escalate' ? 'Describe why this case is escalated to State review authority...' :
                    'Enter observation notes, verified landmarks, or local field reports...'
                  }
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', display: 'block', marginBottom: 6, letterSpacing: 0.4 }}>
                  Statutory Rejection Reason *
                </label>
                <textarea
                  required
                  style={{
                    flex: 1, minHeight: 120, padding: '12px', borderRadius: 10,
                    border: '1.5px solid #ef4444', background: dm ? '#0f172a' : 'white',
                    color: dm ? '#fecaca' : '#dc2626', outline: 'none', resize: 'none',
                    fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.6
                  }}
                  placeholder="Cite specific legal rules violated (e.g. claim area exceeds 4 Ha cap, claimant lacks residency evidence under Section 2)..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4, width: '100%', padding: '13px',
                background: actionType === 'reject'
                  ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                  : actionType === 'approve'
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'linear-gradient(135deg, #166534, #14532d)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.6 : 1,
                boxShadow: actionType === 'reject' ? '0 4px 12px rgba(220,38,38,0.35)' : '0 4px 12px rgba(22, 101, 52, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <Send size={14} />
              {loading ? 'Processing Workflow...' : `Submit ${ACTION_CONFIG[actionType].label}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
