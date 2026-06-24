import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Printer, X, Shield, QrCode, Award, Leaf, MapPin, Calendar, Hash } from 'lucide-react';

export default function PattaCertificate({ record, onClose }) {
  const printRef = useRef(null);

  if (!record) return null;

  const handlePrint = () => window.print();

  const acres = parseFloat(record.claim_area_acres || 0);
  const ha = parseFloat(record.claim_area_ha || (acres * 0.404686));
  const issueDate = record.title_date || record.dlc_date || new Date().toISOString().split('T')[0];

  // Mock QR pattern cells
  const qrGrid = [
    [1,1,1,0,1,0,1,1,1],
    [1,0,1,0,0,0,1,0,1],
    [1,0,1,1,0,1,1,0,1],
    [1,1,1,0,0,0,1,1,1],
    [0,0,0,1,1,1,0,0,0],
    [1,0,1,0,1,0,1,1,0],
    [1,0,1,1,1,0,0,0,1],
    [1,1,0,0,1,1,1,0,0],
    [0,1,1,0,0,0,1,1,1],
  ];

  const fieldGroups = [
    {
      title: 'Claimant Identification',
      fields: [
        { label: 'Full Name / Community', value: record.claimant_name || 'Village Community Representative' },
        { label: 'Tribal Community Group', value: record.tribal_community || 'Other Traditional Forest Dwellers' },
      ]
    },
    {
      title: 'Land Parcel Details',
      fields: [
        { label: 'Village Location', value: record.village || 'N/A' },
        { label: 'District & Taluk', value: `${record.district || 'N/A'} District · ${record.taluk || 'N/A'} Taluk` },
        { label: 'Registered Land Area', value: `${acres.toFixed(2)} Acres  (${ha.toFixed(4)} Hectares)` },
        { label: 'Parcel GPS Coordinates', value: `Lat: ${parseFloat(record.lat || 0).toFixed(6)}° N  ·  Lng: ${parseFloat(record.lng || 0).toFixed(6)}° E`, mono: true },
      ]
    },
    {
      title: 'Administrative Record',
      fields: [
        { label: 'Patta Title ID', value: record.patta_id, mono: true },
        { label: 'Date of Issue', value: new Date(issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
        { label: 'Form / Rights Type', value: record.form_type },
        { label: 'Verification Status', value: record.status },
      ]
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, overflowY: 'auto', padding: '24px 0'
      }}
    >
      {/* Control Bar (non-printable) */}
      <div className="no-print" style={{
        position: 'fixed', top: 24, right: 40,
        display: 'flex', gap: 10, zIndex: 10000
      }}>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handlePrint}
          style={{
            background: 'linear-gradient(135deg, #14532d, #166534)',
            border: 'none', color: '#fef9c3', padding: '10px 20px',
            borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <Printer size={16} /> Print / Export PDF
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onClose}
          style={{
            background: 'white', border: '1px solid #e2e8f0', color: '#334155',
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <X size={16} /> Close
        </motion.button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #patta-print-area, #patta-print-area * { visibility: visible; }
          #patta-print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0; padding: 0; border: none; box-shadow: none;
          }
          .no-print { display: none !important; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      {/* ── CERTIFICATE DOCUMENT ── */}
      <div id="patta-print-area" ref={printRef} style={{
        width: '210mm',
        background: '#fffdf0',
        borderRadius: 4,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        color: '#1a1a1a',
        fontFamily: '"Georgia", "Times New Roman", serif',
        overflow: 'hidden',
      }}>

        {/* Decorative border frame */}
        <div style={{
          position: 'absolute', inset: 10,
          border: '2px solid #2d5a3d',
          borderRadius: 2, pointerEvents: 'none', zIndex: 10,
          boxShadow: 'inset 0 0 0 6px #fffdf0, inset 0 0 0 8px rgba(45,90,61,0.15)'
        }} />
        <div style={{
          position: 'absolute', inset: 18,
          border: '0.5px solid #2d5a3d',
          opacity: 0.4, borderRadius: 1, pointerEvents: 'none', zIndex: 10
        }} />

        {/* Background Watermark */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '240px', opacity: 0.025, color: '#2d5a3d',
          pointerEvents: 'none', userSelect: 'none', lineHeight: 1
        }}>
          🌳
        </div>

        {/* Corner ornaments */}
        {[
          { top: 28, left: 28 },
          { top: 28, right: 28 },
          { bottom: 28, left: 28 },
          { bottom: 28, right: 28 }
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', ...pos, width: 20, height: 20, zIndex: 15,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M 0 0 L 8 0 M 0 0 L 0 8' stroke='%232d5a3d' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
          }} />
        ))}

        {/* ── HEADER ── */}
        <div style={{ padding: '44px 50px 24px', textAlign: 'center', position: 'relative', zIndex: 5 }}>
          {/* Emblem row */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>🏛️</div>
            <div style={{ width: 1, height: 50, background: '#2d5a3d', opacity: 0.3 }} />
            <Leaf size={36} color="#2d5a3d" style={{ opacity: 0.7 }} />
          </div>

          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a3a2a', letterSpacing: 2, textTransform: 'uppercase' }}>
            Government of Karnataka
          </h2>
          <h3 style={{ margin: '5px 0 0', fontSize: 12, fontWeight: 600, color: '#4a8c60', letterSpacing: 1, textTransform: 'uppercase' }}>
            Department of Tribal Welfare & Forest Revenue
          </h3>

          {/* Horizontal rule with ornament */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px auto', maxWidth: 300 }}>
            <div style={{ flex: 1, height: 1, background: '#2d5a3d', opacity: 0.4 }} />
            <Award size={16} color="#2d5a3d" style={{ opacity: 0.7 }} />
            <div style={{ flex: 1, height: 1, background: '#2d5a3d', opacity: 0.4 }} />
          </div>

          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1a3a2a', textTransform: 'uppercase', letterSpacing: 2 }}>
            Forest Rights Title Deed
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 10.5, fontStyle: 'italic', color: '#666', lineHeight: 1.5 }}>
            Issued under Section 3(1)(a) of the Scheduled Tribes and Other Traditional Forest Dwellers<br />
            (Recognition of Forest Rights) Act, 2006 & Forest Rights Rules, 2008
          </p>
        </div>

        {/* ── BODY TEXT ── */}
        <div style={{ padding: '0 50px', position: 'relative', zIndex: 5 }}>
          <p style={{ textIndent: 48, margin: '0 0 14px', fontSize: 12.5, lineHeight: 2, textAlign: 'justify', color: '#2a2a2a' }}>
            This is to formally certify and declare that the District Level Committee (DLC) of Karnataka, acting under
            the statutory powers conferred by the Scheduled Tribes and Other Traditional Forest Dwellers (Recognition
            of Forest Rights) Act, 2006, has approved and registered the Forest Rights of the claimant named herein.
          </p>
          <p style={{ textIndent: 48, margin: 0, fontSize: 12.5, lineHeight: 2, textAlign: 'justify', color: '#2a2a2a' }}>
            The holder is hereby granted occupancy, use, and self-cultivation rights over the specified forest land parcel.
            This title deed represents a permanent, non-alienable, and heritable right to utilize and protect the forest
            land in strict accordance with national environmental and conservation laws.
          </p>
        </div>

        {/* ── FIELD GROUPS ── */}
        <div style={{ padding: '20px 50px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 5 }}>
          {fieldGroups.map(({ title, fields }) => (
            <div key={title} style={{
              border: '1px solid rgba(45,90,61,0.25)', borderRadius: 4,
              background: 'rgba(45,90,61,0.025)', overflow: 'hidden'
            }}>
              <div style={{
                background: 'rgba(45,90,61,0.07)', padding: '6px 16px',
                borderBottom: '1px solid rgba(45,90,61,0.15)',
                fontSize: 9, fontWeight: 700, color: '#2d5a3d',
                textTransform: 'uppercase', letterSpacing: 1, fontFamily: '"Georgia", serif'
              }}>
                {title}
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: fields.length > 2 ? '1fr 1fr' : '1fr 1fr',
                gap: '10px 20px', padding: '14px 16px'
              }}>
                {fields.map(({ label, value, mono }) => (
                  <div key={label}>
                    <div style={{ fontSize: 8.5, color: '#777', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.7, marginBottom: 3, fontFamily: '"Georgia", serif' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a3a2a', fontFamily: mono ? 'monospace' : '"Georgia", serif' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── FOOTER: QR + Signatures ── */}
        <div style={{
          padding: '16px 50px 36px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          position: 'relative', zIndex: 5
        }}>
          {/* Simulated QR Code */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ border: '2px solid #2d5a3d', padding: 4, display: 'inline-block', background: 'white' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 8px)', gridTemplateRows: 'repeat(9, 8px)', gap: 1 }}>
                {qrGrid.flat().map((cell, i) => (
                  <div key={i} style={{ width: 8, height: 8, background: cell ? '#1a3a2a' : 'white' }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 7.5, color: '#888', marginTop: 4, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Scan to Verify · {record.patta_id}
            </div>
          </div>

          {/* Digital Signature Block */}
          {record.digital_signature && (
            <div style={{
              background: 'rgba(240,253,244,0.8)', border: '1px solid rgba(134,239,172,0.6)',
              borderRadius: 4, padding: '8px 14px', maxWidth: 200, textAlign: 'center'
            }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
                <Shield size={10} /> E-SIGN VERIFIED
              </div>
              <div style={{ fontSize: 7.5, fontFamily: 'monospace', color: '#4a5568', wordBreak: 'break-all', lineHeight: 1.3 }}>
                {record.digital_signature.substring(0, 32)}...
              </div>
            </div>
          )}

          {/* Signatures */}
          <div style={{ display: 'flex', gap: 40 }}>
            {[
              { name: 'Ruthvik M.', title: 'SDLC Officer', sub: 'Sub-Division Committee' },
              { name: 'G. S. Prasad', title: 'DLC Chairman', sub: 'District Magistrate' },
            ].map(({ name, title, sub }) => (
              <div key={name} style={{ textAlign: 'center', width: 140 }}>
                <div style={{ height: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
                  <div style={{ fontSize: 16, fontStyle: 'italic', color: '#556a59', fontFamily: '"Great Vibes", cursive, Georgia, serif' }}>
                    {name}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #2d5a3d', paddingTop: 5 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#1a3a2a', textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
                  <div style={{ fontSize: 8.5, color: '#666', marginTop: 1 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LEGAL DISCLAIMER FOOTER ── */}
        <div style={{
          padding: '10px 50px 30px',
          borderTop: '1px solid rgba(45,90,61,0.2)',
          textAlign: 'center', fontSize: 8, color: '#999',
          lineHeight: 1.6, position: 'relative', zIndex: 5
        }}>
          This is a digitally generated forest rights title document verified against satellite imagery indexes (NDVI/NDWI via Sentinel-2)
          and authenticated district administrative registers. Any unauthorized duplication, tampering, or misrepresentation of this document
          is a cognizable offence punishable under the Information Technology Act, 2000 and the Indian Penal Code.
          <br />
          <strong style={{ color: '#555' }}>TerraClaim Spatial Ledger v2.0 · Government of Karnataka · {new Date().getFullYear()}</strong>
        </div>

        {/* Decorative bottom green band */}
        <div style={{ height: 6, background: 'linear-gradient(135deg, #166534, #15803d, #22c55e)', flexShrink: 0 }} />
      </div>
    </motion.div>
  );
}
