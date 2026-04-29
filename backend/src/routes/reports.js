const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getDailyReport, getDateRangeReport } = require('../controllers/reportController');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/daily', getDailyReport);
router.get('/range', getDateRangeReport);

module.exports = router;
