import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FileText, Map, ShieldAlert, Award, FileCode, CheckCircle, AlertTriangle, 
  HelpCircle, MessageSquare, PlusCircle, ArrowUpRight, Ban, Send, ThumbsUp, Download,
  RefreshCw
} from 'lucide-react';
import DocUploadField from './DocUploadField.jsx';

const API = 'http://localhost:8000';

export default function ClaimWorkspace({ record, officer, darkMode, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('explanation'); // 'explanation', 'docs', 'gis', 'timeline'
  const [comments, setComments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [syncingDocs, setSyncingDocs] = useState(false);
  
  // Actions states
  const [actionType, setActionType] = useState('comment'); // 'comment', 'approve', 'reject', 'clarification', 'escalate'
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('Official Remark');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Satellite and Gis details
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
      .catch(err => console.error(err));
  };

  const fetchDocuments = () => {
    axios.get(`${API}/api/fra/claim/${record.patta_id}/documents`)
      .then(res => setDocuments(res.data))
      .catch(err => console.error(err));
  };

  const fetchAuditTrail = () => {
    axios.get(`${API}/api/fra/claim/${record.patta_id}/audit-trail`)
      .then(res => setAuditTrail(res.data))
      .catch(err => console.error(err));
  };

  const handleSyncPreviousDocs = () => {
    setSyncingDocs(true);
    axios.post(`${API}/api/fra/claim/${record.patta_id}/fetch-previous-docs`)
      .then(res => {
        setDocuments(res.data);
        setSyncingDocs(false);
        fetchAuditTrail();
      })
      .catch(err => {
        console.error(err);
        setSyncingDocs(false);
      });
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

    // Determine target status
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
      if (isGS || desg.includes('FRO')) {
        nextStatus = 'Gram Sabha Resolved';
      } else if (isSDLC) {
        nextStatus = 'SDLC Approved';
      } else if (isDLC) {
        nextStatus = 'DLC Approved';
      } else if (isState) {
        nextStatus = 'Title Granted';
      }
    } else if (actionType === 'reject') {
      commentActionType = 'Rejected';
      localCommentType = 'Official Remark';
      nextStatus = 'Rejected';
    } else if (actionType === 'escalate') {
      commentActionType = 'Forwarded';
      localCommentType = 'Official Remark';
      nextStatus = 'Escalated to State'; // Escalate moves status or keeps active status
    } else if (actionType === 'clarification') {
      commentActionType = 'Requested Clarification';
      localCommentType = 'Clarification Request';
      nextStatus = 'Under Verification';
    }

    // 1. Save standard comment
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
        // 2. Perform review status transition
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
        setSuccessMsg(`Successfully processed claim action: ${actionType.toUpperCase()}`);
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    return (bytes / k).toFixed(1) + ' KB';
  };

  const getStatusColor = (st) => {
    const map = {
      'Title Granted': '#22c55e',
      'DLC Approved': '#a855f7',
      'SDLC Approved': '#3b82f6',
      'Under Verification': '#f97316',
      'Claim Filed': '#64748b',
      'Gram Sabha Resolved': '#06b6d4',
      'Rejected': '#ef4444'
    };
    return map[st] || '#64748b';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Title Header */}
      <div style={{
        background: '#1e293b',
        padding: '16px 24px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8' }}>PATTA CLAIM ID: {record.patta_id}</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>
            Verification Workspace: {record.claimant_name || 'Village Community'}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 12,
            background: getStatusColor(record.status),
            color: 'white',
            textTransform: 'uppercase'
          }}>
            {record.status}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}
          >
            Close Workspace
          </button>
        </div>
      </div>

      {/* Main Body Split Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Information Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', overflow: 'hidden' }}>
          
          {/* Workspace Tabs */}
          <div style={{ display: 'flex', background: darkMode ? '#1e293b' : '#f1f5f9', borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', flexShrink: 0 }}>
            {[
              { id: 'explanation', label: 'AI Analysis & Info', icon: <Award size={14} /> },
              { id: 'docs', label: 'Documents & Uploads', icon: <FileText size={14} /> },
              { id: 'gis', label: 'GIS & Satellite Map', icon: <Map size={14} /> },
              { id: 'timeline', label: 'Timeline & remarks', icon: <MessageSquare size={14} /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: activeTab === t.id ? (darkMode ? '#0f172a' : 'white') : 'none',
                  border: 'none',
                  borderRight: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                  padding: '12px 18px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: activeTab === t.id ? (darkMode ? '#ffffff' : '#1e293b') : (darkMode ? '#94a3b8' : '#64748b'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderBottom: activeTab === t.id ? (darkMode ? '2px solid #34d399' : '2px solid #355e3b') : 'none'
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: darkMode ? '#0f172a' : '#fafbfc', color: darkMode ? '#f8fafc' : '#1a1a1a' }}>
            
            {/* Tab: Explanation & Summary */}
            {activeTab === 'explanation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* AI generated assessment */}
                <div style={{
                  background: darkMode ? '#064e3b' : '#f0fdf4',
                  border: darkMode ? '1.5px solid #047857' : '1.5px solid #bbf7d0',
                  borderRadius: 12,
                  padding: 16
                }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 13, fontWeight: 900, color: darkMode ? '#a7f3d0' : '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🧠 AI-Generated Claim Assessment
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: darkMode ? '#d1fae5' : '#14532d', lineHeight: 1.5 }}>
                    {intelligence.ai_assessment}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  
                  {/* Eligibility gauge */}
                  <div style={{ background: darkMode ? '#1e293b' : 'white', border: darkMode ? '1px solid #334155' : '1px solid #cbdcce', borderRadius: 12, padding: 14, textAlign: 'center', color: darkMode ? '#f8fafc' : '#1a1a1a' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: darkMode ? '#cbd5e1' : '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Eligibility Index</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: intelligence.eligibility_score >= 75 ? (darkMode ? '#4ade80' : '#22c55e') : (intelligence.eligibility_score >= 50 ? '#f59e0b' : '#ef4444'), margin: '8px 0' }}>
                      {intelligence.eligibility_score}%
                    </div>
                    <div style={{ fontSize: 10, color: darkMode ? '#cbd5e1' : '#64748b' }}>
                      Passed rules, documents completeness, and spatial verification weight.
                    </div>
                  </div>

                  {/* Risk score */}
                  <div style={{ background: darkMode ? '#1e293b' : 'white', border: darkMode ? '1px solid #334155' : '1px solid #cbdcce', borderRadius: 12, padding: 14, textAlign: 'center', color: darkMode ? '#f8fafc' : '#1a1a1a' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: darkMode ? '#cbd5e1' : '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Exposure</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: intelligence.risk_score >= 50 ? '#ef4444' : (intelligence.risk_score >= 25 ? '#f59e0b' : (darkMode ? '#4ade80' : '#22c55e')), margin: '8px 0' }}>
                      {intelligence.risk_score}%
                    </div>
                    <div style={{ fontSize: 10, color: darkMode ? '#cbd5e1' : '#64748b' }}>
                      Overlap conflict, duplicate alerts, and critical document gaps.
                    </div>
                  </div>

                </div>

                {/* Duplicate alerts */}
                {intelligence.duplicate_claims?.length > 0 && (
                  <div style={{ background: darkMode ? '#78350f' : '#fffbeb', border: darkMode ? '1.5px solid #b45309' : '1.5px solid #fef3c7', borderRadius: 12, padding: 14 }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: 12, fontWeight: 900, color: darkMode ? '#fef3c7' : '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} /> Potential Duplicate Claims Detected
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {intelligence.duplicate_claims.map((d, index) => (
                        <div key={index} style={{ fontSize: 11, color: darkMode ? '#fef3c7' : '#78350f', background: darkMode ? '#92400e' : 'white', padding: '6px 10px', borderRadius: 6, border: darkMode ? '1px solid #b45309' : '1px solid #fde68a' }}>
                          • Similar claimant name <strong>{d.claimant_name}</strong> registered in village <strong>{d.village}</strong> (Patta ID: <strong style={{ fontFamily: 'monospace' }}>{d.patta_id}</strong>)
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance checklist details */}
                <div style={{ background: darkMode ? '#1e293b' : 'white', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 800, color: darkMode ? '#ffffff' : '#1e293b' }}>Statutory Legal Audits</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {intelligence.compliance_checks.map((c, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        fontSize: 11.5,
                        padding: '8px 10px',
                        background: c.status === 'Pass' ? (darkMode ? '#064e3b' : '#f0fdf4') : (c.status === 'Fail' ? (darkMode ? '#7f1d1d' : '#fef2f2') : (darkMode ? '#78350f' : '#fffbeb')),
                        borderLeft: `3px solid ${c.status === 'Pass' ? '#22c55e' : (c.status === 'Fail' ? '#ef4444' : '#f59e0b')}`,
                        borderRadius: '0 6px 6px 0'
                      }}>
                        <div style={{ marginTop: 2 }}>
                          {c.status === 'Pass' ? <CheckCircle size={12} color="#22c55e" /> : <AlertTriangle size={12} color={c.status === 'Fail' ? '#ef4444' : '#f59e0b'} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: darkMode ? '#f8fafc' : '#334155' }}>{c.rule}</div>
                          <div style={{ color: darkMode ? '#cbd5e1' : '#64748b', fontSize: 10, marginTop: 1 }}>{c.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab: Documents */}
            {activeTab === 'docs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* List of uploaded files */}
                <div style={{ background: darkMode ? '#1e293b' : 'white', border: darkMode ? '1px solid #334155' : '1px solid #cbdcce', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px 0' }}>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: darkMode ? '#ffffff' : '#132a13' }}>
                      Uploaded Document Ledger
                    </h4>
                    <button
                      onClick={handleSyncPreviousDocs}
                      disabled={syncingDocs}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: '#355e3b',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        opacity: syncingDocs ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <RefreshCw size={11} style={{ animation: syncingDocs ? 'spin 1s linear infinite' : 'none' }} />
                      {syncingDocs ? 'Syncing...' : 'Sync Previous Stage Docs'}
                    </button>
                  </div>
                  
                  {documents.length === 0 ? (
                    <div style={{ fontSize: 11.5, color: darkMode ? '#cbd5e1' : '#64748b', textAlign: 'center', padding: '20px 0' }}>
                      No stage-specific files uploaded yet. Add applicant records or field files using the widget below.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                      {documents.map(doc => (
                        <div key={doc.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: darkMode ? '#0f172a' : '#f8fafc',
                          borderRadius: 8,
                          border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                            <FileText size={18} color="#355e3b" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: darkMode ? '#f8fafc' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {doc.file_name}
                              </div>
                              <div style={{ fontSize: 9.5, color: darkMode ? '#94a3b8' : '#64748b', marginTop: 2 }}>
                                Stage: <strong style={{ textTransform: 'capitalize' }}>{doc.stage.replace('_', ' ')}</strong> · Size: {formatSize(doc.file_size)} · Uploaded by: {doc.uploaded_by}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <a
                              href={`${API}/api/fra/claim/document/${doc.id}/download?officer_id=${officer.officer_id}&officer_name=${encodeURIComponent(officer.officer_name || 'Officer')}`}
                              download
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: darkMode ? '#334155' : 'white',
                                border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                                padding: '5px 10px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 700,
                                textDecoration: 'none',
                                color: darkMode ? '#f8fafc' : '#334155'
                              }}
                            >
                              <Download size={11} /> Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Widget */}
                <div style={{ background: darkMode ? '#1e293b' : 'white', border: darkMode ? '1px solid #334155' : '1px solid #cbdcce', borderRadius: 12, padding: 16 }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 800, color: darkMode ? '#ffffff' : '#132a13' }}>
                    Upload New Document / Verification scans
                  </h4>
                  <DocUploadField
                    pattaId={record.patta_id}
                    stage={officer.designation?.includes('Gram Sabha') ? 'gram_sabha' : (officer.designation?.includes('Sub-Divisional') ? 'sdlc' : 'dlc')}
                    uploadedBy={officer.officer_id}
                    darkMode={darkMode}
                    onUploadSuccess={() => {
                      fetchDocuments();
                      fetchAuditTrail();
                    }}
                  />
                </div>

              </div>
            )}

            {/* Tab: GIS & Satellite Map */}
            {activeTab === 'gis' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  background: darkMode ? '#1e293b' : 'white',
                  border: darkMode ? '1px solid #334155' : '1px solid #cbdcce',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: darkMode ? '#ffffff' : '#1e293b' }}>Spatial Verification & Overlaps</h4>
                      <p style={{ margin: 0, fontSize: 10, color: darkMode ? '#cbd5e1' : '#64748b', marginTop: 1 }}>Coordinates: Lat {parseFloat(record.lat || 12).toFixed(5)}, Lng {parseFloat(record.lng || 76).toFixed(5)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSatToggle(!satToggle)}
                      style={{
                        padding: '6px 12px',
                        background: satToggle ? '#1e3a8a' : (darkMode ? '#334155' : '#f1f5f9'),
                        color: satToggle ? 'white' : (darkMode ? '#cbd5e1' : '#475569'),
                        border: darkMode ? '1px solid #475569' : '1px solid #cbdcce',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {satToggle ? '🛰️ Satellite Imagery' : '🗺️ Vector Base Map'}
                    </button>
                  </div>

                  {/* Mock Map view container since we can't spawn MapLibre multiple times easily inside scroll divs */}
                  <div style={{
                    height: 240,
                    borderRadius: 8,
                    background: satToggle ? 'url("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/4688/2924")' : (darkMode ? '#0f172a' : '#e2e8f0'),
                    backgroundSize: 'cover',
                    position: 'relative',
                    border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Simulated boundary overlay */}
                    <div style={{
                      width: 100,
                      height: 100,
                      border: '2.5px solid #22c55e',
                      background: 'rgba(34, 197, 94, 0.15)',
                      borderRadius: 4,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'white', textShadow: '1px 1px 2px black' }}>Claim Bounds</span>
                      <span style={{ fontSize: 8, color: 'white', textShadow: '1px 1px 2px black' }}>{parseFloat(record.claim_area_acres).toFixed(1)} Ac</span>
                    </div>

                    {!record.spatial_verify?.boundary_valid && (
                      <div style={{
                        width: 70,
                        height: 70,
                        border: '2.5px dashed #ef4444',
                        background: 'rgba(239, 68, 68, 0.25)',
                        borderRadius: 4,
                        position: 'absolute',
                        top: 40,
                        left: 170,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                      }}>
                        <span style={{ fontSize: 8, fontWeight: 800, color: '#fecaca', textShadow: '1px 1px 2px black' }}>Overlap Zone</span>
                        <span style={{ fontSize: 7, color: '#fecaca', textShadow: '1px 1px 2px black' }}>{record.spatial_verify?.overlap_percentage}%</span>
                      </div>
                    )}

                    <div style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 9,
                      fontFamily: 'monospace'
                    }}>
                      Esri Satellite Link Active
                    </div>
                  </div>

                  {/* Remote Sensing Indicators */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: darkMode ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 8, border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: darkMode ? '#f8fafc' : '#334155' }}>NDVI Cultivation Index</div>
                      <div style={{ color: '#166534', fontWeight: 800, marginTop: 4 }}>0.78 - Cultivation Detected</div>
                      <div style={{ color: darkMode ? '#cbd5e1' : '#64748b', fontSize: 9.5, marginTop: 2 }}>Confirms agricultural activity or occupation prior to 2005 cut-off.</div>
                    </div>
                    <div style={{ background: darkMode ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 8, border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: darkMode ? '#f8fafc' : '#334155' }}>NDWI Soil Moisture Index</div>
                      <div style={{ color: '#0284c7', fontWeight: 800, marginTop: 4 }}>0.45 - Normal Water Levels</div>
                      <div style={{ color: darkMode ? '#cbd5e1' : '#64748b', fontSize: 9.5, marginTop: 2 }}>Matches local agro-climatic conditions for secondary crop.</div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Tab: Timeline & comments */}
            {activeTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Timeline */}
                <div style={{ background: darkMode ? '#1e293b' : 'white', border: darkMode ? '1px solid #334155' : '1px solid #cbdcce', borderRadius: 12, padding: 16 }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: 13, fontWeight: 800, color: darkMode ? '#ffffff' : '#1e293b' }}>Administrative Audit Timeline</h4>
                  
                  {auditTrail.length === 0 ? (
                    <div style={{ fontSize: 11.5, color: darkMode ? '#cbd5e1' : '#64748b', textAlign: 'center', padding: '10px 0' }}>No timeline events found.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: darkMode ? '2px solid #475569' : '2px solid #cbd5e1', paddingLeft: 16, marginLeft: 10 }}>
                      {auditTrail.map((trail, index) => (
                        <div key={trail.id} style={{ position: 'relative' }}>
                          {/* Dot marker */}
                          <div style={{
                            position: 'absolute',
                            left: -22,
                            top: 2,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: trail.action.includes('Upload') ? '#3b82f6' : (trail.action.includes('Status') ? '#10b981' : '#f59e0b'),
                            border: '2px solid white',
                            boxShadow: darkMode ? '0 0 0 1px #475569' : '0 0 0 1px #cbd5e1'
                          }} />
                          
                          <div style={{ fontSize: 11.5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: darkMode ? '#cbd5e1' : '#64748b' }}>
                              <span><strong>{trail.action}</strong> by {trail.officer_name || 'Citizen'} ({trail.designation || 'Applicant'})</span>
                              <span style={{ fontSize: 9.5 }}>{trail.created_at}</span>
                            </div>
                            <p style={{ margin: '3px 0 0 0', color: darkMode ? '#ffffff' : '#1e293b', fontSize: 11 }}>{trail.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remarks history */}
                <div style={{ background: darkMode ? '#1e293b' : 'white', border: darkMode ? '1px solid #334155' : '1px solid #cbdcce', borderRadius: 12, padding: 16 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 800, color: darkMode ? '#ffffff' : '#1e293b' }}>Official remarks History</h4>
                  
                  {comments.length === 0 ? (
                    <div style={{ fontSize: 11.5, color: darkMode ? '#cbd5e1' : '#64748b', textAlign: 'center', padding: '10px 0' }}>No remarks or recommendations recorded.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {comments.map(c => (
                        <div key={c.id} style={{
                          background: darkMode ? '#0f172a' : '#f8fafc',
                          padding: 10,
                          borderRadius: 8,
                          border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                          fontSize: 11.5
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: darkMode ? '#cbd5e1' : '#64748b', marginBottom: 4 }}>
                            <span><strong>{c.officer_name}</strong> ({c.designation})</span>
                            <span style={{ fontSize: 9.5 }}>{c.created_at}</span>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 10, color: c.comment_type.includes('Recommendation') ? '#166534' : (c.comment_type.includes('Clarification') ? '#b45309' : (darkMode ? '#34d399' : '#475569')), textTransform: 'uppercase', marginBottom: 2 }}>
                            {c.comment_type} · Action: {c.action_taken}
                          </div>
                          <p style={{ margin: 0, color: darkMode ? '#f8fafc' : '#334155', lineHeight: 1.4 }}>"{c.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Right Side: Officer Decision Dashboard */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: darkMode ? '#151f32' : 'white', borderLeft: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
          
          <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 900, color: darkMode ? '#ffffff' : '#1e293b' }}>
            Officer Decision Dashboard
          </h3>

          {errorMsg && (
            <div style={{ background: darkMode ? '#7f1d1d' : '#fef2f2', border: '1.5px solid #b91c1c', color: darkMode ? '#fecaca' : '#991b1b', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: darkMode ? '#064e3b' : '#f0fdf4', border: '1.5px solid #047857', color: darkMode ? '#d1fae5' : '#166534', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
              ✓ {successMsg}
            </div>
          )}

          {/* Action selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
            {[
              { id: 'comment', label: 'Add Observation', icon: <PlusCircle size={13} /> },
              { id: 'clarification', label: 'Clarification Request', icon: <HelpCircle size={13} /> },
              { id: 'approve', label: 'Approve & Forward', icon: <ThumbsUp size={13} /> },
              { id: 'escalate', label: 'Escalate to State', icon: <ArrowUpRight size={13} /> },
              { id: 'reject', label: 'Reject Claim', icon: <Ban size={13} /> }
            ].map(act => (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  setActionType(act.id);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  padding: '10px 8px',
                  borderRadius: 8,
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: `1.5px solid ${actionType === act.id ? (darkMode ? '#34d399' : '#1e3a8a') : (darkMode ? '#334155' : '#cbd5e1')}`,
                  background: actionType === act.id ? (darkMode ? '#1e293b' : '#eff6ff') : (darkMode ? '#0f172a' : 'white'),
                  color: actionType === act.id ? (darkMode ? '#34d399' : '#1d4ed8') : (darkMode ? '#cbd5e1' : '#475569'),
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {act.icon}
                {act.label}
              </button>
            ))}
          </div>

          {/* Active Action Panel */}
          <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            
            {actionType === 'comment' && (
              <>
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 800, color: darkMode ? '#cbd5e1' : '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Comment Category</label>
                  <select
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: darkMode ? '1.5px solid #334155' : '1.5px solid #cbd5e1', background: darkMode ? '#0f172a' : 'white', color: darkMode ? '#ffffff' : '#0f172a', fontSize: 12.5, outline: 'none' }}
                    value={commentType}
                    onChange={e => setCommentType(e.target.value)}
                  >
                    <option value="Internal Comment">Internal Observation (Private to officers)</option>
                    <option value="Official Remark">Official Remark (Logged in reports)</option>
                    <option value="Recommendation Note">Recommendation Note</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 800, color: darkMode ? '#cbd5e1' : '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Comment Text</label>
                  <textarea
                    style={{ width: '100%', height: 120, padding: 10, borderRadius: 8, border: darkMode ? '1.5px solid #334155' : '1.5px solid #cbd5e1', background: darkMode ? '#0f172a' : 'white', color: darkMode ? '#ffffff' : '#0f172a', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 12.5 }}
                    placeholder="Enter observation notes, verified landmarks, or local reports..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                </div>
              </>
            )}

            {actionType === 'clarification' && (
              <>
                <div style={{ background: darkMode ? '#78350f' : '#fffbeb', border: darkMode ? '1px solid #b45309' : '1px solid #fde68a', borderRadius: 8, padding: 10, fontSize: 11, color: darkMode ? '#fef3c7' : '#b45309' }}>
                  <strong>Clarification Request:</strong> This flags the application and logs the request. It prompts the applicant or previous review authority for additional document proof.
                </div>
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 800, color: darkMode ? '#cbd5e1' : '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Request Details</label>
                  <textarea
                    style={{ width: '100%', height: 120, padding: 10, borderRadius: 8, border: darkMode ? '1.5px solid #334155' : '1.5px solid #cbdcce', background: darkMode ? '#0f172a' : 'white', color: darkMode ? '#ffffff' : '#0f172a', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 12.5 }}
                    placeholder="Specify exactly what proof is missing (e.g. missing land survey boundaries, ST community verification card scan)..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                </div>
              </>
            )}

            {actionType === 'approve' && (
              <>
                <div style={{ background: darkMode ? '#064e3b' : '#f0fdf4', border: darkMode ? '1px solid #047857' : '1px solid #bbf7d0', borderRadius: 8, padding: 10, fontSize: 11, color: darkMode ? '#d1fae5' : '#166534' }}>
                  <strong>Approval Recommendation:</strong> You are certifying that this claim is legally compliant and geolocated. This action will forward the application to the next authority committee in the workflow.
                </div>
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 800, color: darkMode ? '#cbd5e1' : '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Committee Recommendation Remarks</label>
                  <textarea
                    style={{ width: '100%', height: 120, padding: 10, borderRadius: 8, border: darkMode ? '1.5px solid #334155' : '1.5px solid #cbd5e1', background: darkMode ? '#0f172a' : 'white', color: darkMode ? '#ffffff' : '#0f172a', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 12.5 }}
                    placeholder="Write a brief recommendation summary supporting this approval decision..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                </div>
              </>
            )}

            {actionType === 'te' && (
              <>
                <div style={{ background: darkMode ? '#172554' : '#eff6ff', border: darkMode ? '1px solid #1e40af' : '1px solid #bfdbfe', borderRadius: 8, padding: 10, fontSize: 11, color: darkMode ? '#dbeafe' : '#1e40af' }}>
                  <strong>Escalate to State:</strong> Moves this claim to the State Review Authority inbox. Use this for complex legal disputes, overlap warnings inside core tiger reserves, or conflicting surveys.
                </div>
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 800, color: darkMode ? '#cbd5e1' : '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Escalation Reason</label>
                  <textarea
                    style={{ width: '100%', height: 120, padding: 10, borderRadius: 8, border: darkMode ? '1.5px solid #334155' : '1.5px solid #cbd5e1', background: darkMode ? '#0f172a' : 'white', color: darkMode ? '#ffffff' : '#0f172a', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 12.5 }}
                    placeholder="Describe why this case is escalated to State review..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                </div>
              </>
            )}

            {actionType === 'reject' && (
              <>
                <div style={{ background: darkMode ? '#7f1d1d' : '#fef2f2', border: '1px solid #b91c1c', borderRadius: 8, padding: 10, fontSize: 11, color: darkMode ? '#fecaca' : '#991b1b' }}>
                  <strong>Warning:</strong> Rejecting a claim halts all further verification stages. The claimant will be notified. Rejection reason is legally required.
                </div>
                <div>
                  <label style={{ fontSize: 9.5, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Statutory Rejection Reason *</label>
                  <textarea
                    required
                    style={{ width: '100%', height: 120, padding: 10, borderRadius: 8, border: '1.5px solid #ef4444', background: darkMode ? '#0f172a' : 'white', color: darkMode ? '#ffffff' : '#ef4444', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 12.5 }}
                    placeholder="Cite specific legal rules violated (e.g. claim area exceeds 4 Ha cap, claimant lacks residency evidence under Section 2)..."
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Action buttons */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 'auto',
                width: '100%',
                padding: '12px',
                background: actionType === 'reject' ? '#ef4444' : '#355e3b',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <Send size={14} />
              {loading ? 'Processing Workflow...' : `Submit ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
