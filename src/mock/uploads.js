// Mock upload history data for Opscale Audit IQ frontend
const uploadHistory = [
  {
    id: 1,
    fileName: "feb-9-invoices.csv",
    uploadDate: "2026-02-09T14:32:00Z",
    invoiceCount: 42,
    status: "Processed",
    successCount: 42,
    errorCount: 0,
  },
  {
    id: 2,
    fileName: "feb-8-batch.xlsx",
    uploadDate: "2026-02-08T10:15:00Z",
    invoiceCount: 28,
    status: "Processed",
    successCount: 28,
    errorCount: 0,
  },
  {
    id: 3,
    fileName: "feb-7-partial.csv",
    uploadDate: "2026-02-07T09:45:00Z",
    invoiceCount: 35,
    status: "Completed with Warnings",
    successCount: 33,
    errorCount: 2,
  },
  {
    id: 4,
    fileName: "feb-6-invoices.xlsx",
    uploadDate: "2026-02-06T16:20:00Z",
    invoiceCount: 51,
    status: "Processed",
    successCount: 51,
    errorCount: 0,
  },
  {
    id: 5,
    fileName: "feb-5-batch.csv",
    uploadDate: "2026-02-05T11:30:00Z",
    invoiceCount: 38,
    status: "Processed",
    successCount: 38,
    errorCount: 0,
  },
];

export default uploadHistory;
