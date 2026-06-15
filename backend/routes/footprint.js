const express = require('express');
const router = express.Router();
const {
  logActivity,
  getHistory,
  getAnalytics,
  deleteLog,
} = require('../controllers/footprintController');
const { validateFootprint } = require('../middleware/validator');
const { protect } = require('../middleware/auth');

// Apply JWT protection middleware to all footprint routes
router.use(protect);

router.post('/', validateFootprint, logActivity);
router.get('/', getHistory);
router.get('/analytics', getAnalytics);
router.delete('/:id', deleteLog);

module.exports = router;
