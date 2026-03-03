import bcrypt from 'bcryptjs';
import { User } from './user.model.js';
import { AppError } from '../../utils/errorHandler.js';

export async function createUser({ email, password, role, tenantId }) {
  if (role !== 'SUPER_ADMIN' && !tenantId) {
    throw new AppError('tenant_id required for non-super-admin users', 400, 'VALIDATION_ERROR');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('Email already in use', 409, 'CONFLICT');

  const password_hash = await bcrypt.hash(password, 12);
  const user = new User({
    email: email.toLowerCase(),
    password_hash,
    tenant_id: tenantId || null,
    role
  });
  await user.save();
  return user;
}

export async function listUsers(tenantId) {
  return await User.find({ tenant_id: tenantId }).sort({ created_at: -1 });
}

export async function getUser(id, tenantId) {
  const user = await User.findOne({ _id: id, tenant_id: tenantId });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
}
