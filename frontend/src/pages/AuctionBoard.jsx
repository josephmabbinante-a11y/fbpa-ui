import { useState, useEffect } from 'react';
import { quoteSaiaAuction, getSaiaAuctionCircuit } from '../api/auctionClient';
import AuctionNotificationManager from '../components/AuctionNotificationManager';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';

const EQUIPMENT_TYPES = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Double Drop'];

const MOCK_ACTIVE_AUCTIONS = [
  {
    id: 'AUC-4821',
    origin: 'Chicago, IL',
    destination: 'Atlanta, GA',
    miles: 720,
    equipment: 'Dry Van',
    weight: '42,000 lbs',
    pickup: '2026-03-11',
    status: 'Open',
    bids: 4,
    topBid: '$1,480',
    expiry: '2h 14m',
    commodity: 'Automotive Parts',
  },
  {
    id: 'AUC-4820',
    origin: 'Dallas, TX',
    destination: 'Phoenix, AZ',
    miles: 1015,
    equipment: 'Reefer',
    weight: '38,500 lbs',
    pickup: '2026-03-12',
    status: 'Open',
    bids: 2,
    topBid: '$2,240',
    expiry: '5h 02m',
    commodity: 'Produce',
  },
  {
    id: 'AUC-4819',
    origin: 'Los Angeles, CA',
    destination: 'Denver, CO',
    miles: 1020,
    equipment: 'Flatbed',
    weight: '44,000 lbs',
    pickup: '2026-03-11',
    status: 'Closing Soon',
    bids: 7,
    topBid: '$2,150',
    expiry: '0h 38m',
    commodity: 'Steel Coil',
  },
  {
    id: 'AUC-4818',
    origin: 'Memphis, TN',
    destination: 'Houston, TX',
    miles: 565,
    equipment: 'Dry Van',
    weight: '36,000 lbs',
    pickup: '2026-03-13',
    status: 'Open',
    bids: 1,
    topBid: '$1,060',
    expiry: '11h 50m',
    commodity: 'Consumer Goods',
  },
  {
    id: 'AUC-4817',
    origin: 'Seattle, WA',
    destination: 'Portland, OR',
    miles: 185,
    equipment: 'Dry Van',
    weight: '28,000 lbs',
    pickup: '2026-03-10',
    status: 'Awarded',
    bids: 9,
    topBid: '$420',
    expiry: '—',
    commodity: 'Electronics',
  },
];

function StatusBadge({ status }) {
  const colors = {
    'Open': { bg: '#10b98118', text: '#10b981' },
    'Closing Soon': { bg: '#f59e0b18', text: '#f59e0b' },
    'Awarded': { bg: '#3b82f618', text: '#3b82f6' },
    'Expired': { bg: '#ef444418', text: '#ef4444' },
  };
  const c = colors[status] || { bg: '#88888820', text: '#888' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, backgroundColor: c.bg, color: c.text, fontSize: 11, fontWeight: 700 }}>
      {status}
    </span>
  );
}

