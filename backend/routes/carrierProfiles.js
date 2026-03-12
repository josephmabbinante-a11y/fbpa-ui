import express from 'express';
import CarrierProfile from '../models/CarrierProfile.js';
import Shipment from '../models/Shipment.js';
import AuditResult from '../models/AuditResult.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Get all carrier profiles, optionally filtered
router.get('/', async (req, res) => {
  try {
    const { min_detention, max_safety, sort_by } = req.query;
    const query = {};
    if (min_detention !== undefined) query.detention_frequency = { $gte: toNumber(min_detention) };
    if (max_safety !== undefined) query.safety_score = { $lte: toNumber(max_safety) };

    const sortField = sort_by === 'detention' ? { detention_frequency: -1 }
      : sort_by === 'audit_error' ? { audit_error_rate: -1 }
      : sort_by === 'safety' ? { safety_score: -1 }
      : { updatedAt: -1 };

    const profiles = await CarrierProfile.find(query).sort(sortField);
    res.json({ profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Carrier intelligence: carriers that abuse detention
router.get('/detention-abuse', async (req, res) => {
  try {
    const threshold = toNumber(req.query.threshold, 0.3);
    const profiles = await CarrierProfile.find({ detention_frequency: { $gte: threshold } })
      .sort({ detention_frequency: -1 });

    res.json({
      threshold,
      count: profiles.length,
      carriers: profiles,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get carrier profile by MC number
router.get('/:carrier_mc', async (req, res) => {
  try {
    const profile = await CarrierProfile.findOne({ carrier_mc: req.params.carrier_mc });
    if (!profile) return res.status(404).json({ error: 'Carrier profile not found' });

    // Enrich with recent shipment and audit data
    const recentShipments = await Shipment.find({ carrier_mc: req.params.carrier_mc })
      .sort({ createdAt: -1 })
      .limit(10);

    const loadIds = recentShipments.map((s) => s.load_id);
    const auditResults = await AuditResult.find({ load_id: { $in: loadIds } })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ profile, recentShipments, auditResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create carrier profile
router.post('/', async (req, res) => {
  try {
    const {
      carrier_mc,
      name,
      safety_score,
      insurance_valid,
      detention_frequency,
      audit_error_rate,
      total_shipments,
      avg_rate_per_mile,
    } = req.body || {};

    if (!carrier_mc) return res.status(400).json({ error: 'carrier_mc is required' });
    if (!name) return res.status(400).json({ error: 'name is required' });

    const existing = await CarrierProfile.findOne({ carrier_mc: normalizeString(carrier_mc) });
    if (existing) return res.status(409).json({ error: 'Carrier profile already exists', profile: existing });

    const profile = new CarrierProfile({
      carrier_mc: normalizeString(carrier_mc),
      name: normalizeString(name),
      safety_score: toNumber(safety_score),
      insurance_valid: Boolean(insurance_valid),
      detention_frequency: toNumber(detention_frequency),
      audit_error_rate: toNumber(audit_error_rate),
      total_shipments: toNumber(total_shipments),
      avg_rate_per_mile: toNumber(avg_rate_per_mile),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await profile.save();
    res.status(201).json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update carrier profile
router.patch('/:carrier_mc', async (req, res) => {
  try {
    const updates = req.body || {};
    const profile = await CarrierProfile.findOne({ carrier_mc: req.params.carrier_mc });
    if (!profile) return res.status(404).json({ error: 'Carrier profile not found' });

    if (updates.name !== undefined) profile.name = normalizeString(updates.name);
    if (updates.safety_score !== undefined) profile.safety_score = toNumber(updates.safety_score);
    if (updates.insurance_valid !== undefined) profile.insurance_valid = Boolean(updates.insurance_valid);
    if (updates.detention_frequency !== undefined) profile.detention_frequency = toNumber(updates.detention_frequency);
    if (updates.audit_error_rate !== undefined) profile.audit_error_rate = toNumber(updates.audit_error_rate);
    if (updates.total_shipments !== undefined) profile.total_shipments = toNumber(updates.total_shipments);
    if (updates.avg_rate_per_mile !== undefined) profile.avg_rate_per_mile = toNumber(updates.avg_rate_per_mile);

    profile.updatedAt = new Date();
    await profile.save();

    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recalculate carrier profile metrics from shipment/audit data
router.post('/:carrier_mc/recalculate', async (req, res) => {
  try {
    const { carrier_mc } = req.params;
    const profile = await CarrierProfile.findOne({ carrier_mc });
    if (!profile) return res.status(404).json({ error: 'Carrier profile not found' });

    const [shipmentCount, auditResults] = await Promise.all([
      Shipment.countDocuments({ carrier_mc }),
      AuditResult.find({ load_id: { $in: (await Shipment.find({ carrier_mc }).select('load_id')).map((s) => s.load_id) } }),
    ]);

    const totalAudits = auditResults.length;
    const detentionAudits = auditResults.filter((a) =>
      (a.issue || '').toLowerCase().includes('detention')
    ).length;

    profile.total_shipments = shipmentCount;
    profile.detention_frequency = shipmentCount > 0 ? detentionAudits / shipmentCount : 0;
    profile.audit_error_rate = shipmentCount > 0 ? totalAudits / shipmentCount : 0;
    profile.updatedAt = new Date();
    await profile.save();

    res.json({ profile, metrics: { shipmentCount, totalAudits, detentionAudits } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
