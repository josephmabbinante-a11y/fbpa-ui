import mongoose from 'mongoose';

const loadSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  reference_number: { type: String },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  equipment_type: { type: String },
  pickup_date: { type: Date },
  delivery_date: { type: Date },
  target_rate: { type: Number },
  bidding_enabled: { type: Boolean, default: true },
  status: { type: String, default: 'draft' },
  created_at: { type: Date, default: Date.now }
});

export const Load = mongoose.model('Load', loadSchema);
