import express from 'express';
import Load from '../models/Loads.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();

// Carrier cost is typically ~82% of the load rate (standard industry margin)
const CARRIER_COST_RATIO = 0.82;

// Get all loads
router.get('/', async (req, res) => {
  try {
    const loads = await Load.find().sort({ updatedAt: -1 });
    const items = loads.map((load) => ({
      ...load.toObject(),
      miles: load.mileage,
      revenue: load.rate,
      carrierCost: load.rate ? Math.round(load.rate * CARRIER_COST_RATIO) : null,
      carrier: { name: load.carrierId || '' },
    }));
    res.json({ items, total: items.length, source: 'api' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get load by ID
router.get('/:id', async (req, res) => {
  try {
    const load = await Load.findOne({ id: req.params.id });
    if (!load) return res.status(404).json({ error: 'Load not found' });
    res.json(load);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function createLoad(req, res) {
  try {
    const body = req.body || {};
    const prefix = body.source === 'auction' ? 'AL' : body.loadType === 'ancillary' || body.idPrefix === 'AX' ? 'AX' : 'load';
    const id = `${prefix}-${Date.now()}`;
    const newLoad = new Load({
      id,
      source: body.source || (prefix === 'AX' ? 'ancillary' : 'direct'),
      loadType: body.loadType || (prefix === 'AX' ? 'ancillary' : prefix === 'AL' ? 'auction' : 'standard'),
      parentLoadId: body.parentLoadId || null,
      referenceNumber: normalizeString(body.referenceNumber),
      status: body.status || 'Pending',
      origin: normalizeString(body.origin),
      destination: normalizeString(body.destination),
      pickupDate: body.pickupDate || null,
      deliveryDate: body.deliveryDate || null,
      equipment: body.equipment || 'Van',
      weight: Number(body.weight) || null,
      mileage: Number(body.mileage) || null,
      rate: Number(body.rate) || null,
      customerId: normalizeString(body.customerId),
      carrierId: normalizeString(body.carrierId),
      driverId: normalizeString(body.driverId),
      vehicleId: normalizeString(body.vehicleId),
      notes: normalizeString(body.notes),
      freightCategory: body.freightCategory || 'adhoc',
    });
    await newLoad.save();
    res.status(201).json(newLoad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Create a new load
router.post('/', createLoad);

// POST /create — alias for creating a load (matches frontend expectation)
router.post('/create', createLoad);

// GET /templates/list — load templates
router.get('/templates/list', async (req, res) => {
  try {
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /estimate-mileage — estimate mileage between origin and destination
router.post('/estimate-mileage', (req, res) => {
  const { origin, destination } = req.body || {};
  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin and destination are required' });
  }
  // Placeholder: derive a deterministic estimate from input string lengths.
  // Multiplier (47) and range (200–3000 miles) approximate typical US freight lanes.
  const hash = (origin.length + destination.length) * 47;
  const estimatedMiles = 200 + (hash % 2800);
  // Confidence: deterministic value in 60–85 range
  const confidence = 60 + (hash % 26);
  res.json({ origin, destination, miles: estimatedMiles, estimatedMiles, method: 'estimated', confidence });
});

// GET /:id/events — stub for future event log
router.get('/:id/events', async (req, res) => {
  res.json([]);
});

// GET /:id/risk-signals — stub for compliance/margin risk
router.get('/:id/risk-signals', async (req, res) => {
  res.json({ signals: [] });
});

// Update load (partial)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const load = await Load.findOne({ id: req.params.id });
    if (!load) return res.status(404).json({ error: 'Load not found' });

    const stringFields = ['referenceNumber', 'origin', 'destination', 'notes', 'customerId', 'carrierId', 'driverId', 'vehicleId'];
    for (const field of stringFields) {
      if (updates[field] !== undefined) load[field] = normalizeString(updates[field]);
    }
    if (updates.status !== undefined) load.status = updates.status;
    if (updates.equipment !== undefined) load.equipment = updates.equipment;
    const dateFields = ['pickupDate', 'deliveryDate'];
    for (const field of dateFields) {
      if (updates[field] !== undefined) load[field] = updates[field];
    }
    const numericFields = ['weight', 'mileage', 'rate'];
    for (const field of numericFields) {
      if (updates[field] !== undefined) load[field] = Number(updates[field]) || null;
    }

    // Freight category + ancillary type update
    if (updates.freightCategory !== undefined) load.freightCategory = updates.freightCategory;
    if (updates.ancillaryType !== undefined) load.ancillaryType = updates.ancillaryType;

    // Billing allocations update (validate percentages sum ≤ 100)
    if (Array.isArray(updates.billingAllocations)) {
      const totalPct = updates.billingAllocations.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
      if (totalPct > 100) {
        return res.status(400).json({ error: 'Billing allocation percentages cannot exceed 100%' });
      }
      load.billingAllocations = updates.billingAllocations.map((a) => ({
        partyId: normalizeString(a.partyId),
        partyName: normalizeString(a.partyName),
        partyType: a.partyType || 'customer',
        percentage: Number(a.percentage) || 0,
        fixedAmount: a.fixedAmount != null ? Number(a.fixedAmount) : null,
        notes: normalizeString(a.notes),
      }));
    }

    load.updatedAt = new Date();
    await load.save();
    res.json(load);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/consolidated-financials — aggregates parent + all ancillary loads
router.get('/:id/consolidated-financials', async (req, res) => {
  try {
    const parentLoad = await Load.findOne({ id: req.params.id });
    if (!parentLoad) return res.status(404).json({ error: 'Load not found' });

    const ancillaryLoads = await Load.find({ parentLoadId: req.params.id, loadType: 'ancillary' }).sort({ createdAt: -1 });

    const parentRevenue = Number(parentLoad.rate) || 0;
    const parentCost = parentRevenue ? Math.round(parentRevenue * CARRIER_COST_RATIO) : 0;

    const ancillarySummary = ancillaryLoads.map((al) => {
      const rev = Number(al.rate) || 0;
      const cost = rev ? Math.round(rev * CARRIER_COST_RATIO) : 0;
      return {
        id: al.id,
        ancillaryType: al.ancillaryType || 'other',
        revenue: rev,
        carrierCost: cost,
        margin: rev - cost,
        status: al.status,
        notes: al.notes || '',
        createdAt: al.createdAt,
      };
    });

    const totalAncillaryRevenue = ancillarySummary.reduce((sum, a) => sum + a.revenue, 0);
    const totalAncillaryCost = ancillarySummary.reduce((sum, a) => sum + a.carrierCost, 0);

    const consolidatedRevenue = parentRevenue + totalAncillaryRevenue;
    const consolidatedCost = parentCost + totalAncillaryCost;
    const consolidatedMargin = consolidatedRevenue - consolidatedCost;
    const consolidatedMarginPct = consolidatedRevenue > 0 ? Number(((consolidatedMargin / consolidatedRevenue) * 100).toFixed(1)) : 0;

    // Compute split billing amounts if allocations exist
    const allocations = (parentLoad.billingAllocations || []).map((alloc) => ({
      ...alloc.toObject ? alloc.toObject() : alloc,
      allocatedAmount: alloc.fixedAmount != null ? alloc.fixedAmount : Math.round(consolidatedRevenue * (alloc.percentage / 100)),
    }));

    res.json({
      loadId: req.params.id,
      parent: {
        revenue: parentRevenue,
        carrierCost: parentCost,
        margin: parentRevenue - parentCost,
        miles: parentLoad.mileage || 0,
      },
      ancillaryCharges: ancillarySummary,
      ancillaryCount: ancillarySummary.length,
      totalAncillaryRevenue,
      totalAncillaryCost,
      consolidated: {
        revenue: consolidatedRevenue,
        carrierCost: consolidatedCost,
        margin: consolidatedMargin,
        marginPct: consolidatedMarginPct,
      },
      billingAllocations: allocations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
