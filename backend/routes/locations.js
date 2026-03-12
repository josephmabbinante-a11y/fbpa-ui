import express from 'express';
import Location from '../models/Location.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();
const normalizeKey = (value) => normalizeString(value).toLowerCase();

// Search locations by query string
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const regex = new RegExp(q, 'i');
    const locations = await Location.find({
      $or: [{ name: regex }, { city: regex }, { state: regex }, { zip: regex }],
    })
      .sort({ name: 1 })
      .limit(20);
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find().sort({ updatedAt: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get location by ID
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findOne({ id: req.params.id });
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new location
router.post('/', async (req, res) => {
  try {
    const { name, address, city, state, zip, type } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const id = `loc-${Date.now()}`;
    const newLocation = new Location({
      id,
      name: normalizeString(name),
      nameLower: normalizeKey(name),
      address: normalizeString(address),
      city: normalizeString(city),
      state: normalizeString(state),
      zip: normalizeString(zip),
      type: type || 'Other',
      status: 'Active',
    });
    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update location (partial)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const location = await Location.findOne({ id: req.params.id });
    if (!location) return res.status(404).json({ error: 'Location not found' });

    if (updates.name !== undefined) {
      location.name = normalizeString(updates.name);
      location.nameLower = normalizeKey(updates.name);
    }
    if (updates.address !== undefined) location.address = normalizeString(updates.address);
    if (updates.city !== undefined) location.city = normalizeString(updates.city);
    if (updates.state !== undefined) location.state = normalizeString(updates.state);
    if (updates.zip !== undefined) location.zip = normalizeString(updates.zip);
    if (updates.type !== undefined) location.type = updates.type;
    if (updates.status !== undefined) location.status = updates.status;

    location.updatedAt = new Date();
    await location.save();
    res.json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  try {
    const location = await Location.findOne({ id: req.params.id });
    if (!location) return res.status(404).json({ error: 'Location not found' });
    await location.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
