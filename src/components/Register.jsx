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
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <label>Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </label>
        <label>Name
          <input type="text" name="name" value={form.name} onChange={handleChange} />
        </label>
        <label>Organization
          <input type="text" name="organization" value={form.organization} onChange={handleChange} />
        </label>
        <button type="submit">Register</button>
        {message && <div className="message">{message}</div>}
      </form>
    </div>
  );
};

export default Register;
