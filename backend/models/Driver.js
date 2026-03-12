import mongoose from 'mongoose';

const DriverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameLower: { type: String },
  email: { type: String },
  phone: { type: String },
  licenseNumber: { type: String },
  licenseExpiry: { type: Date },
  carrierId: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

DriverSchema.pre('save', function (next) {
  if (this.name && (this.isModified('name') || !this.nameLower)) {
    this.nameLower = this.name.toLowerCase();
  }
  next();
});

DriverSchema.index({ nameLower: 1 });
DriverSchema.index({ carrierId: 1 });

export default mongoose.model('Driver', DriverSchema);
