import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import { listLoads } from '../api/loadsClient';
import { searchExternalBoards, placeBid, getLoadBids, placeCarrierBid, acceptBid, declineBid } from '../api/boardIntegrationClient';
import { LoadStatusBadge } from '../components/LoadStatusBadge';

const EQUIPMENT_FILTERS = ['All', 'Dry Van', 'Reefer', 'Flatbed', 'Step Deck'];
const SOURCE_OPTIONS = [
  { id: 'internal', label: 'Internal' },
  { id: 'dat', label: 'DAT' },
  { id: 'truckstop', label: 'Truckstop' },
  { id: 'saia', label: 'Saia' },
];

function SourceBadge({ source, theme: t }) {
  const colors = {
    internal: { bg: '#3b82f618', text: '#3b82f6' },
    dat: { bg: '#10b98118', text: '#10b981' },
    truckstop: { bg: '#f59e0b18', text: '#f59e0b' },
    saia: { bg: '#8b5cf618', text: '#8b5cf6' },
  };
  const c = colors[source] || { bg: `${t.border}40`, text: t.textSecondary };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, backgroundColor: c.bg, color: c.text, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
      {source}
    </span>
  );
}

export default function BrowseAndBid() {
  const { theme } = useTheme();
  const t = theme || {};
  const { demoMode } = useDemo();

  const [internalLoads, setInternalLoads] = useState([]);
  const [externalLoads, setExternalLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [activeSources, setActiveSources] = useState(['internal', 'dat', 'truckstop', 'saia']);

  // Bid state
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidWorking, setBidWorking] = useState(false);
  const [bidMessage, setBidMessage] = useState('');

  // Carrier bid tracking state
  const [loadBids, setLoadBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidForm, setBidForm] = useState({
    carrierName: '',
    mcNumber: '',
    amount: '',
    transitDays: '',
    equipment: '',
    notes: '',
    bidderRole: 'carrier_rep',
    bidderName: '',
  });
  const [bidActionBusy, setBidActionBusy] = useState('');

  const fetchBids = useCallback(async (loadId) => {
    if (!loadId) return;
    setBidsLoading(true);
    const res = await getLoadBids(loadId);
    setLoadBids(Array.isArray(res?.items) ? res.items : []);
    setBidsLoading(false);
  }, []);

  const toggleSource = (src) => {
    setActiveSources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  const fetchAll = async () => {
    setLoading(true);
    setError('');

    const [internalResult, externalResult] = await Promise.all([
      activeSources.includes('internal')
        ? listLoads({ tab: 'all', q: query, page: 1, pageSize: 50, sort: '-updatedAt' })
        : Promise.resolve({ items: [] }),
      searchExternalBoards({
        sources: activeSources.filter((s) => s !== 'internal'),
        equipment: equipmentFilter !== 'All' ? equipmentFilter : undefined,
      }),
    ]);

    if (internalResult?.error) setError(internalResult.error);

    const internal = (Array.isArray(internalResult?.items) ? internalResult.items : []).map((l) => ({
      ...l,
      source: 'internal',
      rate: l.revenue ? `$${Number(l.revenue).toLocaleString()}` : '—',
      postedAt: l.createdAt || l.updatedAt,
      status: l.status || 'Open',
    }));

    const external = Array.isArray(externalResult?.items) ? externalResult.items : [];
    setInternalLoads(internal);
    setExternalLoads(external);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [activeSources, equipmentFilter]);

  const allLoads = useMemo(() => {
    let combined = [...internalLoads, ...externalLoads];
    if (query) {
      const q = query.toLowerCase();
      combined = combined.filter(
        (l) =>
          (l.id || '').toLowerCase().includes(q) ||
          (l.origin?.city || '').toLowerCase().includes(q) ||
          (l.destination?.city || '').toLowerCase().includes(q) ||
          (l.commodity || '').toLowerCase().includes(q) ||
          (l.customer?.name || '').toLowerCase().includes(q)
      );
    }
    if (equipmentFilter !== 'All') {
      combined = combined.filter((l) =>
        (l.equipment || '').toLowerCase().includes(equipmentFilter.toLowerCase())
      );
    }
    return combined;
  }, [internalLoads, externalLoads, query, equipmentFilter]);

  const handlePlaceBid = async () => {
    if (!selectedLoad || !bidAmount) return;
    const amt = Number(bidAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setBidMessage('Enter a valid bid amount.');
      return;
    }
    setBidWorking(true);
    setBidMessage('');
    const result = await placeBid(selectedLoad.id, { amount: amt, source: selectedLoad.source });
    setBidWorking(false);
    if (result?.error) {
      setBidMessage(result.error);
    } else {
      setBidMessage(result.message || `Bid of $${amt.toLocaleString()} placed on ${selectedLoad.id}`);
      setBidAmount('');
    }
  };

  // Carrier bid submission for internal loads
  const handlePlaceCarrierBid = async () => {
    if (!selectedLoad) return;
    const amt = Number(bidForm.amount);
    if (!bidForm.carrierName.trim()) { setBidMessage('Carrier name is required.'); return; }
    if (!Number.isFinite(amt) || amt <= 0) { setBidMessage('Enter a valid bid amount.'); return; }
    setBidWorking(true);
    setBidMessage('');
    const res = await placeCarrierBid(selectedLoad.id, {
      carrierName: bidForm.carrierName.trim(),
      mcNumber: bidForm.mcNumber.trim(),
      amount: amt,
      transitDays: bidForm.transitDays ? Number(bidForm.transitDays) : undefined,
      equipment: bidForm.equipment.trim(),
      notes: bidForm.notes.trim(),
      bidderRole: bidForm.bidderRole,
      bidderName: bidForm.bidderName.trim(),
    });
    setBidWorking(false);
    if (res?.error) {
      setBidMessage(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
    } else {
      setBidMessage(`Bid $${amt.toLocaleString()} from ${bidForm.carrierName} submitted.`);
      setBidForm({ carrierName: '', mcNumber: '', amount: '', transitDays: '', equipment: '', notes: '', bidderRole: 'carrier_rep', bidderName: '' });
      await fetchBids(selectedLoad.id);
    }
  };

  const handleAcceptBid = async (bid) => {
    setBidActionBusy(bid.id);
    const res = await acceptBid(selectedLoad.id, bid.id);
    setBidActionBusy('');
    if (res?.error) { setBidMessage(typeof res.error === 'string' ? res.error : 'Failed to accept bid.'); }
    else { setBidMessage(`Accepted bid from ${bid.carrierName}.`); await fetchBids(selectedLoad.id); }
  };

  const handleDeclineBid = async (bid) => {
    setBidActionBusy(bid.id);
    const res = await declineBid(selectedLoad.id, bid.id);
    setBidActionBusy('');
    if (res?.error) { setBidMessage(typeof res.error === 'string' ? res.error : 'Failed to decline bid.'); }
    else { setBidMessage(`Declined bid from ${bid.carrierName}.`); await fetchBids(selectedLoad.id); }
  };

  // Fetch bids when selecting an internal load
  useEffect(() => {
    if (selectedLoad?.source === 'internal' && selectedLoad?.id) {
      fetchBids(selectedLoad.id);
    } else {
      setLoadBids([]);
    }
  }, [selectedLoad?.id, selectedLoad?.source, fetchBids]);

  const cardStyle = { backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 16 };
  const inputStyle = { padding: '8px 10px', borderRadius: 6, border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.text, fontSize: 13, boxSizing: 'border-box' };
  const ghostBtn = { border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const thStyle = { backgroundColor: t.bgAlt, padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.textSecondary, borderBottom: `1px solid ${t.border}`, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const tdStyle = { padding: '10px 12px', fontSize: 12, borderBottom: `1px solid ${t.border}`, verticalAlign: 'middle' };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Loads', value: allLoads.length, color: '#3b82f6' },
          { label: 'Internal', value: internalLoads.length, color: '#10b981' },
          { label: 'External (DAT/TS/Saia)', value: externalLoads.length, color: '#f59e0b' },
          { label: 'Sources Active', value: activeSources.length, color: '#8b5cf6' },
        ].map((kpi) => (
          <div key={kpi.label} style={cardStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchAll()}
          placeholder="Search by ID, city, commodity, customer..."
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <select
          value={equipmentFilter}
          onChange={(e) => setEquipmentFilter(e.target.value)}
          style={{ ...inputStyle, minWidth: 120 }}
        >
          {EQUIPMENT_FILTERS.map((eq) => (
            <option key={eq} value={eq}>{eq}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {SOURCE_OPTIONS.map((src) => (
            <button
              key={src.id}
              type="button"
              onClick={() => toggleSource(src.id)}
              style={{
                ...ghostBtn,
                padding: '6px 10px',
                border: `1px solid ${activeSources.includes(src.id) ? (t.accent || '#3b82f6') : t.border}`,
                background: activeSources.includes(src.id) ? `${t.accent || '#3b82f6'}22` : t.bgAlt,
                color: activeSources.includes(src.id) ? (t.accent || '#3b82f6') : t.textSecondary,
              }}
            >
              {src.label}
            </button>
          ))}
        </div>
        <button type="button" style={ghostBtn} onClick={fetchAll}>Refresh</button>
      </div>

      {/* Table + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedLoad ? '2fr 1fr' : '1fr', gap: 16 }}>
        <div style={cardStyle}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: t.textSecondary }}>Loading loads from all sources...</div>
          ) : error ? (
            <div style={{ padding: 24, color: '#ef4444' }}>{error}</div>
          ) : allLoads.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: t.textSecondary }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No loads found</div>
              <div style={{ fontSize: 12 }}>Adjust filters or enable more sources.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Source</th>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Lane</th>
                    <th style={thStyle}>Equipment</th>
                    <th style={thStyle}>Miles</th>
                    <th style={thStyle}>Rate</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {allLoads.map((load) => (
                    <tr
                      key={`${load.source}-${load.id}`}
                      onClick={() => setSelectedLoad(selectedLoad?.id === load.id && selectedLoad?.source === load.source ? null : load)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedLoad?.id === load.id && selectedLoad?.source === load.source ? t.bgAlt : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.bgAlt; }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          selectedLoad?.id === load.id && selectedLoad?.source === load.source ? t.bgAlt : 'transparent';
                      }}
                    >
                      <td style={tdStyle}><SourceBadge source={load.source} theme={t} /></td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{load.id}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{load.origin?.city || '—'}{load.origin?.state ? `, ${load.origin.state}` : ''}</div>
                        <div style={{ fontSize: 11, color: t.textSecondary }}>→ {load.destination?.city || '—'}{load.destination?.state ? `, ${load.destination.state}` : ''}</div>
                      </td>
                      <td style={tdStyle}>{load.equipment || '—'}</td>
                      <td style={tdStyle}>{Number(load.miles || 0).toLocaleString()}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#10b981' }}>{load.rate || '—'}</td>
                      <td style={tdStyle}><LoadStatusBadge status={load.status || 'DRAFT'} size="sm" /></td>
                      <td style={{ ...tdStyle, fontSize: 11, color: t.textSecondary }}>{load.postedAt ? new Date(load.postedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedLoad && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selectedLoad.id}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <SourceBadge source={selectedLoad.source} theme={t} />
                    <LoadStatusBadge status={selectedLoad.status || 'DRAFT'} size="sm" />
                  </div>
                </div>
                <button onClick={() => { setSelectedLoad(null); setBidMessage(''); }} style={{ background: 'none', border: 'none', color: t.textSecondary, cursor: 'pointer', fontSize: 18 }} aria-label="Close detail">×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                {[
                  ['Origin', `${selectedLoad.origin?.city || '—'}${selectedLoad.origin?.state ? `, ${selectedLoad.origin.state}` : ''}`],
                  ['Destination', `${selectedLoad.destination?.city || '—'}${selectedLoad.destination?.state ? `, ${selectedLoad.destination.state}` : ''}`],
                  ['Miles', `${Number(selectedLoad.miles || 0).toLocaleString()} mi`],
                  ['Equipment', selectedLoad.equipment || '—'],
                  ['Weight', selectedLoad.weight || '—'],
                  ['Commodity', selectedLoad.commodity || selectedLoad.customer?.name || '—'],
                  ['Rate', selectedLoad.rate || '—'],
                  ['Contact', selectedLoad.contact || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: t.textSecondary }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Carrier Bid Form (internal loads — tracked feature) ── */}
            {selectedLoad.source === 'internal' ? (
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🏷️ Place Carrier Bid
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input
                      value={bidForm.carrierName}
                      onChange={(e) => setBidForm(p => ({ ...p, carrierName: e.target.value }))}
                      placeholder="Carrier name *"
                      style={inputStyle}
                    />
                    <input
                      value={bidForm.mcNumber}
                      onChange={(e) => setBidForm(p => ({ ...p, mcNumber: e.target.value }))}
                      placeholder="MC# (optional)"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input
                      type="number"
                      value={bidForm.amount}
                      onChange={(e) => setBidForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="Bid amount ($) *"
                      style={inputStyle}
                      min="1"
                    />
                    <input
                      type="number"
                      value={bidForm.transitDays}
                      onChange={(e) => setBidForm(p => ({ ...p, transitDays: e.target.value }))}
                      placeholder="Transit days"
                      style={inputStyle}
                      min="1"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <select
                      value={bidForm.bidderRole}
                      onChange={(e) => setBidForm(p => ({ ...p, bidderRole: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="carrier_rep">Carrier Rep</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="broker">Broker</option>
                    </select>
                    <input
                      value={bidForm.bidderName}
                      onChange={(e) => setBidForm(p => ({ ...p, bidderName: e.target.value }))}
                      placeholder="Your name"
                      style={inputStyle}
                    />
                  </div>
                  <input
                    value={bidForm.equipment}
                    onChange={(e) => setBidForm(p => ({ ...p, equipment: e.target.value }))}
                    placeholder="Equipment offered (e.g. 53' Dry Van)"
                    style={inputStyle}
                  />
                  <textarea
                    value={bidForm.notes}
                    onChange={(e) => setBidForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes for broker (availability, conditions, etc.)"
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={handlePlaceCarrierBid}
                    disabled={bidWorking || !bidForm.carrierName || !bidForm.amount}
                    style={{
                      padding: '10px 16px', borderRadius: 6, border: 'none',
                      backgroundColor: bidWorking || !bidForm.carrierName || !bidForm.amount ? t.border : (t.accent || '#3b82f6'),
                      color: bidWorking || !bidForm.carrierName || !bidForm.amount ? t.textSecondary : '#fff',
                      cursor: bidWorking || !bidForm.carrierName || !bidForm.amount ? 'not-allowed' : 'pointer',
                      fontWeight: 700, fontSize: 13,
                    }}
                  >
                    {bidWorking ? 'Submitting...' : 'Submit Carrier Bid'}
                  </button>
                </div>
                {bidMessage && (
                  <div style={{ marginTop: 8, fontSize: 12, color: bidMessage.toLowerCase().includes('error') || bidMessage.toLowerCase().includes('fail') || bidMessage.toLowerCase().includes('required') ? '#ef4444' : '#10b981' }}>
                    {bidMessage}
                  </div>
                )}
              </div>
            ) : (
              /* External loads: simple bid form */
              <div style={cardStyle}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Place Bid</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Your bid ($)"
                    style={{ ...inputStyle, flex: 1 }}
                    min="1"
                  />
                  <button
                    onClick={handlePlaceBid}
                    disabled={bidWorking || !bidAmount}
                    style={{
                      padding: '8px 16px', borderRadius: 6, border: 'none',
                      backgroundColor: bidWorking || !bidAmount ? t.border : (t.accent || '#3b82f6'),
                      color: bidWorking || !bidAmount ? t.textSecondary : '#fff',
                      cursor: bidWorking || !bidAmount ? 'not-allowed' : 'pointer',
                      fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
                    }}
                  >
                    {bidWorking ? 'Placing...' : 'Submit Bid'}
                  </button>
                </div>
                {bidMessage && (
                  <div style={{ marginTop: 8, fontSize: 12, color: bidMessage.toLowerCase().includes('error') || bidMessage.toLowerCase().includes('fail') ? '#ef4444' : '#10b981' }}>
                    {bidMessage}
                  </div>
                )}
              </div>
            )}

            {/* ── Tracked Bids List (internal loads only) ── */}
            {selectedLoad.source === 'internal' && (
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📊 Carrier Bids ({loadBids.length})</span>
                  <button onClick={() => fetchBids(selectedLoad.id)} style={{ ...ghostBtn, fontSize: 11, padding: '4px 8px' }}>Refresh</button>
                </div>
                {bidsLoading ? (
                  <div style={{ padding: 12, textAlign: 'center', color: t.textSecondary, fontSize: 12 }}>Loading bids...</div>
                ) : loadBids.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: t.textSecondary, fontSize: 12 }}>
                    No bids yet. Dispatchers and carrier reps can submit bids above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {loadBids.map((bid) => {
                      const statusColor = bid.status === 'accepted' ? '#10b981' : bid.status === 'declined' ? '#ef4444' : '#f59e0b';
                      return (
                        <div key={bid.id} style={{
                          border: `1px solid ${bid.status === 'accepted' ? '#10b98140' : t.border}`,
                          borderRadius: 8, padding: 12,
                          background: bid.status === 'accepted' ? '#10b98108' : t.bg,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{bid.carrierName}</span>
                              {bid.mcNumber && <span style={{ fontSize: 11, color: t.textSecondary }}>MC# {bid.mcNumber}</span>}
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 800, color: statusColor }}>
                              ${Number(bid.amount || 0).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: t.textSecondary, marginBottom: 6 }}>
                            <span>👤 {bid.bidderName || '—'} ({bid.bidderRole === 'carrier_rep' ? 'Carrier Rep' : bid.bidderRole === 'dispatcher' ? 'Dispatcher' : 'Broker'})</span>
                            {bid.transitDays && <span>🕐 {bid.transitDays}d transit</span>}
                            {bid.equipment && <span>🚛 {bid.equipment}</span>}
                          </div>
                          {bid.notes && <div style={{ fontSize: 11, color: t.textSecondary, fontStyle: 'italic', marginBottom: 6 }}>"{bid.notes}"</div>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                              backgroundColor: `${statusColor}18`, color: statusColor, textTransform: 'uppercase',
                            }}>
                              {bid.status}
                            </span>
                            {bid.status === 'pending' && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => handleAcceptBid(bid)}
                                  disabled={Boolean(bidActionBusy)}
                                  style={{
                                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                                    border: '1px solid #10b981', background: '#10b981', color: '#fff', cursor: 'pointer',
                                  }}
                                >
                                  {bidActionBusy === bid.id ? '...' : '✓ Accept'}
                                </button>
                                <button
                                  onClick={() => handleDeclineBid(bid)}
                                  disabled={Boolean(bidActionBusy)}
                                  style={{
                                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                                    border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer',
                                  }}
                                >
                                  {bidActionBusy === bid.id ? '...' : '✗ Decline'}
                                </button>
                              </div>
                            )}
                            <span style={{ fontSize: 10, color: t.textSecondary }}>{bid.createdAt ? new Date(bid.createdAt).toLocaleString() : ''}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
