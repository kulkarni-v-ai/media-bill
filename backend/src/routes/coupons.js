const express = require('express');
const router = express.Router();
const { generateCoupon, validateCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/generate', protect, authorize('admin', 'manager', 'cashier'), generateCoupon);
router.get('/validate/:code', protect, authorize('admin', 'manager', 'cashier'), validateCoupon);

module.exports = router;
