const Coupon = require('../models/Coupon');
const crypto = require('crypto');

const generateCoupon = async (req, res) => {
  try {
    const { diceRoll } = req.body; // e.g. "1+1", "2+2"
    
    const offers = {
      '1+1': { type: 'DICE_1_1', description: 'Get Another/Next polaroid at 99/-' },
      '2+2': { type: 'DICE_2_2', description: 'Get a polaroid + customized Polaroid at 229/-' },
      '3+3': { type: 'DICE_3_3', description: 'Get 3 Digital Photos at 99/-' },
      '4+4': { type: 'DICE_4_4', description: 'Pack of 2 Customized Polaroids at ₹222' },
      '5+5': { type: 'DICE_5_5', description: '1 Normal + 1 Digital at ₹125' },
      '6+6': { type: 'DICE_6_6', description: 'Get a polaroid at 99/- in purchase' },
    };

    const offer = offers[diceRoll];
    if (!offer) {
      return res.status(400).json({ message: 'Invalid dice roll' });
    }

    const code = `DICE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    
    const coupon = await Coupon.create({
      code,
      offerType: offer.type,
      description: offer.description,
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ code, isUsed: false });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or already used coupon' });
    }

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateCoupon, validateCoupon };
