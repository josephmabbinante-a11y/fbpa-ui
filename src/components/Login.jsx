import React, { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/auth/login`;
      const res = await fetch(apiUrl, {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Login successful!");
        // Optionally store token: localStorage.setItem('token', data.token);
      } else {
        setMessage(data.error || "Invalid email or password");
      }
    } catch (err) {
      setMessage("Network error");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button type="submit">Sign In</button>
        {message && <div className="message">{message}</div>}
      </form>
    </div>
  );
};

export default Login;
