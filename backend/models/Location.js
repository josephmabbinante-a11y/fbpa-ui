import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameLower: { type: String },
  locationCode: { type: String, default: '' },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  county: { type: String, default: '' },
  country: { type: String, default: 'US' },
  timezone: { type: String, default: '' },
  region: { type: String, default: '' },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  formattedAddress: { type: String, default: '' },
  geocodedAt: { type: Date, default: null },
  type: { type: String, enum: ['Warehouse', 'Terminal', 'Customer', 'Other'], default: 'Other' },
  role: { type: String, enum: ['Shipper', 'Consignee', 'Both', 'None'], default: 'None' },
  customerId: { type: String, default: '' },
  customerName: { type: String, default: '' },
  primaryContact: { type: String, default: '' },
  primaryPhone: { type: String, default: '' },
  primaryEmail: { type: String, default: '' },
  operatingHours: { type: String, default: '' },
  notes: { type: String, default: '' },
  email: { type: String, default: '' },
  telephone: { type: String, default: '' },
  ext: { type: String, default: '' },
  website: { type: String, default: '' },
  paymentTerms: { type: String, default: 'Net 30' },
  facilityType: { type: String, default: 'Warehouse' },
  locationType: { type: String, default: 'Pickup' },
  branch: { type: String, default: 'Shared' },
  locationClass: { type: String, default: '' },
  contactName: { type: String, default: '' },
  contactTitle: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  contactFax: { type: String, default: '' },
  appointmentRequired: { type: Boolean, default: false },
  liftgateRequired: { type: Boolean, default: false },
  insidePickup: { type: Boolean, default: false },
  callBeforePickupDelivery: { type: Boolean, default: false },
  hazmatCertified: { type: Boolean, default: false },
  temperatureControlled: { type: Boolean, default: false },
  equipmentTypes: { type: [String], default: [] },
  lanes: { type: String, default: '' },
  preferredRegions: { type: String, default: '' },
  dockCount: { type: String, default: '' },
  maxTrailerLength: { type: String, default: '' },
  complianceNotes: { type: String, default: '' },
  privateNotes: { type: String, default: '' },
  publicNotes: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

LocationSchema.pre('save', function (next) {
  if (this.name && (this.isModified('name') || !this.nameLower)) {
    this.nameLower = this.name.toLowerCase();
  }
  next();
});

LocationSchema.index({ nameLower: 1 });
LocationSchema.index({ type: 1 });
LocationSchema.index({ locationCode: 1 });
LocationSchema.index({ customerId: 1 });
LocationSchema.index({ role: 1 });

export default mongoose.model('Location', LocationSchema);
