// Mock invoices data for Opscale Audit IQ frontend
const invoices = [
  {
    id: "INV-1001",
    carrier: "FedEx",
    amount: 1240.55,
    status: "Audited",
    exceptions: 2,
    uploadDate: "2026-02-05T08:30:00Z",
    description: "Standard ground shipping",
  },
  {
    id: "INV-1002",
    carrier: "UPS",
    amount: 980.12,
    status: "Pending",
    exceptions: 0,
    uploadDate: "2026-02-06T14:15:00Z",
    description: "Priority overnight",
  },
  {
    id: "INV-1003",
    carrier: "XPO",
    amount: 2145.88,
    status: "Exception",
    exceptions: 4,
    uploadDate: "2026-02-07T10:45:00Z",
    description: "LTL freight",
  },
  {
    id: "INV-1004",
    carrier: "FastShip",
    amount: 1120.45,
    status: "Audited",
    exceptions: 1,
    uploadDate: "2026-02-08T09:20:00Z",
    description: "Standard delivery",
  },
  {
    id: "INV-1005",
    carrier: "Oceanic",
    amount: 3450.75,
    status: "Pending",
    exceptions: 3,
    uploadDate: "2026-02-09T11:00:00Z",
    description: "International ocean freight",
  },
];

export default invoices;
