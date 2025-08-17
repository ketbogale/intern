const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// GET /api/dashboard/analytics - Get current session analytics
router.get('/analytics', dashboardController.getCurrentAnalytics);

// GET /api/dashboard/export - Export current attendance data as CSV
router.get('/export', dashboardController.exportCurrentAttendance);

module.exports = router;
