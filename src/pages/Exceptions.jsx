import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { getExceptions, sendCustomerMessage } from '../api/client';
import { useDemo } from '../demo/DemoContext';
import mockExceptions from '../mock/exceptions';
import { useTheme, themes } from '../contexts/ThemeContext';

const CATEGORIES = ['Rate Discrepancy', 'Missing Docs', 'Duplicate', 'Other'];
const ACTIONS = ['Review', 'Approve', 'Reject', 'Escalate'];

export default function Exceptions() {
  const { demoMode } = useDemo();
  const { theme } = useTheme();
  const t = themes[theme];

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState({});
  const [actions, setActions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalException, setModalException] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (demoMode) {
      Promise.resolve().then(() => {
        if (!mounted) return;
        setData(mockExceptions.exceptions || []);
        setError(null);
        setLoading(false);
      });
      return () => {
        mounted = false;
      };
    }

    Promise.resolve().then(() => {
      if (mounted) setLoading(true);
    });

    getExceptions()
      .then((res) => {
        if (!mounted) return;
        if (res && !res.error && Array.isArray(res.exceptions)) {
          setData(res.exceptions);
        } else if (res?.error) {
          setError(res.error);
          setData([]);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || String(err));
        setData([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [demoMode]);

  const statuses = useMemo(() => {
    const set = new Set(data.map((e) => e.status));
    return ['All', ...Array.from(set)];
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((e) => {
      const invoice = (e.invoiceNumber || '').toLowerCase();
      const carrier = (e.carrier || '').toLowerCase();
      const reason = (e.reason || '').toLowerCase();
      const term = query.trim().toLowerCase();
      const matchesQuery = !term || invoice.includes(term) || carrier.includes(term) || reason.includes(term);
      const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [data, query, statusFilter]);

  const handleSendMessage = async ({ message, customer, invoice, exception }) => {
    return sendCustomerMessage({ message, customer, invoice, exception });
  };

  if (loading) {
    return <div style={{ padding: 24, color: t.textSecondary }}>Loading exceptions...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Exceptions</h1>
        {error ? <span style={{ fontSize: 12, color: t.warning }}>{error}</span> : null}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <input
          type="text"
          placeholder="Search by invoice, carrier, or reason"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: 6, background: t.surface, color: t.text }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 10px', border: `1px solid ${t.border}`, borderRadius: 6, background: t.surface, color: t.text }}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Invoice</th>
            <th style={{ textAlign: 'left' }}>Carrier</th>
            <th style={{ textAlign: 'left' }}>Amount</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Category</th>
            <th style={{ textAlign: 'left' }}>Action</th>
            <th style={{ textAlign: 'left' }}>Created</th>
            <th style={{ textAlign: 'left' }}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((ex) => (
            <tr key={ex.id}>
              <td>{ex.invoiceNumber}</td>
              <td>{ex.carrier}</td>
              <td>${Number(ex.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td>{ex.status}</td>
              <td>
                <select
                  value={categories[ex.id] || ''}
                  onChange={(e) => setCategories((prev) => ({ ...prev, [ex.id]: e.target.value }))}
                >
                  <option value="">Uncategorized</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={actions[ex.id] || ''}
                  onChange={(e) => setActions((prev) => ({ ...prev, [ex.id]: e.target.value }))}
                >
                  <option value="">No Action</option>
                  {ACTIONS.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>
              </td>
              <td>{new Date(ex.createdAt).toLocaleDateString()}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <Link to={`/exceptions/${ex.id}`}>Drilldown</Link>
                <button
                  type="button"
                  onClick={() => {
                    setModalException(ex);
                    setModalOpen(true);
                  }}
                >
                  Contact
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ContactCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSend={handleSendMessage}
        exception={modalException}
        customer={null}
        invoice={null}
      />
    </div>
  );
}
