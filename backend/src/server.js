const express = require("express");
const path = require("path");
require('dotenv').config();
const session = require("express-session");
const loginRoutes = require("./routes/login");
const attendanceRoutes = require("./routes/attendance");
const dashboardRoutes = require("./routes/dashboard");
const studentRoutes = require('./routes/students');
const staffRoutes = require('./routes/staff');
const settingsRoutes = require('./routes/settings');
const securityRoutes = require('./routes/securityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mongoose = require("mongoose");
const SchedulerService = require("./services/scheduler");
const { verifyEmailService } = require('./services/emailService');
// Replace with your MongoDB URI
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/meal_attendance";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
const app = express();
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: "meal-attendance-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ error: "Authentication required" });
  }
};

// Serve static files with authentication check for attendance.html
app.use(
  express.static(path.join(__dirname, "../../front-end"), {
    setHeaders: (res, path) => {
      if (path.endsWith("attendance.html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);
app.use("/public", express.static(path.join(__dirname, "../public")));

// Protect attendance.html route
app.get("/html/attendance.html", (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, "../../front-end/html/attendance.html"));
  } else {
    res.redirect("/html/login.html");
  }
});

// Root route redirect
app.get("/", (req, res) => {
  if (req.session && req.session.user) {
    res.redirect("/html/attendance.html");
  } else {
    res.redirect("/html/login.html");
  }
});

app.use("/api", loginRoutes);
app.use("/api", attendanceRoutes);
app.use("/api", dashboardRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/admin', adminRoutes);

// Logout route
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Verify email service configuration
  const emailReady = await verifyEmailService();
  if (emailReady) {
    console.log('✅ Email service configured and ready for admin 2FA');
  } else {
    console.log('⚠️  Email service not configured. Admin 2FA will not work.');
    console.log('   Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file');
  }

  // Start the automatic meal database scheduler for EAT timezone
  SchedulerService.startScheduler();
});
