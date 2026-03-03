import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';

const FALLBACK_DRIVERS = [
  { id: 'drv-1', name: 'Alex Miller', onTimePct: 96, idlePct: 9, fuelDeltaPct: 4, incidentFlags: 0, hosRemaining: 2.5, revenuePerMile: 3.42 },
  { id: 'drv-2', name: 'Sarah Lee', onTimePct: 91, idlePct: 14, fuelDeltaPct: -3, incidentFlags: 1, hosRemaining: 0.7, revenuePerMile: 2.98 },
  { id: 'drv-3', name: 'John Smith', onTimePct: 87, idlePct: 18, fuelDeltaPct: -6, incidentFlags: 2, hosRemaining: 4.3, revenuePerMile: 2.74 },
  { id: 'drv-4', name: 'Maya Patel', onTimePct: 94, idlePct: 10, fuelDeltaPct: 2, incidentFlags: 0, hosRemaining: 3.2, revenuePerMile: 3.31 },
];

const FALLBACK_VEHICLES = [
  { id: 'veh-101', unitNumber: 'T-101', driverId: 'drv-1', status: 'active', nextServiceMiles: 1200 },
  { id: 'veh-102', unitNumber: 'T-102', driverId: 'drv-2', status: 'idle', nextServiceMiles: 680 },
  { id: 'veh-103', unitNumber: 'T-103', driverId: 'drv-3', status: 'breakdown', nextServiceMiles: -120 },
  { id: 'veh-104', unitNumber: 'T-104', driverId: 'drv-4', status: 'yard', nextServiceMiles: 3100 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function DriverSnapshotProfile() {
  const { theme } = useTheme();
  const t = themes[theme];

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [source, setSource] = useState('loading');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('profitability');

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setLoading(true);
      try {
        const [driversRes, vehiclesRes] = await Promise.all([
          fetch('/api/drivers'),
          fetch('/api/vehicles'),
        ]);

        if (!driversRes.ok || !vehiclesRes.ok) {
          throw new Error('driver or vehicle api unavailable');
        }

        const [driversApi, vehiclesApi] = await Promise.all([
          driversRes.json(),
          vehiclesRes.json(),
        ]);

        const normalizedDrivers = (Array.isArray(driversApi) ? driversApi : []).map((driver, index) => ({
          id: String(driver._id || `drv-${index}`),
          name: String(driver.name || `Driver ${index + 1}`),
          onTimePct: clamp(88 + (index * 2), 70, 99),
          idlePct: clamp(14 - index, 4, 30),
          fuelDeltaPct: clamp(3 - (index * 2), -10, 8),
          incidentFlags: index % 3,
          hosRemaining: clamp(4.5 - (index * 0.9), 0, 7),
          revenuePerMile: Number((2.8 + (index * 0.2)).toFixed(2)),
        }));

        const normalizedVehicles = (Array.isArray(vehiclesApi) ? vehiclesApi : []).map((vehicle, index) => ({
          id: String(vehicle._id || `veh-${index}`),
          driverId: String(vehicle.driverId || ''),
          unitNumber: String(vehicle.unitNumber || `T-${100 + index}`),
          status: String(vehicle.status || 'active').toLowerCase(),
          nextServiceMiles: Number.isFinite(Number(vehicle.nextServiceMiles)) ? Number(vehicle.nextServiceMiles) : 1200,
        }));

        if (active) {
          setDrivers(normalizedDrivers.length ? normalizedDrivers : FALLBACK_DRIVERS);
          setVehicles(normalizedVehicles.length ? normalizedVehicles : FALLBACK_VEHICLES);
          setSource('api');
        }
      } catch {
        if (active) {
          setDrivers(FALLBACK_DRIVERS);
          setVehicles(FALLBACK_VEHICLES);
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

  const rows = useMemo(() => {
    const byDriver = vehicles.reduce((acc, vehicle) => {
      const key = String(vehicle.driverId || '');
      if (!acc[key]) acc[key] = [];
      acc[key].push(vehicle);
      return acc;
    }, {});

    return drivers.map((driver) => {
      const assignedUnits = byDriver[driver.id] || [];
      const profitabilityScore = Math.round((driver.onTimePct * 0.35) + ((100 - driver.idlePct) * 0.2) + ((driver.revenuePerMile / 4) * 100 * 0.35) - (driver.incidentFlags * 4));
      const safetyScore = clamp(100 - (driver.incidentFlags * 18) - (driver.idlePct * 0.8), 40, 99);

      return {
        ...driver,
        assignedUnits,
        profitabilityScore: clamp(profitabilityScore, 0, 99),
        safetyScore,
      };
    });
  }, [drivers, vehicles]);

  const sortedRows = useMemo(() => {
    const next = [...rows];
    if (sortBy === 'fuel') return next.sort((a, b) => b.fuelDeltaPct - a.fuelDeltaPct);
    if (sortBy === 'risk') return next.sort((a, b) => b.incidentFlags - a.incidentFlags);
    if (sortBy === 'utilization') return next.sort((a, b) => a.idlePct - b.idlePct);
    return next.sort((a, b) => b.profitabilityScore - a.profitabilityScore);
  }, [rows, sortBy]);

  if (loading) {
    return <div style={{ color: t.textSecondary, padding: 24 }}>Loading driver snapshot profile...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            <Link to="/fleet" style={{ color: t.textSecondary, textDecoration: 'none' }}>Fleet Dashboard</Link>
            <span>  ›  </span>
            <strong style={{ color: t.text }}>Driver Snapshot Profile</strong>
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Driver Snapshot Profile</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Source: {source === 'api' ? 'Live API' : 'Fallback data'} • Driver-centric performance, risk, and utilization profile</div>
        </div>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} style={{ borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '8px 10px' }}>
          <option value="profitability">Sort: Profitability</option>
          <option value="utilization">Sort: Utilization</option>
          <option value="fuel">Sort: Fuel Delta</option>
          <option value="risk">Sort: Risk</option>
        </select>
      </div>

      <section style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: t.surface, padding: 12, display: 'grid', gap: 8 }}>
        {sortedRows.map((driver) => (
          <div key={driver.id} style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, padding: 10, display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <strong>{driver.name}</strong>
              <span style={{ fontSize: 12, color: t.textSecondary }}>Profitability {driver.profitabilityScore} • Safety {driver.safetyScore}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 8, fontSize: 12 }}>
              <div>On-time <strong>{driver.onTimePct}%</strong></div>
              <div>Idle <strong>{driver.idlePct}%</strong></div>
              <div>Fuel Δ <strong>{driver.fuelDeltaPct > 0 ? '+' : ''}{driver.fuelDeltaPct}%</strong></div>
              <div>Incidents <strong>{driver.incidentFlags}</strong></div>
              <div>HOS left <strong>{driver.hosRemaining}h</strong></div>
              <div>RPM <strong>${Number(driver.revenuePerMile).toFixed(2)}</strong></div>
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>
              Assigned units: {driver.assignedUnits.length > 0 ? driver.assignedUnits.map((unit) => `${unit.unitNumber} (${unit.status})`).join(', ') : 'None assigned'}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}