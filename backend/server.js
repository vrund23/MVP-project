require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { User, Product, Order, Bespoke } = require('./models');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Database Connection
connectDB();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register User (Customer or Owner)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, role, name } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ 
      email, 
      password, 
      role: role || 'customer', 
      name: name || 'User' 
    });

    res.status(201).json({ 
      success: true, 
      user: { email: user.email, role: user.role, name: user.name } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.json({ 
      success: true, 
      user: { email: user.email, role: user.role, name: user.name } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. PRODUCT CATALOG ROUTES
// ==========================================

// Get Products (with optional category filter)
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create Product (Owner action)
app.post('/api/products', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete Product (Owner action)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product removed from catalog successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. ORDER ROUTES
// ==========================================

// Place an Order (Customer)
app.post('/api/orders', async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get Orders for Specific Customer (Customer Profile)
app.get('/api/orders/user/:email', async (req, res) => {
  try {
    const orders = await Order.find({ customerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get All Orders (Owner Live Tracker)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Order Status (Owner action)
app.patch('/api/admin/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. BESPOKE CUSTOM CAKE ROUTES
// ==========================================

// Submit Custom Request (Customer)
app.post('/api/bespoke', async (req, res) => {
  try {
    const bespoke = await Bespoke.create(req.body);
    res.status(201).json({ success: true, bespoke });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get Customer's Own Bespoke Requests (Customer Profile)
app.get('/api/bespoke/user/:email', async (req, res) => {
  try {
    const requests = await Bespoke.find({ customerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get All Bespoke Requests (Owner Queue)
app.get('/api/admin/bespoke', async (req, res) => {
  try {
    const requests = await Bespoke.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Quote Price and Update Bespoke Status (Owner action)
app.patch('/api/admin/bespoke/:id', async (req, res) => {
  try {
    const { quotedPrice, status } = req.body;
    const updated = await Bespoke.findByIdAndUpdate(
      req.params.id,
      { quotedPrice, status },
      { new: true }
    );
    res.json({ success: true, bespoke: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. OWNER CRM & METRICS ROUTES
// ==========================================

// Get All Registered Customers (Owner CRM)
app.get('/api/admin/customers', async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MVP Backend Server running on port ${PORT}`));