/* global process */
// Script to seed MongoDB with example data
// Usage: node scripts/seed.js
import mongoose from 'mongoose';
import { Customer, Carrier, Invoice, Exception } from '../server/models.js';
import { customers, carriers, invoices, exceptions } from './seedData.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fbpa';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await Customer.deleteMany({});
  await Carrier.deleteMany({});
  await Invoice.deleteMany({});
  await Exception.deleteMany({});
  await Customer.insertMany(customers);
  await Carrier.insertMany(carriers);
  await Invoice.insertMany(invoices);
  await Exception.insertMany(exceptions);
  console.log('Database seeded successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
