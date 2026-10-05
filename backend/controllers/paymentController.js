// controllers/paymentController.js
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Order = require('../models/Order');

// @desc    Initiate Razorpay checkout order
// @route   POST /api/payments/create-order
// @access  Private (Customer & Owner)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required to initiate payment.'
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Ownership Authorization
    if (req.user.role !== 'owner' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this order.'
      });
    }

    if (order.payment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order is already paid.'
      });
    }

    // Razorpay processes INR in paise (₹1 = 100 paise)
    const amountInPaise = Math.round(order.pricing.totalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${order._id.toString().slice(-8)}`,
      notes: {
        orderId: order._id.toString(),
        customerEmail: req.user.email
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        internalOrderId: order._id
      }
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment gateway order.',
      error: error.message
    });
  }
};

// @desc    Verify payment cryptographic signature
// @route   POST /api/payments/verify
// @access  Private (Customer & Owner)
exports.verifyPayment = async (req, res) => {
  try {
    const {
      internalOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!internalOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete payment verification parameters.'
      });
    }

    // Mathematical HMAC SHA-256 Signature Verification:
    // signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid cryptographic signature.'
      });
    }

    // Update internal Order record
    const order = await Order.findById(internalOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Associated order not found.'
      });
    }

    order.payment.status = 'paid';
    order.payment.transactionId = razorpay_payment_id;
    order.payment.method = 'online_upi';
    order.orderStatus = 'confirmed'; // Automatically advance status to confirmed upon successful payment

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Order confirmed.',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during payment verification.',
      error: error.message
    });
  }
};