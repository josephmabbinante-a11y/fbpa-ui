import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import CollapsibleSection from '../components/CollapsibleSection';
import logo from '../assets/opscale-logo.svg';
import mockExceptions from '../mock/exceptions';
import uploadHistory from '../mock/uploads';
import {
  getExceptions,
  getDocumentRegistry,
  getAuditQueue,
  auditException,
  updateDocumentAudit,
} from '../api/client';

/* ── helpers ── */
const AUDIT_TABS = ['Audit Queue', 'Exceptions', 'Document History', 'Status Confirmations'];

const SOURCE_LABELS = {
  qr_code: 'QR Code',
  manual_upload: 'Manual Upload',
  email_ingest: 'Email',
  edi: 'EDI',
  api: 'API',
  carrier_portal: 'Carrier Portal',
};
const DOC_TYPE_LABELS = {
  carrier_invoice: 'Carrier Invoice',
  rate_confirmation: 'Rate Confirmation',
  bol: 'BOL',
  pod: 'POD',
  lumper_receipt: 'Lumper Receipt',
  carrier_packet: 'Carrier Packet',
  customer_invoice: 'Customer Invoice',
  qr_scan: 'QR Scan',
  manual_upload: 'Manual Upload',
  other: 'Other',
};
const AUDIT_STATUS_COLORS = {
  pending_review: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  auto_matched: '#6366f1',
  needs_attention: '#f97316',
};
const CONFIRMS_LABELS = {
  POD_RECEIVED: 'POD Received',
  CARRIER_ACCEPTED: 'Carrier Accepted',
  CARRIER_SIGNATURE: 'Carrier Signature',
  DELIVERY_CONFIRMED: 'Delivery Confirmed',
  INVOICE_VERIFIED: 'Invoice Verified',
};

function extractArr(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload[key])) return payload[key];
  return [];
}

