import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGODB_URI = String(process.env.MONGODB_URI || '').trim();

if (!MONGODB_URI) {
  console.error('[schema] MONGODB_URI is required');
  process.exit(1);
}

function hasIndex(indexes, key) {
  return indexes.some((idx) => Object.prototype.hasOwnProperty.call(idx.key || {}, key));
}

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const names = new Set(collections.map((c) => c.name));

  const requiredCollections = ['loads', 'customers', 'carriers', 'audittrails'];
  const missingCollections = requiredCollections.filter((name) => !names.has(name));

  if (missingCollections.length > 0) {
    console.error(`[schema] Missing collections: ${missingCollections.join(', ')}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const loadIndexes = await db.collection('loads').indexes();
  const auditIndexes = await db.collection('audittrails').indexes();

  const checks = [
    { ok: hasIndex(loadIndexes, 'id'), label: 'loads.id index' },
    { ok: hasIndex(loadIndexes, 'customer.id'), label: 'loads.customer.id index' },
    { ok: hasIndex(loadIndexes, 'carrier.id'), label: 'loads.carrier.id index' },
    { ok: hasIndex(loadIndexes, 'status'), label: 'loads.status index' },
    { ok: hasIndex(auditIndexes, 'entityType'), label: 'audittrails.entityType index' },
    { ok: hasIndex(auditIndexes, 'entityId'), label: 'audittrails.entityId index' },
  ];

  const failed = checks.filter((item) => !item.ok);
  checks.forEach((item) => {
    console.log(`[schema] ${item.ok ? 'OK' : 'MISSING'}: ${item.label}`);
  });

  await mongoose.disconnect();

  if (failed.length > 0) {
    process.exit(1);
  }
}

run().catch(async (err) => {
  console.error('[schema] Failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
