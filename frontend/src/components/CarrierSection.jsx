import React, { useState, useEffect, useRef } from 'react';
import { getCarriers } from '../api/client';

const labelStyle = { fontSize: 11, fontWeight: 600, color: '#667', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 0.3 };
const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #d0d5dd', borderRadius: 4, fontSize: 13, background: '#fff', boxSizing: 'border-box' };
const readonlyStyle = { ...inputStyle, background: '#f5f6f8', color: '#555' };
const sectionHeaderStyle = { fontSize: 12, fontWeight: 700, color: '#1a3a5c', borderBottom: '1px solid #e0e6ed', paddingBottom: 4, marginBottom: 10, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 };
const badgeStyle = (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 700, color: '#fff', background: color });

const MOCK_CARRIERS = [
  { id: 'carr-1', name: 'A1 Transportation Services LLC', companyName: 'A1 Transportation Services LLC', mc: 'MC374094', usdot: '842022', address: 'Sandy, UT', phone: '(720) 524-8069', email: 'ops@a1transport.com', contact: 'John Doe', okToLoad: true, insurance: { bipd: { expires: '2027-03-15', limit: 1000000 }, cargo: { expires: '2026-08-20', limit: 100000 }, general: { expires: '2027-01-10', limit: 2000000 } }, safetyRating: 'Satisfactory', drivers: ['Mike R.', 'Sarah T.'], powerUnits: ['TRK-4401', 'TRK-4402'], trailers: ['TRL-8801'] },
  { id: 'carr-2', name: 'GLT Trucks Inc', companyName: 'GLT Trucks Inc', mc: 'MC940155', usdot: '2854172', address: 'El Paso, TX', phone: '(915) 800-1120', email: 'dispatch@glttrucks.com', contact: 'Ana Garcia', okToLoad: true, insurance: { bipd: { expires: '2026-12-31', limit: 1000000 }, cargo: { expires: '2026-06-01', limit: 100000 }, general: { expires: '2026-11-15', limit: 1500000 } }, safetyRating: 'Satisfactory', drivers: ['Carlos M.'], powerUnits: ['TRK-7701'], trailers: ['TRL-9901', 'TRL-9902'] },
  { id: 'carr-3', name: 'FastLane Freight Co', companyName: 'FastLane Freight Co', mc: 'MC112450', usdot: '401204', address: 'Chicago, IL', phone: '(312) 555-0173', email: 'team@fastlanefreight.com', contact: 'Dave Wilson', okToLoad: false, insurance: { bipd: { expires: '2025-11-01', limit: 750000 }, cargo: { expires: '2025-12-15', limit: 50000 }, general: { expires: '2026-02-28', limit: 1000000 } }, safetyRating: 'Conditional', drivers: [], powerUnits: [], trailers: [] },
];

function isExpiringSoon(dateStr) {
  if (!dateStr) return 'unknown';
  const exp = new Date(dateStr);
  const now = new Date();
  const diff = (exp - now) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'expired';
  if (diff < 30) return 'warning';
  return 'ok';
}

