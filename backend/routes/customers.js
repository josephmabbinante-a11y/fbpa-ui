import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();
const upload = multer();

const normalizeString = (value) => (value || '').trim();
const normalizeKey = (value) => normalizeString(value).toLowerCase();
const DAY_MS = 24 * 60 * 60 * 1000;

function diffInDays(from, to) {
  return Math.floor((to - from) / DAY_MS);
}

function toAmount(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

async function getCustomerAggregates() {
  const aggregates = await Invoice.aggregate([
    { $match: { type: 'AR', customerId: { $ne: null } } },
    {
      $group: {
        _id: '$customerId',
        totalRevenue: { $sum: { $ifNull: ['$amount', 0] } },
        openAR: {
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
      totalRevenue: row.totalRevenue || 0,
      openAR: row.openAR || 0,
      invoiceCount: row.invoiceCount || 0,
    };
    return acc;
  }, {});
}

// Get all customers
router.get('/', async (req, res) => {
  try {
    const [customers, aggregates] = await Promise.all([
      Customer.find().sort({ updatedAt: -1 }),
      getCustomerAggregates(),
    ]);
    const data = customers.map((customer) => {
      const metrics = aggregates[customer.id] || { totalRevenue: 0, openAR: 0, invoiceCount: 0 };
      return { ...customer.toObject(), ...metrics };
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const invoices = await Invoice.find({ customerId: req.params.id, type: 'AR' }).sort({ createdAt: -1 });
    const aggregates = await getCustomerAggregates();
    const metrics = aggregates[customer.id] || { totalRevenue: 0, openAR: 0, invoiceCount: 0 };

    const paidCount = invoices.filter((inv) => inv.status === 'Paid').length;
    const pendingCount = invoices.filter((inv) => inv.status === 'Pending').length;
    const overdueCount = invoices.filter((inv) => {
      if (!inv.dueDate || inv.status === 'Paid') return false;
      return new Date(inv.dueDate) < new Date();
    }).length;

    const totalBilled = invoices.reduce((sum, inv) => sum + toAmount(inv.amount), 0);
    const totalPaid = invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + toAmount(inv.amount), 0);
    const totalOutstanding = invoices
      .filter((inv) => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + toAmount(inv.amount), 0);
    const totalOverdue = invoices
      .filter((inv) => inv.status !== 'Paid' && inv.dueDate && new Date(inv.dueDate) < new Date())
      .reduce((sum, inv) => sum + toAmount(inv.amount), 0);

    res.json({
      ...customer.toObject(),
      contact: customer.company || '',
      address: customer.billingAddress || '',
      ...metrics,
      auditStats: {
        invoices: metrics.invoiceCount,
        exceptions: 0,
        reviewed: metrics.invoiceCount,
      },
      paymentStats: {
        paid: paidCount,
        pending: pendingCount,
        overdue: overdueCount,
      },
      analysis: {
        totalBilled,
        totalPaid,
        totalOutstanding,
        totalOverdue,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer aging (invoices)
router.get('/:id/aging', async (req, res) => {
  try {
    const invoices = await Invoice.find({ customerId: req.params.id, type: 'AR' });
    const now = new Date();
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

    invoices.forEach((inv) => {
      if (inv.status === 'Paid') return;
      const amount = toAmount(inv.amount);
      const due = inv.dueDate ? new Date(inv.dueDate) : now;
      const daysPastDue = Math.max(0, diffInDays(due, now));

      if (daysPastDue <= 30) buckets['0-30'] += amount;
      else if (daysPastDue <= 60) buckets['31-60'] += amount;
      else if (daysPastDue <= 90) buckets['61-90'] += amount;
      else buckets['90+'] += amount;
    });

    res.json(buckets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new customer
router.post('/', async (req, res) => {
  try {
    const { name, contact, email, phone, address } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const id = `c-${Date.now()}`;
    const newCustomer = new Customer({
      id,
      name: normalizeString(name),
      email: normalizeString(email),
      phone: normalizeString(phone),
      company: normalizeString(contact),
      billingAddress: normalizeString(address),
      nameLower: normalizeKey(name),
      emailLower: normalizeKey(email),
      status: 'Active',
    });
    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer (partial)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    if (updates.name !== undefined) {
      customer.name = normalizeString(updates.name);
      customer.nameLower = normalizeKey(updates.name);
    }
    if (updates.email !== undefined) {
      customer.email = normalizeString(updates.email);
      customer.emailLower = normalizeKey(updates.email);
    }
    if (updates.phone !== undefined) customer.phone = normalizeString(updates.phone);
    if (updates.company !== undefined) customer.company = normalizeString(updates.company);
    if (updates.industry !== undefined) customer.industry = normalizeString(updates.industry);
    if (updates.taxId !== undefined) customer.taxId = normalizeString(updates.taxId);
    if (updates.billingAddress !== undefined) customer.billingAddress = normalizeString(updates.billingAddress);
    if (updates.status !== undefined) customer.status = updates.status;

    customer.updatedAt = new Date();
    await customer.save();

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload customers via CSV
router.post('/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const csv = req.file.buffer.toString('utf-8');
    const records = parse(csv, { columns: true, skip_empty_lines: true });
    const added = [];
    for (const row of records) {
      if (!row.name) continue;
      const id = `c-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const newCustomer = new Customer({
        id,
        name: normalizeString(row.name),
        email: normalizeString(row.email),
        phone: normalizeString(row.phone),
        company: normalizeString(row.contact),
        nameLower: normalizeKey(row.name),
        emailLower: normalizeKey(row.email),
        status: 'Active',
      });
      await newCustomer.save();
      added.push(newCustomer);
    }
    res.json({ message: `Uploaded ${added.length} customers`, customers: added });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
