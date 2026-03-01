import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExceptions } from '../api/client';
import mockExceptions from '../mock/exceptions';
import { useTheme, themes } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import { useApi } from '../hooks/useApi';

function normalizeExceptionsResponse(response) {
  // Safely extract exceptions array from response
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.exceptions)) return response.exceptions;
  return null; // Return null to trigger fallback to mockExceptions
}

export default function Exceptions() {
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = themes[theme];
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: rawData, loading, error } = useApi(() => getExceptions(), demoMode ? mockExceptions : null, [demoMode]);
  const source = useMemo(() => {
    const normalized = normalizeExceptionsResponse(rawData);
    if (normalized) return normalized;
    return demoMode && Array.isArray(mockExceptions?.exceptions) ? mockExceptions.exceptions : [];
  }, [demoMode, rawData]);
  const statuses = useMemo(() => ['All', ...new Set(source.map((e) => e.status).filter(Boolean))], [source]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return source.filter((item) => {
      const matchesQuery =
        !term ||
        String(item.invoiceNumber || '').toLowerCase().includes(term) ||
        String(item.carrier || '').toLowerCase().includes(term) ||
        String(item.reason || '').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, source, statusFilter]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Exceptions</h1>
        {error ? <span style={{ fontSize: 12, color: t.warning }}>{demoMode ? `Using fallback data: ${error}` : `Unable to load exceptions: ${error}`}</span> : null}
      </div>
      {loading ? <div style={{ fontSize: 13, color: t.textSecondary }}>Loading exceptions...</div> : null}

      <div style={{ display: 'flex', gap: 12 }}>
        <input
          type="text"
          placeholder="Search by invoice, carrier, or reason"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ flex: 1, padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: 6, background: t.surface, color: t.text }}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={{ padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: 6, background: t.surface, color: t.text }}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Invoice</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Carrier</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Amount</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Created</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: 8 }}>{item.invoiceNumber}</td>
              <td style={{ padding: 8 }}>{item.carrier}</td>
              <td style={{ padding: 8 }}>${Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style={{ padding: 8 }}>{item.status}</td>
              <td style={{ padding: 8 }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
              <td style={{ padding: 8 }}>
                <Link to={`/exceptions/${item.id}`}>Drilldown</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
