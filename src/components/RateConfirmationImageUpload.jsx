import { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function RateConfirmationImageUpload({ invoiceId }) {
  const { theme } = useTheme();
  const t = themes[theme];
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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
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
            <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, border: `1px solid ${t.borderLight}` }} />
          ) : (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">View PDF</a>
          )}
        </div>
      )}
      <button type="submit" disabled={loading} style={{ padding: '8px 0', background: t.accent, color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
      {status && <div style={{ color: status.includes('success') ? t.positive : t.error, fontSize: 13 }}>{status}</div>}
    </form>
  );
}
