import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const FALLBACK_DRIVERS = [
  {
    id: 'drv-1',
    name: 'Alex Miller',
    onTimePct: 96,
    idlePct: 9,
    fuelDeltaPct: 4,
    incidentFlags: 0,
    hosRemaining: 2.5,
    revenuePerMile: 3.42,
  },
  {
    id: 'drv-2',
    name: 'Sarah Lee',
    onTimePct: 91,
    idlePct: 14,
    fuelDeltaPct: -3,
    incidentFlags: 1,
    hosRemaining: 0.7,
    revenuePerMile: 2.98,
  },
  {
    id: 'drv-3',
    name: 'John Smith',
    onTimePct: 87,
    idlePct: 18,
    fuelDeltaPct: -6,
    incidentFlags: 2,
    hosRemaining: 4.3,
    revenuePerMile: 2.74,
  },
  {
    id: 'drv-4',
    name: 'Maya Patel',
    onTimePct: 94,
    idlePct: 10,
    fuelDeltaPct: 2,
    incidentFlags: 0,
    hosRemaining: 3.2,
    revenuePerMile: 3.31,
  },
];

const FALLBACK_VEHICLES = [
  {
    id: 'veh-101',
    unitNumber: 'T-101',
    status: 'active',
    driverId: 'drv-1',
    driverName: 'Alex Miller',
    loadId: 'LD-9021',
    revenue: 4180,
    cost: 2660,
    odometer: 432188,
    nextServiceMiles: 1200,
    currentLat: 32.78,
    currentLng: -96.8,
    compliance: 'compliant',
    riskScore: 32,
    fuelMpg: 7.4,
    idleMinutes: 22,
    lastTrip: 'DAL → HOU',
    eldStatus: 'Compliant',
    maintenanceAlerts: 0,
  },
  {
    id: 'veh-102',
    unitNumber: 'T-102',
    status: 'idle',
    driverId: 'drv-2',
    driverName: 'Sarah Lee',
    loadId: 'LD-9033',
    revenue: 3060,
    cost: 2145,
    odometer: 398111,
    nextServiceMiles: 680,
    currentLat: 41.88,
    currentLng: -87.62,
    compliance: 'pending',
    riskScore: 66,
    fuelMpg: 6.1,
    idleMinutes: 84,
    lastTrip: 'CHI → IND',
    eldStatus: 'Warning',
    maintenanceAlerts: 1,
  },
  {
    id: 'veh-103',
    unitNumber: 'T-103',
    status: 'breakdown',
    driverId: 'drv-3',
    driverName: 'John Smith',
    loadId: 'LD-9007',
    revenue: 2140,
    cost: 1980,
    odometer: 512233,
    nextServiceMiles: -120,
    currentLat: 35.22,
    currentLng: -80.84,
    compliance: 'compliant',
    riskScore: 82,
    fuelMpg: 5.8,
    idleMinutes: 130,
    lastTrip: 'CLT → ATL',
    eldStatus: 'Violation',
    maintenanceAlerts: 2,
  },
  {
    id: 'veh-104',
    unitNumber: 'T-104',
    status: 'yard',
    driverId: 'drv-4',
    driverName: 'Maya Patel',
    loadId: '',
    revenue: 0,
    cost: 540,
    odometer: 344220,
    nextServiceMiles: 3100,
    currentLat: 29.76,
    currentLng: -95.36,
    compliance: 'compliant',
    riskScore: 22,
    fuelMpg: 7.8,
    idleMinutes: 260,
    lastTrip: 'HOU Yard',
    eldStatus: 'Compliant',
    maintenanceAlerts: 0,
  },
  {
    id: 'veh-105',
    unitNumber: 'T-105',
    status: 'active',
    driverId: 'drv-2',
    driverName: 'Sarah Lee',
    loadId: 'LD-9050',
    revenue: 3840,
    cost: 2520,
    odometer: 289900,
    nextServiceMiles: 2300,
    currentLat: 33.45,
    currentLng: -112.07,
    compliance: 'pending',
    riskScore: 54,
    fuelMpg: 7,
    idleMinutes: 14,
    lastTrip: 'PHX → ABQ',
    eldStatus: 'Compliant',
    maintenanceAlerts: 0,
  },
  {
    id: 'veh-106',
    unitNumber: 'T-106',
    status: 'maintenance',
    driverId: 'drv-1',
    driverName: 'Alex Miller',
    loadId: '',
    revenue: 0,
    cost: 1210,
    odometer: 446900,
    nextServiceMiles: -460,
    currentLat: 39.74,
    currentLng: -104.99,
    compliance: 'compliant',
    riskScore: 74,
    fuelMpg: 5.9,
    idleMinutes: 410,
    lastTrip: 'DEN Shop',
    eldStatus: 'Compliant',
    maintenanceAlerts: 2,
  },
];

function statusTone(status) {
  if (status === 'active') return 'success';
  if (status === 'idle') return 'warning';
  if (status === 'breakdown') return 'error';
  return 'accent';
}
ErrorBoundary.defaultProps = { children: null };
// import DriverCommandCardModern from '../components/DriverCommandCardModern';
// Placeholder icons (replace with your icon components or SVGs)
const IconBus = () => <span role="img" aria-label="bus" style={{fontSize: 24}}>🚌</span>;
const IconCheck = () => <span role="img" aria-label="check" style={{fontSize: 24}}>✅</span>;
const IconGauge = () => <span role="img" aria-label="gauge" style={{fontSize: 24}}>⏱️</span>;
const IconFuel = () => <span role="img" aria-label="fuel" style={{fontSize: 24}}>⛽</span>;
const Avatar = ({ name, src }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#222', overflow: 'hidden', marginRight: 8 }}>
    {src ? <img src={src} alt={name} style={{ width: 36, height: 36, objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontWeight: 700 }}>{name.split(' ').map(n => n[0]).join('').slice(0,2)}</span>}
  </span>
);

