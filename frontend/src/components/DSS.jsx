import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  FileSpreadsheet, Filter, CheckCircle, Info, Search, X,
  Download, RefreshCw, TrendingUp, Award, Users, Layers,
  ChevronDown, Leaf, Droplets, Home, Wheat, Building2, TreePine, Coins
} from 'lucide-react';

const API = 'http://localhost:8000';

const SCHEMES = ['PM_KISAN', 'MGNREGA', 'JJM', 'PMAY_G', 'PMFBY', 'DAJGUA', 'NSTFDC'];
const SCHEME_META = {
  PM_KISAN: { label: 'PM-KISAN',     icon: '🌾', IconComp: Wheat,    color: '#16a34a', bg: '#f0fdf4', border: '#86efac', desc: '₹6,000/yr cash support for IFR title holders' },
  MGNREGA:  { label: 'MGNREGA',      icon: '🔨', IconComp: Users,    color: '#0284c7', bg: '#eff6ff', border: '#93c5fd', desc: '150 days guaranteed employment (FRA quota)' },
  JJM:      { label: 'Jal Jeevan',   icon: '💧', IconComp: Droplets, color: '#0e7490', bg: '#ecfeff', border: '#67e8f9', desc: 'Priority piped water for CFR village blocks' },
  PMAY_G:   { label: 'PMAY-G',       icon: '🏠', IconComp: Home,     color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', desc: '₹1.3 Lakh housing for granted title holders' },
  PMFBY:    { label: 'PMFBY',        icon: '🌿', IconComp: Leaf,     color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', desc: 'Subsidized crop insurance for IFR fields' },
  DAJGUA:   { label: 'DAJGUA',       icon: '🌲', IconComp: TreePine, color: '#166534', bg: '#f0fdf4', border: '#86efac', desc: 'Van Dhan Kendra minor forest produce support' },
  NSTFDC:   { label: 'NSTFDC',       icon: '💰', IconComp: Coins,    color: '#b45309', bg: '#fffbeb', border: '#fde68a', desc: 'PVTG sub-4% micro-enterprise loans' },
};

const DISTRICTS = ['', 'Mysuru', 'Chamarajanagara', 'Shivamogga', 'Chikkamagaluru', 'Kodagu', 'Hassan'];
const STATUSES = ['', 'Title Granted', 'DLC Approved', 'SDLC Approved', 'Under Verification', 'Claim Filed', 'Gram Sabha Resolved', 'Rejected'];

const STATUS_COLORS = {
  'Title Granted':       '#16a34a',
  'DLC Approved':        '#7c3aed',
  'SDLC Approved':       '#1d4ed8',
  'Under Verification':  '#c2410c',
  'Claim Filed':         '#475569',
  'Gram Sabha Resolved': '#0e7490',
  'Rejected':            '#dc2626',
};

function EligChip({ val }) {
  if (val === 'Yes') return (
    <span style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 6, display: 'inline-block' }}>
      ✓ Yes
    </span>
  );
  if (val === 'No') return (
    <span style={{ background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6, display: 'inline-block' }}>
      —
    </span>
  );
  return (
    <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6, display: 'inline-block' }}>
      Check
    </span>
  );
}

