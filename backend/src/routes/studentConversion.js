const express = require('express');
const router = express.Router();
const {
  convertToCostSharing,
  convertToRegular
} = require('../controllers/studentConversionController');

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

// Convert regular student to cost-sharing
router.post('/to-cost-sharing', requireAuth, convertToCostSharing);

// Convert cost-sharing student back to regular cafeteria
router.post('/to-regular', requireAuth, convertToRegular);

module.exports = router;
