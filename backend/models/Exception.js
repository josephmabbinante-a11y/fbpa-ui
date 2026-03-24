import mongoose from 'mongoose';

const ExceptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceId: { type: String },
  invoiceNumber: { type: String },
  customerId: { type: String },
  customer: { type: String },
  carrierId: { type: String },
  carrier: { type: String },
  amount: { type: Number, default: 0 },
  type: { type: String, enum: ['financial', 'compliance', 'operational'], default: 'financial' },
  reason: { type: String },
  description: { type: String },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'Resolved', 'Closed'], default: 'Open' },

  // Audit queue fields
  auditAction: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto_resolved', null],
    default: 'pending',
  },
  auditedBy: { type: String },
  auditedAt: { type: Date },

  // Document linkage
  documentId: { type: String },
  loadId: { type: String },
  source: {
    type: String,
    enum: ['carrier_invoice', 'qr_scan', 'manual_upload', 'system_rule', 'edi', null],
    default: null,
  },

  // Status confirmation
  confirmsStatus: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for Exception
ExceptionSchema.index({ invoiceId: 1 });
ExceptionSchema.index({ status: 1 });
ExceptionSchema.index({ auditAction: 1 });
ExceptionSchema.index({ loadId: 1 });

export default mongoose.model('Exception', ExceptionSchema);
