import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import DocumentRegistry from '../models/DocumentRegistry.js';
import Exception from '../models/Exception.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25 MB

// ---------- helpers ----------
function generateId() {
  return `doc-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Try to auto-match a document to a load/invoice and derive status confirmations.
 * Returns { loadId, invoiceId, invoiceNumber, carrierId, confirmsStatus, confidence, details }
 */
async function attemptAutoMatch(doc) {
  const result = { autoMatchConfidence: 0, autoMatchDetails: '' };

  // Match by invoiceNumber first
  if (doc.invoiceNumber) {
    const inv = await Invoice.findOne({ invoiceNumber: doc.invoiceNumber });
    if (inv) {
      result.invoiceId = inv.id;
      result.loadId = inv.load_id || doc.loadId;
      result.carrierId = inv.carrierId || doc.carrierId;
      result.autoMatchConfidence = 95;
      result.autoMatchDetails = `Auto-matched to invoice ${inv.invoiceNumber}`;
    }
  }

  // Match by loadId
  if (!result.invoiceId && doc.loadId) {
    const inv = await Invoice.findOne({ load_id: doc.loadId });
    if (inv) {
      result.invoiceId = inv.id;
      result.invoiceNumber = inv.invoiceNumber;
      result.autoMatchConfidence = 85;
      result.autoMatchDetails = `Auto-matched via load ${doc.loadId}`;
    }
  }

  // Determine status confirmations based on documentType
  const typeToStatus = {
    pod: 'POD_RECEIVED',
    carrier_packet: 'CARRIER_ACCEPTED',
    bol: 'DELIVERY_CONFIRMED',
  };
  if (typeToStatus[doc.documentType]) {
    result.confirmsStatus = typeToStatus[doc.documentType];
  }

  // High-confidence auto-matches get approved automatically
  if (result.autoMatchConfidence >= 90) {
    result.auditStatus = 'auto_matched';
  }

  return result;
}

// ---------- GET / — list documents with filters ----------
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.auditStatus) filter.auditStatus = req.query.auditStatus;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.documentType) filter.documentType = req.query.documentType;
    if (req.query.loadId) filter.loadId = req.query.loadId;
    if (req.query.invoiceId) filter.invoiceId = req.query.invoiceId;
    if (req.query.carrierId) filter.carrierId = req.query.carrierId;

    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const docs = await DocumentRegistry.find(filter).sort({ createdAt: -1 }).limit(limit);

    // Counts for the audit queue
    const counts = await DocumentRegistry.aggregate([
      { $group: { _id: '$auditStatus', count: { $sum: 1 } } },
    ]);
    const auditCounts = {};
    counts.forEach((c) => { auditCounts[c._id] = c.count; });

    return res.json({ documents: docs, auditCounts, total: docs.length });
  } catch (err) {
    console.error('GET /document-registry error:', err);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// ---------- POST / — register a new document ----------
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const body = req.body || {};
    const id = generateId();

    const doc = new DocumentRegistry({
      id,
      documentType: body.documentType || 'other',
      fileName: req.file ? req.file.originalname : (body.fileName || 'unknown'),
      fileSize: req.file ? req.file.size : Number(body.fileSize || 0),
      mimeType: req.file ? req.file.mimetype : (body.mimeType || ''),
      source: body.source || 'manual_upload',
      loadId: body.loadId || null,
      invoiceId: body.invoiceId || null,
      invoiceNumber: body.invoiceNumber || null,
      exceptionId: body.exceptionId || null,
      carrierId: body.carrierId || null,
      carrierName: body.carrierName || null,
      customerId: body.customerId || null,
      uploadedBy: body.uploadedBy || null,
    });

    // Attempt auto-match
    const matchResult = await attemptAutoMatch(doc);
    if (matchResult.invoiceId) doc.invoiceId = matchResult.invoiceId;
    if (matchResult.loadId) doc.loadId = matchResult.loadId;
    if (matchResult.invoiceNumber) doc.invoiceNumber = matchResult.invoiceNumber;
    if (matchResult.carrierId) doc.carrierId = matchResult.carrierId;
    if (matchResult.confirmsStatus) {
      doc.confirmsStatus = matchResult.confirmsStatus;
      doc.statusConfirmedAt = new Date();
    }
    doc.autoMatchConfidence = matchResult.autoMatchConfidence || 0;
    doc.autoMatchDetails = matchResult.autoMatchDetails || '';
    if (matchResult.auditStatus) doc.auditStatus = matchResult.auditStatus;

    await doc.save();

    // If this is a carrier invoice, auto-create an exception for audit
    if (doc.documentType === 'carrier_invoice' && doc.invoiceId) {
      const existingException = await Exception.findOne({ invoiceId: doc.invoiceId, type: 'financial', reason: /carrier invoice received/i });
      if (!existingException) {
        await Exception.create({
          id: `exc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          invoiceId: doc.invoiceId,
          invoiceNumber: doc.invoiceNumber || '',
          carrierId: doc.carrierId || '',
          carrier: doc.carrierName || '',
          type: 'financial',
          reason: 'Carrier invoice received — pending audit review',
          description: `Document "${doc.fileName}" received via ${doc.source}. Auto-linked to invoice ${doc.invoiceNumber || doc.invoiceId}.`,
          severity: 'Medium',
          status: 'Open',
        });
      }
    }

    return res.status(201).json({ success: true, document: doc });
  } catch (err) {
    console.error('POST /document-registry error:', err);
    return res.status(500).json({ error: 'Failed to register document' });
  }
});

