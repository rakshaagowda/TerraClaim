import { useState } from 'react';
import { BookOpen, FileText, Landmark, Compass, Award, HelpCircle, X, Info, Settings, Leaf, PlusCircle } from 'lucide-react';

const GUIDE_ITEMS = [
  {
    id: 'fra',
    title: 'The Forest Rights Act, 2006',
    icon: <Landmark size={24} color="#2e7d32" />,
    shortDesc: 'Historical background, statutory objectives, and legal provisions for forest-dwelling communities.',
    bg: '#edf5ed',
    details: (
      <div>
        <h4 style={{ color: '#2e7d32', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Overview & Historical Context</h4>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#2d4030', marginBottom: 10 }}>
          The Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006, was enacted to redress the "historical injustice" committed against forest-dwelling communities whose land and resource rights were not formally recorded during colonial and post-independence consolidation.
        </p>
        <h5 style={{ color: '#355e3b', fontSize: 13, fontWeight: 700, margin: '12px 0 6px' }}>Key Legal Pillars:</h5>
        <ul style={{ paddingLeft: 18, fontSize: 13, color: '#2d4030', lineHeight: 1.6 }}>
          <li><strong>Recognition of Rights</strong>: Records land occupancy, minor forest produce access, and custom habitat rights.</li>
          <li><strong>Conservation & Protection</strong>: Empowers communities to protect local biodiversity, wildlife, and natural water streams.</li>
          <li><strong>Sovereign Consent</strong>: Prohibits displacement or eviction of forest dwellers without the written consent of the local Gram Sabha.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'forms',
    title: 'FRA Claim Forms (A, B, C)',
    icon: <FileText size={24} color="#2e7d32" />,
    shortDesc: 'Understanding the differences between Individual Forest Rights (IFR), Community Rights (CR), and Community Forest Resources (CFR).',
    bg: '#edf5ed',
    details: (
      <div>
        <h4 style={{ color: '#2e7d32', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Statutory Claim Templates</h4>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#2d4030', marginBottom: 10 }}>
          The Forest Rights Act defines three specific application templates for claiming titles:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <div style={{ padding: '8px 12px', background: '#f4f9f4', borderRadius: 6, borderLeft: '3px solid #2e7d32' }}>
            <strong style={{ fontSize: 12, color: '#132a13' }}>Form A: Individual Forest Rights (IFR)</strong>
            <p style={{ fontSize: 11, color: '#4a5568', margin: '2px 0 0' }}>Filed by individual households for housing and agricultural cultivation plots. Legally capped at 4.0 hectares (9.88 acres).</p>
          </div>
          <div style={{ padding: '8px 12px', background: '#f1f8f9', borderRadius: 6, borderLeft: '3px solid #1976d2' }}>
            <strong style={{ fontSize: 12, color: '#132a13' }}>Form B: Community Rights (CR)</strong>
            <p style={{ fontSize: 11, color: '#4a5568', margin: '2px 0 0' }}>Submitted jointly by the village Gram Sabha to claim access to shared resources like grazing fields, water bodies, and minor government infrastructure.</p>
          </div>
          <div style={{ padding: '8px 12px', background: '#fffbeb', borderRadius: 6, borderLeft: '3px solid #ef6c00' }}>
            <strong style={{ fontSize: 12, color: '#132a13' }}>Form C: Community Forest Resources (CFR)</strong>
            <p style={{ fontSize: 11, color: '#4a5568', margin: '2px 0 0' }}>Protects the village’s customary rights to protect, conserve, manage, and sustainably harvest non-timber forest produce (honey, soapnuts, amla, etc.) within traditional boundaries.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'pattas',
    title: 'Patta Land Titles',
    icon: <Award size={24} color="#2e7d32" />,
    shortDesc: 'Official land title certificates, heritable entitlements, non-transferability, and joint-spouse registration rules.',
    bg: '#edf5ed',
    details: (
      <div>
        <h4 style={{ color: '#2e7d32', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Legal Protections of Pattas</h4>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#2d4030' }}>
          An approved title deed (Patta) issued under the Forest Rights Act represents a permanent legal record of land ownership with strict indigenous protections:
        </p>
        <h5 style={{ color: '#355e3b', fontSize: 13, fontWeight: 700, margin: '12px 0 6px' }}>Key Provisions:</h5>
        <ul style={{ paddingLeft: 18, fontSize: 13, color: '#2d4030', lineHeight: 1.6 }}>
          <li><strong>Heritable Rights</strong>: The land rights pass directly to the legal heirs upon the holder’s death.</li>
          <li><strong>Non-Transferable</strong>: The land cannot be sold, leased, or mortgaged to outsiders, preserving indigenous lands from commercial exploitation.</li>
          <li><strong>Joint Ownership</strong>: Formally registered under the joint names of both spouses to protect family unit security.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'tribes',
    title: 'Scheduled Tribes & OTFDs',
    icon: <Leaf size={24} color="#2e7d32" />,
    shortDesc: 'Profiles of Forest Scheduled Tribes (FDST) and Other Traditional Forest Dwellers (OTFD) dependency rules.',
    bg: '#edf5ed',
    details: (
      <div>
        <h4 style={{ color: '#2e7d32', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Forest Dwellers Classifications</h4>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#2d4030', marginBottom: 10 }}>
          The Act classifies forest dwellers into two distinct categories, each with different eligibility thresholds:
        </p>
        <ul style={{ paddingLeft: 18, fontSize: 13, color: '#2d4030', lineHeight: 1.6 }}>
          <li><strong>Forest Dwelling Scheduled Tribes (FDST)</strong>: Scheduled Tribes residing in and dependent on forest land prior to <strong>December 13, 2005</strong>.</li>
          <li><strong>Other Traditional Forest Dwellers (OTFD)</strong>: Non-tribals who can prove continuous residence and dependency on forest land for at least <strong>3 generations (75 years)</strong> prior to December 13, 2005.</li>
        </ul>
        <div style={{ marginTop: 12, padding: 10, background: '#e8f2e8', borderRadius: 6, fontSize: 11, color: '#2d5a27' }}>
          💡 <strong>Special Focus</strong>: Highly vulnerable tribal communities (PVTGs) like the <strong>Soligas</strong> and <strong>Jenu Kurubas</strong> are prioritized for DSS welfare schemes.
        </div>
      </div>
    )
  },
  {
    id: 'claims',
    title: 'Claims Validation Pipeline',
    icon: <Compass size={24} color="#2e7d32" />,
    shortDesc: 'Validation statuses from initial filing, Gram Sabha survey, to final district level approval.',
    bg: '#edf5ed',
    details: (
      <div>
        <h4 style={{ color: '#2e7d32', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>The 3-Tier Committee Audits</h4>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#2d4030' }}>
          No title deed can be issued without going through the statutory 3-tier committee verification system:
        </p>
        <ol style={{ paddingLeft: 18, fontSize: 13, color: '#2d4030', lineHeight: 1.6, marginTop: 8 }}>
          <li><strong>Claim Filed</strong>: Initial application uploaded with claimant details.</li>
          <li><strong>Gram Sabha Resolved</strong>: Local village assembly FRC completes boundary surveys and passes resolution.</li>
          <li><strong>Under Verification / SDLC Approved</strong>: Sub-Divisional Committee verifies maps and recommends approval.</li>
          <li><strong>DLC Approved</strong>: District Level Committee (Final deciding authority chaired by DM) formally approves the claim.</li>
          <li><strong>Title Granted</strong>: The official Patta title deed certificate is generated and registered.</li>
        </ol>
      </div>
    )
  },
  {
    id: 'functionality',
    title: 'Webpage Functionality',
    icon: <Settings size={24} color="#2e7d32" />,
    shortDesc: 'Learn how to navigate the WebGIS Map, Search Plots ledger, DSS welfare matrix, and Official review mode.',
    bg: '#edf5ed',
    details: (
      <div>
        <h4 style={{ color: '#2e7d32', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Platform Navigation & Tools</h4>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#2d4030' }}>
          TerraClaim is structured as a desktop-grade spatial ledger dashboard containing five core modules:
        </p>
        <ul style={{ paddingLeft: 18, fontSize: 13, color: '#2d4030', lineHeight: 1.6, marginTop: 8 }}>
          <li><strong>WebGIS Map</strong>: Visualizes claims coordinates, boundary points, and overlays remote sensing Sentinel satellite imagery.</li>
          <li><strong>Search Plots</strong>: A master ledger database where you can apply filters (District, Status, Tribe) and keyword search to locate specific claims.</li>
          <li><strong>Analytics</strong>: Live aggregations tracking conversion rates, district claims count, and tribal area coverage.</li>
          <li><strong>DSS Welfare</strong>: Cross-checks approved claimants and routes them for welfare eligibility (PM-KISAN, housing, crop insurance).</li>
          <li><strong>Official Mode</strong>: Accessible via the role switcher in the top right, enabling administrators to review and approve claims.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'apply',
    title: 'Applying for a Claim',
    icon: <PlusCircle size={24} color="#2e7d32" />,
    shortDesc: 'Visual step-by-step flowchart and statutory processes for filing new forest rights claims.',
    bg: '#e8f5e9',
    details: null // Handled dynamically in modal render
  }
];

export default function Guide() {
  const [activeId, setActiveId] = useState(null);

  const activeItem = GUIDE_ITEMS.find(g => g.id === activeId);

  return (
    <div style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f4f9f4',
      padding: '20px 24px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a301a', margin: 0 }}>TerraClaim Compliance & Information Guide</h2>
          <p style={{ fontSize: 11, color: '#4a7c59', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
            Statutory Legal Framework and Application Procedures
          </p>
        </div>
        
        <div style={{
          background: '#e8f2e8',
          border: '1px solid #cbdcce',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 440
        }}>
          <Info size={16} color="#2e7d32" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#2d4030', lineHeight: 1.3 }}>
            <strong>Guide Overview</strong>: Select any card below to learn about the Forest Rights Act, form types, Patta entitlements, and the step-by-step claim application flowchart.
          </span>
        </div>
      </div>

      {/* Guide Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
        flex: 1,
        overflowY: 'auto',
        paddingRight: 4,
        alignContent: 'start'
      }}>
        {GUIDE_ITEMS.map(g => (
          <div
            key={g.id}
            onClick={() => setActiveId(g.id)}
            style={{
              background: 'white',
              border: g.id === 'apply' ? '1.5px solid #a5d6a7' : '1px solid #c8dcd0',
              borderRadius: 10,
              padding: '20px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.01)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '180px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#2e7d32';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(46,125,50,0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = g.id === 'apply' ? '#a5d6a7' : '#c8dcd0';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.01)';
            }}
          >
            <div>
              <div style={{
                width: 44,
                height: 44,
                background: g.id === 'apply' ? '#e8f5e9' : '#e8f2e8',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14
              }}>
                {g.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a301a', margin: '0 0 8px' }}>{g.title}</h3>
              <p style={{ fontSize: 11.5, color: '#556a59', lineHeight: 1.4, margin: 0 }}>{g.shortDesc}</p>
            </div>

            <div style={{
              marginTop: 16,
              fontSize: 11,
              fontWeight: 700,
              color: '#2e7d32',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              {g.id === 'apply' ? 'View Flowchart ➔' : 'Learn More ➔'}
            </div>
          </div>
        ))}
      </div>

      {/* Centered Guide Modal Popup */}
      {activeItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            width: activeItem.id === 'apply' ? 620 : 480,
            borderRadius: 12,
            border: '1px solid #c8dcd0',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Header */}
            <div style={{
              background: '#edf5ed',
              borderBottom: '1px solid #cbdcce',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeItem.icon}
                <span style={{ fontSize: 14, fontWeight: 800, color: '#132a13' }}>{activeItem.title}</span>
              </div>
              <button
                onClick={() => setActiveId(null)}
                style={{ background: 'none', border: 'none', color: '#556a59', cursor: 'pointer', fontSize: 16 }}
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {activeItem.id === 'apply' ? (
                <div>
                  <h4 style={{ color: '#2e7d32', fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Claim Application & Audit Flowchart</h4>
                  <p style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5, marginBottom: 16 }}>
                    Follow this statutory sequence of steps and committees to apply for and register forest land rights under the Forest Rights Act (FRA) 2006.
                  </p>
                  
                  {/* SVG Flowchart Diagram */}
                  <svg viewBox="0 0 540 330" style={{ width: '100%', height: 'auto', background: '#f4f9f4', borderRadius: 8, padding: '16px 12px', border: '1px solid #cbdcce', marginBottom: 16 }}>
                    {/* Definitions */}
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#2e7d32" />
                      </marker>
                    </defs>

                    {/* Step 1: Submission */}
                    <rect x="15" y="15" width="145" height="55" rx="6" fill="#ffffff" stroke="#2e7d32" strokeWidth="1.5" />
                    <text x="87" y="33" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#132a13">1. Claim Submission</text>
                    <text x="87" y="46" textAnchor="middle" fontSize="8" fill="#556a59">FRC compiles Form A/B/C</text>
                    <text x="87" y="56" textAnchor="middle" fontSize="7.5" fill="#556a59">with proofs & GPS bounds</text>

                    {/* Arrow 1 -> 2 */}
                    <path d="M 87 70 L 87 105" stroke="#2e7d32" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />

                    {/* Step 2: Gram Sabha */}
                    <rect x="15" y="115" width="145" height="55" rx="6" fill="#ffffff" stroke="#2e7d32" strokeWidth="1.5" />
                    <text x="87" y="133" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#132a13">2. Gram Sabha Resolution</text>
                    <text x="87" y="146" textAnchor="middle" fontSize="8" fill="#556a59">Village meeting verifies</text>
                    <text x="87" y="156" textAnchor="middle" fontSize="7.5" fill="#556a59">occupancy & passes resolution</text>

                    {/* Arrow 2 -> 3 */}
                    <path d="M 160 142.5 L 188 142.5" stroke="#2e7d32" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />

                    {/* Step 3: SDLC */}
                    <rect x="195" y="115" width="145" height="55" rx="6" fill="#ffffff" stroke="#2e7d32" strokeWidth="1.5" />
                    <text x="267" y="133" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#132a13">3. SDLC Auditing</text>
                    <text x="267" y="146" textAnchor="middle" fontSize="8" fill="#556a59">Sub-Division reviews maps,</text>
                    <text x="267" y="156" textAnchor="middle" fontSize="7.5" fill="#556a59">checks list, & recommends</text>

                    {/* Arrow 3 -> 4 */}
                    <path d="M 340 142.5 L 368 142.5" stroke="#2e7d32" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />

                    {/* Step 4: DLC */}
                    <rect x="375" y="115" width="145" height="55" rx="6" fill="#ffffff" stroke="#2e7d32" strokeWidth="1.5" />
                    <text x="447" y="133" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#132a13">4. DLC Decision</text>
                    <text x="447" y="146" textAnchor="middle" fontSize="8" fill="#556a59">District level final vote,</text>
                    <text x="447" y="156" textAnchor="middle" fontSize="7.5" fill="#556a59">approves/rejects claims</text>

                    {/* Arrow 4 -> 5 */}
                    <path d="M 447 170 L 447 225" stroke="#2e7d32" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />

                    {/* Step 5: Patta Title */}
                    <rect x="290" y="235" width="230" height="65" rx="6" fill="#2e7d32" stroke="#1b4d22" strokeWidth="1.5" />
                    <text x="405" y="256" textAnchor="middle" fontSize="12" fontWeight="800" fill="#ffffff">5. Title Deed (Patta)</text>
                    <text x="405" y="271" textAnchor="middle" fontSize="8.5" fill="#e8f5e9">Permanent, Digitized & Jointly Registered</text>
                    <text x="405" y="283" textAnchor="middle" fontSize="8" fill="#c8e6c9">Heritable · Non-Transferable · Legal Certificate</text>
                  </svg>
                  
                  <div style={{ padding: 12, background: '#fff9e6', border: '1px solid #ffe0b2', borderRadius: 6, fontSize: 11, color: '#e65100', lineHeight: 1.4 }}>
                    ⚠️ <strong>Notice</strong>: If a claim is rejected at any level (Gram Sabha, SDLC, or DLC), the claimant has a statutory right to appeal within <strong>60 days</strong> to the next higher committee.
                  </div>
                </div>
              ) : (
                activeItem.details
              )}
            </div>
            
            {/* Footer */}
            <div style={{
              borderTop: '1px solid #e2e8f0',
              padding: '12px 20px',
              background: '#f9fafb',
              display: 'flex',
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button
                onClick={() => setActiveId(null)}
                style={{
                  background: '#2e7d32',
                  border: 'none',
                  color: 'white',
                  borderRadius: 6,
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
