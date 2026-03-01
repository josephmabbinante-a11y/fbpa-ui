import { useEffect, useMemo, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import { getCarriers } from '../api/client';

export default function Carriers() {
  const { theme } = useTheme();
  const t = themes[theme];
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const headerStyle = {
    marginBottom: 20,
  };

  const titleStyle = {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  };

  const subtitleStyle = {
    fontSize: 14,
    color: t.textSecondary,
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCarriers()
      .then((data) => {
        if (!mounted) return;
        if (data && data.error) {
          setError(data.error);
          setCarriers([]);
          return;
        }
        setCarriers(Array.isArray(data?.carriers) ? data.carriers : data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || String(err));
        setCarriers([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filterBarStyle = {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  };

  const filterInputStyle = {
    padding: '8px 12px',
    borderRadius: 4,
    border: `1px solid ${t.border}`,
    backgroundColor: t.surface,
    color: t.text,
    fontSize: 12,
  };

  const tableWrapperStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle = {
    backgroundColor: t.bgAlt,
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: t.textSecondary,
    borderBottom: `1px solid ${t.border}`,
  };

  const tdStyle = {
    padding: '12px 16px',
    fontSize: 13,
    borderBottom: `1px solid ${t.border}`,
  };

  const statusBadgeStyle = (status) => {
    let bg, fg;
    if (status === 'Active') {
      bg = '#10b98150';
      fg = '#059669';
    } else if (status === 'Inactive') {
      bg = '#9ca3af50';
      fg = '#6b7280';
    } else if (status === 'Alert') {
      bg = '#ef444450';
      fg = '#dc2626';
    }
    return {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: 3,
      backgroundColor: bg,
      color: fg,
      fontSize: 11,
      fontWeight: 600,
    };
  };

  const complianceAlerts = useMemo(() => {
    return carriers
      .filter((carrier) => !carrier.mcNumber || !carrier.taxId)
      .slice(0, 3)
      .map((carrier) => {
        if (!carrier.mcNumber) return `${carrier.name} - MC number missing.`;
        if (!carrier.taxId) return `${carrier.name} - Tax ID missing.`;
        return `${carrier.name} - Compliance review needed.`;
      });
  }, [carriers]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>🚛 Carriers</div>
        <div style={subtitleStyle}>Carriers are created automatically from AP invoices. Use this view to manage profiles and compliance.</div>
      </div>

      {loading && <div style={{ color: t.textSecondary, marginBottom: 12 }}>Loading carriers...</div>}
      {error && <div style={{ color: t.error, marginBottom: 12 }}>Failed to load carriers: {error}</div>}

      <div style={filterBarStyle}>
        <input type="text" placeholder="Search carrier..." style={filterInputStyle} />
        <input type="text" placeholder="Search MC #..." style={filterInputStyle} />
        <select style={filterInputStyle} defaultValue="all">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="alert">Alert</option>
        </select>
        <select style={filterInputStyle} defaultValue="all">
          <option value="all">Compliance</option>
          <option value="compliant">Compliant</option>
          <option value="issues">Issues</option>
        </select>
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Carrier Name</th>
              <th style={thStyle}>MC #</th>
              <th style={thStyle}>Tax ID</th>
              <th style={thStyle}>Total Spend</th>
              <th style={thStyle}>Open AP</th>
              <th style={thStyle}>Invoice Count</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {carriers.map((carrier) => {
              const status = carrier.status || (!carrier.mcNumber || !carrier.taxId ? 'Alert' : 'Active');
              return (
                <tr key={carrier.id || carrier.mcNumber || carrier.name}>
                  <td style={tdStyle}><strong>{carrier.name}</strong></td>
                  <td style={tdStyle}>{carrier.mcNumber || '—'}</td>
                  <td style={tdStyle}>{carrier.taxId || 'Missing'}</td>
                  <td style={tdStyle}>${Number(carrier.totalSpend || 0).toLocaleString()}</td>
                  <td style={tdStyle}>${Number(carrier.openAP || 0).toLocaleString()}</td>
                  <td style={tdStyle}>{Number(carrier.invoiceCount || 0)}</td>
                  <td style={tdStyle}><div style={statusBadgeStyle(status)}>{status}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 32, backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>⚠️ Compliance Alerts</div>
        {complianceAlerts.length === 0 ? (
          <div style={{ fontSize: 13, color: t.textSecondary }}>No compliance alerts.</div>
        ) : (
          <ul style={{ fontSize: 13, lineHeight: 1.8, color: t.textSecondary, listStyle: 'none', padding: 0, margin: 0 }}>
            {complianceAlerts.map((alert, idx) => (
              <li key={alert} style={{ paddingBottom: idx < complianceAlerts.length - 1 ? 8 : 0, borderBottom: idx < complianceAlerts.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                {alert}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
