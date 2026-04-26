const express = require('express');
const router = express.Router();
const { getMonthlyAnalytics, getCategoryAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/monthly', protect, getMonthlyAnalytics);
router.get('/category', protect, getCategoryAnalytics);

module.exports = router;
