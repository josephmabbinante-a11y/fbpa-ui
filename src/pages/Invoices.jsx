import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInvoices, getInvoiceImages, uploadInvoiceImage, verifyInvoiceImage } from "../api/client";
// import mockInvoices from "../mock/invoices"; // Retained for demo mode only
// import mockInvoiceImages from "../mock/invoiceImages"; // Retained for demo mode only
import { useTheme, themes } from "../contexts/ThemeContext";
import CollapsibleSection from "../components/CollapsibleSection";

export default function Invoices() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = themes[theme];
  const [data, setData] = useState([]);
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

  useEffect(() => {
    let mounted = true;
    getInvoices()
      .then((res) => {
        if (!mounted) return;
        if (res && !res.error && res.invoices) {
          setData(res.invoices);
        } else if (res && res.error) setError(res.error);
      })
      .catch((err) => {
        if (!mounted) return;
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
        // setImageHistory(mockInvoiceImages.filter((img) => img.invoiceId === selectedInvoiceId)); // Demo mode: Uncomment to use mock data
      }
    });
  }, [selectedInvoiceId]);

  const filtered = data.filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.carrier || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedInvoice = useMemo(
    () => data.find((inv) => inv.id === selectedInvoiceId),
    [data, selectedInvoiceId]
  );

  const containerStyle = {
    padding: '24px',
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
  };

  const headerStyle = {
    marginBottom: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  };

  const searchStyle = {
    padding: '8px 12px',
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 4,
    color: t.text,
    fontSize: '13px',
    width: '240px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  };

  const thStyle = {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: '600',
    backgroundColor: t.surface,
    borderBottom: `1px solid ${t.border}`,
    color: t.textSecondary,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  };

  const tdStyle = {
    padding: '8px 12px',
    borderBottom: `1px solid ${t.borderLight}`,
    color: t.text,
  };

  const currencyStyle = {
    ...tdStyle,
    color: t.positive,
    fontWeight: '500',
  };

  const cardStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: 16,
  };

  const buttonStyle = (disabled) => ({
    padding: '8px 16px',
    backgroundColor: t.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: '13px',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  });

  const chipStyle = (tone) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: tone === 'good' ? `${t.positive}20` : tone === 'warn' ? `${t.warning}20` : `${t.error}20`,
    color: tone === 'good' ? t.positive : tone === 'warn' ? t.warning : t.error,
  });

  const handleImageUpload = async () => {
    if (!imageFile || !selectedInvoiceId) {
      setImageStatus('Select an invoice and image first');
      return;
        if (loading) return <div>Loading invoices...</div>;
        if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
        if (!data.length) return <div>No invoices found.</div>;
        return (
          <div style={{ ...containerStyle, minHeight: '100vh' }}>
            {/* ...existing code... */}
          </div>
    setVerificationResult(null);
    const res = await uploadInvoiceImage({ file: imageFile, invoiceId: selectedInvoiceId });
    setImageLoading(false);

    if (res && !res.error) {
      const entry = {
        id: res.id || `IMG-${Date.now()}`,
        invoiceId: res.invoiceId || selectedInvoiceId,
        fileName: res.fileName || imageFile.name,
        uploadedAt: res.uploadedAt || new Date().toISOString(),
        status: res.status || 'Uploaded',
        verification: res.verification || null,
      };
      setImageHistory((prev) => [entry, ...prev]);
      setImageStatus('Image uploaded');
      setImageFile(null);
    } else {
      setImageStatus(`Upload failed: ${res && res.error ? res.error : 'unknown'}`);
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
      setImageStatus('Verification complete');
    } else {
      const fallback = mockInvoiceImages.find((img) => img.id === imageId);
      if (fallback) {
        setVerificationResult(fallback.verification);
        setImageHistory((prev) =>
          prev.map((img) => (img.id === imageId ? { ...img, status: fallback.status, verification: fallback.verification } : img))
        );
        setImageStatus('Verification complete (mock)');
      } else {
        setImageStatus(`Verification failed: ${res && res.error ? res.error : 'unknown'}`);
      }
    }
  };


  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Invoices</h1>
        {loading && <span style={{ fontSize: '12px', color: t.textSecondary }}>Loading...</span>}
      </div>

      {error && (
        <div style={{ padding: '8px 12px', backgroundColor: t.bgAlt, border: `1px solid ${t.warning}`, borderRadius: 4, fontSize: '13px', color: t.warning, marginBottom: 24 }}>
          Backend error, using mock data: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchStyle}
        />
        <span style={{ fontSize: 12, color: t.textSecondary }}>
          Showing {filtered.length} of {data.length}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div style={{ ...cardStyle, padding: 0, overflowX: 'auto', marginBottom: 24 }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Invoice ID</th>
                <th style={thStyle}>Carrier</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Exceptions</th>
                <th style={thStyle}>Upload Date</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id}>
                <td
                  style={{ ...tdStyle, color: t.accent, cursor: 'pointer' }}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  {invoice.id}
                </td>
                  <td style={tdStyle}>{invoice.carrier}</td>
                  <td style={currencyStyle}>
                    ${invoice.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td style={tdStyle}>{invoice.status}</td>
                  <td style={tdStyle}>{invoice.exceptions ?? 0}</td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: t.textSecondary }}>
                    {new Date(invoice.uploadDate).toLocaleDateString()}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: t.textSecondary }}>
                    {invoice.description || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', color: t.textSecondary }}>
          No invoices found.
        </div>
      )}

      <CollapsibleSection title="Invoice Imaging" defaultOpen={true}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Upload Invoice Image</div>
            <label style={{ display: 'block', fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>Invoice</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: `1px solid ${t.border}`,
                backgroundColor: t.bgAlt,
                color: t.text,
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            >
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
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: `1px solid ${t.border}`,
                backgroundColor: t.bgAlt,
                color: t.text,
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />

            {imagePreview && (
              <div
                style={{
                  height: 160,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: `1px solid ${t.borderLight}`,
                  marginBottom: 12,
                }}
              >
                <img src={imagePreview} alt="Invoice preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <button
              type="button"
              onClick={handleImageUpload}
              disabled={imageLoading || !imageFile || !selectedInvoiceId}
              style={{ ...buttonStyle(imageLoading || !imageFile || !selectedInvoiceId), width: '100%' }}
            >
              {imageLoading ? 'Uploading...' : 'Upload Image'}
            </button>

            {imageStatus && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  backgroundColor: imageStatus.includes('failed') ? `${t.error}10` : `${t.positive}10`,
                  color: imageStatus.includes('failed') ? t.error : t.positive,
                  border: `1px solid ${imageStatus.includes('failed') ? t.error : t.positive}`,
                }}
              >
                {imageStatus}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Verification</div>
            {selectedInvoice ? (
              <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 12 }}>
                Selected: <strong style={{ color: t.text }}>{selectedInvoice.id}</strong> · {selectedInvoice.carrier}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 12 }}>
                Select an invoice to view verification results.
              </div>
            )}

            {imageHistory.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {imageHistory.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      border: `1px solid ${t.borderLight}`,
                      borderRadius: 6,
                      padding: 10,
                      backgroundColor: t.bgAlt,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{img.fileName}</div>
                        <div style={{ fontSize: 11, color: t.textSecondary }}>
                          {new Date(img.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={chipStyle(img.status === 'Verified' ? 'good' : img.status === 'Needs Review' ? 'warn' : 'bad')}>
                        {img.status}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVerify(img.id)}
                      style={{ ...buttonStyle(false), marginTop: 10, width: '100%' }}
                      disabled={imageLoading}
                    >
                      {imageLoading ? 'Verifying...' : 'Run Verification'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: t.textSecondary }}>
                No images uploaded yet for this invoice.
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Verification Results</div>
            {verificationResult ? (
              <>
                <div style={{ marginBottom: 10 }}>
                  <span style={chipStyle(verificationResult.matchConfidence >= 90 ? 'good' : verificationResult.matchConfidence >= 75 ? 'warn' : 'bad')}>
                    {verificationResult.matchConfidence}% match confidence
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
                  <div>
                    <strong>Invoice ID:</strong> {verificationResult.extractedFields.invoiceId}
                  </div>
                  <div>
                    <strong>Carrier:</strong> {verificationResult.extractedFields.carrier}
                  </div>
                  <div>
                    <strong>Amount:</strong> ${verificationResult.extractedFields.amount.toLocaleString()}
                  </div>
                  <div>
                    <strong>Invoice Date:</strong> {verificationResult.extractedFields.invoiceDate}
                  </div>
                  <div>
                    <strong>Due Date:</strong> {verificationResult.extractedFields.dueDate}
                  </div>
                </div>
                {verificationResult.issues && verificationResult.issues.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Issues</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: t.textSecondary }}>
                      {verificationResult.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12, color: t.textSecondary }}>
                Run verification to see extracted fields and match confidence.
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
