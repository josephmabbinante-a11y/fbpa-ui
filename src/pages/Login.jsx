import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/client";
import logo from "../assets/opscale-logo.svg";
import RegisterForm from "../components/Register";
import { InputField, LinkButton, PrimaryButton } from "../components/ui/Primitives";
import { setAccessToken } from "../utils/authToken";

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

export default function Login() {
  const navigate = useNavigate();
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
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Security badge">
            <circle cx="60" cy="60" r="56" stroke="rgba(24, 210, 255, 0.45)" strokeWidth="2" />
            <circle cx="60" cy="60" r="46" fill="rgba(15, 27, 54, 0.75)" />
            <path d="M60 22L90 34V58C90 76 76 92 60 98C44 92 30 76 30 58V34L60 22Z" fill="url(#badgeFill)" stroke="#7dd9ff" strokeWidth="2" />
            <rect x="46" y="62" width="8" height="14" rx="1.5" fill="#5f8cff" />
            <rect x="58" y="54" width="8" height="22" rx="1.5" fill="#18d2ff" />
            <rect x="70" y="46" width="8" height="30" rx="1.5" fill="#4ade80" />
            <path d="M48 44L57 52L73 37" stroke="#9cff6d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="badgeFill" x1="60" y1="22" x2="60" y2="98" gradientUnits="userSpaceOnUse">
                <stop stopColor="#163265" />
                <stop offset="1" stopColor="#0b1633" />
              </linearGradient>
            </defs>
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
