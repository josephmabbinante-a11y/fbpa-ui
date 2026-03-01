import express from 'express';
import { Exception } from './models.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const exceptions = await Exception.find().sort({ createdAt: -1 });
    res.json({ exceptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const entry = new Exception({
      id: payload.id || `exc-${Date.now()}`,
      invoiceId: payload.invoiceId,
      invoiceNumber: payload.invoiceNumber,
      customerId: payload.customerId,
      customer: payload.customer,
      carrierId: payload.carrierId,
      carrier: payload.carrier,
      amount: payload.amount || 0,
      type: payload.type || 'financial',
      reason: payload.reason || payload.description,
      description: payload.description || payload.reason,
      severity: payload.severity || 'Medium',
      status: payload.status || 'Open',
      assignedTo: payload.assignedTo || '',
      resolutionNotes: payload.resolutionNotes || '',
      resolvedAt: payload.status === 'Resolved' ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const payload = req.body || {};
    const entry = await Exception.findOne({ id: req.params.id });
    if (!entry) return res.status(404).json({ error: 'Exception not found' });

    if (payload.assignedTo !== undefined) entry.assignedTo = String(payload.assignedTo || '').trim();
    if (payload.status !== undefined) entry.status = payload.status;
    if (payload.resolutionNotes !== undefined) entry.resolutionNotes = String(payload.resolutionNotes || '').trim();
    if (entry.status === 'Resolved' && !entry.resolvedAt) entry.resolvedAt = new Date();
    if (entry.status !== 'Resolved') entry.resolvedAt = undefined;
    entry.updatedAt = new Date();

    await entry.save();
    return res.json(entry);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
