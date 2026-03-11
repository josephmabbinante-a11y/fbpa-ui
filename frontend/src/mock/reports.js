// Mock reports data for Opscale Audit IQ frontend
const reports = {
  monthlySummary: [
    { month: 'January', invoices: 1050, exceptions: 78, savings: 10250.50 },
    { month: 'February', invoices: 1247, exceptions: 89, savings: 12450.75 },
  ],
  exceptionBreakdown: [
    { reason: 'Rate Mismatch', count: 34, percentage: 38.2 },
    { reason: 'Duplicate Invoice', count: 28, percentage: 31.5 },
    { reason: 'Invalid Accessorials', count: 15, percentage: 16.9 },
    { reason: 'Other', count: 12, percentage: 13.4 },
  ],
  statusDistribution: [
    { status: 'Audited', count: 645, percentage: 51.6 },
    { status: 'Pending', count: 412, percentage: 33.0 },
    { status: 'Exception', count: 190, percentage: 15.2 },
  ],
  topSavingsCarriers: [
    { carrier: 'FastShip', total: 2450.75 },
    { carrier: 'Oceanic', total: 1980.50 },
    { carrier: 'RailMax', total: 1750.25 },
    { carrier: 'AirLogistics', total: 1520.10 },
  ],
  savingsTrend: [
    { date: 'Week 1', savings: 2250 },
    { date: 'Week 2', savings: 3125 },
    { date: 'Week 3', savings: 2850 },
    { date: 'Week 4', savings: 4225 },
  ],
  exceptionTrend: [
    { date: 'Week 1', exceptions: 18 },
    { date: 'Week 2', exceptions: 22 },
    { date: 'Week 3', exceptions: 20 },
    { date: 'Week 4', exceptions: 27 },
  ],
  categoryDrilldown: [
    {
      category: 'Billing Errors',
      summary: 'Incorrect billed amounts and mismatched charges against contracted rates.',
      kpis: [
        { label: 'Findings', value: 234, note: 'Last 30 days' },
        { label: 'Recovery', value: 4825.5, format: 'currency', note: 'Recovered value' },
        { label: 'Avg Resolution (days)', value: 6.2, note: 'Target <= 7' },
        { label: 'Dispute Rate', value: 12.4, format: 'percent', note: 'Of findings' },
      ],
      trend: [
        { period: 'W1', findings: 48, recovery: 980 },
        { period: 'W2', findings: 62, recovery: 1180 },
        { period: 'W3', findings: 54, recovery: 1040 },
        { period: 'W4', findings: 70, recovery: 1625 },
      ],
      customers: [
        { customer: 'MetroMart', findings: 58, recovery: 1240 },
        { customer: 'Nordex', findings: 46, recovery: 980 },
        { customer: 'Atlas Foods', findings: 38, recovery: 760 },
        { customer: 'BluePeak', findings: 32, recovery: 640 },
      ],
      causes: [
        { name: 'Contract Rate Mismatch', value: 42 },
        { name: 'Fuel Surcharge Error', value: 36 },
        { name: 'Duplicate Charges', value: 28 },
        { name: 'Accessorial Overbill', value: 18 },
      ],
    },
    {
      category: 'Service Level Violations',
      summary: 'Late delivery and service failures tied to carrier SLA performance.',
      kpis: [
        { label: 'Findings', value: 156, note: 'Last 30 days' },
        { label: 'Recovery', value: 2150.0, format: 'currency', note: 'Penalty value' },
        { label: 'Avg Resolution (days)', value: 4.8, note: 'Target <= 5' },
        { label: 'Dispute Rate', value: 9.1, format: 'percent', note: 'Of findings' },
      ],
      trend: [
        { period: 'W1', findings: 32, recovery: 420 },
        { period: 'W2', findings: 40, recovery: 520 },
        { period: 'W3', findings: 36, recovery: 480 },
        { period: 'W4', findings: 48, recovery: 730 },
      ],
      customers: [
        { customer: 'Northwind', findings: 34, recovery: 520 },
        { customer: 'Harbor & Co', findings: 28, recovery: 420 },
        { customer: 'Belltown', findings: 24, recovery: 360 },
        { customer: 'Cresta', findings: 22, recovery: 310 },
      ],
      causes: [
        { name: 'Late Delivery', value: 46 },
        { name: 'Missed Pickup', value: 28 },
        { name: 'Damaged Freight', value: 18 },
        { name: 'Service Failure', value: 12 },
      ],
    },
    {
      category: 'Documentation Issues',
      summary: 'Missing or incorrect paperwork leading to audit delays and exceptions.',
      kpis: [
        { label: 'Findings', value: 89, note: 'Last 30 days' },
        { label: 'Recovery', value: 860.25, format: 'currency', note: 'Recovered value' },
        { label: 'Avg Resolution (days)', value: 3.6, note: 'Target <= 4' },
        { label: 'Dispute Rate', value: 6.7, format: 'percent', note: 'Of findings' },
      ],
      trend: [
        { period: 'W1', findings: 18, recovery: 140 },
        { period: 'W2', findings: 22, recovery: 180 },
        { period: 'W3', findings: 20, recovery: 170 },
        { period: 'W4', findings: 29, recovery: 370 },
      ],
      customers: [
        { customer: 'Summit Supply', findings: 22, recovery: 210 },
        { customer: 'Harbor & Co', findings: 18, recovery: 180 },
        { customer: 'BluePeak', findings: 16, recovery: 150 },
        { customer: 'Atlas Foods', findings: 14, recovery: 140 },
      ],
      causes: [
        { name: 'Missing BOL', value: 34 },
        { name: 'Incorrect Weight', value: 22 },
        { name: 'Signed POD Missing', value: 18 },
        { name: 'Invoice Data Error', value: 15 },
      ],
    },
    {
      category: 'Rate Discrepancies',
      summary: 'Quoted vs billed rate mismatches and incorrect tariff application.',
      kpis: [
        { label: 'Findings', value: 312, note: 'Last 30 days' },
        { label: 'Recovery', value: 3120.75, format: 'currency', note: 'Recovered value' },
        { label: 'Avg Resolution (days)', value: 7.4, note: 'Target <= 7' },
        { label: 'Dispute Rate', value: 15.6, format: 'percent', note: 'Of findings' },
      ],
      trend: [
        { period: 'W1', findings: 64, recovery: 640 },
        { period: 'W2', findings: 74, recovery: 710 },
        { period: 'W3', findings: 78, recovery: 720 },
        { period: 'W4', findings: 96, recovery: 1050 },
      ],
      customers: [
        { customer: 'Nordex', findings: 72, recovery: 740 },
        { customer: 'MetroMart', findings: 64, recovery: 620 },
        { customer: 'Cresta', findings: 52, recovery: 490 },
        { customer: 'Northwind', findings: 48, recovery: 420 },
      ],
      causes: [
        { name: 'Incorrect Tariff', value: 44 },
        { name: 'Lane Exception', value: 34 },
        { name: 'Fuel Index Variance', value: 22 },
        { name: 'Minimum Charge Error', value: 16 },
      ],
    },
  ],
  // Opscale Audit IQ - Freight Bill Payment & Audit Features
  auditMetrics: {
    freightBillAudit: [
      { metric: 'Bills Audited', value: 1247, trend: '+8.5%', status: 'On Target' },
      { metric: 'Accuracy Rate', value: '98.7%', trend: '+0.3%', status: 'Excellent' },
      { metric: 'Compliance Score', value: '94.2%', trend: '-1.2%', status: 'Good' },
      { metric: 'Processing Time (hrs)', value: '2.1', trend: '-0.5', status: 'Improving' },
    ],
    paymentRecovery: [
      { type: 'Over-charges Recovered', amount: 4825.50, percentage: 38.7 },
      { type: 'Duplicate Payments', amount: 2150.00, percentage: 17.2 },
      { type: 'Accessorial Errors', amount: 3120.75, percentage: 25.0 },
      { type: 'Rate Adjustments', amount: 2354.50, percentage: 18.9 },
    ],
    auditFindings: [
      { category: 'Billing Errors', count: 234, severity: 'High', resolution: '92% Resolved' },
      { category: 'Service Level Violations', count: 156, severity: 'Medium', resolution: '78% Resolved' },
      { category: 'Documentation Issues', count: 89, severity: 'Low', resolution: '100% Resolved' },
      { category: 'Rate Discrepancies', count: 312, severity: 'High', resolution: '85% Resolved' },
    ],
    paymentProcessing: [
      { status: 'Processed', invoices: 1045, percentage: 83.8, amount: 52400.00 },
      { status: 'Pending Review', invoices: 156, percentage: 12.5, amount: 8125.50 },
      { status: 'Disputed', invoices: 46, percentage: 3.7, amount: 2450.00 },
    ],
  },
};

export default reports;
