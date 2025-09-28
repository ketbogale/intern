const express = require('express');
const router = express.Router();
const { exportPaymentRecords, exportMonthlySummary } = require('../controllers/excelExportController');
const { authenticateToken } = require('../middleware/auth');

// Export payment records to Excel
// Query params: month, year, startDate, endDate
router.get('/payment-records', authenticateToken, exportPaymentRecords);

// Export monthly summary to Excel
// Query params: year
router.get('/monthly-summary', authenticateToken, exportMonthlySummary);

module.exports = router;
