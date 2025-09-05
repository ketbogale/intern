const express = require('express');
const router = express.Router();
const {
  getAdminProfile,
  updateAdminCredentials,
  sendEmailChangeApprovalLink,
  verifyEmailChangeApproval,
  sendAdminApprovalOTP,
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

// Get admin profile (no auth required for header display)
router.get('/profile', getAdminProfile);

// Send admin approval OTP before any credential update
router.post('/send-admin-approval-otp', requireAdmin, sendAdminApprovalOTP);

// Send email change approval link to current admin email
router.post('/send-email-change-approval', requireAdmin, sendEmailChangeApprovalLink);

// Verify email change approval link (no auth required as it's accessed via email link)
router.get('/verify-email-change/:token', verifyEmailChangeApproval);

// Update admin credentials
router.patch('/credentials', requireAdmin, updateAdminCredentials);

module.exports = router;
