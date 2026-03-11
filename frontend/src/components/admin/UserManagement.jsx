import React, { useEffect, useState } from 'react';
import { getUsers, register, updateUser } from '../../api/client';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('user');

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

  async function handleEditSave(userId) {
    setMessage('');
    const res = await updateUser(userId, { role: editRole });
    if (res?.error) {
      setMessage(res.error);
      return;
    }
    const updated = res?.user;
    setUsers((prev) => prev.map((u) => {
      if (u.id === userId) return updated || { ...u, role: editRole };
      return u;
    }));
    setEditingId(null);
    setMessage('User updated.');
  }

  function handleDelete(userId) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: 13 };

  return (
    <div>
      <h4>Users</h4>
      {message && <div style={{ marginBottom: 8, color: message.toLowerCase().includes('success') || message === 'User updated.' ? 'var(--success, #16a34a)' : 'var(--error, #ef4444)' }}>{message}</div>}
      {loading ? (
        <div style={{ color: '#888', fontSize: 13, padding: '8px 0' }}>Loading...</div>
      ) : users.length === 0 ? (
        <div style={{ color: '#888', fontSize: 13, padding: '8px 0' }}>No users found.</div>
      ) : (
        <div>
          {users.map(u => (
            <div key={u.id} style={rowStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>{u.name || '—'}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {editingId === u.id ? (
                  <>
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ fontSize: 12 }}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="button" onClick={() => handleEditSave(u.id)} style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}>Save</button>
                    <button type="button" onClick={() => setEditingId(null)} style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 12, color: '#555' }}>{u.role}</span>
                    <button type="button" onClick={() => { setEditingId(u.id); setEditRole(u.role || 'user'); }} style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}>Edit</button>
                    <button type="button" onClick={() => handleDelete(u.id)} style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', borderRadius: 4 }}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={addUser} style={{ marginTop: 12 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required style={{ marginRight: 6 }} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required style={{ marginRight: 6 }} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" minLength={8} required style={{ marginRight: 6 }} />
        <select value={role} onChange={e => setRole(e.target.value)} style={{ marginRight: 6 }}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add User'}</button>
      </form>
    </div>
  );
}
