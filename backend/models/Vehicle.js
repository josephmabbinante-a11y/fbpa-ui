import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  unitNumber: { type: String },
  type: { type: String, enum: ['Truck', 'Trailer'], default: 'Truck' },
  make: { type: String },
  model: { type: String },
  year: { type: Number },
  vin: { type: String },
  licensePlate: { type: String },
  carrierId: { type: String },
  status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

VehicleSchema.index({ carrierId: 1 });
VehicleSchema.index({ unitNumber: 1 });

export default mongoose.model('Vehicle', VehicleSchema);
