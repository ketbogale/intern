const express = require('express');
const router = express.Router();
const {
  prepareBulkPayment,
  authorizeBulkPayment,
  processBulkPayment,
  getBulkPaymentStatus
} = require('../controllers/cbeBulkPaymentController');

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

// Step 1: Prepare bulk payment file
router.post('/prepare', requireAuth, prepareBulkPayment);

// Step 2: Authorize bulk payment
router.post('/authorize', requireAuth, authorizeBulkPayment);

// Step 3: Process bulk payment
router.post('/process', requireAuth, processBulkPayment);

// Get bulk payment status
router.get('/status/:fileId', requireAuth, getBulkPaymentStatus);

module.exports = router;
