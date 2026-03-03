// src/pages/Customers.jsx
import { useEffect, useMemo, useState } from 'react';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { getCustomerAging, getCustomerDetail, getCustomers, sendCustomerMessage } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

function toMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default function Customers() {
  const { theme } = useTheme();
  const t = themes[theme];
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

  const panelStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
  };

  const inputStyle = {
    minHeight: 36,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '8px 10px',
    fontSize: 12,
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
    <div style={{ display: 'grid', gap: 14 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Customers</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Search, review, and open a full customer profile from one command center.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={loadCustomers} style={{ ...inputStyle, cursor: 'pointer', fontWeight: 700 }}>
            {loadingCustomers ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => selected && navigate(`/customers/${encodeURIComponent(selected)}`)}
            disabled={!selected}
            style={{
              ...inputStyle,
              cursor: selected ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              borderColor: t.accent,
            }}
          >
            Open Profile
          </button>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {[
          ['Total Customers', customerMetrics.total],
          ['Combined Revenue', toMoney(customerMetrics.totalRevenue)],
          ['Combined Open AR', toMoney(customerMetrics.openAR)],
        ].map(([label, value]) => (
          <div key={label} style={{ ...panelStyle, padding: 12 }}>
            <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </section>

      <section style={{ ...panelStyle, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, company, email, phone"
            style={{ ...inputStyle, minWidth: 280, flex: 1 }}
          />
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>

        {error && <div style={{ fontSize: 12, color: t.error }}>{error}</div>}
        {filteredCustomers.length > renderedCustomers.length && (
          <div style={{ fontSize: 12, color: t.warning }}>
            Displaying first {renderedCustomers.length.toLocaleString()} customers. Refine your search to view more.
          </div>
        )}

        <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 840, borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr style={{ background: t.bgAlt }}>
                {['Name', 'Company', 'Email', 'Phone', 'Open AR', 'Invoices', 'Actions'].map((header) => (
                  <th key={header} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderedCustomers.map((customer) => {
                const isActive = selected === customer.id;
                return (
                  <tr key={customer.id} style={{ background: isActive ? t.surfaceStrong : 'transparent' }}>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, fontWeight: 600 }}>{customer.name || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{customer.company || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{customer.email || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{customer.phone || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{toMoney(customer.openAR)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{Number(customer.invoiceCount || 0)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setSelected(customer.id)}
                          style={{ ...inputStyle, minHeight: 28, padding: '4px 8px', cursor: 'pointer' }}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/customers/${encodeURIComponent(customer.id)}`)}
                          style={{ ...inputStyle, minHeight: 28, padding: '4px 8px', cursor: 'pointer', borderColor: t.accent }}
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
                  <td colSpan={7} style={{ padding: '14px 12px', color: t.textSecondary }}>No customers found for this search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panelStyle, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Customer Preview</div>
            {!selected && <div style={{ fontSize: 12, color: t.textSecondary }}>Select a customer to load summary details.</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={!detail}
              style={{
                ...inputStyle,
                cursor: detail ? 'pointer' : 'not-allowed',
                fontWeight: 700,
              }}
            >
              Contact Customer
            </button>
            <button
              type="button"
              onClick={() => selected && navigate(`/customers/${encodeURIComponent(selected)}`)}
              disabled={!selected}
              style={{
                ...inputStyle,
                cursor: selected ? 'pointer' : 'not-allowed',
                fontWeight: 700,
                borderColor: t.accent,
              }}
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
              <div style={{ color: t.textSecondary, marginTop: 4 }}>
                {detail.contact || 'No contact'} • {detail.email || 'No email'} • {detail.phone || 'No phone'}
              </div>
              {detail.address && <div style={{ color: t.textSecondary, marginTop: 4 }}>{detail.address}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <MetricCard label="Total Revenue" value={toMoney(detail.totalRevenue)} t={t} />
              <MetricCard label="Open AR" value={toMoney(detail.openAR)} t={t} />
              <MetricCard label="Invoice Count" value={Number(detail.invoiceCount || 0)} t={t} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
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
