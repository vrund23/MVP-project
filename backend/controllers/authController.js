// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to sign JWT payload
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
};

// @desc    Register new user (Customer or Owner)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, ownerPasscode } = req.body;

    // 1. Check if user with this email already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // 2. Strict One-Owner Enforcement
    let assignedRole = 'customer';

    if (role === 'owner') {
      // Check how many owners already exist in the database
      const existingOwnerCount = await User.countDocuments({ role: 'owner' });

      if (existingOwnerCount >= 1) {
        return res.status(403).json({
          success: false,
          message: 'Registration rejected: An owner account is already registered.'
        });
      }

      // Verify the secret registration passcode from .env
      if (ownerPasscode !== process.env.OWNER_REGISTER_SECRET) {
        return res.status(403).json({
          success: false,
          message: 'Invalid owner registration passcode.'
        });
      }

      assignedRole = 'owner';
    }

    // 3. Create User with enforced role
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: assignedRole
    });

    sendTokenResponse(user, 201, res, 'Account registered successfully.');
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Registration failed.',
      error: error.message
    });
  }
};

// @desc    Authenticate user & return token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Explicitly select password field since select: false is set on schema
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login service error.',
      error: error.message
    });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private (Requires valid JWT)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
      error: error.message
    });
  }
};