import React, { useState } from 'react';

const initialRoles = [
  { id: 1, name: 'Admin', permissions: ['All Access'] },
  { id: 2, name: 'User', permissions: ['View Loads', 'Submit Documents'] },
];

export default function RoleManagement() {
  const [roles, setRoles] = useState(initialRoles);
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState('');

  function addRole(e) {
    e.preventDefault();
    setRoles([...roles, { id: Date.now(), name: roleName, permissions: permissions.split(',').map(p => p.trim()) }]);
    setRoleName(''); setPermissions('');
  }

  return (
    <div>
      <h4>Roles</h4>
      <ul>
        {roles.map(r => (
          <li key={r.id}><b>{r.name}</b>: {r.permissions.join(', ')}</li>
        ))}
      </ul>
      <form onSubmit={addRole} style={{ marginTop: 12 }}>
        <input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="Role Name" required />
        <input value={permissions} onChange={e => setPermissions(e.target.value)} placeholder="Permissions (comma separated)" />
        <button type="submit">Add Role</button>
      </form>
    </div>
  );
}
