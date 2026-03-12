import express from 'express';
import Shipment from '../models/Shipment.js';
import CarrierProfile from '../models/CarrierProfile.js';
import AuditResult from '../models/AuditResult.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();

// Lane analytics: aggregate all lanes, or filter by origin/destination when provided
router.get('/lanes', async (req, res) => {
  try {
    const { origin, destination } = req.query;

    const matchStage = {};
    if (origin) matchStage.origin = new RegExp(origin, 'i');
    if (destination) matchStage.destination = new RegExp(destination, 'i');

    const lanes = await Shipment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { origin: '$origin', destination: '$destination' },
          avgRate: { $avg: '$rate' },
          avgMiles: { $avg: '$miles' },
          shipmentCount: { $sum: 1 },
        },
      },
      { $sort: { shipmentCount: -1 } },
      { $limit: 50 },
    ]);

    const formatted = lanes.map((l) => ({
      origin: l._id.origin,
      destination: l._id.destination,
      avgRate: l.avgRate ? Math.round(l.avgRate * 100) / 100 : null,
      avgMiles: l.avgMiles ? Math.round(l.avgMiles) : null,
      shipmentCount: l.shipmentCount,
    }));

    res.json({ lanes: formatted, total: formatted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rate estimate for a given lane
router.post('/estimate', async (req, res) => {
  try {
    const { origin, destination, equipment } = req.body || {};
    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination are required' });
    }

    const matchStage = {
      origin: new RegExp(origin, 'i'),
      destination: new RegExp(destination, 'i'),
    };
    if (equipment) matchStage.equipment = new RegExp(equipment, 'i');

    const result = await Shipment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgRate: { $avg: '$rate' },
          avgMiles: { $avg: '$miles' },
          shipmentCount: { $sum: 1 },
        },
      },
    ]);

    const data = result[0];
    if (data && data.shipmentCount > 0) {
      return res.json({
        origin,
        destination,
        equipment: equipment || null,
        estimatedRate: Math.round((data.avgRate || 0) * 100) / 100,
        estimatedMiles: data.avgMiles ? Math.round(data.avgMiles) : null,
        confidence: data.shipmentCount >= 5 ? 'high' : 'low',
        basedOn: data.shipmentCount,
      });
    }

    // Fallback: deterministic estimate when no historical data.
    // Multiplier (47) and range (200–3000 miles) approximate typical US freight lanes.
    // Rate of $2.50/mile is a conservative baseline for dry van.
    const FALLBACK_BASE_MILES = 200;
    const FALLBACK_MILES_VARIANCE = 2800;
    const FALLBACK_RATE_PER_MILE = 2.5;
    const hash = (origin.length + destination.length) * 47;
    const estimatedMiles = FALLBACK_BASE_MILES + (hash % FALLBACK_MILES_VARIANCE);
    const estimatedRate = Math.round(estimatedMiles * FALLBACK_RATE_PER_MILE);
    res.json({
      origin,
      destination,
      equipment: equipment || null,
      estimatedRate,
      estimatedMiles,
      confidence: 'estimated',
      basedOn: 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Carrier intelligence: carriers that abuse detention
router.get('/detention-abusers', async (req, res) => {
  try {
    const threshold = Math.min(Math.max(Number(req.query.threshold) || 0.3, 0), 1);

    const carriers = await CarrierProfile.find({ detention_frequency: { $gte: threshold } })
      .sort({ detention_frequency: -1 });

    res.json({
      query: 'carriers with high detention frequency',
      threshold,
      count: carriers.length,
      carriers: carriers.map((c) => ({
        carrier_mc: c.carrier_mc,
        name: c.name,
        detention_frequency: c.detention_frequency,
        audit_error_rate: c.audit_error_rate,
        safety_score: c.safety_score,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suspicious invoices this month / since a given date
router.get('/suspicious-invoices', async (req, res) => {
  try {
    const since = req.query.since
      ? new Date(req.query.since)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // default: last 30 days

    if (Number.isNaN(since.getTime())) {
      return res.status(400).json({ error: 'Invalid since date' });
    }

    const results = await AuditResult.find({
      confidence: 'high',
      overcharge: { $gt: 0 },
      status: 'Open',
      createdAt: { $gte: since },
    }).sort({ overcharge: -1 });

    const totalOvercharge = results.reduce((sum, r) => sum + (r.overcharge || 0), 0);

    res.json({
      query: 'suspicious invoices',
      since: since.toISOString(),
      count: results.length,
      totalOvercharge: Math.round(totalOvercharge * 100) / 100,
      results: results.map((r) => ({
        id: r._id,
        load_id: r.load_id,
        invoice_id: r.invoice_id,
        issue: r.issue,
        overcharge: r.overcharge,
        root_cause: r.root_cause,
        confidence: r.confidence,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vector similarity search: find similar shipments by lane (text-based fallback)
router.get('/similar-shipments', async (req, res) => {
  try {
    const { load_id } = req.query;
    if (!load_id) return res.status(400).json({ error: 'load_id is required' });

    const source = await Shipment.findOne({ load_id });
    if (!source) return res.status(404).json({ error: 'Shipment not found' });

    // Text-based similarity: same equipment and overlapping origin/destination city
    const originCity = source.origin.split(',')[0].trim() || source.origin.trim();
    const destCity = source.destination.split(',')[0].trim() || source.destination.trim();

    const similar = await Shipment.find({
      load_id: { $ne: source.load_id },
      $or: [
        { origin: new RegExp(originCity, 'i') },
        { destination: new RegExp(destCity, 'i') },
      ],
      equipment: source.equipment,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      source: { load_id: source.load_id, origin: source.origin, destination: source.destination, equipment: source.equipment },
      similar: similar.map((s) => ({
        load_id: s.load_id,
        origin: s.origin,
        destination: s.destination,
        equipment: s.equipment,
        miles: s.miles,
        rate: s.rate,
        carrier_mc: s.carrier_mc,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summary dashboard for AI freight intelligence
router.get('/summary', async (req, res) => {
  try {
    const [
      totalShipments,
      totalCarrierProfiles,
      openAuditResults,
      highConfidenceOvercharges,
    ] = await Promise.all([
      Shipment.countDocuments(),
      CarrierProfile.countDocuments(),
      AuditResult.countDocuments({ status: 'Open' }),
      AuditResult.aggregate([
        { $match: { confidence: 'high', overcharge: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$overcharge' }, count: { $sum: 1 } } },
      ]),
    ]);

    const overchargeData = highConfidenceOvercharges[0] || { total: 0, count: 0 };

    res.json({
      totalShipments,
      totalCarrierProfiles,
      openAuditResults,
      highConfidenceOvercharges: overchargeData.count,
      totalOverchargeAmount: Math.round(overchargeData.total * 100) / 100,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