export default function ExceptionsUploads() {
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = theme;

  const [activeTab, setActiveTab] = useState(0);
  const [exceptions, setExceptions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditQueue, setAuditQueue] = useState({ documents: [], exceptions: [] });
  const [loading, setLoading] = useState(true);
  const [auditingId, setAuditingId] = useState(null);

  /* ── data fetch ── */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [excRes, docRes, queueRes] = await Promise.all([
        getExceptions(),
        getDocumentRegistry(),
        getAuditQueue(),
      ]);
      setExceptions(extractArr(excRes, 'exceptions'));
      setDocuments(extractArr(docRes, 'documents'));
      setAuditQueue({
        documents: extractArr(queueRes, 'documents'),
        exceptions: extractArr(queueRes, 'exceptions'),
      });
    } catch {
      // Fallback to demo data
      if (demoMode) {
        setExceptions(extractArr(mockExceptions, 'exceptions'));
        setDocuments(uploadHistory.map((u, i) => ({ ...u, id: u.id || `demo-${i}`, documentType: 'manual_upload', source: 'manual_upload', auditStatus: 'pending_review', createdAt: u.uploadDate })));
      }
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => { refresh(); }, [refresh]);

  /* ── audit actions ── */
  const handleAuditException = async (excId, action) => {
    setAuditingId(excId);
    await auditException(excId, { auditAction: action, auditedBy: 'user' });
    await refresh();
    setAuditingId(null);
  };

  const handleAuditDocument = async (docId, action) => {
    setAuditingId(docId);
    await updateDocumentAudit(docId, { auditStatus: action, reviewedBy: 'user' });
    await refresh();
    setAuditingId(null);
  };

  /* ── derived data ── */
  const chartData = useMemo(() => {
    if (demoMode && Array.isArray(mockExceptions?.trend)) return mockExceptions.trend;
    const groups = new Map();
    exceptions.forEach((e) => {
      const key = e.status || 'Unknown';
      groups.set(key, (groups.get(key) || 0) + 1);
    });
    return Array.from(groups.entries()).map(([name, value]) => ({ name, value }));
  }, [exceptions, demoMode]);

  const pendingCount = auditQueue.documents.length + auditQueue.exceptions.length;
  const confirmedDocs = documents.filter((d) => d.confirmsStatus);
  const carrierInvoiceDocs = documents.filter((d) => d.documentType === 'carrier_invoice');

  /* ── styles ── */
  const tabBtn = (active) => ({
    padding: '7px 16px',
    borderRadius: 6,
    border: `1px solid ${active ? t.accent : t.border}`,
    background: active ? t.accent : 'transparent',
    color: active ? '#fff' : t.text,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    fontSize: 12,
    position: 'relative',
  });
  const badge = (color) => ({
    display: 'inline-block',
    background: color || t.accent,
    color: '#fff',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 7px',
    marginLeft: 6,
    verticalAlign: 'middle',
  });
  const tbl = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
  const th = { textAlign: 'left', padding: '6px 10px', fontWeight: 700, borderBottom: `1px solid ${t.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3, color: t.textSecondary };
  const td = { padding: '6px 10px', borderBottom: `1px solid ${t.borderLight || t.border}` };
  const ghostBtn = (color) => ({ background: 'transparent', border: `1px solid ${color}`, color, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 });

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, width: '100%', boxSizing: 'border-box' }}>

      {/* ── Header KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Pending Audit', value: pendingCount, color: '#f59e0b' },
          { label: 'Open Exceptions', value: exceptions.filter((e) => e.status === 'Open').length, color: '#ef4444' },
          { label: 'Carrier Invoices', value: carrierInvoiceDocs.length, color: '#6366f1' },
          { label: 'Documents Registered', value: documents.length, color: '#10b981' },
          { label: 'Status Confirmations', value: confirmedDocs.length, color: '#3b82f6' },
        ].map((kpi) => (
          <div key={kpi.label} className="card-surface" style={{ padding: '14px 16px', borderRadius: 8, borderLeft: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 11, color: t.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {AUDIT_TABS.map((tab, idx) => (
          <button key={tab} onClick={() => setActiveTab(idx)} style={tabBtn(activeTab === idx)}>
            {tab}
            {idx === 0 && pendingCount > 0 && <span style={badge('#f59e0b')}>{pendingCount}</span>}
          </button>
        ))}
      </div>

      {loading && <div style={{ fontSize: 12, color: t.textSecondary }}>Loading…</div>}

      {/* ━━━ TAB 0: Audit Queue ━━━ */}
      {activeTab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Exceptions needing audit */}
          <CollapsibleSection title={`Exception Audit (${auditQueue.exceptions.length})`} defaultOpen>
            {auditQueue.exceptions.length === 0 ? (
              <div style={{ fontSize: 12, color: t.textSecondary, padding: 12 }}>No exceptions pending audit.</div>
            ) : (
              <table style={tbl}><thead><tr>
                <th style={th}>Invoice</th><th style={th}>Carrier</th><th style={th}>Reason</th>
                <th style={th}>Severity</th><th style={th}>Source</th><th style={th}>Created</th><th style={th}>Actions</th>
              </tr></thead><tbody>
                {auditQueue.exceptions.map((exc) => (
                  <tr key={exc.id || exc._id}>
                    <td style={td}>{exc.invoiceNumber || exc.invoiceId || '-'}</td>
                    <td style={td}>{exc.carrier || exc.carrierId || '-'}</td>
                    <td style={td}>{exc.reason || '-'}</td>
                    <td style={td}><span style={{ color: exc.severity === 'Critical' ? '#ef4444' : exc.severity === 'High' ? '#f97316' : t.text }}>{exc.severity}</span></td>
                    <td style={td}>{exc.source ? SOURCE_LABELS[exc.source] || exc.source : 'System Rule'}</td>
                    <td style={td}>{exc.createdAt ? new Date(exc.createdAt).toLocaleDateString() : '-'}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={ghostBtn('#10b981')} disabled={auditingId === exc.id} onClick={() => handleAuditException(exc.id, 'approved')}>Approve</button>
                        <button style={ghostBtn('#ef4444')} disabled={auditingId === exc.id} onClick={() => handleAuditException(exc.id, 'rejected')}>Reject</button>
                        <Link to={`/exceptions/${exc.id}`} style={{ ...ghostBtn(t.accent), textDecoration: 'none' }}>Detail</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </CollapsibleSection>

          {/* Documents needing audit */}
          <CollapsibleSection title={`Document Audit (${auditQueue.documents.length})`} defaultOpen>
            {auditQueue.documents.length === 0 ? (
              <div style={{ fontSize: 12, color: t.textSecondary, padding: 12 }}>No documents pending audit.</div>
            ) : (
              <table style={tbl}><thead><tr>
                <th style={th}>File</th><th style={th}>Type</th><th style={th}>Source</th>
                <th style={th}>Invoice</th><th style={th}>Carrier</th><th style={th}>Confidence</th><th style={th}>Actions</th>
              </tr></thead><tbody>
                {auditQueue.documents.map((doc) => (
                  <tr key={doc.id || doc._id}>
                    <td style={td}>{doc.fileName}</td>
                    <td style={td}>{DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</td>
                    <td style={td}>{SOURCE_LABELS[doc.source] || doc.source}</td>
                    <td style={td}>{doc.invoiceNumber || doc.invoiceId || '-'}</td>
                    <td style={td}>{doc.carrierName || doc.carrierId || '-'}</td>
                    <td style={td}>
                      {doc.autoMatchConfidence != null ? (
                        <span style={{ fontWeight: 600, color: doc.autoMatchConfidence >= 90 ? '#10b981' : doc.autoMatchConfidence >= 70 ? '#f59e0b' : '#ef4444' }}>
                          {doc.autoMatchConfidence}%
                        </span>
                      ) : '-'}
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={ghostBtn('#10b981')} disabled={auditingId === doc.id} onClick={() => handleAuditDocument(doc.id, 'approved')}>Approve</button>
                        <button style={ghostBtn('#ef4444')} disabled={auditingId === doc.id} onClick={() => handleAuditDocument(doc.id, 'rejected')}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </CollapsibleSection>
        </div>
      )}

      {/* ━━━ TAB 1: Exceptions (linked to carrier invoices) ━━━ */}
      {activeTab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 20 }}>
          {/* Exceptions list */}
          <div className="card-surface card-elevated" style={{ minHeight: 360, padding: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={logo} alt="Opscale" style={{ height: 24 }} /> Exceptions
            </h2>
            <ExceptionBreakdownChart data={chartData} />
            <table style={{ ...tbl, marginTop: 14 }}><thead><tr>
              <th style={th}>Invoice</th><th style={th}>Carrier</th><th style={th}>Amount</th><th style={th}>Status</th><th style={th}>Audit</th><th style={th}></th>
            </tr></thead><tbody>
              {exceptions.slice(0, 50).map((exc) => (
                <tr key={exc.id || exc._id}>
                  <td style={td}>{exc.invoiceNumber || '-'}</td>
                  <td style={td}>{exc.carrier || '-'}</td>
                  <td style={td}>${Number(exc.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={td}><span style={{ color: exc.status === 'Open' ? '#f59e0b' : exc.status === 'Resolved' ? '#10b981' : t.textSecondary }}>{exc.status}</span></td>
                  <td style={td}><span style={{ color: exc.auditAction === 'approved' ? '#10b981' : exc.auditAction === 'rejected' ? '#ef4444' : '#f59e0b' }}>{exc.auditAction || 'pending'}</span></td>
                  <td style={td}><Link to={`/exceptions/${exc.id}`} style={{ color: t.accent, fontSize: 11 }}>Detail →</Link></td>
                </tr>
              ))}
            </tbody></table>
          </div>

          {/* Carrier invoice documents linked to exceptions */}
          <div className="card-surface card-elevated" style={{ minHeight: 360, padding: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Carrier Invoices Received</h2>
            {carrierInvoiceDocs.length === 0 ? (
              <div style={{ fontSize: 12, color: t.textSecondary }}>No carrier invoices registered yet.</div>
            ) : (
              <table style={tbl}><thead><tr>
                <th style={th}>File</th><th style={th}>Invoice</th><th style={th}>Source</th><th style={th}>Matched</th><th style={th}>Status</th>
              </tr></thead><tbody>
                {carrierInvoiceDocs.map((doc) => (
                  <tr key={doc.id || doc._id}>
                    <td style={td}>{doc.fileName}</td>
                    <td style={td}>{doc.invoiceNumber || '-'}</td>
                    <td style={td}>{SOURCE_LABELS[doc.source] || doc.source}</td>
                    <td style={td}>{doc.autoMatchConfidence != null ? `${doc.autoMatchConfidence}%` : '-'}</td>
                    <td style={td}><span style={{ color: AUDIT_STATUS_COLORS[doc.auditStatus] || t.text }}>{doc.auditStatus?.replace(/_/g, ' ') || '-'}</span></td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        </div>
      )}

      {/* ━━━ TAB 2: Document History (QR + manual + all sources) ━━━ */}
      {activeTab === 2 && (
        <div className="card-surface card-elevated" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Document Registry — All Sources</h2>
          {documents.length === 0 ? (
            <div style={{ fontSize: 12, color: t.textSecondary }}>No documents registered yet.</div>
          ) : (
            <table style={tbl}><thead><tr>
              <th style={th}>File</th><th style={th}>Type</th><th style={th}>Source</th>
              <th style={th}>Invoice</th><th style={th}>Load</th><th style={th}>Carrier</th>
              <th style={th}>Audit Status</th><th style={th}>Confirms</th><th style={th}>Date</th>
            </tr></thead><tbody>
              {documents.map((doc) => (
                <tr key={doc.id || doc._id}>
                  <td style={td}>{doc.fileName}</td>
                  <td style={td}>{DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</td>
                  <td style={td}><span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, background: doc.source === 'qr_code' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.1)', color: doc.source === 'qr_code' ? '#6366f1' : '#10b981' }}>{SOURCE_LABELS[doc.source] || doc.source}</span></td>
                  <td style={td}>{doc.invoiceNumber || doc.invoiceId || '-'}</td>
                  <td style={td}>{doc.loadId || '-'}</td>
                  <td style={td}>{doc.carrierName || doc.carrierId || '-'}</td>
                  <td style={td}><span style={{ color: AUDIT_STATUS_COLORS[doc.auditStatus] || t.text, fontWeight: 600 }}>{doc.auditStatus?.replace(/_/g, ' ') || '-'}</span></td>
                  <td style={td}>{doc.confirmsStatus ? CONFIRMS_LABELS[doc.confirmsStatus] || doc.confirmsStatus : '-'}</td>
                  <td style={td}>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      )}

      {/* ━━━ TAB 3: Status Confirmations (POD, carrier acceptance, signatures) ━━━ */}
      {activeTab === 3 && (
        <div className="card-surface card-elevated" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Status Confirmations from Documents</h2>
          <p style={{ fontSize: 12, color: t.textSecondary, marginBottom: 14 }}>
            Documents that automatically confirm load statuses — POD received, carrier acceptance, carrier signatures, and delivery confirmation.
          </p>
          {confirmedDocs.length === 0 ? (
            <div style={{ fontSize: 12, color: t.textSecondary }}>No status confirmations yet.</div>
          ) : (
            <table style={tbl}><thead><tr>
              <th style={th}>File</th><th style={th}>Confirms</th><th style={th}>Source</th>
              <th style={th}>Invoice</th><th style={th}>Load</th><th style={th}>Carrier</th>
              <th style={th}>Confirmed At</th><th style={th}>Audit</th>
            </tr></thead><tbody>
              {confirmedDocs.map((doc) => (
                <tr key={doc.id || doc._id}>
                  <td style={td}>{doc.fileName}</td>
                  <td style={td}><strong style={{ color: '#3b82f6' }}>{CONFIRMS_LABELS[doc.confirmsStatus] || doc.confirmsStatus}</strong></td>
                  <td style={td}>{SOURCE_LABELS[doc.source] || doc.source}</td>
                  <td style={td}>{doc.invoiceNumber || '-'}</td>
                  <td style={td}>{doc.loadId || '-'}</td>
                  <td style={td}>{doc.carrierName || '-'}</td>
                  <td style={td}>{doc.statusConfirmedAt ? new Date(doc.statusConfirmedAt).toLocaleString() : '-'}</td>
                  <td style={td}><span style={{ color: AUDIT_STATUS_COLORS[doc.auditStatus] || t.text }}>{doc.auditStatus?.replace(/_/g, ' ')}</span></td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      )}
    </div>
  );
}
