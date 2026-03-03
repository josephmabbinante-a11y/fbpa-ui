import express from 'express';
import { Location } from './models.js';

const router = express.Router();

// Helper to generate a new location ID
function generateLocationId() {
  return 'loc-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const query = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { address: { $regex: q, $options: 'i' } },
            { locationTypes: { $regex: q, $options: 'i' } },
            { locationCodes: { $regex: q, $options: 'i' } },
            { primaryContact: { $regex: q, $options: 'i' } },
            { primaryPhone: { $regex: q, $options: 'i' } },
            { branch: { $regex: q, $options: 'i' } },
          ],
        }
      : {};
    const items = await Location.find(query).sort({ updatedAt: -1 }).lean();
    return res.json({ items });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOCATIONS_FETCH_ERROR', message: err.message } });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body || {};
    if (!data.name) return res.status(400).json({ error: 'name is required' });
    if (!data.address) return res.status(400).json({ error: 'address is required' });
    if (!data.id) data.id = generateLocationId();
    if (!data.locationCodes) data.locationCodes = `LOC-${1000 + (await Location.countDocuments()) + 1}`;
    const now = new Date();
    data.createdAt = now;
    data.updatedAt = now;
    const location = new Location(data);
    await location.save();
    return res.status(201).json({ location });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOCATION_CREATE_ERROR', message: err.message } });
  }
});

router.patch('/:locationId', async (req, res) => {
  try {
    const data = req.body || {};
    if (!data.name) return res.status(400).json({ error: 'name is required' });
    if (!data.address) return res.status(400).json({ error: 'address is required' });
    data.updatedAt = new Date();
    const updated = await Location.findOneAndUpdate(
      { id: req.params.locationId },
      data,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Location not found' });
    return res.json({ location: updated });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOCATION_UPDATE_ERROR', message: err.message } });
  }
});

router.delete('/:locationId', async (req, res) => {
  try {
    const deleted = await Location.findOneAndDelete({ id: req.params.locationId });
    if (!deleted) return res.status(404).json({ error: 'Location not found' });
    return res.json({ removed: deleted });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOCATION_DELETE_ERROR', message: err.message } });
  }
});

export default router;
