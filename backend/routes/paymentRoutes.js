// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();

const {
  createRazorpayOrder,
  verifyPayment
} = require('../controllers/paymentController');

const { protect } = require('../middleware/auth');

// Both routes require an authenticated user
router.use(protect);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);

module.exports = router;