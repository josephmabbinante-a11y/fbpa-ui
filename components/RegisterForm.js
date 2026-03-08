'use client'

import { useState } from 'react'
import styles from './RegisterForm.module.css'

const REGISTER_EMAIL_DOMAIN = 'users.opscale.local'

const buildUserIdFromName = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.')

const buildEmailFromName = (name) => {
  const userId = buildUserIdFromName(name)
  return userId ? `${userId}@${REGISTER_EMAIL_DOMAIN}` : ''
}

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const generatedEmail = buildEmailFromName(name)
      if (!generatedEmail) {
        setMessage('Enter a valid name to generate an email/user ID.')
        setIsLoading(false)
        return
      }

      const apiUrl = import.meta.env.VITE_API_URL;
      const payload = { email: generatedEmail, password, name, organization, phone };
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setMessage('Registration successful!')
        setEmail('')
        setPassword('')
        setName('')
        setOrganization('')
        setPhone('')
      } else {
        const data = await res.json()
        setMessage(data.error || 'Registration failed')
      }
    } catch (error) {
      setMessage('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input 
          type="email" 
          placeholder="Generated from name" 
          value={email}
          required
          autoComplete="email"
          readOnly
        />
        <small>Email (user ID) is generated automatically from Name.</small>
        <label>Password</label>
        <input 
          type="password" 
          placeholder="********" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <label>Name</label>
        <input 
          type="text" 
          placeholder="Full Name" 
          value={name}
          onChange={(e) => {
            const nextName = e.target.value
            setName(nextName)
            setEmail(buildEmailFromName(nextName))
          }}
          required
        />
        <label>Organization</label>
        <input 
          type="text" 
          placeholder="Organization" 
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          required
        />
        <label>Phone Number</label>
        <input 
          type="tel" 
          placeholder="Phone Number" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
