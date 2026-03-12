import express from 'express';
import Carrier from '../models/Carrier.js';
import Customer from '../models/Customer.js';
import Exception from '../models/Exception.js';
import Invoice from '../models/Invoice.js';

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

async function createException({
  invoice,
  type,
  reason,
  severity = 'Medium',
  customer,
  carrier,
}) {
  const entry = new Exception({
    id: `exc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    invoiceId: invoice?.id,
    invoiceNumber: invoice?.invoiceNumber,
    customerId: customer?.id,
    customer: customer?.name,
    carrierId: carrier?.id,
    carrier: carrier?.name,
    amount: invoice?.amount || 0,
    type,
    reason,
    description: reason,
    severity,
    status: 'Open',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await entry.save();
  return entry;
}

async function findOrCreateCustomer(payload) {
  const name = normalizeString(payload.name);
  const email = normalizeString(payload.email);
  const nameLower = normalizeKey(name);
  const emailLower = normalizeKey(email);

  let existing = null;
  if (emailLower) {
    existing = await Customer.findOne({ nameLower, emailLower });
  }
  if (!existing) {
    existing = await Customer.findOne({ nameLower });
  }
  if (!existing && name) {
    existing = await Customer.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
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
      existing.updatedAt = new Date();
      await existing.save();
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
  return newCustomer;
}

async function findOrCreateCarrier(payload) {
  const name = normalizeString(payload.name);
  const mcNumber = normalizeString(payload.mcNumber);
  const mcNormalized = normalizeMc(mcNumber);

  let existing = null;
  if (mcNormalized) {
    existing = await Carrier.findOne({ mcNumberNormalized: mcNormalized });
  }
  if (!existing && mcNumber) {
    existing = await Carrier.findOne({ mcNumber: mcNumber });
  }

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
      existing.updatedAt = new Date();
      await existing.save();
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
  return newCarrier;
}

// Get invoices
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create invoice with exception automation engine
router.post('/', async (req, res) => {
  try {
    const { type, invoice = {}, customer = {}, carrier = {} } = req.body || {};
    if (!type) return res.status(400).json({ error: 'Invoice type is required' });

    if (type === 'AR' && !customer.name) {
      return res.status(400).json({ error: 'Customer name is required for AR invoices' });
    }

    if (type === 'AP' && !carrier.name) {
      return res.status(400).json({ error: 'Carrier name is required for AP invoices' });
    }

    const warnings = [];
    let linkedCustomer = null;
    let linkedCarrier = null;

    if (type === 'AR') {
      linkedCustomer = await findOrCreateCustomer(customer);
      if (!customer.taxId) {
        warnings.push('Missing customer tax ID');
      }
    }

    if (type === 'AP') {
      linkedCarrier = await findOrCreateCarrier(carrier);
      if (!carrier.mcNumber) {
        warnings.push('Missing carrier MC number');
      }
      if (!carrier.taxId) {
        warnings.push('Missing carrier tax ID');
      }
    }

    // Exception Automation Engine: Duplicate Detection
    const invoiceNumberToCheck = normalizeString(invoice.invoiceNumber);
    let duplicateInvoice = null;
    if (invoiceNumberToCheck) {
      duplicateInvoice = await Invoice.findOne({
        invoiceNumber: invoiceNumberToCheck,
        type,
        ...(type === 'AP' && linkedCarrier ? { carrierId: linkedCarrier.id } : {}),
        ...(type === 'AR' && linkedCustomer ? { customerId: linkedCustomer.id } : {}),
      });
    }

    if (duplicateInvoice) {
      // Create exception for duplicate
      await createException({
        invoice: duplicateInvoice,
        type: 'financial',
        reason: 'Duplicate invoice detected',
        severity: 'High',
        customer: linkedCustomer,
        carrier: linkedCarrier,
      });
      return res.status(409).json({ error: 'Duplicate invoice detected', duplicateInvoice });
    }

    // Accessorial validation (simple: must be present and >= 0)
    let accessorialsValue = 0;
    if (typeof invoice.accessorials === 'number' && invoice.accessorials >= 0) {
      accessorialsValue = invoice.accessorials;
    } else {
      // Create exception for invalid accessorials
      await createException({
        invoice: null,
        type: 'financial',
        reason: 'Invalid accessorials',
        severity: 'Medium',
        customer: linkedCustomer,
        carrier: linkedCarrier,
      });
      return res.status(400).json({ error: 'Invalid or missing accessorials' });
    }


    // Fuel variance alert (simple: must be present and within 0-1000)
    let fuelSurchargeValue = 0;
    if (typeof invoice.fuelSurcharge === 'number' && invoice.fuelSurcharge >= 0 && invoice.fuelSurcharge <= 1000) {
      fuelSurchargeValue = invoice.fuelSurcharge;
    } else {
      // Create exception for fuel variance
      await createException({
        invoice: null,
        type: 'financial',
        reason: 'Fuel variance alert',
        severity: 'Medium',
        customer: linkedCustomer,
        carrier: linkedCarrier,
      });
      return res.status(400).json({ error: 'Invalid or missing fuel surcharge' });
    }


    // Contract mismatch flag (if amount > contractRate)
    let contractRateValue = 0;
    if (typeof invoice.contractRate === 'number' && invoice.contractRate >= 0) {
      contractRateValue = invoice.contractRate;
    }

    const newInvoice = new Invoice({
      id: `inv-${Date.now()}`,
      type,
      customerId: linkedCustomer?.id,
      carrierId: linkedCarrier?.id,
      customerName: linkedCustomer?.name,
      carrierName: linkedCarrier?.name,
      carrier: linkedCarrier?.name || linkedCustomer?.name,
      invoiceNumber: invoiceNumberToCheck || `${type}-${Date.now()}`,
      load_id: normalizeString(invoice.load_id),
      amount: toNumber(invoice.amount),
      linehaul: toNumber(invoice.linehaul),
      fuel: toNumber(invoice.fuel),
      detention: toNumber(invoice.detention),
      accessorials: accessorialsValue,
      accessorialItems: Array.isArray(invoice.accessorialItems) ? invoice.accessorialItems : [],
      fuelSurcharge: fuelSurchargeValue,
      contractRate: contractRateValue,
      status: normalizeString(invoice.status) || 'Pending',
      dueDate: toDate(invoice.dueDate),
      issueDate: toDate(invoice.issueDate) || new Date(),
      paymentTerms: normalizeString(invoice.paymentTerms),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // If contractRate is set and invoice amount > contractRate, create exception
    if (contractRateValue > 0 && toNumber(invoice.amount) > contractRateValue) {
      await createException({
        invoice: newInvoice,
        type: 'financial',
        reason: 'Contract rate mismatch',
        severity: 'High',
        customer: linkedCustomer,
        carrier: linkedCarrier,
      });
    }

    await newInvoice.save();

    if (warnings.length > 0) {
      for (const reason of warnings) {
        await createException({
          invoice: newInvoice,
          type: 'compliance',
          reason,
          customer: linkedCustomer,
          carrier: linkedCarrier,
        });
      }
    }

    res.status(201).json({
      invoice: newInvoice,
      customer: linkedCustomer,
      carrier: linkedCarrier,
      warnings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update invoice (partial)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const invoice = await Invoice.findOne({ id: req.params.id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (updates.status !== undefined) invoice.status = updates.status;
    if (updates.amount !== undefined) invoice.amount = toNumber(updates.amount);
    if (updates.dueDate !== undefined) invoice.dueDate = toDate(updates.dueDate);
    if (updates.paymentTerms !== undefined) invoice.paymentTerms = normalizeString(updates.paymentTerms);
    if (updates.invoiceNumber !== undefined) invoice.invoiceNumber = normalizeString(updates.invoiceNumber);
    if (updates.accessorials !== undefined) invoice.accessorials = toNumber(updates.accessorials);
    if (updates.fuelSurcharge !== undefined) invoice.fuelSurcharge = toNumber(updates.fuelSurcharge);
    if (updates.contractRate !== undefined) invoice.contractRate = toNumber(updates.contractRate);
    if (updates.load_id !== undefined) invoice.load_id = normalizeString(updates.load_id);
    if (updates.linehaul !== undefined) invoice.linehaul = toNumber(updates.linehaul);
    if (updates.fuel !== undefined) invoice.fuel = toNumber(updates.fuel);
    if (updates.detention !== undefined) invoice.detention = toNumber(updates.detention);
    if (updates.accessorialItems !== undefined && Array.isArray(updates.accessorialItems)) {
      invoice.accessorialItems = updates.accessorialItems;
    }

    invoice.updatedAt = new Date();
    await invoice.save();

    res.json({ invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
