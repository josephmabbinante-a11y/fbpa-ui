import express from 'express';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.carrierId) filter.carrierId = req.query.carrierId;
    if (req.query.status) filter.status = req.query.status;
    const vehicles = await Vehicle.find(filter).sort({ updatedAt: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ id: req.params.id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new vehicle
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.unitNumber) return res.status(400).json({ error: 'unitNumber is required' });
    const id = `veh-${Date.now()}`;
    const newVehicle = new Vehicle({
      id,
      unitNumber: normalizeString(body.unitNumber),
      type: body.type || 'Truck',
      make: normalizeString(body.make),
      model: normalizeString(body.model),
      year: Number(body.year) || null,
      vin: normalizeString(body.vin),
      licensePlate: normalizeString(body.licensePlate),
      carrierId: normalizeString(body.carrierId),
      status: 'Active',
    });
    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update vehicle (partial)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const vehicle = await Vehicle.findOne({ id: req.params.id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const stringFields = ['unitNumber', 'make', 'model', 'vin', 'licensePlate', 'carrierId'];
    for (const field of stringFields) {
      if (updates[field] !== undefined) vehicle[field] = normalizeString(updates[field]);
    }
    if (updates.type !== undefined) vehicle.type = updates.type;
    if (updates.year !== undefined) vehicle.year = Number(updates.year) || null;
    if (updates.status !== undefined) vehicle.status = updates.status;

    vehicle.updatedAt = new Date();
    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete vehicle
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ id: req.params.id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    await vehicle.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
