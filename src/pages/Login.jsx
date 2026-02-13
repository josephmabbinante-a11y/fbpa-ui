import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, forgotPassword, resetPassword } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';

export default function Login() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin');
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [forgotStatus, setForgotStatus] = useState(null);
  const [resetToken, setResetToken] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    resetPassword: '',
  });

  const isSignup = mode === 'signup';

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setStatus(null);
    setForgotStatus(null);
    setLoading(false);
    setShowReset(false);
    setResetToken('');
    setForm((prev) => ({
      ...prev,
      password: '',
      confirmPassword: '',
      resetPassword: '',
    }));
  }

  function validateAuthForm() {
    const email = form.email.trim().toLowerCase();
    if (!email) return 'Email is required';
    if (!form.password) return 'Password is required';
    if (isSignup && form.password.length < 8) return 'Password must be at least 8 characters';
    if (isSignup && form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  }

  async function submitAuth(e) {
    e.preventDefault();
    setStatus(null);

    const error = validateAuthForm();
    if (error) {
      setStatus(error);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };
      const action = isSignup ? signup : login;
      const res = await action(payload);

      if (res && !res.error && res.accessToken) {
        try {
          localStorage.setItem('accessToken', res.accessToken);
        } catch {
          // no-op
        }
        navigate('/dashboard');
        return;
      }
      setStatus(res?.error || (isSignup ? 'Signup failed' : 'Invalid email or password'));
    } catch {
      setStatus('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function submitForgot() {
    setForgotStatus(null);
    if (!form.email.trim()) {
      setForgotStatus('Enter your email first');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(form.email.trim().toLowerCase());
      if (res?.ok) {
        setForgotStatus('Reset token generated. Continue to reset password.');
        setResetToken(res.token || '');
        setShowReset(true);
      } else {
        setForgotStatus(res?.error || 'Password reset request failed');
      }
    } catch {
      setForgotStatus('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function submitReset(e) {
    e.preventDefault();
    setForgotStatus(null);
    if (!resetToken.trim()) {
      setForgotStatus('Reset token is required');
      return;
    }
    if (!form.resetPassword) {
      setForgotStatus('New password is required');
      return;
    }
    if (form.resetPassword.length < 8) {
      setForgotStatus('New password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(resetToken.trim(), form.resetPassword);
      if (res?.ok) {
        setShowReset(false);
        setForgotStatus(null);
        setStatus('Password reset successful. Please sign in.');
        setForm((prev) => ({ ...prev, password: '', resetPassword: '' }));
      } else {
        setForgotStatus(res?.error || 'Password reset failed');
      }
    } catch {
      setForgotStatus('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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

  const tabStyle = (active) => ({
    flex: 1,
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${active ? t.accent : t.border}`,
    backgroundColor: active ? `${t.accent}15` : t.bgAlt,
    color: active ? t.accent : t.textSecondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
  });

  const helperStyle = { marginTop: 12, fontSize: 12, color: t.textSecondary };
  const statusStyle = {
    fontSize: 12,
    color: t.error,
    backgroundColor: `${t.error}10`,
    border: `1px solid ${t.error}`,
    padding: '8px 10px',
    borderRadius: 6,
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <img src={logo} alt="Opscale" style={{ height: 40, width: 'auto', display: 'block' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Opscale Portal</div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>
              {showReset ? 'Reset your password' : isSignup ? 'Create your account' : 'Sign in to continue'}
            </div>
          </div>
        </div>

        {!showReset && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" style={tabStyle(!isSignup)} onClick={() => switchMode('signin')} disabled={loading}>
              Sign In
            </button>
            <button type="button" style={tabStyle(isSignup)} onClick={() => switchMode('signup')} disabled={loading}>
              Sign Up
            </button>
          </div>
        )}

        {showReset ? (
          <form onSubmit={submitReset} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>Reset Token</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste token"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>New Password</label>
              <input
                type="password"
                value={form.resetPassword}
                onChange={(e) => updateField('resetPassword', e.target.value)}
                placeholder="********"
                style={inputStyle}
              />
            </div>
            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            {forgotStatus && <div style={statusStyle}>{forgotStatus}</div>}
            <div style={helperStyle}>
              <span style={{ color: t.accent, cursor: 'pointer' }} onClick={() => setShowReset(false)}>
                Back to Sign In
              </span>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={submitAuth} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@company.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="********"
                  style={inputStyle}
                />
              </div>
              {isSignup && (
                <div>
                  <label style={{ fontSize: 12, color: t.textSecondary, display: 'block', marginBottom: 6 }}>Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="********"
                    style={inputStyle}
                  />
                </div>
              )}
              <button type="submit" style={buttonStyle} disabled={loading}>
                {loading ? (isSignup ? 'Signing Up...' : 'Signing In...') : isSignup ? 'Sign Up' : 'Sign In'}
              </button>
              {status && <div style={statusStyle}>{status}</div>}
            </form>

            {!isSignup && (
              <div style={helperStyle}>
                <span style={{ color: t.accent, cursor: 'pointer' }} onClick={submitForgot}>
                  Forgot password?
                </span>
                {forgotStatus && <div style={{ marginTop: 8, fontSize: 12, color: t.error }}>{forgotStatus}</div>}
                {resetToken && (
                  <div style={{ marginTop: 8, fontSize: 12, color: t.textSecondary }}>
                    <strong>Reset Token:</strong> {resetToken}
                  </div>
                )}
              </div>
            )}

            <div style={helperStyle}>
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <span style={{ color: t.accent, cursor: 'pointer' }} onClick={() => switchMode('signin')}>
                    Sign In
                  </span>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <span style={{ color: t.accent, cursor: 'pointer' }} onClick={() => switchMode('signup')}>
                    Sign Up
                  </span>
                </>
              )}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: t.textSecondary }}>
              By signing {isSignup ? 'up' : 'in'}, you agree to the Opscale terms and privacy policy.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
