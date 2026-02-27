import React, { useState } from 'react';

const initialUsers = [
  { id: 1, name: 'Alice', role: 'Admin', email: 'alice@example.com' },
  { id: 2, name: 'Bob', role: 'User', email: 'bob@example.com' },
];

export default function UserManagement() {
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');

  function addUser(e) {
    e.preventDefault();
    setUsers([...users, { id: Date.now(), name, email, role }]);
    setName(''); setEmail(''); setRole('User');
  }

  return (
    <div>
      <h4>Users</h4>
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.name} ({u.role}) - {u.email}</li>
        ))}
      </ul>
      <form onSubmit={addUser} style={{ marginTop: 12 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option>User</option>
          <option>Admin</option>
        </select>
        <button type="submit">Add User</button>
      </form>
    </div>
  );
}
