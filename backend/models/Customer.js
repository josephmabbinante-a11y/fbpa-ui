import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  nameLower: { type: String },
  emailLower: { type: String },
  phone: { type: String },
  company: { type: String },
  industry: { type: String },
  taxId: { type: String },
  billingAddress: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook for auto-populating lowercase fields
CustomerSchema.pre('save', function (next) {
  if (this.name && (this.isModified('name') || !this.nameLower)) {
    this.nameLower = this.name.toLowerCase();
  }
  if (this.email && (this.isModified('email') || !this.emailLower)) {
    this.emailLower = this.email.toLowerCase();
  }
  next();
});

// Indexes for Customer
CustomerSchema.index({ nameLower: 1 });
CustomerSchema.index({ emailLower: 1 });

export default mongoose.model('Customer', CustomerSchema);
