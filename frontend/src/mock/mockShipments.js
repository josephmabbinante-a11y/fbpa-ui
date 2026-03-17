// Mock shipment data for dashboard demo mode
// Each object should match the expected shape for mapLoadToRow
const mockShipments = [
  {
    id: 'L-1001',
    customer: 'Acme Corp',
    carrier: 'FastTrans',
    origin: { city: 'Dallas', state: 'TX' },
    destination: { city: 'Chicago', state: 'IL' },
    status: 'delivered',
    revenue: 2500,
    carrierCost: 1800,
    deliveryAt: new Date().toISOString(),
  },
  {
    id: 'L-1002',
    customer: 'Beta Inc',
    carrier: 'QuickShip',
    origin: { city: 'Houston', state: 'TX' },
    destination: { city: 'Atlanta', state: 'GA' },
    status: 'in_transit',
    revenue: 1800,
    carrierCost: 1200,
    deliveryAt: new Date().toISOString(),
  },
  {
    id: 'L-1003',
    customer: 'Gamma LLC',
    carrier: 'ShipRight',
    origin: { city: 'Austin', state: 'TX' },
    destination: { city: 'Miami', state: 'FL' },
    status: 'pending',
    revenue: 2100,
    carrierCost: 1500,
    deliveryAt: new Date().toISOString(),
  },
  // Add more mock shipments as needed
];

export default mockShipments;
