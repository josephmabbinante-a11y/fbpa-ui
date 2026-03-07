// ...existing code...
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    const res = await login({ email, password });
    setLoading(false);
    if (res && !res.error && res.accessToken) {
      setAccessToken(res.accessToken);
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
          <img src={logo} alt="Opscale Audit IQ" style={{ width: 320, maxWidth: "100%", height: "auto", display: "block", filter: "drop-shadow(0 10px 22px rgba(24, 210, 255, 0.24))" }} />
        </div>
        <div className="ui-card auth-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <img src={shieldLogo} alt="Opscale shield" style={{ height: 40, width: 40, display: "block", objectFit: "contain" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Opscale Portal</div>
              <div className="ui-subtitle">Sign in to continue</div>
            </div>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <InputField label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="ui-input" autoComplete="email" required />
            </InputField>
            <InputField label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="ui-input" autoComplete="current-password" required />
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
          {/* Debug token display */}
          <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong>[DEBUG] accessToken:</strong>
            <pre style={{ wordBreak: 'break-all', background: '#f6f6f6', padding: 8, borderRadius: 4 }}>{getAccessToken() || 'No token found'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/client";
import logo from "../assets/opscale-logo.svg";
import shieldLogo from "../assets/opscale-shield.svg";
import RegisterForm from "../components/Register";
import { InputField, LinkButton, PrimaryButton } from "../components/ui/Primitives";
import { setAccessToken, getAccessToken } from "../utils/authToken";

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
