import React, { useEffect, useState } from 'react';
import { getUsers, register } from '../../api/client';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      setLoading(true);
      const res = await getUsers();
      if (!mounted) return;
      if (res?.error) {
        setMessage(res.error);
      } else {
        setUsers(Array.isArray(res?.users) ? res.users : []);
      }
      setLoading(false);
    };

    loadUsers();
    return () => {
      mounted = false;
    };
  }, []);

  async function addUser(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    });

    if (res?.error) {
      setMessage(res.error);
      setLoading(false);
      return;
    }

    const createdUser = res?.user;
    if (createdUser) {
      setUsers((prev) => [...prev, createdUser]);
    }
    setMessage('User created successfully.');
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setLoading(false);
  }

  return (
    <div>
      <h4>Users</h4>
      {message && <div style={{ marginBottom: 8, color: message.toLowerCase().includes('success') ? 'var(--success)' : 'var(--error)' }}>{message}</div>}
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.name || '—'} ({u.role}) - {u.email}</li>
        ))}
      </ul>
      <form onSubmit={addUser} style={{ marginTop: 12 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" minLength={8} required />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add User'}</button>
      </form>
    </div>
  );
}
