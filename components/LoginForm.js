'use client'

import { useState } from 'react'
import styles from './LoginForm.module.css'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('') // Clear previous message
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const payload = { email, password };
      console.log('Login payload:', payload);
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json();
        setMessage('Login successful!');
        localStorage.setItem('token', data.token);
        setTimeout(() => {
          window.location.assign('/dashboard');
        }, 500);
      } else {
        const data = await res.json();
        setMessage(data.error || 'Login failed');
      }
    } catch (error) {
      setMessage('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2>Opscale Portal</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
          autoComplete="email"
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="current-password"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
