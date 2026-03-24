// Mock customer seed data for demo/mock mode
const mockCustomers = [
  {
    id: 'CUST001',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '(555) 123-4567',
    company: 'Acme Corp',
    industry: 'Retail',
    billingAddress: '123 Main St, Dallas, TX 75201',
    status: 'Active',
    totalRevenue: 485000,
    openAR: 42000,
    invoiceCount: 87,
    auditStats: { approved: 62, rejected: 8, pending: 12, autoResolved: 5 },
    paymentStats: { paid: 68, pending: 14, overdue: 5 },
    analysis: { totalBilled: 485000, totalPaid: 412000, totalOutstanding: 42000, totalOverdue: 31000 },
  },
  {
    id: 'CUST002',
    name: 'Beta Inc',
    email: 'info@betainc.com',
    phone: '(555) 234-5678',
    company: 'Beta Inc',
    industry: 'Manufacturing',
    billingAddress: '456 Market Ave, Houston, TX 77001',
    status: 'Active',
    totalRevenue: 312000,
    openAR: 18500,
    invoiceCount: 54,
    auditStats: { approved: 42, rejected: 3, pending: 6, autoResolved: 3 },
    paymentStats: { paid: 48, pending: 4, overdue: 2 },
    analysis: { totalBilled: 312000, totalPaid: 280000, totalOutstanding: 18500, totalOverdue: 13500 },
  },
  {
    id: 'CUST003',
    name: 'Gamma LLC',
    email: 'ops@gammallc.com',
    phone: '(555) 345-6789',
    company: 'Gamma LLC',
    industry: 'Logistics',
    billingAddress: '789 Commerce Blvd, Austin, TX 78701',
    status: 'Active',
    totalRevenue: 198000,
    openAR: 24000,
    invoiceCount: 32,
    auditStats: { approved: 22, rejected: 4, pending: 5, autoResolved: 1 },
    paymentStats: { paid: 24, pending: 6, overdue: 2 },
    analysis: { totalBilled: 198000, totalPaid: 162000, totalOutstanding: 24000, totalOverdue: 12000 },
  },
];

export const mockCustomerAging = {
  CUST001: { '0-30': 18000, '31-60': 12000, '61-90': 8000, '90+': 4000 },
  CUST002: { '0-30': 10000, '31-60': 5500, '61-90': 2000, '90+': 1000 },
  CUST003: { '0-30': 12000, '31-60': 7000, '61-90': 3500, '90+': 1500 },
};

export default mockCustomers;
