import { Tenant, TenantFeature, TenantSettings } from './tenant.model.js';
import { AppError } from '../../utils/errorHandler.js';

const DEFAULT_FEATURES = [
  'internal_load_board',
  'bidding',
  'sms_notifications',
  'advanced_rate_logic',
];

export async function createTenant(name) {
  const tenant = new Tenant({ name });
  await tenant.save();

  const settings = new TenantSettings({ tenant_id: tenant._id });
  await settings.save();

  for (const feature of DEFAULT_FEATURES) {
    const tenantFeature = new TenantFeature({ tenant_id: tenant._id, feature_name: feature, enabled: true });
    await tenantFeature.save();
  }

  return tenant;
}

export async function listTenants() {
  return await Tenant.find().sort({ created_at: -1 });
}

export async function getTenant(id) {
  const tenant = await Tenant.findById(id);
  if (!tenant) throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  return tenant;
}

export async function updateTenantStatus(id, status) {
  const tenant = await Tenant.findByIdAndUpdate(id, { status }, { new: true });
  if (!tenant) throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  return tenant;
}
