const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// GET /api/dashboard/analytics - Get current session analytics
router.get('/dashboard/analytics', dashboardController.getCurrentAnalytics);

// GET /api/dashboard/search - Search students by ID or name
router.get('/dashboard/search', dashboardController.searchStudents);

// GET /api/dashboard/export - Export current attendance data as CSV
router.get('/dashboard/export', dashboardController.exportCurrentAttendance);

// POST /api/dashboard/reset-meals - Manual meal database reset
router.post('/dashboard/reset-meals', dashboardController.resetMealDatabase);

module.exports = router;
