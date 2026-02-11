// src/pages/Customers.jsx
import { useEffect, useState } from 'react';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { sendCustomerMessage } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTheme, themes } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

export default function Customers() {
  const { theme } = useTheme();
  const t = themes[theme];
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [aging, setAging] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', address: '' });
  const [formError, setFormError] = useState('');
  const [csvStatus, setCsvStatus] = useState('');

  useEffect(() => {
    fetch('/api/customers')
      .then((r) => r.json())
      .then(setCustomers);
  }, []);

  useEffect(() => {
    if (!selected) return setDetail(null);
    setLoading(true);
    Promise.all([
      fetch(`/api/customers/${selected}`).then((r) => r.json()),
      fetch(`/api/customers/${selected}/aging`).then((r) => r.json()),
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

  return (
    <div style={{ padding: 32, background: t.bg, color: t.text, minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Customers</h1>
      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ minWidth: 260 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Customer List</h2>
          <button
            id="create-customer-btn"
            style={{ marginBottom: 12, padding: '8px 12px', background: t.accent, color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', width: '100%' }}
            onClick={() => { setShowModal(true); setForm({ name: '', contact: '', email: '', phone: '', address: '' }); setFormError(''); }}
          >
            + Create Customer
          </button>
          <form
            id="csv-upload-form"
            style={{ marginBottom: 16 }}
            onSubmit={async (e) => {
              e.preventDefault();
              setCsvStatus('');
              const file = e.target.elements.csvfile.files[0];
              if (!file) return setCsvStatus('Please select a CSV file.');
              const formData = new FormData();
              formData.append('file', file);
              setCsvStatus('Uploading...');
              const res = await fetch('/api/customers/upload-csv', { method: 'POST', body: formData });
              if (res.ok) {
                setCsvStatus('Upload successful!');
                fetch('/api/customers').then(r => r.json()).then(setCustomers);
              } else {
                setCsvStatus('Upload failed.');
              }
              e.target.reset();
            }}
          >
            <input type="file" name="csvfile" accept=".csv" style={{ marginBottom: 4 }} />
            <button type="submit" style={{ marginLeft: 8, padding: '4px 10px', borderRadius: 4, border: 'none', background: t.surface, color: t.text, fontWeight: 500, cursor: 'pointer' }}>Upload CSV</button>
            {csvStatus && <div style={{ fontSize: 12, color: csvStatus.includes('success') ? t.positive : t.error }}>{csvStatus}</div>}
          </form>
          <ul id="customer-list" style={{ listStyle: 'none', padding: 0 }}>
            {customers.map((c) => (
              <li key={c.id}>
                <button
                  style={{
                    background: selected === c.id ? t.accent : t.surface,
                    color: selected === c.id ? '#fff' : t.text,
                    border: `1px solid ${t.border}`,
                    borderRadius: 4,
                    padding: '8px 12px',
                    marginBottom: 8,
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelected(c.id)}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
              {/* Modal for creating customer */}
              {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: t.surface, color: t.text, padding: 32, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Create Customer</h2>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setFormError('');
                      if (!form.name) return setFormError('Name is required');
                      const res = await fetch('/api/customers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(form),
                      });
                      if (res.ok) {
                        setShowModal(false);
                        fetch('/api/customers').then(r => r.json()).then(setCustomers);
                      } else {
                        setFormError('Failed to create customer');
                      }
                    }} style={{ display: 'grid', gap: 12 }}>
                      <input autoFocus placeholder="Name*" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
                      <input placeholder="Contact" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
                      <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
                      <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
                      <input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
                      {formError && <div style={{ color: t.error, fontSize: 13 }}>{formError}</div>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button type="submit" style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Create</button>
                        <button type="button" style={{ background: t.bgAlt, color: t.text, border: `1px solid ${t.border}`, borderRadius: 4, padding: '8px 16px', fontWeight: 500, cursor: 'pointer' }} onClick={() => setShowModal(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
        <div style={{ flex: 1 }} id="customer-analysis">
          {!selected && <div style={{ color: t.textSecondary }}>Select a customer to view details.</div>}
          {loading && <div>Loading...</div>}
          {detail && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>{detail.name}</h2>
                  <div style={{ marginBottom: 12, color: t.textSecondary }}>
                    {detail.contact} | {detail.email} | {detail.phone}
                  </div>
                  <div style={{ marginBottom: 16 }}>{detail.address}</div>
                </div>
                <button
                  style={{
                    background: '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '7px 18px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    marginLeft: 'auto',
                    marginTop: 8,
                    height: 36,
                  }}
                  onClick={() => setModalOpen(true)}
                >
                  Contact Customer
                </button>
              </div>
              <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Audit Statistics</h3>
                  <StatTable stats={detail.auditStats} t={t} />
                  <div style={{ height: 180, marginTop: 8, background: t.bgAlt, borderRadius: 8, padding: 8 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(detail.auditStats).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }))}>
                        <XAxis dataKey="name" stroke={t.textSecondary} />
                        <YAxis stroke={t.textSecondary} />
                        <Tooltip />
                        <Bar dataKey="value" fill={t.accent} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Payment Statistics</h3>
                  <StatTable stats={detail.paymentStats} t={t} />
                  <div style={{ height: 180, marginTop: 8, background: t.bgAlt, borderRadius: 8, padding: 8 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(detail.paymentStats).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }))}>
                        <XAxis dataKey="name" stroke={t.textSecondary} />
                        <YAxis stroke={t.textSecondary} />
                        <Tooltip />
                        <Bar dataKey="value" fill={t.positive} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Detailed Analysis</h3>
                <AnalysisTable analysis={detail.analysis} t={t} />
                {/* Billing Bar Chart */}
                <div style={{ height: 220, marginTop: 16, background: t.bgAlt, borderRadius: 8, padding: 12 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Billed', value: detail.analysis.totalBilled },
                      { name: 'Paid', value: detail.analysis.totalPaid },
                      { name: 'Outstanding', value: detail.analysis.totalOutstanding },
                      { name: 'Overdue', value: detail.analysis.totalOverdue },
                    ]}>
                      <XAxis dataKey="name" stroke={t.textSecondary} />
                      <YAxis stroke={t.textSecondary} />
                      <Tooltip />
                      <Bar dataKey="value" fill={t.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aging Report</h3>
                {aging ? (
                  <>
                    <AgingTable aging={aging} t={t} />
                    {/* Aging Pie Chart */}
                    <div style={{ height: 220, marginTop: 16, background: t.bgAlt, borderRadius: 8, padding: 12 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(aging).map(([bucket, value]) => ({ name: bucket, value }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label
                          >
                            {Object.entries(aging).map((entry, idx) => (
                              <Cell key={entry[0]} fill={[t.accent, t.positive, t.warning, t.error][idx % 4]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : <span>Loading aging report...</span>}
              </div>
              <ContactCustomerModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSend={handleSendMessage}
                customer={detail}
                invoice={null}
                exception={null}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTable({ stats, t }) {
  return (
    <table style={{ fontSize: 13, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4, marginBottom: 8 }}>
      <tbody>
        {Object.entries(stats).map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: '4px 10px', color: t.textSecondary }}>{k.charAt(0).toUpperCase() + k.slice(1)}</td>
            <td style={{ padding: '4px 10px', fontWeight: 600 }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AnalysisTable({ analysis, t }) {
  return (
    <table style={{ fontSize: 13, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4, marginBottom: 8 }}>
      <tbody>
        {Object.entries(analysis).map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: '4px 10px', color: t.textSecondary }}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</td>
            <td style={{ padding: '4px 10px', fontWeight: 600 }}>{typeof v === 'number' ? v.toLocaleString() : v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AgingTable({ aging, t }) {
  return (
    <table style={{ fontSize: 13, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4, marginBottom: 8 }}>
      <thead>
        <tr>
          <th style={{ padding: '4px 10px', color: t.textSecondary }}>Aging Bucket</th>
          <th style={{ padding: '4px 10px', color: t.textSecondary }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(aging).map(([bucket, amount]) => (
          <tr key={bucket}>
            <td style={{ padding: '4px 10px' }}>{bucket}</td>
            <td style={{ padding: '4px 10px', fontWeight: 600 }}>{amount.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
