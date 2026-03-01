import express from 'express';
import { Vehicle } from './fleetModels.js';

const router = express.Router();

// List all vehicles
router.get('/', async (req, res) => {
  const vehicles = await Vehicle.find();
  res.json(vehicles);
});

// Get a single vehicle
router.get('/:id', async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Not found' });
  res.json(vehicle);
});

// Create a vehicle
router.post('/', async (req, res) => {
  const vehicle = new Vehicle(req.body);
  await vehicle.save();
  res.status(201).json(vehicle);
});

// Update a vehicle
router.put('/:id', async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!vehicle) return res.status(404).json({ error: 'Not found' });
  res.json(vehicle);
});

// Delete a vehicle
router.delete('/:id', async (req, res) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;
