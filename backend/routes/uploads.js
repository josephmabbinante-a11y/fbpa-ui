import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.post('/', upload.single('file'), (req, res) => {
  const body = req.body || {};

  if (req.file) {
    return res.status(201).json({
      success: true,
      fileName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
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
