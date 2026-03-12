import React, { useState } from 'react';
import { useMultitenant } from '../contexts/MultitenantContext';
import { useMtApi, mtListTenants, mtCreateTenant, mtUpdateTenantStatus } from '../hooks/useMtApi';
import { useTheme, themes } from '../contexts/ThemeContext';

function StatusBadge({ status }) {
  const color =
    status === 'active' ? '#16a34a' :
    status === 'suspended' ? '#d97706' :
    '#6b7280';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        textTransform: 'uppercase',
      }}
    >
      {status || 'unknown'}
    </span>
  );
}

function LoginPanel({ onLogin, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const result = await onLogin(email, password);
    if (result?.error) setError(result.error);
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: '80px auto',
        padding: 32,
        borderRadius: 16,
        background: 'rgba(14, 26, 50, 0.92)',
        border: '1px solid rgba(24, 210, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <h2 style={{ margin: '0 0 6px', color: '#d9edff', fontSize: 20, fontWeight: 700 }}>
        Tenant Admin Login
      </h2>
      <p style={{ margin: '0 0 24px', color: '#9cb0d3', fontSize: 13 }}>
        Sign in with your multitenant SUPER_ADMIN credentials.
      </p>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ display: 'block', color: '#9cb0d3', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(24, 210, 255, 0.25)',
              background: 'rgba(255,255,255,0.05)',
              color: '#d9edff',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ display: 'block', color: '#9cb0d3', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(24, 210, 255, 0.25)',
              background: 'rgba(255,255,255,0.05)',
              color: '#d9edff',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </label>
        {error && (
          <p style={{ color: '#f87171', fontSize: 13, margin: '0 0 14px' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function CreateTenantForm({ onCreate }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const result = await onCreate(name.trim());
    setBusy(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setName('');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="New tenant name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{
          flex: '1 1 200px',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid rgba(24, 210, 255, 0.25)',
          background: 'rgba(255,255,255,0.05)',
          color: '#d9edff',
          fontSize: 14,
        }}
      />
      <button
        type="submit"
        disabled={busy}
        style={{
          padding: '8px 18px',
          borderRadius: 8,
          border: 'none',
          background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {busy ? 'Creating…' : 'Create Tenant'}
      </button>
      {error && <span style={{ color: '#f87171', fontSize: 13, alignSelf: 'center' }}>{error}</span>}
    </form>
  );
}

export default function TenantAdmin() {
  const { theme } = useTheme();
  const t = themes[theme];
  const mt = useMultitenant();

  const { data: tenants, loading, error, setData: setTenants } = useMtApi(
    mtListTenants,
    [],
    [mt?.isAuthenticated],
  );

  const [loginBusy, setLoginBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);

  async function handleLogin(email, password) {
    setLoginBusy(true);
    const result = await mt.login(email, password);
    setLoginBusy(false);
    return result;
  }

  async function handleCreate(name) {
    const result = await mtCreateTenant(name);
    if (!result.error) {
      setTenants((prev) => [...(Array.isArray(prev) ? prev : []), result]);
    }
    return result;
  }

  async function handleToggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setStatusBusy(id);
    const result = await mtUpdateTenantStatus(id, newStatus);
    setStatusBusy(null);
    if (!result.error) {
      setTenants((prev) =>
        (Array.isArray(prev) ? prev : []).map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
      );
    }
    return result;
  }

  async function handleImpersonate(id) {
    await mt.impersonate(id);
  }

  if (!mt?.isAuthenticated) {
    return <LoginPanel onLogin={handleLogin} loading={loginBusy} />;
  }

  return (
    <div style={{ padding: '28px 24px', maxWidth: 960, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: t?.text || '#d9edff' }}>
            Tenant Administration
          </h1>
          {mt.impersonatedTenantId && (
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#f59e0b' }}>
              Impersonating tenant: <strong>{mt.impersonatedTenantId}</strong>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {mt.impersonatedTenantId && (
            <button
              type="button"
              onClick={mt.stopImpersonation}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(245, 158, 11, 0.5)',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Stop Impersonating
            </button>
          )}
          <button
            type="button"
            onClick={mt.logout}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(248, 113, 113, 0.4)',
              background: 'rgba(248, 113, 113, 0.08)',
              color: '#f87171',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div
        style={{
          marginBottom: 24,
          padding: '16px 20px',
          borderRadius: 12,
          background: 'rgba(14, 26, 50, 0.7)',
          border: '1px solid rgba(24, 210, 255, 0.15)',
        }}
      >
        <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#d9edff' }}>
          New Tenant
        </h2>
        <CreateTenantForm onCreate={handleCreate} />
      </div>

      <div
        style={{
          borderRadius: 12,
          background: 'rgba(14, 26, 50, 0.7)',
          border: '1px solid rgba(24, 210, 255, 0.15)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(24, 210, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#d9edff' }}>Tenants</h2>
          <span style={{ color: '#9cb0d3', fontSize: 13 }}>
            {loading ? 'Loading…' : `${Array.isArray(tenants) ? tenants.length : 0} total`}
          </span>
        </div>

        {error && (
          <div style={{ padding: '14px 20px', color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && Array.isArray(tenants) && tenants.length === 0 && (
          <div style={{ padding: '28px 20px', color: '#9cb0d3', fontSize: 14, textAlign: 'center' }}>
            No tenants found.
          </div>
        )}

        {Array.isArray(tenants) && tenants.length > 0 && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              color: '#d5e2ff',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(24, 210, 255, 0.1)' }}>
                {['Name', 'ID', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 20px',
                      textAlign: 'left',
                      color: '#9cb0d3',
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  style={{
                    borderBottom: '1px solid rgba(157, 178, 214, 0.08)',
                    background:
                      mt.impersonatedTenantId === tenant.id
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'transparent',
                  }}
                >
                  <td style={{ padding: '12px 20px', fontWeight: 600 }}>{tenant.name}</td>
                  <td style={{ padding: '12px 20px', color: '#9cb0d3', fontFamily: 'monospace' }}>
                    {tenant.id}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        disabled={statusBusy === tenant.id}
                        onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(24, 210, 255, 0.25)',
                          background: 'rgba(24, 210, 255, 0.08)',
                          color: '#8df2ff',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: statusBusy === tenant.id ? 'not-allowed' : 'pointer',
                          opacity: statusBusy === tenant.id ? 0.6 : 1,
                        }}
                      >
                        {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        disabled={mt.impersonatedTenantId === tenant.id}
                        onClick={() => handleImpersonate(tenant.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          background: 'rgba(245, 158, 11, 0.08)',
                          color: '#f59e0b',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: mt.impersonatedTenantId === tenant.id ? 'not-allowed' : 'pointer',
                          opacity: mt.impersonatedTenantId === tenant.id ? 0.5 : 1,
                        }}
                      >
                        {mt.impersonatedTenantId === tenant.id ? 'Active' : 'Impersonate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
