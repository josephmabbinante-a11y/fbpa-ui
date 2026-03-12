import express from 'express';
import AuditResult from '../models/AuditResult.js';
import Shipment from '../models/Shipment.js';
import Invoice from '../models/Invoice.js';
import CarrierProfile from '../models/CarrierProfile.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Get all audit results
router.get('/', async (req, res) => {
  try {
    const { load_id, invoice_id, confidence, status } = req.query;
    const query = {};
    if (load_id) query.load_id = load_id;
    if (invoice_id) query.invoice_id = invoice_id;
    if (confidence) query.confidence = confidence;
    if (status) query.status = status;

    const results = await AuditResult.find(query).sort({ createdAt: -1 });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get audit result by id
router.get('/:id', async (req, res) => {
  try {
    const result = await AuditResult.findById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Audit result not found' });
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create audit result
router.post('/', async (req, res) => {
  try {
    const { load_id, invoice_id, issue, overcharge, root_cause, confidence, status } = req.body || {};

    if (!load_id) return res.status(400).json({ error: 'load_id is required' });
    if (!issue) return res.status(400).json({ error: 'issue is required' });

    const result = new AuditResult({
      load_id: normalizeString(load_id),
      invoice_id: normalizeString(invoice_id),
      issue: normalizeString(issue),
      overcharge: toNumber(overcharge),
      root_cause: normalizeString(root_cause),
      confidence: normalizeString(confidence) || 'medium',
      status: normalizeString(status) || 'Open',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await result.save();
    res.status(201).json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update audit result status
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const result = await AuditResult.findById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Audit result not found' });

    if (updates.issue !== undefined) result.issue = normalizeString(updates.issue);
    if (updates.overcharge !== undefined) result.overcharge = toNumber(updates.overcharge);
    if (updates.root_cause !== undefined) result.root_cause = normalizeString(updates.root_cause);
    if (updates.confidence !== undefined) result.confidence = updates.confidence;
    if (updates.status !== undefined) result.status = updates.status;

    result.updatedAt = new Date();
    await result.save();

    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Automated audit: run audit on an invoice by invoice_id or load_id
router.post('/run', async (req, res) => {
  try {
    const { invoice_id, load_id } = req.body || {};

    if (!invoice_id && !load_id) {
      return res.status(400).json({ error: 'invoice_id or load_id is required' });
    }

    const invoiceQuery = {};
    if (invoice_id) invoiceQuery.invoiceNumber = invoice_id;
    if (load_id) invoiceQuery.load_id = load_id;

    const invoice = await Invoice.findOne(invoiceQuery);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const shipment = invoice.load_id ? await Shipment.findOne({ load_id: invoice.load_id }) : null;
    const carrierProfile = shipment?.carrier_mc
      ? await CarrierProfile.findOne({ carrier_mc: shipment.carrier_mc })
      : null;

    const auditIssues = [];

    // Rule 1: Detention validation
    if (invoice.detention > 0) {
      const gracePeriodHours = 2;
      const detentionThreshold = gracePeriodHours * 50; // $50/hour after grace period
      if (invoice.detention > detentionThreshold && carrierProfile?.detention_frequency > 0.3) {
        auditIssues.push({
          issue: 'Detention invalid',
          overcharge: invoice.detention,
          root_cause: 'Carrier billed before grace period expired',
          confidence: 'high',
        });
      }
    }

    // Rule 2: Contract rate mismatch
    if (invoice.contractRate > 0 && invoice.linehaul > invoice.contractRate) {
      auditIssues.push({
        issue: 'Contract rate mismatch',
        overcharge: invoice.linehaul - invoice.contractRate,
        root_cause: 'Linehaul charge exceeds contracted rate',
        confidence: 'high',
      });
    }

    // Rule 3: Fuel surcharge anomaly
    if (invoice.fuel > 0 && invoice.linehaul > 0) {
      const fuelPct = invoice.fuel / invoice.linehaul;
      if (fuelPct > 0.3) {
        auditIssues.push({
          issue: 'Fuel surcharge anomaly',
          overcharge: invoice.fuel - invoice.linehaul * 0.3,
          root_cause: `Fuel surcharge is ${(fuelPct * 100).toFixed(1)}% of linehaul (expected <30%)`,
          confidence: 'medium',
        });
      }
    }

    // Rule 4: High carrier audit error rate
    if (carrierProfile && carrierProfile.audit_error_rate > 0.1) {
      auditIssues.push({
        issue: 'High-risk carrier',
        overcharge: 0,
        root_cause: `Carrier has ${(carrierProfile.audit_error_rate * 100).toFixed(1)}% audit error rate`,
        confidence: 'low',
      });
    }

    const savedResults = [];
    for (const item of auditIssues) {
      const result = new AuditResult({
        load_id: invoice.load_id || load_id || '',
        invoice_id: invoice.invoiceNumber,
        issue: item.issue,
        overcharge: item.overcharge,
        root_cause: item.root_cause,
        confidence: item.confidence,
        status: 'Open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await result.save();
      savedResults.push(result);
    }

    res.json({
      invoice: { id: invoice.id, invoiceNumber: invoice.invoiceNumber },
      shipment: shipment ? { load_id: shipment.load_id, origin: shipment.origin, destination: shipment.destination } : null,
      carrier: carrierProfile ? { carrier_mc: carrierProfile.carrier_mc, name: carrierProfile.name } : null,
      issuesFound: savedResults.length,
      results: savedResults,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get suspicious invoices (high-confidence audit results with overcharges)
router.get('/suspicious/invoices', async (req, res) => {
  try {
    const { since } = req.query;
    const query = { confidence: 'high', overcharge: { $gt: 0 }, status: 'Open' };
    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) query.createdAt = { $gte: sinceDate };
    }

    const results = await AuditResult.find(query).sort({ overcharge: -1 });

    const totalOvercharge = results.reduce((sum, r) => sum + r.overcharge, 0);
    res.json({ count: results.length, totalOvercharge, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
