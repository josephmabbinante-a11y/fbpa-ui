import { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function LoadBoard() {
  const { theme } = useTheme();
  const t = themes[theme];
  const [activeTab, setActiveTab] = useState('available');

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const headerStyle = {
    marginBottom: 32,
  };

  const titleStyle = {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  };

  const subtitleStyle = {
    fontSize: 14,
    color: t.textSecondary,
  };

  const tabsStyle = {
    display: 'flex',
    gap: 0,
    borderBottom: `1px solid ${t.border}`,
    marginBottom: 24,
  };

  const tabStyle = (isActive) => ({
    padding: '12px 20px',
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? t.accent : t.textSecondary,
    borderBottom: `2px solid ${isActive ? t.accent : 'transparent'}`,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const contentStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 24,
    minHeight: 400,
  };

  const placeholderStyle = {
    textAlign: 'center',
    padding: 60,
    color: t.textSecondary,
    fontSize: 14,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>🚛 Load Board</div>
        <div style={subtitleStyle}>Discover, post, and manage loads in real-time</div>
      </div>

      <div style={tabsStyle}>
        <button
          onClick={() => setActiveTab('available')}
          style={tabStyle(activeTab === 'available')}
        >
          Available Loads
        </button>
        <button
          onClick={() => setActiveTab('posted')}
          style={tabStyle(activeTab === 'posted')}
        >
          My Posted Loads
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          style={tabStyle(activeTab === 'saved')}
        >
          Saved Searches
        </button>
      </div>

      <div style={contentStyle}>
        {activeTab === 'available' && (
          <div style={placeholderStyle}>
            <div style={{ fontSize: 18, marginBottom: 12 }}>📍 Available Loads</div>
            <div>Smart filters • Margin calculator • Carrier scoring</div>
            <div style={{ fontSize: 12, marginTop: 16, color: t.textSecondary }}>
              Load discovery page coming soon
            </div>
          </div>
        )}
        {activeTab === 'posted' && (
          <div style={placeholderStyle}>
            <div style={{ fontSize: 18, marginBottom: 12 }}>📤 My Posted Loads</div>
            <div>Track posted loads and manage offers</div>
            <div style={{ fontSize: 12, marginTop: 16, color: t.textSecondary }}>
              Posted loads management coming soon
            </div>
          </div>
        )}
        {activeTab === 'saved' && (
          <div style={placeholderStyle}>
            <div style={{ fontSize: 18, marginBottom: 12 }}>💾 Saved Searches</div>
            <div>Quick access to your favorite search filters</div>
            <div style={{ fontSize: 12, marginTop: 16, color: t.textSecondary }}>
              Saved searches coming soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
