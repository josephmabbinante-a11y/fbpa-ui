import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInvoices, getInvoiceImages, uploadInvoiceImage, verifyInvoiceImage } from "../api/client";
import mockInvoices from "../mock/invoices";
import mockInvoiceImages from "../mock/invoiceImages";
import KPIWithTrend from '../components/KPIWithTrend';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import SavingsByCarrierChart from '../components/SavingsByCarrierChart';
import CollapsibleSection from "../components/CollapsibleSection";
import { InlineAlert, PageHeader, PrimaryButton } from "../components/ui/Primitives";

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
  const navigate = useNavigate();
  const [data, setData] = useState(mockInvoices);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageStatus, setImageStatus] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [imageHistory, setImageHistory] = useState(mockInvoiceImages);
  const [verificationResult, setVerificationResult] = useState(null);
  const [recentActivity, setRecentActivity] = useState(() => readMockRecentActivity());

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
    if (type === 'upload') {
      navigate('/uploads');
      return;
    }
    if (type === 'exception' || type === 'verification') {
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
        if (res && !res.error && res.invoices) {
          setData(res.invoices);
        } else {
          setData(mockInvoices);
          if (res && res.error) setError(res.error);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setData(mockInvoices);
        setError(err.message || String(err));
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

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
        setImageHistory(mockInvoiceImages.filter((img) => img.invoiceId === selectedInvoiceId));
      }
    });
  }, [selectedInvoiceId]);

  const filtered = data.filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.carrier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedInvoice = useMemo(
    () => data.find((inv) => inv.id === selectedInvoiceId),
    [data, selectedInvoiceId]
  );

  const chipClass = (tone) => `ui-chip ${tone === "good" ? "good" : tone === "warn" ? "warn" : "bad"}`;

  const handleImageUpload = async () => {
    if (!imageFile || !selectedInvoiceId) {
      setImageStatus("Select an invoice and image first");
      return;
    }
    setImageLoading(true);
    setImageStatus(null);
    setVerificationResult(null);
    const res = await uploadInvoiceImage({ file: imageFile, invoiceId: selectedInvoiceId });
    setImageLoading(false);

    if (res && !res.error) {
      const entry = {
        id: res.id || `IMG-${Date.now()}`,
        invoiceId: res.invoiceId || selectedInvoiceId,
        fileName: res.fileName || imageFile.name,
        uploadedAt: res.uploadedAt || new Date().toISOString(),
        status: res.status || "Uploaded",
        verification: res.verification || null,
      };
      setImageHistory((prev) => [entry, ...prev]);
      appendRecentActivity({
        id: `ra-upload-${Date.now()}`,
        type: 'upload',
        fileName: entry.fileName,
        count: 1,
        status: entry.status || 'Uploaded',
        timestamp: entry.uploadedAt || new Date().toISOString(),
      });
      setImageStatus("Image uploaded");
      setImageFile(null);
    } else {
      setImageStatus(`Upload failed: ${res && res.error ? res.error : "unknown"}`);
    }
  };

  const handleVerify = async (imageId) => {
    if (!imageId || !selectedInvoiceId) return;
    setImageLoading(true);
    setImageStatus(null);
    const res = await verifyInvoiceImage({ imageId, invoiceId: selectedInvoiceId });
    setImageLoading(false);

    if (res && !res.error) {
      setVerificationResult(res);
      setImageHistory((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, status: res.status || img.status, verification: res.verification } : img))
      );
      appendRecentActivity({
        id: `ra-verify-${Date.now()}`,
        type: 'verification',
        invoiceNumber: selectedInvoiceId,
        amount: Number(res?.verification?.extractedFields?.amount ?? selectedInvoice?.amount ?? 0),
        status: res.status || 'Verified',
        timestamp: new Date().toISOString(),
      });
      setImageStatus("Verification complete");
    } else {
      const fallback = mockInvoiceImages.find((img) => img.id === imageId);
      if (fallback) {
        setVerificationResult(fallback.verification);
        setImageHistory((prev) =>
          prev.map((img) => (img.id === imageId ? { ...img, status: fallback.status, verification: fallback.verification } : img))
        );
        appendRecentActivity({
          id: `ra-verify-${Date.now()}`,
          type: 'verification',
          invoiceNumber: selectedInvoiceId,
          amount: Number(fallback?.verification?.extractedFields?.amount ?? selectedInvoice?.amount ?? 0),
          status: fallback.status || 'Verified',
          timestamp: new Date().toISOString(),
        });
        setImageStatus("Verification complete (mock)");
      } else {
        setImageStatus(`Verification failed: ${res && res.error ? res.error : "unknown"}`);
      }
    }
  };

  return (
    <div className="ui-page">
      <PageHeader title="Invoices" loading={loading} />

      {/* Dashboard assets moved from Dashboard.jsx */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
        <KPIWithTrend label="Total Invoices" value={1247} delta={5} trendData={[]} trendColor="#0066cc" />
        <KPIWithTrend label="Exceptions" value={89} delta={-2} trendData={[]} trendColor="#ef4444" />
        <KPIWithTrend label="Total Savings" value={12450.75} format="currency" delta={12} trendData={[]} trendColor="#10b981" />
        <KPIWithTrend label="Pending" value={23} delta={0} trendData={[]} trendColor="#f59e0b" />
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
                  <div><strong>Carrier:</strong> {verificationResult.extractedFields.carrier}</div>
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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  <td>{invoice.carrier}</td>
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
          <ExceptionBreakdownChart data={[{ name: 'Rate Mismatch', value: 34, fill: '#8884d8' }, { name: 'Duplicate', value: 28, fill: '#82ca9d' }, { name: 'Accessorial', value: 15, fill: '#ffc658' }, { name: 'Other', value: 12, fill: '#ff8042' }]} />
          <SavingsByCarrierChart data={[{ carrier: 'FastShip', savings: 2450.75, invoiceCount: 345 }, { carrier: 'Oceanic', savings: 1980.50, invoiceCount: 312 }, { carrier: 'RailMax', savings: 1750.25, invoiceCount: 289 }, { carrier: 'AirLogistics', savings: 1520.10, invoiceCount: 201 }, { carrier: 'Express Co', savings: 1248.15, invoiceCount: 156 }]} />
        </div>
      </CollapsibleSection>

    </div>
  );
}
