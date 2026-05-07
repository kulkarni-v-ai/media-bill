const express = require('express');
const router = express.Router();
const { generateCoupon, validateCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/rbac');

router.post('/generate', protect(['admin', 'manager', 'cashier']), generateCoupon);
router.get('/validate/:code', protect(['admin', 'manager', 'cashier']), validateCoupon);

module.exports = router;