// ---------- PATCH /:id — review / approve / reject ----------
router.patch('/:id', async (req, res) => {
  try {
    const doc = await DocumentRegistry.findOne({ id: req.params.id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const allowed = ['auditStatus', 'auditNotes', 'reviewedBy', 'loadId', 'invoiceId', 'exceptionId', 'carrierId'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) doc[field] = req.body[field];
    });

    if (req.body.auditStatus === 'approved' || req.body.auditStatus === 'rejected') {
      doc.reviewedAt = new Date();
    }

    doc.updatedAt = new Date();
    await doc.save();

    // If approved and confirms a status, resolve any linked open exceptions
    if (doc.auditStatus === 'approved' && doc.confirmsStatus && doc.invoiceId) {
      await Exception.updateMany(
        { invoiceId: doc.invoiceId, status: 'Open' },
        { $set: { status: 'Resolved', updatedAt: new Date() } },
      );
    }

    return res.json({ success: true, document: doc });
  } catch (err) {
    console.error('PATCH /document-registry error:', err);
    return res.status(500).json({ error: 'Failed to update document' });
  }
});

// ---------- GET /audit-queue — pending review items ----------
router.get('/audit-queue', async (req, res) => {
  try {
    const statuses = ['pending_review', 'needs_attention'];
    const docs = await DocumentRegistry.find({ auditStatus: { $in: statuses } })
      .sort({ createdAt: -1 })
      .limit(200);

    // Also pull open exceptions that need auditing
    const openExceptions = await Exception.find({ status: 'Open' })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ documents: docs, exceptions: openExceptions });
  } catch (err) {
    console.error('GET /document-registry/audit-queue error:', err);
    return res.status(500).json({ error: 'Failed to fetch audit queue' });
  }
});

// ---------- POST /qr-ingest — QR code document submission ----------
router.post('/qr-ingest', upload.single('file'), async (req, res) => {
  try {
    const body = req.body || {};
    const id = generateId();

    const doc = new DocumentRegistry({
      id,
      documentType: body.documentType || 'qr_scan',
      fileName: req.file ? req.file.originalname : (body.fileName || 'qr-scan'),
      fileSize: req.file ? req.file.size : 0,
      mimeType: req.file ? req.file.mimetype : '',
      source: 'qr_code',
      loadId: body.loadId || null,
      invoiceNumber: body.invoiceNumber || null,
      carrierId: body.carrierId || null,
      carrierName: body.carrierName || null,
      uploadedBy: body.uploadedBy || 'qr-scanner',
    });

    const matchResult = await attemptAutoMatch(doc);
    if (matchResult.invoiceId) doc.invoiceId = matchResult.invoiceId;
    if (matchResult.loadId) doc.loadId = matchResult.loadId;
    if (matchResult.confirmsStatus) {
      doc.confirmsStatus = matchResult.confirmsStatus;
      doc.statusConfirmedAt = new Date();
    }
    doc.autoMatchConfidence = matchResult.autoMatchConfidence || 0;
    doc.autoMatchDetails = matchResult.autoMatchDetails || '';
    if (matchResult.auditStatus) doc.auditStatus = matchResult.auditStatus;

    await doc.save();

    return res.status(201).json({ success: true, document: doc });
  } catch (err) {
    console.error('POST /document-registry/qr-ingest error:', err);
    return res.status(500).json({ error: 'Failed to ingest QR document' });
  }
});

export default router;
