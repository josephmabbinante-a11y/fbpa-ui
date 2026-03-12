import mongoose from 'mongoose';

const AccessorialItemSchema = new mongoose.Schema({
  type: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ['AR', 'AP'], required: true },
  customerId: { type: String },
  carrierId: { type: String },
  customerName: { type: String },
  carrierName: { type: String },
  carrier: { type: String },
  invoiceNumber: { type: String, required: true },
  load_id: { type: String },
  amount: { type: Number, default: 0 },
  linehaul: { type: Number, default: 0 },
  fuel: { type: Number, default: 0 },
  detention: { type: Number, default: 0 },
  accessorials: { type: Number, default: 0 },
  accessorialItems: { type: [AccessorialItemSchema], default: [] },
  fuelSurcharge: { type: Number, default: 0 },
  contractRate: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
  dueDate: { type: Date },
  issueDate: { type: Date, default: Date.now },
  paymentTerms: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for Invoice
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ carrierId: 1 });
InvoiceSchema.index({ type: 1 });
InvoiceSchema.index({ load_id: 1 });

export default mongoose.model('Invoice', InvoiceSchema);
