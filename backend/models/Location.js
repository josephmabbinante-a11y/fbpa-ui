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
  type: { type: String, enum: ['Warehouse', 'Terminal', 'Customer', 'Other'], default: 'Other' },
  role: { type: String, enum: ['Shipper', 'Consignee', 'Both', 'None'], default: 'None' },
  customerId: { type: String, default: '' },
  customerName: { type: String, default: '' },
  primaryContact: { type: String, default: '' },
  primaryPhone: { type: String, default: '' },
  primaryEmail: { type: String, default: '' },
  operatingHours: { type: String, default: '' },
  notes: { type: String, default: '' },
  appointmentRequired: { type: Boolean, default: false },
  liftgateRequired: { type: Boolean, default: false },
  insidePickup: { type: Boolean, default: false },
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
