'use client'

import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#18191A'
    }}>
      <LoginForm />
    </div>
  )
}