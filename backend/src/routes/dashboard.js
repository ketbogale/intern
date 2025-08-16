const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// GET /api/dashboard/export - Export attendance data as CSV
router.get('/export', dashboardController.exportAttendanceData);

module.exports = router;
