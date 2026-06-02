import { useRef } from 'react';
import { Printer, X } from 'lucide-react';

export default function PattaCertificate({ record, onClose }) {
  const printRef = useRef(null);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const acres = parseFloat(record.claim_area_acres || 0);
  const ha = parseFloat(record.claim_area_ha || (acres * 0.404686));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflowY: 'auto',
      padding: '20px 0'
    }}>
      {/* Controls Bar (non-printable) */}
      <div className="no-print" style={{
        position: 'absolute',
        top: 20,
        right: 40,
        display: 'flex',
        gap: 12,
        zIndex: 10000
      }}>
        <button
          onClick={handlePrint}
          style={{
            background: '#1a3a2a',
            border: 'none',
            color: '#e8c547',
            padding: '10px 18px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <Printer size={15}/> Print / Export PDF
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'white',
            border: '1px solid #ddd',
            color: '#333',
            padding: '10px 18px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <X size={15}/> Close
        </button>
      </div>

      {/* CSS Print Rules embedded */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Printable Certificate Page */}
      <div id="print-area" ref={printRef} style={{
        width: '210mm',
        height: '297mm', // A4 Dimensions
        background: '#fffbf0', // Parchment cream background
        border: '16px double #2d5a3d',
        padding: '40px 60px',
        boxSizing: 'border-box',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#1a1a1a',
        fontFamily: '"Georgia", serif'
      }}>
        {/* Certificate Watermark */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '220px',
          opacity: 0.03,
          color: '#2d5a3d',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          🌳
        </div>

        {/* Emblems & Header */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>🏛️</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a3a2a', letterSpacing: 1, textTransform: 'uppercase' }}>
            Government of Karnataka
          </h2>
          <h3 style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#4a8c60', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Department of Tribal Welfare & Forest Revenue
          </h3>
          <div style={{ width: 140, height: 2, background: '#2d5a3d', margin: '14px auto' }} />
          <h1 style={{ margin: '10px 0', fontSize: 24, fontWeight: 900, color: '#1a3a2a', textTransform: 'uppercase', letterSpacing: 1 }}>
            Forest Rights Title Deed
          </h1>
          <p style={{ margin: 0, fontSize: 11, fontStyle: 'italic', color: '#555' }}>
            Issued under Section 3(1)(a) of the Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006
          </p>
        </div>

        {/* Certificate Body Text */}
        <div style={{ width: '100%', fontSize: 14, lineHeight: 1.8, margin: '24px 0', textAlign: 'justify' }}>
          <p style={{ textIndent: 40, margin: '0 0 16px' }}>
            This is to formally certify and declare that the District Level Committee (DLC) of Karnataka, acting under the statutory powers conferred by the Forest Rights Act, 2006, has approved and registered the Forest Rights of the claimant named herein.
          </p>
          <p style={{ textIndent: 40, margin: 0 }}>
            The holder is granted occupancy, use, and self-cultivation rights over the specified forest land parcel detailed below. This title deed represents a permanent, non-alienable, and heritable right to utilize and protect the forest land in accordance with national environmental and conservation laws.
          </p>
        </div>

        {/* Claimant and Property details grid */}
        <div style={{
          width: '100%',
          border: '1px solid #2d5a3d',
          borderRadius: 4,
          background: 'rgba(45,90,61,0.02)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px 20px',
          padding: '20px 24px',
          boxSizing: 'border-box',
          fontSize: 12
        }}>
          <div>
            <span style={{ color: '#555', textTransform: 'uppercase', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>Patta Title ID</span>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#1a3a2a', marginTop: 1 }}>{record.patta_id}</div>
          </div>
          <div>
            <span style={{ color: '#555', textTransform: 'uppercase', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>Date of Issue</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a2a', marginTop: 1 }}>{record.title_date || record.dlc_date || 'N/A'}</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
          </div>
          <div>
            <span style={{ color: '#555', textTransform: 'uppercase', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>Claimant Name / Community</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a3a2a', marginTop: 1 }}>{record.claimant_name || 'Village Community'}</div>
          </div>
          <div>
            <span style={{ color: '#555', textTransform: 'uppercase', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>Tribal Community Group</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a2a', marginTop: 1 }}>{record.tribal_community || 'OTFD Dwellers'}</div>
          </div>
          <div>
            <span style={{ color: '#555', textTransform: 'uppercase', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>Village Location</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a2a', marginTop: 1 }}>{record.village || 'N/A'}</div>
          </div>
          <div>
            <span style={{ color: '#555', textTransform: 'uppercase', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>District & Taluk</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a2a', marginTop: 1 }}>{record.district} District · {record.taluk} Taluk</div>
          </div>
          <div>
            <span style={{ color: '#555', textTransform: 'uppercase', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>Registered Land Area</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3a2a', marginTop: 1 }}>{acres.toFixed(2)} Acres ({ha.toFixed(4)} Hectares)</div>
          </div>
          <div>
            <span style={{ color: '#555', textTransform: 'uppercase', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>Parcel Geo-Coordinates</span>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#1a3a2a', marginTop: 1 }}>
              Lat: {parseFloat(record.lat || 0).toFixed(6)}° N<br/>
              Lng: {parseFloat(record.lng || 0).toFixed(6)}° E
            </div>
          </div>
        </div>

        {/* Footer Area with QR code and signatures */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 20
        }}>
          {/* Simulated QR Code */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 80,
              height: 80,
              border: '2px solid #2d5a3d',
              padding: 4,
              boxSizing: 'border-box',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {/* Simple grid representing QR patterns */}
              <div style={{ display: 'flex', justifyContent: 'space-between', height: '18px' }}>
                <div style={{ width: 18, height: 18, background: '#1a3a2a' }} />
                <div style={{ width: 18, height: 18, background: '#1a3a2a' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', height: '10px' }}>
                <div style={{ width: 10, height: 10, background: '#1a3a2a' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', height: '18px' }}>
                <div style={{ width: 18, height: 18, background: '#1a3a2a' }} />
                <div style={{ width: 10, height: 18, background: '#1a3a2a' }} />
              </div>
            </div>
            <div style={{ fontSize: 8, color: '#777', marginTop: 4, fontFamily: 'monospace' }}>SECURE VERIFY</div>
          </div>

          {/* Signature 1 */}
          <div style={{ textAlign: 'center', width: 150 }}>
            <div style={{ fontSize: 12, fontStyle: 'italic', color: '#777', fontFamily: '"Great Vibes", cursive, Georgia', height: 20 }}>
              Ruthvik M.
            </div>
            <div style={{ borderTop: '1px solid #1a3a2a', marginTop: 4, paddingTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1a3a2a', textTransform: 'uppercase' }}>SDLC Officer</div>
              <div style={{ fontSize: 9, color: '#555' }}>Sub-Division Committee</div>
            </div>
          </div>

          {/* Signature 2 */}
          <div style={{ textAlign: 'center', width: 150 }}>
            <div style={{ fontSize: 12, fontStyle: 'italic', color: '#777', fontFamily: '"Great Vibes", cursive, Georgia', height: 20 }}>
              G. S. Prasad
            </div>
            <div style={{ borderTop: '1px solid #1a3a2a', marginTop: 4, paddingTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1a3a2a', textTransform: 'uppercase' }}>DLC Chairman</div>
              <div style={{ fontSize: 9, color: '#555' }}>District Magistrate</div>
            </div>
          </div>
        </div>

        {/* Footer legal disclaimer */}
        <div style={{ width: '100%', textAlign: 'center', fontSize: 8, color: '#888', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
          This is a digitally generated forest rights document verified against satellite crop indexes and district administrative registers. Any unauthorized duplication or tampering is subject to prosecution under the IT Act, 2000.
        </div>

      </div>
    </div>
  );
}
