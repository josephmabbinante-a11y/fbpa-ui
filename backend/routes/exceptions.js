import express from 'express';
import Exception from '../models/Exception.js';

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
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update exception (partial)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const exception = await Exception.findOne({ id: req.params.id });
    if (!exception) return res.status(404).json({ error: 'Exception not found' });

    if (updates.status !== undefined) exception.status = updates.status;
    if (updates.severity !== undefined) exception.severity = updates.severity;
    if (updates.type !== undefined) exception.type = updates.type;
    if (updates.amount !== undefined) exception.amount = updates.amount;

    if (updates.reason !== undefined && updates.description === undefined) {
      exception.reason = updates.reason;
      exception.description = updates.reason;
    } else if (updates.description !== undefined && updates.reason === undefined) {
      exception.description = updates.description;
      exception.reason = updates.description;
    } else {
      if (updates.reason !== undefined) exception.reason = updates.reason;
      if (updates.description !== undefined) exception.description = updates.description;
    }

    exception.updatedAt = new Date();
    await exception.save();

    res.json(exception);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
