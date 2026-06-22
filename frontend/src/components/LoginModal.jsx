import React, { useState } from 'react';
import axios from 'axios';
import { UserCheck, ShieldAlert, Lock, HelpCircle, X } from 'lucide-react';

const API = 'http://localhost:8000';
const DISTRICTS = ['Mysuru', 'Chamarajanagara', 'Shivamogga', 'Chikkamagaluru', 'Kodagu', 'Hassan', 'Karnataka'];
const DESIGNATIONS = [
  'Gram Sabha Officer',
  'Forest Rights Officer (FRO)',
  'Sub-Divisional Committee (SDLC) Officer',
  'District Level Committee (DLC) Officer',
  'State Review Authority',
  'System Administrator'
];

export default function LoginModal({ onClose, onLoginSuccess }) {
  const savedId = localStorage.getItem('fra_officer_id') || 'KA-MYS-FRO-01-2026';
  const savedPass = localStorage.getItem('fra_password') || 'fra2006';
  const savedOtp = localStorage.getItem('fra_security_otp') || '123456';
  const savedDesg = localStorage.getItem('fra_designation') || DESIGNATIONS[0];
  const savedJuris = localStorage.getItem('fra_jurisdiction') || DISTRICTS[0];
  const savedRemember = localStorage.getItem('fra_remember') !== 'false';

  const [officerId, setOfficerId] = useState(savedId);
  const [password, setPassword] = useState(savedPass);
  const [securityOtp, setSecurityOtp] = useState(savedOtp);
  const [designation, setDesignation] = useState(savedDesg);
  const [jurisdiction, setJurisdiction] = useState(savedJuris);
  const [remember, setRemember] = useState(savedRemember);
  const [showDemoTips, setShowDemoTips] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!officerId.trim() || !password.trim() || !securityOtp.trim()) {
      setError('Please fill out all administrative credentials and security factors.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      officer_id: officerId,
      password: password,
      designation: designation,
      jurisdiction: jurisdiction,
      security_otp: securityOtp
    };

    axios.post(`${API}/api/auth/officer/login`, payload)
      .then(res => {
        setLoading(false);
        if (remember) {
          localStorage.setItem('fra_officer_id', officerId);
          localStorage.setItem('fra_password', password);
          localStorage.setItem('fra_security_otp', securityOtp);
          localStorage.setItem('fra_designation', designation);
          localStorage.setItem('fra_jurisdiction', jurisdiction);
          localStorage.setItem('fra_remember', 'true');
        } else {
          localStorage.removeItem('fra_officer_id');
          localStorage.removeItem('fra_password');
          localStorage.removeItem('fra_security_otp');
          localStorage.removeItem('fra_designation');
          localStorage.removeItem('fra_jurisdiction');
          localStorage.setItem('fra_remember', 'false');
        }
        onLoginSuccess(res.data);
      })
      .catch(err => {
        setLoading(false);
        setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
      });
  };

  const iptStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1.5px solid #cbd5e1',
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: 13,
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
  };

  const labelStyle = {
    fontSize: 10,
    fontWeight: 800,
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
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'white',
        width: 460,
        maxHeight: '95vh',
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header decoration */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          padding: '20px 24px',
          color: 'white',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: 16,
              top: 16,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <X size={14} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck size={20} color="#93c5fd" />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: -0.3 }}>
              Official Login Portal
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#bfdbfe', lineHeight: 1.4 }}>
            Verification and review controls are restricted to authorized district officers with matching multi-factor clearance.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Demo Credentials Helper Box */}
          <div style={{
            background: '#f0f7ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            padding: '10px',
            fontSize: 11,
            color: '#1e3a8a'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowDemoTips(!showDemoTips)}>
              <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                <HelpCircle size={14} /> Authorized Demo Accounts Check-in
              </span>
              <span style={{ fontSize: 9 }}>{showDemoTips ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
            </div>
            
            {showDemoTips && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 9.5, color: '#475569', borderBottom: '1px solid #dbeafe', paddingBottom: 4 }}>
                  Select one to auto-populate the matching multi-factor credentials:
                </div>
                {[
                  {
                    id: 'KA-MYS-FRO-01-2026',
                    role: 'Forest Rights Officer (FRO)',
                    dist: 'Mysuru',
                    label: 'FRO (Mysuru District)'
                  },
                  {
                    id: 'KA-KOD-SDLC-02-2026',
                    role: 'Sub-Divisional Committee (SDLC) Officer',
                    dist: 'Kodagu',
                    label: 'SDLC (Kodagu District)'
                  },
                  {
                    id: 'KA-KOD-DLC-03-2026',
                    role: 'District Level Committee (DLC) Officer',
                    dist: 'Kodagu',
                    label: 'DLC (Kodagu District)'
                  },
                  {
                    id: 'KA-KAR-STATE-01-2026',
                    role: 'State Review Authority',
                    dist: 'Karnataka',
                    label: 'State Authority (Karnataka)'
                  },
                  {
                    id: 'KA-KAR-ADMIN-01-2026',
                    role: 'System Administrator',
                    dist: 'Karnataka',
                    label: 'System Admin (Karnataka)'
                  }
                ].map(cred => (
                  <div key={cred.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '6px 8px', borderRadius: 4, border: '1px solid #dbeafe' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 10, color: '#1e293b' }}>{cred.label}</div>
                      <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#1d4ed8', fontWeight: 600 }}>ID: {cred.id}</div>
                      <div style={{ fontSize: 8.5, color: '#64748b' }}>Passcode: fra2006 · OTP: 123456</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOfficerId(cred.id);
                        setPassword('fra2006');
                        setSecurityOtp('123456');
                        setDesignation(cred.role);
                        setJurisdiction(cred.dist);
                        setError('');
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#1d4ed8',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 9.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1e40af'}
                      onMouseLeave={e => e.currentTarget.style.background = '#1d4ed8'}
                    >
                      Load Demo
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#991b1b',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Standardized Officer ID</label>
              <input
                type="text"
                disabled={loading}
                style={iptStyle}
                placeholder="e.g., KA-MYS-FRO-01-2026"
                value={officerId}
                onChange={e => setOfficerId(e.target.value)}
              />
              <span style={{ fontSize: 9, color: '#64748b', marginTop: 2, display: 'block' }}>
                Format: KA-[DISTRICT]-[DESIGNATION]-[SERIAL]-[YEAR]
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Security Passcode</label>
                <input
                  type="password"
                  disabled={loading}
                  style={iptStyle}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>6-Digit Security OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  disabled={loading}
                  style={iptStyle}
                  placeholder="e.g., 123456"
                  value={securityOtp}
                  onChange={e => setSecurityOtp(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Designated Role</label>
              <select
                disabled={loading}
                style={iptStyle}
                value={designation}
                onChange={e => setDesignation(e.target.value)}
              >
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <div>
              <label style={labelStyle}>District Jurisdiction Boundary</label>
              <select
                disabled={loading}
                style={iptStyle}
                value={jurisdiction}
                onChange={e => setJurisdiction(e.target.value)}
              >
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <span style={{ fontSize: 9.5, color: '#64748b', marginTop: 4, display: 'block', lineHeight: 1.3 }}>
                ⚠️ Access to maps, sidebar registers, and review actions is locked to this district.
              </span>
            </div>

            {/* Remember Credentials Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0' }}>
              <input
                type="checkbox"
                id="rememberCreds"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ cursor: 'pointer', width: 14, height: 14 }}
              />
              <label htmlFor="rememberCreds" style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                Remember credentials on this device
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: 'none',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 8,
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1.5,
                  padding: '11px',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)'
                }}
              >
                <Lock size={14} />
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
