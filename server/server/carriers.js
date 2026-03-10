import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { Carrier, Invoice } from './models.js';

const router = express.Router();
const upload = multer();

const normalizeString = (value) => (value || '').trim();
const normalizeKey = (value) => normalizeString(value).toLowerCase();
const normalizeMc = (value) => normalizeString(value).replace(/[^0-9a-z]/gi, '').toUpperCase();
const normalizeDot = (value) => normalizeString(value).replace(/\D/g, '');
const normalizeCsvHeader = (value) => normalizeString(value)
  .replace(/^\uFEFF/, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

function decodeCsvBuffer(buffer) {
  if (!buffer || buffer.length === 0) return '';
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return buffer.slice(2).toString('utf16le').replace(/^\uFEFF/, '');
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    const swapped = Buffer.from(buffer.slice(2));
    for (let i = 0; i + 1 < swapped.length; i += 2) {
      const first = swapped[i];
      swapped[i] = swapped[i + 1];
      swapped[i + 1] = first;
    }
    return swapped.toString('utf16le').replace(/^\uFEFF/, '');
  }
  return buffer.toString('utf8').replace(/^\uFEFF/, '');
}

// Centralized mock mode flag
const MOCK_MODE = process.env.MOCK_MODE === 'true';

const seedMemoryCarriers = [
  {
    id: 'cr-memory-1',
    name: 'Prime Logistics',
    nameLower: 'prime logistics',
    mcNumber: 'MC123456',
    mcNumberNormalized: 'MC123456',
    taxId: '12-3456789',
    email: 'ops@primelogistics.com',
    phone: '(555) 100-1000',
    paymentTerms: 'Net 30',
    insuranceExpiry: new Date('2026-12-31T00:00:00.000Z'),
    status: 'Active',
    totalSpend: 420000,
    openAP: 28000,
    invoiceCount: 128,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    id: 'cr-memory-2',
    name: 'Velocity Van Logistics',
    nameLower: 'velocity van logistics',
    mcNumber: 'MC654321',
    mcNumberNormalized: 'MC654321',
    taxId: '98-7654321',
    email: 'dispatch@velocityvan.com',
    phone: '(555) 200-2000',
    paymentTerms: 'Quick Pay',
    insuranceExpiry: new Date('2026-08-15T00:00:00.000Z'),
    status: 'Alert',
    totalSpend: 185000,
    openAP: 47200,
    invoiceCount: 63,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  },
  {
    id: 'cr-memory-3',
    name: 'Polar Freight Solutions',
    nameLower: 'polar freight solutions',
    mcNumber: 'MC112233',
    mcNumberNormalized: 'MC112233',
    taxId: '',
    email: 'carrier@polarfreight.com',
    phone: '(555) 300-3000',
    paymentTerms: 'Net 21',
    insuranceExpiry: new Date('2025-12-01T00:00:00.000Z'),
    status: 'Alert',
    totalSpend: 98000,
    openAP: 16500,
    invoiceCount: 39,
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-03T00:00:00.000Z'),
  }
];

let memoryCarriers = MOCK_MODE ? [...seedMemoryCarriers] : [];

function isDbReady() {
  // Only use DB if not in mock mode
  return !MOCK_MODE && mongoose.connection.readyState === 1;
}

function toSerializableCarrier(carrier) {
  return {
    ...carrier,
    totalSpend: Number(carrier?.totalSpend || 0),
    openAP: Number(carrier?.openAP || 0),
    invoiceCount: Number(carrier?.invoiceCount || 0),
  };
}

