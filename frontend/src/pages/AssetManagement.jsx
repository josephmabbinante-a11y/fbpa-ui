import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';

const FALLBACK_ASSETS = [
  { id: 'veh-101', unitNumber: 'T-101', status: 'active', compliance: 'compliant', odometer: 432188, nextServiceMiles: 1200, mpg: 7.4 },
  { id: 'veh-102', unitNumber: 'T-102', status: 'idle', compliance: 'pending', odometer: 398111, nextServiceMiles: 680, mpg: 6.1 },
  { id: 'veh-103', unitNumber: 'T-103', status: 'breakdown', compliance: 'pending', odometer: 512233, nextServiceMiles: -120, mpg: 5.8 },
  { id: 'veh-104', unitNumber: 'T-104', status: 'yard', compliance: 'compliant', odometer: 344220, nextServiceMiles: 3100, mpg: 7.8 },
  { id: 'veh-106', unitNumber: 'T-106', status: 'maintenance', compliance: 'compliant', odometer: 446900, nextServiceMiles: -460, mpg: 5.9 },
];

function tone(themeObj, key) {
  if (key === 'error') return themeObj.error;
  if (key === 'warning') return themeObj.warning;
  return themeObj.success;
}

export default function AssetManagement() {
  const { theme } = useTheme();
  const t = theme;

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setLoading(true);
      try {
        const vehiclesRes = await fetch('/api/vehicles');
        if (!vehiclesRes.ok) throw new Error('vehicles api unavailable');
        const vehiclesApi = await vehiclesRes.json();
        const normalized = (Array.isArray(vehiclesApi) ? vehiclesApi : []).map((vehicle, index) => ({
          id: String(vehicle._id || `veh-${index}`),
          unitNumber: String(vehicle.unitNumber || `T-${100 + index}`),
          status: String(vehicle.status || 'active').toLowerCase(),
          compliance: Number(vehicle.nextServiceMiles || 0) < 0 ? 'pending' : 'compliant',
          odometer: Number(vehicle.odometer || 250000 + index * 5500),
          nextServiceMiles: Number.isFinite(Number(vehicle.nextServiceMiles)) ? Number(vehicle.nextServiceMiles) : 1500,
          mpg: Number(vehicle.mpg || (7.2 - (index * 0.2))).toFixed(1),
        }));

        if (active) {
          setAssets(normalized.length ? normalized : FALLBACK_ASSETS);
          setSource('api');
        }
      } catch {
        if (active) {
          setAssets(FALLBACK_ASSETS);
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

  const filteredAssets = useMemo(() => {
    let rows = [...assets];
    if (statusFilter !== 'all') {
      rows = rows.filter((asset) => asset.status === statusFilter);
    }
    const query = String(search || '').trim().toLowerCase();
    if (query) {
      rows = rows.filter((asset) =>
        [asset.unitNumber, asset.status, asset.compliance]
          .some((value) => String(value || '').toLowerCase().includes(query))
      );
    }
    return rows.sort((a, b) => a.nextServiceMiles - b.nextServiceMiles);
  }, [assets, search, statusFilter]);

  const summary = useMemo(() => {
    const total = assets.length;
    const critical = assets.filter((asset) => Number(asset.nextServiceMiles || 0) < 0 || asset.status === 'breakdown').length;
    const warning = assets.filter((asset) => Number(asset.nextServiceMiles || 0) >= 0 && Number(asset.nextServiceMiles || 0) < 800).length;
    const avgMpg = total ? Number((assets.reduce((sum, asset) => sum + Number(asset.mpg || 0), 0) / total).toFixed(1)) : 0;
    return { total, critical, warning, avgMpg };
  }, [assets]);

  const scheduleService = (assetId) => {
    setAssets((current) => current.map((asset) => (
      asset.id === assetId ? { ...asset, status: 'maintenance', nextServiceMiles: Math.min(Number(asset.nextServiceMiles || 0), 120) } : asset
    )));
    setMessage('Service scheduled for selected asset.');
  };

  const markCompliant = (assetId) => {
    setAssets((current) => current.map((asset) => (
      asset.id === assetId ? { ...asset, compliance: 'compliant', nextServiceMiles: Math.max(1800, Number(asset.nextServiceMiles || 0)) } : asset
    )));
    setMessage('Asset marked compliant.');
  };

  if (loading) {
    return <div style={{ color: t.textSecondary, padding: 24 }}>Loading asset management...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            <Link to="/fleet" style={{ color: t.textSecondary, textDecoration: 'none' }}>Fleet Dashboard</Link>
            <span>  ›  </span>
            <strong style={{ color: t.text }}>Asset Management</strong>
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Asset Management</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Source: {source === 'api' ? 'Live API' : 'Fallback data'} • Fleet asset inventory, maintenance, and compliance</div>
        </div>
      </div>

      <section style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: t.surface, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, padding: 10 }}><div style={{ fontSize: 11, color: t.textSecondary }}>Total Assets</div><div style={{ fontSize: 24, fontWeight: 800 }}>{summary.total}</div></div>
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, padding: 10 }}><div style={{ fontSize: 11, color: t.textSecondary }}>Critical Queue</div><div style={{ fontSize: 24, fontWeight: 800, color: tone(t, 'error') }}>{summary.critical}</div></div>
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, padding: 10 }}><div style={{ fontSize: 11, color: t.textSecondary }}>Warning Queue</div><div style={{ fontSize: 24, fontWeight: 800, color: tone(t, 'warning') }}>{summary.warning}</div></div>
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, padding: 10 }}><div style={{ fontSize: 11, color: t.textSecondary }}>Fleet Avg MPG</div><div style={{ fontSize: 24, fontWeight: 800 }}>{summary.avgMpg}</div></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search unit, status, compliance"
              style={{ minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '7px 10px', minWidth: 260 }}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{ minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '7px 10px' }}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="maintenance">Maintenance</option>
              <option value="breakdown">Breakdown</option>
              <option value="yard">Yard</option>
            </select>
          </div>
          {message ? <span style={{ fontSize: 12, color: t.textSecondary }}>{message}</span> : null}
        </div>

        <div style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ background: t.bgAlt, color: t.textSecondary }}>
              <tr>
                <th style={{ padding: 8, textAlign: 'left' }}>Unit</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Compliance</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Odometer</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Next Service</th>
                <th style={{ padding: 8, textAlign: 'right' }}>MPG</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} style={{ borderTop: `1px solid ${t.border}` }}>
                  <td style={{ padding: 8 }}>{asset.unitNumber}</td>
                  <td style={{ padding: 8 }}>{asset.status}</td>
                  <td style={{ padding: 8, color: asset.compliance === 'compliant' ? t.success : t.warning }}>{asset.compliance}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{Number(asset.odometer || 0).toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: Number(asset.nextServiceMiles || 0) < 0 ? t.error : Number(asset.nextServiceMiles || 0) < 800 ? t.warning : t.text }}>{asset.nextServiceMiles}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{asset.mpg}</td>
                  <td style={{ padding: 8 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => scheduleService(asset.id)} style={{ borderRadius: 6, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: 'pointer' }}>Schedule service</button>
                      <button type="button" onClick={() => markCompliant(asset.id)} style={{ borderRadius: 6, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: 'pointer' }}>Mark compliant</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 12, textAlign: 'center', color: t.textSecondary }}>No assets match current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}