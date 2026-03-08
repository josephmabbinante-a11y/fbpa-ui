import { useEffect, useMemo, useState } from 'react';
import { createInvoice, getInvoices } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';

const apBuckets = [
  { bucket: 'Current', color: '#10b981', label: '0-30 Days' },
  { bucket: 'Due Soon', color: '#f59e0b', label: '31-60 Days' },
  { bucket: 'Overdue', color: '#ef4444', label: '61-90 Days' },
  { bucket: 'Critical', color: '#7c3aed', label: '90+ Days' },
];

function getBucketIndex(dueDate) {
  if (!dueDate) return 0;
  const days = Math.floor((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 30) return 0;
  if (days <= 60) return 1;
  if (days <= 90) return 2;
  return 3;
}

export default function AP() {
  const { theme } = useTheme();
  const t = theme;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeBucket, setActiveBucket] = useState(apBuckets[0].bucket);
  const [form, setForm] = useState({
    carrierName: '',
    carrierMc: '',
    carrierEmail: '',
    carrierPhone: '',
    carrierTaxId: '',
    paymentTerms: '',
    insuranceExpiry: '',
    invoiceNumber: '',
    amount: '',
    payDate: '',
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getInvoices('AP')
      .then((res) => {
        if (!mounted) return;
        setInvoices(res && !res.error && Array.isArray(res.invoices) ? res.invoices : []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const apData = useMemo(() => {
    const buckets = apBuckets.map((b) => ({ ...b, amount: 0, count: 0, invoices: [] }));
    invoices.forEach((inv) => {
      const idx = getBucketIndex(inv.dueDate);
      buckets[idx].amount += Number(inv.amount || 0);
      buckets[idx].count += 1;
      buckets[idx].invoices.push(inv);
    });
    return buckets;
  }, [invoices]);

  const activeData = apData.find((b) => b.bucket === activeBucket) || apData[0];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const payload = {
      type: 'AP',
      carrier: {
        name: form.carrierName,
        mcNumber: form.carrierMc,
        email: form.carrierEmail,
        phone: form.carrierPhone,
        taxId: form.carrierTaxId,
        paymentTerms: form.paymentTerms,
        insuranceExpiry: form.insuranceExpiry,
      },
      invoice: {
        invoiceNumber: form.invoiceNumber,
        amount: form.amount,
        dueDate: form.payDate,
        status: 'Pending',
        paymentTerms: form.paymentTerms,
      },
    };

    const res = await createInvoice(payload);
    if (res && !res.error) {
      setInvoices((prev) => [res.invoice, ...prev]);
      setStatus(res.warnings?.length ? `Saved with warnings: ${res.warnings.join(', ')}` : 'Invoice created.');
      setForm({
        carrierName: '',
        carrierMc: '',
        carrierEmail: '',
        carrierPhone: '',
        carrierTaxId: '',
        paymentTerms: '',
        insuranceExpiry: '',
        invoiceNumber: '',
        amount: '',
        payDate: '',
      });
      return;
    }

    setStatus(res?.error || 'Failed to create invoice');
  };

  const statusBadgeStyle = (value) => {
    let bg = '#f59e0b50';
    let fg = '#d97706';
    if (value === 'Approved') {
      bg = '#10b98150';
      fg = '#059669';
    } else if (value === 'Paid') {
      bg = '#8b5cf650';
      fg = '#7c3aed';
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

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: 4,
    border: `1px solid ${t.border}`,
    backgroundColor: t.surface,
    color: t.text,
    fontSize: 12,
  };

  return (
    <div style={{ padding: 24, backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Accounts Payable</div>
        <div style={{ fontSize: 14, color: t.textSecondary }}>Manage carrier invoices and payments</div>
      </div>

      {loading && <div style={{ marginBottom: 12, color: t.textSecondary }}>Loading AP invoices...</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {apData.map((item) => (
          <button
            key={item.bucket}
            type="button"
            onClick={() => setActiveBucket(item.bucket)}
            style={{
              textAlign: 'left',
              backgroundColor: item.color + '10',
              border: `2px solid ${activeBucket === item.bucket ? item.color : t.border}`,
              borderRadius: 8,
              padding: 12,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 12, color: t.textSecondary }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>${item.amount.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>{item.count} invoices</div>
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>New AP Invoice</div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <input required placeholder="Carrier name*" value={form.carrierName} onChange={(e) => setForm((p) => ({ ...p, carrierName: e.target.value }))} style={inputStyle} />
          <input placeholder="MC number" value={form.carrierMc} onChange={(e) => setForm((p) => ({ ...p, carrierMc: e.target.value }))} style={inputStyle} />
          <input placeholder="Carrier email" value={form.carrierEmail} onChange={(e) => setForm((p) => ({ ...p, carrierEmail: e.target.value }))} style={inputStyle} />
          <input placeholder="Carrier phone" value={form.carrierPhone} onChange={(e) => setForm((p) => ({ ...p, carrierPhone: e.target.value }))} style={inputStyle} />
          <input placeholder="Carrier tax ID" value={form.carrierTaxId} onChange={(e) => setForm((p) => ({ ...p, carrierTaxId: e.target.value }))} style={inputStyle} />
          <input placeholder="Payment terms" value={form.paymentTerms} onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))} style={inputStyle} />
          <input type="date" placeholder="Insurance expiry" value={form.insuranceExpiry} onChange={(e) => setForm((p) => ({ ...p, insuranceExpiry: e.target.value }))} style={inputStyle} />
          <input placeholder="Invoice #" value={form.invoiceNumber} onChange={(e) => setForm((p) => ({ ...p, invoiceNumber: e.target.value }))} style={inputStyle} />
          <input type="number" min="0" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} style={inputStyle} />
          <input type="date" placeholder="Pay date" value={form.payDate} onChange={(e) => setForm((p) => ({ ...p, payDate: e.target.value }))} style={inputStyle} />
          <button type="submit" style={{ ...inputStyle, backgroundColor: t.accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Create Invoice</button>
        </form>
        {status && <div style={{ marginTop: 10, fontSize: 12, color: status.includes('warning') ? t.warning : t.textSecondary }}>{status}</div>}
      </div>

      <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, borderBottom: `1px solid ${t.border}` }}>Carrier</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, borderBottom: `1px solid ${t.border}` }}>Invoice #</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, borderBottom: `1px solid ${t.border}` }}>Amount</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, borderBottom: `1px solid ${t.border}` }}>Pay Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, borderBottom: `1px solid ${t.border}` }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {activeData?.invoices.length ? (
              activeData.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: `1px solid ${t.border}` }}>{inv.carrierName || inv.carrier || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: `1px solid ${t.border}` }}><strong>{inv.invoiceNumber || inv.id}</strong></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: `1px solid ${t.border}` }}>${Number(inv.amount || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: `1px solid ${t.border}` }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: `1px solid ${t.border}` }}><span style={statusBadgeStyle(inv.status || 'Pending')}>{inv.status || 'Pending'}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: t.textSecondary }}>No AP invoices in this bucket.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}