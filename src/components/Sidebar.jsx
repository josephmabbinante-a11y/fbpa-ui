// ...existing code...
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { clearAccessToken } from '../utils/authToken';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'DB', path: '/' },
  { id: 'fleet-dashboard', label: 'Fleet Dashboard', icon: 'FD', path: '/fleet' },
  { id: 'customers', label: 'Customers', icon: 'CU', path: '/customers' },
  { id: 'locations', label: 'Locations', icon: 'LO', path: '/locations' },
  { id: 'carriers', label: 'Carriers', icon: 'CR', path: '/carriers' },
  { id: 'invoices', label: 'Invoices', icon: 'IN', path: '/invoices' },
  { id: 'exceptions', label: 'Exceptions', icon: 'EX', path: '/exceptions' },
  { id: 'rate-logic', label: 'Rate Logic Tool', icon: 'RL', path: '/rate-logic' },
  { id: 'reports', label: 'Reports', icon: 'RP', path: '/reports' },
  { id: 'uploads', label: 'Uploads', icon: 'UP', path: '/uploads' },
];

const themes = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

function Sidebar() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('system');

  return (
    <aside style={{ width: 260, minHeight: '100vh', background: '#f8f9fa', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 20 }}>FBPA</span>
        <button
          aria-label="Open settings panel"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
          onClick={() => setShowSettings((v) => !v)}
        >
          ⚙️
        </button>
      </div>
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {navItems.map((item) => (
          <NavLink key={item.id} to={item.path} className="neon-outline" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', textDecoration: 'none', color: '#333' }}>
            <span style={{ marginRight: 8 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            style={{ width: '100%', padding: '8px 0', borderRadius: 4, border: 'none', background: '#e0e0e0', color: '#333', fontWeight: 600 }}
          >
            Theme / Settings
          </button>
        </div>
      </nav>
      <footer style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
        <button type="button" onClick={clearAccessToken} style={{ width: '100%', padding: '8px 0', borderRadius: 4, border: 'none', background: '#e0e0e0', color: '#333', fontWeight: 600 }}>Log Out</button>
      </footer>
      {showSettings && (
        <div style={{ position: 'absolute', top: 60, left: 0, width: '100%', background: '#fff', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10, padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="theme-select" style={{ fontWeight: 600, marginRight: 8 }}>Theme:</label>
            <select
              id="theme-select"
              value={selectedTheme}
              onChange={e => setSelectedTheme(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc' }}
            >
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.label}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              style={{ padding: '6px 12px', borderRadius: 4, border: 'none', background: '#e0e0e0', color: '#333', fontWeight: 600 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
