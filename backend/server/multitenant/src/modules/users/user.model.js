import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  role: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
