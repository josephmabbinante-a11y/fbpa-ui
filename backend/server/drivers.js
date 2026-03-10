import express from 'express';
import mongoose from 'mongoose';
import { Driver } from './fleetModels.js';

const router = express.Router();
let memoryDrivers = [];

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

// List all drivers
router.get('/', async (req, res) => {
  try {
    if (!isDbReady()) return res.json(Array.isArray(memoryDrivers) ? memoryDrivers : []);
    const drivers = await Driver.find();
    return res.json(Array.isArray(drivers) ? drivers : []);
  } catch (err) {
    return res.json([]);
  }
});

// Get a single driver
router.get('/:id', async (req, res) => {
  try {
    if (!isDbReady()) {
      const driver = memoryDrivers.find((item) => item.id === req.params.id);
      if (!driver) return res.status(404).json({ error: 'Not found' });
      return res.json(driver);
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Not found' });
    return res.json(driver);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create a driver
router.post('/', async (req, res) => {
  try {
    if (!isDbReady()) {
      const driver = { ...req.body, id: req.body?.id || `drv-${Date.now()}` };
      memoryDrivers = [driver, ...memoryDrivers];
      return res.status(201).json(driver);
    }

    const driver = new Driver(req.body);
    await driver.save();
    return res.status(201).json(driver);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update a driver
router.put('/:id', async (req, res) => {
  try {
    if (!isDbReady()) {
      const index = memoryDrivers.findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: 'Not found' });
      const next = { ...memoryDrivers[index], ...req.body, id: memoryDrivers[index].id };
      memoryDrivers[index] = next;
      return res.json(next);
    }

    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!driver) return res.status(404).json({ error: 'Not found' });
    return res.json(driver);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a driver
router.delete('/:id', async (req, res) => {
  try {
    if (!isDbReady()) {
      const index = memoryDrivers.findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: 'Not found' });
      memoryDrivers.splice(index, 1);
      return res.json({ success: true });
    }

    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
