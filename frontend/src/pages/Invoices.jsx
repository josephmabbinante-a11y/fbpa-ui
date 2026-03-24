// Helper for status chip class
function chipClass(type) {
  return `chip chip-${type}`;
}
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvoices, getInvoiceImages, uploadInvoiceImage, verifyInvoiceImage, getExceptions } from '../api/client';
import mockInvoices from '../mock/invoices';
import mockInvoiceImages from '../mock/invoiceImages';
import mockExceptions from '../mock/exceptions';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import { useApi } from '../hooks/useApi';
import { PageHeader, PrimaryButton, InlineAlert } from '../components/ui/Primitives';
import KPIWithTrend from '../components/KPIWithTrend';
import CollapsibleSection from '../components/CollapsibleSection';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import SavingsByCarrierChart from '../components/SavingsByCarrierChart';

function normalizeExceptionsResponse(response) {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.exceptions)) return response.exceptions;
  return null;
}

const AUDIT_COLORS = { approved: '#10b981', rejected: '#ef4444', pending: '#f59e0b', auto_resolved: '#6366f1' };
const SOURCE_LABELS = { carrier_invoice: 'Carrier Invoice', qr_scan: 'QR Code', manual_upload: 'Manual', system_rule: 'System', edi: 'EDI' };

function normalizeInvoicesResponse(response) {
  // Safely extract invoices array from response
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.invoices)) return response.invoices;
  return null; // Return null to trigger fallback to mockInvoices
}

const MOCK_RECENT_ACTIVITY_KEY = 'mock:invoices:recentActivity';
const DEFAULT_RECENT_ACTIVITY = [
  {
    id: 'ra-1',
    type: 'exception',
    invoiceNumber: 'INV-1001',
    amount: 1245.67,
    status: 'Review',
    timestamp: '2026-02-09T14:32:00Z',
  },
  {
    id: 'ra-2',
    type: 'upload',
    fileName: 'feb-9-invoices.csv',
    count: 42,
    status: 'Processed',
    timestamp: '2026-02-09T13:15:00Z',
  },
  {
    id: 'ra-3',
    type: 'exception',
    invoiceNumber: 'INV-1002',
    amount: 980.5,
    status: 'Fail',
    timestamp: '2026-02-09T10:45:00Z',
  },
];

function isMockModeEnabled() {
  if (import.meta.env.VITE_MOCK_MODE === 'true') return true;
  try {
    return typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true';
  } catch {
    return false;
  }
}

function readMockRecentActivity() {
  if (!isMockModeEnabled()) return DEFAULT_RECENT_ACTIVITY;
  try {
    const raw = localStorage.getItem(MOCK_RECENT_ACTIVITY_KEY);
    if (!raw) return DEFAULT_RECENT_ACTIVITY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_RECENT_ACTIVITY;
  } catch {
    return DEFAULT_RECENT_ACTIVITY;
  }
}


