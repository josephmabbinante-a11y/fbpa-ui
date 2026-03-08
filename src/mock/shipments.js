// Mock shipments data for Dashboard operational command center
const shipments = [
  {
    id: 'SHP-001',
    customer: 'Acme Corp',
    carrier: 'TransCo',
    origin: 'Los Angeles, CA',
    destination: 'Dallas, TX',
    status: 'In Transit',
    revenue: '$2,450',
    cost: '$1,800',
    margin: '$650 (26.5%)',
    dueDate: '2026-02-15',
  },
  {
    id: 'SHP-002',
    customer: 'Global Trade',
    carrier: 'FastHaul',
    origin: 'Chicago, IL',
    destination: 'Miami, FL',
    status: 'Delivered',
    revenue: '$1,820',
    cost: '$1,200',
    margin: '$620 (34.1%)',
    dueDate: '2026-02-10',
  },
  {
    id: 'SHP-003',
    customer: 'Swift Logistics',
    carrier: 'RedLine',
    origin: 'Atlanta, GA',
    destination: 'Toronto, ON',
    status: 'Booked',
    revenue: '$3,100',
    cost: '$2,100',
    margin: '$1,000 (32.3%)',
    dueDate: '2026-02-20',
  },
];

export default shipments;
