import React, { useState } from 'react'
import { Settings, Shield, Globe, Bell, Sliders, Save, Database } from 'lucide-react'

export default function SettingsPanel() {
  const [buffer, setBuffer] = useState(50)
  const [ndvi, setNdvi] = useState(0.42)
  const [canopy, setCanopy] = useState(0.60)
  const [autoEscalate, setAutoEscalate] = useState(true)
  const [alertFrequency, setAlertFrequency] = useState('Immediate')
  const [theme, setTheme] = useState('Earth Intelligence')

  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 24px', overflowY: 'auto' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
          System Settings & Parameters
        </h2>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
          Configure statutory spatial buffer tolerances, remote-sensing criteria, and alert variables
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
        
        {/* Card 1: Spatial Engine */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={16} color="var(--primary)" /> Spatial Ledger & GIS Settings
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                Protected Sanctuary Buffer Distance: <strong>{buffer} meters</strong>
              </label>
              <input 
                type="range" min="10" max="200" step="5"
                style={{ width: '100%', accentColor: 'var(--primary)' }}
                value={buffer} onChange={e => setBuffer(parseInt(e.target.value))}
              />
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                Boundary intersection tolerance for wild tiger reserves and state national parks.
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>IFR Min NDVI Threshold</label>
                <input 
                  type="number" step="0.01" min="0.1" max="0.9"
                  style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none' }}
                  value={ndvi} onChange={e => setNdvi(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>CFR Min Canopy NDVI</label>
                <input 
                  type="number" step="0.01" min="0.1" max="0.9"
                  style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none' }}
                  value={canopy} onChange={e => setCanopy(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Decision Pipeline */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={16} color="var(--accent)" /> Workflow & Evaluation Rules
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>Automatic DLC Escalation</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Escalate claims containing wildlife overlaps directly to State review.</span>
              </div>
              <input 
                type="checkbox" 
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                checked={autoEscalate} onChange={e => setAutoEscalate(e.target.checked)}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Risk Alert Push Frequency</label>
              <select
                style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none', cursor: 'pointer' }}
                value={alertFrequency} onChange={e => setAlertFrequency(e.target.value)}
              >
                <option value="Immediate">Immediate (On upload)</option>
                <option value="Daily">Daily Summary Digest</option>
                <option value="Weekly">Weekly Batch Report</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 3: Dashboard Theme */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Database size={16} color="#7c4dff" /> UI Visual System
          </h4>
          
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Active Theme Template</label>
            <select
              style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none', cursor: 'pointer' }}
              value={theme} onChange={e => setTheme(e.target.value)}
            >
              <option value="Earth Intelligence">Earth Intelligence (Glassmorphism & Greens)</option>
              <option value="Satellite Dark">ArcGIS Dark (Dark Gray & Green Highlights)</option>
              <option value="Standard Government">Standard Gov (Sleek light blue contrast)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, alignSelf: 'flex-end', marginTop: 4 }}>
          {saved && (
            <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700 }} className="fade-in">
              ✓ System parameters updated successfully!
            </span>
          )}
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: 'var(--shadow-sm)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            <Save size={14} />
            Save Configuration
          </button>
        </div>

      </form>
    </div>
  )
}
