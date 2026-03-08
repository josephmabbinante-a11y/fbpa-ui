import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer();
const invoiceImages = [];

router.get('/', (req, res) => {
  const invoiceId = req.query.invoiceId ? String(req.query.invoiceId) : null;
  const images = invoiceId
    ? invoiceImages.filter((item) => item.invoiceId === invoiceId)
    : invoiceImages;
  res.json({ images });
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'file is required' });
  }

  const invoiceId = String(req.body?.invoiceId || '').trim();
  if (!invoiceId) {
    return res.status(400).json({ error: 'invoiceId is required' });
  }

  const newImage = {
    id: `img-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    invoiceId,
    fileName: req.file.originalname,
    size: req.file.size,
    notes: String(req.body?.notes || '').trim(),
    verified: false,
    createdAt: new Date().toISOString(),
  };

  invoiceImages.unshift(newImage);
  return res.status(201).json({ image: newImage });
});

router.post('/verify', (req, res) => {
  const imageId = String(req.body?.imageId || '').trim();
  const invoiceId = String(req.body?.invoiceId || '').trim();

  if (!imageId || !invoiceId) {
    return res.status(400).json({ error: 'imageId and invoiceId are required' });
  }

  const target = invoiceImages.find((item) => item.id === imageId && item.invoiceId === invoiceId);
  if (!target) {
    return res.status(404).json({ error: 'Image not found' });
  }

  target.verified = true;
  target.verifiedAt = new Date().toISOString();

  return res.json({ image: target });
});

export default router;