function upsertMemoryCarrier(nextCarrier) {
  const existingIndex = memoryCarriers.findIndex((carrier) => {
    if (nextCarrier.id && carrier.id === nextCarrier.id) return true;
    if (nextCarrier.dotNumber && carrier.dotNumber === nextCarrier.dotNumber) return true;
    if (nextCarrier.mcNumberNormalized && carrier.mcNumberNormalized === nextCarrier.mcNumberNormalized) return true;
    return false;
  });

  if (existingIndex >= 0) {
    memoryCarriers[existingIndex] = {
      ...memoryCarriers[existingIndex],
      ...nextCarrier,
      updatedAt: new Date(),
    };
    return { carrier: memoryCarriers[existingIndex], created: false };
  }

  const createdCarrier = {
    id: nextCarrier.id || `cr-${Date.now()}`,
    status: nextCarrier.status || 'Active',
    createdAt: nextCarrier.createdAt || new Date(),
    updatedAt: new Date(),
    totalSpend: 0,
    openAP: 0,
    invoiceCount: 0,
    ...nextCarrier,
  };

  memoryCarriers = [createdCarrier, ...memoryCarriers];
  return { carrier: createdCarrier, created: true };
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripHtml(text) {
  return decodeHtmlEntities(String(text || '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractField(html, labels = []) {
  const patterns = labels.map((label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`${escaped}[\\s\\S]{0,220}?<td[^>]*>([\\s\\S]{0,700}?)<\\/td>`, 'i');
  });

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const cleaned = stripHtml(match[1]);
      if (cleaned) return cleaned;
    }
  }

  return '';
}

function parseSaferSnapshot(html, fallback = {}) {
  const legalName = extractField(html, ['Legal Name', 'Legal Name:']);
  const dbaName = extractField(html, ['DBA Name', 'DBA Name:']);
  const dotNumberRaw = extractField(html, ['USDOT Number', 'U.S. DOT#', 'USDOT Number:']);
  const mcRaw = extractField(html, ['MC/MX/FF Number(s)', 'MC/MX Number', 'Docket Number']);
  const phone = extractField(html, ['Phone Number', 'Telephone', 'Phone Number:']);
  const physicalAddress = extractField(html, ['Physical Address', 'Physical Address:']);
  const mailingAddress = extractField(html, ['Mailing Address', 'Mailing Address:']);
  const entityType = extractField(html, ['Entity Type', 'Entity Type:']);
  const operatingStatus = extractField(html, ['Operating Status', 'USDOT Status', 'Operating Status:']);
  const outOfServiceDate = extractField(html, ['Out of Service Date', 'Out of Service Date:']);
  const powerUnits = extractField(html, ['Power Units', 'Power Units:']);
  const drivers = extractField(html, ['Drivers', 'Drivers:']);
  const mcs150Date = extractField(html, ['MCS-150 Form Date', 'MCS-150 Form Date:']);

  const mcMatch = mcRaw.match(/(?:MC|MX|FF)[-\s]*(\d+)/i) || mcRaw.match(/(\d{3,})/);
  const dotMatch = dotNumberRaw.match(/(\d{3,})/) || String(fallback.dotNumber || '').match(/(\d{3,})/);

  const normalizedDot = dotMatch ? dotMatch[1] : String(fallback.dotNumber || '').replace(/\D/g, '');
  const normalizedMc = mcMatch ? mcMatch[1] : String(fallback.mcNumber || '').replace(/\D/g, '');

  const statusText = String(operatingStatus || '').toLowerCase();
  let mappedStatus = 'Active';
  if (statusText.includes('inactive') || statusText.includes('out of service') || statusText.includes('revoked')) {
    mappedStatus = 'Inactive';
  }
  if (!normalizedMc || !normalizedDot || statusText.includes('not authorized')) {
    mappedStatus = 'Alert';
  }

  return {
    legalName: legalName || fallback.name || '',
    dbaName,
    dotNumber: normalizedDot,
    mcNumber: normalizedMc ? `MC${normalizedMc}` : '',
    phone,
    physicalAddress,
    mailingAddress,
    entityType,
    operatingStatus,
    outOfServiceDate,
    powerUnits,
    drivers,
    mcs150Date,
    mappedStatus,
  };
}

async function fetchSaferSnapshot({ dotNumber, mcNumber }) {
  const cleanedDot = String(dotNumber || '').replace(/\D/g, '');
  const cleanedMc = String(mcNumber || '').replace(/\D/g, '');

  if (!cleanedDot && !cleanedMc) {
    throw new Error('dotNumber or mcNumber is required');
  }

  const queryParam = cleanedDot ? 'USDOT' : 'MC_MX';
  const queryString = cleanedDot || cleanedMc;
  const sourceUrl = `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=${queryParam}&query_string=${encodeURIComponent(queryString)}`;

  const response = await fetch(sourceUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'fbpa-ui/1.0 (Carrier SAFER Lookup)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`SAFER request failed (${response.status})`);
  }

  const html = await response.text();
  if (/No records matching|No records were found|Unable to locate/i.test(html)) {
    const notFoundError = new Error('No carrier found in FMCSA SAFER for this query');
    notFoundError.code = 'SAFER_NOT_FOUND';
    throw notFoundError;
  }

  const snapshot = parseSaferSnapshot(html, { dotNumber: cleanedDot, mcNumber: cleanedMc });
  if (!snapshot.legalName && !snapshot.dotNumber && !snapshot.mcNumber) {
    throw new Error('Unable to parse FMCSA SAFER snapshot response');
  }

  return {
    snapshot,
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    query: {
      dotNumber: cleanedDot || '',
      mcNumber: cleanedMc || '',
    },
  };
}

