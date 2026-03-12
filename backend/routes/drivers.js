import express from 'express';
import Driver from '../models/Driver.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();
const normalizeKey = (value) => normalizeString(value).toLowerCase();

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.carrierId) filter.carrierId = req.query.carrierId;
    const drivers = await Driver.find(filter).sort({ updatedAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get driver by ID
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findOne({ id: req.params.id });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new driver
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, licenseNumber, licenseExpiry, carrierId } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const id = `drv-${Date.now()}`;
    const newDriver = new Driver({
      id,
      name: normalizeString(name),
      nameLower: normalizeKey(name),
      email: normalizeString(email),
      phone: normalizeString(phone),
      licenseNumber: normalizeString(licenseNumber),
      licenseExpiry: licenseExpiry || null,
      carrierId: normalizeString(carrierId),
      status: 'Active',
    });
    await newDriver.save();
    res.status(201).json(newDriver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update driver (partial)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const driver = await Driver.findOne({ id: req.params.id });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    if (updates.name !== undefined) {
      driver.name = normalizeString(updates.name);
      driver.nameLower = normalizeKey(updates.name);
    }
    if (updates.email !== undefined) driver.email = normalizeString(updates.email);
    if (updates.phone !== undefined) driver.phone = normalizeString(updates.phone);
    if (updates.licenseNumber !== undefined) driver.licenseNumber = normalizeString(updates.licenseNumber);
    if (updates.licenseExpiry !== undefined) driver.licenseExpiry = updates.licenseExpiry;
    if (updates.carrierId !== undefined) driver.carrierId = normalizeString(updates.carrierId);
    if (updates.status !== undefined) driver.status = updates.status;

    driver.updatedAt = new Date();
    await driver.save();
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete driver (soft delete — sets status to Inactive)
router.delete('/:id', async (req, res) => {
  try {
    const driver = await Driver.findOne({ id: req.params.id });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    driver.status = 'Inactive';
    driver.updatedAt = new Date();
    await driver.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
