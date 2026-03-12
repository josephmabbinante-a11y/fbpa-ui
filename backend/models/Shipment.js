import mongoose from 'mongoose';

const ShipmentSchema = new mongoose.Schema({
  load_id: { type: String, required: true, unique: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  carrier_mc: { type: String },
  equipment: { type: String, default: 'Dry Van' },
  miles: { type: Number },
  weight: { type: Number },
  status: {
    type: String,
    enum: ['Pending', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  pickupDate: { type: Date },
  deliveryDate: { type: Date },
  rate: { type: Number },
  // Vector embedding for AI similarity search
  embedding: { type: [Number], select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ShipmentSchema.index({ carrier_mc: 1 });
ShipmentSchema.index({ origin: 1, destination: 1 });
ShipmentSchema.index({ status: 1 });

export default mongoose.model('Shipment', ShipmentSchema);
