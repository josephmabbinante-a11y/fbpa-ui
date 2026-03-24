import express from 'express';
const router = express.Router();

// In-memory document store for demo (replace with DB in production)
const documents = [
  {
    id: 'doc-1',
    name: 'Sample Invoice.pdf',
    type: 'invoice',
    uploadedAt: new Date().toISOString(),
    size: 102400,
    url: 'https://example.com/sample-invoice.pdf',
  },
  {
    id: 'doc-2',
    name: 'Rate Confirmation.docx',
    type: 'rate-confirmation',
    uploadedAt: new Date().toISOString(),
    size: 20480,
    url: 'https://example.com/rate-confirmation.docx',
  },
];

// List documents
router.get('/api/documents', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  let items = documents;
  if (q) {
    items = items.filter(doc => doc.name.toLowerCase().includes(q));
  }
  res.json({ items });
});

// Delete document
router.delete('/api/documents/:id', (req, res) => {
  const idx = documents.findIndex(doc => doc.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Document not found' });
  documents.splice(idx, 1);
  res.json({ ok: true });
});

// Download document (redirect to URL for demo)
router.get('/api/documents/:id/download', (req, res) => {
  const doc = documents.find(doc => doc.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.redirect(doc.url);
});


const SUPPORTED_DOCUMENT_TYPES = new Set(['invoice', 'rate-confirmation', 'bol', 'lumper-receipt', 'carrier-packet']);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function toDisplayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildRows(rows, columns) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return `<tr><td colspan="${columns.length}" class="muted">No records provided</td></tr>`;
  }

  return rows
    .map((row) => {
      const tds = columns
        .map((column) => `<td>${escapeHtml(column.render(row))}</td>`)
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');
}

function sharedStyles(accentColor) {
  const accent = accentColor || '#2f80ed';
  return `
    <style>
      :root {
        --text: #1e2b41;
        --muted: #64748b;
        --border: #d7dfec;
        --bg-soft: #f6f8fc;
        --accent: ${escapeHtml(accent)};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        font-family: Arial, Helvetica, sans-serif;
        color: var(--text);
        background: #fff;
      }
      .doc {
        max-width: 980px;
        margin: 0 auto;
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
      }
      .head {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding: 20px;
        border-bottom: 1px solid var(--border);
        background: var(--bg-soft);
      }
      .logo {
        max-height: 56px;
        max-width: 210px;
        object-fit: contain;
        margin-bottom: 10px;
      }
      .title {
        margin: 0;
        font-size: 24px;
        letter-spacing: 0.4px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border: 1px solid var(--accent);
        border-radius: 999px;
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
      }
      .grid {
        display: grid;
        gap: 14px;
        padding: 18px 20px;
      }
      .grid-2 {
        grid-template-columns: 1fr 1fr;
      }
      .panel {
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 12px;
      }
      .label {
        color: var(--muted);
        font-size: 12px;
        margin-bottom: 3px;
      }
      .value {
        font-size: 14px;
        font-weight: 600;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid var(--border);
        padding: 8px;
        text-align: left;
        font-size: 13px;
      }
      th {
        background: var(--bg-soft);
        color: #3b4b69;
        font-weight: 700;
      }
      .totals {
        margin-left: auto;
        width: 320px;
      }
      .totals td {
        font-size: 13px;
      }
      .totals tr:last-child td {
        font-weight: 800;
        font-size: 14px;
      }
      .muted {
        color: var(--muted);
        font-size: 12px;
      }
      .sign {
        padding: 26px 0 8px;
        border-bottom: 1px solid var(--border);
      }
      .footer {
        padding: 14px 20px 18px;
        color: var(--muted);
        font-size: 12px;
      }
    </style>
  `;
}

function baseHeader({ typeLabel, branding, load }) {
  const companyName = branding?.companyName || 'Your Company';
  const logoUrl = branding?.logoUrl || '';
  const loadId = load?.id || 'NEW';

  return `
    <div class="head">
      <div>
        ${logoUrl ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="Company logo" />` : ''}
        <h1 class="title">${escapeHtml(companyName)}</h1>
        <div class="muted">${escapeHtml(branding?.address || '')}</div>
        <div class="muted">${escapeHtml(branding?.phone || '')} ${branding?.email ? `• ${escapeHtml(branding.email)}` : ''}</div>
      </div>
      <div style="text-align:right">
        <div class="chip">${escapeHtml(typeLabel)}</div>
        <div style="margin-top:10px" class="label">Document #</div>
        <div class="value">${escapeHtml(`${typeLabel.replace(/\s+/g, '-').toUpperCase()}-${loadId}`)}</div>
        <div style="margin-top:10px" class="label">Generated</div>
        <div class="value">${escapeHtml(toDisplayDate(new Date().toISOString()))}</div>
      </div>
    </div>
  `;
}

function buildInvoiceDocument(payload) {
  const { branding = {}, load = {}, customer = {}, stops = [], financials = {} } = payload;
  const incomeItems = Array.isArray(financials.incomeItems) ? financials.incomeItems : [];
  const expenses = Array.isArray(financials.expenseItems) ? financials.expenseItems : [];
  const incomeTotal = incomeItems.reduce((sum, item) => sum + (Number(item.rate || 0) * Number(item.quantity || 0)), 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + (Number(item.rate || 0) * Number(item.quantity || 0)), 0);
  const balanceDue = incomeTotal;

  const lineColumns = [
    { header: 'Company', render: (row) => row.company || customer.name || 'Customer' },
    { header: 'Description', render: (row) => row.description || 'Line item' },
    { header: 'Qty', render: (row) => Number(row.quantity || 0).toFixed(2) },
    { header: 'Rate', render: (row) => toMoney(row.rate || 0) },
    { header: 'Amount', render: (row) => toMoney(Number(row.rate || 0) * Number(row.quantity || 0)) },
  ];

  const stopColumns = [
    { header: 'Order', render: (row) => row.order || '—' },
    { header: 'Action', render: (row) => row.action || '—' },
    { header: 'Location', render: (row) => row.location || row.address || '—' },
    { header: 'Schedule', render: (row) => row.scheduleStart || '—' },
  ];

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Customer Invoice ${escapeHtml(load.id || '')}</title>
        ${sharedStyles(branding?.accentColor)}
      </head>
      <body>
        <div class="doc">
          ${baseHeader({ typeLabel: 'Customer Invoice', branding, load })}

          <section class="grid grid-2">
            <div class="panel">
              <div class="label">Bill To</div>
              <div class="value">${escapeHtml(customer.name || load.customer?.name || 'Customer')}</div>
              <div class="muted">${escapeHtml(customer.address || 'Address not provided')}</div>
              <div class="muted">${escapeHtml(customer.email || '')}</div>
              <div class="muted">${escapeHtml(customer.phone || '')}</div>
            </div>
            <div class="panel">
              <div class="label">Load Information</div>
              <div class="value">Load ID: ${escapeHtml(load.id || 'NEW')}</div>
              <div class="muted">Origin: ${escapeHtml(load.origin?.city ? `${load.origin.city}, ${load.origin.state || ''}` : '—')}</div>
              <div class="muted">Destination: ${escapeHtml(load.destination?.city ? `${load.destination.city}, ${load.destination.state || ''}` : '—')}</div>
              <div class="muted">Pickup: ${escapeHtml(toDisplayDate(load.pickupAt || stops[0]?.scheduleStart))}</div>
              <div class="muted">Delivery: ${escapeHtml(toDisplayDate(load.deliveryAt || stops[stops.length - 1]?.scheduleEnd || stops[stops.length - 1]?.scheduleStart))}</div>
            </div>
          </section>

          <section class="grid">
            <div class="value">Invoice Line Items</div>
            <table>
              <thead>
                <tr>${lineColumns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${buildRows(incomeItems, lineColumns)}
              </tbody>
            </table>
          </section>

          <section class="grid">
            <div class="value">Stop Summary</div>
            <table>
              <thead>
                <tr>${stopColumns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${buildRows(stops, stopColumns)}
              </tbody>
            </table>
          </section>

          <section class="grid">
            <table class="totals">
              <tbody>
                <tr><td>Subtotal</td><td style="text-align:right">${escapeHtml(toMoney(incomeTotal))}</td></tr>
                <tr><td>Carrier Cost (Internal)</td><td style="text-align:right">${escapeHtml(toMoney(expenseTotal))}</td></tr>
                <tr><td>Balance Due</td><td style="text-align:right">${escapeHtml(toMoney(balanceDue))}</td></tr>
              </tbody>
            </table>
          </section>

          <div class="footer">
            Payment Terms: ${escapeHtml(payload?.terms?.paymentTerms || 'Net 30')}<br />
            ${escapeHtml(payload?.terms?.footerNote || 'Thank you for your business.')}
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildRateConfirmationDocument(payload) {
  const { branding = {}, load = {}, carrier = {}, stops = [], financials = {}, terms = {} } = payload;
  const expenses = Array.isArray(financials.expenseItems) ? financials.expenseItems : [];
  const carrierPay = expenses.reduce((sum, item) => sum + (Number(item.rate || 0) * Number(item.quantity || 0)), 0);

  const stopColumns = [
    { header: 'Order', render: (row) => row.order || '—' },
    { header: 'Type', render: (row) => row.action || '—' },
    { header: 'Location', render: (row) => row.location || row.address || '—' },
    { header: 'Date/Time', render: (row) => row.scheduleStart || '—' },
    { header: 'Cargo', render: (row) => row.cargoDescription || '—' },
  ];

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Rate Confirmation ${escapeHtml(load.id || '')}</title>
        ${sharedStyles(branding?.accentColor)}
      </head>
      <body>
        <div class="doc">
          ${baseHeader({ typeLabel: 'Rate Confirmation', branding, load })}

          <section class="grid grid-2">
            <div class="panel">
              <div class="label">Carrier</div>
              <div class="value">${escapeHtml(carrier.companyName || load.carrier?.name || 'Carrier')}</div>
              <div class="muted">MC: ${escapeHtml(carrier.mcNumber || '—')} • USDOT: ${escapeHtml(carrier.usdotNumber || '—')}</div>
              <div class="muted">${escapeHtml(carrier.phone || '')} ${carrier.email ? `• ${escapeHtml(carrier.email)}` : ''}</div>
            </div>
            <div class="panel">
              <div class="label">Load Details</div>
              <div class="value">Load ID: ${escapeHtml(load.id || 'NEW')}</div>
              <div class="muted">Equipment: ${escapeHtml(load.equipment || '—')}</div>
              <div class="muted">Miles: ${escapeHtml(load.miles || '—')}</div>
              <div class="muted">Carrier Pay: ${escapeHtml(toMoney(carrierPay || load.carrierCost || 0))}</div>
            </div>
          </section>

          <section class="grid">
            <div class="value">Stop Schedule</div>
            <table>
              <thead>
                <tr>${stopColumns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${buildRows(stops, stopColumns)}
              </tbody>
            </table>
          </section>

          <section class="grid">
            <div class="panel">
              <div class="label">Terms & Instructions</div>
              <div class="value" style="font-weight:500">${escapeHtml(terms.rateConfirmationTerms || 'Carrier agrees to transport freight per schedule and conditions outlined in this confirmation.')}</div>
              <div class="sign"></div>
              <div class="muted">Authorized Carrier Signature / Date</div>
            </div>
          </section>

          <div class="footer">
            Dispatch Contact: ${escapeHtml(branding?.email || 'dispatch@company.com')} • ${escapeHtml(branding?.phone || '')}
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildBolDocument(payload) {
  const { branding = {}, load = {}, customer = {}, carrier = {}, stops = [], terms = {} } = payload;

  const firstStop = stops[0] || {};
  const lastStop = stops[stops.length - 1] || {};

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>BOL ${escapeHtml(load.id || '')}</title>
        ${sharedStyles(branding?.accentColor)}
      </head>
      <body>
        <div class="doc">
          ${baseHeader({ typeLabel: 'Bill of Lading', branding, load })}

          <section class="grid grid-2">
            <div class="panel">
              <div class="label">Shipper</div>
              <div class="value">${escapeHtml(terms.shipperName || branding.companyName || 'Shipper')}</div>
              <div class="muted">${escapeHtml(terms.shipperAddress || branding.address || 'Address not provided')}</div>
            </div>
            <div class="panel">
              <div class="label">Consignee</div>
              <div class="value">${escapeHtml(customer.name || load.customer?.name || 'Consignee')}</div>
              <div class="muted">${escapeHtml(customer.address || lastStop.address || 'Address not provided')}</div>
            </div>
            <div class="panel">
              <div class="label">Origin</div>
              <div class="value">${escapeHtml(firstStop.location || firstStop.address || `${load.origin?.city || ''} ${load.origin?.state || ''}`.trim() || '—')}</div>
              <div class="muted">Pickup: ${escapeHtml(toDisplayDate(load.pickupAt || firstStop.scheduleStart))}</div>
            </div>
            <div class="panel">
              <div class="label">Destination</div>
              <div class="value">${escapeHtml(lastStop.location || lastStop.address || `${load.destination?.city || ''} ${load.destination?.state || ''}`.trim() || '—')}</div>
              <div class="muted">Delivery: ${escapeHtml(toDisplayDate(load.deliveryAt || lastStop.scheduleEnd || lastStop.scheduleStart))}</div>
            </div>
          </section>

          <section class="grid">
            <div class="value">Freight Details</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Weight</th>
                  <th>Pieces</th>
                </tr>
              </thead>
              <tbody>
                ${buildRows(stops, [
                  { header: 'Description', render: (row) => row.cargoDescription || 'Freight' },
                  { header: 'Reference', render: (row) => row.referenceNumbers || load.id || '—' },
                  { header: 'Weight', render: () => String(load.weight || '—') },
                  { header: 'Pieces', render: () => String(load.pieces || '—') },
                ])}
              </tbody>
            </table>
          </section>

          <section class="grid grid-2">
            <div class="panel">
              <div class="label">Carrier</div>
              <div class="value">${escapeHtml(carrier.companyName || load.carrier?.name || 'Carrier')}</div>
              <div class="muted">MC: ${escapeHtml(carrier.mcNumber || '—')} • USDOT: ${escapeHtml(carrier.usdotNumber || '—')}</div>
            </div>
            <div class="panel">
              <div class="label">Freight Terms</div>
              <div class="value">${escapeHtml(terms.freightTerms || 'Prepaid')}</div>
              <div class="muted">Special Instructions: ${escapeHtml(terms.specialInstructions || 'None provided')}</div>
            </div>
          </section>

          <section class="grid grid-2">
            <div>
              <div class="sign"></div>
              <div class="muted">Shipper Signature / Date</div>
            </div>
            <div>
              <div class="sign"></div>
              <div class="muted">Carrier Signature / Date</div>
            </div>
          </section>

          <div class="footer">
            BOL generated for load ${escapeHtml(load.id || 'NEW')}.
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildLumperReceiptDocument(payload) {
  const { branding = {}, load = {}, carrier = {}, stops = [], terms = {} } = payload;
  const lumperAmount = Number(terms.lumperAmount || 0);
  const facility = terms.facility || stops[stops.length - 1]?.location || 'Delivery Facility';
  const receiptNumber = terms.receiptNumber || `LR-${load.id || 'NEW'}-${Date.now().toString(36).toUpperCase()}`;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Lumper Receipt ${escapeHtml(load.id || '')}</title>
        ${sharedStyles(branding?.accentColor)}
      </head>
      <body>
        <div class="doc">
          ${baseHeader({ typeLabel: 'Lumper Receipt', branding, load })}

          <section class="grid grid-2">
            <div class="panel">
              <div class="label">Receipt #</div>
              <div class="value">${escapeHtml(receiptNumber)}</div>
              <div style="margin-top:10px" class="label">Facility</div>
              <div class="value">${escapeHtml(facility)}</div>
            </div>
            <div class="panel">
              <div class="label">Carrier</div>
              <div class="value">${escapeHtml(carrier.companyName || load.carrier?.name || 'Carrier')}</div>
              <div class="muted">MC: ${escapeHtml(carrier.mcNumber || '—')} • USDOT: ${escapeHtml(carrier.usdotNumber || '—')}</div>
              <div style="margin-top:10px" class="label">Driver</div>
              <div class="value">${escapeHtml(terms.driverName || 'Driver on file')}</div>
            </div>
          </section>

          <section class="grid">
            <div class="panel">
              <div class="label">Load ID</div>
              <div class="value">${escapeHtml(load.id || 'NEW')}</div>
              <div class="muted">Origin: ${escapeHtml(load.origin?.city ? `${load.origin.city}, ${load.origin.state || ''}` : load.origin || '—')}</div>
              <div class="muted">Destination: ${escapeHtml(load.destination?.city ? `${load.destination.city}, ${load.destination.state || ''}` : load.destination || '—')}</div>
            </div>
          </section>

          <section class="grid">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Description</th>
                  <th style="text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Lumper / Unloading</td>
                  <td>${escapeHtml(terms.serviceDescription || 'Unloading services at delivery facility')}</td>
                  <td style="text-align:right; font-weight:700">${escapeHtml(toMoney(lumperAmount))}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="grid grid-2">
            <div>
              <div class="label">Payment Method</div>
              <div class="value">${escapeHtml(terms.paymentMethod || 'Comchek / T-Chek')}</div>
            </div>
            <div>
              <div class="label">Authorization Code</div>
              <div class="value">${escapeHtml(terms.authorizationCode || 'Pending')}</div>
            </div>
          </section>

          <section class="grid grid-2">
            <div>
              <div class="sign"></div>
              <div class="muted">Facility Representative / Date</div>
            </div>
            <div>
              <div class="sign"></div>
              <div class="muted">Driver Signature / Date</div>
            </div>
          </section>

          <div class="footer">
            ${escapeHtml(terms.lumperNotes || 'Lumper receipt must be submitted with POD for reimbursement.')}
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildCarrierPacketDocument(payload) {
  const { branding = {}, load = {}, carrier = {}, stops = [], terms = {} } = payload;
  const dispatchContact = terms.dispatchContact || branding.email || 'dispatch@company.com';
  const dispatchPhone = terms.dispatchPhone || branding.phone || '';

  const stopRows = (stops || []).map((s, i) => `
    <tr>
      <td>${escapeHtml(i + 1)}</td>
      <td>${escapeHtml(s.action || (i === 0 ? 'Pickup' : 'Delivery'))}</td>
      <td>${escapeHtml(s.location || s.address || '—')}</td>
      <td>${escapeHtml(s.scheduleStart || '—')}</td>
      <td>${escapeHtml(s.cargoDescription || '—')}</td>
      <td>${escapeHtml(s.driverInstructions || s.referenceNumbers || '—')}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Carrier Packet ${escapeHtml(load.id || '')}</title>
        ${sharedStyles(branding?.accentColor)}
      </head>
      <body>
        <div class="doc">
          ${baseHeader({ typeLabel: 'Carrier Packet', branding, load })}

          <section class="grid grid-2">
            <div class="panel">
              <div class="label">Carrier</div>
              <div class="value">${escapeHtml(carrier.companyName || load.carrier?.name || 'Carrier')}</div>
              <div class="muted">MC: ${escapeHtml(carrier.mcNumber || '—')} • USDOT: ${escapeHtml(carrier.usdotNumber || '—')}</div>
              <div class="muted">${escapeHtml(carrier.phone || '')} ${carrier.email ? `• ${escapeHtml(carrier.email)}` : ''}</div>
            </div>
            <div class="panel">
              <div class="label">Load Details</div>
              <div class="value">Load ID: ${escapeHtml(load.id || 'NEW')}</div>
              <div class="muted">Equipment: ${escapeHtml(load.equipment || '—')}</div>
              <div class="muted">Weight: ${escapeHtml(load.weight || '—')} lbs</div>
              <div class="muted">Miles: ${escapeHtml(load.miles || load.mileage || '—')}</div>
            </div>
          </section>

          <section class="grid">
            <div class="value">Stop Schedule & Instructions</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Date/Time</th>
                  <th>Cargo</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${stopRows || '<tr><td colspan="6" class="muted">No stops provided</td></tr>'}
              </tbody>
            </table>
          </section>

          <section class="grid">
            <div class="panel">
              <div class="value" style="margin-bottom:8px">Carrier Instructions & Requirements</div>
              <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7">
                <li>Driver must check in with dispatch upon arrival at each stop</li>
                <li>All temperature-sensitive freight must maintain required temp range</li>
                <li>Driver must obtain signed BOL at pickup and POD at delivery</li>
                <li>Report any delays, damages, or exceptions immediately to dispatch</li>
                <li>No double-brokering — carrier must use own assets or approved subcontractors</li>
                ${terms.additionalInstructions ? `<li>${escapeHtml(terms.additionalInstructions)}</li>` : ''}
              </ul>
            </div>
          </section>

          <section class="grid grid-2">
            <div class="panel">
              <div class="label">Insurance Requirements</div>
              <div class="muted">Auto Liability: ${escapeHtml(terms.autoLiability || '$1,000,000 minimum')}</div>
              <div class="muted">Cargo Insurance: ${escapeHtml(terms.cargoInsurance || '$100,000 minimum')}</div>
              <div class="muted">General Liability: ${escapeHtml(terms.generalLiability || '$1,000,000 minimum')}</div>
            </div>
            <div class="panel">
              <div class="label">Dispatch Contact</div>
              <div class="value">${escapeHtml(dispatchContact)}</div>
              <div class="muted">${escapeHtml(dispatchPhone)}</div>
              <div style="margin-top:10px" class="label">After-Hours Emergency</div>
              <div class="muted">${escapeHtml(terms.emergencyPhone || dispatchPhone || 'Same as dispatch')}</div>
            </div>
          </section>

          <section class="grid grid-2">
            <div>
              <div class="sign"></div>
              <div class="muted">Carrier Representative / Date</div>
            </div>
            <div>
              <div class="sign"></div>
              <div class="muted">Broker Representative / Date</div>
            </div>
          </section>

          <div class="footer">
            This carrier packet, along with the executed Rate Confirmation, constitutes the complete dispatch documentation for Load ${escapeHtml(load.id || 'NEW')}.
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildDocument(type, payload) {
  if (type === 'invoice') return buildInvoiceDocument(payload);
  if (type === 'rate-confirmation') return buildRateConfirmationDocument(payload);
  if (type === 'lumper-receipt') return buildLumperReceiptDocument(payload);
  if (type === 'carrier-packet') return buildCarrierPacketDocument(payload);
  return buildBolDocument(payload);
}

router.post('/:type', (req, res) => {
  const type = String(req.params.type || '').trim().toLowerCase();
  if (!SUPPORTED_DOCUMENT_TYPES.has(type)) {
    return res.status(400).json({
      error: {
        code: 'UNSUPPORTED_DOCUMENT_TYPE',
        message: 'Supported types are invoice, rate-confirmation, bol, lumper-receipt, and carrier-packet',
      },
    });
  }

  const payload = req.body || {};
  const load = payload.load || {};
  const html = buildDocument(type, payload);
  const stamp = new Date().toISOString().slice(0, 10);
  const loadId = String(load.id || 'new').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${type}-${loadId}-${stamp}.html`;

  return res.json({
    document: {
      type,
      fileName,
      mimeType: 'text/html',
      html,
    },
  });
});

export default router;
