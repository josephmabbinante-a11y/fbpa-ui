import mongoose from 'mongoose';

const DocumentRegistrySchema = new mongoose.Schema({
  // Core identity
  id: { type: String, required: true, unique: true },
  documentType: {
    type: String,
    enum: [
      'carrier_invoice',
      'rate_confirmation',
      'bol',
      'pod',
      'lumper_receipt',
      'carrier_packet',
      'customer_invoice',
      'qr_scan',
      'manual_upload',
      'other',
    ],
    required: true,
  },
  fileName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String },

  // Source tracking — how did this document arrive?
  source: {
    type: String,
    enum: ['qr_code', 'manual_upload', 'email_ingest', 'edi', 'api', 'carrier_portal'],
    required: true,
  },

  // Linkage — tie to load, invoice, exception, carrier
  loadId: { type: String, index: true },
  invoiceId: { type: String, index: true },
  invoiceNumber: { type: String },
  exceptionId: { type: String, index: true },
  carrierId: { type: String, index: true },
  carrierName: { type: String },
  customerId: { type: String },

  // Audit queue status
  auditStatus: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'auto_matched', 'needs_attention'],
    default: 'pending_review',
  },
  auditNotes: { type: String },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },

  // Auto-match results
  autoMatchConfidence: { type: Number, min: 0, max: 100 },
  autoMatchDetails: { type: String },

  // Status confirmation tracking
  confirmsStatus: {
    type: String,
    enum: [
      'POD_RECEIVED',
      'CARRIER_ACCEPTED',
      'CARRIER_SIGNATURE',
      'DELIVERY_CONFIRMED',
      'INVOICE_VERIFIED',
      null,
    ],
    default: null,
  },
  statusConfirmedAt: { type: Date },

  // Metadata
  uploadedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

DocumentRegistrySchema.index({ auditStatus: 1 });
DocumentRegistrySchema.index({ source: 1 });
DocumentRegistrySchema.index({ documentType: 1 });
DocumentRegistrySchema.index({ createdAt: -1 });

export default mongoose.model('DocumentRegistry', DocumentRegistrySchema);
