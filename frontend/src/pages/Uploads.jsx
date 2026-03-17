import { useEffect, useState } from 'react';
import { uploadInvoiceFile } from '../api/client';
import uploadHistory from '../mock/uploads';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import DocumentManagementPanel from './DocumentManagementPanel';
import CollapsibleSection from '../components/CollapsibleSection';
import logo from '../assets/opscale-logo.svg';

export default function Uploads() {
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = theme || {};
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => (demoMode ? uploadHistory : []));

  useEffect(() => {
    setHistory(demoMode ? uploadHistory : []);
  }, [demoMode]);

  // State for Rate Confirmation Upload
  const [rcFile, setRcFile] = useState(null);
  const [rcPreviewUrl, setRcPreviewUrl] = useState(null);
  const [rcStatus, setRcStatus] = useState(null);
  const [rcLoading, setRcLoading] = useState(false);
  // Handlers for Rate Confirmation Upload
  const handleRcFileChange = (e) => {
    const f = e.target.files[0];
    setRcFile(f);
    if (f) {
      setRcPreviewUrl(URL.createObjectURL(f));
    } else {
      setRcPreviewUrl(null);
    }
  };

  const handleRcSubmit = async (e) => {
    e.preventDefault();
    setRcStatus(null);
    if (!rcFile) {
      setRcStatus('Please select a file to upload.');
      return;
    }
    setRcLoading(true);
    try {
      const res = await uploadInvoiceFile(rcFile);
      if (res && res.success) {
        setRcStatus('Upload successful!');
        setRcFile(null);
        setRcPreviewUrl(null);
      } else {
        setRcStatus(res?.error || 'Upload failed.');
      }
    } catch (err) {
      setRcStatus('Upload failed.');
    } finally {
      setRcLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadResult(null);
    if (!file) return setStatus('Choose a file first');
    setLoading(true);
    setStatus(null);
    let res;
    try {
      res = await uploadInvoiceFile(file);
    } catch (err) {
      setStatus('Upload failed: ' + (err.message || 'unknown error'));
      setLoading(false);
      return;
    }
    setLoading(false);
    if (res && !res.error && res.success) {
      setStatus('Upload successful');
      setUploadResult(res);
      const entry = {
        id: Date.now(),
        fileName: res.fileName || file.name,
        uploadDate: res.uploadedAt || new Date().toISOString(),
        invoiceCount: res.invoiceCount || 0,
        successCount: res.successCount || 0,
        errorCount: res.errorCount || 0,
        status: 'Processed',
      };
      setHistory((h) => [entry, ...h]);
    } else {
      setStatus(`Upload failed: ${res && res.error ? res.error : 'unknown'}`);
      setUploadResult(res && res.errors ? res : null);
    }
    setFile(null);
  };

  const containerStyle = {
    padding: '24px 32px',
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  };

  const headerStyle = {
    marginBottom: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    minHeight: 52,
    padding: '0 4px',
    borderBottom: `1px solid ${t.border}`,
    background: t.bgAlt,
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  };

  const formSectionStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 4,
    padding: '20px',
    marginBottom: 0,
    boxSizing: 'border-box',
  };

  const formLabelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: 12,
    color: t.text,
  };

  const linkStyle = {
    display: 'inline-block',
    padding: '8px 12px',
    backgroundColor: t.accent,
    color: 'var(--surface-elevated)',
    textDecoration: 'none',
    borderRadius: 4,
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: 8,
    cursor: 'pointer',
  };

  const inputStyle = {
    padding: '8px 12px',
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 4,
    color: t.textPrimary,
    fontSize: '13px',
    marginBottom: 12,
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: t.accent,
    color: 'var(--surface-elevated)',
    border: 'none',
    borderRadius: 4,
    fontSize: '13px',
    fontWeight: '500',
    cursor: loading || !file ? 'not-allowed' : 'pointer',
    opacity: loading || !file ? 0.5 : 1,
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    backgroundColor: t.surface,
    color: t.textPrimary,
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
    backgroundColor: t.surface,
    color: t.textPrimary,
  };

  return (
    <div style={containerStyle}>
      {/* Document Management & Search Panel */}
      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, marginBottom: 24, padding: 16 }}>
        <DocumentManagementPanel t={t} />
      </div>



      <div style={headerStyle}>
        <h1 style={titleStyle}>Uploads</h1>
        {loading && <span style={{ fontSize: '12px', color: t.textSecondary }}>Uploading...</span>}
      </div>

      {/* Forms Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 24, alignItems: 'start' }}>
        {/* Upload Form */}
        <div style={formSectionStyle} id="upload-invoice-form">
          <h2 style={formLabelStyle}>Upload Invoice File</h2>
          <a
            href="/templates/invoice_template.csv"
            download
            style={linkStyle}
          >
            ↓ Download Template
          </a>
          <div style={{ fontSize: '12px', color: t.textSecondary, marginBottom: 16 }}>
            CSV, XLSX, or XLS format supported.
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              accept=".csv,.xlsx,.xls"
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              aria-label="Upload file"
            />
            <button type="submit" disabled={loading || !file} style={buttonStyle}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
          {status && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 4,
                fontSize: '13px',
                backgroundColor: status.includes('failed') ? t.bgAlt : t.surface,
                color: status.includes('failed') ? t.error : t.positive,
                border: `1px solid ${status.includes('failed') ? t.error : t.positive}`,
              }}
            >
              {status}
            </div>
          )}
          {uploadResult && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <div><b>Invoices Parsed:</b> {uploadResult.successCount} / {uploadResult.invoiceCount}</div>
              {uploadResult.errorCount > 0 && (
                <div style={{ color: t.error }}>
                  <b>Errors:</b> {uploadResult.errorCount}
                  <ul style={{ margin: '4px 0 0 16px', fontSize: 12 }}>
                    {uploadResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>Line {err.line}: {err.value}</li>
                    ))}
                    {uploadResult.errorCount > 5 && <li>...and {uploadResult.errorCount - 5} more</li>}
                  </ul>
                </div>
              )}
              {uploadResult.invoices && uploadResult.invoices.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <b>Preview:</b>
                  <pre style={{ background: t.bgAlt, padding: 8, borderRadius: 4, fontSize: 12, maxHeight: 120, overflow: 'auto' }}>{JSON.stringify(uploadResult.invoices, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rate Confirmation Upload Section */}
        <div style={{ ...formSectionStyle, maxWidth: 480, margin: '0 auto' }} id="rate-confirmation-upload">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img src={logo} alt="Opscale" style={{ height: 36, width: 'auto', display: 'block' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Rate Confirmation Upload</div>
              <div style={{ fontSize: 13, color: t.textSecondary }}>Upload rate confirmation images (PDF, JPG, PNG)</div>
            </div>
          </div>
          <form onSubmit={handleRcSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleRcFileChange}
              style={{ fontSize: 14, color: t.text, marginBottom: 0, flex: 1 }}
            />
            <button type="submit" disabled={rcLoading} style={{ padding: '10px 0', background: t.accent, color: 'var(--surface-elevated)', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 15, cursor: 'pointer', minWidth: 100 }}>
              {rcLoading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
          {rcPreviewUrl && (
            <div style={{ margin: '8px 0' }}>
              <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Preview:</div>
              {rcFile && rcFile.type && rcFile.type.startsWith('image') ? (
                <img src={rcPreviewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, border: `1px solid ${t.borderLight}` }} />
              ) : (
                <a href={rcPreviewUrl} target="_blank" rel="noopener noreferrer">View PDF</a>
              )}
            </div>
          )}
          {rcStatus && <div style={{ color: rcStatus.includes('success') ? t.positive : t.error, fontSize: 13 }}>{rcStatus}</div>}
        </div>
      </div>

      {/* Upload History */}
      <CollapsibleSection title={`Upload History (${history.length})`} defaultOpen={true} id="upload-history">
        <table style={{...tableStyle, fontSize: '1rem'}}>
          <thead>
            <tr>
              <th style={thStyle}>File Name</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Count</th>
              <th style={thStyle}>Success</th>
              <th style={thStyle}>Errors</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((upload) => (
              <tr key={upload.id}>
                <td style={tdStyle}>{upload.fileName}</td>
                <td style={{ ...tdStyle, fontSize: '12px', color: t.textSecondary }}>
                  {new Date(upload.uploadDate).toLocaleDateString()}
                </td>
                <td style={tdStyle}>{upload.invoiceCount}</td>
                <td style={{ ...tdStyle, color: t.positive, fontWeight: '500' }}>
                  {upload.successCount}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    color: upload.errorCount > 0 ? t.error : t.textSecondary,
                    fontWeight: upload.errorCount > 0 ? '500' : 'normal',
                  }}
                >
                  {upload.errorCount}
                </td>
                <td style={{ ...tdStyle, fontSize: '12px' }}>{upload.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>
    </div>
  );
}