function exportCSV(records) {
  const headers = ['Patta ID', 'Form', 'District', 'Village', 'Claimant', 'Tribe', 'Acres', 'Status',
    ...SCHEMES.map(s => SCHEME_META[s].label), 'Eligible Count'];
  const rows = records.map(r => [
    r.patta_id, r.form_type, r.district, r.village,
    r.claimant_name, r.tribal_community, r.claim_area_acres, r.status,
    ...SCHEMES.map(s => r[s]), r.eligible_count
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fra_dss_eligibility.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function DSS({ onBack, jurisdiction }) {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    const activeDistrict = jurisdiction || district;
    if (activeDistrict) params.append('district', activeDistrict);
    if (status) params.append('status', status);
    setLoading(true);
    axios.get(`${API}/api/fra/dss?${params}`)
      .then(r => { setRecords(r.data.records); setLoading(false); })
      .catch(() => setLoading(false));
  }, [district, status, jurisdiction]);

  useEffect(() => {
    let out = [...records];
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(r =>
        r.patta_id?.toLowerCase().includes(q) ||
        r.village?.toLowerCase().includes(q) ||
        r.claimant_name?.toLowerCase().includes(q)
      );
    }
    if (schemeFilter) out = out.filter(r => r[schemeFilter] === 'Yes');
    setFiltered(out);
  }, [records, search, schemeFilter]);

  const summary = SCHEMES.map(s => ({
    key: s,
    ...SCHEME_META[s],
    count: records.filter(r => r[s] === 'Yes').length,
    pct: records.length ? Math.round((records.filter(r => r[s] === 'Yes').length / records.length) * 100) : 0,
  }));

  const totalEligible = records.filter(r => r.eligible_count > 0).length;

  return (
    <div style={{
      flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
      background: '#f8fafc', padding: '20px 24px',
      boxSizing: 'border-box', overflow: 'hidden', gap: 16
    }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            WELFARE INTEGRATION SYSTEM
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: -0.5 }}>
            Decision Support System
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
            Central Sector Scheme Integration Matrix & Automated Welfare Router
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #86efac', borderRadius: 12, padding: '12px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: 480
        }}>
          <Info size={16} color="#166534" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 10.5, color: '#14532d', lineHeight: 1.5 }}>
            <strong>Statutory Linkage (FRA §3.1):</strong> Land title-deeds auto-trigger welfare eligibility.
            IFR (Form A) qualifies for landholder schemes; CFR (Form B/C) qualifies for
            community infrastructure programmes.
          </div>
        </div>
      </div>

      {/* ── SCHEME SUMMARY CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, flexShrink: 0 }}>
        {summary.map(s => {
          const isActive = schemeFilter === s.key;
          return (
            <motion.div
              key={s.key}
              whileHover={{ y: -2, boxShadow: `0 8px 24px ${s.color}25` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSchemeFilter(isActive ? '' : s.key)}
              style={{
                background: isActive ? s.color : 'white',
                border: `1.5px solid ${isActive ? s.color : s.border}`,
                borderRadius: 14, padding: '12px 10px',
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 4px 16px ${s.color}40` : '0 1px 4px rgba(0,0,0,0.04)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.08,
                  backgroundImage: 'radial-gradient(circle at 50% 0%, white 0%, transparent 70%)'
                }} />
              )}
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{
                fontSize: 18, fontWeight: 900, fontFamily: 'monospace',
                color: isActive ? 'white' : s.color
              }}>
                {s.count}
              </div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: isActive ? 'rgba(255,255,255,0.85)' : '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 8, color: isActive ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: 3 }}>
                {s.pct}% eligible
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── FILTERS BAR ── */}
      <div style={{
        background: 'white', borderRadius: 12, padding: '12px 16px',
        border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          <Filter size={13} /> Filters
        </div>

        <select
          disabled={!!jurisdiction}
          style={{
            background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '7px 12px', fontSize: 12, color: '#0f172a', outline: 'none', fontFamily: 'inherit'
          }}
          value={jurisdiction || district}
          onChange={e => setDistrict(e.target.value)}
        >
          {jurisdiction
            ? <option value={jurisdiction}>{jurisdiction} (Locked)</option>
            : DISTRICTS.map(d => <option key={d} value={d}>{d || 'All Districts'}</option>)
          }
        </select>

        <select
          style={{
            background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '7px 12px', fontSize: 12, color: '#0f172a', outline: 'none', fontFamily: 'inherit'
          }}
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>

        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            style={{
              width: '100%', padding: '8px 12px 8px 30px',
              border: '1px solid #e2e8f0', borderRadius: 8,
              fontSize: 12, color: '#0f172a', outline: 'none',
              fontFamily: 'inherit', background: 'white', boxSizing: 'border-box'
            }}
            placeholder="Search patta ID, village, claimant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {(district || status || search || schemeFilter) && (
          <button
            onClick={() => { setDistrict(''); setStatus(''); setSearch(''); setSchemeFilter(''); }}
            style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            <X size={11} /> Clear Filters
          </button>
        )}

        <button
          onClick={() => exportCSV(filtered)}
          style={{
            background: 'linear-gradient(135deg, #166534, #15803d)',
            border: 'none', color: '#fff', padding: '8px 16px',
            borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)'
          }}
        >
          <FileSpreadsheet size={13} /> Export CSV ({filtered.length})
        </button>

        <div style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto', fontWeight: 600 }}>
          <strong style={{ color: '#0f172a' }}>{filtered.length}</strong> records ·{' '}
          <strong style={{ color: '#16a34a' }}>{totalEligible}</strong> welfare-eligible
        </div>
      </div>

      {/* ── DATA GRID TABLE ── */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', flex: 1
      }}>
        <div style={{ overflowY: 'auto', overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f2419, #166534)', position: 'sticky', top: 0, zIndex: 10 }}>
                {['Patta ID', 'Village', 'District', 'Form', 'Tribe', 'Acres', 'Status',
                  ...SCHEMES.map(s => SCHEME_META[s].icon + ' ' + SCHEME_META[s].label),
                  '# Schemes'
                ].map(h => (
                  <th key={h} style={{
                    padding: '12px 10px', textAlign: 'left', fontSize: 9,
                    fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
                    color: '#a7f3d0', borderRight: '1px solid rgba(255,255,255,0.08)',
                    whiteSpace: 'nowrap'
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={16} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={20} style={{ margin: '0 auto 8px', display: 'block', animation: 'spin 1s linear infinite', opacity: 0.5 }} />
                    Loading records from API...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <Search size={20} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                    No records match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((r, i) => (
                  <motion.tr
                    key={r.patta_id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    style={{
                      background: i % 2 === 0 ? 'white' : '#f9fafb',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f9fafb'}
                  >
                    <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 10, color: '#166534', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {r.patta_id}
                    </td>
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>{r.village}</td>
                    <td style={{ padding: '10px 10px', color: '#64748b' }}>{r.district}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 4,
                        background: r.form_type?.includes('A') ? '#dbeafe' : r.form_type?.includes('B') ? '#ede9fe' : '#dcfce7',
                        color: r.form_type?.includes('A') ? '#1d4ed8' : r.form_type?.includes('B') ? '#6d28d9' : '#166534',
                      }}>
                        {r.form_type?.includes('A') ? 'IFR' : r.form_type?.includes('B') ? 'CR' : 'CFR'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', color: '#475569', fontSize: 11 }}>{r.tribal_community}</td>
                    <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                      {parseFloat(r.claim_area_acres || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: STATUS_COLORS[r.status] || '#64748b',
                        padding: '2px 6px', borderRadius: 4,
                        background: `${STATUS_COLORS[r.status] || '#64748b'}12`
                      }}>
                        {r.status === 'Title Granted' ? '✓ Granted' : r.status?.split(' ')[0]}
                      </span>
                    </td>
                    {SCHEMES.map(s => (
                      <td key={s} style={{ padding: '10px 10px', textAlign: 'center', borderLeft: '1px solid #f1f5f9' }}>
                        <EligChip val={r[s]} />
                      </td>
                    ))}
                    <td style={{ padding: '10px 10px', textAlign: 'center', borderLeft: '1px solid #f1f5f9' }}>
                      <span style={{
                        fontWeight: 900, fontFamily: 'monospace', fontSize: 13,
                        color: r.eligible_count > 4 ? '#16a34a' : r.eligible_count > 2 ? '#f59e0b' : '#64748b'
                      }}>
                        {r.eligible_count}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 100 && (
          <div style={{
            padding: '10px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
            fontSize: 11, color: '#64748b', textAlign: 'center', fontWeight: 600
          }}>
            Showing first <strong>100</strong> of <strong style={{ color: '#166534' }}>{filtered.length}</strong> records.
            Use district/scheme filters or export CSV to view full database.
          </div>
        )}
      </div>

      {/* Scheme Legend */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, flexShrink: 0
      }}>
        {SCHEMES.slice(0, 4).map(s => {
          const m = SCHEME_META[s];
          return (
            <div key={s} style={{
              background: m.bg, border: `1px solid ${m.border}`,
              borderRadius: 10, padding: '10px 12px', fontSize: 10.5, lineHeight: 1.4
            }}>
              <strong style={{ color: m.color }}>{m.icon} {m.label}:</strong>
              <span style={{ color: '#475569' }}> {m.desc}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
