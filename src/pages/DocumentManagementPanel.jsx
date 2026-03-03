import React from 'react';
import { FaSearch, FaTrash, FaDownload, FaEye } from 'react-icons/fa';
import { listDocuments, deleteDocument, downloadDocument } from '../api/client';

export default function DocumentManagementPanel({ t }) {
  const [docQuery, setDocQuery] = React.useState('');
  const [docResults, setDocResults] = React.useState([]);
  const [docLoading, setDocLoading] = React.useState(false);
  const [docMessage, setDocMessage] = React.useState('');

  // Search handler
  const handleDocSearch = async () => {
    setDocLoading(true);
    setDocMessage('');
    try {
      const result = await listDocuments({ q: docQuery });
      setDocResults(Array.isArray(result?.items) ? result.items : []);
      if (!result?.items?.length) setDocMessage('No documents found.');
    } catch (err) {
      setDocMessage('Error searching documents.');
    }
    setDocLoading(false);
  };

  // Actions
  const handleDocDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    await deleteDocument(docId);
    setDocResults((prev) => prev.filter((d) => d.id !== docId));
  };
  const handleDocDownload = (docId) => {
    downloadDocument(docId);
  };
  const handleDocView = (doc) => {
    window.open(doc.url, '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <FaSearch style={{ color: t.textSecondary }} />
        <input
          type="text"
          placeholder="Search documents..."
          value={docQuery}
          onChange={e => setDocQuery(e.target.value)}
          style={{ flex: 1, padding: 6, borderRadius: 6, border: `1px solid ${t.border}` }}
          onKeyDown={e => { if (e.key === 'Enter') handleDocSearch(); }}
        />
        <button type="button" style={{ padding: '6px 14px', borderRadius: 6, background: t.primary, color: t.onPrimary, border: 'none', fontWeight: 600 }} onClick={handleDocSearch} disabled={docLoading}>
          {docLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {docMessage && <div style={{ color: t.danger, fontSize: 13, marginBottom: 8 }}>{docMessage}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
          <thead>
            <tr style={{ background: t.surface }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Uploaded</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Size</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docResults.map(doc => (
              <tr key={doc.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ padding: 8 }}>{doc.name}</td>
                <td style={{ padding: 8 }}>{doc.type || '—'}</td>
                <td style={{ padding: 8 }}>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : '—'}</td>
                <td style={{ padding: 8 }}>{doc.size ? `${(doc.size/1024).toFixed(1)} KB` : '—'}</td>
                <td style={{ padding: 8, textAlign: 'center' }}>
                  <button title="View" style={{ marginRight: 6, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleDocView(doc)}><FaEye color={t.primary} /></button>
                  <button title="Download" style={{ marginRight: 6, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleDocDownload(doc.id)}><FaDownload color={t.primary} /></button>
                  <button title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleDocDelete(doc.id)}><FaTrash color={t.danger} /></button>
                </td>
              </tr>
            ))}
            {docResults.length === 0 && !docLoading && (
              <tr><td colSpan={5} style={{ padding: 12, color: t.textSecondary, textAlign: 'center' }}>No documents to display.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
