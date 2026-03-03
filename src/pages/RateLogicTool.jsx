
import React from 'react';
import { RateCalculator } from '../components/RateCalculator.jsx';
import QuoteEmailGenerator from '../components/QuoteEmailGenerator';

export default function RateLogicTool() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: 10,
          background: 'var(--surface)',
          padding: '12px 14px',
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>Bulk Rate Import Templates</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Download a starter CSV, fill your lanes, then upload through your bulk import workflow.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href="/templates/rate_bulk_import_template.csv"
            download
            style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', background: 'var(--bg-alt)' }}
          >
            Download Standard Template
          </a>
          <a
            href="/templates/rate_bulk_import_template_extended.csv"
            download
            style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', background: 'var(--bg-alt)' }}
          >
            Download Extended Template
          </a>
        </div>
      </section>
      <RateCalculator />
      <QuoteEmailGenerator />
    </div>
  );
}
