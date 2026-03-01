import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mockInvoices from '../mock/invoices';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function Invoices() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = themes[theme];
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return mockInvoices;

    return mockInvoices.filter((invoice) => {
      return (
        String(invoice.id || '').toLowerCase().includes(term) ||
        String(invoice.carrier || '').toLowerCase().includes(term)
      );
    });
  }, [query]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>Invoices</h1>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search invoice ID or carrier"
        style={{
          width: 320,
          padding: '8px 10px',
          border: `1px solid ${t.border}`,
          borderRadius: 6,
          background: t.surface,
          color: t.text,
        }}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Invoice ID</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Carrier</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Amount</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((invoice) => (
            <tr key={invoice.id}>
              <td style={{ padding: 8 }}>{invoice.id}</td>
              <td style={{ padding: 8 }}>{invoice.carrier}</td>
              <td style={{ padding: 8 }}>${Number(invoice.amount || 0).toLocaleString()}</td>
              <td style={{ padding: 8 }}>{invoice.status || '-'}</td>
              <td style={{ padding: 8 }}>
                <button type="button" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
