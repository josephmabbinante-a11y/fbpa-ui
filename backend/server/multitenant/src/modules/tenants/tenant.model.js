import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, default: 'active' },
  created_at: { type: Date, default: Date.now }
});

export const Tenant = mongoose.model('Tenant', tenantSchema);

const featureSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  feature_name: { type: String, required: true },
  enabled: { type: Boolean, default: true }
});

export const TenantFeature = mongoose.model('TenantFeature', featureSchema);

const settingsSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  // Add more settings fields as needed
});

export const TenantSettings = mongoose.model('TenantSettings', settingsSchema);
