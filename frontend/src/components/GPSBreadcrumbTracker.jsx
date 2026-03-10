import { useEffect, useMemo, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import {
  getLoadTracker,
  listTrackedLoads,
  pingLoadTracker,
  resetLoadTracker,
  startLoadTracker,
  stopLoadTracker,
} from '../api/trackerClient';

const BASE_ROUTE = [
  { x: 8, y: 78 },
  { x: 14, y: 74 },
  { x: 21, y: 71 },
  { x: 27, y: 66 },
  { x: 33, y: 63 },
  { x: 39, y: 60 },
  { x: 46, y: 57 },
  { x: 52, y: 54 },
  { x: 59, y: 50 },
  { x: 65, y: 46 },
  { x: 71, y: 42 },
  { x: 77, y: 37 },
  { x: 84, y: 31 },
  { x: 90, y: 25 },
  { x: 96, y: 18 },
];

function interpolateRoute(points, stepsPerSegment = 3) {
  const route = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    for (let s = 0; s < stepsPerSegment; s += 1) {
      const t = s / stepsPerSegment;
      route.push({
        x: Number((start.x + ((end.x - start.x) * t)).toFixed(2)),
        y: Number((start.y + ((end.y - start.y) * t)).toFixed(2)),
      });
    }
  }
  route.push(points[points.length - 1]);
  return route;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GPSBreadcrumbTracker() {
  const { theme } = useTheme();
  const t = theme;

  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('407-934-7639');
  const [loadId, setLoadId] = useState('14032');
  const [outgoingMessage, setOutgoingMessage] = useState('Hello driver. Your status on load {{loadId}} is being requested via breadcrumb tracking. Please tap the secure link.');
  const [oneTimePing, setOneTimePing] = useState(false);
  const [pingInterval, setPingInterval] = useState(15);
  const [active, setActive] = useState(false);
  const [routeIndex, setRouteIndex] = useState(0);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [serverRoute, setServerRoute] = useState([]);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [trackedLoads, setTrackedLoads] = useState([]);
  const [historyLoadId, setHistoryLoadId] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [replayActive, setReplayActive] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1);

  const route = useMemo(() => interpolateRoute(BASE_ROUTE, 4), []);

  const effectiveRoute = serverRoute.length ? serverRoute : route;

  const liveTrail = useMemo(() => {
    if (breadcrumbs.length) return breadcrumbs;
    return effectiveRoute.slice(0, Math.max(2, routeIndex + 1));
  }, [breadcrumbs, effectiveRoute, routeIndex]);
  const replayTrail = useMemo(() => {
    if (!replayActive) return liveTrail;
    return liveTrail.slice(0, Math.max(1, replayIndex + 1));
  }, [liveTrail, replayActive, replayIndex]);

  const currentPoint = replayTrail[replayTrail.length - 1] || route[0];

  const hydrateFromTracking = (tracking) => {
    if (!tracking) return;
    setDriverName(String(tracking.driverName || ''));
    setDriverPhone(String(tracking.driverPhone || driverPhone || ''));
    setOutgoingMessage(String(tracking.outgoingMessage || outgoingMessage || ''));
    setOneTimePing(Boolean(tracking.oneTimePing));
    setPingInterval(Number(tracking.pingInterval || 15));
    setActive(Boolean(tracking.active));
    setRouteIndex(Number(tracking.routeIndex || 0));
    setServerRoute(Array.isArray(tracking.route) ? tracking.route : []);
    setBreadcrumbs(Array.isArray(tracking.breadcrumbs) ? tracking.breadcrumbs : []);
    setEvents(
      Array.isArray(tracking.events)
        ? tracking.events.map((eventItem, index) => ({
          id: eventItem.id || `evt-${index}`,
          when: eventItem.timestamp ? new Date(eventItem.timestamp) : new Date(),
          text: eventItem.text || 'Tracker event',
        }))
        : []
    );
    setReplayActive(false);
    setReplayIndex(0);
  };

  const refreshTrackedLoads = async (q = historyQuery) => {
    const result = await listTrackedLoads({ q, includeInactive: true });
    if (result?.error) return;
    const items = Array.isArray(result?.items) ? result.items : [];
    setTrackedLoads(items);
    setHistoryLoadId((previous) => previous || items[0]?.loadId || '');
  };

  useEffect(() => {
    refreshTrackedLoads('');
  }, []);

  useEffect(() => {
    let activeRequest = true;
    const loadTracker = async () => {
      const normalizedLoadId = String(loadId || '').trim();
      if (!normalizedLoadId) return;
      const result = await getLoadTracker(normalizedLoadId);
      if (!activeRequest) return;
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      hydrateFromTracking(result?.tracking);
      setMessage('');
    };

    loadTracker();
    return () => {
      activeRequest = false;
    };
  }, [loadId]);

  useEffect(() => {
    if (!replayActive) return undefined;
    const replayTickMs = Math.max(120, Math.floor(420 / Math.max(0.5, replaySpeed)));
    const timer = window.setInterval(() => {
      setReplayIndex((current) => {
        if (current >= Math.max(0, liveTrail.length - 1)) {
          setReplayActive(false);
          return current;
        }
        return current + 1;
      });
    }, replayTickMs);

    return () => window.clearInterval(timer);
  }, [replayActive, liveTrail.length, replaySpeed]);

  useEffect(() => {
    if (!active) return undefined;

    const timer = window.setInterval(() => {
      const runPing = async () => {
        const normalizedLoadId = String(loadId || '').trim();
        if (!normalizedLoadId) return;
        const result = await pingLoadTracker(normalizedLoadId);
        if (result?.error) {
          setMessage(result.error);
          setActive(false);
          return;
        }
        hydrateFromTracking(result?.tracking);
        setMessage('');
      };
      runPing();
    }, oneTimePing ? 3000 : Math.max(2000, pingInterval * 500));

    return () => window.clearInterval(timer);
  }, [active, loadId, oneTimePing, pingInterval]);

  const polyline = liveTrail.map((point) => `${point.x},${point.y}`).join(' ');

  const headerCard = {
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    background: t.surface,
    padding: 10,
  };

  const inputStyle = {
    minHeight: 34,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '7px 10px',
    fontSize: 12,
  };

  const buttonStyle = {
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  };

  const startButtonStyle = {
    ...buttonStyle,
    border: `1px solid ${t.accent}`,
    background: active ? t.error : t.accent,
    color: '#fff',
    minWidth: 120,
  };

  return (
    <section style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: t.surface, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: t.accent }}>Load Tracker</div>
        <div style={{ fontSize: 12, color: t.textSecondary }}>Track any load, anytime, anywhere with free scheduled or one-time pings</div>
      </div>

      <div style={{ padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <div style={headerCard}>
            <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>Driver Name</div>
            <input value={driverName} onChange={(event) => setDriverName(event.target.value)} placeholder="e.g. Orion" style={{ ...inputStyle, width: '100%' }} />
          </div>
          <div style={headerCard}>
            <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>Driver Mobile Number</div>
            <input value={driverPhone} onChange={(event) => setDriverPhone(event.target.value)} placeholder="e.g. 407-934-7639" style={{ ...inputStyle, width: '100%' }} />
          </div>
          <div style={headerCard}>
            <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>Load ID</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={loadId} onChange={(event) => setLoadId(event.target.value)} placeholder="e.g. 14032" style={{ ...inputStyle, width: '100%' }} />
              <button
                type="button"
                style={startButtonStyle}
                disabled={busy}
                onClick={async () => {
                  const normalizedLoadId = String(loadId || '').trim();
                  if (!normalizedLoadId) {
                    setMessage('Load ID is required.');
                    return;
                  }

                  setBusy(true);
                  if (active) {
                    const stopResult = await stopLoadTracker(normalizedLoadId);
                    setBusy(false);
                    if (stopResult?.error) {
                      setMessage(stopResult.error);
                      return;
                    }
                    hydrateFromTracking(stopResult?.tracking);
                    setMessage('Tracking stopped.');
                    refreshTrackedLoads();
                    return;
                  }

                  const startResult = await startLoadTracker(normalizedLoadId, {
                    driverName,
                    driverPhone,
                    outgoingMessage,
                    oneTimePing,
                    pingInterval,
                  });
                  setBusy(false);
                  if (startResult?.error) {
                    setMessage(startResult.error);
                    return;
                  }

                  hydrateFromTracking(startResult?.tracking);
                  setMessage('Tracking started and persisted to backend.');
                  refreshTrackedLoads();
                }}
              >
                {active ? 'Stop Tracking' : "Let's go!"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ ...headerCard, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Historical Load Selector</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Search load history"
                style={{ ...inputStyle, minHeight: 30 }}
              />
              <button
                type="button"
                style={buttonStyle}
                onClick={() => refreshTrackedLoads(historyQuery)}
              >
                Refresh
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={historyLoadId} onChange={(event) => setHistoryLoadId(event.target.value)} style={{ ...inputStyle, minWidth: 260 }}>
              {trackedLoads.map((item) => (
                <option key={item.loadId} value={item.loadId}>
                  {item.loadId} • {item.driverName || 'Unassigned'} • {item.breadcrumbsCount} breadcrumbs • {item.active ? 'Active' : 'Archived'}
                </option>
              ))}
              {trackedLoads.length === 0 && <option value="">No tracked loads</option>}
            </select>
            <button
              type="button"
              style={buttonStyle}
              disabled={!historyLoadId}
              onClick={async () => {
                if (!historyLoadId) return;
                setBusy(true);
                const result = await getLoadTracker(historyLoadId);
                setBusy(false);
                if (result?.error) {
                  setMessage(result.error);
                  return;
                }
                setLoadId(historyLoadId);
                hydrateFromTracking(result?.tracking);
                setMessage(`Loaded historical tracker for ${historyLoadId}.`);
              }}
            >
              Open Selected
            </button>
            <button
              type="button"
              style={buttonStyle}
              disabled={liveTrail.length < 2}
              onClick={() => {
                setReplayActive(true);
                setReplayIndex(0);
                setMessage(`Replay started for ${loadId || historyLoadId || 'selected load'}.`);
              }}
            >
              Replay Trail
            </button>
            <button
              type="button"
              style={buttonStyle}
              disabled={!replayActive}
              onClick={() => setReplayActive(false)}
            >
              Pause Replay
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.textSecondary }}>
              Replay speed
              <select
                value={replaySpeed}
                onChange={(event) => setReplaySpeed(Number(event.target.value))}
                style={{ ...inputStyle, minHeight: 30, padding: '4px 8px' }}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textSecondary }}>
              <span>Timeline scrubber</span>
              <span>
                {liveTrail.length > 0 ? replayIndex + 1 : 0}/{Math.max(1, liveTrail.length)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, liveTrail.length - 1)}
              value={Math.min(replayIndex, Math.max(0, liveTrail.length - 1))}
              onChange={(event) => {
                const nextIndex = Number(event.target.value);
                setReplayIndex(nextIndex);
              }}
              style={{ width: '100%' }}
              disabled={liveTrail.length < 2}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 10 }}>
          <div style={{ ...headerCard, display: 'grid', gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>Outgoing Message</div>
              <textarea
                rows={3}
                value={outgoingMessage}
                onChange={(event) => setOutgoingMessage(event.target.value)}
                style={{ ...inputStyle, width: '100%', resize: 'vertical', minHeight: 72 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>Message Preview</div>
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, padding: 8, fontSize: 12, color: t.textSecondary }}>
                {outgoingMessage.replace(/\{\{loadId\}\}/g, loadId || 'N/A')}
                {' '}
                <span style={{ color: t.accent }}>http://tracker.local/ping/{loadId || 'N/A'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.textSecondary }}>
                <input type="checkbox" checked={oneTimePing} onChange={(event) => setOneTimePing(event.target.checked)} />
                One-time ping
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.textSecondary }}>
                Breadcrumb interval
                <select value={pingInterval} onChange={(event) => setPingInterval(Number(event.target.value))} style={{ ...inputStyle, minHeight: 28, padding: '4px 8px' }} disabled={oneTimePing}>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              </label>
              <button
                type="button"
                style={buttonStyle}
                disabled={busy}
                onClick={async () => {
                  const normalizedLoadId = String(loadId || '').trim();
                  if (!normalizedLoadId) {
                    setMessage('Load ID is required.');
                    return;
                  }
                  setBusy(true);
                  const result = await resetLoadTracker(normalizedLoadId);
                  setBusy(false);
                  if (result?.error) {
                    setMessage(result.error);
                    return;
                  }
                  hydrateFromTracking(result?.tracking);
                  setMessage('Tracking reset.');
                  refreshTrackedLoads();
                }}
              >
                Reset Route
              </button>
            </div>
            {message && <div style={{ fontSize: 11, color: t.textSecondary }}>{message}</div>}
          </div>

          <aside style={{ ...headerCard, minHeight: 130 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Recent Events</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {events.length === 0 && <div style={{ fontSize: 12, color: t.textSecondary }}>No events yet.</div>}
              {events.map((eventItem) => (
                <div key={eventItem.id} style={{ border: `1px solid ${t.border}`, borderRadius: 6, background: t.bgAlt, padding: 6 }}>
                  <div style={{ fontSize: 10, color: t.textSecondary }}>{formatTime(eventItem.when)}</div>
                  <div style={{ fontSize: 11 }}>{eventItem.text}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden', background: t.bgAlt }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 320 }}>
            <div
              style={{
                position: 'relative',
                background:
                  `linear-gradient(180deg, ${t.bgAlt} 0%, ${t.surfaceStrong} 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 28px), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 28px)`,
              }}
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <polyline points={effectiveRoute.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={t.border} strokeWidth="1.2" strokeDasharray="1.8 1.8" />
                <polyline points={polyline} fill="none" stroke={t.accent} strokeWidth="2.2" />
                {replayTrail.map((point, index) => {
                  const isCurrent = index === replayTrail.length - 1;
                  const isWarning = index % 9 === 0 && index !== 0;
                  const dotColor = isCurrent ? t.accent : isWarning ? t.error : t.success;
                  const dotSize = isCurrent ? 1.8 : 1.2;
                  return <circle key={`dot-${index}-${point.x}-${point.y}`} cx={point.x} cy={point.y} r={dotSize} fill={dotColor} opacity={isCurrent ? 1 : 0.85} />;
                })}
              </svg>
            </div>

            <aside style={{ borderLeft: `1px solid ${t.border}`, padding: 10, display: 'grid', gap: 8, alignContent: 'start', background: t.surface }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Live Tracking Status</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Driver: {driverName || 'Unknown Driver'}</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Phone: {driverPhone || 'N/A'}</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Load: {loadId || 'N/A'}</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Tracking mode: {oneTimePing ? 'One-time ping' : `Breadcrumb every ${pingInterval} min`}</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Current point: {currentPoint.x.toFixed(2)}%, {currentPoint.y.toFixed(2)}%</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Breadcrumbs captured: {liveTrail.length}</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>
                Replay: {replayActive ? `Playing ${replaySpeed}x (${replayIndex + 1}/${Math.max(1, liveTrail.length)})` : `Paused (${replayIndex + 1}/${Math.max(1, liveTrail.length)})`}
              </div>
              <div style={{ fontSize: 12, color: active ? t.success : t.warning, fontWeight: 700 }}>{active ? 'Tracking Active' : 'Tracking Idle'}</div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
