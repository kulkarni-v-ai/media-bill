const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    name: { type: String, required: true },       // snapshot
    category: {
      type: String,
      enum: ['polaroid', 'poster', 'sticker'],
      required: true,
    },
    unitPrice: { type: Number, required: true },   // snapshot
    qty: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [lineItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Bill must have at least one item',
      },
    },
    polaroidTotal: { type: Number, default: 0 },
    othersTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    qrUsed: {
      type: String,
      enum: ['QR1', 'QR2', 'QR3', 'QR4'],
      required: [true, 'QR selection is required'],
    },
    isPrinted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
