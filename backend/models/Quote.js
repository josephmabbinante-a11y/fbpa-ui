import mongoose from 'mongoose';

const QuoteSchema = new mongoose.Schema({
  quoteId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, default: '' },
  userName: { type: String, default: '' },

  // Quote source: 'calculator', 'auction', 'rfp', 'manual'
  source: { type: String, enum: ['calculator', 'auction', 'rfp', 'manual'], default: 'calculator' },

  // Customer the quote was sent to
  customerId: { type: String, default: '' },
  customerName: { type: String, default: '' },

  // Lane details
  origin: { type: String, default: '' },
  destination: { type: String, default: '' },
  originZip3: { type: String, default: '' },
  destinationZip3: { type: String, default: '' },
  miles: { type: Number, default: 0 },
  equipmentType: { type: String, default: 'dry_van' },

  // Pricing
  ruleRate: { type: Number, default: null },
  mlRate: { type: Number, default: null },
  recommendedSellRate: { type: Number, default: null },
  carrierCostRate: { type: Number, default: null },
  totalQuoteAmount: { type: Number, default: null },
  margin: { type: Number, default: null },
  confidence: { type: Number, default: null },

  // Auction-specific fields
  auctionCarrier: { type: String, default: '' },
  auctionQuoteId: { type: String, default: '' },
  auctionRate: { type: Number, default: null },

  // Outcome tracking
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'countered'],
    default: 'draft',
  },
  accepted: { type: Boolean, default: null },
  bookedRate: { type: Number, default: null },
  timeToCoverMinutes: { type: Number, default: null },

  // Engine metadata
  engineVersion: { type: String, default: '' },
  featureSchemaVersion: { type: String, default: '' },
  featureSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  predictionSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Associated load
  loadId: { type: String, default: '' },

  // Validity
  validUntil: { type: Date, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

QuoteSchema.index({ userId: 1, createdAt: -1 });
QuoteSchema.index({ customerId: 1, createdAt: -1 });
QuoteSchema.index({ status: 1 });
QuoteSchema.index({ source: 1, createdAt: -1 });
QuoteSchema.index({ originZip3: 1, destinationZip3: 1 });

export default mongoose.model('Quote', QuoteSchema);