export default function AuctionBoard() {
  const { theme } = useTheme();
  const t = theme;
  const { demoMode } = useDemo();

  // Notification emails state (moved inside component)
  const [notificationEmails, setNotificationEmails] = useState([]);
  const handleAddNotificationEmail = (email) => {
    setNotificationEmails((prev) => [...prev, email]);
    // TODO: Persist to backend if needed
  };

  const [circuit, setCircuit] = useState(null);
  const [circuitLoading, setCircuitLoading] = useState(true);

  const [selectedAuction, setSelectedAuction] = useState(null);
  const [activeTab, setActiveTab] = useState('board');

  // Quote form state
  const [quoteOrigin, setQuoteOrigin] = useState('');
  const [quoteDestination, setQuoteDestination] = useState('');
  const [quoteMiles, setQuoteMiles] = useState('');
  const [quoteEquipment, setQuoteEquipment] = useState('Dry Van');
  const [quoteWeight, setQuoteWeight] = useState('');
  const [quotePickup, setQuotePickup] = useState('');
  const [quoteResult, setQuoteResult] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  const auctions = demoMode ? MOCK_ACTIVE_AUCTIONS : [];

  useEffect(() => {
    setCircuitLoading(true);
    getSaiaAuctionCircuit()
      .then(data => setCircuit(data))
      .catch(() => setCircuit(null))
      .finally(() => setCircuitLoading(false));
  }, []);

  async function handleQuote() {
    setQuoting(true);
    setQuoteError('');
    setQuoteResult(null);
    try {
      const load = {
        origin: quoteOrigin,
        destination: quoteDestination,
        miles: Number(quoteMiles),
        equipment: quoteEquipment,
        weight: Number(quoteWeight),
        pickupDate: quotePickup,
      };
      const result = await quoteSaiaAuction(load);
      setQuoteResult(result);
    } catch (err) {
      setQuoteError('Quote request failed. Please try again.');
    } finally {
      setQuoting(false);
    }
  }

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const cardStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 20,
  };

  const tabStyle = (active) => ({
    padding: '8px 18px',
    borderRadius: 4,
    border: `1px solid ${active ? t.accent : t.border}`,
    backgroundColor: active ? t.accent : 'transparent',
    color: active ? '#fff' : t.text,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  });

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 4,
    border: `1px solid ${t.border}`,
    backgroundColor: t.bg,
    color: t.text,
    fontSize: 13,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: t.textSecondary,
    marginBottom: 4,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const thStyle = {
    backgroundColor: t.bgAlt,
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: t.textSecondary,
    borderBottom: `1px solid ${t.border}`,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tdStyle = {
    padding: '12px 14px',
    fontSize: 12,
    borderBottom: `1px solid ${t.border}`,
    verticalAlign: 'middle',
  };

  const openCount = auctions.filter(a => a.status === 'Open' || a.status === 'Closing Soon').length;
  const awardedCount = auctions.filter(a => a.status === 'Awarded').length;
  const totalBids = auctions.reduce((s, a) => s + (a.bids || 0), 0);

  return (
    <div style={containerStyle}>

      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>🏷️ Auction Board</div>
        <div style={{ fontSize: 14, color: t.textSecondary }}>
          Live freight load auctions • Competitive bidding • Carrier rate discovery • Saia integration
        </div>
      </div>

      {/* Notification Manager */}
      <AuctionNotificationManager onAdd={handleAddNotificationEmail} emails={notificationEmails} />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Auctions', value: openCount, color: '#10b981' },
          { label: 'Total Bids Today', value: totalBids, color: '#3b82f6' },
          { label: 'Awarded Loads', value: awardedCount, color: '#f59e0b' },
          { label: 'Circuit Status', value: circuitLoading ? '…' : circuit ? 'Online' : 'Unknown', color: circuit ? '#10b981' : '#f59e0b' },
        ].map(kpi => (
          <div key={kpi.label} style={cardStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button style={tabStyle(activeTab === 'board')} onClick={() => setActiveTab('board')}>Live Auction Board</button>
        <button style={tabStyle(activeTab === 'quote')} onClick={() => setActiveTab('quote')}>Get Auction Quote</button>
        <button style={tabStyle(activeTab === 'circuit')} onClick={() => setActiveTab('circuit')}>Circuit Status</button>
      </div>

      {activeTab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedAuction ? '2fr 1fr' : '1fr', gap: 20 }}>
          <div style={cardStyle}>
            {auctions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: t.textSecondary }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏷️</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No active auctions</div>
                <div style={{ fontSize: 12 }}>Enable demo mode to see sample auctions, or connect to your auction feed.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Auction</th>
                    <th style={thStyle}>Lane</th>
                    <th style={thStyle}>Equipment</th>
                    <th style={thStyle}>Pickup</th>
                    <th style={thStyle}>Bids</th>
                    <th style={thStyle}>Top Bid</th>
                    <th style={thStyle}>Closes In</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map(auction => (
                    <tr
                      key={auction.id}
                      style={{ cursor: 'pointer', backgroundColor: selectedAuction?.id === auction.id ? t.bgAlt : 'transparent' }}
                      onClick={() => setSelectedAuction(selectedAuction?.id === auction.id ? null : auction)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = t.bgAlt}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedAuction?.id === auction.id ? t.bgAlt : 'transparent'}
                    >
                      <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{auction.id}</span></td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{auction.origin}</div>
                        <div style={{ fontSize: 11, color: t.textSecondary }}>→ {auction.destination}</div>
                      </td>
                      <td style={tdStyle}>{auction.equipment}</td>
                      <td style={tdStyle}>{auction.pickup}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: auction.bids >= 5 ? '#10b981' : t.text }}>
                          {auction.bids}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#10b981' }}>{auction.topBid}</td>
                      <td style={{ ...tdStyle, color: auction.expiry === '—' ? t.textSecondary : auction.status === 'Closing Soon' ? '#f59e0b' : t.text, fontWeight: auction.status === 'Closing Soon' ? 700 : 400 }}>
                        {auction.expiry}
                      </td>
                      <td style={tdStyle}><StatusBadge status={auction.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedAuction && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selectedAuction.id}</div>
                    <StatusBadge status={selectedAuction.status} />
                  </div>
                  <button
                    onClick={() => setSelectedAuction(null)}
                    style={{ background: 'none', border: 'none', color: t.textSecondary, cursor: 'pointer', fontSize: 18 }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>Origin</span>
                    <span style={{ fontWeight: 600 }}>{selectedAuction.origin}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>Destination</span>
                    <span style={{ fontWeight: 600 }}>{selectedAuction.destination}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>Miles</span>
                    <span style={{ fontWeight: 600 }}>{selectedAuction.miles.toLocaleString()} mi</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>Equipment</span>
                    <span style={{ fontWeight: 600 }}>{selectedAuction.equipment}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>Weight</span>
                    <span style={{ fontWeight: 600 }}>{selectedAuction.weight}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>Commodity</span>
                    <span style={{ fontWeight: 600 }}>{selectedAuction.commodity}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>Pickup Date</span>
                    <span style={{ fontWeight: 600 }}>{selectedAuction.pickup}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>Active Bids</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{selectedAuction.bids}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>Current Top Bid</span>
                    <span style={{ fontWeight: 700, color: '#10b981', fontSize: 16 }}>{selectedAuction.topBid}</span>
                  </div>
                </div>

                {selectedAuction.status !== 'Awarded' && selectedAuction.status !== 'Expired' && (
                  <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Place Bid</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="Your bid ($)"
                        type="number"
                      />
                      <button style={{ padding: '8px 16px', borderRadius: 4, border: 'none', backgroundColor: t.accent || '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                        Submit Bid
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'quote' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📋 Request Auction Quote</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Origin</label>
                  <input style={inputStyle} value={quoteOrigin} onChange={e => setQuoteOrigin(e.target.value)} placeholder="City, State" />
                </div>
                <div>
                  <label style={labelStyle}>Destination</label>
                  <input style={inputStyle} value={quoteDestination} onChange={e => setQuoteDestination(e.target.value)} placeholder="City, State" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Miles (estimated)</label>
                  <input style={inputStyle} type="number" value={quoteMiles} onChange={e => setQuoteMiles(e.target.value)} placeholder="e.g. 720" min={1} />
                </div>
                <div>
                  <label style={labelStyle}>Equipment Type</label>
                  <select style={inputStyle} value={quoteEquipment} onChange={e => setQuoteEquipment(e.target.value)}>
                    {EQUIPMENT_TYPES.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Weight (lbs)</label>
                  <input style={inputStyle} type="number" value={quoteWeight} onChange={e => setQuoteWeight(e.target.value)} placeholder="e.g. 42000" min={1} />
                </div>
                <div>
                  <label style={labelStyle}>Pickup Date</label>
                  <input style={inputStyle} type="date" value={quotePickup} onChange={e => setQuotePickup(e.target.value)} />
                </div>
              </div>
              {quoteError && (
                <div style={{ padding: '8px 12px', backgroundColor: '#ef444418', border: '1px solid #ef444440', borderRadius: 4, fontSize: 12, color: '#ef4444' }}>
                  {quoteError}
                </div>
              )}
              <button
                onClick={handleQuote}
                disabled={quoting || !quoteOrigin || !quoteDestination}
                style={{ padding: '10px 0', borderRadius: 4, border: 'none', backgroundColor: quoting || !quoteOrigin || !quoteDestination ? t.border : (t.accent || '#3b82f6'), color: quoting || !quoteOrigin || !quoteDestination ? t.textSecondary : '#fff', cursor: quoting || !quoteOrigin || !quoteDestination ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}
              >
                {quoting ? 'Getting Quote…' : 'Get Auction Quote'}
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📊 Quote Result</div>
            {quoteResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(quoteResult).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: t.bg, borderRadius: 4, border: `1px solid ${t.border}` }}>
                    <span style={{ fontSize: 12, color: t.textSecondary, textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: typeof value === 'number' ? '#10b981' : t.text }}>
                      {typeof value === 'number' ? `$${value.toLocaleString()}` : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: t.textSecondary }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 13 }}>Fill in the form and click "Get Auction Quote" to see results</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'circuit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>⚡ Saia Auction Circuit</div>
            {circuitLoading ? (
              <div style={{ color: t.textSecondary, fontSize: 13 }}>Loading circuit state…</div>
            ) : circuit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(circuit).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: t.bg, borderRadius: 4, border: `1px solid ${t.border}`, fontSize: 13 }}>
                    <span style={{ color: t.textSecondary, textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span style={{ fontWeight: 600, color: String(value).toLowerCase().includes('open') || String(value).toLowerCase().includes('active') ? '#10b981' : t.text }}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: t.textSecondary }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
                <div style={{ fontSize: 13 }}>Circuit data unavailable. API may be offline or not configured.</div>
              </div>
            )}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>ℹ️ About Auction Circuits</div>
            <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 12px 0' }}>
                Auction circuits define the time windows and rules for how freight loads are opened for competitive bidding among qualified carriers.
              </p>
              <p style={{ margin: '0 0 12px 0' }}>
                The circuit state determines whether new auctions can be posted, whether bids are being accepted, and when awards are processed.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {[
                  { state: 'Open', desc: 'Auctions accepting new loads and bids' },
                  { state: 'Closing', desc: 'Final bids being accepted, no new loads' },
                  { state: 'Awarded', desc: 'Bids processed, loads assigned to carriers' },
                  { state: 'Closed', desc: 'Circuit complete, awaiting next window' },
                ].map(s => (
                  <div key={s.state} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, backgroundColor: '#3b82f618', color: '#3b82f6', fontWeight: 700, whiteSpace: 'nowrap' }}>{s.state}</span>
                    <span style={{ fontSize: 12 }}>{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
