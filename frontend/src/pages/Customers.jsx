// src/pages/Customers.jsx
import { useEffect, useMemo, useState } from 'react';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { getCustomerAging, getCustomerDetail, getCustomers, sendCustomerMessage } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

function toMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default function Customers() {
  const { theme } = useTheme();
  const t = theme;
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [aging, setAging] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [error, setError] = useState('');
  const CUSTOMER_RENDER_LIMIT = 1000;

  const inputStyle = {
    minHeight: 34,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '7px 10px',
    fontSize: 12,
    outline: 'none',
  };

  const ghostBtn = {
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
  };

  const primaryBtn = {
    border: `1px solid ${t.accent2 || t.accent}`,
    background: `linear-gradient(135deg, ${t.accent}, ${t.accent2 || t.accent})`,
    color: t.bg,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
  };

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    setError('');
    const data = await getCustomers();
    if (data?.error) {
      setCustomers([]);
      setError(data.error);
      setLoadingCustomers(false);
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    setCustomers(rows);
    setSelected((prev) => prev || rows[0]?.id || null);
    setLoadingCustomers(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!selected) return setDetail(null);
    setLoading(true);
    Promise.all([
      getCustomerDetail(selected),
      getCustomerAging(selected),
    ]).then(([d, a]) => {
      setDetail(d);
      setAging(a);
      setLoading(false);
    });
  }, [selected]);

  // Contact modal state
  const [modalOpen, setModalOpen] = useState(false);

  // Right-click context menu state
  const [rowContextMenu, setRowContextMenu] = useState(null);

  const openCustomerContextMenu = (customer, x, y) => {
    if (!customer) return;
    const menuWidth = 240;
    const menuHeight = 260;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 720;
    const clampedX = Math.max(8, Math.min(x, vw - menuWidth - 8));
    const clampedY = Math.max(8, Math.min(y, vh - menuHeight - 8));
    setRowContextMenu({ customer, x: clampedX, y: clampedY });
  };

  useEffect(() => {
    if (!rowContextMenu) return undefined;
    const handlePointerDown = (event) => {
      if (event.target?.closest?.('[data-customer-context-menu="true"]')) return;
      setRowContextMenu(null);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setRowContextMenu(null);
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [rowContextMenu]);

  const handleSendMessage = async ({ message, customer, invoice, exception }) => {
    return await sendCustomerMessage({ message, customer, invoice, exception });
  };

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = String(query || '').trim().toLowerCase();
    if (!normalizedQuery) return customers;

    return customers.filter((customer) => [
      customer?.name,
      customer?.company,
      customer?.email,
      customer?.phone,
      customer?.id,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery)));
  }, [customers, query]);

  const customerMetrics = useMemo(() => {
    const totalRevenue = customers.reduce((sum, customer) => sum + Number(customer.totalRevenue || 0), 0);
    const openAR = customers.reduce((sum, customer) => sum + Number(customer.openAR || 0), 0);
    return {
      total: customers.length,
      totalRevenue,
      openAR,
    };
  }, [customers]);

  const renderedCustomers = useMemo(
    () => filteredCustomers.slice(0, CUSTOMER_RENDER_LIMIT),
    [filteredCustomers]
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Customers</h1>
          <div style={{ color: t.textSecondary, fontSize: 12 }}>Search, review, and open a full customer profile from one command center.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={ghostBtn} onClick={loadCustomers}>
            {loadingCustomers ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => selected && navigate(`/customers/${encodeURIComponent(selected)}`)}
            disabled={!selected}
            style={{ ...ghostBtn, cursor: selected ? 'pointer' : 'not-allowed', opacity: selected ? 1 : 0.5 }}
          >
            Open Profile
          </button>
          <button type="button" style={primaryBtn} onClick={() => navigate('/customers/new')}>
            + Add Customer
          </button>
        </div>
      </div>

      {error && <div style={{ color: t.error, fontSize: 12, padding: '4px 0' }}>{error}</div>}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {[
          ['Total Customers', customerMetrics.total],
          ['Combined Revenue', toMoney(customerMetrics.totalRevenue)],
          ['Combined Open AR', toMoney(customerMetrics.openAR)],
        ].map(([label, value]) => (
          <div key={label} style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.surface, padding: 12 }}>
            <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <section style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, overflow: 'hidden' }}>
        <header style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, company, email, phone…"
              style={{ ...inputStyle, width: 280 }}
            />
            <span style={{ color: t.textSecondary, fontSize: 12 }}>
              {filteredCustomers.length} of {customers.length} customers
            </span>
          </div>
        </header>

        {filteredCustomers.length > renderedCustomers.length && (
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.border}`, color: t.warning, fontSize: 12, background: t.bgAlt }}>
            Displaying first {renderedCustomers.length.toLocaleString()} customers. Refine search to view more rows.
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                {['Code', 'Name', 'Company', 'Email', 'Phone', 'Open AR', 'Invoices', 'Actions'].map((header) => (
                  <th key={header} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderedCustomers.map((customer) => {
                const isActive = selected === customer.id;
                return (
                  <tr
                    key={customer.id}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setSelected(customer.id);
                      openCustomerContextMenu(customer, event.clientX, event.clientY);
                    }}
                    title="Right-click for customer shortcuts"
                    style={{ background: isActive ? t.surfaceStrong : 'transparent', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '8px', borderTop: `1px solid ${t.border}`, fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                      {customer.customerCode || customer.id || '—'}
                    </td>
                    <td style={{ padding: '8px', borderTop: `1px solid ${t.border}`, fontWeight: 600 }}>
                      <a
                        href={`/customers/${encodeURIComponent(customer.id || customer._id)}`}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigate(`/customers/${encodeURIComponent(customer.id || customer._id)}`); }}
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}
                        title="Open customer profile"
                      >
                        {customer.name || '—'}
                      </a>
                    </td>
                    <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{customer.company || '—'}</td>
                    <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{customer.email || '—'}</td>
                    <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{customer.phone || '—'}</td>
                    <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{toMoney(customer.openAR)}</td>
                    <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{Number(customer.invoiceCount || 0)}</td>
                    <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setSelected(customer.id)}
                          style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11 }}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/customers/${encodeURIComponent(customer.id)}`)}
                          style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, borderColor: t.accent }}
                        >
                          Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredCustomers.length && (
                <tr>
                  <td colSpan={8} style={{ padding: 16, textAlign: 'center', borderTop: `1px solid ${t.border}`, color: t.textSecondary }}>No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Customer Preview Panel */}
      <section style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Customer Preview</div>
            {!selected && <div style={{ fontSize: 12, color: t.textSecondary }}>Select a customer to load summary details.</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={!detail}
              style={{ ...ghostBtn, cursor: detail ? 'pointer' : 'not-allowed', opacity: detail ? 1 : 0.5 }}
            >
              Contact Customer
            </button>
            <button
              type="button"
              onClick={() => selected && navigate(`/customers/${encodeURIComponent(selected)}`)}
              disabled={!selected}
              style={{ ...ghostBtn, cursor: selected ? 'pointer' : 'not-allowed', opacity: selected ? 1 : 0.5, borderColor: t.accent }}
            >
              Open Full Profile
            </button>
          </div>
        </div>

        {loading && <div style={{ fontSize: 12, color: t.textSecondary }}>Loading selected customer...</div>}
        {!loading && detail && (
          <>
            <div style={{ fontSize: 13 }}>
              <strong>{detail.name}</strong>
              <div style={{ marginTop: 4, color: t.textSecondary }}>
                {detail.contact || 'No contact'} • {detail.email || 'No email'} • {detail.phone || 'No phone'}
              </div>
              {detail.address && <div style={{ marginTop: 4, color: t.textSecondary }}>{detail.address}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 12 }}>
              <MetricCard label="Total Revenue" value={toMoney(detail.totalRevenue)} t={t} />
              <MetricCard label="Open AR" value={toMoney(detail.openAR)} t={t} />
              <MetricCard label="Invoice Count" value={Number(detail.invoiceCount || 0)} t={t} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 12 }}>
              <StatTable title="Audit Statistics" stats={detail.auditStats} t={t} />
              <StatTable title="Payment Statistics" stats={detail.paymentStats} t={t} />
              <AgingTable aging={aging} t={t} />
            </div>
          </>
        )}
      </section>

      <ContactCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSend={handleSendMessage}
        customer={detail}
        invoice={null}
        exception={null}
      />

      {/* Right-click context menu */}
      {rowContextMenu?.customer && (
        <div
          role="menu"
          data-customer-context-menu="true"
          style={{
            position: 'fixed',
            top: rowContextMenu.y,
            left: rowContextMenu.x,
            zIndex: 1200,
            minWidth: 240,
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            background: t.surface,
            boxShadow: '0 14px 30px rgba(0,0,0,0.3)',
            padding: 8,
            display: 'grid',
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={() => { setSelected(rowContextMenu.customer.id); setRowContextMenu(null); }}
            style={{ ...ghostBtn, minHeight: 34, textAlign: 'left', padding: '6px 12px' }}
          >
            Preview Customer
          </button>
          <button
            type="button"
            onClick={() => { navigate(`/customers/${encodeURIComponent(rowContextMenu.customer.id)}`); setRowContextMenu(null); }}
            style={{ ...ghostBtn, minHeight: 34, textAlign: 'left', padding: '6px 12px' }}
          >
            Open Customer Profile
          </button>
          <button
            type="button"
            onClick={() => { setSelected(rowContextMenu.customer.id); setModalOpen(true); setRowContextMenu(null); }}
            style={{ ...ghostBtn, minHeight: 34, textAlign: 'left', padding: '6px 12px' }}
          >
            Contact Customer
          </button>
          <hr style={{ border: 'none', borderTop: `1px solid ${t.border}`, margin: '2px 0' }} />
          <button
            type="button"
            onClick={() => { navigate('/customers/new'); setRowContextMenu(null); }}
            style={{ ...ghostBtn, minHeight: 34, textAlign: 'left', padding: '6px 12px' }}
          >
            + Add Customer
          </button>
          <button
            type="button"
            onClick={() => { loadCustomers(); setRowContextMenu(null); }}
            style={{ ...ghostBtn, minHeight: 34, textAlign: 'left', padding: '6px 12px' }}
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 11, color: t.textSecondary }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function StatTable({ title, stats, t }) {
  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ fontSize: 12, color: t.textSecondary, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt }}>
        {title}
      </div>
      <table style={{ width: '100%', fontSize: 13 }}>
        <tbody>
          {Object.entries(stats || {}).map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: '6px 10px', color: t.textSecondary }}>{k.charAt(0).toUpperCase() + k.slice(1)}</td>
              <td style={{ padding: '6px 10px', fontWeight: 600 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgingTable({ aging, t }) {
  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ fontSize: 12, color: t.textSecondary, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt }}>
        Aging Buckets
      </div>
      <table style={{ width: '100%', fontSize: 13 }}>
        <tbody>
          {Object.entries(aging || {}).map(([bucket, amount]) => (
            <tr key={bucket}>
              <td style={{ padding: '6px 10px' }}>{bucket}</td>
              <td style={{ padding: '6px 10px', fontWeight: 600 }}>{toMoney(amount)}</td>
            </tr>
          ))}
          {!aging && (
            <tr>
              <td colSpan={2} style={{ padding: '8px 10px', color: t.textSecondary }}>Aging data unavailable.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
