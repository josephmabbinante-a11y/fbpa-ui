import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  unitNumber: { type: String, required: true, unique: true },
  status: { type: String, default: 'active' },
  mpg: Number,
  currentLat: Number,
  currentLng: Number,
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, default: 'active' },
  payType: { type: String, default: 'cpm' },
  payRate: { type: Number, default: 0.6 },
  createdAt: { type: Date, default: Date.now },
});

const TripSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  miles: Number,
  fuelGallons: Number,
  revenue: Number,
  fuelCost: Number,
  tollCost: Number,
  startedAt: Date,
  endedAt: Date,
});

export const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export const Driver = mongoose.model('Driver', DriverSchema);
export const Trip = mongoose.model('Trip', TripSchema);
