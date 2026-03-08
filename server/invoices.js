import express from 'express';
import { AuditTrail, Carrier, Customer, Exception, Invoice } from './models.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();
const normalizeKey = (value) => normalizeString(value).toLowerCase();
const normalizeMc = (value) => normalizeString(value).replace(/[^0-9a-z]/gi, '').toUpperCase();
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const toDate = (value) => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

async function logAudit({ entityType, entityId, action, actor = 'system', before = null, after = null, metadata = {} }) {
  try {
    await AuditTrail.create({
      id: `at-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      entityType,
      entityId,
      action,
      actor,
      before,
      after,
      metadata,
      createdAt: new Date(),
    });
  } catch {
    // Audit logging should not block request flow.
  }
}

async function createException({
  invoice,
  type,
  reason,
  severity = 'Medium',
  customer,
  carrier,
  amountOverride,
  metadata,
}) {
  const entry = new Exception({
    id: `exc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    invoiceId: invoice?.id,
    invoiceNumber: invoice?.invoiceNumber,
    customerId: customer?.id,
    customer: customer?.name,
    carrierId: carrier?.id,
    carrier: carrier?.name,
    amount: typeof amountOverride === 'number' ? amountOverride : invoice?.amount || 0,
    type,
    reason,
    description: reason,
    severity,
    status: 'Open',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await entry.save();
  await logAudit({
    entityType: 'exception',
    entityId: entry.id,
    action: 'exception.created',
    actor: 'system',
    after: entry.toObject(),
    metadata,
  });

  return entry;
}

async function findOrCreateCustomer(payload) {
  const name = normalizeString(payload.name);
  const email = normalizeString(payload.email);
  const nameLower = normalizeKey(name);
  const emailLower = normalizeKey(email);

  let existing = null;
  if (emailLower) existing = await Customer.findOne({ nameLower, emailLower });
  if (!existing) existing = await Customer.findOne({ nameLower });
  if (!existing && name) {
    existing = await Customer.findOne({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i'),
    });
  }

  if (existing) {
    let updated = false;
    const fields = ['phone', 'company', 'industry', 'taxId', 'billingAddress'];
    fields.forEach((field) => {
      if (payload[field] && payload[field] !== existing[field]) {
        existing[field] = payload[field];
        updated = true;
      }
    });

    if (email && email !== existing.email) {
      existing.email = email;
      existing.emailLower = emailLower;
      updated = true;
    }

    if (updated) {
      const before = existing.toObject();
      existing.updatedAt = new Date();
      await existing.save();
      await logAudit({
        entityType: 'customer',
        entityId: existing.id,
        action: 'customer.updated_from_invoice',
        before,
        after: existing.toObject(),
      });
    }

    return existing;
  }

  const newCustomer = new Customer({
    id: `c-${Date.now()}`,
    name,
    email: email || '',
    phone: normalizeString(payload.phone),
    company: normalizeString(payload.company || payload.contact),
    industry: normalizeString(payload.industry),
    taxId: normalizeString(payload.taxId),
    billingAddress: normalizeString(payload.billingAddress || payload.address),
    nameLower,
    emailLower,
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await newCustomer.save();
  await logAudit({
    entityType: 'customer',
    entityId: newCustomer.id,
    action: 'customer.created_from_invoice',
    after: newCustomer.toObject(),
  });
  return newCustomer;
}

async function findOrCreateCarrier(payload) {
  const name = normalizeString(payload.name);
  const mcNumber = normalizeString(payload.mcNumber);
  const mcNormalized = normalizeMc(mcNumber);

  let existing = null;
  if (mcNormalized) existing = await Carrier.findOne({ mcNumberNormalized: mcNormalized });
  if (!existing && mcNumber) existing = await Carrier.findOne({ mcNumber });

  if (existing) {
    let updated = false;
    const fields = ['email', 'phone', 'paymentTerms', 'taxId'];
    fields.forEach((field) => {
      if (payload[field] && payload[field] !== existing[field]) {
        existing[field] = payload[field];
        updated = true;
      }
    });

    if (payload.insuranceExpiry) {
      const nextDate = toDate(payload.insuranceExpiry);
      if (nextDate && (!existing.insuranceExpiry || nextDate.getTime() !== existing.insuranceExpiry.getTime())) {
        existing.insuranceExpiry = nextDate;
        updated = true;
      }
    }

    if (updated) {
      const before = existing.toObject();
      existing.updatedAt = new Date();
      await existing.save();
      await logAudit({
        entityType: 'carrier',
        entityId: existing.id,
        action: 'carrier.updated_from_invoice',
        before,
        after: existing.toObject(),
      });
    }

    return existing;
  }

  const newCarrier = new Carrier({
    id: `cr-${Date.now()}`,
    name,
    mcNumber: mcNumber || undefined,
    mcNumberNormalized: mcNormalized || undefined,
    email: normalizeString(payload.email),
    phone: normalizeString(payload.phone),
    paymentTerms: normalizeString(payload.paymentTerms),
    insuranceExpiry: toDate(payload.insuranceExpiry),
    taxId: normalizeString(payload.taxId),
    nameLower: normalizeKey(name),
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await newCarrier.save();
  await logAudit({
    entityType: 'carrier',
    entityId: newCarrier.id,
    action: 'carrier.created_from_invoice',
    after: newCarrier.toObject(),
  });
  return newCarrier;
}

function evaluateInvoiceRules({ type, invoiceAmount, accessorials, fuelSurcharge, contractRate, allowedAccessorials, expectedFuelSurcharge, podAttached }) {
  const findings = [];

  if (contractRate > 0 && invoiceAmount > contractRate) {
    findings.push({
      type: 'financial',
      reason: 'Invoice exceeds agreed contract rate',
      severity: 'High',
      amount: invoiceAmount - contractRate,
      code: 'rate_mismatch',
    });
  }

  if (allowedAccessorials >= 0 && accessorials > allowedAccessorials) {
    findings.push({
      type: 'financial',
      reason: 'Accessorial mismatch above agreed allowance',
      severity: 'Medium',
      amount: accessorials - allowedAccessorials,
      code: 'accessorial_mismatch',
    });
  }

  if (expectedFuelSurcharge >= 0 && Math.abs(fuelSurcharge - expectedFuelSurcharge) > 0.01) {
    findings.push({
      type: 'financial',
      reason: 'Fuel surcharge mismatch',
      severity: 'Medium',
      amount: Math.abs(fuelSurcharge - expectedFuelSurcharge),
      code: 'fuel_mismatch',
    });
  }

  if (type === 'AP' && !podAttached) {
    findings.push({
      type: 'compliance',
      reason: 'No POD attached',
      severity: 'High',
      amount: 0,
      code: 'missing_pod',
    });
  }

  return findings;
}

function transitionApproval(invoice, action) {
  const next = {
    approve: { status: 'Approved', approvalStatus: 'Approved' },
    hold: { status: 'ExceptionHold', approvalStatus: 'ExceptionHold' },
    ready: { status: 'ReadyToPay', approvalStatus: 'ReadyToPay' },
    reject: { status: 'Rejected', approvalStatus: 'Rejected' },
    pay: { status: 'Paid', approvalStatus: 'Paid' },
    review: { status: 'Pending', approvalStatus: 'PendingReview' },
  }[action];

  if (!next) return null;

  const allowed = {
    PendingReview: ['approve', 'hold', 'reject', 'ready'],
    ExceptionHold: ['review', 'approve', 'reject'],
    ReadyToPay: ['approve', 'hold', 'reject', 'pay'],
    Approved: ['pay', 'hold', 'reject'],
    Rejected: ['review'],
    Paid: [],
  };

  const current = invoice.approvalStatus || 'PendingReview';
  if (!(allowed[current] || []).includes(action)) return null;
  return next;
}

router.get('/', async (req, res) => {
  try {
    const { type, status, approvalStatus } = req.query;
    const query = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(approvalStatus ? { approvalStatus } : {}),
    };
    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/audit-trail', async (req, res) => {
  try {
    const trail = await AuditTrail.find({ entityType: 'invoice', entityId: req.params.id }).sort({ createdAt: -1 });
    res.json({ events: trail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, invoice = {}, customer = {}, carrier = {} } = req.body || {};
    if (!type) return res.status(400).json({ error: 'Invoice type is required' });
    if (type === 'AR' && !customer.name) return res.status(400).json({ error: 'Customer name is required for AR invoices' });
    if (type === 'AP' && !carrier.name) return res.status(400).json({ error: 'Carrier name is required for AP invoices' });

    const warnings = [];
    let linkedCustomer = null;
    let linkedCarrier = null;

    if (type === 'AR') {
      linkedCustomer = await findOrCreateCustomer(customer);
      if (!customer.taxId) warnings.push('Missing customer tax ID');
    }

    if (type === 'AP') {
      linkedCarrier = await findOrCreateCarrier(carrier);
      if (!carrier.mcNumber) warnings.push('Missing carrier MC number');
      if (!carrier.taxId) warnings.push('Missing carrier tax ID');
    }

    const invoiceNumber = normalizeString(invoice.invoiceNumber) || `${type}-${Date.now()}`;
    const duplicateInvoice = await Invoice.findOne({
      invoiceNumber,
      type,
      ...(type === 'AP' && linkedCarrier ? { carrierId: linkedCarrier.id } : {}),
      ...(type === 'AR' && linkedCustomer ? { customerId: linkedCustomer.id } : {}),
    });

    if (duplicateInvoice) {
      await createException({
        invoice: duplicateInvoice,
        type: 'financial',
        reason: 'Duplicate invoice number',
        severity: 'High',
        customer: linkedCustomer,
        carrier: linkedCarrier,
        metadata: { code: 'duplicate_invoice' },
      });
      return res.status(409).json({ error: 'Duplicate invoice detected', duplicateInvoice });
    }

    const invoiceAmount = toNumber(invoice.amount);
    const accessorials = toNumber(invoice.accessorials);
    const fuelSurcharge = toNumber(invoice.fuelSurcharge);
    const contractRate = toNumber(invoice.contractRate);
    const allowedAccessorials = toNumber(invoice.allowedAccessorials);
    const expectedFuelSurcharge = toNumber(invoice.expectedFuelSurcharge);
    const podAttached = Boolean(invoice.podAttached || invoice.podReference);

    const findings = evaluateInvoiceRules({
      type,
      invoiceAmount,
      accessorials,
      fuelSurcharge,
      contractRate,
      allowedAccessorials,
      expectedFuelSurcharge,
      podAttached,
    });

    const requiresHold = findings.some((f) => f.severity === 'High');

    const newInvoice = new Invoice({
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      customerId: linkedCustomer?.id,
      carrierId: linkedCarrier?.id,
      customerName: linkedCustomer?.name,
      carrierName: linkedCarrier?.name,
      carrier: linkedCarrier?.name || linkedCustomer?.name,
      invoiceNumber,
      amount: invoiceAmount,
      accessorials,
      fuelSurcharge,
      contractRate,
      allowedAccessorials,
      expectedFuelSurcharge,
      podAttached,
      podReference: normalizeString(invoice.podReference),
      varianceAmount: invoiceAmount - (contractRate + accessorials + fuelSurcharge),
      status: requiresHold ? 'ExceptionHold' : (normalizeString(invoice.status) || 'Pending'),
      approvalStatus: requiresHold ? 'ExceptionHold' : 'PendingReview',
      assignedTo: normalizeString(invoice.assignedTo),
      dueDate: toDate(invoice.dueDate),
      issueDate: toDate(invoice.issueDate) || new Date(),
      paymentTerms: normalizeString(invoice.paymentTerms),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newInvoice.save();

    await logAudit({
      entityType: 'invoice',
      entityId: newInvoice.id,
      action: 'invoice.created',
      actor: 'system',
      after: newInvoice.toObject(),
      metadata: { warnings },
    });

    for (const finding of findings) {
      await createException({
        invoice: newInvoice,
        type: finding.type,
        reason: finding.reason,
        severity: finding.severity,
        amountOverride: finding.amount,
        customer: linkedCustomer,
        carrier: linkedCarrier,
        metadata: { code: finding.code },
      });
    }

    for (const reason of warnings) {
      await createException({
        invoice: newInvoice,
        type: 'compliance',
        reason,
        severity: 'Medium',
        customer: linkedCustomer,
        carrier: linkedCarrier,
      });
    }

    res.status(201).json({
      invoice: newInvoice,
      customer: linkedCustomer,
      carrier: linkedCarrier,
      warnings,
      findings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/approval', async (req, res) => {
  try {
    const { action, actor } = req.body || {};
    if (!action) return res.status(400).json({ error: 'action is required' });

    const invoice = await Invoice.findOne({ id: req.params.id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const before = invoice.toObject();
    const transition = transitionApproval(invoice, action);
    if (!transition) {
      return res.status(409).json({ error: `Invalid transition from ${invoice.approvalStatus || 'PendingReview'} using action ${action}` });
    }

    invoice.status = transition.status;
    invoice.approvalStatus = transition.approvalStatus;
    invoice.updatedAt = new Date();

    if (action === 'approve') {
      invoice.approvedBy = normalizeString(actor) || 'system';
      invoice.approvedAt = new Date();
    }
    if (action === 'pay') {
      invoice.paidAt = new Date();
    }

    await invoice.save();

    await logAudit({
      entityType: 'invoice',
      entityId: invoice.id,
      action: `invoice.approval.${action}`,
      actor: normalizeString(actor) || 'system',
      before,
      after: invoice.toObject(),
    });

    return res.json({ invoice });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;