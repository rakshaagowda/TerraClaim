import React from 'react';
import { FileText, Users, Compass, Landmark, Award, XCircle, CheckCircle2 } from 'lucide-react';

const STATUS_ORDER = [
  'Claim Filed',
  'Gram Sabha Resolved',
  'Under Verification',
  'SDLC Approved',
  'DLC Approved',
  'Title Granted',
];

export default function ClaimStepper({ record }) {
  if (!record) return null;

  const currentStatus = record.status;
  const isRejected = currentStatus === 'Rejected';

  // Helper to determine the state of each step
  function getStepState(stepIndex) {
    // stepIndex: 0 = Registered, 1 = Gram Sabha, 2 = SDLC / Verification, 3 = DLC, 4 = Title
    if (isRejected) {
      // Find the last completed step by checking dates
      const dates = [
        true, // Step 1 is always true
        !!record.gram_sabha_date,
        !!record.sdlc_date,
        !!record.dlc_date,
        !!record.title_date
      ];

      // If we are at the step that is missing, and it's the first missing one, it's 'failed'
      const firstMissing = dates.indexOf(false);
      if (stepIndex < firstMissing) return 'completed';
      if (stepIndex === firstMissing || (firstMissing === -1 && stepIndex === 4)) return 'failed';
      return 'pending';
    }

    // Normal processing flow
    let statusIdx = STATUS_ORDER.indexOf(currentStatus);
    if (statusIdx === -1) statusIdx = 0; // Default to Claim Filed

    // SDLC Approved counts as step 3 (index 2) completed, moving to step 4 (index 3)
    if (currentStatus === 'SDLC Approved') {
      if (stepIndex < 3) return 'completed';
      if (stepIndex === 3) return 'active';
      return 'pending';
    }

    // DLC Approved counts as step 4 (index 3) completed, moving to step 5 (index 4)
    if (currentStatus === 'DLC Approved') {
      if (stepIndex < 4) return 'completed';
      if (stepIndex === 4) return 'active';
      return 'pending';
    }

    if (currentStatus === 'Title Granted') {
      return 'completed';
    }

    const stepStatusMapping = [0, 1, 2, 4, 5]; // Maps step index to STATUS_ORDER index
    const targetIdx = stepStatusMapping[stepIndex];

    if (statusIdx > targetIdx) {
      return 'completed';
    } else if (statusIdx === targetIdx) {
      return 'active';
    } else {
      return 'pending';
    }
  }

  const steps = [
    {
      title: 'Claim Registration',
      subtitle: 'Form A/B/C Registration',
      desc: 'Application form is submitted, geolocated point added, and Claimant record cataloged in the spatial database.',
      icon: <FileText size={18} />,
      date: record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Initial Phase',
      details: `Form Type: ${record.form_type || 'Individual Claim'} · Area: ${parseFloat(record.claim_area_acres || 0).toFixed(2)} Acres.`
    },
    {
      title: 'Gram Sabha Resolution',
      subtitle: 'Village assembly review',
      desc: 'Local village assembly holds public boundary verification hearings, takes oral statements from elders, and passes a resolution.',
      icon: <Users size={18} />,
      date: record.gram_sabha_date ? new Date(record.gram_sabha_date).toLocaleDateString() : null,
      details: record.gram_sabha_date 
        ? '✓ Quorum verified (50%+ villagers present including 1/3 women). Resolution approved.'
        : 'Pending Gram Sabha assembly and local resolution passing.'
    },
    {
      title: 'Joint Field Verification',
      subtitle: 'SDLC Review & GIS Mapping',
      desc: 'Sub-Divisional Level Committee performs GPS survey to verify physical cultivation bounds and checks category/occupancy proofs.',
      icon: <Compass size={18} />,
      date: record.sdlc_date ? new Date(record.sdlc_date).toLocaleDateString() : null,
      details: record.sdlc_date
        ? `✓ Recommended by SDLC on ${new Date(record.sdlc_date).toLocaleDateString()}. Land coordinates uploaded.`
        : (currentStatus === 'Under Verification' ? '⚡ Joint Forest Inspection team currently conducting physical GPS audit.' : 'Pending SDLC field verification.')
    },
    {
      title: 'DLC Committee Review',
      subtitle: 'District Level Audit',
      desc: 'District Level Committee (headed by Collector) verifies compliance with the 4-Hectare ceiling cap, ST/OTFD laws, and overlaps.',
      icon: <Landmark size={18} />,
      date: record.dlc_date ? new Date(record.dlc_date).toLocaleDateString() : null,
      details: record.dlc_date
        ? `✓ DLC final clearance approved.`
        : (currentStatus === 'DLC Approved' ? '✓ DLC Approved' : 'Pending final legal audit by District Collector Committee.')
    },
    {
      title: 'Title Deed Issuance',
      subtitle: 'Official Patta Registered',
      desc: 'Final legal registration of forest land title deed. Official certificate generated with QR code, boundary records, and state seals.',
      icon: <Award size={18} />,
      date: record.title_date ? new Date(record.title_date).toLocaleDateString() : null,
      details: currentStatus === 'Title Granted'
        ? `✓ Title Granted on ${new Date(record.title_date).toLocaleDateString()}. Digital Certificate available.`
        : (isRejected ? `❌ Claim Rejected: ${record.rejection_reason || 'Criteria not met.'}` : 'Pending final title deed generation.')
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '12px 6px' }}>
      {steps.map((step, idx) => {
        const state = getStepState(idx);
        
        let colorTheme = {
          bg: '#f1f5f9',
          border: '#cbd5e1',
          text: '#475569',
          badgeBg: '#f8fafc',
          badgeText: '#64748b',
          pillBg: '#f1f5f9',
          pillText: '#64748b',
          pillLabel: 'Pending'
        };

        if (state === 'completed') {
          colorTheme = {
            bg: '#ecfdf5',
            border: '#a7f3d0',
            text: '#065f46',
            badgeBg: '#10b981',
            badgeText: '#ffffff',
            pillBg: '#d1fae5',
            pillText: '#065f46',
            pillLabel: 'Approved'
          };
        } else if (state === 'active') {
          colorTheme = {
            bg: '#f0f9ff',
            border: '#bae6fd',
            text: '#075985',
            badgeBg: '#0284c7',
            badgeText: '#ffffff',
            pillBg: '#e0f2fe',
            pillText: '#0369a1',
            pillLabel: 'Active Phase'
          };
        } else if (state === 'failed') {
          colorTheme = {
            bg: '#fef2f2',
            border: '#fecaca',
            text: '#991b1b',
            badgeBg: '#ef4444',
            badgeText: '#ffffff',
            pillBg: '#fee2e2',
            pillText: '#991b1b',
            pillLabel: 'Rejected / Stalled'
          };
        }

        return (
          <div key={idx} style={{ display: 'flex', gap: 16, position: 'relative' }}>
            {/* Timeline Line */}
            {idx < steps.length - 1 && (
              <div style={{
                position: 'absolute',
                left: 20,
                top: 40,
                bottom: -24,
                width: 2,
                backgroundColor: state === 'completed' ? '#10b981' : '#e2e8f0',
                zIndex: 1
              }} />
            )}

            {/* Badge Icon */}
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              backgroundColor: colorTheme.badgeBg,
              color: colorTheme.badgeText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2.5px solid ${state === 'pending' ? '#cbd5e1' : colorTheme.badgeBg}`,
              zIndex: 2,
              boxShadow: state === 'active' ? '0 0 0 4px rgba(2, 132, 199, 0.15)' : 'none',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}>
              {state === 'failed' ? <XCircle size={18} /> : (state === 'completed' && idx === steps.length - 1 ? <CheckCircle2 size={18} /> : step.icon)}
            </div>

            {/* Content Card */}
            <div style={{
              flex: 1,
              background: '#ffffff',
              border: `1px solid ${colorTheme.border}`,
              borderRadius: 10,
              padding: '14px 16px',
              boxShadow: state === 'active' ? '0 4px 12px rgba(2, 132, 199, 0.04)' : '0 2px 4px rgba(0,0,0,0.01)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: state === 'pending' ? '#475569' : '#0f172a' }}>
                    {step.title}
                  </h4>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {step.subtitle}
                  </span>
                </div>
                
                <span style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  padding: '3px 8px',
                  borderRadius: 20,
                  backgroundColor: colorTheme.pillBg,
                  color: colorTheme.pillText
                }}>
                  {colorTheme.pillLabel}
                </span>
              </div>

              <p style={{ margin: '8px 0', fontSize: 11.5, color: '#475569', lineHeight: 1.4 }}>
                {step.desc}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', marginTop: 8, paddingTop: 8, fontSize: 10.5 }}>
                <span style={{ color: colorTheme.text, fontWeight: 600 }}>
                  {step.details}
                </span>
                {step.date && (
                  <span style={{ fontFamily: 'monospace', color: '#64748b', fontWeight: 700 }}>
                    📅 {step.date}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
