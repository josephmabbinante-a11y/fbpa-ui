import mongoose from 'mongoose';

const StopSchema = new mongoose.Schema({
  stopId: { type: String, required: true },
  sequence: { type: Number, default: 0 },
  type: { type: String, enum: ['Pickup', 'Delivery', 'Cross Dock', 'Transload', 'Inspection', 'Fuel Stop', 'Layover'], default: 'Pickup' },
  locationId: { type: String, default: '' },
  locationName: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  contact: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  scheduledDate: { type: String, default: '' },
  scheduledTime: { type: String, default: '' },
  appointmentEnd: { type: String, default: '' },
  endDate: { type: String, default: '' },
  cargoDescription: { type: String, default: '' },
  referenceNumbers: { type: String, default: '' },
  driverInstructions: { type: String, default: '' },
  notes: { type: String, default: '' },
  actualArrival: { type: String, default: '' },
  actualDeparture: { type: String, default: '' },
  loadingMinutes: { type: String, default: '' },
  showOnCustomerDocs: { type: Boolean, default: true },
  appointmentRequired: { type: Boolean, default: false },
  liftgateRequired: { type: Boolean, default: false },
  hazmatCertified: { type: Boolean, default: false },
}, { _id: false });

const BillingAllocationSchema = new mongoose.Schema({
  partyId: { type: String, required: true },
  partyName: { type: String, default: '' },
  partyType: { type: String, enum: ['customer', 'carrier', 'broker', 'third_party'], default: 'customer' },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  fixedAmount: { type: Number, default: null },
  notes: { type: String, default: '' },
}, { _id: false });

const LoadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  referenceNumber: { type: String },
  source: { type: String, default: 'direct' },
  loadType: { type: String, enum: ['standard', 'auction', 'ancillary'], default: 'standard' },
  freightCategory: { type: String, enum: ['adhoc', 'contracted', 'spot_rate', 'capacity'], default: 'adhoc' },
  parentLoadId: { type: String, default: null },
  ancillaryType: { type: String, enum: ['none', 'detention', 'lumper', 'tonu', 'layover', 'reweigh', 'storage', 'other'], default: 'none' },
  billingAllocations: { type: [BillingAllocationSchema], default: [] },
  status: {
    type: String,
    enum: ['Pending', 'Dispatched', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  origin: { type: String },
  destination: { type: String },
  pickupDate: { type: Date },
  deliveryDate: { type: Date },
  equipment: { type: String, enum: ['Van', 'Reefer', 'Flatbed'], default: 'Van' },
  weight: { type: Number },
  mileage: { type: Number },
  rate: { type: Number },
  customerId: { type: String },
  carrierId: { type: String },
  driverId: { type: String },
  vehicleId: { type: String },
  notes: { type: String },
  statusHistory: [{
    fromStatus: String,
    toStatus: String,
    userId: { type: String, default: 'system' },
    reason: String,
    createdAt: { type: Date, default: Date.now },
  }],
  events: [{
    type: { type: String, default: 'note' },
    message: String,
    actor: { id: String, name: String },
    meta: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  }],
  documents: [{
    id: String,
    type: String,
    fileName: String,
    mimeType: String,
    createdAt: { type: Date, default: Date.now },
  }],
  stops: { type: [StopSchema], default: [] },
  podFileName: { type: String, default: null },
  podUploadedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// id index is handled by unique: true above
LoadSchema.index({ status: 1 });
LoadSchema.index({ customerId: 1 });
LoadSchema.index({ carrierId: 1 });
LoadSchema.index({ parentLoadId: 1 });

export default mongoose.model('Load', LoadSchema);
