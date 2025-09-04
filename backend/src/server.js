const express = require("express");
const path = require("path");
require('dotenv').config();
const session = require("express-session");
const loginRoutes = require("./routes/login");
const attendanceRoutes = require("./routes/attendance");
const dashboardRoutes = require("./routes/dashboard");
const studentRoutes = require('./routes/students');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/adminRoutes');
const mealWindowsRoutes = require('./routes/mealWindows');
const databaseRoutes = require('./routes/databaseRoutes');
const mongoose = require("mongoose");
const SchedulerService = require("./services/scheduler");
const { verifyEmailService } = require('./services/emailService');
const MealWindow = require('./models/MealWindows');
// Replace with your MongoDB URI
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/meal_attendance";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    
    // Initialize meal windows defaults only if none exist
    const existingWindows = await MealWindow.countDocuments();
    if (existingWindows === 0) {
      await MealWindow.initializeDefaults();
      console.log("Default meal windows initialized");
    } else {
      console.log("Meal windows already exist in database");
    }
    
    // Start the scheduler service
    try {
      await SchedulerService.startScheduler();
    } catch (error) {
      console.error("Scheduler startup error:", error);
    }
  })
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
      httpOnly: true,
      sameSite: 'lax'
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
app.use('/api/admin', adminRoutes);
app.use('/api/meal-windows', mealWindowsRoutes);
app.use('/api/database', databaseRoutes);

// Logout route is now handled in login.js routes

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
