const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createBill, getBills, getBillById, deleteBill, updateBill } = require('../controllers/billController');

router.use(protect);

router.post('/', authorize('admin', 'cashier'), createBill);
router.get('/', authorize('admin', 'manager'), getBills);
router.get('/:id', authorize('admin', 'manager'), getBillById);

// Admin-only: edit or delete a bill (stock is adjusted automatically)
router.put('/:id', authorize('admin'), updateBill);
router.delete('/:id', authorize('admin'), deleteBill);

module.exports = router;
