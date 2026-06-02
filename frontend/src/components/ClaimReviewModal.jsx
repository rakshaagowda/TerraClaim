import { useState, useEffect } from 'react';
import axios from 'axios';
import { validateClaim } from '../utils/ClaimValidator.js';
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
  const [status, setStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [gramSabhaDate, setGramSabhaDate] = useState('');
  const [sdlcDate, setSdlcDate] = useState('');
  const [dlcDate, setDlcDate] = useState('');
  const [titleDate, setTitleDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    if (record) {
      setStatus(record.status || 'Claim Filed');
      setRejectionReason(record.rejection_reason || '');
      setGramSabhaDate(record.gram_sabha_date || '');
      setSdlcDate(record.sdlc_date || '');
      setDlcDate(record.dlc_date || '');
      setTitleDate(record.title_date || '');
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
      title_date: status === 'Title Granted' ? (titleDate || new Date().toISOString().split('T')[0]) : (titleDate || null)
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
            <ShieldCheck size={18} color="#1a3a2a"/>
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
                    {c.status === 'Pass' ? <CheckCircle size={12} color="#22c55e"/> : <AlertTriangle size={12} color={c.status === 'Fail' ? '#ef4444' : '#f59e0b'}/>}
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
            <div>
              <span style={lblStyle}>Applicant Name</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{record.claimant_name || 'Village Community'}</div>
            </div>

            <div>
              <span style={lblStyle}>Village & District</span>
              <div style={{ fontSize: 12, color: '#475569' }}>{record.village} · {record.district}</div>
            </div>

            <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />

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
                  style={{ ...selStyle, height: 70, resize: 'none', fontFamily: 'inherit' }}
                  placeholder="State clear reasons for rejection (e.g. claim area exceeds limit, lack of occupancy evidence)..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            {/* Dates Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lblStyle}>Gram Sabha Date</label>
                <input type="date" style={selStyle} value={gramSabhaDate} onChange={e => setGramSabhaDate(e.target.value)} />
              </div>
              <div>
                <label style={lblStyle}>SDLC Approval Date</label>
                <input type="date" style={selStyle} value={sdlcDate} onChange={e => setSdlcDate(e.target.value)} />
              </div>
              <div>
                <label style={lblStyle}>DLC Approval Date</label>
                <input type="date" style={selStyle} value={dlcDate} onChange={e => setDlcDate(e.target.value)} />
              </div>
              <div>
                <label style={lblStyle}>Patta Title Date</label>
                <input type="date" style={selStyle} value={titleDate} onChange={e => setTitleDate(e.target.value)} />
              </div>
            </div>

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
              <Save size={13}/>
              {loading ? 'Saving...' : 'Save Review'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
