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
      $or: [
        { name: regex }, { city: regex }, { state: regex }, { zip: regex },
        { locationCode: regex }, { address: regex }, { customerName: regex },
        { primaryContact: regex },
      ],
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
    const b = req.body || {};
    if (!b.name) return res.status(400).json({ error: 'Name is required' });
    const id = `loc-${Date.now()}`;
    const newLocation = new Location({
      id,
      name: normalizeString(b.name),
      nameLower: normalizeKey(b.name),
      locationCode: normalizeString(b.locationCode),
      address: normalizeString(b.address),
      city: normalizeString(b.city),
      state: normalizeString(b.state),
      zip: normalizeString(b.zip),
      type: b.type || 'Other',
      role: b.role || 'None',
      customerId: normalizeString(b.customerId),
      customerName: normalizeString(b.customerName),
      primaryContact: normalizeString(b.primaryContact),
      primaryPhone: normalizeString(b.primaryPhone),
      primaryEmail: normalizeString(b.primaryEmail),
      operatingHours: normalizeString(b.operatingHours),
      notes: normalizeString(b.notes),
      appointmentRequired: !!b.appointmentRequired,
      liftgateRequired: !!b.liftgateRequired,
      insidePickup: !!b.insidePickup,
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
    if (updates.role !== undefined) location.role = updates.role;
    if (updates.locationCode !== undefined) location.locationCode = normalizeString(updates.locationCode);
    if (updates.customerId !== undefined) location.customerId = normalizeString(updates.customerId);
    if (updates.customerName !== undefined) location.customerName = normalizeString(updates.customerName);
    if (updates.primaryContact !== undefined) location.primaryContact = normalizeString(updates.primaryContact);
    if (updates.primaryPhone !== undefined) location.primaryPhone = normalizeString(updates.primaryPhone);
    if (updates.primaryEmail !== undefined) location.primaryEmail = normalizeString(updates.primaryEmail);
    if (updates.operatingHours !== undefined) location.operatingHours = normalizeString(updates.operatingHours);
    if (updates.notes !== undefined) location.notes = normalizeString(updates.notes);
    if (updates.appointmentRequired !== undefined) location.appointmentRequired = !!updates.appointmentRequired;
    if (updates.liftgateRequired !== undefined) location.liftgateRequired = !!updates.liftgateRequired;
    if (updates.insidePickup !== undefined) location.insidePickup = !!updates.insidePickup;
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
