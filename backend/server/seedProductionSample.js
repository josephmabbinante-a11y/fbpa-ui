import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Carrier, Customer, Load } from './models.js';

dotenv.config();

const MONGODB_URI = String(process.env.MONGODB_URI || '').trim();

if (!MONGODB_URI) {
  console.error('[seed] MONGODB_URI is required');
  process.exit(1);
}

function makeId(prefix, n) {
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

function sampleCustomers() {
  return [
    { id: 'cust-1001', name: 'Northstar Foods', email: 'ops+northstar@example.com', company: 'Northstar Foods' },
    { id: 'cust-1002', name: 'Harbor Retail Group', email: 'ops+harbor@example.com', company: 'Harbor Retail Group' },
    { id: 'cust-1003', name: 'Summit Medical Supply', email: 'ops+summit@example.com', company: 'Summit Medical Supply' },
    { id: 'cust-1004', name: 'Blue Mile Commerce', email: 'ops+bluemile@example.com', company: 'Blue Mile Commerce' },
  ];
}

function sampleCarriers() {
  return [
    { id: 'cr-2001', name: 'Velocity Van Logistics', mcNumber: 'MC700101', status: 'Active' },
    { id: 'cr-2002', name: 'Prime Ridge Transport', mcNumber: 'MC700102', status: 'Active' },
    { id: 'cr-2003', name: 'Polar Freight Solutions', mcNumber: 'MC700103', status: 'Active' },
  ];
}

function sampleLoads(customers, carriers) {
  const now = Date.now();
  const lanes = [
    ['Dallas', 'TX', 'Atlanta', 'GA'],
    ['Chicago', 'IL', 'Nashville', 'TN'],
    ['Phoenix', 'AZ', 'Denver', 'CO'],
    ['Los Angeles', 'CA', 'Seattle', 'WA'],
  ];

  return Array.from({ length: 24 }).map((_, idx) => {
    const lane = lanes[idx % lanes.length];
    const customer = customers[idx % customers.length];
    const carrier = carriers[idx % carriers.length];
    const miles = 480 + (idx * 24);
    const revenue = Math.round(miles * 2.42);
    const carrierCost = Math.round(revenue * 0.82);
    const margin = revenue - carrierCost;
    const marginPct = Number(((margin / Math.max(1, revenue)) * 100).toFixed(1));
    const pickupAt = new Date(now + ((idx + 1) * 5 * 60 * 60 * 1000)).toISOString();
    const deliveryAt = new Date(now + ((idx + 1) * 18 * 60 * 60 * 1000)).toISOString();

    return {
      id: makeId('L', 5000 + idx),
      status: idx % 5 === 0 ? 'TENDERED' : idx % 7 === 0 ? 'IN_TRANSIT' : 'DRAFT',
      customer: { id: customer.id, name: customer.name },
      carrier: { id: carrier.id, name: carrier.name, assigned: idx % 5 !== 0 },
      origin: { city: lane[0], state: lane[1] },
      destination: { city: lane[2], state: lane[3] },
      equipment: idx % 3 === 0 ? 'reefer' : 'van',
      miles,
      revenue,
      carrierCost,
      margin,
      marginPct,
      targetMarginPct: 12,
      pickupAt,
      deliveryAt,
      dispatcher: { id: 'U-9', name: 'Dispatch Lead' },
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          id: `sth-${Date.now()}-${idx}`,
          fromStatus: 'DRAFT',
          toStatus: idx % 5 === 0 ? 'TENDERED' : idx % 7 === 0 ? 'IN_TRANSIT' : 'DRAFT',
          status: idx % 5 === 0 ? 'TENDERED' : idx % 7 === 0 ? 'IN_TRANSIT' : 'DRAFT',
          userId: 'seed-script',
          reason: 'Sanitized production sample',
          source: 'seed',
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAtDb: new Date(),
    };
  });
}

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });

  const customers = sampleCustomers();
  const carriers = sampleCarriers();
  const loads = sampleLoads(customers, carriers);

  await Promise.all(customers.map((customer) => Customer.updateOne(
    { id: customer.id },
    {
      $set: {
        ...customer,
        nameLower: String(customer.name || '').toLowerCase(),
        emailLower: String(customer.email || '').toLowerCase(),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  )));

  await Promise.all(carriers.map((carrier) => Carrier.updateOne(
    { id: carrier.id },
    {
      $set: {
        ...carrier,
        mcNumberNormalized: String(carrier.mcNumber || '').replace(/[^0-9a-z]/gi, '').toUpperCase(),
        nameLower: String(carrier.name || '').toLowerCase(),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  )));

  await Promise.all(loads.map((load) => Load.updateOne(
    { id: load.id },
    { $set: load, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  )));

  console.log(`[seed] Upserted ${customers.length} customers, ${carriers.length} carriers, ${loads.length} loads`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('[seed] Failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
