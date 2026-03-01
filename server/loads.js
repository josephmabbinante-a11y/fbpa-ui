import express from 'express';

const router = express.Router();

const loads = [
  {
    id: 'L-102938',
    status: 'in_transit',
    customer: { id: 'C-44', name: 'Amazon' },
    carrier: { id: 'CR-18', name: 'Prime Logistics', assigned: true },
    origin: { city: 'Los Angeles', state: 'CA' },
    destination: { city: 'Dallas', state: 'TX' },
    equipment: 'van',
    miles: 1280,
    revenue: 4200,
    carrierCost: 3600,
    margin: 600,
    marginPct: 14.3,
    targetMarginPct: 12,
    pickupAt: '2026-03-02T15:00:00Z',
    deliveryAt: '2026-03-04T03:00:00Z',
    dispatcher: { id: 'U-9', name: 'Alex Smith' },
    updatedAt: '2026-03-01T18:32:00Z',
  },
  {
    id: 'L-204811',
    status: 'open',
    customer: { id: 'C-52', name: 'Target' },
    carrier: { id: null, name: 'Pending', assigned: false },
    origin: { city: 'Phoenix', state: 'AZ' },
    destination: { city: 'Salt Lake City', state: 'UT' },
    equipment: 'reefer',
    miles: 650,
    revenue: 3850,
    carrierCost: 2900,
    margin: 950,
    marginPct: 24.7,
    targetMarginPct: 12,
    pickupAt: '2026-03-02T10:00:00Z',
    deliveryAt: '2026-03-03T01:00:00Z',
    dispatcher: { id: 'U-10', name: 'Jamie Lee' },
    updatedAt: '2026-03-01T17:10:00Z',
  },
  {
    id: 'L-887201',
    status: 'uncovered',
    customer: { id: 'C-60', name: 'Walmart' },
    carrier: { id: null, name: '—', assigned: false },
    origin: { city: 'Atlanta', state: 'GA' },
    destination: { city: 'Orlando', state: 'FL' },
    equipment: 'van',
    miles: 435,
    revenue: 3000,
    carrierCost: 0,
    margin: 3000,
    marginPct: 100,
    targetMarginPct: 12,
    pickupAt: '2026-03-01T23:00:00Z',
    deliveryAt: '2026-03-02T14:00:00Z',
    dispatcher: { id: 'U-9', name: 'Alex Smith' },
    updatedAt: '2026-03-01T18:45:00Z',
  },
];

const riskByLoad = {
  'L-102938': {
    loadId: 'L-102938',
    laneVolatilityScore: 61,
    capacityHeatIndex: 51,
    complianceStatus: 'valid',
    pickupCountdownMinutes: 930,
    warnings: ['margin_below_lane_avg'],
  },
  'L-204811': {
    loadId: 'L-204811',
    laneVolatilityScore: 42,
    capacityHeatIndex: 38,
    complianceStatus: 'valid',
    pickupCountdownMinutes: 610,
    warnings: [],
  },
  'L-887201': {
    loadId: 'L-887201',
    laneVolatilityScore: 73,
    capacityHeatIndex: 69,
    complianceStatus: 'pending',
    pickupCountdownMinutes: 220,
    warnings: ['carrier_not_assigned'],
  },
};

const eventsByLoad = {
  'L-102938': [
    {
      id: 'EV-909',
      loadId: 'L-102938',
      type: 'carrier_assigned',
      message: 'Carrier Prime Logistics assigned',
      actor: { id: 'U-9', name: 'Alex Smith' },
      createdAt: '2026-03-01T18:22:00Z',
    },
  ],
  'L-204811': [],
  'L-887201': [],
};

function appendEvent(loadId, type, message, actor = { id: 'U-system', name: 'System' }) {
  if (!eventsByLoad[loadId]) eventsByLoad[loadId] = [];
  eventsByLoad[loadId].unshift({
    id: `EV-${Date.now()}`,
    loadId,
    type,
    message,
    actor,
    createdAt: new Date().toISOString(),
  });
}

function withComputed(load) {
  const revenue = Number(load.revenue || 0);
  const carrierCost = Number(load.carrierCost || 0);
  const margin = revenue - carrierCost;
  const marginPct = revenue > 0 ? Number(((margin / revenue) * 100).toFixed(1)) : 0;
  return { ...load, revenue, carrierCost, margin, marginPct };
}

function getTabFiltered(items, tab) {
  if (tab === 'my') return items.filter((l) => l.dispatcher?.id === 'U-9');
  if (tab === 'uncovered') return items.filter((l) => !l.carrier?.assigned);
  if (tab === 'delivered') return items.filter((l) => l.status === 'delivered');
  if (tab === 'at_risk') {
    return items.filter((l) => {
      const risk = riskByLoad[l.id];
      return Number(l.marginPct) < Number(l.targetMarginPct || 12) || (risk?.warnings || []).length > 0;
    });
  }
  return items;
}

