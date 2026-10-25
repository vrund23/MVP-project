// routes/orderRoutes.js
const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiter');

// All order operations require valid authentication
router.use(protect);
router.use(checkoutLimiter);

// Customer & Shared Routes
router.post('/', protect, checkoutLimiter, createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', protect, checkoutLimiter, cancelOrder);

// Owner-Only Operational Routes
router.get('/', authorize('owner'), getAllOrders);
router.put('/:id/status', authorize('owner'), updateOrderStatus);

module.exports = router;