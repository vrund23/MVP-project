// controllers/uploadController.js
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

// Helper to wrap Cloudinary upload_stream in a Promise
const uploadToCloudinaryStream = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName || 'bakery_products',
        format: 'webp',               // Automatically convert to lightweight WebP
        transformation: [
          { width: 1000, height: 1000, crop: 'limit', quality: 'auto' } // Optimize quality & dimensions
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// @desc    Upload single image
// @route   POST /api/upload/single
// @access  Private/Owner
exports.uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided.'
      });
    }

    const result = await uploadToCloudinaryStream(req.file.buffer, 'bakery_catalog');

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes
      }
    });
  } catch (error) {
    console.error('Cloudinary Single Upload Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image.',
      error: error.message
    });
  }
};

// @desc    Upload multiple images (up to 5)
// @route   POST /api/upload/multiple
// @access  Private/Owner
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided.'
      });
    }

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinaryStream(file.buffer, 'bakery_catalog')
    );

    const results = await Promise.all(uploadPromises);

    const uploadedData = results.map((result) => ({
      imageUrl: result.secure_url,
      publicId: result.public_id
    }));

    res.status(200).json({
      success: true,
      count: uploadedData.length,
      data: uploadedData
    });
  } catch (error) {
    console.error('Cloudinary Multiple Upload Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload multiple images.',
      error: error.message
    });
  }
};

// @desc    Delete image from Cloudinary by publicId
// @route   DELETE /api/upload/:publicId
// @access  Private/Owner
exports.deleteImage = async (req, res) => {
  try {
    // Cloudinary folder ids contain slashes (e.g. bakery_catalog/xyz)
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'publicId parameter is required.'
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete asset or asset does not exist.',
        result
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted from Cloudinary successfully.'
    });
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image.',
      error: error.message
    });
  }
};