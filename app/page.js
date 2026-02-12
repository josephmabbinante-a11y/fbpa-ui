'use client'

export default function Home() {
  return (
    <div style={{ padding: '2em', textAlign: 'center' }}>
      <h1>Opscale Portal</h1>
      <p>Welcome to FBPA Portal</p>
      <div style={{ marginTop: '2em' }}>
        <a href="/login" style={{ marginRight: '1em', padding: '0.5em 1em', background: '#1877F2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Login</a>
        <a href="/register" style={{ padding: '0.5em 1em', background: '#666', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Register</a>
      </div>
    </div>
  )
}
