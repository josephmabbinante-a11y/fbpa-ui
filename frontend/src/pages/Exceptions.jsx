import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getExceptions } from '../api/client';
import mockExceptions from '../mock/exceptions';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import { useApi } from '../hooks/useApi';

function normalizeExceptionsResponse(response) {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.exceptions)) return response.exceptions;
  return null;
}

const AUDIT_COLORS = { approved: '#10b981', rejected: '#ef4444', pending: '#f59e0b', auto_resolved: '#6366f1' };
const SOURCE_LABELS = { carrier_invoice: 'Carrier Invoice', qr_scan: 'QR Code', manual_upload: 'Manual', system_rule: 'System', edi: 'EDI' };

export default function Exceptions() {
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const navigate = useNavigate();
  const t = theme;
  t.accent2 = t.accent2 || '#888';
  t.textSecondary = t.textSecondary || '#666';
  t.border = t.border || '#ccc';
  t.surface = t.surface || '#fff';
  t.bg = t.bg || '#f8f8f8';

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [auditFilter, setAuditFilter] = useState('All');

  const { data: rawData, loading, error } = useApi(() => getExceptions(), demoMode ? mockExceptions : null, [demoMode]);
  const source = useMemo(() => {
    const normalized = normalizeExceptionsResponse(rawData);
    if (normalized) return normalized;
    return demoMode && Array.isArray(mockExceptions?.exceptions) ? mockExceptions.exceptions : [];
  }, [demoMode, rawData]);
  const statuses = useMemo(() => ['All', ...new Set(source.map((e) => e.status).filter(Boolean))], [source]);
  const auditStatuses = useMemo(() => ['All', ...new Set(source.map((e) => e.auditAction || 'pending').filter(Boolean))], [source]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return source.filter((item) => {
      const matchesQuery =
        !term ||
        String(item.invoiceNumber || '').toLowerCase().includes(term) ||
        String(item.carrier || '').toLowerCase().includes(term) ||
        String(item.reason || '').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesAudit = auditFilter === 'All' || (item.auditAction || 'pending') === auditFilter;
      return matchesQuery && matchesStatus && matchesAudit;
    });
  }, [query, source, statusFilter, auditFilter]);

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
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select
          value={auditFilter}
          onChange={(event) => setAuditFilter(event.target.value)}
          style={{ padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: 6, background: t.surface, color: t.text }}
        >
          {auditStatuses.map((a) => (
            <option key={a} value={a}>{a === 'All' ? 'All Audits' : a}</option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: '1rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Invoice</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Carrier</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Amount</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Audit</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Source</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Created</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: 8 }}>{item.invoiceNumber}</td>
              <td style={{ padding: 8 }}>{item.carrier ? <a href={`/carriers/profile/${encodeURIComponent(item.carrier)}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/carriers/profile/${encodeURIComponent(item.carrier)}`); }} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>{item.carrier}</a> : '—'}</td>
              <td style={{ padding: 8 }}>${Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style={{ padding: 8 }}>{item.status}</td>
              <td style={{ padding: 8 }}>
                <span style={{ color: AUDIT_COLORS[item.auditAction] || AUDIT_COLORS.pending, fontWeight: 600 }}>
                  {item.auditAction || 'pending'}
                </span>
              </td>
              <td style={{ padding: 8 }}>{item.source ? (SOURCE_LABELS[item.source] || item.source) : '-'}</td>
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
