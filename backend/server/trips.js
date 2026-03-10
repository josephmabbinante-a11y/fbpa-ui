import express from 'express';
import mongoose from 'mongoose';
import { Trip } from './fleetModels.js';

const router = express.Router();
let memoryTrips = [];

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

// List all trips
router.get('/', async (req, res) => {
  try {
    if (!isDbReady()) return res.json(Array.isArray(memoryTrips) ? memoryTrips : []);
    const trips = await Trip.find();
    return res.json(Array.isArray(trips) ? trips : []);
  } catch (err) {
    return res.json([]);
  }
});

// Get a single trip
router.get('/:id', async (req, res) => {
  try {
    if (!isDbReady()) {
      const trip = memoryTrips.find((item) => item.id === req.params.id);
      if (!trip) return res.status(404).json({ error: 'Not found' });
      return res.json(trip);
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Not found' });
    return res.json(trip);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create a trip
router.post('/', async (req, res) => {
  try {
    if (!isDbReady()) {
      const trip = { ...req.body, id: req.body?.id || `trp-${Date.now()}` };
      memoryTrips = [trip, ...memoryTrips];
      return res.status(201).json(trip);
    }

    const trip = new Trip(req.body);
    await trip.save();
    return res.status(201).json(trip);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update a trip
router.put('/:id', async (req, res) => {
  try {
    if (!isDbReady()) {
      const index = memoryTrips.findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: 'Not found' });
      const next = { ...memoryTrips[index], ...req.body, id: memoryTrips[index].id };
      memoryTrips[index] = next;
      return res.json(next);
    }

    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trip) return res.status(404).json({ error: 'Not found' });
    return res.json(trip);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a trip
router.delete('/:id', async (req, res) => {
  try {
    if (!isDbReady()) {
      const index = memoryTrips.findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: 'Not found' });
      memoryTrips.splice(index, 1);
      return res.json({ success: true });
    }

    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
