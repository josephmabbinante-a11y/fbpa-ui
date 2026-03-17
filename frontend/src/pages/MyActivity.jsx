import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { listLoads } from '../api/loadsClient';
import AuctionNotificationManager from '../components/AuctionNotificationManager';

export default function MyActivity() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = theme || {};

  const [postedLoads, setPostedLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subTab, setSubTab] = useState('posted');

  // Saved searches
  const [savedSearches, setSavedSearches] = useState(() => {
    try {
      const raw = localStorage.getItem('fbpa-loadboard-saved-searches-v1');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Notification emails
  const [notificationEmails, setNotificationEmails] = useState([]);
  const handleAddNotificationEmail = (email) => {
    setNotificationEmails((prev) => [...prev, email]);
  };

  useEffect(() => {
    const fetchPosted = async () => {
      setLoading(true);
      const result = await listLoads({ tab: 'my', q: '', page: 1, pageSize: 50, sort: '-updatedAt' });
      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setPostedLoads(Array.isArray(result?.items) ? result.items : []);
      setLoading(false);
    };
    fetchPosted();
  }, []);

  const removeSavedSearch = (searchId) => {
    const next = savedSearches.filter((s) => s.id !== searchId);
    setSavedSearches(next);
    try {
      localStorage.setItem('fbpa-loadboard-saved-searches-v1', JSON.stringify(next));
    } catch { /* no-op */ }
  };

  const cardStyle = { backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 16 };
  const ghostBtn = { border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const tabStyle = (active) => ({
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? (t.accent || '#3b82f6') : t.textSecondary,
    borderBottom: `2px solid ${active ? (t.accent || '#3b82f6') : 'transparent'}`,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  });

  const awardedCount = postedLoads.filter((l) => l.status === 'DISPATCHED' || l.status === 'DELIVERED').length;
  const openCount = postedLoads.filter((l) => l.status === 'OPEN' || l.status === 'TENDERED' || l.status === 'BOOKED').length;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'My Posted Loads', value: postedLoads.length, color: '#3b82f6' },
          { label: 'Open / Tendered', value: openCount, color: '#10b981' },
          { label: 'Dispatched / Delivered', value: awardedCount, color: '#f59e0b' },
          { label: 'Saved Searches', value: savedSearches.length, color: '#8b5cf6' },
        ].map((kpi) => (
          <div key={kpi.label} style={cardStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${t.border}` }}>
        <button type="button" style={tabStyle(subTab === 'posted')} onClick={() => setSubTab('posted')}>My Posted Loads</button>
        <button type="button" style={tabStyle(subTab === 'searches')} onClick={() => setSubTab('searches')}>Saved Searches</button>
        <button type="button" style={tabStyle(subTab === 'notifications')} onClick={() => setSubTab('notifications')}>Notifications</button>
      </div>

      {subTab === 'posted' && (
        <div style={cardStyle}>
          {loading ? (
            <div style={{ color: t.textSecondary, fontSize: 13 }}>Loading posted loads...</div>
          ) : error ? (
            <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>
          ) : postedLoads.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: t.textSecondary }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No posted loads yet</div>
              <div style={{ fontSize: 12 }}>Create a load and post it to boards from the Post &amp; Auction tab.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {postedLoads.map((load) => (
                <div
                  key={load.id}
                  style={{
                    border: `1px solid ${t.border}`,
                    borderRadius: 10,
                    background: t.bgAlt,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                    <strong>{load.id}</strong>
                    <span style={{ color: t.textSecondary }}>
                      {load.customer?.name || '—'} &bull; {load.origin?.city || '—'} &rarr; {load.destination?.city || '—'}
                    </span>
                    <span style={{ color: t.textSecondary }}>
                      Status: {String(load.status || '').replace('_', ' ')} &bull; Margin: {Number(load.marginPct || 0).toFixed(1)}%
                    </span>
                  </div>
                  <button type="button" style={ghostBtn} onClick={() => navigate(`/loads/${encodeURIComponent(load.id)}/load-basics`)}>
                    Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'searches' && (
        <div style={cardStyle}>
          {savedSearches.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: t.textSecondary }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No saved searches</div>
              <div style={{ fontSize: 12 }}>Run a search in Browse &amp; Bid and save it for quick access.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {savedSearches.map((item) => (
                <div key={item.id} style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                    <strong>{item.label}</strong>
                    <span style={{ color: t.textSecondary }}>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <button type="button" style={{ ...ghostBtn, borderColor: '#ef4444', color: '#ef4444' }} onClick={() => removeSavedSearch(item.id)}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'notifications' && (
        <div style={cardStyle}>
          <AuctionNotificationManager onAdd={handleAddNotificationEmail} emails={notificationEmails} />
        </div>
      )}
    </div>
  );
}
