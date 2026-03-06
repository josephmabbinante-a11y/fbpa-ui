import express from 'express';
import { Location } from './models.js';

const router = express.Router();

// Helper to generate a new location ID
function generateLocationId() {
  return 'loc-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

// GET /api/locations - List locations
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
    const locations = await Location.find(query);
    return res.json(Array.isArray(locations) ? locations : []);
  } catch (err) {
    res.status(500).json({ error: { code: 'LOCATIONS_FETCH_ERROR', message: err.message } });
  }
});

// POST /api/locations - Create a new location
router.post('/', async (req, res) => {
  try {
    const data = req.body || {};
    const now = new Date();
    data.createdAt = now;
    data.updatedAt = now;
    if (!data.name) return res.status(400).json({ error: 'name is required' });
    if (!data.address) return res.status(400).json({ error: 'address is required' });
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
