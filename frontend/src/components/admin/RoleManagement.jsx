import React, { useState } from 'react';

const ROLES_STORAGE_KEY = 'fbpa_roles_v1';

const initialRoles = [
  { id: 1, name: 'Admin', permissions: ['All Access'] },
  { id: 2, name: 'User', permissions: ['View Loads', 'Submit Documents'] },
];

function loadRoles() {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialRoles;
  } catch {
    return initialRoles;
  }
}

export default function RoleManagement({ t }) {
  const [roles, setRoles] = useState(loadRoles);
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState('');

  function saveRoles(next) {
    setRoles(next);
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(next));
  }

  function addRole(e) {
    e.preventDefault();
    const next = [...roles, { id: Date.now(), name: roleName, permissions: permissions.split(',').map(p => p.trim()).filter(Boolean) }];
    saveRoles(next);
    setRoleName(''); setPermissions('');
  }

  function deleteRole(id) {
    saveRoles(roles.filter(r => r.id !== id));
  }

  const errorColor = (t && t.error) || '#ef4444';

  return (
    <div>
      <h4>Roles</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {roles.map(r => (
          <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee' }}>
            <span><b>{r.name}</b>: {r.permissions.join(', ')}</span>
            <button
              type="button"
              onClick={() => deleteRole(r.id)}
              style={{ border: `1px solid ${errorColor}`, color: errorColor, background: 'transparent', borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '3px 10px', cursor: 'pointer' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={addRole} style={{ marginTop: 12 }}>
        <input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="Role Name" required style={{ marginRight: 8 }} />
        <input value={permissions} onChange={e => setPermissions(e.target.value)} placeholder="Permissions (comma separated)" style={{ marginRight: 8 }} />
        <button type="submit">Add Role</button>
      </form>
    </div>
  );
}
