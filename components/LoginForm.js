'use client'

import { useState } from 'react'
import styles from './LoginForm.module.css'

const readApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')
  }
  return ''
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('') // Clear previous message
    setMessage('')

    try {
      const apiBase = readApiBase()
      const payload = { email, password }
      const endpoints = ['/api/auth/login', '/auth/login']

      let lastError = 'Login failed'
      let didLogin = false

      for (const endpoint of endpoints) {
        const res = await fetch(`${apiBase}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await res.json().catch(() => ({}))

        if (res.ok) {
          const accessToken = data.accessToken || data.token
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('token', accessToken)
          }
          setMessage('Login successful! Redirecting...')
          window.location.assign('/dashboard')
          didLogin = true
          break
        }

        lastError = data.error || `Login failed (${res.status})`
      }

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
      setMessage(`Error: ${error.message}`)
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
