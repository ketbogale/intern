const express = require('express');
const router = express.Router();
const {
  processBulkPayment,
  getBulkPaymentSummary
} = require('../controllers/bulkPaymentController');

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

// Process bulk payment for all cost-sharing students
router.post('/process', requireAuth, processBulkPayment);

// Get bulk payment summary for a month
router.get('/summary', requireAuth, getBulkPaymentSummary);

module.exports = router;
