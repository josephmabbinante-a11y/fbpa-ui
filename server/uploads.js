
import express from 'express';
import multer from 'multer';

import fs from 'fs';
import path from 'path';
const router = express.Router();
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

router.post('/', upload.single('file'), async (req, res) => {
  const body = req.body || {};

  if (req.file) {
    // Save file to disk (already in uploads/), parse if CSV
    const filePath = req.file.path;
    let invoiceRows = [];
    let errorRows = [];
    let invoiceCount = 0;
    if (req.file.mimetype === 'text/csv' || req.file.originalname.toLowerCase().endsWith('.csv')) {
      try {
        const csv = fs.readFileSync(filePath, 'utf8');
        const lines = csv.split(/\r?\n/).filter(l => l.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',');
          if (row.length === headers.length) {
            const invoice = {};
            headers.forEach((h, idx) => { invoice[h] = row[idx]; });
            invoiceRows.push(invoice);
          } else {
            errorRows.push({ line: i + 1, value: lines[i] });
          }
        }
        invoiceCount = invoiceRows.length;
      } catch (err) {
        return res.status(400).json({ error: 'Failed to parse CSV', details: err.message });
      }
    }
    return res.status(201).json({
      success: true,
      fileName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      invoiceCount,
      successCount: invoiceRows.length,
      errorCount: errorRows.length,
      errors: errorRows,
      invoices: invoiceRows.slice(0, 5), // preview first 5
    });
  }

  const fileName = String(body.fileName || '').trim();
  const invoiceCount = Number(body.invoiceCount || 0);
  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' });
  }

  return res.status(201).json({
    success: true,
    fileName,
    invoiceCount: Number.isFinite(invoiceCount) ? invoiceCount : 0,
    uploadedAt: new Date().toISOString(),
  });
});

export default router;