// Placeholder Donut Chart
const DonutChart = ({ value, color }) => (
  <svg width="120" height="120" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="50" fill="#232b3e" />
    <circle cx="60" cy="60" r="50" fill="none" stroke="#444" strokeWidth="16" />
    <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="16" strokeDasharray={`${value * 3.14}, 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
    <text x="60" y="68" textAnchor="middle" fontSize="32" fill="#fff" fontWeight="bold">{value}</text>
  </svg>
);

// Placeholder Gauge
const Gauge = ({ value }) => (
  <svg width="120" height="60" viewBox="0 0 120 60">
    <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#444" strokeWidth="12" />
    <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#1ecbe1" strokeWidth="12" strokeDasharray={`${value/10*78}, 78`} />
    <circle cx={60 + 50 * Math.cos(Math.PI * (1 - value/10))} cy={60 - 50 * Math.sin(Math.PI * (1 - value/10))} r="7" fill="#ffb300" />
  </svg>
);

// Placeholder Line Chart
const LineChart = () => (
  <svg width="180" height="80" viewBox="0 0 180 80">
    <polyline fill="none" stroke="#1ecbe1" strokeWidth="3" points="0,60 30,50 60,55 90,40 120,45 150,30 180,40" />
    <circle cx="180" cy="40" r="4" fill="#1ecbe1" />
  </svg>
);

// Mock summary data

// Fleet-specific mock data (no fleet API exists yet)
const MOCK_FLEET_DATA = {
  summary: { totalVehicles: 42, vehiclesActive: 31, utilization: 74, avgFuel: 7.2 },
  drivers: [
    { id: 1, name: 'Alex Miller', company: 'Opscale Freight', compliance: 92, telematics: { status: 'Driving', location: 'Dallas, TX', eta: '14:30', times: ['6:45', '5:15', '2:30'], updatedMinutesAgo: 3, speed: '62 mph' }, docs: [{ name: 'CDL License', status: 'Complete' }, { name: 'Medical Certificate', status: 'Complete' }, { name: 'MVR', status: 'Pending' }, { name: 'Drug Test', status: 'Complete' }] },
    { id: 2, name: 'Sarah Lee', company: 'Opscale Freight', compliance: 78, telematics: { status: 'Sleeper', location: 'Chicago, IL', eta: '09:00', times: ['11:00', '0:45', '0:00'], updatedMinutesAgo: 12, speed: '0 mph' }, docs: [{ name: 'CDL License', status: 'Complete' }, { name: 'Medical Certificate', status: 'Expired' }, { name: 'MVR', status: 'Complete' }, { name: 'Drug Test', status: 'Pending' }] },
    { id: 3, name: 'John Smith', company: 'Opscale Freight', compliance: 65, telematics: { status: 'Off Duty', location: 'Miami, FL', eta: 'N/A', times: ['0:00', '10:00', '0:00'], updatedMinutesAgo: 47, speed: '0 mph' }, docs: [{ name: 'CDL License', status: 'Expired' }, { name: 'Medical Certificate', status: 'Pending' }, { name: 'MVR', status: 'Pending' }, { name: 'Drug Test', status: 'Complete' }] },
  ],
  vehicles: [],
};

// Dashboard state hooks
function useFleetDashboardData(demoMode) {
  const summary = demoMode ? MOCK_FLEET_DATA.summary : { totalVehicles: 0, vehiclesActive: 0, utilization: 0, avgFuel: 0 };
  const drivers = demoMode ? MOCK_FLEET_DATA.drivers : [];
  const vehicles = demoMode ? MOCK_FLEET_DATA.vehicles : [];
  const loading = false;
  const error = null;
  return { summary, drivers, vehicles, loading, error };
}

function complianceTone(compliance) {
  if (compliance === 'pending') return 'warning';
  if (compliance === 'expired') return 'error';
  return 'success';
}

function toneColor(themeObj, tone) {
  if (tone === 'success') return themeObj.success;
  if (tone === 'warning') return themeObj.warning;
  if (tone === 'error') return themeObj.error;
  return themeObj.accent;
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeVehicleFromApi(vehicle, driverNameById, tripByVehicleId, index) {
  const trip = tripByVehicleId[vehicle._id] || null;
  const defaultLat = 30 + index * 1.8;
  const defaultLng = -100 + index * 2.2;
  const nextServiceMiles = Number.isFinite(Number(vehicle.nextServiceMiles))
    ? Number(vehicle.nextServiceMiles)
    : 1500 - (index * 180);

  return {
    id: String(vehicle._id || `veh-${index}`),
    unitNumber: vehicle.unitNumber || `T-${100 + index}`,
    status: String(vehicle.status || 'active').toLowerCase(),
    driverId: String(vehicle.driverId || ''),
    driverName: driverNameById[String(vehicle.driverId || '')] || 'Unassigned',
    loadId: trip ? `LD-${String(trip._id).slice(-4).toUpperCase()}` : '',
    revenue: Number(trip?.revenue || 0),
    cost: Number((trip?.fuelCost || 0) + (trip?.tollCost || 0)),
    odometer: Number(vehicle.odometer || 250000 + index * 6000),
    nextServiceMiles,
    currentLat: Number(vehicle.currentLat || defaultLat),
    currentLng: Number(vehicle.currentLng || defaultLng),
    compliance: nextServiceMiles < 0 ? 'pending' : 'compliant',
    riskScore: clamp(Math.round(45 + (index * 6) + (nextServiceMiles < 0 ? 20 : 0)), 10, 99),
    fuelMpg: Number(vehicle.mpg || (7 - (index * 0.2))).toFixed(1),
    idleMinutes: Math.max(0, Math.round(index * 19 + (vehicle.status === 'idle' ? 48 : 8))),
    lastTrip: trip ? `${trip.startLocation || 'Origin'} → ${trip.endLocation || 'Destination'}` : 'No recent trip',
    eldStatus: index % 5 === 0 ? 'Warning' : 'Compliant',
    maintenanceAlerts: nextServiceMiles < 0 ? 1 : 0,
  };
}

function mapPoint(lat, lng) {
  const x = clamp(((lng + 125) / 59) * 100, 3, 97);
  const y = clamp(((49 - lat) / 25) * 100, 6, 94);
  return { x, y };
}

function useFleetCommandData() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('loading');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    let active = true;

    const fetchFleet = async () => {
      setLoading(true);
      try {
        const [vehiclesRes, driversRes, tripsRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/drivers'),
          fetch('/api/trips'),
        ]);

        if (!vehiclesRes.ok || !driversRes.ok || !tripsRes.ok) {
          throw new Error('fleet api unavailable');
        }

        const [vehiclesApi, driversApi, tripsApi] = await Promise.all([
          vehiclesRes.json(),
          driversRes.json(),
          tripsRes.json(),
        ]);

        const driversRows = Array.isArray(driversApi) ? driversApi : [];
        const vehiclesRows = Array.isArray(vehiclesApi) ? vehiclesApi : [];
        const tripsRows = Array.isArray(tripsApi) ? tripsApi : [];

        if (vehiclesRows.length === 0) {
          throw new Error('no vehicles in api');
        }

        const driverNameById = driversRows.reduce((acc, driver) => {
          acc[String(driver._id)] = String(driver.name || 'Unknown Driver');
          return acc;
        }, {});

        const tripByVehicleId = tripsRows.reduce((acc, trip) => {
          if (trip.vehicleId && !acc[String(trip.vehicleId)]) {
            acc[String(trip.vehicleId)] = trip;
          }
          return acc;
        }, {});

        const normalizedVehicles = vehiclesRows.map((vehicle, index) =>
          normalizeVehicleFromApi(vehicle, driverNameById, tripByVehicleId, index)
        );

        const normalizedDrivers = driversRows.length
          ? driversRows.map((driver, index) => ({
              id: String(driver._id || `drv-${index}`),
              name: String(driver.name || `Driver ${index + 1}`),
              onTimePct: clamp(88 + (index * 2), 70, 99),
              idlePct: clamp(14 - index, 4, 30),
              fuelDeltaPct: clamp(3 - (index * 2), -10, 8),
              incidentFlags: index % 3,
              hosRemaining: clamp(4.5 - (index * 0.9), 0, 7),
              revenuePerMile: Number((2.8 + (index * 0.2)).toFixed(2)),
            }))
          : FALLBACK_DRIVERS;

        if (active) {
          setVehicles(normalizedVehicles);
          setDrivers(normalizedDrivers);
          setSource('api');
          setLastUpdated(new Date());
        }
      } catch {
        if (active) {
          setVehicles(FALLBACK_VEHICLES);
          setDrivers(FALLBACK_DRIVERS);
          setSource('simulated');
          setLastUpdated(new Date());
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchFleet();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading || vehicles.length === 0) return undefined;

    const timer = window.setInterval(() => {
      setVehicles((current) => current.map((vehicle, index) => {
        const isMoving = vehicle.status === 'active';
        const latStep = isMoving ? (index % 2 === 0 ? 0.03 : -0.02) : 0;
        const lngStep = isMoving ? (index % 2 === 0 ? 0.02 : -0.015) : 0;
        const nextIdle = isMoving ? Math.max(0, vehicle.idleMinutes - 3) : vehicle.idleMinutes + 4;

        return {
          ...vehicle,
          currentLat: clamp(vehicle.currentLat + latStep, 25.2, 48.6),
          currentLng: clamp(vehicle.currentLng + lngStep, -124.2, -67.5),
          idleMinutes: nextIdle,
          fuelMpg: Number(clamp(Number(vehicle.fuelMpg) + (isMoving ? -0.02 : 0.01), 5.1, 8.4).toFixed(1)),
          riskScore: clamp(vehicle.riskScore + (vehicle.status === 'breakdown' ? 1 : 0), 10, 99),
        };
      }));
      setLastUpdated(new Date());
    }, 5000);

    return () => window.clearInterval(timer);
  }, [loading, vehicles.length]);

  return { vehicles, setVehicles, drivers, loading, source, lastUpdated };
}

function toneBySeverity(value, warningAt, criticalAt, inverse = false) {
  if (inverse) {
    if (value <= criticalAt) return 'error';
    if (value <= warningAt) return 'warning';
    return 'success';
  }
  if (value >= criticalAt) return 'error';
  if (value >= warningAt) return 'warning';
  return 'success';
}

function CommandMetricCard({ title, value, subtitle, tone, active, onClick, themeObj }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid var(--border)`,
        boxSizing: 'border-box',
        borderRadius: 'var(--radius)',
        background: active ? 'var(--surface-elevated)' : 'var(--surface)',
        color: 'var(--text-primary)',
        padding: 16,
        textAlign: 'left',
        cursor: 'pointer',
        outline: 'none',
        boxShadow: active ? '0 4px 16px var(--accent-shadow, rgba(47,128,255,0.08))' : 'none',
        transition: 'border-color 140ms ease, box-shadow 140ms ease, background 140ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{title}</div>
        <span style={{ width: 9, height: 9, borderRadius: 99, background: `var(--${tone})`, border: '1px solid var(--border)' }} />
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>{value}</div>
      <div style={{ marginTop: 10, fontSize: 12, color: `var(--${tone})`, fontWeight: 700 }}>{subtitle}</div>
    </button>
  );
}

