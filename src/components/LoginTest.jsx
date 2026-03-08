import React, { useState } from 'react';
import { login } from '../api/client';

export default function LoginTest() {
  const [email, setEmail] = useState('admin@opscale.ai');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await login({ email, password });
    setResult(res);
    setLoading(false);
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Login Test Utility</h2>
      <form onSubmit={handleTestLogin}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Test Login'}
        </button>
      </form>
      {result && (
        <pre style={{ marginTop: 16, background: '#eee', padding: 16 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
