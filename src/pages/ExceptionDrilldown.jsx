import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';
import mockExceptions from '../mock/exceptions';
import mockInvoices from '../mock/invoices';

export default function ExceptionDrilldown() {
  const { id } = useParams(); // id = exception id
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = theme;

  // Find exception and related invoice
  const exception = mockExceptions.find(e => String(e.id) === String(id));
  const invoice = exception ? mockInvoices.find(inv => inv.invoiceNumber === exception.invoiceNumber) : null;

  if (!exception) {
    return (
      <div style={{ padding: 32, color: t.text }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Back</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Exception not found</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, background: t.bg, color: t.text, minHeight: '100vh' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16, background: t.bgAlt, border: `1px solid ${t.border}`, color: t.text, borderRadius: 6, padding: '8px 12px', cursor: 'pointer' }}>Back</button>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Exception Detail</h1>
      <div style={{ marginBottom: 16, color: t.textSecondary }}>
        <strong>Invoice:</strong> {exception.invoiceNumber} &nbsp;|&nbsp;
        <strong>Carrier:</strong> {exception.carrier} &nbsp;|&nbsp;
        <strong>Status:</strong> {exception.status} &nbsp;|&nbsp;
        <strong>Created:</strong> {new Date(exception.createdAt).toLocaleDateString()}
      </div>
      <div style={{ marginBottom: 20, fontSize: 15 }}>
        <strong>Reason:</strong> {exception.reason}<br />
        <strong>Category:</strong> {exception.category || 'Uncategorized'}<br />
        <strong>Action:</strong> {exception.action || 'No Action'}
      </div>
      <div style={{ marginBottom: 24, background: t.surface, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Imaging & Data Ingestion Details</h2>
        <div style={{ fontSize: 14, marginBottom: 8 }}>
          <strong>Error Identified:</strong> {exception.imagingError || exception.reason}
        </div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>
          <strong>Data Extracted:</strong> {exception.dataExtracted || 'N/A'}
        </div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>
          <strong>Field(s) in Error:</strong> {exception.errorFields ? exception.errorFields.join(', ') : 'N/A'}
        </div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>
          <strong>System Notes:</strong> {exception.notes || 'No additional notes.'}
        </div>
      </div>
      {invoice && (
        <div style={{ background: t.bgAlt, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Invoice Snapshot</h2>
          <div style={{ fontSize: 14, marginBottom: 6 }}><strong>Amount:</strong> ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: 14, marginBottom: 6 }}><strong>Savings:</strong> {invoice.savings ? `$${invoice.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</div>
          <div style={{ fontSize: 14, marginBottom: 6 }}><strong>Status:</strong> {invoice.status}</div>
        </div>
      )}
      <div style={{ background: t.surface, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Rating Score</h2>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.positive, marginBottom: 8 }}>
          {typeof exception.ratingScore === 'number' ? `${exception.ratingScore}%` : 'N/A'}
        </div>
        <div style={{ height: 12, background: t.bgAlt, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${exception.ratingScore || 0}%`, height: '100%', background: t.positive }} />
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary }}>
          {exception.ratingExplanation || 'Score based on data quality, field match, and error severity.'}
        </div>
      </div>
    </div>
  );
}
