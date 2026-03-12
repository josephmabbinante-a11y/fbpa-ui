import express from 'express';
import Trip from '../models/Trip.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();

// Get all trips
router.get('/', async (req, res) => {
  try {
    const { loadId, driverId, vehicleId, status } = req.query;
    const query = {};
    if (loadId) query.loadId = loadId;
    if (driverId) query.driverId = driverId;
    if (vehicleId) query.vehicleId = vehicleId;
    if (status) query.status = status;
    const trips = await Trip.find(query).sort({ updatedAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get trip by ID
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findOne({ id: req.params.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new trip
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const id = `trip-${Date.now()}`;
    const newTrip = new Trip({
      id,
      loadId: normalizeString(body.loadId),
      driverId: normalizeString(body.driverId),
      vehicleId: normalizeString(body.vehicleId),
      origin: normalizeString(body.origin),
      destination: normalizeString(body.destination),
      departureDate: body.departureDate || null,
      arrivalDate: body.arrivalDate || null,
      mileage: Number(body.mileage) || null,
      status: body.status || 'Planned',
      notes: normalizeString(body.notes),
    });
    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update trip (partial)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const trip = await Trip.findOne({ id: req.params.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const stringFields = ['loadId', 'driverId', 'vehicleId', 'origin', 'destination', 'notes'];
    for (const field of stringFields) {
      if (updates[field] !== undefined) trip[field] = normalizeString(updates[field]);
    }
    if (updates.status !== undefined) trip.status = updates.status;
    const dateFields = ['departureDate', 'arrivalDate'];
    for (const field of dateFields) {
      if (updates[field] !== undefined) trip[field] = updates[field];
    }
    if (updates.mileage !== undefined) trip.mileage = Number(updates.mileage) || null;

    trip.updatedAt = new Date();
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete trip
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findOne({ id: req.params.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    await trip.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
