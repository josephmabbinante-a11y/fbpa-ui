// Mock exceptions data for Opscale Audit IQ frontend (mock-first)
const exceptions = [
  {
    id: 'exc_001',
    invoiceNumber: 'INV-1001',
    carrier: 'FastShip',
    amount: 1245.67,
    reason: 'Rate mismatch: expected $1,100.00',
    status: 'Review',
    createdAt: '2026-02-01T10:24:00Z',
    savings: 145.67,
    reasonCode: 'RATE_MISMATCH'
  },
  {
    id: 'exc_002',
    invoiceNumber: 'INV-1002',
    carrier: 'Oceanic',
    amount: 980.5,
    reason: 'Duplicate invoice detected',
    status: 'Fail',
    createdAt: '2026-02-03T14:12:00Z',
    savings: 0,
    reasonCode: 'DUPLICATE'
  },
  {
    id: 'exc_003',
    invoiceNumber: 'INV-1003',
    carrier: 'RailMax',
    amount: 450.0,
    reason: 'Invalid accessorials',
    status: 'Review',
    createdAt: '2026-02-05T09:05:00Z',
    savings: 30.0,
    reasonCode: 'INVALID_ACCESSORIALS'
  }
];

export default exceptions;
