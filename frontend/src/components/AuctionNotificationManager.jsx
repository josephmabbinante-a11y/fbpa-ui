import React, { useState } from 'react';

export default function AuctionNotificationManager({ onAdd, emails = [] }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    const email = input.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (emails.includes(email)) {
      setError('Email already added.');
      return;
    }
    onAdd(email);
    setInput('');
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Auction Notification Recipients</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="email"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="user@email.com"
          style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13, flex: 1 }}
        />
        <button onClick={handleAdd} style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 13 }}>
          Add
        </button>
      </div>
      {error && <div style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <ul style={{ paddingLeft: 18, fontSize: 13, color: '#333' }}>
        {emails.map(email => (
          <li key={email}>{email}</li>
        ))}
      </ul>
    </div>
  );
}
