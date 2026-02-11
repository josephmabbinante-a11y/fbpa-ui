// Mock dashboard data for Opscale Audit IQ frontend
const dashboard = {
  summary: {
    totalInvoices: 1247,
    totalExceptions: 89,
    totalSavings: 12450.75,
    pendingReview: 23,
  },
  recentActivity: [
    {
      id: 1,
      type: 'exception',
      invoiceNumber: 'INV-1001',
      carrier: 'FastShip',
      amount: 1245.67,
      status: 'Review',
      timestamp: '2026-02-09T14:32:00Z',
    },
    {
      id: 2,
      type: 'upload',
      fileName: 'feb-9-invoices.csv',
      count: 42,
      status: 'Processed',
      timestamp: '2026-02-09T13:15:00Z',
    },
    {
      id: 3,
      type: 'exception',
      invoiceNumber: 'INV-1002',
      carrier: 'Oceanic',
      amount: 980.5,
      status: 'Fail',
      timestamp: '2026-02-09T10:45:00Z',
    },
  ],
  topCarriers: [
    { carrier: 'FastShip', invoiceCount: 345, savingsAmount: 2450.75 },
    { carrier: 'Oceanic', invoiceCount: 312, savingsAmount: 1980.50 },
    { carrier: 'RailMax', invoiceCount: 289, savingsAmount: 1750.25 },
  ],
};

export default dashboard;
