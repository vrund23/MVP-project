const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  variantId: {
    type: String,
    required: [true, 'Variant ID is required'],
    trim: true
  },
  subtype: {
    type: String,
    required: [true, 'Subtype is required'],
    trim: true
  },
  label: {
    type: String,
    required: [true, 'Variant display label is required'],
    trim: true
  },
  weight: {
    type: String,
    required: [true, 'Weight string is required'],
    trim: true
  },
  servings: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock count is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  }
});

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      index: true
    },
    // Primary Storefront Pillar
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['cakes', 'chocolates', 'hampers'],
        message: '{VALUE} is not a valid storefront category'
      },
      index: true
    },
    // On-Page Sub-Filter Pills
    subcategory: {
      type: String,
      required: [true, 'Subcategory is required'],
      index: true,
      trim: true
    },
    // Visual Luxury & Social Proof Badge
    badge: {
      type: String,
      default: null,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    cocoaPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    cakeLevels: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    dietaryTags: {
      type: [String],
      enum: ['eggless', 'gluten-free', 'vegan', 'nut-free'],
      default: ['eggless']
    },
    packagingType: {
      type: String,
      default: null
    },
    itemsIncluded: {
      type: [String],
      default: []
    },
    storageInstructions: {
      type: String,
      default: 'Store in a cool, dry place away from direct sunlight.'
    },
    shelfLife: {
      type: String,
      required: [true, 'Shelf life duration is required']
    },
    leadTimeHours: {
      type: Number,
      min: 0,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    variants: {
      type: [variantSchema],
      validate: [
        (val) => val.length > 0,
        'A product must have at least one variant'
      ]
    }
  },
  {
    timestamps: true
  }
);

// High-speed compound index for category + subcategory queries
productSchema.index({ category: 1, subcategory: 1, isAvailable: 1 });

module.exports = mongoose.model('Product', productSchema);