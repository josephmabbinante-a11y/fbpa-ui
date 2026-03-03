import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadCarriersCsv } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsvPreview(csvText) {
  const lines = String(csvText || '').split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1, 21).map((line, rowIndex) => {
    const cells = parseCsvLine(line);
    const record = { __row: rowIndex + 2 };
    headers.forEach((header, headerIndex) => {
      record[header] = String(cells[headerIndex] || '').trim();
    });
    return record;
  });

  return { headers, rows, totalRows: Math.max(0, lines.length - 1) };
}

export default function CarrierBulkImport() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState({ headers: [], rows: [], totalRows: 0 });

  const cardStyle = useMemo(() => ({
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    padding: 14,
  }), [t]);

  const inputStyle = {
    minHeight: 36,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '8px 10px',
    fontSize: 12,
  };

  const onPickFile = async (nextFile) => {
    setFile(nextFile || null);
    setMessage('');
    if (!nextFile) {
      setPreview({ headers: [], rows: [], totalRows: 0 });
      return;
    }

    try {
      const previewBytes = 1024 * 1024;
      const csvText = await nextFile.slice(0, previewBytes).text();
      const parsed = parseCsvPreview(csvText);
      setPreview({
        ...parsed,
        totalRows: nextFile.size > previewBytes
          ? null
          : Number(parsed.totalRows || 0),
      });
      if (!parsed.headers.length) {
        setMessage('Selected file has no readable CSV header row.');
      } else if (nextFile.size > previewBytes) {
        setMessage('Large file detected: previewing first part only. Full file will still import.');
      }
    } catch (error) {
      setPreview({ headers: [], rows: [], totalRows: 0 });
      setMessage(error?.message || 'Unable to parse CSV preview.');
    }
  };

  const onImport = async () => {
    if (!file) {
      setMessage('Select a CSV file first.');
      return;
    }

    setImporting(true);
    setMessage('');
    const result = await uploadCarriersCsv(file);
    setImporting(false);

    if (result?.error) {
      setMessage(`Import failed: ${result.error}`);
      return;
    }

    const imported = Number(result?.imported || 0);
    const updated = Number(result?.updated || 0);
    const skipped = Number(result?.skipped || 0);
    const errorCount = Number(result?.errorCount || 0);

    navigate('/carriers', {
      state: {
        message: `Bulk import complete: ${imported} imported, ${updated} updated, ${skipped} skipped${errorCount ? `, ${errorCount} row errors` : ''}.`,
      },
    });
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Bulk Import Carriers</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Upload a CSV, preview first 20 rows, then import into Carriers.</div>
        </div>
        <button type="button" onClick={() => navigate('/carriers')} style={{ ...inputStyle, cursor: 'pointer', fontWeight: 700 }}>
          Back to Carriers
        </button>
      </header>

      <section style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Templates</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/templates/carrier_bulk_import_template.csv" download style={{ ...inputStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontWeight: 700 }}>
            Download Simple Carrier Template
          </a>
          <a href="/templates/carrier_bulk_import_enterprise_template.csv" download style={{ ...inputStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontWeight: 700 }}>
            Download Enterprise Carrier Template
          </a>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Upload CSV</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => onPickFile(event.target.files?.[0] || null)}
            style={{ ...inputStyle, minWidth: 280 }}
          />
          <button type="button" onClick={onImport} disabled={!file || importing} style={{ ...inputStyle, cursor: !file || importing ? 'not-allowed' : 'pointer', fontWeight: 700, borderColor: t.accent, opacity: !file || importing ? 0.7 : 1 }}>
            {importing ? 'Importing...' : 'Import File'}
          </button>
        </div>
        {file ? <div style={{ marginTop: 8, fontSize: 12, color: t.textSecondary }}>Selected: {file.name}</div> : null}
        {message ? <div style={{ marginTop: 8, fontSize: 12, color: message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') ? t.error : t.textSecondary }}>{message}</div> : null}
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Preview (first 20 rows)</div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            Rows in file: {preview.totalRows == null ? 'Large file (full row count not precomputed)' : Number(preview.totalRows || 0).toLocaleString()}
          </div>
        </div>

        {preview.headers.length === 0 ? (
          <div style={{ fontSize: 12, color: t.textSecondary }}>Choose a CSV file to preview columns and rows.</div>
        ) : (
          <div style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ background: t.bgAlt }}>
                <tr>
                  <th style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${t.border}` }}>Row</th>
                  {preview.headers.slice(0, 10).map((header) => (
                    <th key={header} style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.__row}>
                    <td style={{ padding: 8, borderBottom: `1px solid ${t.border}`, color: t.textSecondary }}>{row.__row}</td>
                    {preview.headers.slice(0, 10).map((header) => (
                      <td key={`${row.__row}-${header}`} style={{ padding: 8, borderBottom: `1px solid ${t.border}`, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row[header] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
