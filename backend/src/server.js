const express = require("express");
const path = require("path");
const session = require("express-session");
const loginRoutes = require("./routes/login");
const attendanceRoutes = require("./routes/attendance");
const dashboardRoutes = require("./routes/dashboard");
const studentsRoutes = require("./routes/students");
const staffRoutes = require("./routes/staff");
const mongoose = require("mongoose");
// const SchedulerService = require("./services/scheduler");
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

app.use("/api/login", loginRoutes);
app.use("/api/attendance", requireAuth, attendanceRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/students", requireAuth, studentsRoutes);
app.use("/api/staff", requireAuth, staffRoutes);

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start the automatic meal database scheduler for EAT timezone
  // SchedulerService.startScheduler();
});
