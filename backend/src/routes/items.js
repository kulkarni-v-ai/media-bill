const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems,
} = require('../controllers/itemController');

router.use(protect);

router.get('/low-stock', authorize('admin', 'manager', 'cashier'), getLowStockItems);
router.get('/', authorize('admin', 'manager', 'cashier', 'viewer'), getItems);
router.post('/', authorize('admin'), createItem);
router.put('/:id', authorize('admin'), updateItem);
router.delete('/:id', authorize('admin'), deleteItem);

module.exports = router;
