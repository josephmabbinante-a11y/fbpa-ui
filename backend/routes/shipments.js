import express from 'express';
import Shipment from '../models/Shipment.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toDate = (value) => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

// Get all shipments
router.get('/', async (req, res) => {
  try {
    const { carrier_mc, origin, destination, status } = req.query;
    const query = {};
    if (carrier_mc) query.carrier_mc = carrier_mc;
    if (origin) query.origin = new RegExp(origin, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');
    if (status) query.status = status;

    const shipments = await Shipment.find(query).sort({ createdAt: -1 });
    res.json({ shipments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get lane analytics (average rate, shipment count for origin → destination)
router.get('/lanes', async (req, res) => {
  try {
    const { origin, destination } = req.query;
    const match = {};
    if (origin) match.origin = new RegExp(origin, 'i');
    if (destination) match.destination = new RegExp(destination, 'i');

    const lanes = await Shipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { origin: '$origin', destination: '$destination' },
          shipmentCount: { $sum: 1 },
          avgRate: { $avg: '$rate' },
          avgMiles: { $avg: '$miles' },
          avgWeight: { $avg: '$weight' },
          carriers: { $addToSet: '$carrier_mc' },
        },
      },
      { $sort: { shipmentCount: -1 } },
    ]);

    res.json({ lanes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shipment by load_id
router.get('/:load_id', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ load_id: req.params.load_id });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ shipment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create shipment
router.post('/', async (req, res) => {
  try {
    const {
      load_id,
      origin,
      destination,
      carrier_mc,
      equipment,
      miles,
      weight,
      status,
      pickupDate,
      deliveryDate,
      rate,
    } = req.body || {};

    if (!load_id) return res.status(400).json({ error: 'load_id is required' });
    if (!origin) return res.status(400).json({ error: 'origin is required' });
    if (!destination) return res.status(400).json({ error: 'destination is required' });

    const existing = await Shipment.findOne({ load_id });
    if (existing) return res.status(409).json({ error: 'Shipment with this load_id already exists', shipment: existing });

    const shipment = new Shipment({
      load_id: normalizeString(load_id),
      origin: normalizeString(origin),
      destination: normalizeString(destination),
      carrier_mc: normalizeString(carrier_mc),
      equipment: normalizeString(equipment) || 'Dry Van',
      miles: toNumber(miles),
      weight: toNumber(weight),
      status: normalizeString(status) || 'Pending',
      pickupDate: toDate(pickupDate),
      deliveryDate: toDate(deliveryDate),
      rate: toNumber(rate),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await shipment.save();
    res.status(201).json({ shipment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update shipment
router.patch('/:load_id', async (req, res) => {
  try {
    const updates = req.body || {};
    const shipment = await Shipment.findOne({ load_id: req.params.load_id });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    if (updates.origin !== undefined) shipment.origin = normalizeString(updates.origin);
    if (updates.destination !== undefined) shipment.destination = normalizeString(updates.destination);
    if (updates.carrier_mc !== undefined) shipment.carrier_mc = normalizeString(updates.carrier_mc);
    if (updates.equipment !== undefined) shipment.equipment = normalizeString(updates.equipment);
    if (updates.miles !== undefined) shipment.miles = toNumber(updates.miles);
    if (updates.weight !== undefined) shipment.weight = toNumber(updates.weight);
    if (updates.status !== undefined) shipment.status = updates.status;
    if (updates.pickupDate !== undefined) shipment.pickupDate = toDate(updates.pickupDate);
    if (updates.deliveryDate !== undefined) shipment.deliveryDate = toDate(updates.deliveryDate);
    if (updates.rate !== undefined) shipment.rate = toNumber(updates.rate);

    shipment.updatedAt = new Date();
    await shipment.save();

    res.json({ shipment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete shipment
router.delete('/:load_id', async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndDelete({ load_id: req.params.load_id });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ ok: true, message: 'Shipment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
