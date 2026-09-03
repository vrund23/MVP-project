// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Centralized Token Generator with Safety Fallback
const generateToken = (userId, userRole) => {
  // Uses environment variable, or falls back to a backup string to prevent runtime crash
  const secretKey = process.env.JWT_SECRET || 'fallback_secret_m_chocolates_and_cakes_2026';
  
  return jwt.sign(
    { id: userId, role: userRole },
    secretKey,
    { expiresIn: '30d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, ownerPasscode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    let assignedRole = 'customer';

    if (role === 'owner') {
      const existingOwnerCount = await User.countDocuments({ role: 'owner' });
      if (existingOwnerCount >= 1) {
        return res.status(403).json({
          success: false,
          message: 'Registration rejected: An owner account is already registered.'
        });
      }

      if (ownerPasscode !== (process.env.OWNER_REGISTER_SECRET || 'MonaBakerySecret2026!')) {
        return res.status(403).json({
          success: false,
          message: 'Invalid owner registration passcode.'
        });
      }

      assignedRole = 'owner';
    }

    // 1. Create User in MongoDB
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: assignedRole
    });

    // 2. Sign Token
    const token = generateToken(user._id, user.role);

    // 3. Send Success Response
    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
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

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    // Sign Token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login server error.',
      error: error.message
    });
  }
};

// @desc    Get authenticated user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
      error: error.message
    });
  }
};