export default function Invoices() {
    // Handles uploading an invoice image
    const handleImageUpload = async () => {
      if (!imageFile || !selectedInvoiceId) return;
      setImageLoading(true);
      setImageStatus(null);
      try {
        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // In real usage, call your API here, e.g.:
        // const res = await uploadInvoiceImage(selectedInvoiceId, imageFile);
        setImageStatus('Upload successful (mock)');
        appendRecentActivity({
          id: `ra-upload-${Date.now()}`,
          type: 'upload',
          invoiceNumber: selectedInvoiceId,
          fileName: imageFile.name,
          status: 'Uploaded',
          timestamp: new Date().toISOString(),
        });
        setImageFile(null);
        setImagePreview(null);
      } catch (err) {
        setImageStatus('Upload failed');
      } finally {
        setImageLoading(false);
      }
    };
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = theme;
  const [query, setQuery] = useState('');

  const mockMode = isMockModeEnabled();
  const [data, setData] = useState(() => (mockMode ? mockInvoices : []));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageStatus, setImageStatus] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [imageHistory, setImageHistory] = useState(() => (mockMode ? mockInvoiceImages : []));
  const [verificationResult, setVerificationResult] = useState(null);
  const [recentActivity, setRecentActivity] = useState(() => (mockMode ? readMockRecentActivity() : []));
  const [arApFilter, setArApFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('invoices');
  const [excQuery, setExcQuery] = useState('');
  const [excStatusFilter, setExcStatusFilter] = useState('All');
  const [excAuditFilter, setExcAuditFilter] = useState('All');

  const { data: excRawData, loading: excLoading, error: excError } = useApi(() => getExceptions(), demoMode ? mockExceptions : null, [demoMode]);
  const excSource = useMemo(() => {
    const normalized = normalizeExceptionsResponse(excRawData);
    if (normalized) return normalized;
    return demoMode && Array.isArray(mockExceptions?.exceptions) ? mockExceptions.exceptions : [];
  }, [demoMode, excRawData]);
  const excStatuses = useMemo(() => ['All', ...new Set(excSource.map((e) => e.status).filter(Boolean))], [excSource]);
  const excAuditStatuses = useMemo(() => ['All', ...new Set(excSource.map((e) => e.auditAction || 'pending').filter(Boolean))], [excSource]);
  const excFiltered = useMemo(() => {
    const term = excQuery.trim().toLowerCase();
    return excSource.filter((item) => {
      const matchesQuery = !term || String(item.invoiceNumber || '').toLowerCase().includes(term) || String(item.carrier || '').toLowerCase().includes(term) || String(item.reason || '').toLowerCase().includes(term);
      const matchesStatus = excStatusFilter === 'All' || item.status === excStatusFilter;
      const matchesAudit = excAuditFilter === 'All' || (item.auditAction || 'pending') === excAuditFilter;
      return matchesQuery && matchesStatus && matchesAudit;
    });
  }, [excQuery, excSource, excStatusFilter, excAuditFilter]);

  const persistRecentActivity = (nextActivity) => {
    if (!isMockModeEnabled()) return;
    try {
      localStorage.setItem(MOCK_RECENT_ACTIVITY_KEY, JSON.stringify(nextActivity));
    } catch {
      // Ignore storage write failures.
    }
  };

  const appendRecentActivity = (entry) => {
    setRecentActivity((previous) => {
      const next = [entry, ...previous].slice(0, 50);
      persistRecentActivity(next);
      return next;
    });
  };

  const handleStatusUpdate = (invoiceId, newStatus) => {
    setData((prev) => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
    appendRecentActivity({
      id: `ra-status-${Date.now()}`,
      type: 'status',
      invoiceNumber: invoiceId,
      status: newStatus,
      timestamp: new Date().toISOString(),
    });
  };

  const formatActivityAmount = (activity) => {
    if (Number.isFinite(Number(activity?.amount))) {
      return `$${Number(activity.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (Number.isFinite(Number(activity?.count))) {
      return Number(activity.count).toLocaleString();
    }
    return '-';
  };

  const openActivity = (activity) => {
    const type = String(activity?.type || '').toLowerCase();
    const invoiceId = String(activity?.invoiceNumber || activity?.invoiceId || '').trim();
    const hasInvoice = invoiceId && data.some((inv) => inv.id === invoiceId);

    if (hasInvoice) {
      navigate(`/invoices/${invoiceId}`);
      return;
    }
    if (type === 'upload' || type === 'exception' || type === 'verification') {
      navigate('/exceptions');
      return;
    }
    navigate('/invoices');
  };

  useEffect(() => {
    let mounted = true;
    getInvoices()
      .then((res) => {
        if (!mounted) return;
        if (Array.isArray(res)) {
          setData(res);
        } else if (res && !res.error && Array.isArray(res.invoices)) {
          setData(res.invoices);
        } else {
          setData(mockMode ? mockInvoices : []);
          if (res && res.error) setError(res.error);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setData(mockMode ? mockInvoices : []);
        setError(err.message || String(err));
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [mockMode]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!selectedInvoiceId) return;
    getInvoiceImages(selectedInvoiceId).then((res) => {
      if (res && !res.error && res.images) {
        setImageHistory(res.images);
      } else {
        setImageHistory(mockMode ? mockInvoiceImages.filter((img) => img.invoiceId === selectedInvoiceId) : []);
      }
    });
  }, [selectedInvoiceId, mockMode]);

  const invoiceKpis = useMemo(() => {
    const totalInvoices = data.length;
    const exceptions = data.reduce((sum, inv) => sum + Number(inv.exceptions || 0), 0);
    const totalAmount = data.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const pending = data.filter((inv) => String(inv.status || '').toLowerCase().includes('pending')).length;
    return { totalInvoices, exceptions, totalAmount, pending };
  }, [data]);

  const exceptionBreakdownData = useMemo(() => {
    const groups = new Map();
    data.forEach((inv) => {
      const key = String(inv.status || 'Unknown');
      groups.set(key, (groups.get(key) || 0) + 1);
    });
    return Array.from(groups.entries()).map(([name, value]) => ({ name, value }));
  }, [data]);

  const savingsByCarrierData = useMemo(() => {
    const groups = new Map();
    data.forEach((inv) => {
      const carrier = String(inv.carrier || 'Unknown');
      const amount = Number(inv.amount || 0);
      const current = groups.get(carrier) || { carrier, savings: 0, invoiceCount: 0 };
      current.savings += amount * 0.03;
      current.invoiceCount += 1;
      groups.set(carrier, current);
    });
    return Array.from(groups.values())
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5)
      .map((row) => ({ ...row, savings: Number(row.savings.toFixed(2)) }));
  }, [data]);

  const filtered = data.filter(
    (inv) => {
      const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.carrier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArAp = arApFilter === 'ALL' || (arApFilter === 'AR' && inv.type === 'AR') || (arApFilter === 'AP' && inv.type === 'AP');
      return matchesSearch && matchesArAp;
    }
  );

  const selectedInvoice = useMemo(
    () => data.find((inv) => inv.id === selectedInvoiceId),
    [data, selectedInvoiceId]
  );

        <CollapsibleSection title="Invoice Imaging" defaultOpen={true}>
          <div className="ui-grid-wide" style={{ alignItems: "start" }}>
            <div className="ui-card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Upload Invoice Image</div>
              <label className="ui-label">Invoice</label>
              <select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)} className="ui-select" style={{ marginBottom: 12 }}>
                <option value="">Select invoice</option>
                {data.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} - {inv.carrier}
                  </option>
                ))}
              </select>

              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="ui-input"
                style={{ marginBottom: 12 }}
              />

              {imagePreview && (
                <div style={{ height: 160, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 12 }}>
                  <img src={imagePreview} alt="Invoice preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              <PrimaryButton type="button" onClick={handleImageUpload} disabled={imageLoading || !imageFile || !selectedInvoiceId} style={{ width: "100%" }}>
                {imageLoading ? "Uploading..." : "Upload Image"}
              </PrimaryButton>

              {imageStatus && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    borderRadius: 4,
                    fontSize: 12,
                    backgroundColor: imageStatus.includes("failed") ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    color: imageStatus.includes("failed") ? "var(--error)" : "var(--success)",
                  }}
                >
                  {imageStatus}
                </div>
              )}
            </div>
            {/* ...existing code... */}
          </div>
        </CollapsibleSection>
        {/* ...existing code... */}
      
  const tabStyle = (tab) => ({
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    borderBottom: activeTab === tab ? `3px solid var(--accent, ${t.accent})` : '3px solid transparent',
    background: 'transparent',
    color: activeTab === tab ? 'var(--text)' : 'var(--text-secondary)',
  });

  return (
    <div className="ui-page">
      <PageHeader title="Invoices" loading={loading || excLoading} />

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button type="button" style={tabStyle('invoices')} onClick={() => setActiveTab('invoices')}>Invoices</button>
        <button type="button" style={tabStyle('exceptions')} onClick={() => setActiveTab('exceptions')}>Exceptions{excSource.length > 0 ? ` (${excSource.length})` : ''}</button>
      </div>

      {activeTab === 'exceptions' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Exceptions</h2>
            {excError ? <span style={{ fontSize: 12, color: 'var(--warning)' }}>{demoMode ? `Using fallback data: ${excError}` : `Unable to load exceptions: ${excError}`}</span> : null}
          </div>
          {excLoading ? <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading exceptions...</div> : null}

          <div style={{ display: 'flex', gap: 12 }}>
            <input type="text" placeholder="Search by invoice, carrier, or reason" value={excQuery} onChange={(e) => setExcQuery(e.target.value)} style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)' }} />
            <select value={excStatusFilter} onChange={(e) => setExcStatusFilter(e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)' }}>
              {excStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={excAuditFilter} onChange={(e) => setExcAuditFilter(e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)' }}>
              {excAuditStatuses.map((a) => <option key={a} value={a}>{a === 'All' ? 'All Audits' : a}</option>)}
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '1rem' }}>
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
              {excFiltered.map((item) => (
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
      ) : (
      <>

      {/* Dashboard assets moved from Dashboard.jsx */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
        <KPIWithTrend label="Total Invoices" value={invoiceKpis.totalInvoices} delta={0} trendData={[]} trendColor="#0066cc" />
        <KPIWithTrend label="Exceptions" value={invoiceKpis.exceptions} delta={0} trendData={[]} trendColor="#ef4444" />
        <KPIWithTrend label="Total Savings" value={invoiceKpis.totalAmount * 0.03} format="currency" delta={0} trendData={[]} trendColor="#10b981" />
        <KPIWithTrend label="Pending" value={invoiceKpis.pending} delta={0} trendData={[]} trendColor="#f59e0b" />
      </div>

      <CollapsibleSection title="Invoice Imaging" defaultOpen={true}>
        <div className="ui-grid-wide" style={{ alignItems: "start" }}>
          <div className="ui-card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Upload Invoice Image</div>
            <label className="ui-label">Invoice</label>
            <select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)} className="ui-select" style={{ marginBottom: 12 }}>
              <option value="">Select invoice</option>
              {data.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.id} - {inv.carrier}
                </option>
              ))}
            </select>

            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="ui-input"
              style={{ marginBottom: 12 }}
            />

            {imagePreview && (
              <div style={{ height: 160, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 12 }}>
                <img src={imagePreview} alt="Invoice preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}

            <PrimaryButton type="button" onClick={handleImageUpload} disabled={imageLoading || !imageFile || !selectedInvoiceId} style={{ width: "100%" }}>
              {imageLoading ? "Uploading..." : "Upload Image"}
            </PrimaryButton>

            {imageStatus && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  borderRadius: 4,
                  fontSize: 12,
                  backgroundColor: imageStatus.includes("failed") ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                  color: imageStatus.includes("failed") ? "var(--error)" : "var(--success)",
                  border: imageStatus.includes("failed") ? "1px solid var(--error)" : "1px solid var(--success)",
                }}
              >
                {imageStatus}
              </div>
            )}
          </div>

          <div className="ui-card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Verification</div>
            {selectedInvoice ? (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
                Selected: <strong style={{ color: "var(--text)" }}>{selectedInvoice.id}</strong> · {selectedInvoice.carrier}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>Select an invoice to view verification results.</div>
            )}

            {imageHistory.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {imageHistory.map((img) => (
                  <div key={img.id} style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 10, backgroundColor: "var(--bg-alt)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{img.fileName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{new Date(img.uploadedAt).toLocaleDateString()}</div>
                      </div>
                      <span className={chipClass(img.status === "Verified" ? "good" : img.status === "Needs Review" ? "warn" : "bad")}>{img.status}</span>
                    </div>
                    <PrimaryButton type="button" onClick={() => handleVerify(img.id)} style={{ marginTop: 10, width: "100%" }} disabled={imageLoading}>
                      {imageLoading ? "Verifying..." : "Run Verification"}
                    </PrimaryButton>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>No images uploaded yet for this invoice.</div>
            )}
          </div>

          <div className="ui-card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Verification Results</div>
            {verificationResult ? (
              <>
                <div style={{ marginBottom: 10 }}>
                  <span className={chipClass(verificationResult.matchConfidence >= 90 ? "good" : verificationResult.matchConfidence >= 75 ? "warn" : "bad")}>
                    {verificationResult.matchConfidence}% match confidence
                  </span>
                </div>
                <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                  <div><strong>Invoice ID:</strong> {verificationResult.extractedFields.invoiceId}</div>
                  <div><strong>Carrier:</strong> {verificationResult.extractedFields.carrier ? <a href={`/carriers/profile/${encodeURIComponent(verificationResult.extractedFields.carrier)}`} onClick={(e) => { e.preventDefault(); navigate(`/carriers/profile/${encodeURIComponent(verificationResult.extractedFields.carrier)}`); }} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>{verificationResult.extractedFields.carrier}</a> : '—'}</div>
                  <div><strong>Amount:</strong> ${verificationResult.extractedFields.amount.toLocaleString()}</div>
                  <div><strong>Invoice Date:</strong> {verificationResult.extractedFields.invoiceDate}</div>
                  <div><strong>Due Date:</strong> {verificationResult.extractedFields.dueDate}</div>
                </div>
                {verificationResult.issues && verificationResult.issues.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Issues</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--text-secondary)" }}>
                      {verificationResult.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Run verification to see extracted fields and match confidence.</div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Recent Activity" defaultOpen={true}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Invoice/File</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Amount</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.length > 0 ? recentActivity.slice(0, 12).map((activity) => (
              <tr
                key={activity.id}
                onClick={() => openActivity(activity)}
                style={{ cursor: 'pointer' }}
                title="Open related page"
              >
                <td style={{ padding: 8 }}>{activity.type || '-'}</td>
                <td style={{ padding: 8 }}>{activity.invoiceNumber || activity.fileName || '-'}</td>
                <td style={{ padding: 8 }}>{formatActivityAmount(activity)}</td>
                <td style={{ padding: 8 }}>{activity.status || '-'}</td>
                <td style={{ padding: 8 }}>{activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : '-'}</td>
              </tr>
            )) : (
              <tr>
                <td style={{ padding: 8, color: 'var(--text-secondary)' }} colSpan={5}>No recent activity.</td>
              </tr>
            )}
          </tbody>
        </table>
      </CollapsibleSection>

      <div className="ui-row">
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ui-input"
          style={{ width: 240 }}
        />
        <span className="ui-subtitle">
          Showing {filtered.length} of {data.length}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Carrier</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Exceptions</th>
                <th>Upload Date</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate(`/invoices/${invoice.id}`)}>
                    {invoice.id}
                  </td>
                  <td>{invoice.carrier ? <a href={`/carriers/profile/${encodeURIComponent(invoice.carrier)}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/carriers/profile/${encodeURIComponent(invoice.carrier)}`); }} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>{invoice.carrier}</a> : '—'}</td>
                  <td style={{ color: "var(--success)", fontWeight: 600 }}>
                    ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>{invoice.status}</td>
                  <td>{invoice.exceptions}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{new Date(invoice.uploadDate).toLocaleDateString()}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{invoice.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <InlineAlert tone="warn">No invoices found.</InlineAlert>
      )}

      <CollapsibleSection title="Analytics" defaultOpen={true}>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: 24 }}>
            <ExceptionBreakdownChart data={exceptionBreakdownData} />
            <SavingsByCarrierChart data={savingsByCarrierData} />
        </div>
      </CollapsibleSection>

      </>
      )}

    </div>
  );
}
