import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_branches_v1';

const initialBranches = [
  { id: 1, name: 'Headquarters', code: 'HQ-01', address: '100 Main Street, New York, NY 10001', manager: 'John Smith', phone: '+1 (212) 555-0100', status: 'Active' },
  { id: 2, name: 'Chicago Office', code: 'CHI-01', address: '200 Michigan Ave, Chicago, IL 60601', manager: 'Lisa Johnson', phone: '+1 (312) 555-0200', status: 'Active' },
  { id: 3, name: 'Dallas Hub', code: 'DAL-01', address: '300 Commerce St, Dallas, TX 75201', manager: 'Robert Garcia', phone: '+1 (214) 555-0300', status: 'Active' },
];

const STATUS_OPTIONS = ['Active', 'Inactive', 'Pending'];

function loadBranches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialBranches;
  } catch {
    return initialBranches;
  }
}

export default function BranchManagementPanel({ t }) {
  const [branches, setBranches] = useState(loadBranches);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [manager, setManager] = useState('');
  const [phone, setPhone] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('Active');

  const themeText = (t && t.text) || '#1a1a2e';
  const themeSecondary = (t && t.textSecondary) || '#6b7280';
  const themeAccent = (t && t.accent) || '#0a7cff';
  const themeBorder = (t && t.border) || '#e5e7eb';
  const themeSurface = (t && t.surface) || '#fff';
  const themeError = (t && t.error) || '#ef4444';
  const themeSuccess = (t && t.success) || '#16a34a';

  function saveBranches(next) {
    setBranches(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addBranch(e) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    const next = [
      ...branches,
      {
        id: Date.now(),
        name: name.trim(),
        code: code.trim(),
        address: address.trim(),
        manager: manager.trim(),
        phone: phone.trim(),
        status: 'Active',
      },
    ];
    saveBranches(next);
    setName('');
    setCode('');
    setAddress('');
    setManager('');
    setPhone('');
  }

  function deleteBranch(id) {
    saveBranches(branches.filter((b) => b.id !== id));
  }

  function startEdit(branch) {
    setEditingId(branch.id);
    setEditStatus(branch.status);
  }

  function saveEdit(id) {
    saveBranches(branches.map((b) => (b.id === id ? { ...b, status: editStatus } : b)));
    setEditingId(null);
  }

  const statusStyle = (status) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    background: status === 'Active' ? `${themeSuccess}22` : status === 'Inactive' ? `${themeError}22` : `${themeSecondary}18`,
    color: status === 'Active' ? themeSuccess : status === 'Inactive' ? themeError : themeSecondary,
  });

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${themeBorder}`,
    fontSize: 13,
    background: 'transparent',
    color: themeText,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: themeSecondary,
    marginBottom: 4,
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 4px', color: themeText }}>Branch Management</h4>
      <div style={{ fontSize: 12, color: themeSecondary, marginBottom: 16 }}>
        Manage office locations, branch assignments, and regional managers.
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total', value: branches.length, color: themeAccent },
          { label: 'Active', value: branches.filter((b) => b.status === 'Active').length, color: themeSuccess },
          { label: 'Inactive', value: branches.filter((b) => b.status === 'Inactive').length, color: themeError },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${themeBorder}`,
              background: themeSurface,
              textAlign: 'center',
              minWidth: 70,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: themeSecondary }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {branches.length === 0 ? (
        <div style={{ color: themeSecondary, fontSize: 13, padding: '12px 0' }}>No branches configured.</div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {branches.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${themeBorder}`,
                marginBottom: 8,
                background: themeSurface,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: themeText }}>{b.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 3,
                      background: `${themeAccent}11`,
                      color: themeAccent,
                      fontWeight: 600,
                    }}
                  >
                    {b.code}
                  </span>
                </div>
                {b.address && <div style={{ fontSize: 12, color: themeSecondary, marginTop: 3 }}>📍 {b.address}</div>}
                <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: 12, color: themeSecondary }}>
                  {b.manager && <span>👤 {b.manager}</span>}
                  {b.phone && <span>📞 {b.phone}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {editingId === b.id ? (
                  <>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: `1px solid ${themeBorder}` }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => saveEdit(b.id)}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: `1px solid ${themeAccent}`,
                        background: themeAccent,
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: `1px solid ${themeBorder}`,
                        background: 'transparent',
                        color: themeSecondary,
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span style={statusStyle(b.status)}>{b.status}</span>
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: `1px solid ${themeBorder}`,
                        background: 'transparent',
                        color: themeText,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBranch(b.id)}
                      style={{
                        border: `1px solid ${themeError}`,
                        color: themeError,
                        background: 'transparent',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: `1px solid ${themeBorder}`,
          background: themeSurface,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: themeText }}>Add New Branch</div>
        <form onSubmit={addBranch}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>Branch Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicago Office" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Branch Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CHI-01" required style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Branch Manager</label>
              <input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={inputStyle} />
            </div>
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              background: themeAccent,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Add Branch
          </button>
        </form>
      </div>
    </div>
  );
}