function ProgressBar({ value, color, t }) {
  return (
    <div style={{ height: 8, borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${clamp(Number(value || 0), 0, 100)}%`, background: color }} />
    </div>
  );
}

export default function FleetDashboard() {
  const { theme } = useTheme();
  const t = theme;
  t.surface = t.surface || '#fff';
  t.bgAlt = t.bgAlt || '#f8f8f8';
  t.textSecondary = t.textSecondary || '#666';
  t.border = t.border || '#ccc';
  t.success = t.success || '#16A34A';
  t.warning = t.warning || '#D97706';
  t.error = t.error || '#DC2626';
  t.text = t.text || '#111827';
  const navigate = useNavigate();
  const { vehicles, setVehicles, drivers, loading, source, lastUpdated } = useFleetCommandData();

  const [activePage, setActivePage] = useState('ops');
  const [activeStripAction, setActiveStripAction] = useState('critical');
  const [statusFilter, setStatusFilter] = useState('all');
  const [telematicsFilter, setTelematicsFilter] = useState('all');
  const [tableQuickFilter, setTableQuickFilter] = useState('all');
  const [savedView, setSavedView] = useState('default');
  const [search, setSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState('');
  const [editCompliance, setEditCompliance] = useState('compliant');
  const [driverSortBy, setDriverSortBy] = useState('profitability');
  const [showMarginDriftModal, setShowMarginDriftModal] = useState(false);
  const [fullMapMode, setFullMapMode] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!selectedVehicleId && vehicles[0]) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [selectedVehicleId, vehicles]);

  const metrics = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((vehicle) => vehicle.status === 'active').length;
    const idle = vehicles.filter((vehicle) => vehicle.status === 'idle').length;
    const unitsDown = vehicles.filter((vehicle) => vehicle.status === 'breakdown' || vehicle.status === 'maintenance').length;
    const utilization = total ? Math.round((active / total) * 100) : 0;
    const avgMpg = total
      ? Number((vehicles.reduce((sum, vehicle) => sum + Number(vehicle.fuelMpg || 0), 0) / total).toFixed(1))
      : 0;
    const compliancePending = vehicles.filter((vehicle) => vehicle.compliance !== 'compliant').length;

    return { total, active, idle, unitsDown, utilization, avgMpg, compliancePending };
  }, [vehicles]);

  const financialSnapshot = useMemo(() => {
    const todayRevenue = vehicles.reduce((sum, vehicle) => sum + Number(vehicle.revenue || 0), 0);
    const todayCost = vehicles.reduce((sum, vehicle) => sum + Number(vehicle.cost || 0), 0);
    const miles = vehicles.reduce((sum, vehicle) => sum + Math.max(120, (vehicle.odometer % 320)), 0);
    const margin = todayRevenue - todayCost;
    const costPerMile = miles ? todayCost / miles : 0;

    return {
      todayRevenue,
      todayCost,
      margin,
      costPerMile,
      projectedWeeklyGross: margin * 5,
    };
  }, [vehicles]);

  const commandAlerts = useMemo(() => {
    const lateLoads = vehicles.filter((vehicle) => vehicle.status === 'idle' && vehicle.loadId).length;
    const detentionRisk = vehicles.filter((vehicle) => vehicle.idleMinutes > 75 && vehicle.loadId).length;
    const lowMpg = vehicles.filter((vehicle) => Number(vehicle.fuelMpg) < 6).length;
    const eldIssues = vehicles.filter((vehicle) => vehicle.eldStatus !== 'Compliant').length;
    const serviceOver = vehicles.filter((vehicle) => vehicle.nextServiceMiles <= 0).length;
    const geofenceBreaches = vehicles.filter((vehicle) => vehicle.status === 'breakdown' || vehicle.riskScore > 75).length;
    const speeding = vehicles.filter((vehicle) => vehicle.idleMinutes < 6 && vehicle.status === 'active').length;
    const hosRisk = drivers.filter((driver) => Number(driver.hosRemaining) < 1).length;

    return { lateLoads, detentionRisk, lowMpg, eldIssues, serviceOver, hosRisk, geofenceBreaches, speeding };
  }, [drivers, vehicles]);

  const revenueAtRiskToday = useMemo(() => {
    const idlePenalty = vehicles.reduce((sum, vehicle) => sum + (vehicle.idleMinutes > 180 ? 180 : vehicle.idleMinutes) * 1.6, 0);
    const maintenancePenalty = vehicles
      .filter((vehicle) => vehicle.status === 'maintenance' || vehicle.status === 'breakdown')
      .reduce((sum, vehicle) => sum + (420 + (vehicle.maintenanceAlerts * 90)), 0);
    const mpgPenalty = vehicles
      .filter((vehicle) => Number(vehicle.fuelMpg) < 6)
      .reduce((sum, vehicle) => sum + ((6 - Number(vehicle.fuelMpg || 0)) * 120), 0);
    const marginDriftPenalty = vehicles
      .reduce((sum, vehicle) => {
        const marginPct = Number(vehicle.revenue || 0) > 0
          ? ((Number(vehicle.revenue || 0) - Number(vehicle.cost || 0)) / Number(vehicle.revenue || 0)) * 100
          : 0;
        return sum + Math.max(0, (12 - marginPct) * 22);
      }, 0);

    return Math.round(idlePenalty + maintenancePenalty + mpgPenalty + marginDriftPenalty);
  }, [vehicles]);

  const marginDrift = useMemo(() => {
    const rows = vehicles.filter((vehicle) => Number(vehicle.revenue || 0) > 0);
    if (!rows.length) return 0;
    const avgMarginPct = rows.reduce((sum, vehicle) => {
      const margin = Number(vehicle.revenue || 0) - Number(vehicle.cost || 0);
      return sum + ((margin / Number(vehicle.revenue || 1)) * 100);
    }, 0) / rows.length;
    return Number((avgMarginPct - 12).toFixed(1));
  }, [vehicles]);

  const fleetHealthIndex = useMemo(() => {
    const base = 100;
    const score = base
      - (commandAlerts.serviceOver * 8)
      - (commandAlerts.hosRisk * 10)
      - (commandAlerts.lowMpg * 4)
      - (commandAlerts.eldIssues * 8)
      - Math.max(0, metrics.utilization < 70 ? 6 : 0);

    return clamp(score, 0, 100);
  }, [commandAlerts, metrics.utilization]);

  const criticalAlertsCount = commandAlerts.eldIssues + commandAlerts.serviceOver + commandAlerts.detentionRisk + commandAlerts.hosRisk;

  const stripCards = useMemo(() => {
    const criticalTone = toneBySeverity(criticalAlertsCount, 2, 4);
    const complianceTone = toneBySeverity(metrics.compliancePending, 1, 3);
    const revenueTone = toneBySeverity(revenueAtRiskToday, 1200, 2600);
    const downTone = toneBySeverity(metrics.unitsDown, 1, 3);
    const driftTone = toneBySeverity(Math.abs(marginDrift), 1.5, 3.5);

    return [
      {
        id: 'critical',
        title: '🚨 Critical Alerts',
        value: criticalAlertsCount,
        subtitle: 'Click to isolate at-risk units now',
        tone: criticalTone,
        onClick: () => {
          setActiveStripAction('critical');
          setActivePage('ops');
          setTableQuickFilter('critical');
          setStatusFilter('all');
        },
      },
      {
        id: 'compliance',
        title: '⚠ Compliance Risk',
        value: metrics.compliancePending,
        subtitle: 'Open compliance-focused queue',
        tone: complianceTone,
        onClick: () => {
          setActiveStripAction('compliance');
          setActivePage('ops');
          setTableQuickFilter('compliance');
        },
      },
      {
        id: 'revenue-risk',
        title: '💰 Revenue at Risk Today',
        value: formatMoney(revenueAtRiskToday),
        subtitle: 'Real-time risk engine from fleet drag',
        tone: revenueTone,
        onClick: () => {
          setActiveStripAction('revenue-risk');
          setActivePage('financial');
        },
      },
      {
        id: 'units-down',
        title: '🚚 Units Down',
        value: metrics.unitsDown,
        subtitle: 'Open maintenance command queue',
        tone: downTone,
        onClick: () => {
          setActiveStripAction('units-down');
          setActivePage('maintenance');
          setStatusFilter('maintenance');
        },
      },
      {
        id: 'margin-drift',
        title: '📉 Margin Drift',
        value: `${marginDrift > 0 ? '+' : ''}${marginDrift}%`,
        subtitle: 'Open margin drift trend panel',
        tone: driftTone,
        onClick: () => {
          setActiveStripAction('margin-drift');
          setActivePage('financial');
          setShowMarginDriftModal(true);
        },
      },
    ];
  }, [criticalAlertsCount, marginDrift, metrics.compliancePending, metrics.unitsDown, revenueAtRiskToday]);

  const filteredVehicles = useMemo(() => {
    let rows = [...vehicles];

    if (statusFilter !== 'all') {
      rows = rows.filter((vehicle) => vehicle.status === statusFilter);
    }

    if (savedView === 'losing-money') {
      rows = rows.filter((vehicle) => (Number(vehicle.revenue || 0) - Number(vehicle.cost || 0)) < 0);
    }
    if (savedView === 'expiring-compliance') {
      rows = rows.filter((vehicle) => vehicle.compliance !== 'compliant' || vehicle.nextServiceMiles <= 0);
    }
    if (savedView === 'idle-heavy') {
      rows = rows.filter((vehicle) => vehicle.idleMinutes > 180);
    }

    if (tableQuickFilter === 'critical') {
      rows = rows.filter((vehicle) => vehicle.status === 'breakdown' || vehicle.nextServiceMiles <= 0 || vehicle.eldStatus !== 'Compliant');
    }
    if (tableQuickFilter === 'losing-money') {
      rows = rows.filter((vehicle) => (Number(vehicle.revenue || 0) - Number(vehicle.cost || 0)) < 0);
    }
    if (tableQuickFilter === 'compliance') {
      rows = rows.filter((vehicle) => vehicle.compliance !== 'compliant' || vehicle.eldStatus !== 'Compliant' || Number(vehicle.nextServiceMiles || 0) <= 700);
    }
    if (tableQuickFilter === 'idle3h') {
      rows = rows.filter((vehicle) => vehicle.idleMinutes > 180);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      rows = rows.filter((vehicle) =>
        [vehicle.unitNumber, vehicle.driverName, vehicle.loadId, vehicle.compliance]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))
      );
    }

    return rows;
  }, [savedView, tableQuickFilter, search, statusFilter, vehicles]);

  useEffect(() => {
    setSelectedRows((current) => current.filter((id) => filteredVehicles.some((vehicle) => vehicle.id === id)));
  }, [filteredVehicles]);

  const telematicsRows = useMemo(() => {
    if (telematicsFilter === 'all') return vehicles;
    if (telematicsFilter === 'geofence') return vehicles.filter((vehicle) => vehicle.riskScore > 75 || vehicle.status === 'breakdown');
    if (telematicsFilter === 'speeding') return vehicles.filter((vehicle) => vehicle.idleMinutes < 6 && vehicle.status === 'active');
    return vehicles.filter((vehicle) => vehicle.status === telematicsFilter);
  }, [telematicsFilter, vehicles]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || filteredVehicles[0] || null,
    [filteredVehicles, selectedVehicleId, vehicles]
  );

  const maintenanceRows = useMemo(
    () => vehicles
      .filter((vehicle) => vehicle.status === 'maintenance' || vehicle.nextServiceMiles <= 1200)
      .sort((left, right) => left.nextServiceMiles - right.nextServiceMiles),
    [vehicles]
  );

  const leaderboardRows = useMemo(() => {
    const rows = drivers.map((driver) => {
      const matchingVehicles = vehicles.filter((vehicle) => vehicle.driverId === driver.id || vehicle.driverName === driver.name);
      const revenue = matchingVehicles.reduce((sum, vehicle) => sum + Number(vehicle.revenue || 0), 0);
      const cost = matchingVehicles.reduce((sum, vehicle) => sum + Number(vehicle.cost || 0), 0);
      const vehicleMiles = matchingVehicles.reduce((sum, vehicle) => sum + Math.max(120, (vehicle.odometer % 280)), 0);
      const revenuePerMile = vehicleMiles ? revenue / vehicleMiles : Number(driver.revenuePerMile || 0);
      const idleWaste = Number(driver.idlePct || 0) * 5;
      const maintenanceAllocation = matchingVehicles.reduce((sum, vehicle) => sum + Math.max(0, (1200 - vehicle.nextServiceMiles) * 0.08), 0);
      const fuelCostPenalty = Math.max(0, 6.8 - Number((matchingVehicles[0]?.fuelMpg || 6.8))) * 42;
      const profitabilityScore = Math.round((revenuePerMile * 38) - fuelCostPenalty - idleWaste - maintenanceAllocation);
      const riskScore = clamp(
        Math.round((driver.incidentFlags * 20) + (Number(driver.idlePct || 0) * 1.1) + (Math.max(0, 1 - Number(driver.hosRemaining || 0)) * 28)),
        0,
        100
      );
      const complianceScore = clamp(100 - (driver.incidentFlags * 18) - Math.max(0, 1 - Number(driver.hosRemaining || 0)) * 35, 0, 100);

      return {
        ...driver,
        revenuePerMile: Number(revenuePerMile.toFixed(2)),
        profitabilityScore,
        riskScore,
        complianceScore,
        safetyScore: clamp(100 - (driver.incidentFlags * 15) - Number(driver.idlePct || 0), 0, 100),
        efficiencyTrend: [
          clamp(58 + Number(driver.onTimePct || 0) * 0.35, 35, 99),
          clamp(61 + Number(driver.onTimePct || 0) * 0.32, 35, 99),
          clamp(63 + Number(driver.onTimePct || 0) * 0.30, 35, 99),
          clamp(66 + Number(driver.onTimePct || 0) * 0.28, 35, 99),
        ],
      };
    });

    return rows.sort((left, right) => {
      if (driverSortBy === 'profitability') return right.profitabilityScore - left.profitabilityScore;
      if (driverSortBy === 'fuel') return Number(right.fuelDeltaPct) - Number(left.fuelDeltaPct);
      if (driverSortBy === 'risk') return right.riskScore - left.riskScore;
      return right.complianceScore - left.complianceScore;
    });
  }, [driverSortBy, drivers, vehicles]);

  const maintenanceCommandRows = useMemo(() => {
    return vehicles
      .filter((vehicle) => vehicle.status === 'maintenance' || vehicle.status === 'breakdown' || vehicle.nextServiceMiles <= 1200)
      .map((vehicle, index) => {
        const timeInRepairHours = vehicle.status === 'maintenance' || vehicle.status === 'breakdown'
          ? 8 + (index * 4) + Math.floor(vehicle.idleMinutes / 30)
          : Math.floor(vehicle.idleMinutes / 40);
        const downtimeCostPerUnit = Math.round((Number(vehicle.revenue || 0) * 0.21) + (timeInRepairHours * 32));
        const costVsBudget = Math.round(downtimeCostPerUnit - 620);
        const partsEtaHours = vehicle.maintenanceAlerts > 1 ? 36 : 12;
        const techLoad = clamp(2 + vehicle.maintenanceAlerts + (index % 2), 1, 6);

        return {
          ...vehicle,
          timeInRepairHours,
          partsEtaHours,
          downtimeCostPerUnit,
          costVsBudget,
          techLoad,
          estimatedReturnToService: new Date(Date.now() + ((partsEtaHours + timeInRepairHours) * 3600 * 1000)).toISOString(),
        };
      })
      .sort((left, right) => right.downtimeCostPerUnit - left.downtimeCostPerUnit);
  }, [vehicles]);

  const laneMargins = useMemo(() => {
    const groups = vehicles.reduce((acc, vehicle) => {
      const lane = String(vehicle.lastTrip || 'Unknown lane');
      if (!acc[lane]) acc[lane] = { lane, revenue: 0, cost: 0, units: 0 };
      acc[lane].revenue += Number(vehicle.revenue || 0);
      acc[lane].cost += Number(vehicle.cost || 0);
      acc[lane].units += 1;
      return acc;
    }, {});
    return Object.values(groups)
      .map((row) => ({
        ...row,
        margin: row.revenue - row.cost,
        marginPct: row.revenue > 0 ? (((row.revenue - row.cost) / row.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.margin - a.margin);
  }, [vehicles]);

  const weeklyRevenueTrend = useMemo(() => {
    const base = Math.max(0, financialSnapshot.todayRevenue);
    return [
      Math.round(base * 0.78),
      Math.round(base * 0.88),
      Math.round(base * 0.93),
      Math.round(base * 1.02),
      Math.round(base * 1.06),
      Math.round(base * 1.1),
      Math.round(base * 1.14),
    ];
  }, [financialSnapshot.todayRevenue]);

  const projectedWeeklyBurn = Math.round((financialSnapshot.todayCost * 5) + (commandAlerts.lowMpg * 210) + (metrics.unitsDown * 380));
  const forecastedMaintenanceExpense = Math.round(maintenanceCommandRows.reduce((sum, row) => sum + Math.max(0, row.costVsBudget + 620), 0) * 0.38);

  const allRowsSelected = filteredVehicles.length > 0 && selectedRows.length === filteredVehicles.length;

  const onToggleRow = (vehicleId) => {
    setSelectedRows((current) => (current.includes(vehicleId)
      ? current.filter((id) => id !== vehicleId)
      : [...current, vehicleId]));
  };

  const onToggleAllRows = () => {
    if (allRowsSelected) {
      setSelectedRows([]);
      return;
    }
    setSelectedRows(filteredVehicles.map((vehicle) => vehicle.id));
  };

  const applyBulkAssignLoad = () => {
    if (selectedRows.length === 0) {
      setActionMessage('Select at least one unit to assign a load.');
      return;
    }
    const loadRef = `LD-${Date.now().toString().slice(-4)}`;
    setVehicles((current) => current.map((vehicle) => (
      selectedRows.includes(vehicle.id) ? { ...vehicle, loadId: loadRef, status: 'active' } : vehicle
    )));
    setActionMessage(`Assigned load ${loadRef} to ${selectedRows.length} unit(s).`);
    setSelectedRows([]);
  };

  const applyBulkMessage = () => {
    if (selectedRows.length === 0) {
      setActionMessage('Select at least one unit to send a message.');
      return;
    }
    setActionMessage(`Message queued for ${selectedRows.length} selected unit(s).`);
    setSelectedRows([]);
  };

  const assignLoadToVehicle = (vehicle) => {
    const loadRef = `LD-${Date.now().toString().slice(-4)}`;
    setVehicles((current) => current.map((row) => (
      row.id === vehicle.id ? { ...row, loadId: loadRef, status: 'active' } : row
    )));
    setActionMessage(`Load ${loadRef} assigned to ${vehicle.unitNumber}.`);
  };

  const messageVehicleDriver = (vehicle) => {
    setActionMessage(`Message sent to ${vehicle.driverName} (${vehicle.unitNumber}).`);
  };

  const saveComplianceEdit = (vehicleId) => {
    setVehicles((current) => current.map((vehicle) => (
      vehicle.id === vehicleId ? { ...vehicle, compliance: editCompliance } : vehicle
    )));
    setEditingRowId('');
  };

  const moveToYard = (vehicleId) => {
    setVehicles((current) => current.map((vehicle) => (
      vehicle.id === vehicleId ? { ...vehicle, status: 'yard', loadId: '' } : vehicle
    )));
    setActionMessage(`Vehicle moved to yard.`);
  };

  const assignTechnician = (vehicleId) => {
    setVehicles((current) => current.map((vehicle) => (
      vehicle.id === vehicleId ? { ...vehicle, status: 'maintenance', maintenanceAlerts: Math.max(1, vehicle.maintenanceAlerts) } : vehicle
    )));
    setActionMessage(`Technician assigned.`);
  };

  if (loading) {
    return <div style={{ color: t.textSecondary, padding: 24 }}>Loading Fleet Command Interface...</div>;
  }

  const sectionCardStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    padding: 12,
  };

  const topNavPages = [
    { id: 'ops', label: 'Fleet Ops' },
    { id: 'drivers', label: 'Driver Performance' },
    { id: 'financial', label: 'Financial Ops' },
    { id: 'maintenance', label: 'Maintenance Command' },
    { id: 'telematics', label: 'Live Telematics' },
  ];

  const selectedTelematicsVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || telematicsRows[0] || null;

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 30 }}>Fleet Command Center</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            Source: {source === 'api' ? 'Live API' : 'Simulated realtime feed'} • Updated {lastUpdated.toLocaleTimeString()} • Fleet health {fleetHealthIndex}/100
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search unit, driver, load, compliance"
            style={{ minWidth: 260, minHeight: 36, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '8px 10px' }}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '8px 10px' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="breakdown">Breakdown</option>
            <option value="yard">In Yard</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <button
            type="button"
            onClick={() => navigate('/fleet/assets')}
            style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}
          >
            Asset Management
          </button>
        </div>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
        {stripCards.map((card) => (
          <CommandMetricCard
            key={card.id}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            tone={card.tone}
            active={activeStripAction === card.id}
            onClick={card.onClick}
            themeObj={t}
          />
        ))}
      </section>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {topNavPages.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => setActivePage(page.id)}
            style={{
              borderRadius: 8,
              border: `1px solid ${activePage === page.id ? t.accent : t.border}`,
              background: activePage === page.id ? t.surfaceStrong : t.bgAlt,
              color: t.text,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {page.label}
          </button>
        ))}
      </div>

      {activePage === 'ops' && (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)', gap: 10 }}>
        <section style={sectionCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Live Fleet Ops Map</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>What is broken and who owns it right now</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'active', 'idle', 'breakdown', 'maintenance'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setTelematicsFilter(status)}
                  style={{ borderRadius: 8, border: `1px solid ${telematicsFilter === status ? t.accent : t.border}`, background: t.bgAlt, color: t.text, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 10 }}>
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, minHeight: 320, position: 'relative' }}>
              {telematicsRows.map((vehicle) => {
                const point = mapPoint(vehicle.currentLat, vehicle.currentLng);
                return (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    title={`${vehicle.unitNumber} • ${vehicle.driverName}`}
                    style={{
                      position: 'absolute',
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: selectedVehicleId === vehicle.id ? 16 : 12,
                      height: selectedVehicleId === vehicle.id ? 16 : 12,
                      borderRadius: 999,
                      border: `1px solid ${t.border}`,
                      background: toneColor(t, statusTone(vehicle.status)),
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
            </div>

            <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, padding: 10, display: 'grid', gap: 7, alignContent: 'start' }}>
              <div style={{ fontWeight: 700 }}>{selectedVehicle?.unitNumber || 'Select unit'}</div>
              <div style={{ fontSize: 12 }}><strong>Driver:</strong> {selectedVehicle?.driverName || '—'}</div>
              <div style={{ fontSize: 12 }}><strong>Status:</strong> {selectedVehicle?.status || '—'}</div>
              <div style={{ fontSize: 12 }}><strong>Last trip:</strong> {selectedVehicle?.lastTrip || '—'}</div>
              <div style={{ fontSize: 12 }}><strong>Idle:</strong> {selectedVehicle?.idleMinutes || 0} min</div>
              <div style={{ fontSize: 12 }}><strong>Route deviation:</strong> {selectedVehicle && selectedVehicle.riskScore > 70 ? 'High' : 'Low'}</div>
              <div style={{ fontSize: 12 }}><strong>Health score:</strong> {selectedVehicle ? clamp(100 - (selectedVehicle.riskScore * 0.55) - (selectedVehicle.nextServiceMiles <= 0 ? 22 : 0), 0, 100) : '—'}</div>
              <a href={selectedVehicle ? `https://www.google.com/maps?q=${selectedVehicle.currentLat},${selectedVehicle.currentLng}` : '#'} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: t.accent }}>Open live location</a>
            </div>
          </div>
        </section>

        <div className={`mt-4 rounded-lg p-3 ${complianceTone.barClass}`}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Compliance Risk</p>
            <p className={`text-sm font-semibold ${complianceTone.textClass}`}>{driver.compliance}%</p>
          </div>
          <progress
            value={driver.compliance}
            max="100"
            className={`h-2 w-full overflow-hidden rounded-full ${complianceTone.accentClass}`}
          />
        </div>
      </div>
    </section>
  );
}

function LiveMapCard({ driver }) {
  const hasMapsKey = typeof GOOGLE_MAPS_KEY === 'string' && GOOGLE_MAPS_KEY.trim().length > 0;

  return (
    <section className="col-span-12 lg:col-span-8">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-200">
        <div className="mb-4 flex items-center justify-between">
        <aside style={{ ...sectionCardStyle, display: 'grid', gap: 10, alignContent: 'start' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Alerts & Risk Queue</div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>Urgency-first operational stack</div>
          </div>
          <button className="rounded-lg bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow hover:bg-blue-700">View EDI Details</button>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          {hasMapsKey ? (
            <iframe
              title="Google Maps EDI Tracking"
              width="100%"
              height="300"
              className="rounded-lg border border-gray-300"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&q=${encodeURIComponent(driver.telematics.location)}`}
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-500">
              Live map unavailable. Set VITE_GOOGLE_MAPS_API_KEY to enable map embeds.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TelemetryCard({ driver }) {
  const stats = [
    { label: 'Current Location', value: driver.telematics.location },
    { label: 'Status', value: driver.telematics.status },
    { label: 'Drive Time Today', value: driver.telematics.times[0] || '--:--' },
    { label: 'HOS Remaining', value: driver.telematics.times[1] || '--:--' },
    { label: 'ETA', value: driver.telematics.eta },
    { label: 'Speed', value: driver.telematics.speed || 'N/A' },
  ];

  return (
    <section className="col-span-12 lg:col-span-4">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-200">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Driver Analytics &amp; Telemetry</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
        {/* Placeholder for modern analytics/graphs */}
        <div className="mt-6 rounded-lg border border-gray-100 bg-white p-4 shadow">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Metrics</h3>
          <div className="flex flex-col gap-2">
            <div className="h-24 bg-gradient-to-r from-blue-100 to-blue-300 rounded-lg flex items-center justify-center text-blue-700 text-lg font-bold">Graph: Drive Time vs Compliance</div>
            <div className="h-24 bg-gradient-to-r from-green-100 to-green-300 rounded-lg flex items-center justify-center text-green-700 text-lg font-bold">Graph: Speed &amp; Location Trends</div>
          <div style={{ display: 'grid', gap: 7, fontSize: 12 }}>
            <div>{commandAlerts.lateLoads} late loads</div>
            <div>{commandAlerts.detentionRisk} detention risks</div>
            <div>{commandAlerts.lowMpg} MPG anomalies</div>
            <div>{commandAlerts.eldIssues} ELD compliance issues</div>
            <div>{commandAlerts.geofenceBreaches} geofence breaches</div>
            <div>{commandAlerts.speeding} speeding risks</div>
          </div>
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 10, display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12, color: t.textSecondary }}>Fleet health index</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: fleetHealthIndex < 70 ? t.error : fleetHealthIndex < 85 ? t.warning : t.success }}>{fleetHealthIndex}</div>
            <ProgressBar value={fleetHealthIndex} color={fleetHealthIndex < 70 ? t.error : fleetHealthIndex < 85 ? t.warning : t.success} t={t} />
          </div>
        </aside>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
        <section style={sectionCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Maintenance Queue</div>
            <button
              type="button"
              onClick={() => navigate('/fleet/maintenance-queue')}
              style={{ borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
            >
              Open profile
            </button>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {maintenanceRows.length === 0 && <div style={{ fontSize: 12, color: t.textSecondary }}>No maintenance queue.</div>}
            {maintenanceRows.slice(0, 4).map((vehicle) => (
              <div key={vehicle.id} style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, padding: 10, fontSize: 12, display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 700 }}>{vehicle.unitNumber} • {vehicle.driverName}</div>
                <div>Service due: <strong>{vehicle.nextServiceMiles}</strong> miles</div>
                <div>Downtime cost/day: <strong>{formatMoney(vehicle.maintenanceAlerts > 1 ? 580 : 320)}</strong></div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Driver Snapshot</div>
            <button
              type="button"
              onClick={() => navigate('/fleet/driver-snapshot')}
              style={{ borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
            >
              Open profile
            </button>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {leaderboardRows.slice(0, 4).map((driver) => (
              <div key={driver.id} style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, padding: 10, fontSize: 12, display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 700 }}>{driver.name}</div>
                <div>Profitability score: <strong>{driver.profitabilityScore}</strong></div>
                <div>On-time {driver.onTimePct}% • Idle {driver.idlePct}% • Safety {driver.safetyScore}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section style={{ ...sectionCardStyle, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Smart Vehicle Table</div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>Sticky filters, saved views, inline actions, risk + profit tags</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setTableQuickFilter('all')} style={{ borderRadius: 8, border: `1px solid ${tableQuickFilter === 'all' ? t.accent : t.border}`, background: t.bgAlt, color: t.text, padding: '6px 10px', cursor: 'pointer' }}>All units</button>
            <button type="button" onClick={() => setTableQuickFilter('losing-money')} style={{ borderRadius: 8, border: `1px solid ${tableQuickFilter === 'losing-money' ? t.accent : t.border}`, background: t.bgAlt, color: t.text, padding: '6px 10px', cursor: 'pointer' }}>Show units losing money</button>
            <button type="button" onClick={() => setTableQuickFilter('compliance')} style={{ borderRadius: 8, border: `1px solid ${tableQuickFilter === 'compliance' ? t.accent : t.border}`, background: t.bgAlt, color: t.text, padding: '6px 10px', cursor: 'pointer' }}>Compliance expiring {'<'} 7 days</button>
            <button type="button" onClick={() => setTableQuickFilter('idle3h')} style={{ borderRadius: 8, border: `1px solid ${tableQuickFilter === 'idle3h' ? t.accent : t.border}`, background: t.bgAlt, color: t.text, padding: '6px 10px', cursor: 'pointer' }}>Idle {'>'} 3 hours</button>
            <select value={savedView} onChange={(event) => setSavedView(event.target.value)} style={{ borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '6px 10px', cursor: 'pointer' }}>
              <option value="default">Saved view: Default</option>
              <option value="losing-money">Saved view: Losing Money</option>
              <option value="expiring-compliance">Saved view: Expiring Compliance</option>
              <option value="idle-heavy">Saved view: Idle {'>'} 3h</option>
            </select>
            <button type="button" onClick={applyBulkAssignLoad} style={{ borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '6px 10px', cursor: 'pointer' }}>Bulk assign load</button>
            <button type="button" onClick={applyBulkMessage} style={{ borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '6px 10px', cursor: 'pointer' }}>Send message</button>
          </div>
        </div>

        {actionMessage && <div style={{ fontSize: 12, color: t.textSecondary }}>{actionMessage}</div>}

        <div style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead style={{ background: t.bgAlt, color: t.textSecondary, position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: 8 }}><input type="checkbox" checked={allRowsSelected} onChange={onToggleAllRows} /></th>
                <th style={{ padding: 8, textAlign: 'left' }}>Unit</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Driver</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Load ID</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Revenue</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Cost</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Margin</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Profit Badge</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Odometer</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Next Service</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Location</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Compliance</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Risk</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => {
                const margin = Number(vehicle.revenue || 0) - Number(vehicle.cost || 0);
                const isEditing = editingRowId === vehicle.id;

                return (
                  <tr key={vehicle.id} style={{ borderTop: `1px solid ${t.border}` }}>
                    <td style={{ padding: 8 }}><input type="checkbox" checked={selectedRows.includes(vehicle.id)} onChange={() => onToggleRow(vehicle.id)} /></td>
                    <td style={{ padding: 8 }}>{vehicle.unitNumber}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{ borderRadius: 999, border: `1px solid ${toneColor(t, statusTone(vehicle.status))}`, color: toneColor(t, statusTone(vehicle.status)), padding: '2px 8px' }}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td style={{ padding: 8 }}>{vehicle.driverName}</td>
                    <td style={{ padding: 8 }}>{vehicle.loadId || '—'}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{formatMoney(vehicle.revenue)}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{formatMoney(vehicle.cost)}</td>
                    <td style={{ padding: 8, textAlign: 'right', color: margin < 0 ? t.error : t.success }}>{formatMoney(margin)}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{ borderRadius: 999, border: `1px solid ${margin < 0 ? t.error : margin < 500 ? t.warning : t.success}`, color: margin < 0 ? t.error : margin < 500 ? t.warning : t.success, padding: '2px 8px', fontWeight: 700 }}>
                        {margin < 0 ? 'Loss' : margin < 500 ? 'Tight' : 'Profitable'}
                      </span>
                    </td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{Number(vehicle.odometer).toLocaleString()}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{vehicle.nextServiceMiles}</td>
                    <td style={{ padding: 8 }}>
                      <a href={`https://www.google.com/maps?q=${vehicle.currentLat},${vehicle.currentLng}`} target="_blank" rel="noreferrer" style={{ color: t.accent }}>
                        {vehicle.currentLat.toFixed(2)}, {vehicle.currentLng.toFixed(2)}
                      </a>
                    </td>
                    <td style={{ padding: 8 }}>
                      {isEditing ? (
                        <span style={{ display: 'flex', gap: 6 }}>
                          <select
                            value={editCompliance}
                            onChange={(event) => setEditCompliance(event.target.value)}
                            style={{ minHeight: 26, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text }}
                          >
                            <option value="compliant">compliant</option>
                            <option value="pending">pending</option>
                            <option value="expired">expired</option>
                          </select>
                          <button type="button" onClick={() => saveComplianceEdit(vehicle.id)} style={{ borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, cursor: 'pointer' }}>Save</button>
                        </span>
                      ) : (
                        <span style={{ color: toneColor(t, complianceTone(vehicle.compliance)) }}>{vehicle.compliance}</span>
                      )}
                    </td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{vehicle.riskScore}</td>
                    <td style={{ padding: 8 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRowId(vehicle.id);
                            setEditCompliance(vehicle.compliance);
                          }}
                          style={{ borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => assignLoadToVehicle(vehicle)} style={{ borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, cursor: 'pointer' }}>Assign load</button>
                        <button type="button" onClick={() => messageVehicleDriver(vehicle)} style={{ borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, cursor: 'pointer' }}>Send message</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={15} style={{ padding: 12, textAlign: 'center', color: t.textSecondary }}>No units match current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
