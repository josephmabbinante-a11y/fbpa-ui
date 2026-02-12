import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, forgotPassword, resetPassword } from '../api/client';
  const [showForgot, setShowForgot] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null);
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';

export default function Login() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    let res;
    if (showForgot) {
      // Reset password flow
      setForgotStatus(null);
      res = await resetPassword(resetToken, resetPasswordValue);
      setLoading(false);
      if (res && res.ok) {
        setShowForgot(false);
        setStatus('Password reset successful. Please log in.');
      } else {
        setForgotStatus(res && res.error ? res.error : 'Reset failed');
      }
      return;
    }
    if (isSignup) {
      if (password !== confirmPassword) {
        setStatus('Passwords do not match');
        setLoading(false);
        return;
      }
      res = await signup({ email, password });
      setLoading(false);
      if (res && !res.error && res.accessToken) {
        try {
          localStorage.setItem('accessToken', res.accessToken);
        } catch {}
        navigate('/dashboard');
      } else {
        setStatus(res && res.error ? res.error : 'Signup failed');
      }
    } else {
      res = await login({ email, password });
      setLoading(false);
      if (res && !res.error && res.accessToken) {
        try {
          localStorage.setItem('accessToken', res.accessToken);
        } catch {}
        navigate('/dashboard');
      } else {
        setStatus('Invalid email or password');
      }
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

        {showForgot ? (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>Reset Token</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste token from email"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>New Password</label>
              <input
                type="password"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            {forgotStatus && (
              <div style={{ fontSize: 12, color: t.error, backgroundColor: `${t.error}10`, border: `1px solid ${t.error}`, padding: '8px 10px', borderRadius: 6 }}>
                {forgotStatus}
              </div>
            )}
            <div style={{ marginTop: 16, fontSize: 12, color: t.textSecondary }}>
              <span style={{ color: t.accent, cursor: 'pointer' }} onClick={() => { setShowForgot(false); setForgotStatus(null); }}>
                Back to Login
              </span>
            </div>
          </form>
        ) : (
          <>
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
              {isSignup && (
                <div>
                  <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                </div>
              )}
              <button type="submit" style={buttonStyle} disabled={loading}>
                {loading ? (isSignup ? 'Signing Up...' : 'Signing In...') : isSignup ? 'Sign Up' : 'Sign In'}
              </button>
              {status && (
                <div style={{ fontSize: 12, color: t.error, backgroundColor: `${t.error}10`, border: `1px solid ${t.error}`, padding: '8px 10px', borderRadius: 6 }}>
                  {status}
                </div>
              )}
            </form>
            <div style={{ marginTop: 12, fontSize: 12, color: t.textSecondary }}>
              <span style={{ color: t.accent, cursor: 'pointer' }} onClick={async () => {
                if (!email) {
                  setForgotStatus('Enter your email above first');
                  return;
                }
                setForgotStatus(null);
                setLoading(true);
                const res = await forgotPassword(email);
                setLoading(false);
                if (res && res.ok && res.token) {
                  setForgotStatus('Check your email for the reset token (demo: token shown below).');
                  setResetToken(res.token);
                  setShowForgot(true);
                } else {
                  setForgotStatus(res && res.error ? res.error : 'Request failed');
                }
              }}>
                Forgot password?
              </span>
              {forgotStatus && resetToken && (
                <div style={{ marginTop: 8, fontSize: 12, color: t.textSecondary }}>
                  <strong>Reset Token:</strong> {resetToken}
                </div>
              )}
              {forgotStatus && !resetToken && (
                <div style={{ marginTop: 8, fontSize: 12, color: t.error }}>{forgotStatus}</div>
              )}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: t.textSecondary }}>
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <span style={{ color: t.accent, cursor: 'pointer' }} onClick={() => { setIsSignup(false); setStatus(null); }}>
                    Sign In
                  </span>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <span style={{ color: t.accent, cursor: 'pointer' }} onClick={() => { setIsSignup(true); setStatus(null); }}>
                    Sign Up
                  </span>
                </>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: t.textSecondary }}>
              By signing {isSignup ? 'up' : 'in'} you agree to the Opscale terms and privacy policy.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
