import express from 'express';
import { Driver } from './fleetModels.js';

const router = express.Router();

// List all drivers
router.get('/', async (req, res) => {
  const drivers = await Driver.find();
  res.json(drivers);
});

// Get a single driver
router.get('/:id', async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Not found' });
  res.json(driver);
});

// Create a driver
router.post('/', async (req, res) => {
  const driver = new Driver(req.body);
  await driver.save();
  res.status(201).json(driver);
});

// Update a driver
router.put('/:id', async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!driver) return res.status(404).json({ error: 'Not found' });
  res.json(driver);
});

// Delete a driver
router.delete('/:id', async (req, res) => {
  const driver = await Driver.findByIdAndDelete(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;
