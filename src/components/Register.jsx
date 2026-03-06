
import React, { useState } from "react";
import { useTheme, themes } from '../contexts/ThemeContext';
import { register } from '../api/client';

const Register = ({ onClose, onRegistered }) => {
  const { theme } = useTheme();
  const t = theme || {};
  const [form, setForm] = useState({ email: "", password: "", name: "", organization: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    const res = await register({
      email: form.email,
      password: form.password,
      name: form.name,
      organization: form.organization,
    });
    if (res && !res.error) {
      setMessage("Registration successful.");
      if (onRegistered) {
        onRegistered({ email: form.email, password: form.password });
      }
    } else {
      setMessage(res?.error || "Registration failed.");
    }
    setLoading(false);
  };

  const cardStyle = {
    width: '100%',
    maxWidth: 420,
    /* backgroundColor and color removed to allow CSS module to control background and text color */
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 24,
    boxShadow: `0 10px 30px ${t.border}55`,
    margin: '0 auto',
    marginTop: 24,
  };
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    /* backgroundColor and color removed to allow CSS module to control */
    fontSize: 13,
    boxSizing: 'border-box',
    marginBottom: 12,
  };
  const buttonStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 6,
    border: 'none',
    /* backgroundColor and color removed to allow CSS module to control */
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  };
  const labelStyle = {
    fontSize: 12,
    /* color removed to allow CSS module to control */
    display: 'block',
    marginBottom: 6,
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Register</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Organization</label>
          <input type="text" name="organization" value={form.organization} onChange={handleChange} style={inputStyle} />
        </div>
        <button type="submit" style={buttonStyle} disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        {message && <div style={{ color: message.includes('success') ? t.success : t.error, marginTop: 8 }}>{message}</div>}
      </form>
      {onClose && (
        <button onClick={onClose} style={{ ...buttonStyle, backgroundColor: t.bgAlt, color: t.accent, marginTop: 16 }}>Close</button>
      )}
    </div>
  );
};

export default Register;
