import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const FALLBACK_QUEUE = [
  { id: 'veh-103', unitNumber: 'T-103', driverName: 'John Smith', nextServiceMiles: -120, status: 'breakdown' },
  { id: 'veh-106', unitNumber: 'T-106', driverName: 'Alex Miller', nextServiceMiles: -460, status: 'maintenance' },
  { id: 'veh-102', unitNumber: 'T-102', driverName: 'Sarah Lee', nextServiceMiles: 680, status: 'idle' },
  { id: 'veh-101', unitNumber: 'T-101', driverName: 'Alex Miller', nextServiceMiles: 1200, status: 'active' },
];

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default function MaintenanceQueueProfile() {
  const { theme } = useTheme();
  const t = theme || {};

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('loading');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setLoading(true);
      try {
        const [vehiclesRes, driversRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/drivers'),
        ]);

        if (!vehiclesRes.ok || !driversRes.ok) {
          throw new Error('maintenance api unavailable');
        }

        const [vehiclesApi, driversApi] = await Promise.all([
          vehiclesRes.json(),
          driversRes.json(),
        ]);

        const driverNameById = (Array.isArray(driversApi) ? driversApi : []).reduce((acc, driver) => {
          acc[String(driver._id)] = String(driver.name || 'Unassigned');
          return acc;
        }, {});

        const normalized = (Array.isArray(vehiclesApi) ? vehiclesApi : []).map((vehicle, index) => {
          const nextServiceMiles = Number.isFinite(Number(vehicle.nextServiceMiles)) ? Number(vehicle.nextServiceMiles) : 1400 - (index * 220);
          const maintenanceAlerts = nextServiceMiles < 0 ? 2 : nextServiceMiles < 800 ? 1 : 0;
          const downtimeCostPerDay = maintenanceAlerts > 1 ? 620 : maintenanceAlerts > 0 ? 390 : 210;

          return {
            id: String(vehicle._id || `veh-${index}`),
            unitNumber: String(vehicle.unitNumber || `T-${100 + index}`),
            driverName: driverNameById[String(vehicle.driverId || '')] || 'Unassigned',
            status: String(vehicle.status || 'active').toLowerCase(),
            nextServiceMiles,
            maintenanceAlerts,
            downtimeCostPerDay,
            severity: nextServiceMiles < 0 ? 'critical' : nextServiceMiles < 800 ? 'warning' : 'normal',
          };
        });

        if (active) {
          setRows(normalized.length ? normalized : FALLBACK_QUEUE.map((entry) => ({
            ...entry,
            maintenanceAlerts: entry.nextServiceMiles < 0 ? 2 : entry.nextServiceMiles < 800 ? 1 : 0,
            downtimeCostPerDay: entry.nextServiceMiles < 0 ? 620 : entry.nextServiceMiles < 800 ? 390 : 210,
            severity: entry.nextServiceMiles < 0 ? 'critical' : entry.nextServiceMiles < 800 ? 'warning' : 'normal',
          })));
          setSource('api');
        }
      } catch {
        if (active) {
          setRows(FALLBACK_QUEUE.map((entry) => ({
            ...entry,
            maintenanceAlerts: entry.nextServiceMiles < 0 ? 2 : entry.nextServiceMiles < 800 ? 1 : 0,
            downtimeCostPerDay: entry.nextServiceMiles < 0 ? 620 : entry.nextServiceMiles < 800 ? 390 : 210,
            severity: entry.nextServiceMiles < 0 ? 'critical' : entry.nextServiceMiles < 800 ? 'warning' : 'normal',
          })));
          setSource('fallback');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => a.nextServiceMiles - b.nextServiceMiles);
    if (filter === 'critical') return sorted.filter((row) => row.nextServiceMiles < 0);
    if (filter === 'warning') return sorted.filter((row) => row.nextServiceMiles >= 0 && row.nextServiceMiles < 800);
    return sorted;
  }, [rows, filter]);

  const totalDowntimeRisk = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + Number(row.downtimeCostPerDay || 0), 0);
  }, [filteredRows]);

  if (loading) {
    return <div style={{ color: t.textSecondary, padding: 24 }}>Loading maintenance queue profile...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            <Link to="/fleet" style={{ color: t.textSecondary, textDecoration: 'none' }}>Fleet Dashboard</Link>
            <span>  ›  </span>
            <strong style={{ color: t.text }}>Maintenance Queue Profile</strong>
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Maintenance Queue Profile</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Source: {source === 'api' ? 'Live API' : 'Fallback data'} • Prioritized maintenance pipeline with downtime impact</div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'critical', 'warning'].map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setFilter(entry)}
              style={{ borderRadius: 8, border: `1px solid ${filter === entry ? t.accent : t.border}`, background: t.bgAlt, color: t.text, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      <section style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: t.surface, padding: 12, display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 13, color: t.textSecondary }}>Total downtime cost/day (filtered): <strong style={{ color: t.text }}>{formatMoney(totalDowntimeRisk)}</strong></div>
        {filteredRows.map((row) => (
          <div key={row.id} style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, padding: 10, display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <strong>{row.unitNumber} • {row.driverName}</strong>
              <span style={{ fontSize: 12, color: row.severity === 'critical' ? t.error : row.severity === 'warning' ? t.warning : t.success }}>
                {row.severity.toUpperCase()} • {row.status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, fontSize: 12 }}>
              <div>Service due: <strong>{row.nextServiceMiles}</strong> miles</div>
              <div>Alerts: <strong>{row.maintenanceAlerts}</strong></div>
              <div>Downtime/day: <strong>{formatMoney(row.downtimeCostPerDay)}</strong></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={{ borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: t.text, padding: '5px 9px', cursor: 'pointer', fontSize: 12 }}>
                Create service order
              </button>
              <button type="button" style={{ borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: t.text, padding: '5px 9px', cursor: 'pointer', fontSize: 12 }}>
                Notify dispatch
              </button>
            </div>
          </div>
        ))}
        {filteredRows.length === 0 ? <div style={{ color: t.textSecondary, fontSize: 12 }}>No maintenance rows for this filter.</div> : null}
      </section>
    </div>
  );
}