async function getCarrierAggregates() {
  if (!isDbReady()) {
    return {};
  }

  const aggregates = await Invoice.aggregate([
    { $match: { type: 'AP', carrierId: { $ne: null } } },
    {
      $group: {
        _id: '$carrierId',
        totalSpend: { $sum: { $ifNull: ['$amount', 0] } },
        openAP: {
          $sum: {
            $cond: [{ $ne: ['$status', 'Paid'] }, { $ifNull: ['$amount', 0] }, 0],
          },
        },
        invoiceCount: { $sum: 1 },
      },
    },
  ]);

  return aggregates.reduce((acc, row) => {
    acc[row._id] = {
      totalSpend: row.totalSpend || 0,
      openAP: row.openAP || 0,
      invoiceCount: row.invoiceCount || 0,
    };
    return acc;
  }, {});
}

// Get all carriers with aggregates
router.get('/', async (req, res) => {
  try {
    const rawLimit = Number.parseInt(String(req.query?.limit || ''), 10);
    const hasLimit = Number.isFinite(rawLimit) && rawLimit > 0;
    const limit = hasLimit ? Math.min(rawLimit, 5000) : null;

    if (MOCK_MODE || !isDbReady()) {
      const sorted = [...memoryCarriers]
        .sort((left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime())
        .map((carrier) => toSerializableCarrier(carrier));
      const data = limit ? sorted.slice(0, limit) : sorted;
      return res.json({
        carriers: data,
        source: 'memory',
        total: sorted.length,
        returned: data.length,
        limited: Boolean(limit),
      });
    }

    const [carriers, aggregates, total] = await Promise.all([
      Carrier.find().sort({ updatedAt: -1 }).limit(limit || 0),
      getCarrierAggregates(),
      Carrier.countDocuments(),
    ]);

    const data = carriers.map((carrier) => {
      const metrics = aggregates[carrier.id] || { totalSpend: 0, openAP: 0, invoiceCount: 0 };
      return {
        ...carrier.toObject(),
        ...metrics,
      };
    });

    res.json({
      carriers: data,
      source: 'db',
      total: Number(total || 0),
      returned: data.length,
      limited: Boolean(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/fmcsa/snapshot', async (req, res) => {
  try {
    const dotNumber = normalizeString(req.query.dotNumber);
    const mcNumber = normalizeString(req.query.mcNumber);
    const result = await fetchSaferSnapshot({ dotNumber, mcNumber });
    return res.json(result);
  } catch (err) {
    if (err?.code === 'SAFER_NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(502).json({ error: err.message || 'Unable to fetch FMCSA SAFER snapshot' });
  }
});

router.post('/fmcsa/import', async (req, res) => {
  try {
    const dotNumber = normalizeString(req.body?.dotNumber);
    const mcNumber = normalizeString(req.body?.mcNumber);
    const fetched = await fetchSaferSnapshot({ dotNumber, mcNumber });
    const snapshot = fetched.snapshot;
    const normalizedMc = normalizeMc(snapshot.mcNumber);

    if (MOCK_MODE || !isDbReady()) {
      const normalizedDot = normalizeDot(snapshot.dotNumber);
      const result = upsertMemoryCarrier({
        id: `cr-${Date.now()}`,
        name: snapshot.legalName || `Carrier ${snapshot.dotNumber || snapshot.mcNumber || Date.now()}`,
        nameLower: normalizeKey(snapshot.legalName || ''),
        dotNumber: normalizedDot || undefined,
        mcNumber: snapshot.mcNumber || undefined,
        mcNumberNormalized: normalizedMc || undefined,
        phone: snapshot.phone || '',
        status: snapshot.mappedStatus || 'Active',
      });

      return res.status(result.created ? 201 : 200).json({
        carrier: toSerializableCarrier(result.carrier),
        created: result.created,
        source: {
          provider: 'fmcsa-safer',
          url: fetched.sourceUrl,
          fetchedAt: fetched.fetchedAt,
          persistence: 'memory',
        },
        snapshot,
      });
    }

    const existing = await Carrier.findOne({
      $or: [
        ...(snapshot.dotNumber ? [{ dotNumber: snapshot.dotNumber }] : []),
        ...(normalizedMc ? [{ mcNumberNormalized: normalizedMc }] : []),
      ],
    });

    let carrier;
    let created = false;

    if (existing) {
      existing.name = snapshot.legalName || existing.name;
      existing.nameLower = normalizeKey(existing.name);
      existing.dotNumber = snapshot.dotNumber || existing.dotNumber;
      existing.mcNumber = snapshot.mcNumber || existing.mcNumber;
      existing.mcNumberNormalized = normalizedMc || existing.mcNumberNormalized;
      existing.phone = snapshot.phone || existing.phone;
      existing.status = snapshot.mappedStatus || existing.status;
      existing.updatedAt = new Date();
      carrier = await existing.save();
    } else {
      created = true;
      carrier = await Carrier.create({
        id: `cr-${Date.now()}`,
        name: snapshot.legalName || `Carrier ${snapshot.dotNumber || snapshot.mcNumber || Date.now()}`,
        nameLower: normalizeKey(snapshot.legalName || ''),
        dotNumber: snapshot.dotNumber || undefined,
        mcNumber: snapshot.mcNumber || undefined,
        mcNumberNormalized: normalizedMc || undefined,
        phone: snapshot.phone || '',
        status: snapshot.mappedStatus || 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return res.status(created ? 201 : 200).json({
      carrier,
      created,
      source: {
        provider: 'fmcsa-safer',
        url: fetched.sourceUrl,
        fetchedAt: fetched.fetchedAt,
      },
      snapshot,
    });
  } catch (err) {
    if (err?.code === 'SAFER_NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(502).json({ error: err.message || 'Unable to import carrier from FMCSA SAFER' });
  }
});

router.post('/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let records;
  try {
    const csv = decodeCsvBuffer(req.file.buffer);
    records = parse(csv, {
      columns: (headerRow) => headerRow.map((column) => normalizeCsvHeader(column)),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (err) {
    return res.status(400).json({ error: `Invalid CSV: ${err.message}` });
  }

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'No records found in CSV' });
  }

  const MAX_ERROR_DETAILS = 200;
  const errors = [];
  let totalErrors = 0;
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (let index = 0; index < records.length; index += 1) {
    const row = records[index] || {};
    const line = index + 2;
    const name = normalizeString(row.name || row.carrier || row.company || row.legalname || row.carriername);
    const mcRaw = normalizeString(row.mcnumber || row.mc || row.docket || row.mcffmxnumber);
    const dotRaw = normalizeString(row.dotnumber || row.dot || row.usdot || row.usdotnumber);
    const taxId = normalizeString(row.taxid || row.ein || row.taxidnumber);
    const email = normalizeString(row.email || row.primarycontactemail || row.secondarycontactemail);
    const phone = normalizeString(row.phone || row.phonenumber || row.primarycontacttelephone || row.secondarycontacttelephone || row.phonenumber);
    const paymentTerms = normalizeString(row.paymentterms || row.paymentmethodstandardpayquickpaypaywhenpaid) || 'Net 30';
    const insuranceExpiryRaw = normalizeString(
      row.insuranceexpiry
      || row.insurancecargoexpirationdate
      || row.insurancebipdexpirationdate
      || row.insuranceautoexpirationdate
      || row.insurancegeneralexpirationdate
    );
    const mcNumber = mcRaw ? (mcRaw.toUpperCase().startsWith('MC') ? mcRaw.toUpperCase() : `MC${mcRaw.replace(/\D/g, '')}`) : '';
    const mcNumberNormalized = normalizeMc(mcNumber);
    const dotNumber = normalizeDot(dotRaw);

    const rawStatus = normalizeString(row.status).toLowerCase();
    let status = 'Active';
    if (rawStatus.includes('inactive')) status = 'Inactive';
    if (rawStatus.includes('alert') || rawStatus.includes('issue')) status = 'Alert';

    if (!name && !mcNumber && !dotNumber) {
      skipped += 1;
      continue;
    }

    const insuranceExpiry = insuranceExpiryRaw ? new Date(insuranceExpiryRaw) : null;
    const insuranceExpiryValue = insuranceExpiry && !Number.isNaN(insuranceExpiry.getTime()) ? insuranceExpiry : undefined;

    try {
      if (MOCK_MODE || !isDbReady()) {
        const upsertResult = upsertMemoryCarrier({
          id: `cr-${Date.now()}-${index}`,
          name: name || `Carrier ${line}`,
          nameLower: normalizeKey(name || `Carrier ${line}`),
          mcNumber: mcNumber || undefined,
          mcNumberNormalized: mcNumberNormalized || undefined,
          dotNumber: dotNumber || undefined,
          taxId,
          email,
          phone,
          paymentTerms,
          insuranceExpiry: insuranceExpiryValue,
          status,
        });

        if (upsertResult.created) imported += 1;
        else updated += 1;
        continue;
      }

      const existing = await Carrier.findOne({
        $or: [
          ...(mcNumberNormalized ? [{ mcNumberNormalized }] : []),
          ...(dotNumber ? [{ dotNumber }] : []),
        ],
      });

      if (existing) {
        existing.name = name || existing.name;
        existing.nameLower = normalizeKey(existing.name);
        existing.mcNumber = mcNumber || existing.mcNumber;
        existing.mcNumberNormalized = mcNumberNormalized || existing.mcNumberNormalized;
        existing.dotNumber = dotNumber || existing.dotNumber;
        existing.taxId = taxId || existing.taxId;
        existing.email = email || existing.email;
        existing.phone = phone || existing.phone;
        existing.paymentTerms = paymentTerms || existing.paymentTerms;
        existing.insuranceExpiry = insuranceExpiryValue || existing.insuranceExpiry;
        existing.status = status || existing.status;
        existing.updatedAt = new Date();
        await existing.save();
        updated += 1;
      } else {
        await Carrier.create({
          id: `cr-${Date.now()}-${index}`,
          name: name || `Carrier ${line}`,
          nameLower: normalizeKey(name || `Carrier ${line}`),
          mcNumber: mcNumber || undefined,
          mcNumberNormalized: mcNumberNormalized || undefined,
          dotNumber: dotNumber || undefined,
          taxId,
          email,
          phone,
          paymentTerms,
          insuranceExpiry: insuranceExpiryValue,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        imported += 1;
      }
    } catch (err) {
      totalErrors += 1;
      if (errors.length < MAX_ERROR_DETAILS) {
        errors.push({ line, error: err.message || 'Failed to import row' });
      }
    }
  }

  if (imported === 0 && updated === 0 && skipped > 0 && errors.length === 0) {
    return res.status(400).json({
      error: 'No valid carrier rows were detected. Include at least one of: Name/Carrier, MC Number, or DOT Number columns.',
      skipped,
    });
  }

  return res.json({
    message: `Carrier CSV import complete: ${imported} imported, ${updated} updated, ${skipped} skipped`,
    imported,
    updated,
    skipped,
    errorCount: totalErrors,
    errors,
    errorDetailsCapped: totalErrors > MAX_ERROR_DETAILS,
  });
});

router.delete('/purge', async (req, res) => {
  try {
    if (MOCK_MODE || !isDbReady()) {
      const deletedCount = memoryCarriers.length;
      memoryCarriers = [];
      return res.json({
        message: `Purged ${deletedCount} carriers`,
        deletedCount,
        source: 'memory',
      });
    }

    const result = await Carrier.deleteMany({});
    return res.json({
      message: `Purged ${Number(result?.deletedCount || 0)} carriers`,
      deletedCount: Number(result?.deletedCount || 0),
      source: 'db',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to purge carriers' });
  }
});

// Get carrier by ID
router.get('/:id', async (req, res) => {
  try {
    if (MOCK_MODE || !isDbReady()) {
      const carrier = memoryCarriers.find((item) => item.id === req.params.id);
      if (!carrier) return res.status(404).json({ error: 'Carrier not found' });
      return res.json(toSerializableCarrier(carrier));
    }

    const carrier = await Carrier.findOne({ id: req.params.id });
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    const aggregates = await getCarrierAggregates();
    const metrics = aggregates[carrier.id] || { totalSpend: 0, openAP: 0, invoiceCount: 0 };

    res.json({ ...carrier.toObject(), ...metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create carrier (manual or system)
router.post('/', async (req, res) => {
  try {
    const { name, mcNumber, email, phone, paymentTerms, insuranceExpiry, taxId } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const mcNormalized = normalizeMc(mcNumber);

    if (MOCK_MODE || !isDbReady()) {
      const existing = mcNormalized
        ? memoryCarriers.find((carrier) => carrier.mcNumberNormalized === mcNormalized)
        : null;
      if (existing) return res.status(409).json({ error: 'Carrier already exists', carrier: toSerializableCarrier(existing) });

      const result = upsertMemoryCarrier({
        id: `cr-${Date.now()}`,
        name: normalizeString(name),
        nameLower: normalizeKey(name),
        mcNumber: mcNumber ? normalizeString(mcNumber) : undefined,
        mcNumberNormalized: mcNormalized || undefined,
        email: normalizeString(email),
        phone: normalizeString(phone),
        paymentTerms: normalizeString(paymentTerms),
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
        taxId: normalizeString(taxId),
        status: 'Active',
      });

      return res.status(201).json(toSerializableCarrier(result.carrier));
    }

    const existing = mcNormalized ? await Carrier.findOne({ mcNumberNormalized: mcNormalized }) : null;
    if (existing) return res.status(409).json({ error: 'Carrier already exists', carrier: existing });

    const now = new Date();
    const newCarrier = new Carrier({
      id: `cr-${Date.now()}`,
      name: normalizeString(name),
      mcNumber: mcNumber ? normalizeString(mcNumber) : undefined,
      mcNumberNormalized: mcNormalized || undefined,
      email: normalizeString(email),
      phone: normalizeString(phone),
      paymentTerms: normalizeString(paymentTerms),
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
      taxId: normalizeString(taxId),
      nameLower: normalizeKey(name),
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    });

    await newCarrier.save();
    res.status(201).json(newCarrier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update carrier profile
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};

    if (MOCK_MODE || !isDbReady()) {
      const index = memoryCarriers.findIndex((carrier) => carrier.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: 'Carrier not found' });

      const current = memoryCarriers[index];
      const next = { ...current };

      if (updates.name) {
        next.name = normalizeString(updates.name);
        next.nameLower = normalizeKey(updates.name);
      }
      if (updates.mcNumber) {
        next.mcNumber = normalizeString(updates.mcNumber);
        next.mcNumberNormalized = normalizeMc(updates.mcNumber) || undefined;
      }
      if (updates.email !== undefined) next.email = normalizeString(updates.email);
      if (updates.phone !== undefined) next.phone = normalizeString(updates.phone);
      if (updates.paymentTerms !== undefined) next.paymentTerms = normalizeString(updates.paymentTerms);
      if (updates.insuranceExpiry !== undefined) next.insuranceExpiry = updates.insuranceExpiry ? new Date(updates.insuranceExpiry) : undefined;
      if (updates.taxId !== undefined) next.taxId = normalizeString(updates.taxId);
      if (updates.status) next.status = updates.status;

      next.updatedAt = new Date();
      memoryCarriers[index] = next;

      return res.json(toSerializableCarrier(next));
    }

    const carrier = await Carrier.findOne({ id: req.params.id });
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    if (updates.name) {
      carrier.name = normalizeString(updates.name);
      carrier.nameLower = normalizeKey(updates.name);
    }
    if (updates.mcNumber) {
      carrier.mcNumber = normalizeString(updates.mcNumber);
      carrier.mcNumberNormalized = normalizeMc(updates.mcNumber) || undefined;
    }
    if (updates.email !== undefined) carrier.email = normalizeString(updates.email);
    if (updates.phone !== undefined) carrier.phone = normalizeString(updates.phone);
    if (updates.paymentTerms !== undefined) carrier.paymentTerms = normalizeString(updates.paymentTerms);
    if (updates.insuranceExpiry !== undefined) carrier.insuranceExpiry = updates.insuranceExpiry ? new Date(updates.insuranceExpiry) : undefined;
    if (updates.taxId !== undefined) carrier.taxId = normalizeString(updates.taxId);
    if (updates.status) carrier.status = updates.status;

    carrier.updatedAt = new Date();
    await carrier.save();

    res.json(carrier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
