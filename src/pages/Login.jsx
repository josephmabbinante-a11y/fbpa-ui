import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, forgotPassword, resetPassword } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';
=======
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/client";
import logo from "../assets/opscale-logo.svg";
import RegisterForm from "../components/Register";
import { InputField, LinkButton, PrimaryButton } from "../components/ui/Primitives";

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setStatus("Password reset email sent!");
      else setStatus(data.error || "Failed to send reset email.");
    } catch {
      setStatus("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="ui-card modal-card">
        <h2 style={{ marginTop: 0 }}>Forgot Password</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <InputField label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="ui-input" />
          </InputField>
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Email"}
          </PrimaryButton>
          {status && <div style={{ color: status.includes("sent") ? "var(--success)" : "var(--error)", fontSize: 13 }}>{status}</div>}
        </form>
        <div style={{ marginTop: 12 }}>
          <LinkButton type="button" onClick={onClose}>Close</LinkButton>
        </div>
      </div>
    </div>
  );
}

function TestModal({ onClose }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="ui-card modal-card" style={{ maxWidth: 320 }}>
        <h2 style={{ marginTop: 0 }}>Test Modal</h2>
        <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>If you see this, modal logic works.</p>
        <LinkButton type="button" onClick={onClose}>Close</LinkButton>
      </div>
    </div>
  );
}
>>>>>>> origin/FBPA

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup, forgotPassword, resetPassword } from "../api/client";
import { useTheme, themes } from "../contexts/ThemeContext";
import logo from "../assets/opscale-logo.svg";
import RegisterForm from "../components/Register";
import { InputField, LinkButton, PrimaryButton } from "../components/ui/Primitives";

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res?.ok) setStatus("Password reset email sent!");
      else setStatus(res?.error || "Failed to send reset email.");
    } catch {
      setStatus("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="ui-card modal-card">
        <h2 style={{ marginTop: 0 }}>Forgot Password</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <InputField label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="ui-input" />
          </InputField>
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Email"}
          </PrimaryButton>
          {status && <div style={{ color: status.includes("sent") ? "var(--success)" : "var(--error)", fontSize: 13 }}>{status}</div>}
        </form>
        <div style={{ marginTop: 12 }}>
          <LinkButton type="button" onClick={onClose}>Close</LinkButton>
        </div>
      </div>
    </div>
  );
}

function TestModal({ onClose }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="ui-card modal-card" style={{ maxWidth: 320 }}>
        <h2 style={{ marginTop: 0 }}>Test Modal</h2>
        <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>If you see this, modal logic works.</p>
        <LinkButton type="button" onClick={onClose}>Close</LinkButton>
      </div>
    </div>
  );
}
  const navigate = useNavigate();
