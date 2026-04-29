const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createBill, getBills, getBillById } = require('../controllers/billController');

router.use(protect);

router.post('/', authorize('admin', 'cashier'), createBill);
router.get('/', authorize('admin', 'manager'), getBills);
router.get('/:id', authorize('admin', 'manager'), getBillById);

module.exports = router;
