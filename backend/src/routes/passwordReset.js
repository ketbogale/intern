const express = require("express");
const router = express.Router();
const { 
  requestPasswordReset, 
  verifyResetToken, 
  resetPassword 
} = require("../controllers/passwordResetController");

// Request password reset
router.post("/forgot-password", requestPasswordReset);

// Verify reset token
router.get("/verify-token/:token", verifyResetToken);

// Reset password
router.post("/reset-password", resetPassword);

module.exports = router;
