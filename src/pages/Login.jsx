import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';
import RegisterForm from '../components/Register';

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password reset email sent!');
      } else {
        setMessage(data.error || 'Failed to send reset email.');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#23272F', borderRadius: 16, color: '#fff', padding: '2em', position: 'relative' }}>
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <label>Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.7em', marginTop: '0.2em', borderRadius: 8, border: '1px solid #444950', background: '#18191A', color: '#fff', fontSize: '1em', boxSizing: 'border-box' }} />
          </label>
          <button type="submit" style={{ width: '100%', marginTop: 16, padding: '0.9em', background: t.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: '1.1em', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {status && <div style={{ color: '#ff4d4f', marginTop: 8 }}>{status}</div>}
        </form>
      </div>
    </div>
  );
}

function TestModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 300, width: '100%', background: '#23272F', borderRadius: 16, color: '#fff', padding: '2em', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>&times;</button>
        <h2>Test Modal</h2>
        <p>This is a test modal. If you see this, modal logic works.</p>
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
  const [showForgot, setShowForgot] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

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
      setStatus(res && res.error ? res.error : 'Invalid email or password');
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
          </div>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {status && <div style={{ color: '#ff4d4f', marginTop: 8 }}>{status}</div>}
        </form>
        <button type="button" onClick={() => setShowForgot(true)} style={{ color: t.accent, background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginTop: 12 }}>
          Forgot password?
        </button>
        <button type="button" onClick={() => setShowRegister(true)} style={{ color: t.accent, background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          Need an account? Register
        </button>
        <button type="button" onClick={() => setShowTestModal(true)} style={{ color: t.accent, background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginTop: 12 }}>
          Open Test Modal
        </button>
        {showRegister && <RegisterForm onClose={() => setShowRegister(false)} />}
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
        {showTestModal && <TestModal onClose={() => setShowTestModal(false)} />}
      </div>
    </div>
  );
}
