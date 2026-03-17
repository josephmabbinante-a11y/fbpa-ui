import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getBoardConnections, testBoardConnection } from '../api/boardIntegrationClient';
import { getSaiaAuctionCircuit } from '../api/auctionClient';

const BOARD_INFO = {
  dat: { name: 'DAT Power', icon: '🟢', description: 'Search available loads, post freight, get rate data from DAT network.' },
  truckstop: { name: 'Truckstop Pro', icon: '🔵', description: 'Access Truckstop load board for posting and searching freight.' },
  saia: { name: 'Saia LTL Auction', icon: '🟣', description: 'Participate in Saia LTL auction circuits for competitive LTL pricing.' },
};

export default function BoardConnections() {
  const { theme } = useTheme();
  const t = theme || {};

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [circuit, setCircuit] = useState(null);
  const [circuitLoading, setCircuitLoading] = useState(true);
  const [testResults, setTestResults] = useState({});
  const [testingId, setTestingId] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await getBoardConnections();
      setConnections(Array.isArray(result?.items) ? result.items : []);
      setLoading(false);
    };
    load();

    setCircuitLoading(true);
    getSaiaAuctionCircuit()
      .then((data) => setCircuit(data))
      .catch(() => setCircuit(null))
      .finally(() => setCircuitLoading(false));
  }, []);

  const handleTest = async (boardId) => {
    setTestingId(boardId);
    const result = await testBoardConnection(boardId);
    setTestResults((prev) => ({ ...prev, [boardId]: result }));
    setTestingId('');
  };

  const cardStyle = { backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 20 };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 14, color: t.textSecondary }}>
        Manage your loadboard API connections. Enable boards to search and post freight across multiple networks.
      </div>

      {loading ? (
        <div style={{ color: t.textSecondary }}>Loading connections...</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {connections.map((conn) => {
            const info = BOARD_INFO[conn.id] || { name: conn.name || conn.id, icon: '⚪', description: '' };
            const test = testResults[conn.id];
            return (
              <div key={conn.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                      {info.icon} {info.name}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSecondary }}>{info.description}</div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: conn.status === 'connected' ? '#10b98118' : '#ef444418',
                      color: conn.status === 'connected' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {conn.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase' }}>Last Sync</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{conn.lastSync ? new Date(conn.lastSync).toLocaleString() : 'Never'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase' }}>Loads Available</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{conn.loadCount ?? '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase' }}>Latency</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {test?.ok ? `${test.latencyMs}ms` : test?.error ? 'Error' : '—'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleTest(conn.id)}
                    disabled={testingId === conn.id}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: `1px solid ${t.border}`,
                      background: t.bgAlt,
                      color: t.text,
                      cursor: testingId === conn.id ? 'wait' : 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {testingId === conn.id ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
                {test?.error && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{test.error}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Saia Circuit Status */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>⚡ Saia Auction Circuit</div>
        {circuitLoading ? (
          <div style={{ color: t.textSecondary, fontSize: 13 }}>Loading circuit state...</div>
        ) : circuit ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(circuit).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: t.bg, borderRadius: 4, border: `1px solid ${t.border}`, fontSize: 13 }}>
                <span style={{ color: t.textSecondary, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span style={{ fontWeight: 600, color: String(value).toLowerCase().includes('open') || String(value).toLowerCase().includes('active') ? '#10b981' : t.text }}>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: t.textSecondary }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
            <div style={{ fontSize: 13 }}>Circuit data unavailable. API may be offline.</div>
          </div>
        )}
      </div>

      {/* About Circuits */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>ℹ️ About Board Connections</div>
        <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 12px 0' }}>
            Board connections allow you to search, post, and bid on loads across multiple freight networks simultaneously.
            Configure your API credentials for each board to enable real-time data sync.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {[
              { board: 'DAT Power', desc: 'Rate lookups, load posting, load search across DAT network' },
              { board: 'Truckstop Pro', desc: 'Load board posting, searching, and rate intelligence' },
              { board: 'Saia LTL', desc: 'Auction circuit participation for competitive LTL pricing' },
            ].map((s) => (
              <div key={s.board} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, backgroundColor: '#3b82f618', color: '#3b82f6', fontWeight: 700, whiteSpace: 'nowrap' }}>{s.board}</span>
                <span style={{ fontSize: 12 }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
