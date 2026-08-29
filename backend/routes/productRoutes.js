const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Public Storefront Endpoints
router.get('/', getProducts);
router.get('/:id', getProductById);

// Temporarily Unprotected Admin Routes (Auth middleware removed for testing)
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;