function matchesText(load, q) {
  const text = String(q || '').trim().toLowerCase();
  if (!text) return true;
  return [
    load.id,
    load.customer?.name,
    load.carrier?.name,
    load.origin?.city,
    load.destination?.city,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(text));
}

router.get('/', (req, res) => {
  const {
    tab = 'all',
    q = '',
    status,
    equipment,
    dispatcherId,
    page = '1',
    pageSize = '50',
  } = req.query;

  let items = loads.map(withComputed);
  items = getTabFiltered(items, String(tab));

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  if (equipment) {
    items = items.filter((item) => item.equipment === equipment);
  }

  if (dispatcherId) {
    items = items.filter((item) => item.dispatcher?.id === dispatcherId);
  }

  items = items.filter((item) => matchesText(item, q));

  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedPageSize = Math.min(100, Math.max(1, Number.parseInt(String(pageSize), 10) || 50));
  const start = (parsedPage - 1) * parsedPageSize;
  const pagedItems = items.slice(start, start + parsedPageSize);

  const facets = {
    status: {
      open: items.filter((i) => i.status === 'open').length,
      in_transit: items.filter((i) => i.status === 'in_transit').length,
      uncovered: items.filter((i) => i.status === 'uncovered').length,
      at_risk: items.filter((i) => Number(i.marginPct) < Number(i.targetMarginPct || 12)).length,
      delivered: items.filter((i) => i.status === 'delivered').length,
    },
    equipment: {
      van: items.filter((i) => i.equipment === 'van').length,
      reefer: items.filter((i) => i.equipment === 'reefer').length,
      flatbed: items.filter((i) => i.equipment === 'flatbed').length,
    },
  };

  res.json({
    items: pagedItems,
    page: parsedPage,
    pageSize: parsedPageSize,
    total: items.length,
    facets,
  });
});

router.get('/:loadId', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const computed = withComputed(load);
  const laneAverageMarginPct = 15.4;
  const marginDeltaPct = Number((computed.marginPct - laneAverageMarginPct).toFixed(1));

  return res.json({
    load: computed,
    laneAverageMarginPct,
    marginDeltaPct,
    controls: {
      canDispatch: true,
      canReassign: true,
      canBidNetwork: true,
      canMarkDelivered: computed.status === 'in_transit',
    },
  });
});

router.get('/:loadId/risk-signals', (req, res) => {
  const risk = riskByLoad[req.params.loadId];
  if (!risk) {
    return res.status(404).json({ error: { code: 'RISK_NOT_FOUND', message: 'Risk signals not found' } });
  }
  return res.json({ risk });
});

router.get('/:loadId/events', (req, res) => {
  const items = eventsByLoad[req.params.loadId] || [];
  return res.json({ items, nextCursor: null });
});

router.post('/:loadId/dispatch', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const carrierId = String(req.body?.carrierId || '').trim();
  if (!carrierId) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'carrierId is required',
      },
    });
  }

  const computed = withComputed(load);
  const minMarginPct = Number(load.targetMarginPct || 12);
  if (computed.marginPct < minMarginPct) {
    return res.status(422).json({
      error: {
        code: 'MARGIN_BELOW_THRESHOLD',
        message: `Margin ${computed.marginPct}% is below required ${minMarginPct}%`,
        details: { required: minMarginPct, actual: computed.marginPct },
      },
    });
  }

  load.status = 'in_transit';
  load.carrier = { id: carrierId, name: req.body?.carrierName || 'Assigned Carrier', assigned: true };
  load.updatedAt = new Date().toISOString();

  appendEvent(load.id, 'load_dispatched', `Load dispatched to carrier ${load.carrier.name}`);

  return res.json({
    load: withComputed(load),
    dispatch: {
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
    },
  });
});

router.post('/:loadId/reassign', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const carrierId = String(req.body?.carrierId || '').trim();
  if (!carrierId) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'carrierId is required' } });
  }

  load.carrier = { id: carrierId, name: req.body?.carrierName || 'Reassigned Carrier', assigned: true };
  load.updatedAt = new Date().toISOString();
  appendEvent(load.id, 'carrier_reassigned', `Carrier reassigned to ${load.carrier.name}`);

  return res.json({ load: withComputed(load) });
});

router.post('/:loadId/send-to-bid-network', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const requestId = `BN-${Date.now()}`;
  appendEvent(load.id, 'sent_to_bid_network', `Sent to ${req.body?.network || 'internal'} bid network`);

  return res.status(202).json({ requestId, status: 'queued' });
});

router.post('/:loadId/mark-delivered', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  load.status = 'delivered';
  load.deliveryAt = req.body?.deliveredAt || new Date().toISOString();
  load.updatedAt = new Date().toISOString();

  appendEvent(load.id, 'load_delivered', 'Load marked as delivered');

  return res.json({ load: withComputed(load) });
});

export default router;
