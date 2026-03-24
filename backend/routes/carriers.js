import express from 'express';
import Carrier from '../models/Carrier.js';
import Invoice from '../models/Invoice.js';
import { generateCarrierId, normalizeScac } from '../utils/idGenerator.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();
const normalizeKey = (value) => normalizeString(value).toLowerCase();
const normalizeMc = (value) => normalizeString(value).replace(/[^0-9a-z]/gi, '').toUpperCase();

async function getCarrierAggregates() {
  const aggregates = await Invoice.aggregate([
    { $match: { type: 'AP', carrierId: { $ne: null } } },
    {
      $group: {
        _id: '$carrierId',
        totalSpend: { $sum: { $ifNull: ['$amount', 0] } },
        openAP: {
          $sum: {
            $cond: [{ $ne: ['$status', 'Paid'] }, { $ifNull: ['$amount', 0] }, 0],
          },
        },
        invoiceCount: { $sum: 1 },
      },
    },
  ]);

  return aggregates.reduce((acc, row) => {
    acc[row._id] = {
      totalSpend: row.totalSpend || 0,
      openAP: row.openAP || 0,
      invoiceCount: row.invoiceCount || 0,
    };
    return acc;
  }, {});
}

// Get all carriers with aggregates
// Enhanced search/filter for CRM
router.get('/', async (req, res) => {
  try {
    const {
      commodity,
      equipment,
      area,
      active,
      baseState,
      status,
      rating,
      recruitmentStatus,
      q,
    } = req.query;

    // Build filter object
    const filter = {};
    if (commodity) filter.commodityTypes = { $in: [commodity] };
    if (equipment) filter.equipmentTypes = { $in: [equipment] };
    if (area) filter.areasServiced = { $in: [area] };
    if (active !== undefined) filter.active = active === 'true';
    if (baseState) filter.baseState = baseState;
    if (status) filter.status = status;
    if (rating) filter.rating = Number(rating);
    if (recruitmentStatus) filter.recruitmentStatus = recruitmentStatus;
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { mcNumber: regex },
        { dotNumber: regex },
        { email: regex },
        { phone: regex },
        { baseState: regex },
        { areasServiced: regex },
      ];
    }

    const [carriers, aggregates] = await Promise.all([
      Carrier.find(filter).sort({ updatedAt: -1 }),
      getCarrierAggregates(),
    ]);

    const data = carriers.map((carrier) => {
      const metrics = aggregates[carrier.id] || { totalSpend: 0, openAP: 0, invoiceCount: 0 };
      return {
        ...carrier.toObject(),
        ...metrics,
      };
    });

    res.json({ carriers: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get carrier by ID
router.get('/:id', async (req, res) => {
  try {
    const carrier = await Carrier.findOne({ id: req.params.id });
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    const aggregates = await getCarrierAggregates();
    const metrics = aggregates[carrier.id] || { totalSpend: 0, openAP: 0, invoiceCount: 0 };

    res.json({ ...carrier.toObject(), ...metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create carrier (manual or system)
router.post('/', async (req, res) => {
  try {
    const { name, mcNumber, email, phone, paymentTerms, insuranceExpiry, taxId, scacCode } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const mcNormalized = normalizeMc(mcNumber);
    const existing = mcNormalized ? await Carrier.findOne({ mcNumberNormalized: mcNormalized }) : null;
    if (existing) return res.status(409).json({ error: 'Carrier already exists', carrier: existing });

    const now = new Date();
    const carrierId = generateCarrierId(scacCode);

    // If ID derived from SCAC, check for collision
    const idExists = await Carrier.findOne({ id: carrierId });
    if (idExists) return res.status(409).json({ error: 'Carrier with this SCAC code already exists', carrier: idExists });

    const newCarrier = new Carrier({
      id: carrierId,
      name: normalizeString(name),
      scacCode: normalizeScac(scacCode),
      mcNumber: mcNumber ? normalizeString(mcNumber) : undefined,
      mcNumberNormalized: mcNormalized || undefined,
      email: normalizeString(email),
      phone: normalizeString(phone),
      paymentTerms: normalizeString(paymentTerms),
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
      taxId: normalizeString(taxId),
      nameLower: normalizeKey(name),
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    });

    await newCarrier.save();
    res.status(201).json(newCarrier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update carrier profile
// Update carrier profile and CRM fields
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const carrier = await Carrier.findOne({ id: req.params.id });
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    if (updates.name) {
      carrier.name = normalizeString(updates.name);
      carrier.nameLower = normalizeKey(updates.name);
    }
    if (updates.mcNumber) {
      carrier.mcNumber = normalizeString(updates.mcNumber);
      carrier.mcNumberNormalized = normalizeMc(updates.mcNumber) || undefined;
    }
    if (updates.email !== undefined) carrier.email = normalizeString(updates.email);
    if (updates.phone !== undefined) carrier.phone = normalizeString(updates.phone);
    if (updates.paymentTerms !== undefined) carrier.paymentTerms = normalizeString(updates.paymentTerms);
    if (updates.insuranceExpiry !== undefined) carrier.insuranceExpiry = updates.insuranceExpiry ? new Date(updates.insuranceExpiry) : undefined;
    if (updates.taxId !== undefined) carrier.taxId = normalizeString(updates.taxId);
    if (updates.status) carrier.status = updates.status;
    if (updates.rating !== undefined) carrier.rating = Number(updates.rating);
    if (updates.recruitmentStatus) carrier.recruitmentStatus = updates.recruitmentStatus;
    if (updates.commodityTypes) carrier.commodityTypes = Array.isArray(updates.commodityTypes) ? updates.commodityTypes : [updates.commodityTypes];
    if (updates.equipmentTypes) carrier.equipmentTypes = Array.isArray(updates.equipmentTypes) ? updates.equipmentTypes : [updates.equipmentTypes];
    if (updates.areasServiced) carrier.areasServiced = Array.isArray(updates.areasServiced) ? updates.areasServiced : [updates.areasServiced];
    if (updates.baseState) carrier.baseState = updates.baseState;
    if (updates.active !== undefined) carrier.active = !!updates.active;
    if (updates.creditsUsed !== undefined) carrier.creditsUsed = Number(updates.creditsUsed);
    if (updates.notes && Array.isArray(updates.notes)) carrier.notes = updates.notes;
    if (updates.addNote) {
      carrier.notes = carrier.notes || [];
      carrier.notes.push({
        text: updates.addNote.text,
        author: updates.addNote.author || 'system',
        createdAt: new Date(),
      });
    }

    carrier.updatedAt = new Date();
    await carrier.save();

    res.json(carrier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
