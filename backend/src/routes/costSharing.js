const express = require('express');
const router = express.Router();
const {
  getCostSharingStudents,
  recordPayment,
  getStudentPayments,
  getMonthlyPaymentSummary,
  updatePaymentStatus
} = require('../controllers/costSharingController');

// Get all cost-sharing students
router.get('/students', getCostSharingStudents);

// Record payment for cost-sharing student
router.post('/payment', recordPayment);

// Get payment history for a specific student
router.get('/payments/:studentId', getStudentPayments);

// Get monthly payment summary
router.get('/summary', getMonthlyPaymentSummary);

// Update payment status
router.patch('/payment/:paymentId', updatePaymentStatus);

module.exports = router;
