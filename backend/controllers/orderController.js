// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Checkout: Validate cart, check lead time, deduct stock, create order
// @route   POST /api/orders
// @access  Private (Customer & Owner)
exports.createOrder = async (req, res) => {
  try {
    const { items, customizations, fulfillment, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add items to checkout.'
      });
    }

    if (!fulfillment || !fulfillment.deliveryDate || !fulfillment.timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Fulfillment date and time slot are required.'
      });
    }

    const requestedDate = new Date(fulfillment.deliveryDate);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery date provided.'
      });
    }

    let calculatedItemsTotal = 0;
    let maxLeadTimeHours = 0;
    const validatedSnapshots = [];
    const stockDeductionQueue = [];

    // 1. Live Database Validation: Price integrity & Stock availability
    for (const item of items) {
      const liveProduct = await Product.findById(item.productId);
      if (!liveProduct) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      // Check lead time
      if (liveProduct.leadTimeHours && liveProduct.leadTimeHours > maxLeadTimeHours) {
        maxLeadTimeHours = liveProduct.leadTimeHours;
      }

      // Locate specific variant
      const variant = liveProduct.variants.find(
        (v) => v.variantId === item.variantId
      );

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Variant '${item.variantId}' does not exist for product '${liveProduct.title}'.`
        });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for ${liveProduct.title} (${variant.label}). In stock: ${variant.stock}`
        });
      }

      const itemTotal = variant.price * item.quantity;
      calculatedItemsTotal += itemTotal;

      validatedSnapshots.push({
        product: liveProduct._id,
        title: liveProduct.title,
        variantId: variant.variantId,
        variantLabel: variant.label,
        weight: variant.weight || '',
        price: variant.price,
        quantity: item.quantity,
        imageUrl: variant.imageUrl || ''
      });

      stockDeductionQueue.push({
        productId: liveProduct._id,
        variantId: variant.variantId,
        quantity: item.quantity
      });
    }

    // 2. Lead Time Enforcement
    const earliestPossibleDate = new Date(Date.now() + maxLeadTimeHours * 60 * 60 * 1000);
    if (requestedDate < earliestPossibleDate) {
      return res.status(400).json({
        success: false,
        message: `Selected date does not meet prep lead-time of ${maxLeadTimeHours} hour(s). Earliest available is: ${earliestPossibleDate.toLocaleString()}`
      });
    }

    // 3. Atomic Stock Decrement ($inc: -qty)
    for (const deduction of stockDeductionQueue) {
      const updateResult = await Product.updateOne(
        {
          _id: deduction.productId,
          'variants.variantId': deduction.variantId,
          'variants.stock': { $gte: deduction.quantity }
        },
        {
          $inc: { 'variants.$.stock': -deduction.quantity }
        }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Inventory changed during checkout. Please review cart and retry.'
        });
      }
    }

    // 4. Calculate Final Pricing
    const deliveryFee = fulfillment.method === 'pickup' ? 0 : 50;
    const finalAmount = calculatedItemsTotal + deliveryFee;

    // 5. Create Order Document
    const order = await Order.create({
      customer: req.user.id,
      items: validatedSnapshots,
      customizations: customizations || {},
      fulfillment,
      pricing: {
        itemsTotal: calculatedItemsTotal,
        deliveryFee,
        totalAmount: finalAmount
      },
      payment: {
        method: paymentMethod || 'cod',
        status: 'pending'
      },
      orderStatus: 'placed'
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: order
    });
  } catch (error) {
    console.error('Order Creation Failure:', error);
    res.status(500).json({
      success: false,
      message: 'Checkout processing failed.',
      error: error.message
    });
  }
};

// @desc    Get order history for logged-in user
// @route   GET /api/orders/my-orders
// @access  Private (Customer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history.',
      error: error.message
    });
  }
};

// @desc    Get single order details by ID
// @route   GET /api/orders/:id
// @access  Private (Owner or Buyer)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // RBAC: Customer can only access their own order
    if (req.user.role !== 'owner' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own orders.'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details.',
      error: error.message
    });
  }
};

// @desc    Get all orders across the store
// @route   GET /api/orders
// @access  Private/Owner
exports.getAllOrders = async (req, res) => {
  try {
    const { status, date } = req.query;
    let filter = {};

    if (status) filter.orderStatus = status;
    if (date) {
      const queryDate = new Date(date);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter['fulfillment.deliveryDate'] = { $gte: queryDate,$lt: nextDay };
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bakery orders.',
      error: error.message
    });
  }
};

// @desc    Advance kitchen order status
// @route   PUT /api/orders/:id/status
// @access  Private/Owner
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const allowedStatuses = [
      'placed',
      'confirmed',
      'in_kitchen',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ];

    if (orderStatus && !allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: '${orderStatus}'. Allowed: ${allowedStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.payment.status = paymentStatus;

    const updated = await order.save();

    res.status(200).json({
      success: true,
      message: `Order transitioned to '${updated.orderStatus}'.`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
      error: error.message
    });
  }
};

// @desc    Cancel order & restock inventory
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customer or Owner)
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Restrict authorization
    if (req.user.role !== 'owner' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this order.'
      });
    }

    // Cancellation guard: Can't cancel if already being baked or out for delivery
    if (['in_kitchen', 'out_for_delivery', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order currently '${order.orderStatus}'. Please contact bakery support directly.`
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled.'
      });
    }

    // Restock variants atomically ($inc: +quantity)
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, 'variants.variantId': item.variantId },
        { $inc: { 'variants.$.stock': item.quantity } }
      );
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by user/owner';
    const updated = await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and inventory restocked.',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order.',
      error: error.message
    });
  }
};