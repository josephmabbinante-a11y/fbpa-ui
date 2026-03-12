import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  loadId: { type: String },
  driverId: { type: String },
  vehicleId: { type: String },
  origin: { type: String },
  destination: { type: String },
  departureDate: { type: Date },
  arrivalDate: { type: Date },
  mileage: { type: Number },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Planned',
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TripSchema.index({ loadId: 1 });
TripSchema.index({ driverId: 1 });
TripSchema.index({ status: 1 });

export default mongoose.model('Trip', TripSchema);
