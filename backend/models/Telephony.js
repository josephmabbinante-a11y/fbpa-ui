import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  direction: { type: String, enum: ['inbound', 'outbound'], required: true },
  to: { type: String },
  toName: { type: String },
  from: { type: String },
  fromName: { type: String },
  loadId: { type: String, default: null },
  status: { type: String, enum: ['ringing', 'in-progress', 'completed', 'no-answer', 'failed', 'busy'], default: 'ringing' },
  duration: { type: Number, default: 0 },
  provider: { type: String, default: 'twilio' },
  providerCallSid: { type: String },
  recordingUrl: { type: String },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  userId: { type: String },
  tenantId: { type: String },
}, { timestamps: true });

callSchema.index({ tenantId: 1, startedAt: -1 });
callSchema.index({ loadId: 1 });

const telephonyConfigSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  provider: { type: String, enum: ['twilio', 'bandwidth', 'vonage', 'telnyx', 'custom'], default: 'twilio' },
  configured: { type: Boolean, default: false },
  // Encrypted credential storage — values are encrypted at rest by the application layer
  credentials: { type: mongoose.Schema.Types.Mixed, default: {} },
  fromNumber: { type: String },
  webhookUrl: { type: String },
}, { timestamps: true });

export const Call = mongoose.model('Call', callSchema);
export const TelephonyConfig = mongoose.model('TelephonyConfig', telephonyConfigSchema);
