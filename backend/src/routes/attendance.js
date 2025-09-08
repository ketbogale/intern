const express = require("express");
const router = express.Router();
const { checkAttendance } = require("../controllers/attendanceController");

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ error: "Authentication required" });
  }
};

router.post("/attendance", requireAuth, checkAttendance);

module.exports = router;
