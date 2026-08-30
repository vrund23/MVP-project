// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// ==========================================
// PUBLIC / CUSTOMER ACCESS (Read-Only)
// ==========================================
// Customers & visitors can browse cakes, chocolates, and hampers
router.get('/', getProducts);
router.get('/:id', getProductById);

// ==========================================
// OWNER ONLY ACCESS (Full CRUD)
// ==========================================
// Only users with role === 'owner' can create, update, or soft-delete items
router.post('/', protect, authorize('owner'), createProduct);
router.put('/:id', protect, authorize('owner'), updateProduct);
router.delete('/:id', protect, authorize('owner'), deleteProduct);

module.exports = router;