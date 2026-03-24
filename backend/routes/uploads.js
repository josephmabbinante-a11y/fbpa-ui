import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import DocumentRegistry from '../models/DocumentRegistry.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/', upload.single('file'), async (req, res) => {
  const body = req.body || {};

  const fileName = req.file ? req.file.originalname : String(body.fileName || '').trim();
  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' });
  }

  const invoiceCount = Number(body.invoiceCount || 0);
  const docId = `doc-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  // Persist the upload into the DocumentRegistry for history tracking
  try {
    await DocumentRegistry.create({
      id: docId,
      documentType: body.documentType || 'manual_upload',
      fileName,
      fileSize: req.file ? req.file.size : 0,
      mimeType: req.file ? req.file.mimetype : (body.mimeType || ''),
      source: body.source || 'manual_upload',
      loadId: body.loadId || null,
      invoiceId: body.invoiceId || null,
      invoiceNumber: body.invoiceNumber || null,
      carrierId: body.carrierId || null,
      carrierName: body.carrierName || null,
      uploadedBy: body.uploadedBy || null,
      auditStatus: 'pending_review',
    });
  } catch (err) {
    // Log but don't block the upload response — registry is supplementary
    console.error('DocumentRegistry write failed:', err.message);
  }

  return res.status(201).json({
    success: true,
    documentId: docId,
    fileName,
    size: req.file ? req.file.size : 0,
    invoiceCount: Number.isFinite(invoiceCount) ? invoiceCount : 0,
    uploadedAt: new Date().toISOString(),
  });
});

export default router;
