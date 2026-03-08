import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';

export default function RateConfirmationUpload() {
  const { theme } = useTheme();
  const { theme } = useTheme();
  const t = theme || {};
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!file) {
      setStatus('Please select a file to upload.');
      return;
    }
    setLoading(true);
    // TODO: Implement actual upload logic here
    setTimeout(() => {
      setLoading(false);
      setStatus('Upload successful!');
      setFile(null);
      setPreviewUrl(null);
    }, 1200);
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 32, color: t.text }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <img src={logo} alt="Opscale" style={{ height: 36, width: 'auto', display: 'block' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Rate Confirmation Upload</div>
          <div style={{ fontSize: 13, color: t.textSecondary }}>Upload rate confirmation images (PDF, JPG, PNG)</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          style={{ fontSize: 14, color: t.text, marginBottom: 8 }}
        />
        {previewUrl && (
          <div style={{ margin: '8px 0' }}>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Preview:</div>
            {file && file.type.startsWith('image') ? (
              <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, border: `1px solid ${t.borderLight}` }} />
            ) : (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">View PDF</a>
            )}
          </div>
        )}
        <button type="submit" disabled={loading} style={{ padding: '10px 0', background: t.accent, color: t.surface, border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
        {status && <div style={{ color: status.includes('success') ? t.positive : t.error, fontSize: 13 }}>{status}</div>}
      </form>
    </div>
  );
}
