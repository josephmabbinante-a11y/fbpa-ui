import mongoose from 'mongoose';

const CarrierProfileSchema = new mongoose.Schema({
  carrier_mc: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  safety_score: { type: Number, min: 0, max: 100, default: 0 },
  insurance_valid: { type: Boolean, default: false },
  detention_frequency: { type: Number, min: 0, max: 1, default: 0 },
  audit_error_rate: { type: Number, min: 0, max: 1, default: 0 },
  total_shipments: { type: Number, default: 0 },
  avg_rate_per_mile: { type: Number, default: 0 },
  // Vector embedding for AI similarity search
  embedding: { type: [Number], select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CarrierProfileSchema.index({ detention_frequency: -1 });
CarrierProfileSchema.index({ audit_error_rate: -1 });
CarrierProfileSchema.index({ safety_score: -1 });

export default mongoose.model('CarrierProfile', CarrierProfileSchema);
