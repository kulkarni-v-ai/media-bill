const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['polaroid', 'poster', 'sticker'],
      required: [true, 'Category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ── Centralised-stock support ─────────────────────────────────
    // How many physical units one "sale unit" of this item consumes.
    // e.g. "Group of 2 Polaroids" → piecesPerUnit: 2
    piecesPerUnit: {
      type: Number,
      default: 1,
      min: 1,
    },
    // If set, stock checks/deductions use THIS referenced item's stock
    // instead of this item's own stock field.
    // All polaroid variants point to a single "Polaroid Central Stock" master.
    stockRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual: is stock low?
itemSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Virtual: is out of stock?
itemSchema.virtual('isOutOfStock').get(function () {
  return this.stock === 0;
});

itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema);
