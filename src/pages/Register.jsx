import React, { useState } from "react";

const Register = () => {
  const [form, setForm] = useState({ email: "", password: "", name: "", organization: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful!");
      } else {
        setMessage(data.error || "Registration failed.");
      }
    } catch (err) {
      setMessage("Network error");
    }
  };

  return (
    <div className="register-container" style={{ maxWidth: 400, margin: '2em auto', padding: '2em', background: '#23272F', borderRadius: 16, color: '#fff' }}>
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
  );
};

export default Register;
