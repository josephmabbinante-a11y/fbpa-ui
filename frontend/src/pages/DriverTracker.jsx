import { useEffect, useMemo, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import {
  addTrackerCredits,
  getTrackerCredits,
  getTrackerEvents,
  getTrackerPositions,
  sendTrackerMessage,
} from '../api/client';

function toMapUrl(position) {
  if (!position) {
    return 'https://www.openstreetmap.org/export/embed.html?bbox=-130%2C20%2C-60%2C55&layer=mapnik';
  }
  const lat = Number(position.lat || 39.5);
  const lng = Number(position.lng || -98.35);
  const left = (lng - 5).toFixed(5);
  const right = (lng + 5).toFixed(5);
  const bottom = (lat - 3).toFixed(5);
  const top = (lat + 3).toFixed(5);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default function DriverTracker() {
  const { theme } = useTheme();
  const t = theme;

  const [credits, setCredits] = useState(0);
  const [phone, setPhone] = useState('4079347639');
  const [driverName, setDriverName] = useState('');
  const [loadRef, setLoadRef] = useState('12345');
  const [events, setEvents] = useState([]);
  const [positions, setPositions] = useState([]);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const outgoingMessage = useMemo(
    () => `Hello! Your status on load ${loadRef || 'N/A'} is being requested via Opscale Tracker.`,
    [loadRef]
  );

  const fetchCredits = async () => {
    const res = await getTrackerCredits();
    if (!res?.error) setCredits(Number(res.remainingCredits || 0));
  };

  const fetchHistory = async (phoneValue) => {
    const [eventsRes, positionsRes] = await Promise.all([
      getTrackerEvents(phoneValue),
      getTrackerPositions(phoneValue),
    ]);
    if (!eventsRes?.error) setEvents(Array.isArray(eventsRes.events) ? eventsRes.events : []);
    if (!positionsRes?.error) setPositions(Array.isArray(positionsRes.positions) ? positionsRes.positions : []);
  };

  useEffect(() => {
    fetchCredits();
    fetchHistory(phone);
  }, []);

  const onSend = async () => {
    setSending(true);
    setStatus('');
    const res = await sendTrackerMessage({
      phone,
      driverName,
      loadRef,
      message: outgoingMessage,
    });
    setSending(false);

    if (res?.error) {
      setStatus(`Send failed: ${res.error}`);
      return;
    }

    setCredits(Number(res.remainingCredits || 0));
    setStatus('Tracker message sent successfully. 1 credit used.');
    fetchHistory(phone);
  };

  const onAddCredits = async () => {
    const res = await addTrackerCredits(100);
    if (res?.error) {
      setStatus(`Could not add credits: ${res.error}`);
      return;
    }
    setCredits(Number(res.remainingCredits || 0));
    setStatus('Added 100 tracker credits.');
  };

  const cardStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    boxShadow: '0 8px 20px rgba(0,0,0,0.14)',
  };

  const inputStyle = {
    width: '100%',
    minHeight: 36,
    borderRadius: 8,
    border: `1px solid ${t.accent2}`,
    background: `linear-gradient(180deg, ${t.bgAlt}, ${t.surface})`,
    color: t.text,
    padding: '8px 10px',
    fontSize: 13,
  };

  const recentPosition = positions.length ? positions[positions.length - 1] : null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Driver Track and Trace</h1>
          <div style={{ color: t.textSecondary, fontSize: 12 }}>SMS tracker with credit controls</div>
        </div>
        <button
          type="button"
          onClick={onAddCredits}
          style={{
            border: `1px solid ${t.accent2}`,
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
            color: t.bg,
            borderRadius: 10,
            fontWeight: 700,
            padding: '9px 12px',
            cursor: 'pointer',
          }}
        >
          Add Credits
        </button>
      </div>

      <div
        style={{
          ...cardStyle,
          padding: '10px 12px',
          color: t.text,
          borderColor: t.success,
          background: `linear-gradient(120deg, ${t.surface}, rgba(16,185,129,0.18))`,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        You have {credits.toLocaleString()} credits remaining.
      </div>

      <section style={{ ...cardStyle, padding: 12, display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: t.textSecondary, fontSize: 12 }}>Driver's Mobile Number</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="e.g. 4079347639" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: t.textSecondary, fontSize: 12 }}>Driver's First Name</span>
            <input value={driverName} onChange={(e) => setDriverName(e.target.value)} style={inputStyle} placeholder="Optional" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: t.textSecondary, fontSize: 12 }}>Load Reference</span>
            <input value={loadRef} onChange={(e) => setLoadRef(e.target.value)} style={inputStyle} placeholder="Load #" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: t.textSecondary, fontSize: 12 }}>Outgoing Message</span>
            <input value={outgoingMessage} readOnly style={inputStyle} />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ color: t.textSecondary, fontSize: 12 }}>This message will use 1 credit.</div>
          <button
            type="button"
            onClick={onSend}
            disabled={sending || !phone}
            style={{
              border: `1px solid ${t.success}`,
              background: t.success,
              color: '#052015',
              borderRadius: 8,
              fontWeight: 700,
              padding: '9px 14px',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>

        {status && <div style={{ fontSize: 12, color: status.includes('failed') ? t.error : t.textSecondary }}>{status}</div>}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 12 }}>
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <iframe
            title="Tracker Map"
            src={toMapUrl(recentPosition)}
            style={{ border: 0, width: '100%', height: 420 }}
            loading="lazy"
          />
          <div style={{ borderTop: `1px solid ${t.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <button type="button" style={{ ...inputStyle, border: 'none', borderRadius: 0 }}>Zoom to last position</button>
            <button type="button" style={{ ...inputStyle, border: 'none', borderRadius: 0 }}>Show all positions</button>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 10, display: 'grid', gap: 8, maxHeight: 468, overflow: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Recent Events</div>
          {events.length === 0 && (
            <div style={{ color: t.textSecondary, fontSize: 12 }}>
              Last tracker events for this phone appear here.
            </div>
          )}
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: 8,
                background: t.bgAlt,
                display: 'grid',
                gap: 4,
              }}
            >
              <div style={{ fontSize: 12, color: t.textSecondary }}>
                {new Date(event.timestamp).toLocaleString()} • {event.type}
              </div>
              <div style={{ fontSize: 13 }}>{event.message}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
