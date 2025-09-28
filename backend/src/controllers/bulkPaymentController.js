const CostSharingStudent = require('../models/CostSharingStudent');
const CostSharingPayment = require('../models/CostSharingPayment');
const bankTransferService = require('../services/bankTransferService');

// Process bulk payments for all cost-sharing students with bank transfers
const processBulkPayment = async (req, res) => {
  try {
    const { month, year, amount, notes } = req.body;

    if (!month || !year || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Month, year, and amount are required'
      });
    }

    // Get all active cost-sharing students
    const students = await CostSharingStudent.find({ isActive: true });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active cost-sharing students found'
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      duplicates: 0,
      totalAmount: 0,
      details: {
        successful: [],
        failed: [],
        duplicates: []
      }
    };

    // Prepare transfers for bulk processing
    const transfers = [];
    const validStudents = [];

    // First pass: Check for duplicates and prepare transfer data
    for (const student of students) {
      try {
        // Check if payment already exists
        const existingPayment = await CostSharingPayment.findOne({
          studentId: student.id,
          month,
          year
        });

        if (existingPayment) {
          results.duplicates++;
          results.details.duplicates.push({
            studentId: student.id,
            name: student.name,
            reason: 'Payment already exists for this month'
          });
          continue;
        }

        // Prepare transfer data
        transfers.push({
          accountNumber: student.bankAccountNumber,
          amount: amount,
          studentName: student.name,
          studentId: student.id,
          description: `Monthly allowance - ${month}/${year}`
        });

        validStudents.push(student);

      } catch (error) {
        results.failed++;
        results.details.failed.push({
          studentId: student.id,
          name: student.name,
          error: error.message
        });
      }
    }

    // Process bulk bank transfers
    if (transfers.length > 0) {
      const transferResults = await bankTransferService.processBulkTransfers(transfers);

      // Process successful transfers
      for (const successfulTransfer of transferResults.successful) {
        try {
          const student = validStudents.find(s => s.id === successfulTransfer.studentId);
          
          const payment = new CostSharingPayment({
            studentId: successfulTransfer.studentId,
            month,
            year,
            amount: successfulTransfer.amount,
            bankAccountNumber: successfulTransfer.accountNumber,
            transferReference: successfulTransfer.transferReference,
            status: 'completed',
            bankResponse: 'Transfer completed successfully',
            processedBy: req.user?.username || 'admin'
          });

          await payment.save();

          results.successful++;
          results.totalAmount += successfulTransfer.amount;
          results.details.successful.push({
            studentId: successfulTransfer.studentId,
            name: successfulTransfer.studentName,
            amount: successfulTransfer.amount,
            transferReference: successfulTransfer.transferReference,
            transactionId: successfulTransfer.transactionId
          });

        } catch (error) {
          results.failed++;
          results.details.failed.push({
            studentId: successfulTransfer.studentId,
            name: successfulTransfer.studentName,
            error: `Database error: ${error.message}`
          });
        }
      }

      // Process failed transfers
      for (const failedTransfer of transferResults.failed) {
        try {
          const student = validStudents.find(s => s.id === failedTransfer.studentId);
          
          const payment = new CostSharingPayment({
            studentId: failedTransfer.studentId,
            month,
            year,
            amount: failedTransfer.amount,
            bankAccountNumber: failedTransfer.accountNumber,
            transferReference: `FAILED_${Date.now()}`,
            status: 'failed',
            bankResponse: failedTransfer.error,
            processedBy: req.user?.username || 'admin'
          });

          await payment.save();

        } catch (dbError) {
          console.error('Failed to save failed payment record:', dbError);
        }

        results.failed++;
        results.details.failed.push({
          studentId: failedTransfer.studentId,
          name: failedTransfer.studentName,
          error: failedTransfer.error
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk bank transfers processed. ${results.successful} successful, ${results.failed} failed, ${results.duplicates} duplicates`,
      summary: results
    });

  } catch (error) {
    console.error('Error processing bulk payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk payment'
    });
  }
};

// Get bulk payment summary for a specific month
const getBulkPaymentSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Get all cost-sharing students
    const totalStudents = await CostSharingStudent.countDocuments({ isActive: true });

    // Get payments for the specified month/year
    const payments = await CostSharingPayment.find({
      month: currentMonth,
      year: currentYear,
      status: 'paid'
    });

    const paidStudents = payments.length;
    const unpaidStudents = totalStudents - paidStudents;
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Get list of unpaid students
    const paidStudentIds = payments.map(p => p.studentId);
    const unpaidStudentsList = await CostSharingStudent.find({
      isActive: true,
      id: { $nin: paidStudentIds }
    }).select('id name department');

    res.json({
      success: true,
      summary: {
        month: currentMonth,
        year: currentYear,
        totalStudents,
        paidStudents,
        unpaidStudents,
        totalAmount,
        paymentPercentage: totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0
      },
      unpaidStudents: unpaidStudentsList,
      recentPayments: payments.slice(0, 10) // Last 10 payments
    });

  } catch (error) {
    console.error('Error fetching bulk payment summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk payment summary'
    });
  }
};

// Helper function to get month name
function getMonthName(monthNumber) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || 'Unknown';
}

module.exports = {
  processBulkPayment,
  getBulkPaymentSummary
};