function InsuranceBadge({ label, info }) {
  if (!info) return null;
  const status = isExpiringSoon(info.expires);
  const colors = { ok: '#27ae60', warning: '#f39c12', expired: '#e74c3c', unknown: '#95a5a6' };
  const labels = { ok: 'Active', warning: 'Expiring Soon', expired: 'Expired', unknown: 'Unknown' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={badgeStyle(colors[status])}>{labels[status]}</span>
        <span style={{ fontSize: 11, color: '#667' }}>Exp: {info.expires || 'N/A'}</span>
        <span style={{ fontSize: 11, color: '#667' }}>Limit: ${(info.limit || 0).toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function CarrierSection({ enabled, onComplete }) {
  const [query, setQuery] = useState('');
  const [carriers, setCarriers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState('');
  const [assignedPowerUnit, setAssignedPowerUnit] = useState('');
  const [assignedTrailer, setAssignedTrailer] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getCarriers();
        const list = res?.carriers || res;
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setCarriers(list);
          return;
        }
      } catch { /* fallback */ }
      if (!cancelled) setCarriers(MOCK_CARRIERS);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!enabled) {
    return <div style={{ color: '#aaa', fontWeight: 600, fontSize: 13 }}>Carrier section locked until lane intelligence is complete.</div>;
  }

  const filtered = query.trim()
    ? carriers.filter(c => {
        const q = query.toLowerCase();
        return (c.name || c.companyName || '').toLowerCase().includes(q) ||
               (c.mc || c.mcNumber || '').toLowerCase().includes(q) ||
               (c.usdot || c.usdotNumber || '').toLowerCase().includes(q);
      })
    : carriers;

  const handleSelect = (carr) => {
    setSelected(carr);
    setQuery(carr.name || carr.companyName || '');
    setShowDropdown(false);
    setAssignedDriver(carr.drivers?.[0] || '');
    setAssignedPowerUnit(carr.powerUnits?.[0] || '');
    setAssignedTrailer(carr.trailers?.[0] || '');
    setIsComplete(true);
    if (onComplete) onComplete(carr);
  };

  const handleRemove = () => {
    setSelected(null);
    setQuery('');
    setIsComplete(false);
    setAssignedDriver('');
    setAssignedPowerUnit('');
    setAssignedTrailer('');
  };

  return (
    <div>
      {/* ── Carrier Search ── */}
      <div style={sectionHeaderStyle}>Carrier Search</div>
      <div ref={wrapperRef} style={{ position: 'relative', maxWidth: 480, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by MC#, DOT#, or name..."
          />
          {selected && (
            <button type="button" onClick={handleRemove} style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #e74c3c', borderRadius: 4, background: '#fff', color: '#e74c3c', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
          )}
        </div>
        {showDropdown && filtered.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #d0d5dd', borderRadius: 4, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
            {filtered.map(c => (
              <div key={c.id || c.mc || c.name} onClick={() => handleSelect(c)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <span style={{ fontWeight: 600 }}>{c.name || c.companyName}</span>
                <span style={{ color: '#888', fontSize: 11 }}>{c.mc || c.mcNumber || ''} | DOT: {c.usdot || c.usdotNumber || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <>
          {/* ── OK-TO-LOAD Warning ── */}
          {!selected.okToLoad && (
            <div style={{ background: '#fdf0e6', border: '1px solid #e67e22', borderRadius: 6, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: '#d35400', fontSize: 13 }}>NOT OK-TO-LOAD</div>
                <div style={{ fontSize: 12, color: '#7f4b1e' }}>This carrier has compliance or insurance issues. Review before assigning.</div>
              </div>
            </div>
          )}
          {selected.okToLoad && (
            <div style={{ background: '#e8f8ef', border: '1px solid #27ae60', borderRadius: 6, padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <span style={{ fontWeight: 700, color: '#1e8449', fontSize: 13 }}>OK-TO-LOAD</span>
            </div>
          )}

          {/* ── Profile ── */}
          <div style={sectionHeaderStyle}>Carrier Profile</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Address</label>
              <input style={readonlyStyle} readOnly value={selected.address || ''} />
            </div>
            <div>
              <label style={labelStyle}>MC / Docket</label>
              <input style={readonlyStyle} readOnly value={selected.mc || selected.mcNumber || ''} />
            </div>
            <div>
              <label style={labelStyle}>USDOT</label>
              <input style={readonlyStyle} readOnly value={selected.usdot || selected.usdotNumber || ''} />
            </div>
            <div>
              <label style={labelStyle}>Contact</label>
              <input style={readonlyStyle} readOnly value={selected.contact || ''} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={readonlyStyle} readOnly value={selected.phone || ''} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={readonlyStyle} readOnly value={selected.email || ''} />
            </div>
            <div>
              <label style={labelStyle}>Safety Rating</label>
              <input style={readonlyStyle} readOnly value={selected.safetyRating || ''} />
            </div>
          </div>

          {/* ── Insurance ── */}
          <div style={sectionHeaderStyle}>Insurance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <InsuranceBadge label="BIPD" info={selected.insurance?.bipd} />
            <InsuranceBadge label="Cargo" info={selected.insurance?.cargo} />
            <InsuranceBadge label="General Liability" info={selected.insurance?.general} />
          </div>

          {/* ── Asset Assignment ── */}
          <div style={sectionHeaderStyle}>Asset Assignment</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Driver</label>
              {selected.drivers && selected.drivers.length > 0 ? (
                <select style={inputStyle} value={assignedDriver} onChange={e => setAssignedDriver(e.target.value)}>
                  <option value="">-- Select Driver --</option>
                  {selected.drivers.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <input style={readonlyStyle} readOnly value="No drivers on file" />
              )}
            </div>
            <div>
              <label style={labelStyle}>Power Unit</label>
              {selected.powerUnits && selected.powerUnits.length > 0 ? (
                <select style={inputStyle} value={assignedPowerUnit} onChange={e => setAssignedPowerUnit(e.target.value)}>
                  <option value="">-- Select Unit --</option>
                  {selected.powerUnits.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <input style={readonlyStyle} readOnly value="No units on file" />
              )}
            </div>
            <div>
              <label style={labelStyle}>Trailer</label>
              {selected.trailers && selected.trailers.length > 0 ? (
                <select style={inputStyle} value={assignedTrailer} onChange={e => setAssignedTrailer(e.target.value)}>
                  <option value="">-- Select Trailer --</option>
                  {selected.trailers.map(tr => <option key={tr} value={tr}>{tr}</option>)}
                </select>
              ) : (
                <input style={readonlyStyle} readOnly value="No trailers on file" />
              )}
            </div>
          </div>
        </>
      )}

      {isComplete && (
        <div style={{ color: '#27ae60', fontWeight: 600, fontSize: 13, marginTop: 8 }}>✓ Carrier section complete</div>
      )}
    </div>
  );
}
