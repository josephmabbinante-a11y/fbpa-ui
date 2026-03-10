const invoiceImages = [
  {
    id: 'IMG-1001',
    invoiceId: 'INV-1001',
    fileName: 'inv-1001-scan.pdf',
    uploadedAt: '2026-02-09T13:05:00Z',
    status: 'Verified',
    verification: {
      matchConfidence: 96,
      extractedFields: {
        invoiceId: 'INV-1001',
        amount: 1240.55,
        carrier: 'FedEx',
        invoiceDate: '2026-02-04',
        dueDate: '2026-02-18',
      },
      issues: [],
    },
  },
  {
    id: 'IMG-1002',
    invoiceId: 'INV-1003',
    fileName: 'inv-1003-photo.jpg',
    uploadedAt: '2026-02-09T15:42:00Z',
    status: 'Needs Review',
    verification: {
      matchConfidence: 72,
      extractedFields: {
        invoiceId: 'INV-1003',
        amount: 2195.88,
        carrier: 'XPO',
        invoiceDate: '2026-02-07',
        dueDate: '2026-02-21',
      },
      issues: ['Amount mismatch vs record', 'Carrier name shortened on image'],
    },
  },
];

export default invoiceImages;
