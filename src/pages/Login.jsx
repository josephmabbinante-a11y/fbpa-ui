import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';

function RegisterForm({ onClose }) {
  const [form, setForm] = useState({ email: '', password: '', name: '', organization: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registration successful!');
      } else {
        setMessage(data.error || 'Registration failed.');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#23272F', borderRadius: 16, color: '#fff', padding: '2em', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>&times;</button>
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <label>Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required style={{ width: '100%', padding: '0.7em', marginTop: '0.2em', borderRadius: 8, border: '1px solid #444950', background: '#18191A', color: '#fff', fontSize: '1em', boxSizing: 'border-box' }} />
          </label>
          <label>Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required style={{ width: '100%', padding: '0.7em', marginTop: '0.2em', borderRadius: 8, border: '1px solid #444950', background: '#18191A', color: '#fff', fontSize: '1em', boxSizing: 'border-box' }} />
          </label>
          <label>Name
            <input type="text" name="name" value={form.name} onChange={handleChange} style={{ width: '100%', padding: '0.7em', marginTop: '0.2em', borderRadius: 8, border: '1px solid #444950', background: '#18191A', color: '#fff', fontSize: '1em', boxSizing: 'border-box' }} />
          </label>
          <label>Organization
            <input type="text" name="organization" value={form.organization} onChange={handleChange} style={{ width: '100%', padding: '0.7em', marginTop: '0.2em', borderRadius: 8, border: '1px solid #444950', background: '#18191A', color: '#fff', fontSize: '1em', boxSizing: 'border-box' }} />
          </label>
          <button type="submit" style={{ width: '100%', marginTop: '1.5em', padding: '0.9em', background: '#1877F2', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1.1em', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>Register</button>
          {message && <div className="message" style={{ marginTop: '1em', color: message === 'Registration successful!' ? 'green' : '#ff4d4f', fontWeight: 500 }}>{message}</div>}
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    const res = await login({ email, password });
    setLoading(false);
    if (res && !res.error && res.accessToken) {
      try {
        localStorage.setItem('accessToken', res.accessToken);
      } catch {
        // ignore storage errors
      }
      navigate('/dashboard');
    } else {
      setStatus('Invalid email or password');
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: t.bg,
    color: t.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    boxSizing: 'border-box',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: 420,
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 24,
    boxShadow: `0 10px 30px ${t.border}55`,
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    backgroundColor: t.bgAlt,
    color: t.text,
    fontSize: 13,
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: t.accent,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <img src={logo} alt="Opscale" style={{ height: 40, width: 'auto', display: 'block' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Opscale Portal</div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>Sign in to continue</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
            <div style={{ marginTop: 6, textAlign: 'right' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: t.accent, textDecoration: 'underline', fontSize: 12, cursor: 'pointer', padding: 0 }}
                onClick={() => alert('Forgot password functionality coming soon!')}
              >
                Forgot password?
              </button>
            </div>
          </div>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          {status && (
            <div style={{ fontSize: 12, color: t.error, backgroundColor: `${t.error}10`, border: `1px solid ${t.error}`, padding: '8px 10px', borderRadius: 6 }}>
              {status}
            </div>
          )}
        </form>

        <div style={{ marginTop: 16, fontSize: 12, color: t.textSecondary }}>
          By signing in you agree to the Opscale terms and privacy policy.
        </div>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button type="button" onClick={() => setShowRegister(true)} style={{ color: t.accent, background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            Need an account? Register
          </button>
        </div>
        {showRegister && <RegisterForm onClose={() => setShowRegister(false)} />}
      </div>
    </div>
  );
}
