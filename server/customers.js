import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { Customer, Invoice, Exception } from './models.js';

const router = express.Router();
const upload = multer();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer aging (invoices)
router.get('/:id/aging', async (req, res) => {
  try {
    const invoices = await Invoice.find({ customerId: req.params.id });
    res.json({
      customerId: req.params.id,
      invoices,
      total: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    });
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
      name,
      email: email || '',
      phone: phone || '',
      company: contact || '',
      status: 'Active',
    });
    await newCustomer.save();
    res.status(201).json(newCustomer);
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
        name: row.name,
        email: row.email || '',
        phone: row.phone || '',
        company: row.contact || '',
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
