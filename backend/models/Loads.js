import mongoose from 'mongoose';

const LoadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  referenceNumber: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Dispatched', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  origin: { type: String },
  destination: { type: String },
  pickupDate: { type: Date },
  deliveryDate: { type: Date },
  equipment: { type: String, enum: ['Van', 'Reefer', 'Flatbed'], default: 'Van' },
  weight: { type: Number },
  mileage: { type: Number },
  rate: { type: Number },
  customerId: { type: String },
  carrierId: { type: String },
  driverId: { type: String },
  vehicleId: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// id index is handled by unique: true above
LoadSchema.index({ status: 1 });
LoadSchema.index({ customerId: 1 });
LoadSchema.index({ carrierId: 1 });

export default mongoose.model('Load', LoadSchema);
