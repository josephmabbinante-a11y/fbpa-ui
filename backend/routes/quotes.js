import express from 'express';
import mongoose from 'mongoose';
import Quote from '../models/Quote.js';

const router = express.Router();

// List quotes for the authenticated user with optional filters
router.get('/', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable.' });
  }

  const userId = req.user?.userId || req.user?.id || req.user?.email;
  if (!userId) {
    return res.status(401).json({ error: 'User not identified.' });
  }

  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 50));
  const skip = Math.max(0, Number(req.query.skip) || 0);
  const filter = { userId };

  if (req.query.status) {
    filter.status = String(req.query.status);
  }
  if (req.query.source) {
    filter.source = String(req.query.source);
  }
  if (req.query.customerId) {
    filter.customerId = String(req.query.customerId);
  }

  const [items, total] = await Promise.all([
    Quote.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Quote.countDocuments(filter),
  ]);

  return res.json({ items, total, limit, skip });
});

// Get quoting summary stats for the authenticated user
// MUST be before /:quoteId to avoid param matching
router.get('/stats/summary', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable.' });
  }

  const userId = req.user?.userId || req.user?.id || req.user?.email;
  if (!userId) {
    return res.status(401).json({ error: 'User not identified.' });
  }

  const [total, sent, accepted, rejected] = await Promise.all([
    Quote.countDocuments({ userId }),
    Quote.countDocuments({ userId, status: 'sent' }),
    Quote.countDocuments({ userId, status: 'accepted' }),
    Quote.countDocuments({ userId, status: 'rejected' }),
  ]);

  const recentQuotes = await Quote.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const totalValue = recentQuotes.reduce((sum, q) => sum + (Number(q.totalQuoteAmount) || 0), 0);
  const winRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0.0';

  return res.json({
    total,
    sent,
    accepted,
    rejected,
    totalValue,
    winRate,
    recentQuotes,
  });
});

// Get a single quote by ID (scoped to user)
router.get('/:quoteId', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable.' });
  }

  const userId = req.user?.userId || req.user?.id || req.user?.email;
  const quote = await Quote.findOne({ quoteId: req.params.quoteId, userId }).lean();
  if (!quote) {
    return res.status(404).json({ error: 'Quote not found.' });
  }

  return res.json({ quote });
});

// Create a new quote record
router.post('/', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable.' });
  }

  const userId = req.user?.userId || req.user?.id || req.user?.email;
  const userName = req.user?.name || '';
  const userEmail = req.user?.email || '';

  if (!userId) {
    return res.status(401).json({ error: 'User not identified.' });
  }

  const body = req.body || {};

  const quote = await Quote.create({
    quoteId: body.quoteId || `qt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    userEmail,
    userName,
    source: body.source || 'calculator',
    customerId: body.customerId || '',
    customerName: body.customerName || '',
    origin: body.origin || '',
    destination: body.destination || '',
    originZip3: body.originZip3 || '',
    destinationZip3: body.destinationZip3 || '',
    miles: Number(body.miles) || 0,
    equipmentType: body.equipmentType || 'dry_van',
    ruleRate: Number(body.ruleRate) || null,
    mlRate: Number(body.mlRate) || null,
    recommendedSellRate: Number(body.recommendedSellRate) || null,
    carrierCostRate: Number(body.carrierCostRate) || null,
    totalQuoteAmount: Number(body.totalQuoteAmount) || null,
    margin: Number(body.margin) || null,
    confidence: Number(body.confidence) || null,
    auctionCarrier: body.auctionCarrier || '',
    auctionQuoteId: body.auctionQuoteId || '',
    auctionRate: Number(body.auctionRate) || null,
    status: body.status || 'draft',
    accepted: typeof body.accepted === 'boolean' ? body.accepted : null,
    bookedRate: Number(body.bookedRate) || null,
    timeToCoverMinutes: Number(body.timeToCoverMinutes) || null,
    engineVersion: body.engineVersion || '',
    featureSchemaVersion: body.featureSchemaVersion || '',
    featureSnapshot: body.featureSnapshot || {},
    predictionSnapshot: body.predictionSnapshot || {},
    loadId: body.loadId || '',
    validUntil: body.validUntil || null,
    notes: body.notes || '',
  });

  return res.status(201).json({ quote });
});

// Update quote status / outcome (e.g., mark as sent, accepted, rejected)
router.patch('/:quoteId', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable.' });
  }

  const userId = req.user?.userId || req.user?.id || req.user?.email;
  const quote = await Quote.findOne({ quoteId: req.params.quoteId, userId });
  if (!quote) {
    return res.status(404).json({ error: 'Quote not found.' });
  }

  const body = req.body || {};
  const allowedFields = [
    'status', 'accepted', 'bookedRate', 'timeToCoverMinutes',
    'customerName', 'customerId', 'notes', 'loadId', 'validUntil',
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      quote[field] = body[field];
    }
  }

  await quote.save();
  return res.json({ quote });
});

export default router;
