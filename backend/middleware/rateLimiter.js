// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// 1. General API Limiter (Public browsing & catalog queries)
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 11 requests per 15 minutes
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// 2. Strict Auth Limiter (Prevents login/registration brute-force)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Account temporarily throttled for 15 minutes.'
  }
});

// 3. Checkout & Payment Limiter (Prevents checkout bot spam & gateway abuse)
exports.checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Max 15 checkout/payment attempts per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many order requests initiated. Please wait 10 minutes before retrying.'
  }
});