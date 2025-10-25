
const express = require("express");
const path = require("path");
require('dotenv').config();
const session = require("express-session");
const helmet = require("helmet");
const loginRoutes = require("./routes/login");
const attendanceRoutes = require("./routes/attendance");
const dashboardRoutes = require("./routes/dashboard");
const studentRoutes = require('./routes/students');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/adminRoutes');
const mealWindowsRoutes = require('./routes/mealWindows');
const passwordResetRoutes = require('./routes/passwordReset');
const costSharingRoutes = require('./routes/costSharing');
const studentConversionRoutes = require('./routes/studentConversion');
const bulkPaymentRoutes = require('./routes/bulkPayment');
const cbeBulkPaymentRoutes = require('./routes/cbeBulkPayment');
const fileServingRoutes = require('./routes/fileServing');
const excelExportRoutes = require('./routes/excelExport');
const reportsRoutes = require('./routes/reports');
const mongoose = require("mongoose");
const SchedulerService = require("./services/scheduler");
const { verifyEmailService } = require('./services/emailService');
const MealWindow = require('./models/MealWindows');
// Replace with your MongoDB URI
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/meal_attendance";

 if (process.env.ENABLE_CONSOLE !== 'true') {
   const noop = () => {};
   console.log = noop;
   console.info = noop;
   console.debug = noop;
   console.warn = noop;
   console.error = noop;
 }

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

// Debug: log incoming API requests (method and URL)
app.use((req, res, next) => {
  if (req.url && req.url.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
  }
  next();
});

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

// (Removed unused requireAuth; each route applies its own auth where needed)

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
app.use('/api/auth', passwordResetRoutes);
app.use('/api/cost-sharing', costSharingRoutes);
app.use('/api/student-conversion', studentConversionRoutes);
app.use('/api/bulk-payment', bulkPaymentRoutes);
app.use('/api/cbe-bulk-payment', cbeBulkPaymentRoutes);
app.use('/api/files', fileServingRoutes);
app.use('/api/excel-export', excelExportRoutes);
app.use('/api', reportsRoutes);

// Logout route is now handled in login.js routes

app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Unknown API route: ${req.method} ${req.originalUrl}` });
});

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
