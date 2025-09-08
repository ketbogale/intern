const express = require("express");
const router = express.Router();
const { login } = require("../controllers/loginController");

router.post("/login", login);

// Check authentication status
router.get("/auth/status", (req, res) => {
  // Session check
  
  if (req.session && req.session.user) {
    res.json({
      isAuthenticated: true,
      user: {
        id: req.session.user.id,
        username: req.session.user.username,
        role: req.session.user.role
      }
    });
  } else {
    res.json({
      isAuthenticated: false,
      user: null
    });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  // Logout requested
  
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      // Session destroyed and cookie cleared
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } else {
    // No session to destroy
    res.json({ success: true, message: 'No active session' });
  }
});

module.exports = router;
