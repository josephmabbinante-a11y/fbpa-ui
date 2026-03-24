import React, { useState, useEffect, useRef } from 'react';
import { getCustomers, getCustomerDetail } from '../api/client';

const labelStyle = { fontSize: 11, fontWeight: 600, color: '#667', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 0.3 };
const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #d0d5dd', borderRadius: 4, fontSize: 13, background: '#fff', boxSizing: 'border-box' };
const readonlyStyle = { ...inputStyle, background: '#f5f6f8', color: '#555' };
const sectionHeaderStyle = { fontSize: 12, fontWeight: 700, color: '#1a3a5c', borderBottom: '1px solid #e0e6ed', paddingBottom: 4, marginBottom: 10, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 };

const MOCK_CUSTOMERS = [
  { id: 'cust-1', name: 'Acme Industries', companyName: 'Acme Industries', address: '1200 Industrial Blvd, Dallas, TX 75201', phone: '(214) 555-0100', docket: 'DK-22401', usdot: '1234567', creditLimit: 50000, availableCredit: 32000, contacts: [{ name: 'Jane Smith', email: 'jane@acme.com', phone: '(214) 555-0101', ext: '201' }], publicNotes: 'Preferred shipper', privateNotes: 'Net 30 terms' },
  { id: 'cust-2', name: 'Global Logistics Corp', companyName: 'Global Logistics Corp', address: '800 Commerce St, Chicago, IL 60601', phone: '(312) 555-0200', docket: 'DK-33102', usdot: '7654321', creditLimit: 100000, availableCredit: 78000, contacts: [{ name: 'Mike Johnson', email: 'mike@globallogistics.com', phone: '(312) 555-0202', ext: '305' }], publicNotes: '', privateNotes: 'High volume account' },
  { id: 'cust-3', name: 'FastShip LLC', companyName: 'FastShip LLC', address: '445 Harbor Dr, Los Angeles, CA 90012', phone: '(310) 555-0300', docket: 'DK-44501', usdot: '9876543', creditLimit: 25000, availableCredit: 12500, contacts: [{ name: 'Sarah Lee', email: 'sarah@fastship.com', phone: '(310) 555-0301', ext: '' }], publicNotes: 'Expedited only', privateNotes: '' },
];

export default function CustomerSection({ onComplete }) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const [contactIdx, setContactIdx] = useState(0);
  const [customerRef, setCustomerRef] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getCustomers();
        if (!cancelled && Array.isArray(res) && res.length > 0) {
          setCustomers(res);
          return;
        }
      } catch { /* fallback to mock */ }
      if (!cancelled) setCustomers(MOCK_CUSTOMERS);
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

  const filtered = query.trim()
    ? customers.filter(c => {
        const q = query.toLowerCase();
        return (c.name || c.companyName || '').toLowerCase().includes(q) ||
               (c.docket || '').toLowerCase().includes(q) ||
               (c.usdot || '').toLowerCase().includes(q);
      })
    : customers;

  const handleSelect = (cust) => {
    setSelected(cust);
    setQuery(cust.name || cust.companyName || '');
    setShowDropdown(false);
    setContactIdx(0);
    setIsComplete(true);
    if (onComplete) onComplete(cust);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setIsComplete(false);
    setCustomerRef('');
    setContactIdx(0);
  };

  const contact = selected?.contacts?.[contactIdx] || {};
  const creditPct = selected ? Math.round((selected.availableCredit / (selected.creditLimit || 1)) * 100) : 0;
  const creditColor = creditPct > 50 ? '#27ae60' : creditPct > 20 ? '#f39c12' : '#e74c3c';

  return (
    <div>
      {/* ── Customer Search ── */}
      <div style={sectionHeaderStyle}>Customer Search</div>
      <div ref={wrapperRef} style={{ position: 'relative', maxWidth: 480, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by name, docket, or USDOT..."
          />
          {selected && (
            <button type="button" onClick={handleClear} style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #d0d5dd', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>Clear</button>
          )}
        </div>
        {showDropdown && filtered.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #d0d5dd', borderRadius: 4, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
            {filtered.map(c => (
              <div key={c.id || c.name} onClick={() => handleSelect(c)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <span style={{ fontWeight: 600 }}>{c.name || c.companyName}</span>
                <span style={{ color: '#888', fontSize: 11 }}>{c.docket || ''} {c.usdot ? `DOT: ${c.usdot}` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <>
          {/* ── Profile ── */}
          <div style={sectionHeaderStyle}>Customer Profile</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Address</label>
              <input style={readonlyStyle} readOnly value={selected.address || ''} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={readonlyStyle} readOnly value={selected.phone || ''} />
            </div>
            <div>
              <label style={labelStyle}>Docket</label>
              <input style={readonlyStyle} readOnly value={selected.docket || ''} />
            </div>
            <div>
              <label style={labelStyle}>USDOT</label>
              <input style={readonlyStyle} readOnly value={selected.usdot || ''} />
            </div>
            <div>
              <label style={labelStyle}>Credit Limit</label>
              <input style={readonlyStyle} readOnly value={selected.creditLimit ? `$${Number(selected.creditLimit).toLocaleString()}` : ''} />
            </div>
            <div>
              <label style={labelStyle}>Available Credit</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input style={{ ...readonlyStyle, flex: 1 }} readOnly value={selected.availableCredit != null ? `$${Number(selected.availableCredit).toLocaleString()}` : ''} />
                <span style={{ fontSize: 12, fontWeight: 700, color: creditColor }}>{creditPct}%</span>
              </div>
            </div>
          </div>

          {/* ── Contact ── */}
          <div style={sectionHeaderStyle}>Contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            {selected.contacts && selected.contacts.length > 1 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Select Contact</label>
                <select style={{ ...inputStyle, maxWidth: 280 }} value={contactIdx} onChange={e => setContactIdx(Number(e.target.value))}>
                  {selected.contacts.map((c, i) => <option key={i} value={i}>{c.name || `Contact ${i + 1}`}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input style={readonlyStyle} readOnly value={contact.name || ''} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={readonlyStyle} readOnly value={contact.email || ''} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={readonlyStyle} readOnly value={contact.phone || ''} />
            </div>
            <div>
              <label style={labelStyle}>Ext</label>
              <input style={readonlyStyle} readOnly value={contact.ext || ''} />
            </div>
          </div>

          {/* ── Notes & Reference ── */}
          <div style={sectionHeaderStyle}>Notes & Reference</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Public Notes</label>
              <textarea style={{ ...readonlyStyle, minHeight: 40, resize: 'vertical' }} readOnly value={selected.publicNotes || ''} />
            </div>
            <div>
              <label style={labelStyle}>Private Notes</label>
              <textarea style={{ ...readonlyStyle, minHeight: 40, resize: 'vertical' }} readOnly value={selected.privateNotes || ''} />
            </div>
            <div>
              <label style={labelStyle}>Customer Reference #</label>
              <input style={inputStyle} value={customerRef} onChange={e => setCustomerRef(e.target.value)} placeholder="Customer PO / Ref" />
            </div>
          </div>
        </>
      )}

      {isComplete && (
        <div style={{ color: '#27ae60', fontWeight: 600, fontSize: 13, marginTop: 8 }}>✓ Customer section complete</div>
      )}
    </div>
  );
}
