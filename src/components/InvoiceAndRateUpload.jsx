import { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function InvoiceAndRateUpload({ invoiceImages = [], rateImage = null }) {
  const { theme } = useTheme();
  const t = themes[theme];
  // Invoice image upload state
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [invoiceStatus, setInvoiceStatus] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  // Rate confirmation upload state
  const [rateFile, setRateFile] = useState(null);
  const [ratePreview, setRatePreview] = useState(null);
  const [rateStatus, setRateStatus] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);

  // Handlers for invoice image
  const handleInvoiceChange = (e) => {
    const f = e.target.files[0];
    setInvoiceFile(f);
    setInvoicePreview(f ? URL.createObjectURL(f) : null);
  };
  const handleInvoiceUpload = async (e) => {
    e.preventDefault();
    setInvoiceStatus(null);
    if (!invoiceFile) {
      setInvoiceStatus('Please select an invoice image.');
      return;
    }
    setInvoiceLoading(true);
    const formData = new FormData();
    formData.append('file', invoiceFile);

    try {
      const res = await fetch('/api/invoices/upload-image', {
        method: 'POST',
        body: formData,
        // headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      await res.json();
      setInvoiceStatus('Invoice image uploaded!');
      setInvoiceFile(null);
      setInvoicePreview(null);
    } catch (err) {
      setInvoiceStatus(err.message || 'An error occurred during upload.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Handlers for rate confirmation image
  const handleRateChange = (e) => {
    const f = e.target.files[0];
    setRateFile(f);
    setRatePreview(f ? URL.createObjectURL(f) : null);
  };
  const handleRateUpload = async (e) => {
    e.preventDefault();
    setRateStatus(null);
    if (!rateFile) {
      setRateStatus('Please select a rate confirmation image.');
      return;
    }
    setRateLoading(true);
    const formData = new FormData();
    formData.append('file', rateFile);

    try {
      const res = await fetch('/api/invoices/upload-rate-confirmation', {
        method: 'POST',
        body: formData,
        // headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      await res.json();
      setRateStatus('Rate confirmation image uploaded!');
      setRateFile(null);
      setRatePreview(null);
    } catch (err) {
      setRateStatus(err.message || 'An error occurred during upload.');
    } finally {
      setRateLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Invoice Image Upload */}
      <form onSubmit={handleInvoiceUpload} style={{ display: 'grid', gap: 10, background: t.surface, border: `1px solid ${t.borderLight}`, borderRadius: 6, padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Invoice Image Upload</div>
        <input type="file" accept=".pdf,image/*" onChange={handleInvoiceChange} style={{ fontSize: 14, color: t.text }} />
        {invoicePreview && (
          <div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>Preview:</div>
            {invoiceFile && invoiceFile.type.startsWith('image') ? (
              <img src={invoicePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, border: `1px solid ${t.borderLight}` }} />
            ) : (
              <a href={invoicePreview} target="_blank" rel="noopener noreferrer">View PDF</a>
            )}
          </div>
        )}
        <button type="submit" disabled={invoiceLoading} style={{ padding: '8px 0', background: t.accent, color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          {invoiceLoading ? 'Uploading...' : 'Upload Invoice Image'}
        </button>
        {invoiceStatus && <div style={{ color: invoiceStatus.includes('uploaded') ? t.positive : t.error, fontSize: 13 }}>{invoiceStatus}</div>}
        {/* Existing images */}
        {invoiceImages.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Uploaded Images:</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {invoiceImages.map((img) => (
                <div key={img.id} style={{ border: `1px solid ${t.borderLight}`, borderRadius: 6, padding: 8, background: t.bgAlt }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{img.fileName}</div>
                  <div style={{ fontSize: 11, color: t.textSecondary }}>{new Date(img.uploadedAt).toLocaleDateString()} · {img.status}</div>
                  {img.verification && (
                    <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4 }}>Match confidence: {img.verification.matchConfidence}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
      {/* Rate Confirmation Image Upload */}
      <form onSubmit={handleRateUpload} style={{ display: 'grid', gap: 10, background: t.surface, border: `1px solid ${t.borderLight}`, borderRadius: 6, padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Rate Confirmation Image Upload</div>
        <input type="file" accept=".pdf,image/*" onChange={handleRateChange} style={{ fontSize: 14, color: t.text }} />
        {ratePreview && (
          <div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>Preview:</div>
            {rateFile && rateFile.type.startsWith('image') ? (
              <img src={ratePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, border: `1px solid ${t.borderLight}` }} />
            ) : (
              <a href={ratePreview} target="_blank" rel="noopener noreferrer">View PDF</a>
            )}
          </div>
        )}
        <button type="submit" disabled={rateLoading} style={{ padding: '8px 0', background: t.accent, color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          {rateLoading ? 'Uploading...' : 'Upload Rate Confirmation'}
        </button>
        {rateStatus && <div style={{ color: rateStatus.includes('uploaded') ? t.positive : t.error, fontSize: 13 }}>{rateStatus}</div>}
        {/* Existing rate confirmation image */}
        {rateImage && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Uploaded Rate Confirmation:</div>
            <div style={{ border: `1px solid ${t.borderLight}`, borderRadius: 6, padding: 8, background: t.bgAlt }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{rateImage.fileName}</div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>{new Date(rateImage.uploadedAt).toLocaleDateString()} · {rateImage.status}</div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
