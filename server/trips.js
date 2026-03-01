import express from 'express';
import { Trip } from './fleetModels.js';

const router = express.Router();

// List all trips
router.get('/', async (req, res) => {
  const trips = await Trip.find();
  res.json(trips);
});

// Get a single trip
router.get('/:id', async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  res.json(trip);
});

// Create a trip
router.post('/', async (req, res) => {
  const trip = new Trip(req.body);
  await trip.save();
  res.status(201).json(trip);
});

// Update a trip
router.put('/:id', async (req, res) => {
  const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!trip) return res.status(404).json({ error: 'Not found' });
  res.json(trip);
});

// Delete a trip
router.delete('/:id', async (req, res) => {
  const trip = await Trip.findByIdAndDelete(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;
