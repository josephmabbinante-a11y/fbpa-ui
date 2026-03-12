import mongoose from 'mongoose';

const CarrierSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mcNumber: { type: String, sparse: true, unique: true },
  mcNumberNormalized: { type: String },
  dotNumber: { type: String },
  usdotNumber: { type: String },
  nameLower: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  paymentTerms: { type: String },
  insuranceExpiry: { type: Date },
  taxId: { type: String },
  status: { type: String, enum: ['Active', 'Inactive', 'Alert'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook for auto-populating lowercase fields
CarrierSchema.pre('save', function (next) {
  if (this.name && (this.isModified('name') || !this.nameLower)) {
    this.nameLower = this.name.toLowerCase();
  }
  next();
});

// Indexes for Carrier
CarrierSchema.index({ nameLower: 1 });
CarrierSchema.index({ mcNumberNormalized: 1 });

export default mongoose.model('Carrier', CarrierSchema);
