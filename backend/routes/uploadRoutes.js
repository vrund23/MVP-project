// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage
} = require('../controllers/uploadController');

const { protect, authorize } = require('../middleware/auth');

// All upload routes are Owner-Only
router.use(protect);
router.use(authorize('owner'));

// Single file upload (field name: "image")
router.post('/single', upload.single('image'), uploadSingleImage);

// Multiple files upload (field name: "images", max 5 files)
router.post('/multiple', upload.array('images', 5), uploadMultipleImages);

// Delete asset
router.delete('/:publicId', deleteImage);

module.exports = router;