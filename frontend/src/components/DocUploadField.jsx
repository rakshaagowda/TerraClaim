import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:8000';

export default function DocUploadField({ pattaId, stage, uploadedBy, onUploadSuccess, darkMode }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [docType, setDocType] = useState('Aadhaar / Identity documents');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const inputRef = useRef(null);

  const DOCUMENT_TYPES = [
    'Form A (Individual Forest Rights)',
    'Form B (Community Rights)',
    'Form C (Community Forest Resource Rights)',
    'Aadhaar / Identity documents',
    'Land records',
    'Survey sketches',
    'Satellite evidence',
    'Supporting affidavits'
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndAddFiles = (filesList) => {
    const validFiles = [];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      if (allowedTypes.includes(file.type)) {
        // Generate a preview URL for images
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        validFiles.push({
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          type: file.type
        });
      } else {
        setStatusMsg({ type: 'error', text: `Invalid file type: ${file.name}. Only PDF and JPG/PNG images are allowed.` });
      }
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setStatusMsg({ type: '', text: '' });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      if (updated[index].previewUrl) {
        URL.revokeObjectURL(updated[index].previewUrl);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    const formData = new FormData();
    selectedFiles.forEach(f => {
      formData.append('files', f.file);
    });
    formData.append('stage', stage);
    formData.append('document_type', docType);
    formData.append('uploaded_by', uploadedBy || 'Applicant');

    axios.post(`${API}/api/fra/claim/${pattaId}/upload-docs`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(res => {
        setLoading(false);
        setStatusMsg({ type: 'success', text: `Successfully uploaded ${selectedFiles.length} file(s).` });
        setSelectedFiles([]);
        if (onUploadSuccess) onUploadSuccess();
      })
      .catch(err => {
        setLoading(false);
        setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to upload files. Please try again.' });
      });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: darkMode ? '#cbd5e1' : '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
            Select Document Category
          </label>
          <select
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: darkMode ? '1.5px solid #334155' : '1.5px solid #cbd5e1', background: darkMode ? '#0f172a' : 'white', color: darkMode ? '#ffffff' : '#0f172a', fontSize: 12.5, fontWeight: 650, outline: 'none' }}
            value={docType}
            onChange={e => setDocType(e.target.value)}
          >
            {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={() => inputRef.current.click()}
            style={{ width: '100%', padding: '9px', background: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#cbd5e1' : '#334155', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#475569' : '#cbd5e1'}
            onMouseLeave={e => e.currentTarget.style.background = darkMode ? '#334155' : '#e2e8f0'}
          >
            Browse Local Files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            accept=".pdf,image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? '#1d4ed8' : (darkMode ? '#334155' : '#cbdcce')}`,
          borderRadius: 12,
          padding: '24px 20px',
          textAlign: 'center',
          background: dragActive ? (darkMode ? '#1e293b' : '#f0f5ff') : (darkMode ? '#0f172a' : '#fcfdfc'),
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6
        }}
        onClick={() => inputRef.current.click()}
      >
        <Upload size={28} color={dragActive ? '#1d4ed8' : '#355e3b'} />
        <div style={{ fontSize: 12, fontWeight: 700, color: darkMode ? '#ffffff' : '#132a13' }}>
          Drag & drop your files here or click to upload
        </div>
        <div style={{ fontSize: 10, color: darkMode ? '#94a3b8' : '#64748b' }}>
          Supports: PDF, JPG, JPEG, PNG (Max 10MB per file)
        </div>
      </div>

      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div style={{ background: darkMode ? '#0f172a' : '#f8fafc', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: darkMode ? '#cbd5e1' : '#64748b', textTransform: 'uppercase' }}>Selected Files ({selectedFiles.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: darkMode ? '#1e293b' : 'white', borderRadius: 6, border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                {f.previewUrl ? (
                  <img src={f.previewUrl} alt="Preview" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <div style={{ width: 32, height: 32, background: darkMode ? '#5c1d1d' : '#fee2e2', borderRadius: 4, display: 'flex', alignItems: 'center', justifyValue: 'center', justifyContent: 'center' }}>
                    <FileText size={16} color="#ef4444" />
                  </div>
                )}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: darkMode ? '#ffffff' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                  <div style={{ fontSize: 9.5, color: darkMode ? '#cbd5e1' : '#64748b' }}>{formatSize(f.size)} · {f.type.split('/')[1].toUpperCase()}</div>
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  style={{ background: 'none', border: 'none', color: darkMode ? '#cbd5e1' : '#64748b', cursor: 'pointer', padding: 4 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '8px',
              background: '#355e3b',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Uploading Files...' : `Upload to Spatial Ledger (${docType})`}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {statusMsg.text && (
        <div style={{
          background: statusMsg.type === 'success' ? (darkMode ? '#064e3b' : '#f0fdf4') : (darkMode ? '#7f1d1d' : '#fef2f2'),
          border: `1px solid ${statusMsg.type === 'success' ? (darkMode ? '#047857' : '#bbf7d0') : (darkMode ? '#b91c1c' : '#fecaca')}`,
          borderRadius: 8,
          padding: '8px 12px',
          color: statusMsg.type === 'success' ? (darkMode ? '#d1fae5' : '#166534') : (darkMode ? '#fecaca' : '#991b1b'),
          fontSize: 11,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          {statusMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
}
