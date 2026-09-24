// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  variantId: {
    type: String,
    required: true
  },
  variantLabel: {
    type: String,
    required: true
  },
  weight: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1']
  },
  imageUrl: {
    type: String,
    default: ''
  }
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [orderItemSchema],
      validate: [
        (val) => val.length > 0,
        'An order must contain at least one item.'
      ]
    },

    // Bakery Domain Customizations
    customizations: {
      cakeMessage: {
        type: String,
        trim: true,
        maxlength: [50, 'Cake inscription cannot exceed 50 characters'],
        default: ''
      },
      greetingCardMessage: {
        type: String,
        trim: true,
        maxlength: [200, 'Greeting card message cannot exceed 200 characters'],
        default: ''
      },
      dietaryNote: {
        type: String,
        trim: true,
        default: ''
      }
    },

    // Fulfillment & Time-Slot Logistics
    fulfillment: {
      method: {
        type: String,
        enum: ['delivery', 'pickup'],
        default: 'delivery'
      },
      deliveryDate: {
        type: Date,
        required: [true, 'Please provide scheduled delivery/pickup date']
      },
      timeSlot: {
        type: String,
        enum: [
          'morning_10_13',   // 10:00 AM - 01:00 PM
          'afternoon_14_17', // 02:00 PM - 05:00 PM
          'evening_18_21'    // 06:00 PM - 09:00 PM
        ],
        required: [true, 'Please select a preferred time slot']
      },
      shippingAddress: {
        recipientName: { type: String, default: '' },
        recipientPhone: { type: String, default: '' },
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        pincode: { type: String, default: '' }
      }
    },

    // Audited Financial Breakdown
    pricing: {
      itemsTotal: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true }
    },

    // Payment Tracking
    payment: {
      method: {
        type: String,
        enum: ['cod', 'online_upi', 'card'],
        default: 'cod'
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
      },
      transactionId: {
        type: String,
        default: ''
      }
    },

    // Kitchen & Delivery State Machine
    orderStatus: {
      type: String,
      enum: [
        'placed',
        'confirmed',
        'in_kitchen',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered',
        'cancelled'
      ],
      default: 'placed'
    },
    cancellationReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);