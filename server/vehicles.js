import express from 'express';
import mongoose from 'mongoose';
import { Vehicle } from './fleetModels.js';

const router = express.Router();
let memoryVehicles = [];

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

// List all vehicles
router.get('/', async (req, res) => {
  try {
    if (!isDbReady()) return res.json(memoryVehicles);
    const vehicles = await Vehicle.find();
    return res.json(vehicles);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get a single vehicle
router.get('/:id', async (req, res) => {
  try {
    if (!isDbReady()) {
      const vehicle = memoryVehicles.find((item) => item.id === req.params.id);
      if (!vehicle) return res.status(404).json({ error: 'Not found' });
      return res.json(vehicle);
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    return res.json(vehicle);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create a vehicle
router.post('/', async (req, res) => {
  try {
    if (!isDbReady()) {
      const vehicle = { ...req.body, id: req.body?.id || `veh-${Date.now()}` };
      memoryVehicles = [vehicle, ...memoryVehicles];
      return res.status(201).json(vehicle);
    }

    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    return res.status(201).json(vehicle);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update a vehicle
router.put('/:id', async (req, res) => {
  try {
    if (!isDbReady()) {
      const index = memoryVehicles.findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: 'Not found' });
      const next = { ...memoryVehicles[index], ...req.body, id: memoryVehicles[index].id };
      memoryVehicles[index] = next;
      return res.json(next);
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    return res.json(vehicle);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a vehicle
router.delete('/:id', async (req, res) => {
  try {
    if (!isDbReady()) {
      const index = memoryVehicles.findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: 'Not found' });
      memoryVehicles.splice(index, 1);
      return res.json({ success: true });
    }

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
