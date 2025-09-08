const express = require("express");
const path = require("path");
// Suppress dotenv console output
const originalConsoleLog = console.log;
console.log = () => {};
require('dotenv').config();
console.log = originalConsoleLog;
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const loginRoutes = require("./routes/login");
const attendanceRoutes = require("./routes/attendance");
const dashboardRoutes = require("./routes/dashboard");
const studentRoutes = require('./routes/students');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/adminRoutes');
const mealWindowsRoutes = require('./routes/mealWindows');
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
    // MongoDB connected
    
    // Initialize meal windows defaults only if none exist
    const existingWindows = await MealWindow.countDocuments();
    if (existingWindows === 0) {
      await MealWindow.initializeDefaults();
      // Default meal windows initialized
    }
    // Meal windows already exist in database
    
    // Start the scheduler service
    try {
      await SchedulerService.startScheduler();
    } catch (error) {
      // Scheduler startup error - continuing without scheduler
    }
  })
  .catch((err) => {
    // MongoDB connection error - server will not function properly
  });
const app = express();

// Configure trust proxy for rate limiting to work correctly
app.set('trust proxy', 1);

// Security middleware for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// HTTPS redirect middleware for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

app.use(express.json());

// Global rate limiting configuration
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting if X-Forwarded-For header is causing issues
    return req.headers['x-forwarded-for'] && !req.app.get('trust proxy');
  }
});

// Strict rate limiting for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs for sensitive operations
  message: {
    error: "Too many requests for this operation, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting if X-Forwarded-For header is causing issues
    return req.headers['x-forwarded-for'] && !req.app.get('trust proxy');
  }
});

// Apply global rate limiting to all requests (temporarily disabled for debugging)
// app.use(globalLimiter);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
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

app.use("/public", express.static(path.join(__dirname, "../public")));

// Root route - redirect to React app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/index.html"));
});

app.use("/api", loginRoutes);
app.use("/api", attendanceRoutes); // Rate limiting temporarily disabled
app.use("/api", dashboardRoutes);
app.use('/api/students', studentRoutes); // Rate limiting temporarily disabled
app.use('/api/staff', staffRoutes); // Rate limiting temporarily disabled
app.use('/api/admin', adminRoutes); // Rate limiting temporarily disabled
app.use('/api/meal-windows', mealWindowsRoutes);

// Logout route is now handled in login.js routes

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  // Server running on port ${PORT}

  // Verify email service configuration
  const emailReady = await verifyEmailService();
  if (!emailReady) {
    // Email service not configured - Admin 2FA will not work
    // Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file
  }

  // Start the automatic meal database scheduler for EAT timezone
  SchedulerService.startScheduler();
});
