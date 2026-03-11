import { Load } from './models.js';

async function seedTestLoads() {
  const testLoads = [
    {
      id: 'L-100001',
      status: 'DRAFT',
      customer: { id: 'C-1', name: 'Test Customer' },
      carrier: { id: 'CR-1', name: 'Test Carrier', assigned: false },
      origin: { city: 'Chicago', state: 'IL' },
      destination: { city: 'Dallas', state: 'TX' },
      equipment: 'van',
      miles: 950,
      revenue: 2500,
      carrierCost: 2000,
      margin: 500,
      marginPct: 20,
      targetMarginPct: 12,
      pickupAt: new Date().toISOString(),
      deliveryAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      dispatcher: { id: 'U-9', name: 'Alex Smith' },
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          id: 'SH-1',
          fromStatus: 'DRAFT',
          toStatus: 'DRAFT',
          userId: 'system',
          createdAt: new Date().toISOString(),
          source: 'seed',
        },
      ],
    },
    {
      id: 'L-100002',
      status: 'IN_TRANSIT',
      customer: { id: 'C-2', name: 'Demo Customer' },
      carrier: { id: 'CR-2', name: 'Demo Carrier', assigned: true },
      origin: { city: 'Atlanta', state: 'GA' },
      destination: { city: 'Miami', state: 'FL' },
      equipment: 'reefer',
      miles: 660,
      revenue: 1800,
      carrierCost: 1400,
      margin: 400,
      marginPct: 22.2,
      targetMarginPct: 12,
      pickupAt: new Date().toISOString(),
      deliveryAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
      dispatcher: { id: 'U-9', name: 'Alex Smith' },
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          id: 'SH-2',
          fromStatus: 'DRAFT',
          toStatus: 'IN_TRANSIT',
          userId: 'system',
          createdAt: new Date().toISOString(),
          source: 'seed',
        },
      ],
    },
  ];

  for (const load of testLoads) {
    const exists = await Load.findOne({ id: load.id });
    if (!exists) {
      await new Load(load).save();
      console.log(`Seeded load: ${load.id}`);
    }
  }
  console.log('Test loads seeding complete.');
}

seedTestLoads().then(() => process.exit(0));
