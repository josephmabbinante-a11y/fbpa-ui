import mongoose from 'mongoose';

const AuditResultSchema = new mongoose.Schema({
  load_id: { type: String, required: true },
  invoice_id: { type: String },
  issue: { type: String, required: true },
  overcharge: { type: Number, default: 0 },
  root_cause: { type: String },
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['Open', 'Disputed', 'Resolved'],
    default: 'Open',
  },
  // Vector embedding for AI similarity search
  embedding: { type: [Number], select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AuditResultSchema.index({ load_id: 1 });
AuditResultSchema.index({ invoice_id: 1 });
AuditResultSchema.index({ confidence: 1 });
AuditResultSchema.index({ status: 1 });

export default mongoose.model('AuditResult', AuditResultSchema);
