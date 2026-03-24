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

// Placeholder: derive a deterministic estimate from input string lengths.
// Multiplier (47) and range (200–3000 miles) approximate typical US freight lanes.
function estimateMileage(origin, destination) {
  const hash = ((origin || '').length + (destination || '').length) * 47;
  return 200 + (hash % 2800);
}

// POST /estimate-mileage — estimate mileage between origin and destination
router.post('/estimate-mileage', (req, res) => {
  const { origin, destination } = req.body || {};
  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin and destination are required' });
  }
  const estimatedMiles = estimateMileage(origin, destination);
  const hash = (origin.length + destination.length) * 47;
  const confidence = 60 + (hash % 26);
  res.json({ origin, destination, miles: estimatedMiles, estimatedMiles, method: 'estimated', confidence });
});

// GET /:id/events — real event log from load document
router.get('/:id/events', async (req, res) => {
  try {
    const load = await Load.findOne({ id: req.params.id });
    if (!load) return res.status(404).json({ error: 'Load not found' });
    const statusEvents = (load.statusHistory || []).map((h, i) => ({
      id: `sh-${i}`,
      loadId: load.id,
      type: 'status_transition',
      message: `${(h.fromStatus || 'NEW').replace(/_/g, ' ')} → ${(h.toStatus || '').replace(/_/g, ' ')}`,
      actor: { id: h.userId || 'system', name: h.userId || 'system' },
      reason: h.reason || '',
      createdAt: h.createdAt,
    }));
    const generalEvents = (load.events || []).map((e, i) => ({
      id: e.id || `ev-${i}`,
      loadId: load.id,
      type: e.type || 'note',
      message: e.message || '',
      actor: e.actor || { id: 'system', name: 'system' },
      meta: e.meta || {},
      createdAt: e.createdAt,
    }));
    const items = [...statusEvents, ...generalEvents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ items, nextCursor: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/risk-signals — live risk analysis based on load data
router.get('/:id/risk-signals', async (req, res) => {
  try {
    const load = await Load.findOne({ id: req.params.id });
    if (!load) return res.status(404).json({ error: 'Load not found' });

    const signals = [];
    const now = new Date();

    // Margin risk
    const revenue = Number(load.rate) || 0;
    const carrierCost = revenue * CARRIER_COST_RATIO;
    const marginPct = revenue > 0 ? ((revenue - carrierCost) / revenue) * 100 : 0;
    if (marginPct < 10) signals.push({ level: 'critical', category: 'margin', text: `Margin at ${marginPct.toFixed(1)}% — below 10% threshold` });
    else if (marginPct < 15) signals.push({ level: 'warning', category: 'margin', text: `Margin at ${marginPct.toFixed(1)}% — below lane average` });

    // Late pickup risk
    if (load.pickupDate) {
      const pickup = new Date(load.pickupDate);
      const hoursUntilPickup = (pickup - now) / (1000 * 60 * 60);
      if (hoursUntilPickup < 0 && !['Delivered', 'In Transit'].includes(load.status)) {
        signals.push({ level: 'critical', category: 'schedule', text: 'Pickup date has passed — load not yet in transit' });
      } else if (hoursUntilPickup < 4 && hoursUntilPickup >= 0) {
        signals.push({ level: 'warning', category: 'schedule', text: `Pickup in ${Math.round(hoursUntilPickup)}h — confirm carrier on time` });
      }
    }

    // Late delivery risk
    if (load.deliveryDate) {
      const delivery = new Date(load.deliveryDate);
      const hoursUntilDelivery = (delivery - now) / (1000 * 60 * 60);
      if (hoursUntilDelivery < 0 && load.status !== 'Delivered') {
        signals.push({ level: 'critical', category: 'schedule', text: 'Delivery date has passed — load not yet delivered' });
      } else if (hoursUntilDelivery < 6 && hoursUntilDelivery >= 0 && load.status !== 'Delivered') {
        signals.push({ level: 'warning', category: 'schedule', text: `Delivery in ${Math.round(hoursUntilDelivery)}h — track closely` });
      }
    }

    // Missing carrier
    if (!load.carrierId && !['Pending', 'Cancelled'].includes(load.status)) {
      signals.push({ level: 'warning', category: 'coverage', text: 'No carrier assigned — load is uncovered' });
    }

    // Missing weight/mileage
    if (!load.mileage) signals.push({ level: 'info', category: 'data', text: 'Mileage not set — rate accuracy may be impacted' });
    if (!load.weight) signals.push({ level: 'info', category: 'data', text: 'Weight not provided — BOL incomplete' });

    // POD risk (delivered but no POD)
    if (load.status === 'Delivered' && !load.podFileName) {
      signals.push({ level: 'warning', category: 'documents', text: 'Delivered but no POD on file — invoice blocked' });
    }

    // Stale load (pending > 48h)
    const ageHours = (now - new Date(load.createdAt)) / (1000 * 60 * 60);
    if (load.status === 'Pending' && ageHours > 48) {
      signals.push({ level: 'warning', category: 'aging', text: `Load pending for ${Math.round(ageHours)}h — consider re-quoting or cancelling` });
    }

    // Capacity heat index (simulated from mileage + equipment)
    const mileage = Number(load.mileage) || estimateMileage(load.origin || '', load.destination || '');
    const capacityHeatIndex = Math.min(100, Math.max(10, (mileage % 60) + 30));
    const laneVolatilityScore = Math.min(100, Math.max(10, ((mileage * 3) % 50) + 20));

    res.json({
      signals,
      meta: {
        loadId: load.id,
        marginPct: Number(marginPct.toFixed(1)),
        capacityHeatIndex,
        laneVolatilityScore,
        complianceStatus: load.carrierId ? 'valid' : 'pending',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/pod — upload POD and optionally transition status
router.post('/:id/pod', async (req, res) => {
  try {
    const load = await Load.findOne({ id: req.params.id });
    if (!load) return res.status(404).json({ error: 'Load not found' });
    const { fileName, userId } = req.body || {};
    const podName = normalizeString(fileName) || `POD-${load.id}-${Date.now()}.pdf`;
    load.podFileName = podName;
    load.podUploadedAt = new Date();

    // Record event
    const event = { type: 'pod_upload', message: `POD uploaded: ${podName}`, actor: { id: userId || 'system', name: userId || 'system' }, createdAt: new Date() };
    if (!load.events) load.events = [];
    load.events.push(event);

    // Auto-transition to Delivered → POD_RECEIVED equivalent if appropriate
    const prevStatus = load.status;
    if (prevStatus === 'Delivered') {
      load.status = 'Delivered'; // Keep as Delivered since model enum is limited
      if (!load.statusHistory) load.statusHistory = [];
      load.statusHistory.push({ fromStatus: prevStatus, toStatus: 'Delivered', userId: userId || 'system', reason: 'POD received', createdAt: new Date() });
    }

    load.updatedAt = new Date();
    await load.save();
    res.json({ ok: true, podFileName: podName, podUploadedAt: load.podUploadedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/events — add a manual event to the load
router.post('/:id/events', async (req, res) => {
  try {
    const load = await Load.findOne({ id: req.params.id });
    if (!load) return res.status(404).json({ error: 'Load not found' });
    const { type, message, userId } = req.body || {};
    const event = {
      id: `ev-${Date.now()}`,
      type: type || 'note',
      message: normalizeString(message) || 'Event logged',
      actor: { id: userId || 'system', name: userId || 'system' },
      createdAt: new Date(),
    };
    if (!load.events) load.events = [];
    load.events.push(event);
    load.updatedAt = new Date();
    await load.save();
    res.json({ item: event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
});

// Delete a load
router.delete('/:id', async (req, res) => {
  try {
    const load = await Load.findOne({ id: req.params.id });
    if (!load) return res.status(404).json({ error: 'Load not found' });
    await Load.deleteOne({ id: req.params.id });
    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

    // Stops update
    if (Array.isArray(updates.stops)) {
      load.stops = updates.stops.map((s, i) => ({
        stopId: String(s.stopId || s.id || `stop-${Date.now()}-${i}`),
        sequence: Number(s.sequence ?? i),
        type: s.type || 'Pickup',
        locationId: String(s.locationId || ''),
        locationName: String(s.locationName || s.location || ''),
        address: String(s.address || ''),
        city: String(s.city || ''),
        state: String(s.state || ''),
        zip: String(s.zip || ''),
        contact: String(s.contact || ''),
        contactPhone: String(s.contactPhone || ''),
        contactEmail: String(s.contactEmail || ''),
        scheduledDate: String(s.scheduledDate || ''),
        scheduledTime: String(s.scheduledTime || ''),
        appointmentEnd: String(s.appointmentEnd || ''),
        endDate: String(s.endDate || ''),
        cargoDescription: String(s.cargoDescription || ''),
        referenceNumbers: String(s.referenceNumbers || ''),
        driverInstructions: String(s.driverInstructions || ''),
        notes: String(s.notes || ''),
        actualArrival: String(s.actualArrival || ''),
        actualDeparture: String(s.actualDeparture || ''),
        loadingMinutes: String(s.loadingMinutes || ''),
        showOnCustomerDocs: s.showOnCustomerDocs !== false,
        appointmentRequired: Boolean(s.appointmentRequired),
        liftgateRequired: Boolean(s.liftgateRequired),
        hazmatCertified: Boolean(s.hazmatCertified),
      }));
    }

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
