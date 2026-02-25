// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
import mongoose from 'mongoose';

// Customer Schema
const customerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  company: String,
  industry: String,
  status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  customerId: { type: String, required: true },
  invoiceNumber: String,
  amount: Number,
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  dueDate: Date,
  issueDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Exception Schema
const exceptionSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  customerId: { type: String, required: true },
  type: String,
  description: String,
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Customer = mongoose.model('Customer', customerSchema);
export const Invoice = mongoose.model('Invoice', invoiceSchema);
export const Exception = mongoose.model('Exception', exceptionSchema);
