const express = require('express');
const router = express.Router();
const {
  updateAdminCredentials,
  getAdminInfo,
  checkAdminCredentials,
  sendAdminOTP,
  verifyAdminOTP,
  resendAdminOTP
} = require('../controllers/adminController');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Admin 2FA routes (no auth required for initial login)
router.post('/check-credentials', checkAdminCredentials);
router.post('/send-otp', sendAdminOTP);
router.post('/verify-otp', verifyAdminOTP);
router.post('/resend-otp', resendAdminOTP);

// Get current admin info
router.get('/info', requireAdmin, getAdminInfo);

// Update admin credentials
router.patch('/credentials', requireAdmin, updateAdminCredentials);

module.exports = router;
