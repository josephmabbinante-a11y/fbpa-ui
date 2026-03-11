import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_permission_groups_v1';

const initialGroups = [
  { id: 1, name: 'Finance Team', description: 'Access to billing, invoices, and financial reports', access: 'Standard', modules: ['Billing', 'Reports', 'Invoices'] },
  { id: 2, name: 'Operations', description: 'Manage loads, carriers, and dispatching', access: 'Standard', modules: ['Loads', 'Carriers', 'Dispatch', 'Tracking'] },
  { id: 3, name: 'Management', description: 'Full access to all modules and settings', access: 'Admin', modules: ['All Access'] },
];

const ACCESS_LEVELS = ['Read Only', 'Standard', 'Admin', 'Full Access'];
const AVAILABLE_MODULES = ['Loads', 'Carriers', 'Dispatch', 'Tracking', 'Billing', 'Reports', 'Invoices', 'Settings', 'Users', 'Documents', 'Audit'];

function loadGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialGroups;
  } catch {
    return initialGroups;
  }
}

export default function PermissionGroupManagement({ t }) {
  const [groups, setGroups] = useState(loadGroups);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [access, setAccess] = useState('Standard');
  const [selectedModules, setSelectedModules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editAccess, setEditAccess] = useState('Standard');

  const themeText = (t && t.text) || '#1a1a2e';
  const themeSecondary = (t && t.textSecondary) || '#6b7280';
  const themeAccent = (t && t.accent) || '#0a7cff';
  const themeBorder = (t && t.border) || '#e5e7eb';
  const themeSurface = (t && t.surface) || '#fff';
  const themeError = (t && t.error) || '#ef4444';
  const themeSuccess = (t && t.success) || '#16a34a';

  function saveGroups(next) {
    setGroups(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function toggleModule(mod) {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  }

  function addGroup(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const next = [
      ...groups,
      {
        id: Date.now(),
        name: name.trim(),
        description: description.trim(),
        access,
        modules: selectedModules.length > 0 ? selectedModules : ['Read Only'],
      },
    ];
    saveGroups(next);
    setName('');
    setDescription('');
    setAccess('Standard');
    setSelectedModules([]);
  }

  function deleteGroup(id) {
    saveGroups(groups.filter((g) => g.id !== id));
  }

  function startEdit(group) {
    setEditingId(group.id);
    setEditAccess(group.access);
  }

  function saveEdit(id) {
    saveGroups(groups.map((g) => (g.id === id ? { ...g, access: editAccess } : g)));
    setEditingId(null);
  }

  const badgeStyle = (level) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    background:
      level === 'Full Access' || level === 'Admin'
        ? `${themeAccent}22`
        : level === 'Standard'
          ? `${themeSuccess}18`
          : `${themeSecondary}18`,
    color:
      level === 'Full Access' || level === 'Admin'
        ? themeAccent
        : level === 'Standard'
          ? themeSuccess
          : themeSecondary,
  });

  return (
    <div>
      <h4 style={{ margin: '0 0 4px', color: themeText }}>Permission Groups</h4>
      <div style={{ fontSize: 12, color: themeSecondary, marginBottom: 16 }}>
        Define groups with specific module access and permission levels.
      </div>

      {groups.length === 0 ? (
        <div style={{ color: themeSecondary, fontSize: 13, padding: '12px 0' }}>No permission groups defined.</div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {groups.map((g) => (
            <div
              key={g.id}
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
                <div style={{ fontWeight: 600, fontSize: 14, color: themeText }}>{g.name}</div>
                {g.description && (
                  <div style={{ fontSize: 12, color: themeSecondary, marginTop: 2 }}>{g.description}</div>
                )}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {g.modules.map((mod) => (
                    <span
                      key={mod}
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 3,
                        background: `${themeAccent}11`,
                        color: themeAccent,
                        fontWeight: 600,
                      }}
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {editingId === g.id ? (
                  <>
                    <select
                      value={editAccess}
                      onChange={(e) => setEditAccess(e.target.value)}
                      style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: `1px solid ${themeBorder}` }}
                    >
                      {ACCESS_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => saveEdit(g.id)}
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
                    <span style={badgeStyle(g.access)}>{g.access}</span>
                    <button
                      type="button"
                      onClick={() => startEdit(g)}
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
                      onClick={() => deleteGroup(g.id)}
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
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: themeText }}>Add New Group</div>
        <form onSubmit={addGroup}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: themeSecondary, marginBottom: 4 }}>
              Group Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Finance Team"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${themeBorder}`,
                fontSize: 13,
                background: 'transparent',
                color: themeText,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: themeSecondary, marginBottom: 4 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the group's purpose"
              rows={2}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${themeBorder}`,
                fontSize: 13,
                background: 'transparent',
                color: themeText,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: themeSecondary, marginBottom: 4 }}>
              Access Level
            </label>
            <select
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${themeBorder}`,
                fontSize: 13,
                background: 'transparent',
                color: themeText,
              }}
            >
              {ACCESS_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: themeSecondary, marginBottom: 6 }}>
              Module Access
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AVAILABLE_MODULES.map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => toggleModule(mod)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: `1px solid ${selectedModules.includes(mod) ? themeAccent : themeBorder}`,
                    background: selectedModules.includes(mod) ? `${themeAccent}18` : 'transparent',
                    color: selectedModules.includes(mod) ? themeAccent : themeSecondary,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {mod}
                </button>
              ))}
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
            Add Group
          </button>
        </form>
      </div>
    </div>
  );
}
