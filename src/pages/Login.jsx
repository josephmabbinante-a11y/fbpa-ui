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