<<<<<<< HEAD
=======
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
>>>>>>> origin/FBPA

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
<<<<<<< HEAD

    const error = validateAuthForm();
    if (error) {
      setStatus(error);
      return;
=======
    setLoading(true);
    const res = await login({ email, password });
    setLoading(false);
    if (res && !res.error && res.accessToken) {
      try {
        localStorage.setItem("accessToken", res.accessToken);
      } catch {
        // Ignore storage errors.
      }
      navigate("/dashboard");
    } else {
      setStatus(res && res.error ? res.error : "Invalid email or password");
>>>>>>> origin/FBPA
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

export default function Login() {
  const navigate = useNavigate();
  const { theme } = useTheme ? useTheme() : { theme: "light" };
  const t = themes?.[theme] || {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        localStorage.setItem("accessToken", res.accessToken);
      } catch {
        // Ignore storage errors.
      }
      navigate("/dashboard");
    } else {
      setStatus(res && res.error ? res.error : "Invalid email or password");
    }
  };

  const handleRegistered = ({ email: newEmail, password: newPassword }) => {
    setEmail(newEmail);
    setPassword(newPassword);
    setShowRegister(false);
    setStatus("Registration successful. Sign in now.");
  };

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        <div className="auth-logo-panel">
          <svg width="96" height="96" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 44 Q10 36 18 34 Q16 18 32 14 Q48 18 46 34 Q54 36 52 44 Q54 54 48 52 Q44 50 40 54 Q36 58 32 54 Q28 58 24 54 Q20 50 16 52 Q10 54 12 44 Z" fill="#fff" stroke="#222" strokeWidth="2"/>
            <ellipse cx="25" cy="32" rx="2" ry="3" fill="#222"/>
            <ellipse cx="39" cy="32" rx="2" ry="3" fill="#222"/>
            <ellipse cx="25" cy="31" rx="0.7" ry="1.2" fill="#fff"/>
            <ellipse cx="39" cy="31" rx="0.7" ry="1.2" fill="#fff"/>
            <path d="M28 40 Q32 44 36 40" stroke="#222" strokeWidth="1.5" fill="none"/>
            <path d="M18 38 Q14 34 20 32" stroke="#222" strokeWidth="2" fill="none"/>
            <path d="M46 38 Q50 34 44 32" stroke="#222" strokeWidth="2" fill="none"/>
          </svg>
        </div>

        <div className="ui-card auth-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <img src={logo} alt="Opscale" style={{ height: 40, width: "auto", display: "block" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Opscale Portal</div>
              <div className="ui-subtitle">Sign in to continue</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <InputField label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="ui-input" />
            </InputField>
            <InputField label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="ui-input" />
            </InputField>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </PrimaryButton>
            {status && <div style={{ color: status.toLowerCase().includes("successful") ? "var(--success)" : "var(--error)", fontSize: 13 }}>{status}</div>}
          </form>

          <div className="auth-actions">
            <LinkButton type="button" onClick={() => setShowForgot(true)}>Forgot password?</LinkButton>
            <LinkButton type="button" onClick={() => setShowRegister(true)}>Need an account? Register</LinkButton>
            <LinkButton type="button" onClick={() => setShowTestModal(true)}>Open Test Modal</LinkButton>
          </div>

          {showRegister && <RegisterForm onClose={() => setShowRegister(false)} onRegistered={handleRegistered} />}
          {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
          {showTestModal && <TestModal onClose={() => setShowTestModal(false)} />}
        </div>
      </div>
    </div>
  );
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

  const handleRegistered = ({ email: newEmail, password: newPassword }) => {
    setEmail(newEmail);
    setPassword(newPassword);
    setShowRegister(false);
    setStatus("Registration successful. Sign in now.");
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
<<<<<<< HEAD
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
=======
    <div className="auth-shell">
      <div className="auth-wrap">
        <div className="auth-logo-panel">
          <svg width="96" height="96" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 44 Q10 36 18 34 Q16 18 32 14 Q48 18 46 34 Q54 36 52 44 Q54 54 48 52 Q44 50 40 54 Q36 58 32 54 Q28 58 24 54 Q20 50 16 52 Q10 54 12 44 Z" fill="#fff" stroke="#222" strokeWidth="2"/>
            <ellipse cx="25" cy="32" rx="2" ry="3" fill="#222"/>
            <ellipse cx="39" cy="32" rx="2" ry="3" fill="#222"/>
            <ellipse cx="25" cy="31" rx="0.7" ry="1.2" fill="#fff"/>
            <ellipse cx="39" cy="31" rx="0.7" ry="1.2" fill="#fff"/>
            <path d="M28 40 Q32 44 36 40" stroke="#222" strokeWidth="1.5" fill="none"/>
            <path d="M18 38 Q14 34 20 32" stroke="#222" strokeWidth="2" fill="none"/>
            <path d="M46 38 Q50 34 44 32" stroke="#222" strokeWidth="2" fill="none"/>
          </svg>
        </div>

        <div className="ui-card auth-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <img src={logo} alt="Opscale" style={{ height: 40, width: "auto", display: "block" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Opscale Portal</div>
              <div className="ui-subtitle">Sign in to continue</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <InputField label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="ui-input" />
            </InputField>
            <InputField label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="ui-input" />
            </InputField>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </PrimaryButton>
            {status && <div style={{ color: status.toLowerCase().includes("successful") ? "var(--success)" : "var(--error)", fontSize: 13 }}>{status}</div>}
          </form>

          <div className="auth-actions">
            <LinkButton type="button" onClick={() => setShowForgot(true)}>Forgot password?</LinkButton>
            <LinkButton type="button" onClick={() => setShowRegister(true)}>Need an account? Register</LinkButton>
            <LinkButton type="button" onClick={() => setShowTestModal(true)}>Open Test Modal</LinkButton>
          </div>

          {showRegister && <RegisterForm onClose={() => setShowRegister(false)} onRegistered={handleRegistered} />}
          {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
          {showTestModal && <TestModal onClose={() => setShowTestModal(false)} />}
>>>>>>> origin/FBPA
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
