import React, { useState } from 'react'
import { FileSpreadsheet, FileText, Download, Award, Shield, FileCheck, CheckCircle } from 'lucide-react'

export default function ReportsHub() {
  const [downloading, setDownloading] = useState(false)
  const [reportType, setReportType] = useState('summary')

  const triggerDownload = (fileName) => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      alert(`Report generated: ${fileName} download started.`)
    }, 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 24px', overflowY: 'auto' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
          Reports & Ledger Hub
        </h2>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
          Generate district progress charts, print certificates, and download official ledger records
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'flex-start' }}>
        
        {/* Left column: Available Templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              Download Master Documents & Methodology
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              
              {/* Report Item 1: XLSX */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.01)',
                  borderRadius: 10,
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(34, 197, 94, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>FRA Karnataka Synthetic Records</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Excel Spreadsheet (XLSX) · 53 KB · Full synthetic claimant data ledger</div>
                  </div>
                </div>
                <a 
                  href="file:///d:/New%20folder/TerraClaim/FRA_Karnataka_Synthetic_Records.xlsx"
                  download
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Download size={12} />
                  Download
                </a>
              </div>

              {/* Report Item 2: DOCX */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.01)',
                  borderRadius: 10,
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59, 130, 246, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>FRA Atlas Methodology WorkPlan</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Word Document (DOCX) · 22 KB · Joint Forest Inspection methodology guide</div>
                  </div>
                </div>
                <a 
                  href="file:///d:/New%20folder/TerraClaim/FRA_Atlas_Methodology_WorkPlan.docx"
                  download
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Download size={12} />
                  Download
                </a>
              </div>

            </div>
          </div>

          {/* Dynamic Progress Reports compiler */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              District Progress Compiler Tool
            </h4>
            <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Compile real-time verification and title deeds conversion statistics for administrative review.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[
                { id: 'summary', label: 'Brief Summary (CSV)' },
                { id: 'detailed', label: 'Detailed Audited PDF' },
                { id: 'welfare', label: 'Welfare Integration Router' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setReportType(opt.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    border: reportType === opt.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: reportType === opt.id ? 'rgba(22, 101, 52, 0.08)' : 'var(--card)',
                    color: reportType === opt.id ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => triggerDownload(`District_Progress_Compiled_${reportType}.zip`)}
              disabled={downloading}
              style={{
                width: '100%',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '10px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: 'var(--shadow-sm)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              {downloading ? 'Compiling statistics...' : 'Compile & Export Report'}
            </button>
          </div>

        </div>

        {/* Right column: Quick explanations */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} color="var(--primary)" /> Statutory Document Protocols
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ marginTop: 2 }}><CheckCircle size={12} color="var(--success)" /></div>
              <span><strong>Joint Forest Inspection (JFI)</strong>: Completed reports must follow coordinates mapping procedures in the Methodology guide.</span>
            </div>
            
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div style={{ marginTop: 2 }}><CheckCircle size={12} color="var(--success)" /></div>
              <span><strong>Immutable Ledger anchors</strong>: Downloaded spreadsheets contain the corresponding block index hashes for cryptographic audit trails.</span>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div style={{ marginTop: 2 }}><CheckCircle size={12} color="var(--success)" /></div>
              <span><strong>Certificate Printing</strong>: Title patta deeds generated inside the Claims view are signed using Indian Information Technology Act (E-Sign) keys.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
