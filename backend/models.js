const mongoose = require('mongoose');

// Level-1 User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Simple hashed/plain text for basic MVP testing
  role: { type: String, enum: ['owner', 'customer'], default: 'customer' },
  name: { type: String, default: 'Customer' }
}, { timestamps: true });

// Basic Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['collection', 'artisanal', 'heritage'], required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 10 }
});

// Simple Order Schema
const orderSchema = new mongoose.Schema({
  customerEmail: { type: String, required: true },
  items: Array,
  totalAmount: Number,
  status: { type: String, enum: ['Placed', 'Baking', 'Out for Delivery', 'Delivered'], default: 'Placed' }
}, { timestamps: true });

// Bespoke Inquiry Schema
const bespokeSchema = new mongoose.Schema({
  customerEmail: { type: String, required: true },
  flavor: String,
  tiers: Number,
  weightKg: Number,
  notes: String,
  status: { type: String, default: 'Pending Quote' },
  quotedPrice: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Product: mongoose.model('Product', productSchema),
  Order: mongoose.model('Order', orderSchema),
  Bespoke: mongoose.model('Bespoke', bespokeSchema)
};