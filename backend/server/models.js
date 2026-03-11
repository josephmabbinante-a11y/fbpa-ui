import mongoose from 'mongoose';

// Load Schema
const loadSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  status: { type: String, required: true },
  customer: { id: String, name: String },
  carrier: { id: String, name: String, assigned: Boolean },
  origin: { city: String, state: String },
  destination: { city: String, state: String },
  equipment: String,
  miles: Number,
  revenue: Number,
  carrierCost: Number,
  margin: Number,
  marginPct: Number,
  targetMarginPct: Number,
  pickupAt: String,
  deliveryAt: String,
  dispatcher: { id: String, name: String },
  updatedAt: String,
  statusHistory: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now },
  updatedAtDb: { type: Date, default: Date.now },
});

// Location Schema
const locationSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  address: String,
  locationTypes: String,
  locationCodes: String,
  savingsRate: String,
  primaryContact: String,
  primaryPhone: String,
  branch: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Load = mongoose.model('Load', loadSchema);
export const Location = mongoose.model('Location', locationSchema);
// User Schema
// Free vs. Paid Features:
// Free: Browse/search loads, basic registration, view load details
// Paid: Advanced analytics, custom reports, integrations, bulk uploads, premium support

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  plainPassword: { type: String },
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  role: { type: String, default: 'user' },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);

// Customer Schema
const customerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: String,
  company: String,
  industry: String,
  taxId: String,
  billingAddress: String,
  nameLower: String,
  emailLower: String,
  status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Carrier Schema
const carrierSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  mcNumber: { type: String, unique: true, sparse: true },
  dotNumber: String,
  email: String,
  phone: String,
  paymentTerms: String,
  insuranceExpiry: Date,
  taxId: String,
  status: { type: String, enum: ['Active', 'Inactive', 'Alert'], default: 'Active' },
  nameLower: String,
  mcNumberNormalized: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  type: { type: String, enum: ['AR', 'AP'], required: true },
  customerId: String,
  carrierId: String,
  customerName: String,
  carrierName: String,
  carrier: String,
  invoiceNumber: String,
  amount: Number,
  accessorials: { type: Number, default: 0 },
  fuelSurcharge: { type: Number, default: 0 },
  contractRate: { type: Number, default: 0 },
  allowedAccessorials: { type: Number, default: 0 },
  expectedFuelSurcharge: { type: Number, default: 0 },
  podAttached: { type: Boolean, default: false },
  podReference: { type: String, default: '' },
  varianceAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid', 'Overdue', 'ExceptionHold', 'ReadyToPay', 'Rejected'],
    default: 'Pending',
  },
  approvalStatus: {
    type: String,
    enum: ['PendingReview', 'ExceptionHold', 'ReadyToPay', 'Approved', 'Rejected', 'Paid'],
    default: 'PendingReview',
  },
  assignedTo: { type: String, default: '' },
  approvedBy: { type: String, default: '' },
  approvedAt: Date,
  paidAt: Date,
  dueDate: Date,
  issueDate: Date,
  paymentTerms: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  });

  // Add indexes to optimize queries
  invoiceSchema.index({ customerId: 1 });
  invoiceSchema.index({ type: 1 });
  invoiceSchema.index({ status: 1 });

// Exception Schema
const exceptionSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  invoiceId: String,
  invoiceNumber: String,
  customerId: String,
  customer: String,
  carrierId: String,
  carrier: String,
  amount: Number,
  type: { type: String, enum: ['financial', 'compliance'], default: 'financial' },
  reason: String,
  description: String,
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
  assignedTo: { type: String, default: '' },
  resolutionNotes: { type: String, default: '' },
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const auditTrailSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  entityType: { type: String, enum: ['invoice', 'exception', 'customer', 'carrier'], required: true },
  entityId: { type: String, required: true },
  action: { type: String, required: true },
  actor: { type: String, default: 'system' },
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

const carrierRateLogSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  carrier: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  originZip: String,
  destinationZip: String,
  weight: Number,
  freightClass: String,
  returnedRate: Number,
  quoteId: String,
  responseTimeMs: Number,
  fuelSurcharge: Number,
  accessorialTotal: Number,
  serviceLevel: String,
  status: { type: String, enum: ['SUCCESS', 'ERROR'], default: 'SUCCESS' },
  errorCode: String,
  requestPayload: mongoose.Schema.Types.Mixed,
  responsePayload: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

carrierRateLogSchema.index({ carrier: 1, createdAt: -1 });
carrierRateLogSchema.index({ originZip: 1, destinationZip: 1, createdAt: -1 });

// Shipment Schema
// NOTE: load_id index is defined inline only to avoid duplicate index warnings.
const shipmentSchema = new mongoose.Schema({
  load_id: { type: String, index: true, required: true },
  status: { type: String, enum: ['Pending', 'In Transit', 'Delivered', 'Cancelled'], default: 'Pending' },
  origin: String,
  destination: String,
  carrier: String,
  customer: String,
  revenue: Number,
  cost: Number,
  margin: Number,
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// CarrierProfile Schema
// NOTE: carrier_mc index is defined inline only to avoid duplicate index warnings.
const carrierProfileSchema = new mongoose.Schema({
  carrier_mc: { type: String, index: true, required: true },
  name: String,
  dotNumber: String,
  email: String,
  phone: String,
  safetyRating: String,
  insuranceExpiry: Date,
  complianceStatus: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
  laneHistory: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Customer = mongoose.model('Customer', customerSchema);
export const Carrier = mongoose.model('Carrier', carrierSchema);
export const Invoice = mongoose.model('Invoice', invoiceSchema);
export const Exception = mongoose.model('Exception', exceptionSchema);
export const AuditTrail = mongoose.model('AuditTrail', auditTrailSchema);
export const CarrierRateLog = mongoose.model('CarrierRateLog', carrierRateLogSchema);
export const Shipment = mongoose.model('Shipment', shipmentSchema);
export const CarrierProfile = mongoose.model('CarrierProfile', carrierProfileSchema);
