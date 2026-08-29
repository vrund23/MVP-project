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
const { protect, requireOwner } = require('../middleware/auth');

// Public Storefront Endpoints (Anyone can view products)
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected Admin Routes (Requires valid JWT & role === 'owner')
router.post('/', protect, requireOwner, createProduct);
router.put('/:id', protect, requireOwner, updateProduct);
router.delete('/:id', protect, requireOwner, deleteProduct);

module.exports = router;