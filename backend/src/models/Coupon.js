const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    offerType: {
      type: String,
      required: true, // e.g., 'DICE_1_1', 'DICE_2_2', etc.
    },
    description: {
      type: String,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    customerName: {
      type: String,
      trim: true,
    },
    appliedBill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
