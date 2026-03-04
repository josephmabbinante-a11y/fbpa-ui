import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { getCustomerAging, getCustomerDetail, sendCustomerMessage } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';

function toMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default function CustomerProfile() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = theme;

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [aging, setAging] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!customerId) return;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      const [detailResult, agingResult] = await Promise.all([
        getCustomerDetail(customerId),
        getCustomerAging(customerId),
      ]);

      if (detailResult?.error) {
        setError(detailResult.error);
        setDetail(null);
        setAging(null);
        setLoading(false);
        return;
      }

      setDetail(detailResult || null);
      setAging(agingResult?.error ? null : agingResult);
      setLoading(false);
    };

    loadProfile();
  }, [customerId]);

  const handleSendMessage = async ({ message, customer, invoice, exception }) => (
    sendCustomerMessage({ message, customer, invoice, exception })
  );

  const billingChartData = useMemo(() => {
    if (!detail?.analysis) return [];
    return [
      { name: 'Billed', value: Number(detail.analysis.totalBilled || 0) },
      { name: 'Paid', value: Number(detail.analysis.totalPaid || 0) },
      { name: 'Outstanding', value: Number(detail.analysis.totalOutstanding || 0) },
      { name: 'Overdue', value: Number(detail.analysis.totalOverdue || 0) },
    ];
  }, [detail]);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate('/customers')}
            style={{
              minHeight: 32,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              background: t.bgAlt,
              color: t.text,
              padding: '6px 10px',
              fontSize: 12,
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            Back to Customers
          </button>
          <h1 style={{ margin: 0, fontSize: 26 }}>Customer Profile</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            Deep account view with AR, payment, and aging performance.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={!detail}
          style={{
            minHeight: 36,
            borderRadius: 8,
            border: `1px solid ${t.accent}`,
            background: t.bgAlt,
            color: t.textPrimary,
            padding: '8px 10px',
            fontSize: 12,
            cursor: detail ? 'pointer' : 'not-allowed',
            fontWeight: 700,
          }}
        >
          Contact Customer
        </button>
      </header>

      {loading && <div style={{ fontSize: 12, color: t.textSecondary }}>Loading customer profile...</div>}
      {error && <div style={{ fontSize: 12, color: t.error }}>{error}</div>}

      {!loading && detail && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!detail}
            style={{
              minHeight: 36,
              borderRadius: 8,
              border: `1px solid ${t.accent}`,
              background: t.accent,
              color: t.surface,
              padding: '8px 10px',
              fontSize: 12,
              cursor: detail ? 'pointer' : 'not-allowed',
              fontWeight: 700,
            }}
          >
            Contact Customer
          </button>
              <MetricCard label="Total Revenue" value={toMoney(detail.totalRevenue)} t={t} />
              <MetricCard label="Open AR" value={toMoney(detail.openAR)} t={t} />
              <MetricCard label="Invoice Count" value={Number(detail.invoiceCount || 0)} t={t} />
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: t.surface, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Audit Statistics</div>
              <StatTable stats={detail.auditStats} t={t} />
              <div style={{ height: 220, marginTop: 8, background: t.bgAlt, borderRadius: 8, padding: 8 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                  <BarChart data={Object.entries(detail.auditStats || {}).map(([name, value]) => ({ name, value }))}>
                    <XAxis dataKey="name" stroke={t.textSecondary} />
                    <YAxis stroke={t.textSecondary} />
                    <Tooltip />
                    <Bar dataKey="value" fill={t.accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: t.surface, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Payment Statistics</div>
              <StatTable stats={detail.paymentStats} t={t} />
              <div style={{ height: 220, marginTop: 8, background: t.bgAlt, borderRadius: 8, padding: 8 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                  <BarChart data={Object.entries(detail.paymentStats || {}).map(([name, value]) => ({ name, value }))}>
                    <XAxis dataKey="name" stroke={t.textSecondary} />
                    <YAxis stroke={t.textSecondary} />
                    <Tooltip />
                    <Bar dataKey="value" fill={t.positive} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: t.surface, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Billing Analysis</div>
              <AnalysisTable analysis={detail.analysis} t={t} />
              <div style={{ height: 220, marginTop: 8, background: t.bgAlt, borderRadius: 8, padding: 8 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                  <BarChart data={billingChartData}>
                    <XAxis dataKey="name" stroke={t.textSecondary} />
                    <YAxis stroke={t.textSecondary} />
                    <Tooltip />
                    <Bar dataKey="value" fill={t.accent2} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: t.surface, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Aging Buckets</div>
              <AgingTable aging={aging} t={t} />
              {!!aging && (
                <div style={{ height: 220, marginTop: 8, background: t.bgAlt, borderRadius: 8, padding: 8 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                    <PieChart>
                      <Pie
                        data={Object.entries(aging).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={72}
                        label
                      >
                        {Object.entries(aging).map(([name], index) => (
                          <Cell key={name} fill={[t.accent, t.positive, t.warning, t.error][index % 4]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        </>
      )}

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
    <div style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 11, color: t.textSecondary }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function StatTable({ stats, t }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <tbody>
        {Object.entries(stats || {}).map(([key, value]) => (
          <tr key={key}>
            <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}`, color: t.textSecondary }}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </td>
            <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}`, fontWeight: 600 }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AnalysisTable({ analysis, t }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <tbody>
        {Object.entries(analysis || {}).map(([key, value]) => (
          <tr key={key}>
            <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}`, color: t.textSecondary }}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase())}
            </td>
            <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}`, fontWeight: 600 }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AgingTable({ aging, t }) {
  if (!aging) {
    return <div style={{ fontSize: 12, color: t.textSecondary }}>Aging data unavailable.</div>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: `1px solid ${t.border}`, color: t.textSecondary }}>Bucket</th>
          <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: `1px solid ${t.border}`, color: t.textSecondary }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(aging).map(([bucket, amount]) => (
          <tr key={bucket}>
            <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}` }}>{bucket}</td>
            <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}`, fontWeight: 600 }}>{toMoney(amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
